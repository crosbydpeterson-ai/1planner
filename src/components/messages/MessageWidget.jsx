import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, X, Bot, Crown, ChevronLeft, Send, Loader2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const ADMINS = [
  { username: 'Crosby', role: 'Owner & Main Admin', emoji: '👑', color: 'from-yellow-500 to-orange-500' },
  { username: 'Raphela', role: 'Pet Helper', emoji: '🐾', color: 'from-pink-500 to-rose-500' },
];

export default function MessageWidget({ currentProfile }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('home'); // home, admin-pick, admin-chat, byte
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [dmText, setDmText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [myDMs, setMyDMs] = useState([]);
  const [byteMessages, setByteMessages] = useState([]);
  const [byteInput, setByteInput] = useState('');
  const [byteLoading, setByteLoading] = useState(false);
  const [byteConvId, setByteConvId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const byteEndRef = useRef(null);

  useEffect(() => {
    if (currentProfile?.id) loadMyDMs();
  }, [currentProfile?.id]);

  useEffect(() => {
    byteEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [byteMessages]);

  const loadMyDMs = async () => {
    const dms = await base44.entities.DirectMessage.filter({ fromProfileId: currentProfile.id });
    setMyDMs(dms.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    const unread = dms.filter(d => d.adminReply && !d.isRead).length;
    setUnreadCount(unread);
  };

  const sendDM = async () => {
    if (!dmText.trim() || !selectedAdmin) return;
    setSending(true);
    await base44.entities.DirectMessage.create({
      fromProfileId: currentProfile.id,
      fromUsername: currentProfile.username,
      toAdminUsername: selectedAdmin.username,
      message: dmText.trim(),
    });
    setSending(false);
    setSent(true);
    setDmText('');
    loadMyDMs();
    setTimeout(() => { setSent(false); setView('home'); }, 2000);
  };

  const startByte = async () => {
    setView('byte');
    if (byteConvId) return;
    setByteLoading(true);
    const conv = await base44.agents.createConversation({
      agent_name: 'guide_chatbot',
      metadata: { name: `${currentProfile.username}'s Help Chat` }
    });
    setByteConvId(conv.id);
    base44.agents.subscribeToConversation(conv.id, (data) => {
      setByteMessages(data.messages || []);
      setByteLoading(false);
    });
    // Send a greeting
    await base44.agents.addMessage(conv, {
      role: 'user',
      content: `Hi! I'm ${currentProfile.username} and I need some help.`
    });
  };

  const sendByteMessage = async () => {
    if (!byteInput.trim() || !byteConvId || byteLoading) return;
    const text = byteInput.trim();
    setByteInput('');
    setByteLoading(true);
    const conv = await base44.agents.getConversation(byteConvId);
    await base44.agents.addMessage(conv, { role: 'user', content: text });
  };

  const escalateToAdmin = async () => {
    const context = byteMessages.map(m => `${m.role === 'user' ? currentProfile.username : 'Byte'}: ${m.content}`).join('\n');
    await base44.entities.DirectMessage.create({
      fromProfileId: currentProfile.id,
      fromUsername: currentProfile.username,
      toAdminUsername: 'Crosby',
      message: '(Escalated from Byte) — Please see conversation below.',
      isEscalated: true,
      escalationContext: context,
    });
    setView('home');
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const back = () => {
    if (view === 'admin-chat') setView('admin-pick');
    else setView('home');
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-2">
        <button
          onClick={() => { setOpen(o => !o); if (!open) loadMyDMs(); }}
          className="relative bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-white transition-colors"
        >
          <MessageCircle className="w-5 h-5 text-indigo-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Panel */}
      {open && (
        <div className="fixed top-14 right-3 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '70vh' }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-500 to-purple-600">
            {view !== 'home' && (
              <button onClick={back} className="text-white/80 hover:text-white mr-1">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <span className="text-white font-semibold text-sm flex-1">
              {view === 'home' && 'Messages'}
              {view === 'admin-pick' && 'Message an Admin'}
              {view === 'admin-chat' && `→ ${selectedAdmin?.username}`}
              {view === 'byte' && '🤖 Byte — AI Helper'}
            </span>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* HOME */}
          {view === 'home' && (
            <div className="flex flex-col flex-1 overflow-y-auto">
              <div className="p-4 space-y-3">
                {/* Byte option */}
                <button
                  onClick={startByte}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Byte — AI Helper</p>
                    <p className="text-xs text-slate-400">Answers questions & can escalate to an admin</p>
                  </div>
                </button>

                {/* Admin option */}
                <button
                  onClick={() => setView('admin-pick')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-amber-100 hover:border-amber-300 hover:bg-amber-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shrink-0">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Message an Admin</p>
                    <p className="text-xs text-slate-400">Crosby, Raphela & more — real humans</p>
                  </div>
                </button>
              </div>

              {/* Past DMs with replies */}
              {myDMs.filter(d => d.adminReply).length > 0 && (
                <div className="border-t border-slate-100 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-500 mb-2">REPLIES FROM ADMINS</p>
                  <div className="space-y-2">
                    {myDMs.filter(d => d.adminReply).map(dm => (
                      <div key={dm.id} className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400 mb-1">You → {dm.toAdminUsername}: <span className="text-slate-500">{dm.message.slice(0, 40)}{dm.message.length > 40 ? '…' : ''}</span></p>
                        <p className="text-sm text-slate-800 font-medium">💬 {dm.adminReply}</p>
                        <p className="text-xs text-slate-400 mt-1">— {dm.repliedByUsername || dm.toAdminUsername}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sent && (
                <div className="mx-4 mb-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2 text-emerald-700 text-sm">
                  <CheckCheck className="w-4 h-4" /> Message sent!
                </div>
              )}
            </div>
          )}

          {/* ADMIN PICK */}
          {view === 'admin-pick' && (
            <div className="p-4 space-y-3 overflow-y-auto">
              {ADMINS.map(admin => (
                <button
                  key={admin.username}
                  onClick={() => { setSelectedAdmin(admin); setView('admin-chat'); setSent(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-xl shrink-0', admin.color)}>
                    {admin.emoji}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{admin.username}</p>
                    <p className="text-xs text-slate-400">{admin.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ADMIN CHAT */}
          {view === 'admin-chat' && selectedAdmin && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-xl shrink-0', selectedAdmin.color)}>
                  {selectedAdmin.emoji}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{selectedAdmin.username}</p>
                  <p className="text-xs text-slate-400">{selectedAdmin.role}</p>
                </div>
              </div>
              <div className="flex-1 p-4">
                <Textarea
                  placeholder={`Send a message to ${selectedAdmin.username}…`}
                  value={dmText}
                  onChange={e => setDmText(e.target.value)}
                  rows={5}
                  className="resize-none text-sm"
                />
                {sent && (
                  <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2 text-emerald-700 text-sm">
                    <CheckCheck className="w-4 h-4" /> Sent! They'll reply soon.
                  </div>
                )}
              </div>
              <div className="px-4 pb-4">
                <Button onClick={sendDM} disabled={sending || !dmText.trim()} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-1" /> Send Message</>}
                </Button>
              </div>
            </div>
          )}

          {/* BYTE CHAT */}
          {view === 'byte' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {byteMessages.filter(m => m.content).map((msg, i) => (
                  <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-sm', msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-800')}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {byteLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  </div>
                )}
                <div ref={byteEndRef} />
              </div>
              <div className="border-t border-slate-100 p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    placeholder="Ask Byte anything…"
                    value={byteInput}
                    onChange={e => setByteInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendByteMessage()}
                    disabled={byteLoading}
                  />
                  <button
                    onClick={sendByteMessage}
                    disabled={byteLoading || !byteInput.trim()}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-3 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={escalateToAdmin}
                  className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors py-1"
                >
                  🚨 Escalate to a real admin
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}