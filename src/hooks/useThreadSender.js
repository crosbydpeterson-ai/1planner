import { useCallback, useRef, useState } from 'react';
import { newOperationId, sendThreadMessage } from '@/lib/dmMessages';

/**
 * Send pipeline shared by both inboxes.
 *
 * - One send at a time, guarded by a ref, so rapid taps or Enter cannot submit
 *   the same message twice.
 * - A send is bound to the thread it started from: the result is applied to that
 *   thread by id, so switching conversations mid-send cannot post the reply into
 *   the wrong chat.
 * - The unsent text is kept on failure and shown as a failed bubble on its own
 *   thread with a Retry that reuses the same operation id. Retrying therefore
 *   reconciles with what is already stored instead of blindly duplicating.
 * - Sending state is always released, success or failure.
 */
export default function useThreadSender({ onSaved, onError } = {}) {
  const [pending, setPending] = useState({}); // threadId -> send params
  const [failed, setFailed] = useState({}); // threadId -> send params
  const inFlight = useRef(false);

  const run = useCallback(
    async (params) => {
      const { thread, text } = params || {};
      // 'busy' means another send owns the pipeline: nothing was stored and
      // nothing is displayed, so the caller must keep the text.
      if (!thread?.id || !text?.trim()) return 'empty';
      if (inFlight.current) return 'busy';
      const entry = { ...params, opId: params.opId || newOperationId(), sentAt: new Date().toISOString() };
      inFlight.current = true;
      setPending((p) => ({ ...p, [thread.id]: entry }));
      setFailed((f) => {
        if (!f[thread.id]) return f;
        const next = { ...f };
        delete next[thread.id];
        return next;
      });
      try {
        const result = await sendThreadMessage({
          thread,
          sender: entry.sender,
          senderName: entry.senderName,
          senderProfileId: entry.senderProfileId,
          text: entry.text,
          giftData: entry.giftData || null,
          operationId: entry.opId,
          unreadPatch: entry.unreadPatch,
        });
        onSaved?.(result, thread.id);
        return 'sent';
      } catch (err) {
        console.error('DM send failed', err);
        // The text stays on this thread as a failed bubble with Retry, reusing
        // the same operation id so a retry can never duplicate a stored message.
        setFailed((f) => ({ ...f, [thread.id]: entry }));
        onError?.(err, thread.id);
        return 'failed';
      } finally {
        inFlight.current = false;
        setPending((p) => {
          const next = { ...p };
          delete next[thread.id];
          return next;
        });
      }
    },
    [onSaved, onError]
  );

  const isBusy = Object.keys(pending).length > 0;

  return {
    run,
    retry: (thread) => (failed[thread?.id] ? run(failed[thread.id]) : false),
    pendingFor: (threadId) => pending[threadId] || null,
    failedFor: (threadId) => failed[threadId] || null,
    clearFailed: (threadId) =>
      setFailed((f) => {
        const next = { ...f };
        delete next[threadId];
        return next;
      }),
    isBusy,
  };
}