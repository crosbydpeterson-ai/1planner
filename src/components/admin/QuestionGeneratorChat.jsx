import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Bot, User, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function QuestionGeneratorChat({ adminProfile }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState(false);
  const pollRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewSession = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setLoading(true);
    setMessages([]);
    setConversationId(null);
    try {
      const profileId = adminProfile?.id || localStorage.getItem('quest_profile_id');
      const username = adminProfile?.username || localStorage.getItem('quest_username') || 'admin';
      const res = await base44.functions.invoke('questionGeneratorAgent', {
        action: 'create',
        profileId,
        username,
      });
      const convo = res.data.conversation;
      setConversationId(convo.id);
      setMessages(convo.messages || []);
    } catch (e) {
      console.error('Failed to start session', e);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || thinking) return;
    const content = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content }]);
    setThinking(true);

    try {
      await base44.functions.invoke('questionGeneratorAgent', {
        action: 'send',
        conversationId,
        content,
      });

      // Poll for response
      pollRef.current = setInterval(async () => {
        try {
          const res = await base44.functions.invoke('questionGeneratorAgent', {
            action: 'get',
            conversationId,
          });
          const convo = res.data.conversation;
          const msgs = convo.messages || [];
          setMessages(msgs);

          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant' && last?.content) {
            clearInterval(pollRef.current);
            setThinking(false);
          }
        } catch (e) {
          console.error('Poll error', e);
        }
      }, 1500);
    } catch (e) {
      console.error('Send error', e);
      setThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">AI Question Generator</h3>
          <p className="text-slate-400 text-sm mt-1 max-w-sm">
            Chat with the AI to generate quiz questions for assignments. Tell it a topic, paste in text, or share a PDF URL.
          </p>
        </div>
        <Button onClick={startNewSession} disabled={loading} className="bg-gradient-to-r from-emerald-500 to-teal-600">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          Start New Session
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Bot className="w-4 h-4 text-emerald-400" /> Question Generator
        </h3>
        <Button size="sm" variant="ghost" onClick={startNewSession} className="text-slate-400 hover:text-white">
          <Plus className="w-4 h-4 mr-1" /> New Session
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
        {messages.filter(m => m.role === 'user' || m.role === 'assistant').map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-700 text-slate-100'
            }`}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="bg-slate-700 rounded-xl px-3 py-2">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe a topic, paste text, or share a PDF URL..."
          className="bg-slate-700 border-slate-600 text-white resize-none min-h-[60px] max-h-[120px]"
          rows={2}
        />
        <Button
          onClick={sendMessage}
          disabled={!input.trim() || thinking}
          className="bg-emerald-600 hover:bg-emerald-700 self-end px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}