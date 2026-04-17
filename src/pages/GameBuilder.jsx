import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Send, Loader2, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import GameRenderer from '@/components/games/GameRenderer';
import BuilderStylePicker from '@/components/games/BuilderStylePicker';
import BuilderLoadingChecklist from '@/components/games/BuilderLoadingChecklist';

const STEPS = {
  DESCRIBE: 'describe',
  VIBE: 'vibe',
  QUESTIONS: 'questions',
  STYLE: 'style',
  GENERATING: 'generating',
  LIVE: 'live',
};

export default function GameBuilder() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [authorized, setAuthorized] = useState(false);
  const [step, setStep] = useState(STEPS.DESCRIBE);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  // Game config
  const [gameDescription, setGameDescription] = useState('');
  const [gameVibe, setGameVibe] = useState('');
  const [questionIntegration, setQuestionIntegration] = useState('');
  const [colorTheme, setColorTheme] = useState('');
  const [font, setFont] = useState('');

  // Game state
  const [gameCode, setGameCode] = useState('');
  const [gameName, setGameName] = useState('');
  const [gameDesc, setGameDesc] = useState('');
  const [gameId, setGameId] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const chatEndRef = useRef(null);
  const profileId = localStorage.getItem('quest_profile_id');

  useEffect(() => {
    checkAuth();
    loadExistingGame();
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
        if (!params.get('edit')) {
          addBotMessage("Welcome to the Game Studio! 🎮\n\nDescribe the mini-game you want to create. Be creative — I'll build it for you!");
        }
      }
    }
  };

  const loadExistingGame = async () => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (!editId) return;
    const games = await base44.entities.MiniGame.filter({ id: editId });
    if (games.length === 0) return;
    const g = games[0];
    // Only allow editing your own games
    if (g.createdByProfileId !== profileId) return;
    setGameId(g.id);
    setGameCode(g.gameCode || '');
    setGameName(g.name || '');
    setGameDesc(g.description || '');
    setColorTheme(g.colorTheme || '');
    setFont(g.font || '');
    setGameVibe(g.gameVibe || '');
    setQuestionIntegration(g.questionIntegration || '');
    setStep(STEPS.LIVE);
    setMessages([{ role: 'assistant', content: `Editing **${g.name}**! Tell me what changes you'd like to make.` }]);
  };

  const addBotMessage = (text, component = null) => {
    setMessages(prev => [...prev, { role: 'assistant', content: text, component }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');

    if (step === STEPS.DESCRIBE) {
      addUserMessage(text);
      setGameDescription(text);
      setSending(true);
      setTimeout(() => {
        addBotMessage("That sounds like a blast! 🔥\n\nQuestion 1 of 3:\nShould this game feel like a **soothing and zen-like puzzle**, or an **intense and fast-paced challenge**? Or something in between?");
        setStep(STEPS.VIBE);
        setSending(false);
      }, 600);
    } else if (step === STEPS.VIBE) {
      addUserMessage(text);
      setGameVibe(text);
      setSending(true);
      setTimeout(() => {
        addBotMessage("Perfectly chill choice! ✨\n\nQuestion 2 of 3:\nHow should the app test what you know? For example:\n\n• **Answer to get ammo** — run out of ammo, answer a question to reload\n• **Answer to revive** — lose a life, answer correctly to continue\n• **Answer to unlock** — answer to open the next level/area\n\nOr describe your own idea!");
        setStep(STEPS.QUESTIONS);
        setSending(false);
      }, 600);
    } else if (step === STEPS.QUESTIONS) {
      addUserMessage(text);
      setQuestionIntegration(text);
      setSending(true);
      setTimeout(() => {
        addBotMessage("Perfect! Now let's make it visually stunning. 🎨\n\nQuestion 3 of 3:", 'style_picker');
        setStep(STEPS.STYLE);
        setSending(false);
      }, 600);
    } else if (step === STEPS.LIVE) {
      // Edit mode
      addUserMessage(text);
      setSending(true);
      try {
        const res = await base44.functions.invoke('generateGameCode', {
          action: 'edit',
          existingCode: gameCode,
          editPrompt: text,
          colorTheme,
          font,
        });
        const newCode = res.data.code;
        setGameCode(newCode);
        addBotMessage(`Done! ${res.data.changeDescription || 'Updated the game.'}`);
        // Update in DB if saved
        if (gameId) {
          await base44.entities.MiniGame.update(gameId, { gameCode: newCode });
        }
      } catch (e) {
        addBotMessage(`Sorry, I hit an error: ${e.message}. Try rephrasing your request.`);
      }
      setSending(false);
    }
  };

  const handleStyleConfirm = (selectedColor, selectedFont) => {
    setColorTheme(selectedColor);
    setFont(selectedFont);
    addUserMessage(`Theme: ${selectedColor}, Font: ${selectedFont}`);
    generateGame(selectedColor, selectedFont);
  };

  const generateGame = async (color, selectedFont) => {
    setStep(STEPS.GENERATING);
    addBotMessage("Awesome choices! Let me build your game... 🛠️", 'loading_checklist');

    try {
      const res = await base44.functions.invoke('generateGameCode', {
        action: 'generate',
        gameDescription,
        gameVibe,
        questionIntegration,
        colorTheme: color,
        font: selectedFont,
      });

      const code = res.data.code;
      const name = res.data.name || 'Mini Game';
      const desc = res.data.description || gameDescription;

      setGameCode(code);
      setGameName(name);
      setGameDesc(desc);

      // Save to DB
      const savedGame = await base44.entities.MiniGame.create({
        name,
        description: desc,
        gameCode: code,
        createdByProfileId: profileId,
        createdByUsername: profile?.username || '',
        colorTheme: color,
        font: selectedFont,
        gameVibe,
        questionIntegration,
        isActive: false, // not published yet
      });
      setGameId(savedGame.id);

      // Generate thumbnail in background
      base44.functions.invoke('generateGameCode', {
        action: 'generateThumbnail',
        gameName: name,
        gameDescription: desc,
        colorTheme: color,
      }).then(thumbRes => {
        if (thumbRes.data.thumbnailUrl) {
          base44.entities.MiniGame.update(savedGame.id, { thumbnailUrl: thumbRes.data.thumbnailUrl });
        }
      }).catch(() => {});

      setStep(STEPS.LIVE);
      addBotMessage(`Your game **${name}** is ready! 🎮\n\nYou can see it on the left. Want to make changes? Just tell me!\n\nExamples:\n• "Make it faster"\n• "Change the colors to purple"\n• "Add a high score counter"\n• "Fix the bug where X happens"`);
    } catch (e) {
      addBotMessage(`Error generating game: ${e.message}. Please try again.`);
      setStep(STEPS.DESCRIBE);
    }
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
        {step === STEPS.LIVE && (
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
          {step === STEPS.GENERATING ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="w-20 h-20 mx-auto mb-6 border-4 border-slate-700 rounded-2xl flex items-center justify-center">
                  <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-slate-400">Building your game...</p>
              </div>
            </div>
          ) : gameCode ? (
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
                <p className="text-slate-400">Your game will appear here</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: AI Chat */}
        <div className="w-80 md:w-96 border-l border-slate-200 bg-white flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <span className="font-semibold text-slate-800">AI Builder</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <ChatMessage key={i} message={msg} onStyleConfirm={handleStyleConfirm} />
            ))}
            {sending && (
              <div className="flex gap-2 items-center text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          {step !== STEPS.GENERATING && step !== STEPS.STYLE && (
            <div className="p-3 border-t border-slate-100">
              <div className="flex gap-2">
                <Input
                  placeholder={step === STEPS.LIVE ? "Ask for changes..." : "Type your message..."}
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
          )}
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message, onStyleConfirm }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[90%] ${isUser ? 'order-last' : ''}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-slate-800 text-white rounded-br-md'
              : 'bg-slate-100 text-slate-700 rounded-bl-md'
          }`}>
            {message.content.split('\n').map((line, i) => (
              <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
                {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={j}>{part.slice(2, -2)}</strong>
                    : part
                )}
              </p>
            ))}
          </div>
        )}
        {message.component === 'style_picker' && (
          <div className="mt-3">
            <BuilderStylePicker onConfirm={onStyleConfirm} />
          </div>
        )}
        {message.component === 'loading_checklist' && (
          <div className="mt-3">
            <BuilderLoadingChecklist />
          </div>
        )}
      </div>
    </div>
  );
}