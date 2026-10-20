import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Bot, ChevronLeft, Edit, Gift, Loader2, Send, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import MessageBubble from './MessageBubble';
import GiftPanel from './GiftPanel';
import BulkMessageView from './BulkMessageView';
import useThreadSender from '@/hooks/useThreadSender';
import { buildThreadMessages, loadMessagesForThreads } from '@/lib/dmMessages';
import {
  indexContacts,
  loadContacts,
  loadRecipientThreads,
  recipientContactIds,
  senderContact,
  unlinkedNameMatchContactIds,
  verifyLinkedProfileId,
} from '@/lib/dmRouting';

/**
 * Personal recipient inbox (also used as the broad admin inbox).
 *
 * Conversations are found by stable ids only: a thread's recipient snapshot, or
 * the contact ids linked to this profile. `canManage` unlocks the broad tools
 * (bulk messaging, gifting, starting conversations); a plain contact recipient
 * gets their assigned conversations and nothing else.
 */
export default function RecipientInbox({ currentProfile, canManage, canGift }) {
  const [view, setView] = useState('threads'); // threads | new | thread | bulk
  const [contacts, setContacts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [records, setRecords] = useState({});
  const [allStudents, setAllStudents] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [newMsgText, setNewMsgText] = useState('');
  const [startingNew, setStartingNew] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [error, setError] = useState('');
  const [truncated, setTruncated] = useState(false);
  const endRef = useRef(null);
  const refreshTimer = useRef(null);

  const contactMap = indexContacts(contacts);

  const sender = useThreadSender({
    onSaved: (result, threadId) => {
      setRecords((prev) => ({ ...prev, [threadId]: [...(prev[threadId] || []), result.message] }));
      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, ...result.thread } : t)));
      setActiveThread((prev) => (prev && prev.id === threadId ? { ...prev, ...result.thread } : prev));
      setError(result.summaryUpdated ? '' : 'Sent, but the conversation summary could not be updated.');
    },
    onError: () => setError('That reply was not sent. It is kept below — tap Retry.'),
  });

  const loadThreads = async (contactList) => {
    const list = contactList || contacts;
    // Contacts whose VERIFIED link points at this profile.
    const verified = recipientContactIds(list, currentProfile.id);
    // Owner-only fallback so unlinked legacy contacts keep their history visible.
    const fallback = canManage ? unlinkedNameMatchContactIds(list, currentProfile.username) : [];
    const result = await loadRecipientThreads({
      myProfileId: currentProfile.id,
      verifiedContactIds: verified,
      fallbackContactIds: fallback,
    });
    setThreads(result.threads);
    setTruncated(result.truncated);
    const { byThread } = await loadMessagesForThreads(result.threads.map((t) => t.id));
    setRecords((prev) => ({ ...prev, ...byThread }));
    setActiveThread((prev) => (prev ? result.threads.find((t) => t.id === prev.id) || prev : null));
  };

  useEffect(() => {
    (async () => {
      try {
        const list = await loadContacts();
        setContacts(list);
        await loadThreads(list);
      } catch (err) {
        console.error('Could not load the inbox', err);
        setError('Could not load conversations. Please try again.');
      }
    })();
    const unsub = base44.entities.DMThread.subscribe(() => {
      // Debounced, and contacts are not re-read on every thread change.
      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        loadThreads().catch((err) => console.error('Inbox refresh failed', err));
      }, 800);
    });
    return () => { clearTimeout(refreshTimer.current); unsub?.(); };
  }, [currentProfile.id]);

  useEffect(() => {
    if (!canManage) return;
    base44.entities.UserProfile.list('-created_date', 200)
      .then((all) => setAllStudents(all.filter((p) => p.rank !== 'admin' && p.rank !== 'super_admin')))
      .catch((err) => console.error('Could not load students', err));
  }, [canManage]);

  const activePending = activeThread ? sender.pendingFor(activeThread.id) : null;
  const activeFailed = activeThread ? sender.failedFor(activeThread.id) : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.id, records, activePending, activeFailed]);

  const openThread = async (thread) => {
    setActiveContact(contactMap[thread.contactId] || null);
    setReplyText('');
    setShowGift(false);
    setError('');
    setView('thread');
    try {
      if (thread.hasUnreadAdmin) {
        // Only marked read because this recipient is actually opening it.
        const updated = await base44.entities.DMThread.update(thread.id, { hasUnreadAdmin: false });
        setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setActiveThread(updated);
      } else {
        setActiveThread(thread);
      }
    } catch (err) {
      console.error('Could not open that conversation', err);
      setActiveThread(thread);
      setError('Opened without marking it read — please try again.');
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeThread || sender.isBusy) return;
    const thread = activeThread;
    const text = replyText.trim();
    setReplyText('');
    const status = await sender.run({
      thread,
      sender: 'admin',
      senderName: currentProfile.username,
      senderProfileId: currentProfile.id,
      text,
      unreadPatch: { hasUnreadStudent: true, hasUnreadAdmin: false },
    });
    // A duplicate tap stored nothing, so the text must not be lost.
    if (status === 'busy') setReplyText((cur) => (cur.trim() ? cur : text));
  };

  const startNewConversation = async (student) => {
    if (!newMsgText.trim() || !student || startingNew) return;
    setStartingNew(true);
    setError('');
    try {
      const myContact = senderContact(contacts, currentProfile);
      if (!myContact) {
        setError('No contact is linked to your account yet, so a new conversation cannot be addressed. Link one in the Admin DM inbox.');
        return;
      }
      const recipientProfileId = myContact.isBot ? null : await verifyLinkedProfileId(myContact);
      let thread = threads.find((t) => t.studentProfileId === student.id && t.contactId === myContact.id);
      if (!thread) {
        thread = await base44.entities.DMThread.create({
          studentProfileId: student.id,
          studentUsername: student.username,
          contactId: myContact.id,
          contactUsername: myContact.username,
          recipientProfileId,
          messages: [],
          lastMessageAt: new Date().toISOString(),
          hasUnreadAdmin: false,
          hasUnreadStudent: false,
        });
      }
      const text = newMsgText.trim();
      setNewMsgText('');
      setSearchStudent('');
      const status = await sender.run({
        thread,
        sender: 'admin',
        senderName: currentProfile.username,
        senderProfileId: currentProfile.id,
        text,
        unreadPatch: { hasUnreadStudent: true, hasUnreadAdmin: false },
      });
      if (status === 'busy') {
        // Nothing was stored — keep the draft and stay on this screen.
        setNewMsgText((cur) => (cur.trim() ? cur : text));
        return;
      }
      await loadThreads();
      setActiveContact(myContact);
      setActiveThread(thread);
      setView('thread');
    } catch (err) {
      console.error('Could not start the conversation', err);
      setError('Could not start that conversation. Please try again.');
    } finally {
      setStartingNew(false);
    }
  };

  const unreadCount = threads.filter((t) => t.hasUnreadAdmin).length;
  const filteredStudents = allStudents.filter((s) => s.username?.toLowerCase().includes(searchStudent.toLowerCase())).slice(0, 8);
  const selectedStudent = allStudents.find((s) => s.username?.toLowerCase() === searchStudent.toLowerCase());

  if (view === 'bulk' && canManage) {
    return (
      <BulkMessageView
        currentProfile={currentProfile}
        myContact={senderContact(contacts, currentProfile)}
        allStudents={allStudents}
        onBack={() => setView('threads')}
      />
    );
  }

  if (view === 'new' && canManage) {
    return (
      <div className="max-w-md mx-auto">
        <button onClick={() => setView('threads')} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 px-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-white font-semibold text-sm mb-2">New Message</p>
            <input
              className="w-full bg-slate-700 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400"
              placeholder="Search student…"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredStudents.map((student) => (
              <button key={student.id} onClick={() => setSearchStudent(student.username)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 text-left border-b border-slate-700/40">
                <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-sm shrink-0">{student.username?.[0]?.toUpperCase()}</div>
                <div>
                  <p className="text-sm text-slate-200 font-medium">{student.username}</p>
                  <p className="text-xs text-slate-500">{student.mathTeacher} · {student.readingTeacher}</p>
                </div>
              </button>
            ))}
          </div>
          {selectedStudent && (
            <div className="p-4 border-t border-slate-700 space-y-2">
              <p className="text-xs text-slate-400">To: <span className="text-white font-semibold">{selectedStudent.username}</span></p>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-slate-700 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400"
                  placeholder="Type a message…"
                  value={newMsgText}
                  onChange={(e) => setNewMsgText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); startNewConversation(selectedStudent); } }}
                />
                <button
                  onClick={() => startNewConversation(selectedStudent)}
                  disabled={startingNew || sender.isBusy || !newMsgText.trim()}
                  className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0"
                >
                  {startingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              {error && <p className="text-[11px] text-red-300 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'thread' && activeThread) {
    const activeIsBot = !!activeContact?.isBot;
    const messages = buildThreadMessages({
      thread: activeThread,
      records: records[activeThread.id],
      pending: activePending,
      failed: activeFailed,
      sender: 'admin',
      senderName: currentProfile.username,
    });

    return (
      <div className="max-w-md mx-auto flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
        <button onClick={() => { setView('threads'); setShowGift(false); }} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-3 px-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Inbox
        </button>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
              {activeThread.studentUsername?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{activeThread.studentUsername}</p>
              <p className="text-xs text-slate-400">
                {activeThread.lastMessageAt ? new Date(activeThread.lastMessageAt).toLocaleDateString() : ''}
                {activeContact && <> · via {activeContact.username}</>}
                {activeContact && !activeContact.isActive && ' (inactive contact)'}
              </p>
            </div>
            {canGift && !activeIsBot && (
              <button
                onClick={() => setShowGift((v) => !v)}
                className={cn('flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors', showGift ? 'bg-amber-500 border-amber-500 text-white' : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10')}
              >
                <Gift className="w-3.5 h-3.5" /> Gift
              </button>
            )}
            {activeThread.isEscalated && (
              <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
                <Bot className="w-3 h-3" /> Escalated by Byte
              </span>
            )}
          </div>

          {activeThread.needsRepair && (
            <p className="mx-3 mt-3 text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg px-2 py-1.5">
              This conversation came from a contact that isn't linked to an account. It only appears for the owner until an admin links it.
            </p>
          )}
          {activeThread.isEscalated && activeThread.escalationSummary && (
            <div className="mx-3 mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              <p className="text-[11px] text-amber-400 font-semibold mb-0.5">📋 Byte's Summary</p>
              <p className="text-xs text-amber-300">{activeThread.escalationSummary}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {messages.length === 0 && <p className="text-center text-xs text-slate-500 py-6">No messages yet</p>}
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.__key || i}
                msg={msg}
                isMe={msg.sender === 'admin'}
                state={msg.state}
                onRetry={() => sender.retry(activeThread)}
              />
            ))}
            <div ref={endRef} />
          </div>

          {showGift && canGift && (
            <GiftPanel
              thread={activeThread}
              senderProfileId={currentProfile.id}
              senderName={currentProfile.username}
              onGiftSent={(result) => {
                setRecords((prev) => ({ ...prev, [activeThread.id]: [...(prev[activeThread.id] || []), result.message] }));
                setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? { ...t, ...result.thread } : t)));
                setActiveThread((prev) => (prev && prev.id === activeThread.id ? { ...prev, ...result.thread } : prev));
              }}
              onClose={() => setShowGift(false)}
            />
          )}

          {error && (
            <p className="mx-3 mb-1 text-[11px] bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-2 py-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}

          <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-700">
            <input
              className="flex-1 bg-slate-700 text-white rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400"
              placeholder={activeIsBot ? 'Byte conversations are handled in the student app' : `Reply as ${currentProfile.username}…`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendReply(); } }}
              disabled={sender.isBusy}
              autoFocus
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
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-bold text-white">
          {currentProfile.username}'s Inbox {unreadCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </h2>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => setView('bulk')} className="flex items-center gap-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-xs px-3 py-1.5 rounded-full transition-colors">
              <Users className="w-3 h-3" /> Bulk
            </button>
            <button onClick={() => setView('new')} className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full transition-colors">
              <Edit className="w-3 h-3" /> New
            </button>
          </div>
        )}
      </div>

      {truncated && <p className="text-[11px] text-slate-500 mb-2 px-1">Showing the 100 most recent conversations.</p>}
      {error && (
        <p className="mb-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1.5 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {threads.length === 0 && <p className="text-slate-500 text-sm text-center py-10">No conversations yet</p>}
        {threads.map((thread, i) => {
          const lastMsg = buildThreadMessages({ thread, records: records[thread.id] }).at(-1);
          const contact = contactMap[thread.contactId];
          return (
            <button
              key={thread.id}
              onClick={() => openThread(thread)}
              className={cn('w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-700/60', i > 0 && 'border-t border-slate-700/40')}
            >
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                  {contact?.emoji || thread.studentUsername?.[0]?.toUpperCase() || '?'}
                </div>
                {thread.hasUnreadAdmin && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-slate-800" />}
                {thread.isEscalated && <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-800 flex items-center justify-center text-[8px]">B</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={cn('text-sm truncate', thread.hasUnreadAdmin ? 'font-bold text-white' : 'font-medium text-slate-300')}>{thread.studentUsername}</p>
                  {thread.lastMessageAt && <p className="text-[11px] text-slate-500">{new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
                <p className={cn('text-xs truncate', thread.hasUnreadAdmin ? 'text-blue-400 font-medium' : 'text-slate-500')}>
                  {lastMsg
                    ? (lastMsg.giftData
                        ? `🎁 Gift: ${lastMsg.giftData.name || lastMsg.giftData.type}`
                        : `${lastMsg.sender === 'admin' ? 'You' : lastMsg.senderName || thread.studentUsername}: ${lastMsg.text}`)
                    : 'No messages yet'}
                </p>
                {thread.needsRepair && <p className="text-[10px] text-amber-400 mt-0.5">Contact not linked — needs repair</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}