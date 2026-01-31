import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bug, Bot, X, Send, Loader2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function DebugChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (isOpen && !conversation) initConversation();
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
        agent_name: 'debug_worker',
        metadata: { name: 'Debug Worker' }
      });
      setConversation(conv);
      setMessages(conv.messages || []);
    } catch (e) {
      console.error('Failed to create debug conversation:', e);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !conversation) return;
    setInput('');
    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: text });
    } catch (e) { console.error('Failed to send message:', e); }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center"><Bug className="w-4 h-4 text-red-400" /></div>
        <div>
          <h3 className="text-white font-semibold">Debug Worker AI</h3>
          <p className="text-xs text-slate-400">Ask it to nudge hats/glasses, or fix a user by name.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-800/60 px-3 py-2 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-slate-300" />
          <span className="text-slate-200 text-sm">Debug Console</span>
        </div>

        {/* Messages */}
        <div className="h-64 overflow-y-auto p-3 space-y-2 bg-slate-900/40">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 text-sm mt-6">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-60" />
              <p>Try: "Move hat down 8% for user Crosby"</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-red-500/80 text-white' : 'bg-white/10 border border-white/10 text-slate-200'}`}>
                  {m.role === 'user' ? (
                    <p>{m.content}</p>
                  ) : (
                    <ReactMarkdown className="prose prose-sm prose-invert max-w-none">
                      {m.content || '...'}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-2 border-t border-slate-700 bg-slate-900/50">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="e.g., Adjust glasses y +4% for @student"
              className="flex-1 bg-white/10 border-white/10 text-white placeholder:text-slate-400"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || !conversation} size="icon" className="bg-red-500 hover:bg-red-600">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}