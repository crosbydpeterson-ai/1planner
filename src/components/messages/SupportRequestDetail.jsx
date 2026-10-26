import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, Loader2, RotateCcw, Send, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import MessageBubble from './MessageBubble';
import useThreadSender from '@/hooks/useThreadSender';
import { buildThreadMessages } from '@/lib/dmMessages';
import {
  SUPPORT_RESOLVED,
  SUPPORT_WAITING,
  adminMessagePatch,
  assignSupportRequest,
  claimSupportRequest,
  setSupportStatus,
  supportStatusLabel,
  supportStatusOf,
} from '@/lib/byteSupport';

/** One escalated request: summary, shared Byte transcript, the thread and its actions. */
export default function SupportRequestDetail({ thread, records, currentProfile, supportAdmins, onThreadUpdate, onBack }) {
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showTranscript, setShowTranscript] = useState(true);
  const endRef = useRef(null);

  const status = supportStatusOf(thread);
  const sender = useThreadSender({
    onSaved: (result) => onThreadUpdate(result.thread),
    onError: () => setError('That reply was not sent. It is kept below — tap Retry.'),
  });

  const pending = sender.pendingFor(thread.id);
  const failed = sender.failedFor(thread.id);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.id, records, pending, failed]);

  useEffect(() => {
    setReplyText('');
    setError('');
  }, [thread.id]);

  const messages = buildThreadMessages({
    thread,
    records,
    pending,
    failed,
    sender: 'admin',
    senderName: currentProfile.username,
  });

  const runAction = async (fn, failureMessage) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const updated = await fn();
      onThreadUpdate(updated);
    } catch (err) {
      console.error('Support action failed', err);
      setError(failureMessage);
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || sender.isBusy) return;
    setReplyText('');
    const result = await sender.run({
      thread,
      sender: 'admin',
      senderName: currentProfile.username,
      senderProfileId: currentProfile.id,
      text,
      unreadPatch: adminMessagePatch(thread, currentProfile),
    });
    if (result === 'busy') setReplyText((cur) => (cur.trim() ? cur : text));
  };

  const assignedToMe = thread.supportAssignedAdminProfileId === currentProfile.id;

  return (
    <div className="max-w-md mx-auto flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
      <button onClick={onBack} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm mb-3 px-1 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Escalated from Byte
      </button>

      <div className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl flex flex-col flex-1 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 text-sm flex-1 truncate">{thread.studentUsername}</p>
            <span
              className={cn(
                'text-[10px] px-2 py-1 rounded-full border',
                status === SUPPORT_RESOLVED
                  ? 'bg-emerald-500/20 text-emerald-800 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-800 border-amber-500/40'
              )}
            >
              {supportStatusLabel(status)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {thread.supportRequestedAt ? `Sent ${new Date(thread.supportRequestedAt).toLocaleString()}` : 'Sent to support'}
            {thread.supportAssignedAdminUsername ? ` · assigned to ${thread.supportAssignedAdminUsername}` : ' · unassigned'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/25 rounded-xl px-3 py-2">
            <p className="text-[11px] font-semibold text-amber-800 mb-0.5">Student’s summary</p>
            <p className="text-xs text-amber-900 whitespace-pre-wrap">{thread.escalationSummary || '—'}</p>
          </div>

          {thread.supportDetails && (
            <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl px-3 py-2">
              <p className="text-[11px] font-semibold text-slate-600 mb-0.5">Extra details</p>
              <p className="text-xs text-slate-700 whitespace-pre-wrap">{thread.supportDetails}</p>
            </div>
          )}

          {!!(thread.supportTranscript || []).length && (
            <div className="bg-white/40 backdrop-blur-sm border border-white/50 rounded-xl px-3 py-2">
              <button onClick={() => setShowTranscript((v) => !v)} className="w-full flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-600">
                  Shared Byte conversation ({thread.supportTranscript.length})
                </p>
                <span className="text-[11px] text-slate-500">{showTranscript ? 'Hide' : 'Show'}</span>
              </button>
              {showTranscript && (
                <div className="mt-2 space-y-1 max-h-52 overflow-y-auto">
                  {thread.supportTranscript.map((m, i) => (
                    <p key={i} className="text-[11px] text-slate-600">
                      <span className={cn('font-semibold', m.role === 'byte' ? 'text-indigo-600' : 'text-slate-800')}>
                        {m.role === 'byte' ? 'Byte' : 'Student'}:
                      </span>{' '}
                      {m.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 pt-1">
            {messages.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-4">No replies yet. Say hello to {thread.studentUsername}.</p>
            )}
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.__key || i}
                msg={{ ...msg, senderName: msg.sender === 'admin' ? 'You' : msg.senderName }}
                isMe={msg.sender === 'admin'}
                state={msg.state}
                onRetry={() => sender.retry(thread)}
              />
            ))}
            <div ref={endRef} />
          </div>
        </div>

        <div className="px-3 py-2 border-t border-white/20 space-y-2">
          <div className="flex items-center gap-2">
            {!assignedToMe && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => runAction(() => claimSupportRequest(thread, currentProfile), 'Could not claim this request.')}
                className="text-xs h-7"
              >
                <UserCheck className="w-3 h-3 mr-1" /> Claim
              </Button>
            )}
            <Select
              value={thread.supportAssignedAdminProfileId || ''}
              onValueChange={(v) => {
                const name = supportAdmins.usernames?.[v] || 'support admin';
                runAction(() => assignSupportRequest(thread, v, name), 'Could not assign this request.');
              }}
              disabled={busy}
            >
              <SelectTrigger className="h-7 text-xs bg-white/50 border-white/50 w-auto min-w-[7rem]">
                <SelectValue placeholder="Assign to…" />
              </SelectTrigger>
              <SelectContent>
                {supportAdmins.profileIds.map((id) => (
                  <SelectItem key={id} value={id} className="text-xs">
                    {supportAdmins.usernames?.[id] || 'Support admin'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {status === SUPPORT_RESOLVED ? (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => runAction(() => setSupportStatus(thread, SUPPORT_WAITING, currentProfile), 'Could not reopen this request.')}
                className="text-xs h-7 ml-auto"
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Reopen
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => runAction(() => setSupportStatus(thread, SUPPORT_RESOLVED, currentProfile), 'Could not resolve this request.')}
                className="text-xs h-7 ml-auto"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" /> Resolve
              </Button>
            )}
          </div>

          {error && (
            <p className="text-[11px] bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl px-2 py-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <input
              className="flex-1 bg-white/40 backdrop-blur-sm border border-white/40 text-slate-700 placeholder:text-slate-400 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-white/60"
              placeholder={`Reply to ${thread.studentUsername}…`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
              disabled={sender.isBusy}
            />
            <button
              onClick={sendReply}
              disabled={sender.isBusy || !replyText.trim()}
              className="w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0 transition-colors"
            >
              {sender.isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}