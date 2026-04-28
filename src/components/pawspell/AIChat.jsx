import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AIChat({ board, currentTurn, myColor, isOpen, onToggle }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "🐉 I'm your Paw & Spell advisor! Ask me anything about the game, tactics, or your current position." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const boardStr = board.map((row, r) =>
        row.map((cell, c) => cell ? `${cell}@${r},${c}` : '').filter(Boolean).join(' ')
      ).join(' | ');
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a friendly Paw & Spell advisor (a dark-fantasy chess game). Current board: ${boardStr}. Current turn: ${currentTurn === 'w' ? 'White' : 'Black'}. User is playing as: ${myColor === 'w' ? 'White' : 'Black'}. Pieces: wP=White Sprite (pawn), wR=White Golem (rook), wN=White Gryphon (knight), wB=White Wisp (bishop), wQ=White Dragon (queen), wK=White Unicorn (king). Answer this: ${userMsg}. Be concise, fun, and thematic. Max 3 sentences.`,
      });
      setMessages(prev => [...prev, { role: 'assistant', text: res }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "The crystal ball is foggy... try again!" }]);
    }
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-24 right-4 w-12 h-12 bg-purple-700 hover:bg-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-900/50 z-40 border border-purple-500"
      >
        <MessageSquare className="w-5 h-5 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-slate-950 border border-purple-700 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden" style={{ maxHeight: 360 }}>
      <div className="flex items-center justify-between px-4 py-2 bg-purple-900/60 border-b border-purple-700">
        <span className="text-purple-200 text-sm font-bold">🐉 Advisor</span>
        <button onClick={onToggle}><X className="w-4 h-4 text-purple-400" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 260 }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${m.role === 'user' ? 'bg-purple-700 text-white' : 'bg-slate-800 text-purple-200 border border-purple-800'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-xl px-3 py-2 text-xs text-purple-400 border border-purple-800">
              <span className="animate-pulse">🔮 Consulting the oracle...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 p-2 border-t border-purple-800">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Ask for advice..."
          className="text-xs bg-slate-900 border-purple-700 text-purple-200 placeholder:text-purple-500"
        />
        <Button size="icon" onClick={sendMessage} disabled={loading} className="bg-purple-700 hover:bg-purple-600 shrink-0">
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}