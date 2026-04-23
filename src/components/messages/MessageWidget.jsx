import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, ChevronLeft, Send, Loader2, Users, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── STUDENT VIEW ──────────────────────────────────────────────────────────────
function StudentWidget({ currentProfile, onClose }) {
  const [view, setView] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [byteConvId, setByteConvId] = useState(null);
  const [byteLoading, setByteLoading] = useState(false);
  const [byteMessages, setByteMessages] = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    loadContacts();
    loadThreads();
    const unsub = base44.entities.DMThread.subscribe(() => loadThreads());
    return unsub;
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeThread?.messages, byteMessages]);

  const loadContacts = async () => {
    const all = await base44.entities.DMContact.filter({ isActive: true });
    setContacts(all);
  };

  const loadThreads = async () => {
    const all = await base44.entities.DMThread.filter({ studentProfileId: currentProfile.id });
    setThreads(all);
    setUnread(all.filter(t => t.hasUnreadStudent).length);
    setActiveThread(prev => prev ? (all.find(t => t.id === prev.id) || prev) : null);
  };

  const openThread = async (contact) => {
    setActiveContact(contact);
    if (contact.isBot) {
      setView('thread');
      if (!byteConvId) {
        setByteLoading(true);
        const conv = await base44.agents.createConversation({ agent_name: 'guide_chatbot', metadata: { name: `${currentProfile.username} ↔ ${contact.username}` } });
        setByteConvId(conv.id);
        base44.agents.subscribeToConversation(conv.id, (data) => { setByteMessages(data.messages || []); setByteLoading(false); });
      }
      return;
    }
    let thread = threads.find(t => t.contactId === contact.id);
    if (!thread) {
      thread = await base44.entities.DMThread.create({
        studentProfileId: currentProfile.id, studentUsername: currentProfile.username,
        contactId: contact.id, contactUsername: contact.username,
        messages: [], lastMessageAt: new Date().toISOString(), hasUnreadAdmin: false, hasUnreadStudent: false,
      });
    }
    if (thread.hasUnreadStudent) {
      thread = await base44.entities.DMThread.update(thread.id, { hasUnreadStudent: false });
      setUnread(u => Math.max(0, u - 1));
    }
    setActiveThread(thread);
    setView('thread');
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    if (activeContact?.isBot) {
      setByteLoading(true);
      const conv = await base44.agents.getConversation(byteConvId);
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
    setSending(false);
  };

  const getThreadForContact = (contact) => threads.find(t => t.contactId === contact.id);

  return (
    <div className="fixed top-14 right-3 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden" style={{ height: '520px' }}>
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
        {view === 'thread' && (
          <button onClick={() => { setView('contacts'); setActiveThread(null); setActiveContact(null); }} className="text-slate-400 hover:text-slate-700 mr-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {view === 'thread' && activeContact ? (
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg bg-slate-100 shrink-0">{activeContact.emoji}</div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-none">{activeContact.username}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{activeContact.role}</p>
            </div>
          </div>
        ) : (
          <span className="flex-1 text-sm font-semibold text-slate-800">Messages</span>
        )}
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
      </div>

      {view === 'contacts' && (
        <div className="flex-1 overflow-y-auto">
          {contacts.length === 0 && <div className="text-center text-slate-400 text-sm py-10">No contacts yet</div>}
          {contacts.map(contact => {
            const thread = getThreadForContact(contact);
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

      {view === 'thread' && !activeContact?.isBot && activeThread && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
            {(activeThread.messages || []).length === 0 && <p className="text-center text-xs text-slate-400 py-4">Start a conversation with {activeContact?.username}</p>}
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
            <input className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" placeholder={`Message ${activeContact?.username}…`} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} disabled={sending} />
            <button onClick={sendMessage} disabled={sending || !input.trim()} className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0">
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </>
      )}

      {view === 'thread' && activeContact?.isBot && (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
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
            <input className="flex-1 bg-slate-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300" placeholder="Message Byte…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} disabled={byteLoading} />
            <button onClick={sendMessage} disabled={byteLoading || !input.trim()} className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0">
              {byteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ADMIN VIEW ────────────────────────────────────────────────────────────────
function AdminWidget({ currentProfile, onClose }) {
  const [view, setView] = useState('threads'); // threads | thread | new
  const [threads, setThreads] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [newMsgText, setNewMsgText] = useState('');
  const [startingNew, setStartingNew] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    loadThreads();
    const unsub = base44.entities.DMThread.subscribe(() => loadThreads());
    return unsub;
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeThread?.messages]);

  const loadThreads = async () => {
    const all = await base44.entities.DMThread.list('-lastMessageAt', 100);
    setThreads(all);
    setActiveThread(prev => prev ? (all.find(t => t.id === prev.id) || prev) : null);
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
    setView('thread');
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeThread || sending) return;
    setSending(true);
    const newMsg = { sender: 'admin', senderName: currentProfile.username, text: replyText.trim(), sentAt: new Date().toISOString() };
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
    if (!newMsgText.trim()) return;
    setStartingNew(true);
    // Find or get admin's contact record
    const contacts = await base44.entities.DMContact.filter({ isActive: true });
    let contact = contacts.find(c => c.username.toLowerCase() === currentProfile.username.toLowerCase());
    if (!contact) contact = contacts[0]; // fallback to first contact

    // Check if thread already exists
    let thread = threads.find(t => t.studentProfileId === student.id && t.contactId === contact?.id);
    if (!thread) {
      thread = await base44.entities.DMThread.create({
        studentProfileId: student.id, studentUsername: student.username,
        contactId: contact?.id || '', contactUsername: currentProfile.username,
        messages: [], lastMessageAt: new Date().toISOString(), hasUnreadAdmin: false, hasUnreadStudent: false,
      });
    }
    const newMsg = { sender: 'admin', senderName: currentProfile.username, text: newMsgText.trim(), sentAt: new Date().toISOString() };
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

  return (
    <div className="fixed top-14 right-3 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden" style={{ height: '520px' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
        {(view === 'thread' || view === 'new') && (
          <button onClick={() => setView('threads')} className="text-slate-400 hover:text-white mr-1"><ChevronLeft className="w-5 h-5" /></button>
        )}
        <span className="flex-1 text-sm font-semibold text-white">
          {view === 'threads' && <>📬 Admin Messages {unreadCount > 0 && <span className="ml-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>}</>}
          {view === 'thread' && activeThread && <span>{activeThread.studentUsername}</span>}
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
            <input className="flex-1 bg-slate-700 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400" placeholder={`Reply as ${currentProfile.username}…`} value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()} disabled={sending} />
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
          {searchStudent && (
            <div className="p-3 border-t border-slate-700 space-y-2 bg-slate-800">
              <p className="text-xs text-slate-400">To: <span className="text-white font-medium">{searchStudent}</span></p>
              <div className="flex gap-2">
                <input className="flex-1 bg-slate-700 text-white rounded-full px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400" placeholder="Type a message…" value={newMsgText} onChange={e => setNewMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && (() => { const s = allStudents.find(s => s.username.toLowerCase() === searchStudent.toLowerCase()); if (s) startNewConversation(s); })()} />
                <button onClick={() => { const s = allStudents.find(s => s.username.toLowerCase() === searchStudent.toLowerCase()); if (s) startNewConversation(s); }} disabled={startingNew || !newMsgText.trim()} className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0">
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

// ─── MAIN WIDGET ───────────────────────────────────────────────────────────────
export default function MessageWidget({ currentProfile }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const isAdmin = currentProfile?.rank === 'admin' || currentProfile?.rank === 'super_admin' ||
    currentProfile?.username?.toLowerCase() === 'crosby';

  // Track unread for bubble badge
  useEffect(() => {
    if (!currentProfile?.id) return;
    const load = async () => {
      if (isAdmin) {
        const threads = await base44.entities.DMThread.list('-lastMessageAt', 100);
        setUnread(threads.filter(t => t.hasUnreadAdmin).length);
      } else {
        const threads = await base44.entities.DMThread.filter({ studentProfileId: currentProfile.id });
        setUnread(threads.filter(t => t.hasUnreadStudent).length);
      }
    };
    load();
    const unsub = base44.entities.DMThread.subscribe(() => load());
    return unsub;
  }, [currentProfile?.id, isAdmin]);

  if (!currentProfile) return null;

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed top-3 right-3 z-50 relative bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-white transition-colors"
      >
        <MessageCircle className="w-5 h-5 text-indigo-600" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unread}</span>
        )}
      </button>

      {open && (
        isAdmin
          ? <AdminWidget currentProfile={currentProfile} onClose={() => setOpen(false)} />
          : <StudentWidget currentProfile={currentProfile} onClose={() => setOpen(false)} />
      )}
    </>
  );
}