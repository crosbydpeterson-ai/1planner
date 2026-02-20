import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
      const user = await base44.auth.me();
      if (!user) return false;
      const period = getPeriod();
      const existing = await base44.entities.AgentUsage.filter({ userId: user.email, agentName: 'guide_chatbot', period });
      let usage = existing[0];
      if (!usage) {
        usage = await base44.entities.AgentUsage.create({ userId: user.email, agentName: 'guide_chatbot', period, messageCount: 0 });
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

  useEffect(() => {
    if (isOpen && !conversation) {
      initConversation();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!conversation?.id) return;
    
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });

    return () => unsubscribe();
  }, [conversation?.id]);

  const initConversation = async () => {
    setLoading(true);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "guide_chatbot",
        metadata: { name: "Guide Chat" }
      });
      setConversation(conv);
      setMessages(conv.messages || []);
    } catch (e) {
      console.error('Failed to create conversation:', e);
    }
    setLoading(false);
  };

  const ensureConversation = async () => {
    if (conversation?.id) return conversation;
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "guide_chatbot",
        metadata: { name: "Guide Chat" }
      });
      setConversation(conv);
      setMessages(conv.messages || []);
      return conv;
    } catch (e) {
      console.error('Failed to create conversation:', e);
      return null;
    }
  };

  const sendMessage = async () => {
    if (isDisabled) return;
    const text = input.trim();
    if (!text) return;
    const ok = await checkAndIncrementUsage();
    if (!ok) return;
    const conv = conversation?.id ? conversation : await ensureConversation();
    if (!conv) return;
    setInput('');
    try {
      await base44.agents.addMessage(conv, {
        role: "user",
        content: text
      });
    } catch (e) {
      console.error('Failed to send message:', e);
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
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-orange-400 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform overflow-hidden"
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
            className="fixed bottom-40 right-4 z-50 w-80 sm:w-96 h-[28rem] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200"
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-200 bg-white">
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  size="icon"
                  className="bg-sky-500 hover:bg-sky-600"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}