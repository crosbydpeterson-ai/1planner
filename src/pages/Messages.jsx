import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Edit, ChevronLeft, MessageCircle, Bot, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Shared bubble component
function MessageBubble({ msg, isMe }) {
  return (
    <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-snug',
        isMe ? 'bg-blue-500 text-white rounded-br-sm' :
        msg.sender === 'system' ? 'bg-amber-50 border border-amber-200 text-amber-800 rounded-bl-sm italic' :
        'bg-white text-slate-800 shadow-sm rounded-bl-sm'
      )}>
        {msg.text || msg.content}
        <div className={cn('text-[10px] mt-0.5', isMe ? 'text-blue-100' : msg.sender === 'system' ? 'text-amber-400' : 'text-slate-400')}>
          {msg.senderName || msg.sender} · {new Date(msg.sentAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}

// ─── STUDENT VIEW ──────────────────────────────────────────────────────────────
function StudentMessages({ currentProfile }) {
  const [view, setView] = useState('contacts');
  const [contacts, setContacts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [byteLoading, setByteLoading] = useState(false);
  const [byteMessages, setByteMessages] = useState([]);
  const byteUnsubRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    loadAll();
    const unsub = base44.entities.DMThread.subscribe(() => loadAll());
    return () => { unsub(); byteUnsubRef.current?.(); };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeThread?.messages, byteMessages]);

  const loadAll = async () => {
    const [allContacts, allThreads] = await Promise.all([
      base44.entities.DMContact.filter({ isActive: true }),
      base44.entities.DMThread.filter({ studentProfileId: currentProfile.id }),
    ]);
    setContacts(allContacts);
    setThreads(allThreads);
    setActiveThread(prev => prev ? (allThreads.find(t => t.id === prev.id) || prev) : null);
  };

  const openThread = async (contact) => {
    setActiveContact(contact);
    setInput('');
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
    if (thread.hasUnreadStudent) {
      thread = await base44.entities.DMThread.update(thread.id, { hasUnreadStudent: false });
    }
    setActiveThread(thread);
    setView('thread');

    if (contact.isBot) {
      setByteMessages([]);
      byteUnsubRef.current?.();
      let convId = thread.byteConvId;
      if (!convId) {
        const conv = await base44.agents.createConversation({
          agent_name: 'support_bot',
          metadata: { name: `${currentProfile.username} ↔ Byte`, studentProfileId: currentProfile.id, studentUsername: currentProfile.username }
        });
        convId = conv.id;
        thread = await base44.entities.DMThread.update(thread.id, { byteConvId: convId });
        setActiveThread(thread);
      } else {
        // Load existing conversation messages
        const existingConv = await base44.agents.getConversation(convId);
        setByteMessages(existingConv.messages || []);
      }
      byteUnsubRef.current = base44.agents.subscribeToConversation(convId, (data) => {
        setByteMessages(data.messages || []);
        setByteLoading(false);
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || byteLoading) return;
    const text = input.trim();
    setInput('');
    if (activeContact?.isBot) {
      setByteLoading(true);
      // Optimistically add user message to UI
      setByteMessages(prev => [...prev, { role: 'user', content: text }]);
      const conv = await base44.agents.getConversation(activeThread.byteConvId);
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

  if (view === 'contacts') {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-4 px-1">
          Messages {unread > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread}</span>}
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {contacts.length === 0 && <p className="text-center text-slate-400 text-sm py-10">No contacts yet</p>}
          {contacts.map((contact, i) => {
            const thread = getThread(contact);
            const lastMsg = thread?.messages?.at(-1) || (thread?.byteConvId ? null : null);
            const hasUnread = thread?.hasUnreadStudent;
            return (
              <button key={contact.id} onClick={() => openThread(contact)} className={cn('w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors text-left', i > 0 && 'border-t border-slate-50')}>
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
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Thread view
  return (
    <div className="max-w-md mx-auto flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
      <button onClick={() => { setView('contacts'); setActiveThread(null); setActiveContact(null); byteUnsubRef.current?.(); }} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm mb-3 px-1 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Messages
      </button>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden">
        {/* Thread header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">{activeContact?.isBot ? '🤖' : activeContact?.emoji}</div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{activeContact?.username}</p>
            <p className="text-xs text-slate-400">{activeContact?.role}</p>
          </div>
          {activeThread?.isEscalated && (
            <span className="ml-auto flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" /> Forwarded to admin
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
          {/* Real admin thread */}
          {!activeContact?.isBot && (activeThread?.messages || []).length === 0 && (
            <p className="text-center text-xs text-slate-400 py-6">Say hi to {activeContact?.username}!</p>
          )}
          {!activeContact?.isBot && (activeThread?.messages || []).map((msg, i) => (
            <MessageBubble key={i} msg={msg} isMe={msg.sender === 'student'} />
          ))}

          {/* Byte thread */}
          {activeContact?.isBot && byteMessages.filter(m => m.content).map((msg, i) => (
            <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-snug', msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white text-slate-800 shadow-sm rounded-bl-sm')}>
                {msg.content}
                <div className="text-[10px] mt-0.5 text-slate-400 opacity-70">{msg.role === 'user' ? 'You' : 'Byte'}</div>
              </div>
            </div>
          ))}
          {activeContact?.isBot && byteLoading && byteMessages.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-3 py-2.5 shadow-sm flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                <span className="text-xs text-slate-400">Byte is typing…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-100 bg-white">
          <input
            className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300"
            placeholder={activeContact?.isBot ? 'Ask Byte…' : `Message ${activeContact?.username}…`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={sending || byteLoading}
            autoFocus
          />
          <button onClick={sendMessage} disabled={(sending || byteLoading) || !input.trim()} className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0 transition-colors hover:bg-blue-600">
            {(sending || byteLoading) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ────────────────────────────────────────────────────────────────
function AdminMessages({ currentProfile }) {
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
  const myUsername = currentProfile.username;

  useEffect(() => {
    loadThreads();
    loadStudents();
    const unsub = base44.entities.DMThread.subscribe(() => loadThreads());
    return unsub;
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeThread?.messages]);

  const loadThreads = async () => {
    const all = await base44.entities.DMThread.list('-lastMessageAt', 200);
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

  if (view === 'new') {
    return (
      <div className="max-w-md mx-auto">
        <button onClick={() => setView('threads')} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 px-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-white font-semibold text-sm mb-2">New Message</p>
            <input className="w-full bg-slate-700 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400" placeholder="Search student…" value={searchStudent} onChange={e => setSearchStudent(e.target.value)} autoFocus />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filteredStudents.map(student => (
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
                <input className="flex-1 bg-slate-700 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400" placeholder="Type a message…" value={newMsgText} onChange={e => setNewMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && startNewConversation(selectedStudent)} />
                <button onClick={() => startNewConversation(selectedStudent)} disabled={startingNew || !newMsgText.trim()} className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0">
                  {startingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === 'thread' && activeThread) {
    return (
      <div className="max-w-md mx-auto flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
        <button onClick={() => setView('threads')} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-3 px-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Inbox
        </button>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
              {activeThread.studentUsername?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{activeThread.studentUsername}</p>
              <p className="text-xs text-slate-400">{new Date(activeThread.lastMessageAt).toLocaleDateString()}</p>
            </div>
            {activeThread.isEscalated && (
              <span className="flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 rounded-full">
                <Bot className="w-3 h-3" /> Escalated by Byte
              </span>
            )}
          </div>
          {activeThread.isEscalated && activeThread.escalationSummary && (
            <div className="mx-3 mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              <p className="text-[11px] text-amber-400 font-semibold mb-0.5">📋 Byte's Summary</p>
              <p className="text-xs text-amber-300">{activeThread.escalationSummary}</p>
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {(activeThread.messages || []).length === 0 && <p className="text-center text-xs text-slate-500 py-6">No messages yet</p>}
            {(activeThread.messages || []).map((msg, i) => (
              <MessageBubble key={i} msg={msg} isMe={msg.sender === 'admin'} />
            ))}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-700">
            <input className="flex-1 bg-slate-700 text-white rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400" placeholder={`Reply as ${myUsername}…`} value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()} disabled={sending} autoFocus />
            <button onClick={sendReply} disabled={sending || !replyText.trim()} className="w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0 transition-colors">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Threads list
  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="text-xl font-bold text-white">
          {myUsername}'s Inbox {unreadCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </h2>
        <button onClick={() => { setView('new'); }} className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full transition-colors">
          <Edit className="w-3 h-3" /> New
        </button>
      </div>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        {threads.length === 0 && <p className="text-slate-500 text-sm text-center py-10">No conversations yet</p>}
        {threads.map((thread, i) => {
          const lastMsg = thread.messages?.at(-1);
          return (
            <button key={thread.id} onClick={() => openThread(thread)} className={cn('w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-700/60', i > 0 && 'border-t border-slate-700/40')}>
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                  {thread.studentUsername?.[0]?.toUpperCase() || '?'}
                </div>
                {thread.hasUnreadAdmin && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-slate-800" />}
                {thread.isEscalated && <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-500 rounded-full border-2 border-slate-800 flex items-center justify-center text-[8px]">B</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={cn('text-sm', thread.hasUnreadAdmin ? 'font-bold text-white' : 'font-medium text-slate-300')}>{thread.studentUsername}</p>
                  {thread.lastMessageAt && <p className="text-[11px] text-slate-500">{new Date(thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>}
                </div>
                <p className={cn('text-xs truncate', thread.hasUnreadAdmin ? 'text-blue-400 font-medium' : 'text-slate-500')}>
                  {lastMsg ? `${lastMsg.sender === 'admin' ? 'You' : lastMsg.senderName || thread.studentUsername}: ${lastMsg.text}` : 'No messages yet'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) { setLoading(false); return; }
    base44.entities.UserProfile.filter({ id: profileId }).then(profiles => {
      setCurrentProfile(profiles[0] || null);
      setLoading(false);
    });
  }, []);

  const isAdmin = currentProfile?.rank === 'admin' || currentProfile?.rank === 'super_admin' ||
    currentProfile?.username?.toLowerCase() === 'crosby';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );

  if (!currentProfile) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">No profile found</div>
  );

  return (
    <div className={cn('min-h-screen pt-16 pb-24 px-4', isAdmin ? 'bg-slate-900' : 'bg-slate-50')}>
      {isAdmin ? <AdminMessages currentProfile={currentProfile} /> : <StudentMessages currentProfile={currentProfile} />}
    </div>
  );
}