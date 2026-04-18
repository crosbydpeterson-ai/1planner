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

const DEFAULT_THEME = 'Electric Blue';
const DEFAULT_FONT = 'Inter';

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

  const chatEndRef = useRef(null);
  const profileId = localStorage.getItem('quest_profile_id');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, working]);

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
    setGameCode(g.gameCode || '');
    setGameName(g.name || '');
    setSnapshots(g.codeSnapshots || []);
    setMessages([{
      role: 'assistant',
      content: `Loaded **${g.name}**. Tell me what changes you'd like to make.`,
    }]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || working) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setWorking(true);

    try {
      if (!gameId) {
        // CREATE flow
        setMessages(prev => [...prev, { role: 'assistant', content: '🎮 Building your game... this takes about a minute.' }]);
        const res = await base44.functions.invoke('generateGameCode', {
          action: 'generate',
          gameDescription: text,
          gameVibe: 'fun and engaging',
          questionIntegration: 'questions appear periodically during gameplay',
          colorTheme: DEFAULT_THEME,
          font: DEFAULT_FONT,
        });
        const { code, name, description } = res.data || {};
        if (!code) throw new Error('No code generated');

        const newGame = await base44.entities.MiniGame.create({
          name: name || 'Mini Game',
          description: description || text.slice(0, 100),
          gameCode: code,
          gamePrompt: text,
          colorTheme: DEFAULT_THEME,
          font: DEFAULT_FONT,
          questionIntegration: 'periodic',
          gameVibe: 'fun and engaging',
          createdByProfileId: profileId,
          createdByUsername: profile?.username || 'Creator',
          isActive: false,
          isApproved: true,
        });

        setGameId(newGame.id);
        setGameCode(code);
        setGameName(name || 'Mini Game');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✨ **${name}** is ready! ${description || ''}\n\nPreview it on the left. Ask me to tweak anything, or click **Publish** when you're happy.`,
        }]);

        // Generate thumbnail in background
        base44.functions.invoke('generateGameCode', {
          action: 'generateThumbnail',
          gameName: name,
          gameDescriptionForThumb: description,
          colorTheme: DEFAULT_THEME,
        }).then(t => {
          if (t.data?.thumbnailUrl) {
            base44.entities.MiniGame.update(newGame.id, { thumbnailUrl: t.data.thumbnailUrl });
          }
        }).catch(() => {});

      } else {
        // EDIT flow
        setMessages(prev => [...prev, { role: 'assistant', content: '🔧 Applying your changes...' }]);
        const res = await base44.functions.invoke('generateGameCode', {
          action: 'edit',
          existingCode: gameCode,
          editPrompt: text,
          colorTheme: DEFAULT_THEME,
          font: DEFAULT_FONT,
        });
        const { code } = res.data || {};
        if (!code) throw new Error('No code returned');

        await base44.entities.MiniGame.update(gameId, { gameCode: code });
        setGameCode(code);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '✅ Done! Check the preview.',
        }]);
      }
    } catch (e) {
      console.error('Build error:', e);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ Something went wrong: ${e.message || 'Unknown error'}. Try again?`,
      }]);
    }

    setWorking(false);
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