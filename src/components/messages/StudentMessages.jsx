import React, { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, ChevronLeft, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import MessageBubble from './MessageBubble';
import useThreadSender from '@/hooks/useThreadSender';
import { buildThreadMessages, loadMessagesForThreads, loadThreadMessages } from '@/lib/dmMessages';
import { ensureThread, loadContacts, loadStudentThreads } from '@/lib/dmRouting';

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
  const [byteMessages, setByteMessages] = useState([]);
  const [byteError, setByteError] = useState('');
  const byteUnsubRef = useRef(null);
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
    const [allContacts, mine] = await Promise.all([loadContacts(), loadStudentThreads(currentProfile.id)]);
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
      byteUnsubRef.current?.();
    };
  }, [currentProfile.id]);

  const activePending = activeThread ? sender.pendingFor(activeThread.id) : null;
  const activeFailed = activeThread ? sender.failedFor(activeThread.id) : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.id, records, activePending, activeFailed, byteMessages.length]);

  const initByte = async (thread) => {
    setByteMessages([]);
    setByteLoading(false);
    setByteError('');
    byteUnsubRef.current?.();
    let convId = thread.byteConvId;
    let byteConv = null;
    if (!convId) {
      byteConv = await base44.agents.createConversation({
        agent_name: 'support_bot',
        metadata: {
          name: `${currentProfile.username} ↔ Byte`,
          studentProfileId: currentProfile.id,
          studentUsername: currentProfile.username,
          studentUserId: currentProfile.userId,
        },
      });
      convId = byteConv.id;
      // Send an invisible system context message so Byte knows who it's talking to
      await base44.agents.addMessage(byteConv, {
        role: 'user',
        content: `[SYSTEM CONTEXT — do not reply to this, just use it] My username is "${currentProfile.username}", my profileId is "${currentProfile.id}", my userId is "${currentProfile.userId || ''}".`,
      });
      const updated = await base44.entities.DMThread.update(thread.id, { byteConvId: convId });
      setActiveThread((prev) => (prev && prev.id === updated.id ? { ...prev, ...updated } : prev));
    } else {
      byteConv = await base44.agents.getConversation(convId);
      // Filter out the hidden system context message from display
      setByteMessages((byteConv.messages || []).filter((m) => !m.content?.startsWith('[SYSTEM CONTEXT')));
    }
    byteUnsubRef.current = base44.agents.subscribeToConversation(convId, (data) => {
      const msgs = (data.messages || []).filter((m) => !m.content?.startsWith('[SYSTEM CONTEXT'));
      setByteMessages(msgs);
      // Stop loading whenever the last message is from the assistant (even partial)
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg?.role === 'assistant') setByteLoading(false);
    });
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
      if (contact.isBot) await initByte(thread);
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

    if (activeContact?.isBot) {
      setInput('');
      setByteError('');
      setByteLoading(true);
      const timeoutId = setTimeout(() => setByteLoading(false), 45000);
      try {
        // Fetch fresh conversation so addMessage has the full up-to-date messages array
        const freshConv = await base44.agents.getConversation(activeThread.byteConvId);
        await base44.agents.addMessage(freshConv, { role: 'user', content: text });
      } catch (err) {
        console.error('Byte did not receive the message', err);
        setByteError('Byte did not receive that. Your text is back in the box — tap send to retry.');
        setInput((cur) => (cur.trim() ? cur : text));
        setByteLoading(false);
      } finally {
        clearTimeout(timeoutId);
      }
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {visibleContacts.length === 0 && <p className="text-center text-slate-400 text-sm py-10">No contacts yet</p>}
          {visibleContacts.map((contact, i) => {
            const thread = getThread(contact);
            const lastMsg = thread ? buildThreadMessages({ thread, records: records[thread.id] }).at(-1) : null;
            const hasUnread = thread?.hasUnreadStudent;
            return (
              <button
                key={contact.id}
                onClick={() => openThread(contact)}
                className={cn('w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left', i > 0 && 'border-t border-slate-50')}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl shadow-sm">
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
          <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-1">
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
        onClick={() => { setView('contacts'); setActiveThread(null); setActiveContact(null); byteUnsubRef.current?.(); }}
        className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm mb-3 px-1 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Messages
      </button>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">{activeContact?.isBot ? '🤖' : activeContact?.emoji}</div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{activeContact?.username}</p>
            <p className="text-xs text-slate-400">{activeContact?.role}</p>
          </div>
          {activeThread?.isEscalated && (
            <span className="ml-auto flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" /> Forwarded to admin
            </span>
          )}
        </div>

        {!activeContact?.isBot && !activeContact?.adminProfileId && (
          <p className="mx-3 mt-2 text-[11px] bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-2 py-1.5">
            This contact isn't linked to an account yet, so replies may not reach anyone until an admin links it.
          </p>
        )}
        {opening && (
          <p className="mx-3 mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Opening conversation…
          </p>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
          {!activeContact?.isBot && messages.length === 0 && (
            <p className="text-center text-xs text-slate-400 py-6">Say hi to {activeContact?.username}!</p>
          )}
          {!activeContact?.isBot && messages.map((msg, i) => (
            <MessageBubble
              key={msg.__key || i}
              msg={msg}
              isMe={msg.sender === 'student'}
              state={msg.state}
              onRetry={() => sender.retry(activeThread)}
            />
          ))}
          {activeContact?.isBot && byteMessages.filter((m) => m.content && !m.content.startsWith('[SYSTEM CONTEXT')).map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className="max-w-[78%] px-3 py-2 text-sm leading-snug"
                style={{
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.role === 'user' ? 'rgba(59,130,246,0.85)' : 'rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: msg.role === 'user' ? '1px solid rgba(147,197,253,0.3)' : '1px solid rgba(255,255,255,0.5)',
                  color: msg.role === 'user' ? '#fff' : '#1e293b',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {msg.content}
                <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.65 }}>{msg.role === 'user' ? 'You' : 'Byte'}</div>
              </div>
            </div>
          ))}
          {activeContact?.isBot && byteLoading && byteMessages.length > 0 && (
            <div className="flex justify-start">
              <div className="px-3 py-2.5 flex items-center gap-2" style={{ borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.5)' }}>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                <span className="text-xs text-slate-400">Byte is typing…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {(error || byteError) && (
          <p className="mx-3 mb-1 text-[11px] bg-red-50 border border-red-100 text-red-600 rounded-lg px-2 py-1.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {byteError || error}
          </p>
        )}

        <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-100 bg-white">
          <input
            className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
            placeholder={activeContact?.isBot ? 'Ask Byte…' : `Message ${activeContact?.username}…`}
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
    </div>
  );
}