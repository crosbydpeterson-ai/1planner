import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { getISOWeek, getISOWeekYear } from 'date-fns';

const BYTE_IMAGE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696e36c523c92e1a3cd5dbd6/e5d1726bd_image.png";
const WEEKLY_LIMIT = 15;

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const unsubRef = useRef(null);
  const initialized = useRef(false);

  const getPeriod = () => {
    const now = new Date();
    return `${getISOWeekYear(now)}-W${String(getISOWeek(now)).padStart(2, '0')}`;
  };

  useEffect(() => {
    (async () => {
      try {
        const settings = await base44.entities.AppSetting.list();
        const flag = settings.find(s => s.key === 'disable_guide_chat');
        if (flag && (flag.value?.disabled === true || flag.value === true)) {
          setIsDisabled(true);
          return;
        }
        // Check if admin
        const profileId = localStorage.getItem('quest_profile_id');
        if (profileId) {
          const profiles = await base44.entities.UserProfile.filter({ id: profileId });
          const p = profiles[0];
          if (p && (p.rank === 'admin' || p.rank === 'super_admin' || p.username?.toLowerCase() === 'crosby')) {
            setIsAdmin(true);
          }
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    })();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => { unsubRef.current?.(); };
  }, []);

  const checkAndIncrementUsage = async () => {
    if (isAdmin) return true; // Admins have unlimited
    try {
      const profileId = localStorage.getItem('quest_profile_id');
      if (!profileId) return false;
      const period = getPeriod();
      const existing = await base44.entities.AgentUsage.filter({ userId: profileId, agentName: 'guide_chatbot', period });
      let usage = existing[0];
      if (!usage) {
        usage = await base44.entities.AgentUsage.create({ userId: profileId, agentName: 'guide_chatbot', period, messageCount: 0 });
      }
      if ((usage.messageCount ?? 0) >= WEEKLY_LIMIT) {
        setError(`Byte is limited to ${WEEKLY_LIMIT} messages per week. Try again next week.`);
        return false;
      }
      await base44.entities.AgentUsage.update(usage.id, { messageCount: (usage.messageCount ?? 0) + 1, lastMessageAt: new Date().toISOString() });
      setError('');
      return true;
    } catch (e) {
      console.error('Usage check failed:', e);
      setError('Byte is temporarily unavailable. Please try again later.');
      return false;
    }
  };

  const initConversation = async () => {
    if (initialized.current) return;
    initialized.current = true;
    setLoading(true);
    try {
      const agentName = isAdmin ? 'admin_assistant' : 'guide_chatbot';
      const conv = await base44.agents.createConversation({ agent_name: agentName, metadata: { source: 'chatbot_widget' } });
      setConversation(conv);
      setMessages(conv.messages || []);
      // Subscribe for real-time updates
      unsubRef.current?.();
      unsubRef.current = base44.agents.subscribeToConversation(conv.id, (data) => {
        const msgs = data.messages || [];
        setMessages(msgs);
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant') setIsThinking(false);
      });
    } catch (e) {
      console.error('Failed to create conversation:', e);
      initialized.current = false;
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && !conversation) {
      initConversation();
    }
  }, [isOpen, isAdmin]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isThinking || isDisabled) return;
    const ok = await checkAndIncrementUsage();
    if (!ok) return;
    if (!conversation) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsThinking(true);
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: text });
    } catch (e) {
      console.error('Failed to send:', e);
      setIsThinking(false);
    }
  };

  if (isDisabled) return null;

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(v => !v)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center overflow-hidden pointer-events-auto"
        style={{
          zIndex: 9999,
          background: isAdmin
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
            : 'linear-gradient(135deg, #38bdf8, #fb923c)',
        }}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <img src={BYTE_IMAGE} alt="Byte" className="w-12 h-12 object-cover" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-40 right-4 w-80 sm:w-96 h-[30rem] flex flex-col overflow-hidden pointer-events-auto"
            style={{
              zIndex: 9999,
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.35)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.5)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 shrink-0"
              style={{
                background: isAdmin
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.85), rgba(139,92,246,0.85))'
                  : 'linear-gradient(135deg, rgba(56,189,248,0.85), rgba(251,146,60,0.85))',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '24px 24px 0 0',
              }}
            >
              <img src={BYTE_IMAGE} alt="Byte" className="w-10 h-10 rounded-full border-2 border-white/30" />
              <div className="flex-1">
                <h3 className="font-bold text-white text-base leading-tight">{isAdmin ? '🛡️ Admin AI' : 'Byte'}</h3>
                <p className="text-white/75 text-xs">{isAdmin ? 'Your personal admin assistant' : 'Your Quest Planner assistant!'}</p>
              </div>
              {isAdmin && <Sparkles className="w-4 h-4 text-yellow-300 opacity-80" />}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-white/60" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center mt-8 px-4">
                  <img src={BYTE_IMAGE} alt="Byte" className="w-14 h-14 mx-auto mb-3 opacity-80 rounded-full" />
                  <p className="text-white font-semibold text-sm">{isAdmin ? "Hi! I'm your Admin AI." : "Hi! I'm Byte!"}</p>
                  <p className="text-white/60 text-xs mt-1">
                    {isAdmin ? 'Ask me to help manage users, pets, assignments, and more.' : 'Ask about the planner, or paste an assignment to simplify it!'}
                  </p>
                </div>
              ) : (
                messages.filter(m => m.content).map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[85%] px-3.5 py-2.5 text-sm"
                      style={{
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: msg.role === 'user'
                          ? isAdmin ? 'rgba(99,102,241,0.85)' : 'rgba(56,189,248,0.85)'
                          : 'rgba(255,255,255,0.55)',
                        backdropFilter: 'blur(12px)',
                        border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.4)',
                        color: msg.role === 'user' ? '#fff' : '#1e293b',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      }}
                    >
                      {msg.role === 'user' ? (
                        <p>{msg.content}</p>
                      ) : (
                        <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-p:text-slate-800 prose-strong:text-slate-900">
                          {msg.content || '...'}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isThinking && (
                <div className="flex justify-start">
                  <div
                    className="px-4 py-2.5 flex items-center gap-2"
                    style={{
                      borderRadius: '18px 18px 18px 4px',
                      background: 'rgba(255,255,255,0.55)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.4)',
                    }}
                  >
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400"
                          animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i*0.15 }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="px-3 py-3 shrink-0"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '0 0 24px 24px',
              }}
            >
              {error && <p className="text-xs text-red-200 mb-1.5 px-1">{error}</p>}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder={isAdmin ? 'Ask your admin AI…' : 'Ask Byte…'}
                  disabled={isThinking}
                  className="flex-1 px-4 py-2 text-sm outline-none"
                  style={{
                    borderRadius: '999px',
                    background: 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    color: '#1e293b',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isThinking}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 shrink-0 transition-all"
                  style={{ background: isAdmin ? 'rgba(99,102,241,0.9)' : 'rgba(56,189,248,0.9)' }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}