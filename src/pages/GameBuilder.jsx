import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GameRenderer from '@/components/games/GameRenderer';
import SnapshotPanel from '@/components/games/SnapshotPanel';
import ReactMarkdown from 'react-markdown';

const AGENT_NAME = 'game_builder';

const SAMPLE_QUESTIONS = [
  { question: "What is 2 + 2?", options: ["3", "4", "5", "6"], correctAnswer: "4" },
  { question: "What color is the sky?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Blue" },
  { question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correctAnswer: "Paris" },
];

export default function GameBuilder() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [gameCode, setGameCode] = useState('');
  const [gameName, setGameName] = useState('');
  const [gameId, setGameId] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [snapshots, setSnapshots] = useState([]);

  const chatEndRef = useRef(null);
  const unsubRef = useRef(null);
  const lastMsgCountRef = useRef(0);
  const convRef = useRef(null);

  const agentProxy = (action, params) =>
    base44.functions.invoke('agentProxy', { action, ...params }).then(r => r.data);
  const profileId = localStorage.getItem('quest_profile_id');

  useEffect(() => {
    checkAuth();
    return () => { unsubRef.current?.(); };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentTyping]);

  const checkAuth = async () => {
    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) { setChecking(false); return; }
      const p = profiles[0];
      if (p.isGameCreator || p.rank === 'admin' || p.rank === 'super_admin') {
        setAuthorized(true);
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (editId) {
          await initEditSession(editId, p);
        } else {
          await initNewSession();
        }
      }
    } catch (e) {
      console.error('Auth check failed:', e);
    }
    setChecking(false);
  };

  const subscribe = (convId) => {
    unsubRef.current?.();
    unsubRef.current = base44.agents.subscribeToConversation(convId, (data) => {
      const msgs = data.messages || [];
      setMessages(msgs);

      // Detect if agent just finished responding
      // Only consider complete (non-streaming) assistant messages
      const assistantMsgs = msgs.filter(m => m.role === 'assistant' && m.status !== 'streaming' && m.status !== 'pending');
      const lastMsg = msgs[msgs.length - 1];
      const isAgentStreaming = lastMsg && lastMsg.role === 'assistant' && (lastMsg.status === 'streaming' || lastMsg.status === 'pending');
      const isAgentDone = lastMsg && lastMsg.role === 'assistant' && !isAgentStreaming;

      // While streaming, show typing indicator (hide bubble) — once done, clear it
      if (isAgentStreaming) {
        setAgentTyping(true);
      }

      if (assistantMsgs.length > lastMsgCountRef.current && isAgentDone) {
        lastMsgCountRef.current = assistantMsgs.length;
        setAgentTyping(false);
        // Try to extract game code from latest assistant message
        const last = assistantMsgs[assistantMsgs.length - 1];
        if (last?.content) {
          const codeMatch = last.content.match(/```(?:jsx?|javascript)?\n([\s\S]*?)```/);
          if (codeMatch) setGameCode(codeMatch[1]);
        }
        // Poll for newly saved MiniGame
        setTimeout(refreshGameFromDB, 2000);
      }
    });
  };

  const initNewSession = async () => {
    try {
      const conv = await agentProxy('create_conversation', {
        agent_name: AGENT_NAME,
        metadata: { name: 'New Game', profileId },
      });
      convRef.current = conv;
      setConversation(conv);
      setMessages(conv.messages || []);
      lastMsgCountRef.current = (conv.messages || []).filter(m => m.role === 'assistant').length;
      subscribe(conv.id);
    } catch (e) {
      console.error('Failed to create conversation:', e);
    }
  };

  const initEditSession = async (editId, p) => {
    const games = await base44.entities.MiniGame.filter({ id: editId });
    if (games.length === 0) return;
    const g = games[0];
    if (g.createdByProfileId !== profileId && p.rank !== 'admin' && p.rank !== 'super_admin') return;

    setGameId(g.id);
    setGameCode(g.gameCode || '');
    setGameName(g.name || '');
    setSnapshots(g.codeSnapshots || []);

    const conv = await agentProxy('create_conversation', {
      agent_name: AGENT_NAME,
      metadata: { name: `Editing: ${g.name}`, gameId: g.id, profileId },
    });
    convRef.current = conv;
    setConversation(conv);
    subscribe(conv.id);

    // Send initial context — subscription handles the response
    setAgentTyping(true);
    agentProxy('add_message', {
      conversation_id: conv.id,
      message: {
        role: 'user',
        content: `I want to edit my existing game "${g.name}" (MiniGame ID: ${g.id}). Here is the current code:\n\n\`\`\`\n${g.gameCode}\n\`\`\`\n\nReady for edits!`,
      },
    }).catch(e => { console.error('Init message failed:', e); setAgentTyping(false); });
  };

  const refreshGameFromDB = async () => {
    try {
      const games = await base44.entities.MiniGame.filter({ createdByProfileId: profileId });
      if (games.length === 0) return;
      const sorted = games.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      const latest = sorted[0];
      if (!gameId || latest.id === gameId) {
        setGameId(latest.id);
        setGameName(prev => prev || latest.name || '');
        if (latest.gameCode) setGameCode(latest.gameCode);
        setSnapshots(latest.codeSnapshots || []);
      }
    } catch {}
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    // If conversation not ready yet, wait up to 5s
    if (!convRef.current) {
      let waited = 0;
      while (!convRef.current && waited < 5000) {
        await new Promise(r => setTimeout(r, 200));
        waited += 200;
      }
      if (!convRef.current) return;
    }

    setInput('');
    setSending(true);
    setAgentTyping(true);
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    try {
      await agentProxy('add_message', {
        conversation_id: convRef.current.id,
        message: { role: 'user', content: text },
      });
    } catch (e) {
      console.error('Send failed:', e);
      setAgentTyping(false);
    }
    setSending(false);
  };

  const handlePublish = async () => {
    if (!gameId) return;
    setPublishing(true);
    await base44.entities.MiniGame.update(gameId, { isActive: true, isApproved: true });
    setPublishing(false);
    navigate('/Games');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

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
              questions={SAMPLE_QUESTIONS}
              onGameEnd={() => {}}
              onAnswerResult={() => {}}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
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

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !sending && (
              <div className="text-center text-sm text-slate-400 pt-8">
                <p className="text-2xl mb-2">🕹️</p>
                <p>Describe your game idea to get started!</p>
                <p className="mt-1 text-xs">e.g. "A bubble shooter where you answer math questions to shoot"</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <AgentMessage key={i} message={msg} />
            ))}
            {agentTyping && (
              <div className="flex gap-2 items-center">
                <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-2.5 flex gap-1 items-center">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <SnapshotPanel
            gameId={gameId}
            gameCode={gameCode}
            snapshots={snapshots}
            onRevert={(code) => setGameCode(code)}
            onSnapshotSaved={(updated) => setSnapshots(updated)}
          />

          <div className="p-3 border-t border-slate-100">
            <div className="flex gap-2">
              <Input
                placeholder="Describe your game or ask for changes..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !sending && handleSend()}
                className="rounded-xl"
              />
              <button
                onTouchEnd={(e) => { e.preventDefault(); if (!sending) handleSend(); }}
                onClick={() => { if (!sending) handleSend(); }}
                className="rounded-xl bg-indigo-500 text-white shrink-0 w-9 h-9 flex items-center justify-center active:opacity-70 disabled:opacity-50"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
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