import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, X, Send, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

const CONV_STORAGE_KEY = 'admin_ai_conversation_id';

// Call the backend function so we use service role auth (works outside Base44 preview)
const agentCall = (action, params = {}) =>
  base44.functions.invoke('adminAgentChat', { action, ...params }).then(r => r.data);

export default function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [initializing, setInitializing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const pollRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isThinking]);

  useEffect(() => {
    if (isOpen && !conversationId) {
      loadOrCreateConversation();
    }
  }, [isOpen]);

  // Poll for updates when thinking
  useEffect(() => {
    if (!conversationId) return;
    if (!isThinking) {
      clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const { conversation } = await agentCall('get_conversation', { conversationId });
        const msgs = conversation?.messages || [];
        setMessages(msgs);
        // Stop polling when last message is from assistant
        if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
          setIsThinking(false);
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [isThinking, conversationId]);

  const loadOrCreateConversation = async () => {
    setInitializing(true);
    try {
      const savedId = localStorage.getItem(CONV_STORAGE_KEY);
      if (savedId) {
        try {
          const { conversation } = await agentCall('get_conversation', { conversationId: savedId });
          if (conversation?.id) {
            setConversationId(conversation.id);
            setMessages(conversation.messages || []);
            setInitializing(false);
            return;
          }
        } catch (e) {
          localStorage.removeItem(CONV_STORAGE_KEY);
        }
      }
      const { conversation } = await agentCall('create_conversation', { agentName: 'admin_assistant' });
      setConversationId(conversation.id);
      setMessages(conversation.messages || []);
      localStorage.setItem(CONV_STORAGE_KEY, conversation.id);
    } catch (e) {
      console.error('Failed to load conversation:', e);
    }
    setInitializing(false);
  };

  const startNewConversation = async () => {
    localStorage.removeItem(CONV_STORAGE_KEY);
    setConversationId(null);
    setMessages([]);
    setIsThinking(false);
    setInitializing(true);
    try {
      const { conversation } = await agentCall('create_conversation', { agentName: 'admin_assistant' });
      setConversationId(conversation.id);
      setMessages(conversation.messages || []);
      localStorage.setItem(CONV_STORAGE_KEY, conversation.id);
    } catch (e) {
      console.error('Failed to create conversation:', e);
    }
    setInitializing(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !conversationId) return;
    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsThinking(true);
    try {
      await agentCall('send_message', { conversationId, message: text });
    } catch (e) {
      console.error('Failed to send message:', e);
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform pointer-events-auto"
        style={{ zIndex: 9999 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-96 h-[32rem] bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10 pointer-events-auto"
            style={{ zIndex: 9999 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500/90 to-orange-600/90 backdrop-blur-sm text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <div>
                    <h3 className="font-bold text-lg">Admin AI Assistant</h3>
                    <p className="text-red-100 text-sm">Create seasons, pets, themes & more!</p>
                  </div>
                </div>
                <button
                  onClick={startNewConversation}
                  title="Start new conversation"
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {initializing ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-8">
                  <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Hi! I'm your Admin Assistant.</p>
                  <p className="text-xs mt-2 text-slate-500">Try: "Create a legendary pet called Dragon King" or "Gift 100 coins to Crosby"</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-red-500/90 text-white'
                        : 'bg-white/10 border border-white/10 text-slate-200'
                    }`}>
                      {msg.role === 'user' ? (
                        <p className="text-sm">{msg.content}</p>
                      ) : (
                        <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          {msg.content || '...'}
                        </ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))
              )}

              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                    <span className="text-sm text-slate-400">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="p-3 border-t border-white/10 bg-slate-900/50 backdrop-blur-sm"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Create a space season with rewards..."
                  disabled={initializing || !conversationId}
                  className="flex-1 h-9 rounded-md border bg-white/10 border-white/10 text-white placeholder:text-slate-400 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || initializing || !conversationId || isThinking}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
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