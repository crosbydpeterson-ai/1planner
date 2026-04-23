import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, ChevronLeft, Send, Loader2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── STUDENT WIDGET ────────────────────────────────────────────────────────────
function StudentWidget({ currentProfile, onClose }) {
  const [view, setView] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [byteLoading, setByteLoading] = useState(false);
  const [byteMessages, setByteMessages] = useState([]);
  const [byteUnsubRef] = useState({ current: null });
  const endRef = useRef(null);

  useEffect(() => {
    loadContacts();
    loadThreads();
    const unsub = base44.entities.DMThread.subscribe(() => loadThreads());
    return () => { unsub(); byteUnsubRef.current?.(); };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeThread?.messages, byteMessages]);

  const loadContacts = async () => {
    const all = await base44.entities.DMContact.filter({ isActive: true });
    setContacts(all);
  };

  const loadThreads = async () => {
    const all = await base44.entities.DMThread.filter({ studentProfileId: currentProfile.id });
    setThreads(all);
    setActiveThread(prev => prev ? (all.find(t => t.id === prev.id) || prev) : null);
  };

  const openThread = async (contact) => {
    setActiveContact(contact);
    setInput('');

    // Find or create thread
    let thread = threads.find(t => t.contactId === contact.id);
    if (!thread) {
      thread = await base44.entities.DMThread.create({
        studentProfileId: currentProfile.id, studentUsername: currentProfile.username,
        contactId: contact.id, contactUsername: contact.username,
        messages: [], lastMessageAt: new Date().toISOString(),
        hasUnreadAdmin: false, hasUnreadStudent: false,
      });
      setThreads(prev => [...prev, thread]);
    }

    // Mark student unread as read
    if (thread.hasUnreadStudent) {
      thread = await base44.entities.DMThread.update(thread.id, { hasUnreadStudent: false });
    }
    setActiveThread(thread);
    setView('thread');

    // If bot, subscribe to existing or create new agent conversation
    if (contact.isBot) {
      setByteLoading(true);
      setByteMessages([]);
      byteUnsubRef.current?.();

      let convId = thread.byteConvId;
      if (!convId) {
        const conv = await base44.agents.createConversation({
          agent_name: 'support_bot',
          metadata: { name: `${currentProfile.username} ↔ Byte` }
        });
        convId = conv.id;
        thread = await base44.entities.DMThread.update(thread.id, { byteConvId: convId });
        setActiveThread(thread);
      }

      const unsub = base44.agents.subscribeToConversation(convId, (data) => {
        setByteMessages(data.messages || []);
        setByteLoading(false);
      });
      byteUnsubRef.current = unsub;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || byteLoading) return;
    const text = input.trim();
    setInput('');

    if (activeContact?.isBot) {
      setByteLoading(true);
      const convId = activeThread?.byteConvId;
      if (!convId) return;
      const conv = await base44.agents.getConversation(convId);
      await base44.agents.addMessage(conv, { role: 'user', content: text });
      return;
    }

    setSending(true);
    const newMsg = { sender: 'student', senderName: currentProfile.username, text, sentAt: new Date().toISOString() };
    const updated = await base44.entities.DMThread.update(activeThread.id, {
      messages: [...(activeThread.messages || []), newMsg],
      lastMessageAt: new Date().toISOString(), hasUnreadAdmin: true, hasUnreadStudent: false,
    });
    setActiveThread(updated);
    setThreads(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSending(false);
  };

  const getThread = (contact) => threads.find(t => t.contactId === contact.id);
  const unread = threads.filter(t => t.hasUnreadStudent).length;

  return (
    <div className="fixed top-14 right-3 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden" style={{ height: '520px' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
        {view === 'thread' && (
          <button onClick={() => { setView('contacts'); setActiveThread(null); setActiveContact(null); byteUnsubRef.current?.(); }} className="text-slate-400 hover:text-slate-700 mr-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {view === 'thread' && activeContact ? (
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-lg shrink-0">{activeContact.emoji}</div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-none">{activeContact.username}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{activeContact.role}</p>
            </div>
          </div>
        ) : (
          <span className="flex-1 text-sm font-semibold text-slate-800">
            Messages {unread > 0 && <span className="ml-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unread}</span>}
          </span>
        )}
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
      </div>

      {/* CONTACTS */}
      {view === 'contacts' && (
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 && <p className="text-center text-slate-400 text-sm py-10">No contacts yet</p>}
          {contacts.map(contact => {
            const thread = getThread(contact);
            const lastMsg = thread?.messages?.at(-1);
            const hasUnread = thread?.hasUnreadStudent;
            return (
              <button key={contact.id} onClick={() => openThread(contact)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 text-left">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-xl">{contact.emoji}</div>
                  {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn('text-sm', hasUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700')}>{contact.username}</p>
                    {thread?.lastMessageAt && <p className="text-[10px] text-slate-400">{new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                  </div>
                  <p className={cn('text-xs truncate mt-0.5', hasUnread ? 'text-blue-600 font-medium' : 'text-slate-400')}>
                    {lastMsg ? `${lastMsg.sender === 'student' ? 'You' : contact.username}: ${lastMsg.text}` : contact.role}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* THREAD — real admin */}
      {view === 'thread' && !activeContact?.isBot && activeThread && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
            {(activeThread.messages || []).length === 0 && <p className="text-center text-xs text-slate-400 py-4">Say hi to {activeContact?.username}!</p>}
            {(activeThread.messages || []).map((msg, i) => {
              const isMe = msg.sender === 'student';
              return (
                <div key={i} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-snug', isMe ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white text-slate-800 shadow-sm rounded-bl-sm')}>
                    {msg.text}
                    <div className={cn('text-[10px] mt-0.5', isMe ? 'text-blue-100' : 'text-slate-400')}>{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 bg-white">
            <input className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" placeholder={`Message ${activeContact?.username}…`} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} disabled={sending} autoFocus />
            <button onClick={sendMessage} disabled={sending || !input.trim()} className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </>
      )}

      {/* THREAD — Byte bot */}
      {view === 'thread' && activeContact?.isBot && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
            {byteMessages.length === 0 && !byteLoading && <p className="text-center text-xs text-slate-400 py-4">Ask Byte anything about the app!</p>}
            {byteMessages.filter(m => m.content).map((msg, i) => {
              const isMe = msg.role === 'user';
              return (
                <div key={i} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-snug', isMe ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white text-slate-800 shadow-sm rounded-bl-sm')}>{msg.content}</div>
                </div>
              );
            })}
            {byteLoading && <div className="flex justify-start"><div className="bg-white rounded-2xl px-3 py-2 shadow-sm"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div></div>}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 bg-white">
            <input className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" placeholder="Ask Byte…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} disabled={byteLoading} autoFocus />
            <button onClick={sendMessage} disabled={byteLoading || !input.trim()} className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0">
              {byteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ADMIN WIDGET ──────────────────────────────────────────────────────────────
function AdminWidget({ currentProfile, onClose }) {
  const [view, setView] = useState('threads');
  const [threads, setThreads] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [newMsgText, setNewMsgText] = useState('');
  const [startingNew, setStartingNew] = useState(false);
  const endRef = useRef(null);

  // Each admin only sees threads addressed to their contact name
  const myUsername = currentProfile.username;

  useEffect(() => {
    loadThreads();
    const unsub = base44.entities.DMThread.subscribe(() => loadThreads());
    return unsub;
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeThread?.messages]);

  const loadThreads = async () => {
    // Load all threads where this admin's username matches the contact
    const all = await base44.entities.DMThread.list('-lastMessageAt', 200);
    // Filter to only threads for this admin's contact (by contactUsername)
    const mine = all.filter(t => t.contactUsername?.toLowerCase() === myUsername.toLowerCase());
    setThreads(mine);
    setActiveThread(prev => prev ? (mine.find(t => t.id === prev.id) || prev) : null);
  };

  const loadStudents = async () => {
    const all = await base44.entities.UserProfile.list('-created_date', 200);
    setAllStudents(all.filter(p => p.rank !== 'admin' && p.rank !== 'super_admin'));
  };

  const openThread = async (thread) => {
    if (thread.hasUnreadAdmin) {
      const updated = await base44.entities.DMThread.update(thread.id, { hasUnreadAdmin: false });
      setThreads(prev => prev.map(t => t.id === updated.id ? updated : t));
      setActiveThread(updated);
    } else {
      setActiveThread(thread);
    }
    setReplyText('');
    setView('thread');
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeThread || sending) return;
    setSending(true);
    const newMsg = { sender: 'admin', senderName: myUsername, text: replyText.trim(), sentAt: new Date().toISOString() };
    const updated = await base44.entities.DMThread.update(activeThread.id, {
      messages: [...(activeThread.messages || []), newMsg],
      lastMessageAt: new Date().toISOString(), hasUnreadStudent: true, hasUnreadAdmin: false,
    });
    setActiveThread(updated);
    setThreads(prev => prev.map(t => t.id === updated.id ? updated : t));
    setReplyText('');
    setSending(false);
  };

  const startNewConversation = async (student) => {
    if (!newMsgText.trim() || !student) return;
    setStartingNew(true);

    // Find the contact record matching this admin's username
    const contacts = await base44.entities.DMContact.filter({ isActive: true });
    const myContact = contacts.find(c => c.username.toLowerCase() === myUsername.toLowerCase());

    let thread = threads.find(t => t.studentProfileId === student.id);
    if (!thread) {
      thread = await base44.entities.DMThread.create({
        studentProfileId: student.id, studentUsername: student.username,
        contactId: myContact?.id || '', contactUsername: myUsername,
        messages: [], lastMessageAt: new Date().toISOString(), hasUnreadAdmin: false, hasUnreadStudent: false,
      });
    }
    const newMsg = { sender: 'admin', senderName: myUsername, text: newMsgText.trim(), sentAt: new Date().toISOString() };
    const updated = await base44.entities.DMThread.update(thread.id, {
      messages: [...(thread.messages || []), newMsg],
      lastMessageAt: new Date().toISOString(), hasUnreadStudent: true,
    });
    setStartingNew(false);
    setNewMsgText('');
    setSearchStudent('');
    await loadThreads();
    setActiveThread(updated);
    setView('thread');
  };

  const unreadCount = threads.filter(t => t.hasUnreadAdmin).length;
  const filteredStudents = allStudents.filter(s => s.username?.toLowerCase().includes(searchStudent.toLowerCase())).slice(0, 8);
  const selectedStudent = allStudents.find(s => s.username?.toLowerCase() === searchStudent.toLowerCase());

  return (
    <div className="fixed top-14 right-3 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden" style={{ height: '520px' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
        {(view === 'thread' || view === 'new') && (
          <button onClick={() => setView('threads')} className="text-slate-400 hover:text-white mr-1"><ChevronLeft className="w-5 h-5" /></button>
        )}
        <span className="flex-1 text-sm font-semibold text-white">
          {view === 'threads' && <>{myUsername}'s Inbox {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}</>}
          {view === 'thread' && activeThread?.studentUsername}
          {view === 'new' && 'New Message'}
        </span>
        {view === 'threads' && (
          <button onClick={() => { setView('new'); loadStudents(); }} className="text-slate-400 hover:text-white" title="New message">
            <Edit className="w-4 h-4" />
          </button>
        )}
        <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
      </div>

      {/* THREADS LIST */}
      {view === 'threads' && (
        <div className="flex-1 overflow-y-auto bg-slate-900">
          {threads.length === 0 && <p className="text-slate-500 text-xs text-center py-8">No conversations yet</p>}
          {threads.map(thread => {
            const lastMsg = thread.messages?.at(-1);
            const isActive = activeThread?.id === thread.id;
            return (
              <button key={thread.id} onClick={() => openThread(thread)} className={cn('w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-700/40 transition-colors', isActive ? 'bg-slate-700' : 'hover:bg-slate-800/80')}>
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                    {thread.studentUsername?.[0]?.toUpperCase() || '?'}
                  </div>
                  {thread.hasUnreadAdmin && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-slate-900" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn('text-sm', thread.hasUnreadAdmin ? 'font-bold text-white' : 'font-medium text-slate-300')}>{thread.studentUsername}</p>
                    {thread.lastMessageAt && <p className="text-[10px] text-slate-500">{new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                  </div>
                  <p className={cn('text-xs truncate mt-0.5', thread.hasUnreadAdmin ? 'text-blue-400 font-medium' : 'text-slate-500')}>
                    {lastMsg ? `${lastMsg.sender === 'admin' ? 'You' : thread.studentUsername}: ${lastMsg.text}` : 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* THREAD VIEW */}
      {view === 'thread' && activeThread && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-900">
            {(activeThread.messages || []).length === 0 && <p className="text-center text-xs text-slate-500 py-4">No messages yet</p>}
            {(activeThread.messages || []).map((msg, i) => {
              const isAdmin = msg.sender === 'admin';
              return (
                <div key={i} className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-snug', isAdmin ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-slate-700 text-slate-100 rounded-bl-sm')}>
                    {msg.text}
                    <div className={cn('text-[10px] mt-0.5', isAdmin ? 'text-blue-100' : 'text-slate-400')}>
                      {msg.senderName} · {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-700 bg-slate-800">
            <input className="flex-1 bg-slate-700 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400" placeholder={`Reply as ${myUsername}…`} value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()} disabled={sending} autoFocus />
            <button onClick={sendReply} disabled={sending || !replyText.trim()} className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </>
      )}

      {/* NEW MESSAGE */}
      {view === 'new' && (
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
          <div className="p-3 border-b border-slate-700">
            <input className="w-full bg-slate-700 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400" placeholder="Search student…" value={searchStudent} onChange={e => setSearchStudent(e.target.value)} autoFocus />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredStudents.map(student => (
              <button key={student.id} onClick={() => setSearchStudent(student.username)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-left border-b border-slate-700/40">
                <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm shrink-0">{student.username?.[0]?.toUpperCase()}</div>
                <div>
                  <p className="text-sm text-slate-200 font-medium">{student.username}</p>
                  <p className="text-xs text-slate-500">{student.mathTeacher} · {student.readingTeacher}</p>
                </div>
              </button>
            ))}
          </div>
          {selectedStudent && (
            <div className="p-3 border-t border-slate-700 space-y-2 bg-slate-800">
              <p className="text-xs text-slate-400">To: <span className="text-white font-medium">{selectedStudent.username}</span></p>
              <div className="flex gap-2">
                <input className="flex-1 bg-slate-700 text-white rounded-full px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400" placeholder="Type a message…" value={newMsgText} onChange={e => setNewMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && startNewConversation(selectedStudent)} />
                <button onClick={() => startNewConversation(selectedStudent)} disabled={startingNew || !newMsgText.trim()} className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0">
                  {startingNew ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ROOT WIDGET ───────────────────────────────────────────────────────────────
export default function MessageWidget({ currentProfile }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const isAdmin = currentProfile?.rank === 'admin' || currentProfile?.rank === 'super_admin' ||
    currentProfile?.username?.toLowerCase() === 'crosby';

  useEffect(() => {
    if (!currentProfile?.id) return;
    const load = async () => {
      if (isAdmin) {
        const all = await base44.entities.DMThread.list('-lastMessageAt', 200);
        const mine = all.filter(t => t.contactUsername?.toLowerCase() === currentProfile.username?.toLowerCase());
        setUnread(mine.filter(t => t.hasUnreadAdmin).length);
      } else {
        const all = await base44.entities.DMThread.filter({ studentProfileId: currentProfile.id });
        setUnread(all.filter(t => t.hasUnreadStudent).length);
      }
    };
    load();
    const unsub = base44.entities.DMThread.subscribe(() => load());
    return unsub;
  }, [currentProfile?.id, isAdmin]);

  if (!currentProfile) return null;

  return (
    <>
      <button onClick={() => setOpen(o => !o)} className="fixed top-3 right-3 z-50 relative bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-white transition-colors">
        <MessageCircle className="w-5 h-5 text-indigo-600" />
        {unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unread}</span>}
      </button>
      {open && (
        isAdmin
          ? <AdminWidget currentProfile={currentProfile} onClose={() => setOpen(false)} />
          : <StudentWidget currentProfile={currentProfile} onClose={() => setOpen(false)} />
      )}
    </>
  );
}