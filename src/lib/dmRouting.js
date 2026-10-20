import { base44 } from '@/api/base44Client';
import { safeRead } from './dataCache';

/**
 * Shared DM recipient routing.
 *
 * Routing is by STABLE ACCOUNT ID: a DMContact's `adminProfileId` holds a
 * UserProfile id and is the authoritative recipient mapping. Contact display
 * names are presentation only — renaming a contact or an account never changes
 * who receives a conversation.
 *
 * These helpers are used by the personal inbox, the unread badge, starting
 * conversations, replying, and the admin contact tooling, so all of them agree.
 */

export const LINK_LINKED = 'linked';
export const LINK_UNLINKED = 'unlinked';
export const LINK_LEGACY = 'legacy';

export const THREAD_PAGE_SIZE = 100;
const CONTACTS_TTL = 30_000;

let contactsVersion = 0;

/** Drop the cached contact mapping (call after adding/editing/repairing contacts). */
export function invalidateContacts() {
  contactsVersion += 1;
}

/** Cached contact list shared by both inboxes, the unread badge and admin tooling. */
export async function loadContacts() {
  return safeRead(
    `dm:contacts:v${contactsVersion}`,
    () => base44.entities.DMContact.list('-created_date'),
    { ttl: CONTACTS_TTL }
  );
}

export function indexContacts(contacts) {
  return (contacts || []).reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {});
}

/** The linked recipient UserProfile id of a contact, or null when unset. */
export function linkedProfileId(contact) {
  const value = contact?.adminProfileId;
  return value ? String(value) : null;
}

/** Contact ids whose verified recipient is this profile (bots excluded). */
export function recipientContactIds(contacts, myProfileId) {
  if (!myProfileId) return [];
  return (contacts || [])
    .filter((c) => !c.isBot && linkedProfileId(c) === String(myProfileId))
    .map((c) => c.id);
}

/**
 * Owner-only fallback: UNLINKED contacts whose display name equals the owner's
 * username. These have no stable mapping, so the name is the only signal left;
 * the inbox flags them for repair and they are never used for a restricted
 * contact recipient.
 */
export function unlinkedNameMatchContactIds(contacts, myUsername) {
  const target = String(myUsername || '').trim().toLowerCase();
  if (!target) return [];
  return (contacts || [])
    .filter((c) => !c.isBot && !linkedProfileId(c) && String(c.username || '').trim().toLowerCase() === target)
    .map((c) => c.id);
}

/** The contact a profile sends AS — a verified link wins, a name match is the fallback. */
export function senderContact(contacts, profile) {
  const human = (contacts || []).filter((c) => !c.isBot);
  const linked = human.filter((c) => linkedProfileId(c) === String(profile?.id));
  const named = human.filter(
    (c) => String(c.username || '').trim().toLowerCase() === String(profile?.username || '').trim().toLowerCase()
  );
  const pick = (list) => list.find((c) => c.isActive) || list[0] || null;
  return pick(linked) || pick(named);
}

/**
 * Classify a contact's link against the real accounts.
 * LEGACY means adminProfileId is set but is not a UserProfile id (e.g. an old
 * userId value); it is only `resolvable` when exactly one account matches.
 */
export function classifyContactLink(contact, profiles) {
  if (contact?.isBot) return { status: LINK_LINKED, matches: [], bot: true };
  const value = linkedProfileId(contact);
  if (!value) return { status: LINK_UNLINKED, matches: [] };
  const byId = (profiles || []).filter((p) => String(p.id) === value);
  if (byId.length === 1) return { status: LINK_LINKED, matches: byId };
  const byUserId = (profiles || []).filter((p) => p.userId && String(p.userId) === value);
  return { status: LINK_LEGACY, matches: byUserId, resolvable: byUserId.length === 1 };
}

