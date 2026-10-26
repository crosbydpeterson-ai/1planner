import { base44 } from '@/api/base44Client';
import { sendThreadMessage } from './dmMessages';

/**
 * Byte → human support handoff.
 *
 * The handoff lives on the student's EXISTING Byte conversation (a DMThread
 * whose contact is the Byte bot), so student and support admin talk in the one
 * conversation the student already has open. Every message — the student's, Byte's
 * answers and the admin's replies — is a DMMessage record on that thread.
 *
 * Only the profiles named in the `byte_support_admins` app setting may read or
 * answer these requests — a role that manages events is never included.
 */

export const SUPPORT_ADMINS_KEY = 'byte_support_admins';

export const SUPPORT_WAITING = 'waiting';
export const SUPPORT_REPLIED = 'replied';
export const SUPPORT_RESOLVED = 'resolved';

const HANDOFF_MESSAGE_PREFIX = 'support_handoff';

// ── named support admins ─────────────────────────────────────────────────────

/**
 * The named support admins. A missing or unreadable setting must never break
 * messaging, so a failure just resolves to "nobody is named yet".
 */
export async function loadSupportAdmins() {
  try {
    const rows = await base44.entities.AppSetting.filter({ key: SUPPORT_ADMINS_KEY });
    const setting = rows[0] || null;
    const value = setting?.value || {};
    return {
      setting,
      profileIds: Array.isArray(value.profileIds) ? value.profileIds.map(String) : [],
      usernames: value.usernames || {},
    };
  } catch (err) {
    console.error('Could not load the support admin list', err);
    return { setting: null, profileIds: [], usernames: {} };
  }
}

export async function saveSupportAdmins(setting, profileIds, usernames) {
  const value = { profileIds: (profileIds || []).map(String), usernames: usernames || {} };
  if (setting?.id) return base44.entities.AppSetting.update(setting.id, { value });
  return base44.entities.AppSetting.create({ key: SUPPORT_ADMINS_KEY, value });
}

export function isSupportAdmin(profile, profileIds) {
  return !!profile?.id && (profileIds || []).includes(String(profile.id));
}

// ── status ───────────────────────────────────────────────────────────────────

export function supportStatusOf(thread) {
  if (!thread?.isEscalated) return null;
  return thread.supportStatus || SUPPORT_WAITING;
}

export function isSupportOpen(thread) {
  return supportStatusOf(thread) !== null && supportStatusOf(thread) !== SUPPORT_RESOLVED;
}

export function supportStatusLabel(status) {
  if (status === SUPPORT_REPLIED) return 'Admin replied';
  if (status === SUPPORT_RESOLVED) return 'Resolved';
  return 'Waiting for an admin';
}

/** Thread patch a student message carries: it lands on the request and wakes support. */
export function studentMessagePatch() {
  return {
    hasUnreadAdmin: true,
    hasUnreadStudent: false,
    supportStatus: SUPPORT_WAITING,
    supportResolvedAt: null,
    supportResolvedByUsername: null,
  };
}

/** Thread patch an admin reply carries, claiming the request if nobody had it. */
export function adminMessagePatch(thread, profile) {
  const patch = {
    hasUnreadStudent: true,
    hasUnreadAdmin: false,
    supportStatus: SUPPORT_REPLIED,
  };
  if (!thread?.supportAssignedAdminProfileId && profile?.id) {
    patch.supportAssignedAdminProfileId = profile.id;
    patch.supportAssignedAdminUsername = profile.username;
  }
  return patch;
}

// ── does the student want a human? ───────────────────────────────────────────

const HUMAN_REQUEST_PATTERNS = [
  /\b(real|actual|live|human)\s+(person|admin|agent|support|someone)\b/i,
  /\btalk\s+(to|with)\s+(a|an|the|my)?\s*(admin|human|person|someone|support)\b/i,
  /\b(speak|chat|message)\s+(to|with)\s+(a|an|the)?\s*(admin|human|person|crosby)\b/i,
  /\b(need|want|get)\s+(a|an|the)?\s*(real|actual|human|live)?\s*(admin|person|human|someone)\b/i,
  /\b(can|could)\s+(crosby|a\s+real\s+admin|an\s+admin|a\s+human|someone)\s+help\b/i,
  /\b(escalate|forward)\s+(this|it|my)?\b/i,
  /\bcontact\s+(a|an|the)?\s*(admin|human|support|someone)\b/i,
];

/** Local intent check — no AI call, so it costs nothing and never fails. */
export function looksLikeHumanRequest(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  return HUMAN_REQUEST_PATTERNS.some((re) => re.test(value));
}

// ── the shared transcript ────────────────────────────────────────────────────

