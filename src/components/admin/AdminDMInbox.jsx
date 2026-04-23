import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PRESET_CONTACTS = [
  { username: 'Crosby', role: 'Owner & Main Admin', emoji: '👑', color: 'from-yellow-500 to-orange-500', isBot: false },
  { username: 'Raphela', role: 'Pet Helper', emoji: '🐾', color: 'from-pink-500 to-rose-500', isBot: false },
  { username: 'Byte', role: 'AI Helper', emoji: '🤖', color: 'from-indigo-500 to-purple-600', isBot: true },
];

export default function AdminDMInbox({ adminProfile }) {
  const [contacts, setContacts] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [activeContact, setActiveContact] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState('inbox'); // inbox | contacts
  const [newContact, setNewContact] = useState({ username: '', role: '', emoji: '😊', color: 'from-blue-500 to-indigo-500', isBot: false });
  const endRef = useRef(null);

  useEffect(() => {
    loadAll();
    const unsub = base44.entities.DMThread.subscribe(() => loadAll());
    return unsub;
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThread?.messages]);

  const loadAll = async () => {
    const [allContacts, allThreads] = await Promise.all([
      base44.entities.DMContact.list('-created_date'),
      base44.entities.DMThread.list('-lastMessageAt'),
    ]);
    setContacts(allContacts);
    setThreads(allThreads);
    // Refresh active
    if (activeThread) {
      const fresh = allThreads.find(t => t.id === activeThread.id);
      if (fresh) setActiveThread(fresh);
    }
  };

  const openThread = async (thread) => {
    const contact = contacts.find(c => c.id === thread.contactId);
    setActiveContact(contact);
    // Mark admin unread as read
    if (thread.hasUnreadAdmin) {
      const updated = await base44.entities.DMThread.update(thread.id, { hasUnreadAdmin: false });
      setThreads(prev => prev.map(t => t.id === updated.id ? updated : t));
      setActiveThread(updated);
    } else {
      setActiveThread(thread);
    }
  };

  const sendReply = async () => {
    if (!replyText.trim() || !activeThread || sending) return;
    setSending(true);
    const newMsg = {
      sender: 'admin',
      senderName: adminProfile?.username || 'Admin',
      text: replyText.trim(),
      sentAt: new Date().toISOString(),
    };
    const updated = await base44.entities.DMThread.update(activeThread.id, {
      messages: [...(activeThread.messages || []), newMsg],
      lastMessageAt: new Date().toISOString(),
      hasUnreadStudent: true,
      hasUnreadAdmin: false,
    });
    setActiveThread(updated);
    setThreads(prev => prev.map(t => t.id === updated.id ? updated : t));
    setReplyText('');
    setSending(false);
  };

  const addContact = async () => {
    if (!newContact.username.trim() || !newContact.role.trim()) { toast.error('Fill in username and role'); return; }
    const created = await base44.entities.DMContact.create({ ...newContact, isActive: true });
    setContacts(prev => [created, ...prev]);
    setNewContact({ username: '', role: '', emoji: '😊', color: 'from-blue-500 to-indigo-500', isBot: false });
    toast.success('Contact added!');
  };

  const addPreset = async (preset) => {
    const exists = contacts.find(c => c.username.toLowerCase() === preset.username.toLowerCase());
    if (exists) { toast.info(`${preset.username} already exists`); return; }
    const created = await base44.entities.DMContact.create({ ...preset, isActive: true });
    setContacts(prev => [created, ...prev]);
    toast.success(`${preset.username} added as contact!`);
  };

  const toggleContact = async (contact) => {
    const updated = await base44.entities.DMContact.update(contact.id, { isActive: !contact.isActive });
    setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteContact = async (contact) => {
    await base44.entities.DMContact.delete(contact.id);
    setContacts(prev => prev.filter(c => c.id !== contact.id));
    toast.success('Contact removed');
  };

  const totalUnread = threads.filter(t => t.hasUnreadAdmin).length;

  return (
    <div className="flex h-[600px] gap-0 rounded-xl overflow-hidden border border-slate-600">
      {/* Sidebar */}
      <div className="w-48 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
        <div className="flex border-b border-slate-700">
          <button onClick={() => setTab('inbox')} className={cn('flex-1 py-2.5 text-xs font-semibold transition-colors', tab === 'inbox' ? 'text-white bg-slate-700' : 'text-slate-400 hover:text-white')}>
            Inbox {totalUnread > 0 && <span className="ml-1 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
          </button>
          <button onClick={() => setTab('contacts')} className={cn('flex-1 py-2.5 text-xs font-semibold transition-colors', tab === 'contacts' ? 'text-white bg-slate-700' : 'text-slate-400 hover:text-white')}>
            Contacts
          </button>
        </div>

        {tab === 'inbox' && (
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 && <p className="text-slate-500 text-xs text-center py-6">No threads yet</p>}
            {threads.map(thread => {
              const contact = contacts.find(c => c.id === thread.contactId);
              const lastMsg = thread.messages?.at(-1);
              const isActive = activeThread?.id === thread.id;
              return (
                <button
                  key={thread.id}
                  onClick={() => openThread(thread)}
                  className={cn('w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-slate-700/50 transition-colors', isActive ? 'bg-slate-600' : 'hover:bg-slate-700/50')}
                >
                  <div className="relative shrink-0">
                    <span className="text-xl">{contact?.emoji || '💬'}</span>
                    {thread.hasUnreadAdmin && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border border-slate-800" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-xs truncate', thread.hasUnreadAdmin ? 'text-white font-bold' : 'text-slate-300')}>{thread.studentUsername}</p>
                    <p className="text-[10px] text-slate-500 truncate">{lastMsg?.text || '—'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {tab === 'contacts' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center gap-1 bg-slate-700/50 rounded-lg px-2 py-1.5">
                <span className="text-base">{c.emoji}</span>
                <p className={cn('text-xs flex-1 truncate', c.isActive ? 'text-white' : 'text-slate-500 line-through')}>{c.username}</p>
                <button onClick={() => toggleContact(c)} className={cn('w-4 h-4 rounded-full shrink-0 border', c.isActive ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500')}>
                  {c.isActive && <Check className="w-3 h-3 text-white" />}
                </button>
                <button onClick={() => deleteContact(c)} className="text-red-400 hover:text-red-300 shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
        {tab === 'contacts' ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <p className="text-slate-300 text-sm font-semibold mb-3">Quick Add Presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_CONTACTS.map(p => (
                  <button key={p.username} onClick={() => addPreset(p)} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-full px-3 py-1.5 transition-colors">
                    <span>{p.emoji}</span> {p.username}
                    <Plus className="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-slate-300 text-sm font-semibold">Add Custom Contact</p>
              <div className="grid grid-cols-2 gap-2">
                <Input value={newContact.username} onChange={e => setNewContact(p => ({ ...p, username: e.target.value }))} placeholder="Name (e.g. Raphela)" className="bg-slate-700 border-slate-600 text-white text-sm" />
                <Input value={newContact.role} onChange={e => setNewContact(p => ({ ...p, role: e.target.value }))} placeholder="Role (e.g. Pet Helper)" className="bg-slate-700 border-slate-600 text-white text-sm" />
                <Input value={newContact.emoji} onChange={e => setNewContact(p => ({ ...p, emoji: e.target.value }))} placeholder="Emoji" className="bg-slate-700 border-slate-600 text-white text-sm" />
                <div className="flex items-center gap-2">
                  <label className="text-slate-400 text-xs whitespace-nowrap">Is Bot?</label>
                  <input type="checkbox" checked={newContact.isBot} onChange={e => setNewContact(p => ({ ...p, isBot: e.target.checked }))} />
                </div>
              </div>
              <Button onClick={addContact} className="bg-indigo-600 hover:bg-indigo-700 w-full">
                <Plus className="w-4 h-4 mr-1" /> Add Contact
              </Button>
            </div>
          </div>
        ) : activeThread ? (
          <>
            {/* Thread header */}
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-3 bg-slate-800">
              <span className="text-2xl">{activeContact?.emoji || '💬'}</span>
              <div>
                <p className="text-white font-semibold text-sm">{activeThread.studentUsername}</p>
                <p className="text-slate-400 text-xs">→ {activeContact?.username || activeThread.contactUsername}</p>
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-slate-900">
              {(activeThread.messages || []).length === 0 && (
                <p className="text-center text-slate-500 text-sm py-4">No messages yet</p>
              )}
              {(activeThread.messages || []).map((msg, i) => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={i} className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[75%] px-3 py-2 rounded-2xl text-sm',
                      isAdmin ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                    )}>
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
            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-700 bg-slate-800">
              <input
                className="flex-1 bg-slate-700 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400"
                placeholder={`Reply as ${adminProfile?.username || 'Admin'}…`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendReply()}
                disabled={sending}
              />
              <button
                onClick={sendReply}
                disabled={sending || !replyText.trim()}
                className="w-9 h-9 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-colors shrink-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
            Select a conversation to reply
          </div>
        )}
      </div>
    </div>
  );
}