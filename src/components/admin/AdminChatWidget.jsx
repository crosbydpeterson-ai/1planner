import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "admin_assistant",
        metadata: { name: "Admin Chat" }
      });
      setConversation(conv);
      setMessages(conv.messages || []);
    } catch (e) {
      console.error('Failed to create conversation:', e);
    }
  };

  const ensureConversation = async () => {
    if (conversation?.id) return conversation;
    try {
      const conv = await base44.agents.createConversation({
        agent_name: "admin_assistant",
        metadata: { name: "Admin Chat" }
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
    const text = input.trim();
    if (!text) return;
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

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-600 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform pointer-events-auto"
        style={{ zIndex: 9999 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window */}
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
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <div>
                  <h3 className="font-bold text-lg">Admin AI Assistant</h3>
                  <p className="text-red-100 text-sm">Create seasons, pets, themes & more in one go!</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-transparent">
              {loading && !messages.length ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-8">
                  <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Hi! I'm your Admin Assistant.</p>
                  <p className="text-xs mt-2 text-slate-500">Try: "Create a legendary pet called Dragon King" or "Show me spam assignments"</p>
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
                          ? 'bg-red-500/90 backdrop-blur-sm text-white'
                          : 'bg-white/10 backdrop-blur-sm border border-white/10 text-slate-200'
                      }`}
                    >
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
                  placeholder="Create a space season with rewards..."
                  className="flex-1 h-9 rounded-md border bg-white/10 border-white/10 text-white placeholder:text-slate-400 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
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