export function linkStatusLabel(link) {
  if (link?.bot) return 'Bot — replies come from Byte';
  if (link?.status === LINK_LINKED) return `Linked to ${link.matches[0]?.username || 'an account'}`;
  if (link?.status === LINK_UNLINKED) return 'Recipient not linked';
  return link?.resolvable ? 'Legacy link — repairable' : 'Legacy link — needs manual repair';
}

// ── thread queries ───────────────────────────────────────────────────────────

function readPage(result) {
  if (Array.isArray(result)) return { items: result, hasMore: false };
  return { items: result?.items || [], hasMore: !!result?.has_more };
}

async function queryThreads(query, limit = THREAD_PAGE_SIZE) {
  return readPage(await base44.entities.DMThread.filter(query, { sort: '-lastMessageAt', limit }));
}

function sortThreads(threads) {
  return [...threads].sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));
}

/**
 * Threads addressed to `myProfileId` as the recipient.
 *
 * Uses targeted queries (by recipient snapshot and by the recipient's contact
 * ids) instead of loading the newest threads globally and filtering by name.
 * `truncated` is reported so incomplete results are visible instead of silent.
 */
export async function loadRecipientThreads({
  myProfileId,
  verifiedContactIds = [],
  fallbackContactIds = [],
}) {
  const wanted = [...new Set([...verifiedContactIds, ...fallbackContactIds])];
  const queries = [queryThreads({ recipientProfileId: myProfileId })];
  if (wanted.length) queries.push(queryThreads({ contactId: { $in: wanted } }));

  const results = await Promise.all(queries);
  const byId = new Map();
  let truncated = false;
  results.forEach((r) => {
    if (r.hasMore) truncated = true;
    r.items.forEach((t) => byId.set(t.id, t));
  });

  const threads = [];
  byId.forEach((t) => {
    // An existing snapshot wins, so reassigning a contact never moves history.
    const isMine = t.recipientProfileId
      ? String(t.recipientProfileId) === String(myProfileId)
      : wanted.includes(t.contactId);
    if (!isMine) return;
    const needsRepair = !t.recipientProfileId && fallbackContactIds.includes(t.contactId);
    threads.push({ ...t, needsRepair });
  });

  return { threads: sortThreads(threads), truncated };
}

/** Threads on the student side of a conversation (targeted by student identity). */
export async function loadStudentThreads(studentProfileId) {
  const { items, hasMore } = await queryThreads({ studentProfileId });
  return { threads: sortThreads(items), truncated: hasMore };
}

/** Existing thread for an exact (student, contact) pair. */
export async function findThread(studentProfileId, contactId) {
  const { items } = await queryThreads({ studentProfileId, contactId }, 5);
  return items[0] || null;
}

// ── thread creation ──────────────────────────────────────────────────────────

/** Verify a contact's link resolves to a real account before trusting it for routing. */
export async function verifyLinkedProfileId(contact) {
  const value = linkedProfileId(contact);
  if (!value) return null;
  const rows = await base44.entities.UserProfile.filter({ id: value });
  return rows.length === 1 ? rows[0].id : null;
}

/**
 * Create a thread for a (student, contact) pair.
 *
 * `recipientProfileId` is snapshotted ONLY from a verified contact link, so
 * reassigning that contact later never transfers this conversation to someone
 * else. Thread creation is separate from saving the first message, so a retry
 * after a failed send reuses this thread instead of creating another empty one.
 */
export async function createThread({ student, contact }) {
  const recipientProfileId = contact?.isBot ? null : await verifyLinkedProfileId(contact);
  return base44.entities.DMThread.create({
    studentProfileId: student.id,
    studentUsername: student.username,
    contactId: contact.id,
    contactUsername: contact.username,
    recipientProfileId,
    messages: [],
    lastMessageAt: new Date().toISOString(),
    hasUnreadAdmin: false,
    hasUnreadStudent: false,
  });
}

/** Get-or-create the (student, contact) thread. */
export async function ensureThread({ student, contact }) {
  const existing = await findThread(student.id, contact.id);
  if (existing) return existing;
  return createThread({ student, contact });
}