import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { getISOWeek, getISOWeekYear } from 'date-fns';

const BYTE_IMAGE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696e36c523c92e1a3cd5dbd6/e5d1726bd_image.png";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const [isDisabled, setIsDisabled] = useState(false);
  const WEEKLY_LIMIT = 15;
  const [error, setError] = useState('');

  const getPeriod = () => {
    const now = new Date();
    const y = getISOWeekYear(now);
    const w = String(getISOWeek(now)).padStart(2, '0');
    return `${y}-W${w}`;
  };

  const checkAndIncrementUsage = async () => {
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
      await base44.entities.AgentUsage.update(usage.id, {
        messageCount: (usage.messageCount ?? 0) + 1,
        lastMessageAt: new Date().toISOString()
      });
      setError('');
      return true;
    } catch (e) {
      console.error('Usage check failed:', e);
      // Fail-safe: block to protect credits
      setError('Byte is temporarily unavailable. Please try again later.');
      return false;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        const settings = await base44.entities.AppSetting.list();
        const flag = settings.find(s => s.key === 'disable_guide_chat');
        if (flag && (flag.value?.disabled === true || flag.value === true)) {
          setIsDisabled(true);
        }
      } catch (e) {
        console.error('Failed to load guide chat setting:', e);
      }
    })();
  }, []);

  const pollRef = useRef(null);
  const [isThinking, setIsThinking] = useState(false);

  const agentCall = (action, params = {}) =>
    base44.functions.invoke('adminAgentChat', { action, agentName: 'guide_chatbot', ...params }).then(r => r.data);

  useEffect(() => {
    if (isOpen && !conversation) {
      initConversation();
    }
  }, [isOpen]);

  // Poll for assistant response
  useEffect(() => {
    if (!conversation?.id || !isThinking) {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const { conversation: conv } = await agentCall('get_conversation', { conversationId: conversation.id });
        const msgs = conv?.messages || [];
        setMessages(msgs);
        if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
          setIsThinking(false);
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [isThinking, conversation?.id]);

  const initConversation = async () => {
    setLoading(true);
    try {
      const { conversation: conv } = await agentCall('create_conversation');
      setConversation(conv);
      setMessages(conv.messages || []);
    } catch (e) {
      console.error('Failed to create conversation:', e);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (isDisabled) return;
    const text = input.trim();
    if (!text) return;
    const ok = await checkAndIncrementUsage();
    if (!ok) return;
    if (!conversation?.id) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsThinking(true);
    try {
      await agentCall('send_message', { conversationId: conversation.id, message: text });
    } catch (e) {
      console.error('Failed to send message:', e);
      setIsThinking(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return isDisabled ? null : (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-orange-400 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform overflow-hidden pointer-events-auto"
        style={{ zIndex: 9999 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <img src={BYTE_IMAGE} alt="Byte" className="w-12 h-12 object-cover" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-40 right-4 w-80 sm:w-96 h-[28rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 pointer-events-auto"
            style={{ zIndex: 9999 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-400 to-orange-400 text-white p-4 flex items-center gap-3">
              <img src={BYTE_IMAGE} alt="Byte" className="w-10 h-10 rounded-full bg-white/20" />
              <div>
                <h3 className="font-bold text-lg">Byte</h3>
                <p className="text-white/80 text-sm">Your Quest Planner assistant!</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {loading && !messages.length ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-8">
                  <img src={BYTE_IMAGE} alt="Byte" className="w-16 h-16 mx-auto mb-2 opacity-70" />
                  <p>Hi! I'm Byte!</p>
                  <p className="text-xs mt-1">Ask about the planner, or paste an assignment to simplify it!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-sm">{msg.content}</p>
                      ) : (
                        <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          {msg.content || '...'}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                    <span className="text-sm text-slate-400">Byte is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="p-3 border-t border-slate-200 bg-white"
            >
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}