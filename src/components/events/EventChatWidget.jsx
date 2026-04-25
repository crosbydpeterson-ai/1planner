import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function EventChatWidget({ event, profile, isAdmin = false }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const endRef = useRef(null);

  useEffect(() => {
    if (!event?.id) return;
    loadMessages();
    const unsub = base44.entities.EventChat.subscribe((evt) => {
      if (evt.data?.eventId === event.id) {
        setMessages(prev => {
          const exists = prev.find(m => m.id === evt.id);
          if (exists) return prev.map(m => m.id === evt.id ? evt.data : m);
          if (!open) setUnread(u => u + 1);
          return [...prev, { ...evt.data, id: evt.id }];
        });
      }
    });
    return () => unsub();
  }, [event?.id]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  const loadMessages = async () => {
    const msgs = await base44.entities.EventChat.filter({ eventId: event.id });
    msgs.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
    setMessages(msgs);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await base44.entities.EventChat.create({
      eventId: event.id,
      profileId: profile.id,
      username: profile.username,
      message: input.trim(),
      sentAt: new Date().toISOString(),
      isAdmin: isAdmin,
    });
    setInput('');
    setSending(false);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-28 left-4 w-12 h-12 rounded-full flex items-center justify-center shadow-lg z-[9990]"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
        whileTap={{ scale: 0.9 }}
      >
        {open ? <X className="w-5 h-5 text-white" /> : <MessageCircle className="w-5 h-5 text-white" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-44 left-4 w-72 rounded-2xl overflow-hidden z-[9990] flex flex-col"
            style={{
              height: '320px',
              background: 'rgba(15,15,30,0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(251,191,36,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2 shrink-0"
              style={{ background: 'linear-gradient(90deg, rgba(245,158,11,0.3), rgba(239,68,68,0.3))' }}>
              <span className="text-lg">🎪</span>
              <div className="flex-1">
                <p className="text-white font-bold text-xs">{event.name}</p>
                <p className="text-yellow-300/70 text-[10px]">Event Chat</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
              {messages.length === 0 && (
                <p className="text-white/30 text-xs text-center pt-6">Be the first to chat! 🎉</p>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.profileId === profile.id;
                return (
                  <div key={msg.id || i} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                    <div
                      className="max-w-[85%] px-2.5 py-1.5 rounded-2xl text-xs"
                      style={{
                        background: isMe
                          ? 'rgba(245,158,11,0.7)'
                          : msg.isAdmin
                          ? 'rgba(139,92,246,0.5)'
                          : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        border: msg.isAdmin ? '1px solid rgba(139,92,246,0.5)' : 'none',
                      }}
                    >
                      {!isMe && (
                        <span className="font-bold opacity-80 mr-1" style={{ fontSize: '10px' }}>
                          {msg.isAdmin ? '⭐ ' : ''}{msg.username}:
                        </span>
                      )}
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="flex gap-1.5 px-2 py-2 border-t border-white/10 shrink-0">
              <input
                className="flex-1 bg-white/10 rounded-full px-3 py-1.5 text-xs text-white outline-none placeholder:text-white/30"
                placeholder="Say something…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-40 shrink-0"
                style={{ background: 'rgba(245,158,11,0.8)' }}
              >
                <Send className="w-3 h-3 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}