/**
 * Text-only snapshot of the student's chat with Byte.
 * Anything without text is dropped and the shared copy is capped, so a long chat
 * cannot bloat the record. The student's own words and Byte's answers are shared;
 * admin replies are not copied here — the admin can read the conversation itself.
 */
export function buildSupportTranscript(messages) {
  return (messages || [])
    .filter((m) => m?.text && (m.sender === 'student' || m.sender === 'bot'))
    .slice(-40)
    .map((m) => ({
      role: m.sender === 'student' ? 'student' : 'byte',
      text: String(m.text).slice(0, 2000),
      sentAt: m.sentAt || new Date().toISOString(),
    }));
}

/** Draft summary from the student's own words, which they can edit before sending. */
export function draftSummary(messages) {
  const mine = (messages || []).filter((m) => m.sender === 'student' && m.text);
  const text = String(mine[mine.length - 1]?.text || '').trim().replace(/\s+/g, ' ');
  return text.length > 280 ? `${text.slice(0, 277)}…` : text;
}

export function newHandoffOperationId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

// ── submitting a request ─────────────────────────────────────────────────────

/**
 * Save the handoff on the student's Byte conversation.
 *
 * Idempotent: the same operationId is never stored twice, and a request that is
 * already open on this conversation is continued instead of duplicated.
 */
export async function submitSupportHandoff({ thread, summary, details, transcript, operationId }) {
  if (!thread?.id) throw new Error('No conversation to send');
  if (operationId && thread.supportOperationId === operationId) {
    return { thread, reused: false, alreadyStored: true };
  }

  const reused = isSupportOpen(thread);
  const patch = {
    isEscalated: true,
    escalationSummary: summary,
    supportDetails: details || null,
    supportTranscript: transcript || [],
    supportStatus: SUPPORT_WAITING,
    supportOperationId: operationId || newHandoffOperationId(),
    supportRequestedAt: thread.supportRequestedAt || new Date().toISOString(),
    supportResolvedAt: null,
    supportResolvedByUsername: null,
    hasUnreadAdmin: true,
    hasUnreadStudent: false,
  };

  const updated = await base44.entities.DMThread.update(thread.id, patch);

  // Visible marker in the shared conversation. Best effort only — the request
  // itself is already saved, and the marker reuses its operation id so a retry
  // cannot store it twice.
  try {
    await sendThreadMessage({
      thread: updated,
      sender: 'system',
      senderName: 'Byte',
      text: reused
        ? 'Your request was updated and sent to the support team.'
        : 'Request sent to the support team — waiting for an admin.',
      operationId: `${HANDOFF_MESSAGE_PREFIX}:${thread.id}:${patch.supportOperationId}`,
      unreadPatch: { hasUnreadAdmin: true, hasUnreadStudent: false },
    });
  } catch (err) {
    console.error('Handoff marker message was not stored', err);
  }

  return { thread: updated, reused, alreadyStored: false };
}

// ── support inbox queries and actions ────────────────────────────────────────

/** Every handoff request, newest first. Targeted query — no full-history read. */
export async function loadSupportThreads(limit = 50) {
  const page = await base44.entities.DMThread.filter(
    { isEscalated: true },
    { sort: '-lastMessageAt', limit }
  );
  const threads = Array.isArray(page) ? page : page?.items || [];
  return { threads, truncated: !Array.isArray(page) && !!page?.has_more };
}

export async function markSupportRead(thread) {
  if (!thread?.hasUnreadAdmin) return thread;
  return base44.entities.DMThread.update(thread.id, { hasUnreadAdmin: false });
}

export async function claimSupportRequest(thread, profile) {
  return base44.entities.DMThread.update(thread.id, {
    supportAssignedAdminProfileId: profile.id,
    supportAssignedAdminUsername: profile.username,
    hasUnreadAdmin: false,
  });
}

/** Hand a request to a named support admin. */
export async function assignSupportRequest(thread, targetProfileId, targetUsername) {
  return base44.entities.DMThread.update(thread.id, {
    supportAssignedAdminProfileId: targetProfileId,
    supportAssignedAdminUsername: targetUsername || null,
  });
}

export async function setSupportStatus(thread, status, profile) {
  const patch = {
    supportStatus: status,
    hasUnreadAdmin: status === SUPPORT_WAITING,
  };
  if (status === SUPPORT_RESOLVED) {
    patch.supportResolvedAt = new Date().toISOString();
    patch.supportResolvedByUsername = profile?.username || null;
    patch.hasUnreadAdmin = false;
  } else {
    patch.supportResolvedAt = null;
    patch.supportResolvedByUsername = null;
  }
  return base44.entities.DMThread.update(thread.id, patch);
}