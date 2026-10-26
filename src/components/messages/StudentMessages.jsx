import React, { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, ChevronLeft, LifeBuoy, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import MessageBubble from './MessageBubble';
import ByteSupportThread from './ByteSupportThread';
import ByteSupportHandoffDialog from './ByteSupportHandoffDialog';
import useThreadSender from '@/hooks/useThreadSender';
import { buildThreadMessages, loadMessagesForThreads, loadThreadMessages, newOperationId, sendThreadMessage } from '@/lib/dmMessages';
import { askByte, byteHistory } from '@/lib/byteAssistant';
import { ensureThread, loadContacts, loadStudentThreads } from '@/lib/dmRouting';
import {
  isSupportOpen,
  loadSupportAdmins,
  looksLikeHumanRequest,
  runByteHandoff,
  setSupportStatus,
  studentMessagePatch,
} from '@/lib/byteSupport';

/** Student side of the messaging system: contacts, conversations and replies. */
export default function StudentMessages({ currentProfile }) {
  const [view, setView] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [records, setRecords] = useState({}); // threadId -> DMMessage[]
  const [activeThread, setActiveThread] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [truncated, setTruncated] = useState(false);
  const [opening, setOpening] = useState(false);
  const [byteLoading, setByteLoading] = useState(false);
  const [byteError, setByteError] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportAdminIds, setSupportAdminIds] = useState([]);
  const [supportBusy, setSupportBusy] = useState(false);
  const endRef = useRef(null);
  const refreshTimer = useRef(null);

  const sender = useThreadSender({
    onSaved: (result, threadId) => {
      setRecords((prev) => ({ ...prev, [threadId]: [...(prev[threadId] || []), result.message] }));
      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, ...result.thread } : t)));
      setActiveThread((prev) => (prev && prev.id === threadId ? { ...prev, ...result.thread } : prev));
      setError(result.summaryUpdated ? '' : 'Sent, but the conversation summary could not be updated.');
    },
    onError: () => setError('That message was not sent. It is kept below — tap Retry.'),
  });

  const loadAll = async () => {
    const [allContacts, mine, admins] = await Promise.all([
      loadContacts(),
      loadStudentThreads(currentProfile.id),
      loadSupportAdmins(),
    ]);
    setSupportAdminIds(admins.profileIds);
    setContacts(allContacts);
    setThreads(mine.threads);
    setTruncated(mine.truncated);
    const { byThread } = await loadMessagesForThreads(mine.threads.map((t) => t.id));
    setRecords(byThread);
    setActiveThread((prev) => (prev ? mine.threads.find((t) => t.id === prev.id) || prev : null));
  };

  useEffect(() => {
    loadAll().catch((err) => {
      console.error('Could not load messages', err);
      setError('Could not load your messages. Pull back and try again.');
    });
    // Only react to changes on this student's conversations.
    const unsub = base44.entities.DMThread.subscribe((event) => {
      const data = event?.data;
      if (data?.studentProfileId && String(data.studentProfileId) !== String(currentProfile.id)) return;
      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        loadAll().catch((err) => console.error('Message refresh failed', err));
      }, 800);
    });
    return () => {
      clearTimeout(refreshTimer.current);
      unsub?.();
    };
  }, [currentProfile.id]);

  const activePending = activeThread ? sender.pendingFor(activeThread.id) : null;
  const activeFailed = activeThread ? sender.failedFor(activeThread.id) : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.id, records, activePending, activeFailed, byteLoading]);

  /** Byte's reply is an ordinary message in this conversation. */
  const saveByteReply = async (thread, text) => {
    try {
      const { message, thread: updated } = await sendThreadMessage({
        thread,
        sender: 'bot',
        senderName: 'Byte',
        text,
        operationId: newOperationId('byte'),
        unreadPatch: { hasUnreadStudent: false },
      });
      setRecords((prev) => ({ ...prev, [thread.id]: [...(prev[thread.id] || []), message] }));
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, ...updated } : t)));
      setActiveThread((prev) => (prev && prev.id === thread.id ? { ...prev, ...updated } : prev));
    } catch (err) {
      console.error('Byte’s reply was not saved', err);
      setByteError('Byte answered, but the reply could not be saved. Please try again.');
    }
  };

  /**
   * One exchange with Byte.
   *
   * The student's message is stored first so it can never be lost, then Byte
   * answers through the platform AI call — which works for a visitor without an
   * account, unlike platform agent conversations. When the exchange belongs to an
   * open support request the reply comes from the admin instead, so Byte stays out
   * of the way.
   */
  const runByteExchange = async (text, { toSupport } = {}) => {
    const thread = activeThread;
    if (!thread?.id) return { status: 'empty' };
    // Composed before sending, so the history excludes the message being answered.
    const history = byteHistory(buildThreadMessages({ thread, records: records[thread.id] }));
    const status = await sender.run({
      thread,
      sender: 'student',
      senderName: currentProfile.username,
      senderProfileId: currentProfile.id,
      text,
      unreadPatch: toSupport ? studentMessagePatch() : { hasUnreadStudent: false },
    });
    if (status !== 'sent' || toSupport) return { status };

    let handedOff = false;
    setByteLoading(true);
    try {
      const { reply, handoff } = await askByte({ profile: currentProfile, history, question: text, thread });
      if (!handoff) {
        await saveByteReply(thread, reply);
      } else {
        // Byte decided this needs a person. The app performs the handoff through the
        // same service the student's own button uses, so Byte's explanation and the
        // confirmation land in this conversation and no second request can open.
        const result = await runByteHandoff({
          thread,
          profile: currentProfile,
          handoff: { ...handoff, explanation: reply },
        });
        handedOff = true;
        const stored = await loadThreadMessages(thread.id);
        setRecords((prev) => ({ ...prev, [thread.id]: stored }));
        setThreads((prev) => prev.map((t) => (t.id === result.thread.id ? { ...t, ...result.thread } : t)));
        setActiveThread((prev) => (prev && prev.id === result.thread.id ? { ...prev, ...result.thread } : prev));
      }
    } catch (err) {
      console.error('Byte could not answer', err);
      setByteError('Byte could not answer that one. Try again, or tap Talk to an admin.');
    } finally {
      setByteLoading(false);
    }
    return { status, handedOff };
  };

  const openThread = async (contact) => {
    setActiveContact(contact);
    setInput('');
    setError('');
    setByteError('');
    setView('thread');
    setOpening(true);
    try {
      let thread = threads.find((t) => t.contactId === contact.id);
      if (!thread) {
        // Thread creation is separate from sending, so a failed first message
        // reuses this thread instead of creating another empty conversation.
        thread = await ensureThread({ student: currentProfile, contact });
        setThreads((prev) => [...prev, thread]);
      }
      setActiveThread(thread);
      if (thread.hasUnreadStudent) {
        const updated = await base44.entities.DMThread.update(thread.id, { hasUnreadStudent: false });
        setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setActiveThread(updated);
      }
      const msgs = await loadThreadMessages(thread.id);
      setRecords((prev) => ({ ...prev, [thread.id]: msgs }));
    } catch (err) {
      console.error('Could not open conversation', err);
      setError('Could not open this conversation. Please try again.');
    } finally {
      setOpening(false);
    }
  };

  const sendMessage = async () => {
    if (sender.isBusy || byteLoading || !activeThread) return;
    const text = input.trim();
    if (!text) return;

    // Once a request is open the main send goes to the support team; Byte stays
    // available behind "Ask Byte" so the two never mix.
    if (activeContact?.isBot && isSupportOpen(activeThread)) {
      setInput('');
      const status = await sender.run({
        thread: activeThread,
        sender: 'student',
        senderName: currentProfile.username,
        senderProfileId: currentProfile.id,
        text,
        unreadPatch: studentMessagePatch(),
      });
      if (status === 'busy') setInput((cur) => (cur.trim() ? cur : text));
      return;
    }

    if (activeContact?.isBot) {
      const toSupport = isSupportOpen(activeThread);
      setInput('');
      setByteError('');
      const { status, handedOff } = await runByteExchange(text, { toSupport });
      if (status === 'busy') setInput((cur) => (cur.trim() ? cur : text));
      // They asked for a human in their own words and Byte has not already passed
      // the conversation on — show the preview so they can send it themselves.
      if (!toSupport && !handedOff && looksLikeHumanRequest(text)) setSupportOpen(true);
      return;
    }

    // Clear only this send's text; anything typed meanwhile is left alone.
    setInput('');
    const status = await sender.run({
      thread: activeThread,
      sender: 'student',
      senderName: currentProfile.username,
      senderProfileId: currentProfile.id,
      text,
      unreadPatch: { hasUnreadAdmin: true, hasUnreadStudent: false },
    });
    // A duplicate tap stored nothing, so the text must not be lost.
    if (status === 'busy') setInput((cur) => (cur.trim() ? cur : text));
  };

  // "Ask Byte": Byte answers without waking the support team, so a student can
  // keep chatting with the AI while their request is open.
  const askByteAgain = async () => {
    const text = input.trim();
    if (!text || byteLoading || sender.isBusy || !activeThread) return;
    setInput('');
    setByteError('');
    const { status } = await runByteExchange(text, { toSupport: false });
    if (status === 'busy') setInput((cur) => (cur.trim() ? cur : text));
  };

  const reopenRequest = async () => {
    if (!activeThread || supportBusy) return;
    setSupportBusy(true);
    setError('');
    try {
      // Reopening keeps the same request and returns it to the support inbox.
      const updated = await setSupportStatus(activeThread, 'waiting', currentProfile);
      setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setActiveThread(updated);
    } catch (err) {
      console.error('Could not reopen the request', err);
      setError('Could not reopen that request. Please try again.');
    } finally {
      setSupportBusy(false);
    }
  };

  const getThread = (contact) => threads.find((t) => t.contactId === contact.id);
  const unread = threads.filter((t) => t.hasUnreadStudent).length;

  const visibleContacts = useMemo(() => {
    const active = contacts.filter((c) => c.isActive);
    // Inactive contacts disappear from new conversations but keep their history.
    const withHistory = contacts.filter((c) => !c.isActive && threads.some((t) => t.contactId === c.id));
    return [...active, ...withHistory];
  }, [contacts, threads]);

  if (view === 'contacts') {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">
          Messages {unread > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>}
        </h2>
        {truncated && (
          <p className="text-[11px] text-slate-500 mb-2 px-1">Showing your most recent conversations only.</p>
        )}
        <div className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl overflow-hidden">
          {visibleContacts.length === 0 && <p className="text-center text-slate-400 text-sm py-10">No contacts yet</p>}
          {visibleContacts.map((contact, i) => {
            const thread = getThread(contact);
            const lastMsg = thread ? buildThreadMessages({ thread, records: records[thread.id] }).at(-1) : null;
            const hasUnread = thread?.hasUnreadStudent;
            return (
              <button
                key={contact.id}
                onClick={() => openThread(contact)}
                className={cn('w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/25 transition-colors text-left', i > 0 && 'border-t border-white/20')}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-white/40 backdrop-blur-sm border border-white/30 flex items-center justify-center text-2xl shadow-lg">
                    {contact.isBot ? '🤖' : contact.emoji}
                  </div>
                  {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={cn('text-sm', hasUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700')}>{contact.username}</p>
                    {thread?.lastMessageAt && <p className="text-[11px] text-slate-400">{new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                  </div>
                  <p className={cn('text-xs truncate', hasUnread ? 'text-blue-600 font-medium' : 'text-slate-400')}>
                    {lastMsg ? `${lastMsg.sender === 'student' ? 'You' : contact.username}: ${lastMsg.text}` : contact.role}
                  </p>
                  {!contact.isActive && <p className="text-[10px] text-amber-600 mt-0.5">Inactive — no new conversations</p>}
                </div>
              </button>
            );
          })}
        </div>
        {error && (
          <p className="mt-3 text-xs text-red-600 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl px-3 py-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </p>
        )}
      </div>
    );
  }

  const messages = activeThread
    ? buildThreadMessages({
        thread: activeThread,
        records: records[activeThread.id],
        pending: activePending,
        failed: activeFailed,
        sender: 'student',
        senderName: currentProfile.username,
      })
    : [];

  return (
    <div className="max-w-md mx-auto flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
      <button
        onClick={() => { setView('contacts'); setActiveThread(null); setActiveContact(null); }}
        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm mb-3 px-1 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Messages
      </button>
      <div className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/20">
          <div className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm border border-white/30 flex items-center justify-center text-xl">{activeContact?.isBot ? '🤖' : activeContact?.emoji}</div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800 text-sm truncate">{activeContact?.username}</p>
            <p className="text-xs text-slate-400">{activeContact?.role}</p>
          </div>
          {activeContact?.isBot && (
            <button
              onClick={() => setSupportOpen(true)}
              disabled={opening || !activeThread}
              className="flex items-center gap-1 text-[11px] font-semibold bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-full transition-colors shrink-0"
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              {isSupportOpen(activeThread) ? 'Update request' : 'Talk to an admin'}
            </button>
          )}
        </div>

        {!activeContact?.isBot && !activeContact?.adminProfileId && (
          <p className="mx-3 mt-2 text-[11px] bg-amber-500/15 backdrop-blur-sm border border-amber-500/30 text-amber-700 rounded-xl px-2 py-1.5">
            This contact isn't linked to an account yet, so replies may not reach anyone until an admin links it.
          </p>
        )}
        {opening && (
          <p className="mx-3 mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Opening conversation…
          </p>
        )}

        {activeContact?.isBot ? (
          <ByteSupportThread
            thread={activeThread}
            records={records[activeThread?.id] || []}
            pending={activePending}
            failed={activeFailed}
            currentProfile={currentProfile}
            byteLoading={byteLoading}
            onRetry={() => sender.retry(activeThread)}
            onReopen={reopenRequest}
            reopenBusy={supportBusy}
          />
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-6">Say hi to {activeContact?.username}!</p>
            )}
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.__key || i}
                msg={msg}
                isMe={msg.sender === 'student'}
                state={msg.state}
                onRetry={() => sender.retry(activeThread)}
              />
            ))}
            <div ref={endRef} />
          </div>
        )}

        {(error || byteError) && (
          <p className="mx-3 mb-1 text-[11px] bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-600 rounded-xl px-2 py-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {byteError || error}
          </p>
        )}

        <div className="flex items-center gap-2 px-3 py-3 border-t border-white/20">
          {activeContact?.isBot && isSupportOpen(activeThread) && (
            <button
              onClick={askByteAgain}
              disabled={!input.trim() || byteLoading}
              title="Ask Byte while you wait"
              className="text-[11px] font-semibold bg-white/50 hover:bg-white/70 border border-white/50 text-slate-700 disabled:opacity-40 rounded-full px-3 py-2 shrink-0 transition-colors"
            >
              Ask Byte
            </button>
          )}
          <input
            className="flex-1 bg-white/40 backdrop-blur-sm border border-white/40 text-slate-700 placeholder:text-slate-400 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-white/60"
            placeholder={activeContact?.isBot
              ? (isSupportOpen(activeThread) ? 'Message the support team…' : 'Ask Byte…')
              : `Message ${activeContact?.username}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            disabled={byteLoading || opening}
            autoFocus
          />
          <button
            onClick={sendMessage}
            disabled={byteLoading || opening || !input.trim()}
            className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0 transition-colors hover:bg-blue-600"
          >
            {byteLoading || sender.isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <ByteSupportHandoffDialog
        open={supportOpen}
        thread={activeThread}
        messages={messages}
        supportAdminCount={supportAdminIds.length}
        onClose={() => setSupportOpen(false)}
        onSubmitted={({ thread: updated }) => {
          setThreads((prev) => (prev.some((t) => t.id === updated.id) ? prev.map((t) => (t.id === updated.id ? updated : t)) : [...prev, updated]));
          setActiveThread(updated);
          loadThreadMessages(updated.id)
            .then((msgs) => setRecords((prev) => ({ ...prev, [updated.id]: msgs })))
            .catch((err) => console.error('Could not refresh the conversation', err));
        }}
      />
    </div>
  );
}