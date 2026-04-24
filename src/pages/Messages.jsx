import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Edit, ChevronLeft, MessageCircle, Bot, AlertCircle, Gift, Coins, Zap, Star, Users, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Shared bubble component
function MessageBubble({ msg, isMe }) {
  const isGift = msg.giftData;
  const isSystem = msg.sender === 'system';

  const bubbleStyle = isGift
    ? { background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }
    : isMe
    ? { background: 'rgba(59,130,246,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(147,197,253,0.3)', color: '#fff', boxShadow: '0 2px 8px rgba(59,130,246,0.25)' }
    : isSystem
    ? { background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#92400e', fontStyle: 'italic' }
    : { background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.5)', color: '#1e293b', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

  return (
    <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
      <div
        className="max-w-[82%] px-3 py-2 text-sm leading-snug"
        style={{ borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', ...bubbleStyle }}
      >
        {isGift && <div className="text-lg mb-1">🎁</div>}
        {msg.text || msg.content}
        {isGift && msg.giftData && (
          <div className="mt-1.5 bg-white/20 rounded-lg px-2 py-1 text-xs font-semibold">
            {msg.giftData.type === 'pet' && `🐾 Pet: ${msg.giftData.name}`}
            {msg.giftData.type === 'theme' && `🎨 Theme: ${msg.giftData.name}`}
            {msg.giftData.type === 'coins' && `🪙 ${msg.giftData.amount} Quest Coins`}
            {msg.giftData.type === 'xp' && `⚡ ${msg.giftData.amount} XP`}
          </div>
        )}
        <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.65, color: isMe || isGift ? '#fff' : isSystem ? '#92400e' : '#64748b' }}>
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
      setByteLoading(false);
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
        const existingConv = await base44.agents.getConversation(convId);
        setByteMessages(existingConv.messages || []);
      }
      byteUnsubRef.current = base44.agents.subscribeToConversation(convId, (data) => {
        const msgs = data.messages || [];
        setByteMessages(msgs);
        const lastMsg = msgs[msgs.length - 1];
        if (!lastMsg || lastMsg.role === 'assistant') setByteLoading(false);
      });
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || byteLoading) return;
    const text = input.trim();
    setInput('');
    if (activeContact?.isBot) {
      setByteLoading(true);
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
            const lastMsg = thread?.messages?.at(-1) || null;
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

  return (
    <div className="max-w-md mx-auto flex flex-col" style={{ height: 'calc(100vh - 180px)' }}>
      <button onClick={() => { setView('contacts'); setActiveThread(null); setActiveContact(null); byteUnsubRef.current?.(); }} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm mb-3 px-1 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Messages
      </button>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden">
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
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
          {!activeContact?.isBot && (activeThread?.messages || []).length === 0 && (
            <p className="text-center text-xs text-slate-400 py-6">Say hi to {activeContact?.username}!</p>
          )}
          {!activeContact?.isBot && (activeThread?.messages || []).map((msg, i) => (
            <MessageBubble key={i} msg={msg} isMe={msg.sender === 'student'} />
          ))}
          {activeContact?.isBot && byteMessages.filter(m => m.content).map((msg, i) => (
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

// ─── GIFT PANEL ────────────────────────────────────────────────────────────────
function GiftPanel({ thread, adminUsername, onGiftSent, onClose }) {
  const [tab, setTab] = useState('quick'); // quick | pet | theme
  const [pets, setPets] = useState([]);
  const [themes, setThemes] = useState([]);
  const [petSearch, setPetSearch] = useState('');
  const [themeSearch, setThemeSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);

  useEffect(() => {
    base44.entities.CustomPet.list('-created_date', 200).then(setPets);
    base44.entities.CustomTheme.list('-created_date', 200).then(setThemes);
    base44.entities.UserProfile.filter({ id: thread.studentProfileId }).then(r => setStudentProfile(r[0] || null));
  }, [thread.studentProfileId]);

  const sendGift = async (giftData, msgText) => {
    setSending(true);
    // Apply the actual reward to the student profile
    if (studentProfile) {
      if (giftData.type === 'pet') {
        const current = studentProfile.unlockedPets || [];
        if (!current.includes(giftData.id)) {
          await base44.entities.UserProfile.update(studentProfile.id, { unlockedPets: [...current, giftData.id] });
        }
      } else if (giftData.type === 'theme') {
        const current = studentProfile.unlockedThemes || [];
        if (!current.includes(giftData.id)) {
          await base44.entities.UserProfile.update(studentProfile.id, { unlockedThemes: [...current, giftData.id] });
        }
      } else if (giftData.type === 'coins') {
        await base44.entities.UserProfile.update(studentProfile.id, { questCoins: (studentProfile.questCoins || 0) + giftData.amount });
      } else if (giftData.type === 'xp') {
        await base44.entities.UserProfile.update(studentProfile.id, { xp: (studentProfile.xp || 0) + giftData.amount });
      }
    }
    // Send the gift message
    const newMsg = {
      sender: 'admin', senderName: adminUsername,
      text: msgText, sentAt: new Date().toISOString(),
      giftData,
    };
    const updated = await base44.entities.DMThread.update(thread.id, {
      messages: [...(thread.messages || []), newMsg],
      lastMessageAt: new Date().toISOString(), hasUnreadStudent: true,
    });
    setSending(false);
    onGiftSent(updated);
    onClose();
  };

  const filteredPets = pets.filter(p => !petSearch || p.name?.toLowerCase().includes(petSearch.toLowerCase()));
  const filteredThemes = themes.filter(t => !themeSearch || t.name?.toLowerCase().includes(themeSearch.toLowerCase()));

  return (
    <div className="border-t border-slate-700 bg-slate-900 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-amber-400 text-xs font-bold flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Send Gift to {thread.studentUsername}</p>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
      </div>
      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {[['quick','Quick'],['pet','Pet'],['theme','Theme']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} className={cn('text-xs px-3 py-1 rounded-full transition-colors', tab === k ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600')}>{l}</button>
        ))}
      </div>

      {tab === 'quick' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" type="number" className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => sendGift({ type: 'coins', amount: Number(amount) || 50 }, `🎁 You've been gifted ${amount || 50} Quest Coins!`)} disabled={sending} className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors">
              <Coins className="w-3.5 h-3.5" /> Coins
            </button>
            <button onClick={() => sendGift({ type: 'xp', amount: Number(amount) || 25 }, `🎁 You've been gifted ${amount || 25} XP!`)} disabled={sending} className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1 transition-colors">
              <Zap className="w-3.5 h-3.5" /> XP
            </button>
          </div>
          {sending && <div className="flex justify-center pt-1"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>}
        </div>
      )}

      {tab === 'pet' && (
        <div>
          <input value={petSearch} onChange={e => setPetSearch(e.target.value)} placeholder="Search pets…" className="w-full bg-slate-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none mb-2" />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredPets.map(pet => (
              <button key={pet.id} disabled={sending} onClick={() => sendGift({ type: 'pet', id: `custom_${pet.id}`, name: pet.name }, `🎁 You've been gifted the "${pet.name}" pet!`)}
                className="w-full flex items-center gap-2 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left">
                <span className="text-lg">{pet.imageUrl ? <img src={pet.imageUrl} className="w-6 h-6 rounded object-cover" /> : pet.emoji || '🐾'}</span>
                <span className="text-white text-xs font-medium flex-1 truncate">{pet.name}</span>
                <span className="text-slate-400 text-[10px]">{pet.rarity}</span>
              </button>
            ))}
            {filteredPets.length === 0 && <p className="text-slate-500 text-xs text-center py-3">No pets found</p>}
          </div>
        </div>
      )}

      {tab === 'theme' && (
        <div>
          <input value={themeSearch} onChange={e => setThemeSearch(e.target.value)} placeholder="Search themes…" className="w-full bg-slate-700 text-white rounded-lg px-3 py-1.5 text-xs outline-none mb-2" />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredThemes.map(theme => (
              <button key={theme.id} disabled={sending} onClick={() => sendGift({ type: 'theme', id: `custom_${theme.id}`, name: theme.name }, `🎁 You've been gifted the "${theme.name}" theme!`)}
                className="w-full flex items-center gap-2 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left">
                <div className="w-5 h-5 rounded-full shrink-0" style={{ background: theme.primaryColor || '#888' }} />
                <span className="text-white text-xs font-medium flex-1 truncate">{theme.name}</span>
                <span className="text-slate-400 text-[10px]">{theme.rarity}</span>
              </button>
            ))}
            {filteredThemes.length === 0 && <p className="text-slate-500 text-xs text-center py-3">No themes found</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BULK MESSAGE ──────────────────────────────────────────────────────────────
function BulkMessageView({ adminUsername, allStudents, onBack }) {
  const [filter, setFilter] = useState('all'); // all | math | reading
  const [teacherFilter, setTeacherFilter] = useState('');
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const teachers = [...new Set(allStudents.flatMap(s => [s.mathTeacher, s.readingTeacher].filter(Boolean)))].sort();

  const getTargets = () => {
    if (filter === 'all') return allStudents;
    if (filter === 'math') return allStudents.filter(s => s.mathTeacher === teacherFilter);
    if (filter === 'reading') return allStudents.filter(s => s.readingTeacher === teacherFilter);
    return allStudents;
  };

  const targets = getTargets();

  const sendBulk = async () => {
    if (!msgText.trim() || sending) return;
    setSending(true);
    setDone(false);
    setSentCount(0);
    const contacts = await base44.entities.DMContact.filter({ isActive: true });
    const myContact = contacts.find(c => c.username?.toLowerCase() === adminUsername.toLowerCase());
    let count = 0;
    for (const student of targets) {
      const allThreads = await base44.entities.DMThread.filter({ studentProfileId: student.id });
      let thread = allThreads.find(t => t.contactUsername?.toLowerCase() === adminUsername.toLowerCase());
      if (!thread) {
        thread = await base44.entities.DMThread.create({
          studentProfileId: student.id, studentUsername: student.username,
          contactId: myContact?.id || '', contactUsername: adminUsername,
          messages: [], lastMessageAt: new Date().toISOString(), hasUnreadAdmin: false, hasUnreadStudent: false,
        });
      }
      const newMsg = { sender: 'admin', senderName: adminUsername, text: msgText.trim(), sentAt: new Date().toISOString() };
      await base44.entities.DMThread.update(thread.id, {
        messages: [...(thread.messages || []), newMsg],
        lastMessageAt: new Date().toISOString(), hasUnreadStudent: true,
      });
      count++;
      setSentCount(count);
    }
    setSending(false);
    setDone(true);
    setMsgText('');
  };

  return (
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-4 px-1 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700">
          <p className="text-white font-bold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /> Bulk Message</p>
          <p className="text-slate-400 text-xs mt-0.5">Send one message to many students at once</p>
        </div>
        <div className="p-4 space-y-3">
          {/* Filter */}
          <div>
            <p className="text-slate-400 text-xs mb-1.5 font-semibold">Target</p>
            <div className="flex gap-2 mb-2">
              {[['all','All Students'],['math','Math Class'],['reading','Reading Class']].map(([k,l]) => (
                <button key={k} onClick={() => { setFilter(k); setTeacherFilter(''); }} className={cn('text-xs px-3 py-1.5 rounded-full transition-colors', filter === k ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600')}>{l}</button>
              ))}
            </div>
            {(filter === 'math' || filter === 'reading') && (
              <select value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)} className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none">
                <option value="">-- Pick a teacher --</option>
                {teachers.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
          {/* Preview */}
          <div className="bg-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-300">
            Sending to <span className="text-white font-bold">{targets.length}</span> student{targets.length !== 1 ? 's' : ''}
            {targets.length > 0 && targets.length <= 5 && <span className="text-slate-400"> ({targets.map(s => s.username).join(', ')})</span>}
          </div>
          {/* Message */}
          <textarea
            value={msgText} onChange={e => setMsgText(e.target.value)}
            placeholder="Type your message…"
            rows={3}
            className="w-full bg-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-500 resize-none"
          />
          {/* Send */}
          <button
            onClick={sendBulk}
            disabled={sending || !msgText.trim() || targets.length === 0 || (filter !== 'all' && !teacherFilter)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
          >
            {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending… ({sentCount}/{targets.length})</> : <><Send className="w-4 h-4" /> Send to {targets.length} student{targets.length !== 1 ? 's' : ''}</>}
          </button>
          {done && (
            <div className="flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-xl px-3 py-2 text-green-400 text-sm">
              <Check className="w-4 h-4" /> Sent to {sentCount} students!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN VIEW ────────────────────────────────────────────────────────────────
function AdminMessages({ currentProfile }) {
  const [view, setView] = useState('threads'); // threads | new | thread | bulk
  const [threads, setThreads] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [newMsgText, setNewMsgText] = useState('');
  const [startingNew, setStartingNew] = useState(false);
  const [showGift, setShowGift] = useState(false);
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
    setShowGift(false);
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

  if (view === 'bulk') {
    return <BulkMessageView adminUsername={myUsername} allStudents={allStudents} onBack={() => setView('threads')} />;
  }

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
        <button onClick={() => { setView('threads'); setShowGift(false); }} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-3 px-1 transition-colors">
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
            {/* Gift button */}
            <button onClick={() => setShowGift(v => !v)} className={cn('flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors', showGift ? 'bg-amber-500 border-amber-500 text-white' : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10')}>
              <Gift className="w-3.5 h-3.5" /> Gift
            </button>
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
          {/* Gift Panel */}
          {showGift && (
            <GiftPanel
              thread={activeThread}
              adminUsername={myUsername}
              onGiftSent={(updated) => {
                setActiveThread(updated);
                setThreads(prev => prev.map(t => t.id === updated.id ? updated : t));
              }}
              onClose={() => setShowGift(false)}
            />
          )}
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
        <div className="flex gap-2">
          <button onClick={() => setView('bulk')} className="flex items-center gap-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-xs px-3 py-1.5 rounded-full transition-colors">
            <Users className="w-3 h-3" /> Bulk
          </button>
          <button onClick={() => setView('new')} className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full transition-colors">
            <Edit className="w-3 h-3" /> New
          </button>
        </div>
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
                  {lastMsg ? (lastMsg.giftData ? `🎁 Gift: ${lastMsg.giftData.name || lastMsg.giftData.type}` : `${lastMsg.sender === 'admin' ? 'You' : lastMsg.senderName || thread.studentUsername}: ${lastMsg.text}`) : 'No messages yet'}
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