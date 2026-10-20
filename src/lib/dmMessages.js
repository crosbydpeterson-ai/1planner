import { base44 } from '@/api/base44Client';

/**
 * DM message storage and reading.
 *
 * New messages are stored as individual DMMessage records linked to a thread.
 * The old code read a thread's `messages` array, appended, and wrote the whole
 * array back — two people sending at the same time overwrote each other. Each
 * record now carries its own message, so concurrent sends cannot collide.
 *
 * Legacy embedded messages are never rewritten; the reader merges them with the
 * records and deduplicates by operationId, so nothing shows twice.
 */

export const MESSAGE_PAGE_SIZE = 500;

/** Stable id reused across retries so one send is stored once. */
export function newOperationId(prefix = 'dm') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Store one message as its own record.
 *
 * Idempotent by operationId: re-sending after a timeout returns the record that
 * is already stored instead of creating a duplicate. This is at-least-once with
 * dedupe — the platform cannot enforce exactly-once delivery.
 */
export async function storeMessage({
  threadId,
  sender,
  senderName,
  senderProfileId,
  text,
  giftData = null,
  operationId,
}) {
  if (operationId) {
    const found = await base44.entities.DMMessage.filter({ operationId }, { limit: 1 });
    const items = Array.isArray(found) ? found : found?.items || [];
    if (items.length > 0) return { message: items[0], stored: false };
  }
  const message = await base44.entities.DMMessage.create({
    threadId,
    sender,
    senderName: senderName || null,
    senderProfileId: senderProfileId || null,
    text,
    giftData: giftData || null,
    operationId: operationId || null,
    sentAt: new Date().toISOString(),
  });
  return { message, stored: true };
}

/**
 * Best-effort thread summary update (ordering + unread flags).
 *
 * A failure here is logged and reported, but never hides the stored message —
 * the reader picks it up from the message record itself.
 */
export async function touchThreadSummary(thread, patch) {
  try {
    const updated = await base44.entities.DMThread.update(thread.id, patch);
    return { thread: updated, summaryUpdated: true };
  } catch (err) {
    console.error('DM thread summary update failed; message is still stored', err);
    return { thread: { ...thread, ...patch }, summaryUpdated: false };
  }
}

/** Store a message, then refresh the thread summary. */
export async function sendThreadMessage({
  thread,
  sender,
  senderName,
  senderProfileId,
  text,
  giftData = null,
  operationId,
  unreadPatch,
}) {
  const { message, stored } = await storeMessage({
    threadId: thread.id,
    sender,
    senderName,
    senderProfileId,
    text,
    giftData,
    operationId,
  });
  const { thread: updated, summaryUpdated } = await touchThreadSummary(thread, {
    lastMessageAt: message.sentAt || new Date().toISOString(),
    ...(unreadPatch || {}),
  });
  return { message, stored, thread: updated, summaryUpdated };
}

/**
 * A thread's full conversation: legacy embedded messages + individual records,
 * deduplicated by operationId and ordered by sentAt.
 */
export function mergeThreadMessages(thread, records = []) {
  const legacy = (thread?.messages || []).map((m, i) => ({
    ...m,
    __key: m.operationId || `legacy:${thread?.id}:${i}:${m.sentAt || ''}`,
  }));
  const seen = new Set(legacy.map((m) => m.__key));
  const extra = (records || [])
    .filter((r) => !(r.operationId && seen.has(r.operationId)))
    .map((r) => ({
      sender: r.sender,
      senderName: r.senderName,
      text: r.text,
      sentAt: r.sentAt,
      giftData: r.giftData || null,
      operationId: r.operationId || null,
      __key: r.operationId || r.id,
    }));
  return [...legacy, ...extra].sort((a, b) => new Date(a.sentAt || 0) - new Date(b.sentAt || 0));
}

/** Displayed conversation, including this device's in-flight and failed sends. */
export function buildThreadMessages({ thread, records, pending, failed, sender, senderName }) {
  const merged = mergeThreadMessages(thread, records);
  const stamp = new Date().toISOString();
  if (pending) {
    merged.push({
      sender,
      senderName,
      text: pending.text,
      sentAt: pending.sentAt || stamp,
      giftData: pending.giftData || null,
      __key: `pending:${pending.opId}`,
      state: 'sending',
    });
  }
  if (failed) {
    merged.push({
      sender,
      senderName,
      text: failed.text,
      sentAt: failed.sentAt || stamp,
      giftData: failed.giftData || null,
      __key: `failed:${failed.opId}`,
      state: 'failed',
    });
  }
  return merged;
}

/** One bounded query for the visible threads' message records. */
export async function loadMessagesForThreads(threadIds) {
  const ids = (threadIds || []).filter(Boolean);
  if (!ids.length) return { byThread: {}, truncated: false };
  const page = await base44.entities.DMMessage.filter(
    { threadId: { $in: ids } },
    { sort: 'sentAt', limit: MESSAGE_PAGE_SIZE }
  );
  const items = Array.isArray(page) ? page : page?.items || [];
  const truncated = !Array.isArray(page) && !!page?.has_more;
  const byThread = {};
  items.forEach((r) => {
    (byThread[r.threadId] = byThread[r.threadId] || []).push(r);
  });
  return { byThread, truncated };
}

export async function loadThreadMessages(threadId) {
  const { byThread } = await loadMessagesForThreads([threadId]);
  return byThread[threadId] || [];
}

/** Latest real message of a thread (used for list previews). */
export function lastMessageOf(thread, records) {
  const merged = mergeThreadMessages(thread, records);
  return merged[merged.length - 1] || null;
}