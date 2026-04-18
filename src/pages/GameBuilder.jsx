import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GameRenderer from '@/components/games/GameRenderer';
import SnapshotPanel from '@/components/games/SnapshotPanel';

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
  const [working, setWorking] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [gameName, setGameName] = useState('');
  const [gameId, setGameId] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [profile, setProfile] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const chatEndRef = useRef(null);
  const conversationIdRef = useRef(null);
  const gameIdRef = useRef(null);
  const gameCodeRef = useRef('');
  const gamePollRef = useRef(null);
  const convoPollRef = useRef(null);
  const profileId = localStorage.getItem('quest_profile_id');

  useEffect(() => { checkAuth(); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, working]);

  useEffect(() => { gameIdRef.current = gameId; }, [gameId]);
  useEffect(() => { gameCodeRef.current = gameCode; }, [gameCode]);
  useEffect(() => { conversationIdRef.current = conversationId; }, [conversationId]);

  useEffect(() => () => {
    if (gamePollRef.current) clearInterval(gamePollRef.current);
    if (convoPollRef.current) clearInterval(convoPollRef.current);
  }, []);

  const checkAuth = async () => {
    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) { setChecking(false); return; }
      const p = profiles[0];
      setProfile(p);
      if (p.isGameCreator || p.rank === 'admin' || p.rank === 'super_admin') {
        setAuthorized(true);
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (editId) {
          await loadExistingGame(editId, p);
        } else {
          setMessages([{
            role: 'assistant',
            content: "👋 Hey! Describe the mini-game you want to build and I'll create it. Try something like: \"A bubble shooter where you answer math questions to shoot\".",
          }]);
        }
      }
    } catch (e) {
      console.error('Auth check failed:', e);
    }
    setChecking(false);
  };

  const loadExistingGame = async (editId, p) => {
    const games = await base44.entities.MiniGame.filter({ id: editId });
    if (games.length === 0) return;
    const g = games[0];
    if (g.createdByProfileId !== profileId && p.rank !== 'admin' && p.rank !== 'super_admin') return;

    setGameId(g.id);
    gameIdRef.current = g.id;
    setGameCode(g.gameCode || '');
    gameCodeRef.current = g.gameCode || '';
    setGameName(g.name || '');
    setSnapshots(g.codeSnapshots || []);
    setMessages([{
      role: 'assistant',
      content: `Loaded **${g.name}**. Tell me what changes you'd like to make.`,
    }]);
  };

  const ensureConversation = async () => {
    if (conversationIdRef.current) return conversationIdRef.current;
    if (!profile) throw new Error('Profile not loaded');
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    const res = await base44.functions.invoke('gameBuilderAgent', {
      action: 'create',
      profileId: profile.id,
      username: profile.username,
      editingGameId: editId || null,
    });
    const convo = res.data?.conversation;
    if (!convo?.id) throw new Error('Could not start conversation');
    setConversationId(convo.id);
    conversationIdRef.current = convo.id;
    startConvoPolling(convo.id);
    return convo.id;
  };

  // Poll the agent conversation for streamed assistant messages
  const startConvoPolling = (id) => {
    if (convoPollRef.current) clearInterval(convoPollRef.current);
    const started = Date.now();
    convoPollRef.current = setInterval(async () => {
      try {
        const res = await base44.functions.invoke('gameBuilderAgent', {
          action: 'get',
          conversationId: id,
        });
        const convo = res.data?.conversation;
        if (convo?.messages) {
          const mapped = convo.messages
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .map(m => {
              // Strip our internal context prefix from user messages for display
              let content = m.content || '';
              content = content.replace(/^\[(Editing MiniGame id:[^\]]+|Creating new game[^\]]+)\]\s*(User request:|Game idea:)?\s*/i, '');
              return {
                role: m.role,
                content,
                tool_calls: m.tool_calls || [],
              };
            })
            // Collapse assistant messages that are just tool-call placeholders into a single "working" indicator at the end
            .filter((m, idx, arr) => {
              if (m.role === 'assistant' && !m.content) {
                // Only keep the last empty assistant message (as working indicator)
                const laterEmpty = arr.slice(idx + 1).some(x => x.role === 'assistant' && !x.content);
                return !laterEmpty;
              }
              return true;
            });
          setMessages(mapped);

          // Detect when the agent is done working (last message is assistant with content, no pending tool calls)
          const last = convo.messages[convo.messages.length - 1];
          if (last && last.role === 'assistant' && last.content) {
            const hasPending = (last.tool_calls || []).some(tc =>
              tc.status && !['completed', 'success', 'failed', 'error'].includes(tc.status)
            );
            if (!hasPending) setWorking(false);
          }
        }
        // Stop after 5 min max
        if (Date.now() - started > 300000) {
          clearInterval(convoPollRef.current);
          convoPollRef.current = null;
        }
      } catch (e) {
        console.error('Convo poll error:', e);
      }
    }, 2500);
  };

  // Poll MiniGame to pick up agent-created or agent-updated games for preview
  const startGamePolling = (initialCreatedAt) => {
    if (gamePollRef.current) clearInterval(gamePollRef.current);
    const started = Date.now();
    gamePollRef.current = setInterval(async () => {
      try {
        if (gameIdRef.current) {
          const rows = await base44.entities.MiniGame.filter({ id: gameIdRef.current });
          if (rows.length > 0) {
            const g = rows[0];
            if (g.gameCode && g.gameCode !== gameCodeRef.current) {
              setGameCode(g.gameCode);
              gameCodeRef.current = g.gameCode;
              setGameName(g.name || '');
              setSnapshots(g.codeSnapshots || []);
            }
          }
        } else {
          const mine = await base44.entities.MiniGame.filter(
            { createdByProfileId: profileId },
            '-created_date',
            3
          );
          const fresh = mine.find(g => new Date(g.created_date).getTime() > initialCreatedAt && g.gameCode);
          if (fresh) {
            setGameId(fresh.id);
            gameIdRef.current = fresh.id;
            setGameCode(fresh.gameCode);
            gameCodeRef.current = fresh.gameCode;
            setGameName(fresh.name || 'Mini Game');
            setSnapshots(fresh.codeSnapshots || []);
          }
        }
        if (Date.now() - started > 300000) {
          clearInterval(gamePollRef.current);
          gamePollRef.current = null;
        }
      } catch (e) {
        console.error('Game poll error:', e);
      }
    }, 3000);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || working) return;

    setInput('');
    setWorking(true);
    // Optimistic user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);

    try {
      const convoId = await ensureConversation();

      const contextualMessage = gameIdRef.current
        ? `[Editing MiniGame id: ${gameIdRef.current}] User request: ${text}`
        : `[Creating new game for profileId: ${profileId}, username: ${profile?.username || 'Creator'}] Game idea: ${text}`;

      startGamePolling(Date.now() - 1000);

      await base44.functions.invoke('gameBuilderAgent', {
        action: 'send',
        conversationId: convoId,
        content: contextualMessage,
      });
      // Agent runs async on backend; polling handles UI updates.
    } catch (e) {
      console.error('Send error:', e);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${e.message || 'Unknown error'}. Try again?`,
      }]);
      setWorking(false);
    }
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

        {/* Right: Chat */}
        <div className="w-80 md:w-96 border-l border-slate-200 bg-white flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="font-semibold text-slate-800">AI Game Builder</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} />
            ))}
            {working && (
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
                placeholder={gameId ? 'Ask for a change...' : 'Describe your game...'}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !working && handleSend()}
                disabled={working}
                className="rounded-xl"
              />
              <button
                onTouchEnd={(e) => { e.preventDefault(); if (!working) handleSend(); }}
                onClick={() => { if (!working) handleSend(); }}
                disabled={working}
                className="rounded-xl bg-indigo-500 text-white shrink-0 w-9 h-9 flex items-center justify-center active:opacity-70 disabled:opacity-50"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const hasToolCalls = message.tool_calls && message.tool_calls.length > 0;

  // Assistant message with no text yet — show subtle "working" hint instead of a full bubble
  if (!isUser && !message.content && hasToolCalls) {
    return (
      <div className="flex justify-start">
        <div className="text-xs text-slate-400 italic px-2">🔧 Working on it...</div>
      </div>
    );
  }

  if (!message.content) return null;
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-slate-800 text-white rounded-br-md'
          : 'bg-slate-100 text-slate-700 rounded-bl-md'
      }`}>
        {message.content}
      </div>
    </div>
  );
}