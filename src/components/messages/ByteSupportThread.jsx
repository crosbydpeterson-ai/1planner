import React, { useEffect, useMemo, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import MessageBubble from './MessageBubble';
import SupportStatusBar from './SupportStatusBar';
import { buildThreadMessages } from '@/lib/dmMessages';

/**
 * The student's Byte conversation.
 *
 * Once a handoff has been sent this is ONE conversation: the student and the
 * support admin talk through DMMessage records, and Byte's AI replies appear in
 * the same timeline. Every message is labelled by author, so Byte and a human
 * admin can never be confused.
 */
export default function ByteSupportThread({
  thread,
  records,
  byteMessages,
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

  const timeline = useMemo(() => {
    const entries = [];
    if (escalated) {
      buildThreadMessages({
        thread,
        records,
        pending,
        failed,
        sender: 'student',
        senderName: currentProfile.username,
      }).forEach((msg) => entries.push({ kind: 'human', msg, at: msg.sentAt }));
    }
    (byteMessages || [])
      .filter((m) => m?.content && !String(m.content).startsWith('[SYSTEM CONTEXT'))
      .forEach((msg) => entries.push({ kind: 'byte', msg, at: msg.created_date || msg.sentAt }));
    return entries
      .map((entry, i) => ({ ...entry, key: entry.msg.__key || entry.msg.id || `entry-${i}` }))
      .sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
  }, [escalated, thread, records, pending, failed, byteMessages, currentProfile.username]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline.length, byteLoading]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SupportStatusBar thread={thread} onReopen={onReopen} busy={reopenBusy} />

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {timeline.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-6">Ask Byte anything about the planner.</p>
        )}

        {timeline.map((entry) => {
          if (entry.kind === 'human') {
            return (
              <MessageBubble
                key={entry.key}
                msg={{ ...entry.msg, senderName: entry.msg.sender === 'student' ? 'You' : entry.msg.senderName }}
                isMe={entry.msg.sender === 'student'}
                state={entry.msg.state}
                onRetry={onRetry}
              />
            );
          }
          const isMine = entry.msg.role === 'user';
          return (
            <div key={entry.key} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
              <div
                className="max-w-[78%] px-3 py-2 text-sm leading-snug"
                style={{
                  borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMine ? 'rgba(59,130,246,0.85)' : 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: isMine ? '1px solid rgba(147,197,253,0.3)' : '1px solid rgba(255,255,255,0.5)',
                  color: isMine ? '#fff' : '#1e293b',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {entry.msg.content}
                <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.65 }}>
                  {isMine ? 'You' : 'Byte · AI'}
                </div>
              </div>
            </div>
          );
        })}

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