import React, { useEffect, useMemo, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import SupportStatusBar from './SupportStatusBar';
import { buildThreadMessages } from '@/lib/dmMessages';
import { SUPPORT_REPLIED } from '@/lib/byteSupport';

/** Who wrote this message, as shown under its bubble. */
function authorLabel(msg) {
  if (msg.sender === 'student') return 'You';
  if (msg.sender === 'bot') return 'Byte · AI';
  if (msg.sender === 'admin') return msg.senderName || 'Support admin';
  return msg.senderName || 'Byte';
}

/**
 * The student's Byte conversation.
 *
 * One timeline: Byte's answers, the student's own messages and any human support
 * admin who has picked the request up all live in this conversation, and every
 * message is labelled by author so Byte and a person are never confused.
 */
export default function ByteSupportThread({
  thread,
  records,
  pending,
  failed,
  currentProfile,
  byteLoading,
  onRetry,
  onReopen,
  reopenBusy,
}) {
  const endRef = useRef(null);
  const escalated = !!thread?.isEscalated;

  const timeline = useMemo(
    () =>
      buildThreadMessages({
        thread,
        records,
        pending,
        failed,
        sender: 'student',
        senderName: currentProfile.username,
      }).map((msg, i) => ({ ...msg, senderName: authorLabel(msg), __key: msg.__key || `msg-${i}` })),
    [thread, records, pending, failed, currentProfile.username]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline.length, byteLoading]);

  // Requests escalated before the status field existed never saved one; if an
  // admin has already answered in the conversation, show it as answered.
  const legacyAnswered = escalated && !thread.supportStatus && timeline.some((m) => m.sender === 'admin');

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SupportStatusBar
        thread={thread}
        onReopen={onReopen}
        busy={reopenBusy}
        statusOverride={legacyAnswered ? SUPPORT_REPLIED : null}
      />

      <p className="px-3 pt-2 text-[10px] leading-snug text-slate-500">
        Byte is 1planner’s AI helper and can’t change an account. If you need a person, your request and the
        relevant part of this conversation can be passed to the app’s authorized support admins.
      </p>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {timeline.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-6">Ask Byte anything about the planner.</p>
        )}

        {timeline.map((msg) => (
          <MessageBubble
            key={msg.__key}
            msg={msg}
            isMe={msg.sender === 'student'}
            state={msg.state}
            onRetry={onRetry}
          />
        ))}

        {byteLoading && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2.5 flex items-center gap-2"
              style={{
                borderRadius: '18px 18px 18px 4px',
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.5)',
              }}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
              <span className="text-xs text-slate-400">Byte is typing…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}