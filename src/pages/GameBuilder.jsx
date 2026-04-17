import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GameRenderer from '@/components/games/GameRenderer';
import ReactMarkdown from 'react-markdown';

const AGENT_NAME = 'game_builder';

export default function GameBuilder() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [gameCode, setGameCode] = useState('');
  const [gameName, setGameName] = useState('');
  const [gameId, setGameId] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const chatEndRef = useRef(null);
  const profileId = localStorage.getItem('quest_profile_id');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkAuth = async () => {
    const profiles = await base44.entities.UserProfile.filter({ id: profileId });
    if (profiles.length > 0) {
      const p = profiles[0];
      setProfile(p);
      if (p.isGameCreator || p.rank === 'admin' || p.rank === 'super_admin') {
        setAuthorized(true);
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (editId) {
          await loadExistingGame(editId, p);
        } else {
          await startNewConversation();
        }
      }
    }
  };

  const startNewConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: 'New Game Build' },
    });
    setConversation(conv);
    subscribeToConversation(conv.id);
    setMessages(conv.messages || []);
  };

  const loadExistingGame = async (editId, p) => {
    const games = await base44.entities.MiniGame.filter({ id: editId });
    if (games.length === 0) return;
    const g = games[0];
    if (g.createdByProfileId !== profileId && p.rank !== 'admin' && p.rank !== 'super_admin') return;

    setGameId(g.id);
    setGameCode(g.gameCode || '');
    setGameName(g.name || '');

    const conv = await base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: `Editing: ${g.name}`, gameId: g.id },
    });
    setConversation(conv);
    subscribeToConversation(conv.id);

    // Seed the agent with context about the game being edited
    const seedMsg = `I want to edit my existing game called "${g.name}" (ID: ${g.id}). Here is the current game code:\n\n\`\`\`\n${g.gameCode}\n\`\`\`\n\nOriginal description: ${g.gamePrompt || g.description || 'N/A'}. What changes would you like to make?`;
    const updated = await base44.agents.addMessage(conv, { role: 'user', content: seedMsg });
    setMessages(updated.messages || []);
  };

  const subscribeToConversation = (convId) => {
    base44.agents.subscribeToConversation(convId, (data) => {
      setMessages(data.messages || []);

      // Try to extract game code from latest assistant message
      const lastMsg = [...(data.messages || [])].reverse().find(m => m.role === 'assistant');
      if (lastMsg?.content) {
        const codeMatch = lastMsg.content.match(/```(?:jsx?|javascript)?\n([\s\S]*?)```/);
        if (codeMatch) {
          setGameCode(codeMatch[1]);
        }
        // Try to extract game name
        const nameMatch = lastMsg.content.match(/\*\*([^*]+)\*\* is ready/i);
        if (nameMatch) setGameName(nameMatch[1]);
      }

      // Check if a MiniGame was created/updated by the agent
      (async () => {
        try {
          const games = await base44.entities.MiniGame.filter({ createdByProfileId: profileId });
          const latest = games.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
          if (latest) {
            setGameId(latest.id);
            setGameName(latest.name || '');
            if (latest.gameCode) setGameCode(latest.gameCode);
          }
        } catch {}
      })();
    });
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !conversation) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    const updated = await base44.agents.addMessage(conversation, { role: 'user', content: text });
    setMessages(updated.messages || []);
    setSending(false);
  };

  const handlePublish = async () => {
    if (!gameId) return;
    setPublishing(true);
    await base44.entities.MiniGame.update(gameId, { isActive: true, isApproved: true });
    setPublishing(false);
    navigate('/Games');
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Access Required</h2>
          <p className="text-slate-500 mb-4">You need Game Creator permissions to build games.</p>
          <Button onClick={() => navigate('/Games')} variant="outline">Back to Games</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Bar */}
      <div className="h-14 border-b border-slate-200 bg-white flex items-center px-4 gap-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/Games')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎮</span>
          <span className="font-semibold text-slate-800">{gameName || 'New Game'}</span>
        </div>
        <div className="flex-1" />
        {gameId && (
          <Button
            onClick={handlePublish}
            disabled={publishing}
            className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl gap-2"
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Publish
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Game Preview */}
        <div className="flex-1 bg-slate-900 relative">
          {gameCode ? (
            <GameRenderer
              gameCode={gameCode}
              questions={[
                { question: "What is 2 + 2?", options: ["3", "4", "5", "6"], correctAnswer: "4" },
                { question: "What color is the sky?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Blue" },
                { question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correctAnswer: "Paris" },
              ]}
              onGameEnd={() => {}}
              onAnswerResult={() => {}}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-slate-500">
                <div className="text-6xl mb-4">🎮</div>
                <p className="text-slate-400">Your game will appear here once built</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Agent Chat */}
        <div className="w-80 md:w-96 border-l border-slate-200 bg-white flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="font-semibold text-slate-800">AI Game Builder</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <AgentMessage key={i} message={msg} />
            ))}
            {sending && (
              <div className="flex gap-2 items-center text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100">
            <div className="flex gap-2">
              <Input
                placeholder="Describe your game or ask for changes..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="rounded-xl"
                disabled={sending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                size="icon"
                className="rounded-xl bg-indigo-500 text-white shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgentMessage({ message }) {
  const isUser = message.role === 'user';
  if (!message.content) return null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? 'bg-slate-800 text-white rounded-br-md'
          : 'bg-slate-100 text-slate-700 rounded-bl-md'
      }`}>
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}