import { base44 } from '@/api/base44Client';
import { loadThreadMessages, mergeThreadMessages, newOperationId, sendThreadMessage } from './dmMessages';

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
export async function submitSupportHandoff({ thread, summary, details, reason, transcript, operationId }) {
  if (!thread?.id) throw new Error('No conversation to send');
  if (operationId && thread.supportOperationId === operationId) {
    return { thread, reused: false, alreadyStored: true };
  }

  const reused = isSupportOpen(thread);
  const patch = {
    isEscalated: true,
    escalationSummary: summary,
    supportReason: reason || null,
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

// ── Byte's own handoff ───────────────────────────────────────────────────────

/**
 * Why a conversation needed a person, in the app's own words.
 *
 * A category is never free text: Byte picks one of these keys, and the label
 * below is what the student and the support admin read.
 */
export const SUPPORT_REASONS = {
  human_request: 'They asked for a real person',
  troubleshooting_failed: 'Troubleshooting did not fix it',
  admin_only_action: 'Needs a change only an admin can make',
  reward_problem: 'A reward, purchase or account problem could not be verified',
  uncertain_fix: 'Not safe to fix automatically',
};

export function supportReasonLabel(reason) {
  return SUPPORT_REASONS[reason] || '';
}

/** Keep the newest details only, so an open request never grows without limit. */
export function appendSupportDetails(existing, addition) {
  const first = String(existing || '').trim();
  const next = String(addition || '').trim();
  if (!next) return first || null;
  if (!first) return next;
  if (first.includes(next)) return first;
  return `${first}\n\n${next}`.slice(-1200);
}

/** The conversation as stored, so the shared snapshot is the real thing and not a stale UI copy. */
async function storedConversation(thread) {
  const records = await loadThreadMessages(thread.id);
  return mergeThreadMessages(thread, records);
}

/**
 * Byte's support handoff — the single operation Byte can ask for.
 *
 * This is the SAME service the student's "Talk to an admin" button uses: it writes
 * only the support fields of the conversation it is handed, and it can never pick a
 * student, a recipient, a role or a ticket owner — the recipients stay whoever the
 * app's support-admin setting names, the request stays on the student's own
 * conversation, and the owner is assigned by an admin later.
 *
 * Where the check runs, honestly: in the student's own browser, on their own
 * conversation — exactly the authority the existing button already has, so this
 * adds NO new privilege and is not an admin or privileged endpoint. The platform
 * cannot verify a PIN profile on a server for this app (it does not use the
 * platform login, and backend functions are not on the current plan), so the
 * trusted checks that do exist are: the conversation must belong to the profile
 * passing it, the re-read request below, and the app's own support-admin setting.
 *
 * Returns { status, requestId, supportStatus, thread } where status is
 * 'created' | 'existing' | 'updated' | 'failed'.
 */
export async function byteSubmitSupportRequest({ thread, profile, summary, reason, operationId }) {
  const requestId = thread?.id;
  const fail = (code) => ({ status: 'failed', requestId: requestId || null, error: code, thread: thread || null });
  if (!requestId) return fail('no_conversation');
  // The request must belong to the student who is talking to Byte.
  if (!profile?.id || String(thread.studentProfileId) !== String(profile.id)) return fail('not_this_student');

  const text = String(summary || '').trim().slice(0, 280);
  if (!text) return fail('no_summary');
  const key = SUPPORT_REASONS[reason] ? reason : null;
  const opId = operationId || newHandoffOperationId();

  // Re-read the conversation before deciding: another tab may have opened the
  // request already, and a retry may already have been stored.
  let fresh = thread;
  try {
    const record = await base44.entities.DMThread.get(requestId);
    if (!record?.id) return fail('not_found');
    fresh = record;
  } catch (err) {
    console.error('Could not re-read the conversation before handing it over', err);
    return fail('unreachable');
  }
  if (String(fresh.studentProfileId) !== String(profile.id)) return fail('not_this_student');

  // Exactly this submission is already stored (a repeated call or a retry).
  if (fresh.supportOperationId === opId) {
    return { status: 'existing', requestId, supportStatus: supportStatusOf(fresh) || SUPPORT_WAITING, thread: fresh };
  }

  // One request per conversation: add to the open one instead of opening another.
  if (isSupportOpen(fresh)) {
    const details = appendSupportDetails(fresh.supportDetails, text);
    if (details === (fresh.supportDetails || null) && (fresh.supportReason || null) === key) {
      return { status: 'existing', requestId, supportStatus: supportStatusOf(fresh), thread: fresh };
    }
    const updated = await base44.entities.DMThread.update(requestId, {
      supportStatus: SUPPORT_WAITING,
      supportReason: key || fresh.supportReason || null,
      supportDetails: details,
      supportTranscript: buildSupportTranscript(await storedConversation(fresh)),
      supportResolvedAt: null,
      supportResolvedByUsername: null,
      hasUnreadAdmin: true,
      hasUnreadStudent: false,
    });
    try {
      await sendThreadMessage({
        thread: updated,
        sender: 'system',
        senderName: 'Byte',
        text: `Added to your open support request — status: ${supportStatusLabel(SUPPORT_WAITING)}.`,
        operationId: `${HANDOFF_MESSAGE_PREFIX}:${requestId}:${opId}`,
        unreadPatch: { hasUnreadAdmin: true, hasUnreadStudent: false },
      });
    } catch (err) {
      console.error('Handoff marker message was not stored', err);
    }
    return { status: 'updated', requestId, supportStatus: SUPPORT_WAITING, thread: updated };
  }

  try {
    const result = await submitSupportHandoff({
      thread: fresh,
      summary: text,
      details: null,
      reason: key,
      transcript: buildSupportTranscript(await storedConversation(fresh)),
      operationId: opId,
    });
    return {
      status: 'created',
      requestId,
      supportStatus: supportStatusOf(result.thread) || SUPPORT_WAITING,
      thread: result.thread,
    };
  } catch (err) {
    console.error('Support handoff failed', err);
    // The save may have landed before the failure: look the request up by its
    // operation id instead of submitting again blindly.
    try {
      const after = await base44.entities.DMThread.get(requestId);
      if (after?.supportOperationId === opId || isSupportOpen(after)) {
        return { status: 'existing', requestId, supportStatus: supportStatusOf(after) || SUPPORT_WAITING, thread: after };
      }
    } catch (checkErr) {
      console.error('Could not confirm whether the support request was stored', checkErr);
    }
    return { status: 'failed', requestId, error: 'not_confirmed', thread: fresh };
  }
}

/**
 * Carry out Byte's handoff decision and put the outcome in the conversation.
 *
 * Byte's own explanation goes out first, then the request is stored, and only a
 * stored request is ever described as sent. A failure keeps the conversation and
 * the draft as they are, says the request could not be confirmed, and leaves the
 * student's "Talk to an admin" button as the fallback.
 */
export async function runByteHandoff({ thread, profile, handoff, operationId }) {
  const result = await byteSubmitSupportRequest({
    thread,
    profile,
    summary: handoff?.summary,
    reason: handoff?.reason,
    operationId: operationId || newHandoffOperationId(),
  });

  const outcome =
    result.status === 'created' || result.status === 'updated'
      ? 'Your request has been sent to an admin. Their reply will appear here.'
      : result.status === 'existing'
      ? 'This is the request you already have open with an admin. Their reply will appear here.'
      : 'I could not confirm that your request was sent. Tap “Talk to an admin” to send it, or try again in a moment.';

  const text = [String(handoff?.explanation || '').trim(), outcome].filter(Boolean).join('\n\n');

  try {
    const { message, thread: updated } = await sendThreadMessage({
      thread: result.thread || thread,
      sender: 'bot',
      senderName: 'Byte',
      text,
      operationId: newOperationId('byte'),
      unreadPatch: { hasUnreadStudent: false },
    });
    return { ...result, thread: updated, message };
  } catch (err) {
    console.error('Byte’s handoff message was not saved', err);
    return result;
  }
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