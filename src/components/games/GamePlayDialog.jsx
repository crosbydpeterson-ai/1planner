import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClipboardList, Keyboard, Loader2, Trophy, Coins, Sparkles, X } from 'lucide-react';
import GameRenderer from './GameRenderer';

export default function GamePlayDialog({ game, profile, onClose }) {
  const [step, setStep] = useState('pick'); // pick, loading, playing, results
  const [assignments, setAssignments] = useState([]);
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    const all = await base44.entities.Assignment.filter({ isApproved: true });
    setAssignments(all.slice(0, 20));
  };

  const startWithAssignment = async (assignment) => {
    setLoadingQuestions(true);
    setStep('loading');
    // Check if questions already exist
    const existing = await base44.entities.GameQuestion.filter({ assignmentId: assignment.id });
    if (existing.length > 0 && existing[0].questions?.length > 0) {
      setQuestions(existing[0].questions);
      setLoadingQuestions(false);
      setStep('playing');
      return;
    }
    // Generate new
    const res = await base44.functions.invoke('generateGameCode', {
      action: 'generateQuestions',
      assignmentTitle: assignment.title,
      assignmentDescription: assignment.description,
      pdfUrl: assignment.pdfUrl || null,
      questionCount: 10,
    });
    const qs = res.data.questions || [];
    await base44.entities.GameQuestion.create({ assignmentId: assignment.id, questions: qs });
    setQuestions(qs);
    setLoadingQuestions(false);
    setStep('playing');
  };

  const startWithTopic = async () => {
    if (!topic.trim()) return;
    setLoadingQuestions(true);
    setStep('loading');
    const existing = await base44.entities.GameQuestion.filter({ topic: topic.trim() });
    if (existing.length > 0 && existing[0].questions?.length > 0) {
      setQuestions(existing[0].questions);
      setLoadingQuestions(false);
      setStep('playing');
      return;
    }
    const res = await base44.functions.invoke('generateGameCode', {
      action: 'generateQuestions',
      topic: topic.trim(),
      questionCount: 10,
    });
    const qs = res.data.questions || [];
    await base44.entities.GameQuestion.create({ topic: topic.trim(), questions: qs });
    setQuestions(qs);
    setLoadingQuestions(false);
    setStep('playing');
  };

  const handleGameEnd = async (gameResults) => {
    const correctAnswers = gameResults.correctAnswers || 0;
    const survivalTime = gameResults.survivalTime || 0;
    const xpEarned = (correctAnswers * 25) + Math.floor(survivalTime / 10) * 5;
    const coinsEarned = correctAnswers * 10;

    // Update profile
    const freshProfiles = await base44.entities.UserProfile.filter({ id: profile.id });
    const freshProfile = freshProfiles[0] || profile;
    await base44.entities.UserProfile.update(freshProfile.id, {
      xp: (freshProfile.xp || 0) + xpEarned,
      questCoins: (freshProfile.questCoins || 0) + coinsEarned,
    });

    // Save session
    await base44.entities.GameSession.create({
      userProfileId: profile.id,
      miniGameId: game.id,
      score: gameResults.score || 0,
      xpEarned,
      coinsEarned,
      correctAnswers,
      totalQuestions: gameResults.totalQuestions || questions.length,
      survivalTime,
    });

    // Increment play count
    await base44.entities.MiniGame.update(game.id, { playCount: (game.playCount || 0) + 1 });

    setResults({ ...gameResults, xpEarned, coinsEarned });
    setStep('results');
  };

  if (step === 'playing') {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-50 p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </button>
        <GameRenderer
          gameCode={game.gameCode}
          questions={questions}
          onGameEnd={handleGameEnd}
        />
      </div>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {step === 'pick' && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Ready to play {game.name}?</h2>
            <p className="text-sm text-slate-500 mb-6">Pick a subject to study while you play</p>

            {/* Topic input */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2 text-sm font-medium text-slate-700">
                <Keyboard className="w-4 h-4" /> Type a topic
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Fractions, The Water Cycle..."
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="rounded-xl"
                  onKeyDown={e => e.key === 'Enter' && startWithTopic()}
                />
                <Button onClick={startWithTopic} disabled={!topic.trim()} className="rounded-xl bg-indigo-500 text-white">
                  Go
                </Button>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400 my-3">— or pick an assignment —</div>

            {/* Assignment list */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {assignments.map(a => (
                <button
                  key={a.id}
                  onClick={() => startWithAssignment(a)}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-200 transition-colors flex items-center gap-3"
                >
                  <ClipboardList className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{a.title}</div>
                    <div className="text-xs text-slate-400">{a.subject}</div>
                  </div>
                </button>
              ))}
              {assignments.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-4">No assignments found. Type a topic instead!</p>
              )}
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="p-10 flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-700 font-medium">Generating questions...</p>
            <p className="text-sm text-slate-400 mt-1">This only takes a moment</p>
          </div>
        )}

        {step === 'results' && results && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Game Over!</h2>
            <p className="text-slate-500 mb-6">Score: {results.score || 0}</p>

            <div className="flex justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-lg font-bold text-indigo-600">
                  <Sparkles className="w-5 h-5" />+{results.xpEarned}
                </div>
                <div className="text-xs text-slate-400">XP Earned</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-lg font-bold text-amber-600">
                  <Coins className="w-5 h-5" />+{results.coinsEarned}
                </div>
                <div className="text-xs text-slate-400">Coins Earned</div>
              </div>
            </div>

            <div className="text-sm text-slate-500 mb-6">
              {results.correctAnswers}/{results.totalQuestions || questions.length} correct answers
            </div>

            <Button onClick={onClose} className="w-full rounded-xl bg-indigo-500 text-white">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}