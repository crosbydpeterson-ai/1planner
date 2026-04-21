import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ClipboardList, Keyboard, Loader2, Trophy, Coins, Sparkles, X, Star } from 'lucide-react';
import GameRenderer from './GameRenderer';
import GameLeaderboard from './GameLeaderboard';
import { PETS } from '@/components/quest/PetCatalog';

export default function GamePlayDialog({ game, profile, onClose }) {
  const [step, setStep] = useState('pick'); // pick, loading, playing, results
  const [assignments, setAssignments] = useState([]);
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [petPrize, setPetPrize] = useState(null); // pet won this session
  const [myBestBefore, setMyBestBefore] = useState(null); // best score before this game

  useEffect(() => {
    loadAssignments();
    loadMyBest();
  }, []);

  const loadAssignments = async () => {
    const all = await base44.entities.Assignment.filter({ isApproved: true });
    setAssignments(all.slice(0, 20));
  };

  const loadMyBest = async () => {
    if (!profile?.id) return;
    try {
      const sessions = await base44.entities.GameSession.filter({ miniGameId: game.id, userProfileId: profile.id });
      if (sessions.length > 0) {
        const best = sessions.sort((a, b) => b.score - a.score)[0];
        setMyBestBefore(best.score);
      }
    } catch {}
  };

  // Get equipped pet display info
  const getEquippedPet = () => {
    const petId = profile?.equippedPetId;
    if (!petId) return null;
    const cleanId = String(petId).replace('custom_', '');
    return PETS.find(p => p.id === cleanId || p.id === petId) || null;
  };

  const equippedPet = getEquippedPet();

  const generateQuestionsViaAgent = async (_prompt, saveData) => {
    const payload = { action: 'generateQuestions', questionCount: 10 };
    if (saveData.assignmentId) {
      const a = assignments.find(x => x.id === saveData.assignmentId);
      payload.assignmentTitle = a?.title || '';
      payload.assignmentDescription = a?.description || '';
      if (a?.pdfUrl) payload.pdfUrl = a.pdfUrl;
    } else if (saveData.topic) {
      payload.topic = saveData.topic;
    }
    const res = await base44.functions.invoke('generateGameCode', payload);
    const qs = res.data?.questions || [];
    if (qs.length > 0) {
      await base44.entities.GameQuestion.create({ ...saveData, questions: qs });
    }
    return qs;
  };

  const startWithAssignment = async (assignment) => {
    setLoadingQuestions(true);
    setStep('loading');
    const existing = await base44.entities.GameQuestion.filter({ assignmentId: assignment.id, miniGameId: game.id });
    if (existing.length > 0 && existing[0].questions?.length > 0) {
      setQuestions(existing[0].questions);
      setLoadingQuestions(false);
      setStep('playing');
      return;
    }
    const prompt = `Generate 10 multiple-choice questions for the assignment titled "${assignment.title}". Description: ${assignment.description || 'N/A'}.${assignment.pdfUrl ? ` PDF: ${assignment.pdfUrl}` : ''} Return them as a JSON array in a code block, each with fields: question, options (array of 4), correctAnswer.`;
    const qs = await generateQuestionsViaAgent(prompt, { assignmentId: assignment.id, miniGameId: game.id });
    setQuestions(qs);
    setLoadingQuestions(false);
    setStep('playing');
  };

  const startWithTopic = async () => {
    if (!topic.trim()) return;
    setLoadingQuestions(true);
    setStep('loading');
    const existing = await base44.entities.GameQuestion.filter({ topic: topic.trim(), miniGameId: game.id });
    if (existing.length > 0 && existing[0].questions?.length > 0) {
      setQuestions(existing[0].questions);
      setLoadingQuestions(false);
      setStep('playing');
      return;
    }
    const prompt = `Generate 10 multiple-choice questions about "${topic.trim()}". Return them as a JSON array in a code block, each with fields: question, options (array of 4), correctAnswer.`;
    const qs = await generateQuestionsViaAgent(prompt, { topic: topic.trim(), miniGameId: game.id });
    setQuestions(qs);
    setLoadingQuestions(false);
    setStep('playing');
  };

  // Chance to win a random pet prize (10% base, +5% per perfect answer above 7)
  const rollPetPrize = async (correctAnswers, totalQuestions) => {
    const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
    const chance = accuracy >= 1.0 ? 0.40 : accuracy >= 0.8 ? 0.20 : 0.08;
    if (Math.random() > chance) return null;

    // Pick a random common/uncommon pet the user doesn't own
    const unlockedPets = profile?.unlockedPets || [];
    const eligiblePets = PETS.filter(p =>
      (p.rarity === 'common' || p.rarity === 'uncommon') &&
      !unlockedPets.includes(p.id)
    );
    if (eligiblePets.length === 0) return null;
    return eligiblePets[Math.floor(Math.random() * eligiblePets.length)];
  };

  const handleGameEnd = async (gameResults) => {
    const correctAnswers = gameResults.correctAnswers || 0;
    const survivalTime = gameResults.survivalTime || 0;
    const xpEarned = (correctAnswers * 25) + Math.floor(survivalTime / 10) * 5;
    const coinsEarned = correctAnswers * 10;

    // Check for new high score
    const newScore = gameResults.score || 0;
    const isNewHighScore = myBestBefore === null || newScore > myBestBefore;

    // Roll for pet prize
    const wonPet = await rollPetPrize(correctAnswers, gameResults.totalQuestions || questions.length);
    setPetPrize(wonPet || null);

    // Update profile: XP, coins, and optionally unlock pet
    const freshProfiles = await base44.entities.UserProfile.filter({ id: profile.id });
    const freshProfile = freshProfiles[0] || profile;
    const updates = {
      xp: (freshProfile.xp || 0) + xpEarned,
      questCoins: (freshProfile.questCoins || 0) + coinsEarned,
    };
    if (wonPet) {
      updates.unlockedPets = [...new Set([...(freshProfile.unlockedPets || []), wonPet.id])];
    }
    await base44.entities.UserProfile.update(freshProfile.id, updates);

    // Save session
    await base44.entities.GameSession.create({
      userProfileId: profile.id,
      miniGameId: game.id,
      score: newScore,
      xpEarned,
      coinsEarned,
      correctAnswers,
      totalQuestions: gameResults.totalQuestions || questions.length,
      survivalTime,
    });

    // Increment play count
    await base44.entities.MiniGame.update(game.id, { playCount: (game.playCount || 0) + 1 });

    setResults({ ...gameResults, xpEarned, coinsEarned, isNewHighScore });
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
        {/* Show equipped pet skin in corner */}
        {equippedPet && (
          <div className="absolute bottom-4 left-4 z-50 flex flex-col items-center opacity-80">
            <span className="text-3xl">{equippedPet.emoji}</span>
            <span className="text-white text-[10px] bg-black/40 px-1.5 rounded-full mt-0.5">{equippedPet.name}</span>
          </div>
        )}
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
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {step === 'pick' && (
          <div className="flex flex-col overflow-hidden">
            {/* Game header with equipped pet */}
            <div className="p-5 pb-3 border-b border-slate-100 flex items-center gap-3">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800">{game.name}</h2>
                <p className="text-xs text-slate-500">Pick a subject to study while you play</p>
              </div>
              {equippedPet && (
                <div className="flex flex-col items-center">
                  <span className="text-3xl">{equippedPet.emoji}</span>
                  <span className="text-[10px] text-slate-400">{equippedPet.name}</span>
                </div>
              )}
              {myBestBefore !== null && (
                <div className="text-center">
                  <div className="text-xs text-slate-400">Your Best</div>
                  <div className="font-bold text-indigo-600">{myBestBefore.toLocaleString()}</div>
                </div>
              )}
            </div>

            <Tabs defaultValue="play" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="mx-5 mt-4 mb-0">
                <TabsTrigger value="play" className="flex-1">Play</TabsTrigger>
                <TabsTrigger value="leaderboard" className="flex-1">🏆 Leaderboard</TabsTrigger>
              </TabsList>

              <TabsContent value="play" className="flex-1 overflow-y-auto p-5 pt-4 space-y-4">
                {/* Topic input */}
                <div>
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

                <div className="text-center text-xs text-slate-400">— or pick an assignment —</div>

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

                {/* Pet prize hint */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 flex items-center gap-2">
                  <Star className="w-4 h-4 shrink-0 text-amber-500" />
                  Get a perfect score for a chance to win a pet prize! 🐾
                </div>
              </TabsContent>

              <TabsContent value="leaderboard" className="flex-1 overflow-y-auto p-5 pt-4">
                <GameLeaderboard gameId={game.id} currentProfileId={profile?.id} />
              </TabsContent>
            </Tabs>
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
          <div className="p-8 text-center overflow-y-auto">
            {/* New high score banner */}
            {results.isNewHighScore && (
              <div className="mb-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl px-4 py-2 text-sm font-bold flex items-center justify-center gap-2">
                🎉 New High Score!
              </div>
            )}

            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Game Over!</h2>
            <p className="text-slate-500 mb-5">Score: <span className="font-bold text-slate-800">{results.score || 0}</span></p>

            <div className="flex justify-center gap-6 mb-5">
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

            <div className="text-sm text-slate-500 mb-5">
              {results.correctAnswers}/{results.totalQuestions || questions.length} correct answers
            </div>

            {/* Pet Prize */}
            {petPrize && (
              <div className="mb-5 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl">
                <div className="text-3xl mb-1">{petPrize.emoji}</div>
                <div className="text-sm font-bold text-purple-700">🎉 Pet Prize!</div>
                <div className="text-base font-semibold text-slate-800">{petPrize.name}</div>
                <div className="text-xs text-slate-500 mt-0.5 capitalize">{petPrize.rarity} · Added to your collection!</div>
              </div>
            )}

            {/* Equipped pet */}
            {equippedPet && !petPrize && (
              <div className="mb-4 flex items-center justify-center gap-2 text-sm text-slate-400">
                <span className="text-xl">{equippedPet.emoji}</span>
                <span>{equippedPet.name} cheered you on!</span>
              </div>
            )}

            <Button onClick={onClose} className="w-full rounded-xl bg-indigo-500 text-white">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}