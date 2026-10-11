import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import confetti from 'canvas-confetti';
import {
  getDailyRewardEligibility,
  getEffectiveIndex,
  getChicagoDayOfMonth,
  getMsUntilNextChicagoMidnight,
  formatCountdown,
} from '@/lib/dailyRewardUtils';
import { claimDailyReward, claimBonusSpin } from '@/lib/dailyRewardClaim';
import RewardTrack from './RewardTrack';
import TodayRewardCard from './TodayRewardCard';
import BonusSpinsCard from './BonusSpinsCard';
import SpinWheel from './SpinWheel';

export default function DailyRewardsPanel({ profile, progress, config, onProfileUpdate, onProgressUpdate }) {
  const [claiming, setClaiming] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [showBonusWheel, setShowBonusWheel] = useState(false);
  const [wheelBusy, setWheelBusy] = useState(false);
  const [bonusWheelBusy, setBonusWheelBusy] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [revealed, setRevealed] = useState(null);
  const [lastDailyAwarded, setLastDailyAwarded] = useState(null);

  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
    []
  );

  const eligibility = useMemo(() => getDailyRewardEligibility(progress, config), [progress, config]);
  const period = useMemo(() => {
    if (config?.scheduleType === 'streak14') return 14;
    if (config?.scheduleType === 'monthly') return 31;
    return 7;
  }, [config]);
  const effectiveIndex = useMemo(() => getEffectiveIndex(progress, config), [progress, config]);
  const todayReward = config?.rewards?.[effectiveIndex] || null;
  const streak = progress?.streakCount || 0;
  const wheelEnabled = !!config?.wheel?.enabled;

  const tomorrowIndex = useMemo(() => {
    if (config?.scheduleType === 'monthly') return Math.min(30, getChicagoDayOfMonth());
    const p = config?.scheduleType === 'streak14' ? 14 : 7;
    return (effectiveIndex + 1) % p;
  }, [config, effectiveIndex]);
  const tomorrowReward = config?.rewards?.[tomorrowIndex] || null;

  useEffect(() => {
    const update = () => setCountdown(formatCountdown(getMsUntilNextChicagoMidnight()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const fireConfetti = () => {
    if (prefersReducedMotion) return;
    try { confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } }); } catch { /* noop */ }
  };

  const handleClaim = async () => {
    if (claiming || !eligibility.canClaim || !todayReward) return;
    if (todayReward.type === 'wheel' && wheelEnabled) {
      setShowWheel(true);
      return;
    }
    setClaiming(true);
    try {
      const result = await claimDailyReward(profile, progress, config);
      if (result.ok) {
        onProfileUpdate(result.profile);
        onProgressUpdate(result.progress);
        setLastDailyAwarded(result.awarded);
        setRevealed(result);
        fireConfetti();
      } else {
        if (result.progress) onProgressUpdate(result.progress);
      }
    } catch {
      // network or unexpected error
    }
    setClaiming(false);
  };

  // Structured callback for SpinWheel — returns { ok, error, awarded, ... }
  const handleWheelResult = useCallback(async (prize) => {
    try {
      const result = await claimDailyReward(profile, progress, config, prize);
      if (result.ok) {
        onProfileUpdate(result.profile);
        onProgressUpdate(result.progress);
        setLastDailyAwarded(result.awarded);
        setRevealed(result);
        fireConfetti();
        setWheelBusy(false);
        setShowWheel(false);
      } else {
        if (result.progress) onProgressUpdate(result.progress);
        setWheelBusy(false);
      }
      return result;
    } catch {
      setWheelBusy(false);
      return { ok: false, error: 'exception' };
    }
  }, [profile, progress, config, onProfileUpdate, onProgressUpdate]);

  const handleBonusSpinResult = useCallback(async (prize) => {
    try {
      const result = await claimBonusSpin(profile, progress, config, prize);
      if (result.ok) {
        onProfileUpdate(result.profile);
        onProgressUpdate(result.progress);
        setRevealed(result);
        fireConfetti();
        setBonusWheelBusy(false);
        setShowBonusWheel(false);
      } else {
        if (result.progress) onProgressUpdate(result.progress);
        setBonusWheelBusy(false);
      }
      return result;
    } catch {
      setBonusWheelBusy(false);
      return { ok: false, error: 'exception' };
    }
  }, [profile, progress, config, onProfileUpdate, onProgressUpdate]);

  const handleWheelBusyChange = useCallback((busy) => setWheelBusy(busy), []);
  const handleBonusBusyChange = useCallback((busy) => setBonusWheelBusy(busy), []);

  if (!config) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center text-slate-500 border border-slate-100">
        <Gift className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p>Daily rewards are not configured.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
          <Gift className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Daily Rewards</h2>
          <p className="text-sm text-slate-500">A little reward for your daily progress.</p>
        </div>
      </div>

      {/* Reward track */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-800">
            {config.scheduleType === 'monthly' ? 'Your reward month' :
             config.scheduleType === 'streak14' ? 'Your 14-day track' : 'Your reward week'}
          </h3>
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-sm font-medium">
              <Flame className="w-3.5 h-3.5" />
              {streak}-day streak
            </div>
          )}
        </div>
        <RewardTrack
          rewards={config.rewards || []}
          period={period}
          effectiveIndex={effectiveIndex}
          progress={progress}
          scheduleType={config.scheduleType}
        />
      </div>

      {/* Today's reward / claimed state */}
      <TodayRewardCard
        reward={todayReward}
        eligibility={eligibility}
        claiming={claiming}
        onClaim={handleClaim}
        countdown={countdown}
        lastAwarded={lastDailyAwarded}
        tomorrowReward={tomorrowReward}
        wheelEnabled={wheelEnabled}
      />

      {/* Bonus spins */}
      <BonusSpinsCard
        tokens={progress?.bonusWheelTokens || 0}
        onUseSpin={() => setShowBonusWheel(true)}
        disabled={bonusWheelBusy}
      />

      {/* Daily wheel dialog */}
      <Dialog
        open={showWheel}
        onOpenChange={(open) => { if (!open && wheelBusy) return; setShowWheel(open); }}
      >
        <DialogContent
          className={wheelBusy ? '[&>button]:hidden' : ''}
          onEscapeKeyDown={(e) => { if (wheelBusy) e.preventDefault(); }}
          onInteractOutside={(e) => { if (wheelBusy) e.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle>Spin for your reward</DialogTitle>
          </DialogHeader>
          <SpinWheel
            prizes={config?.wheel?.prizes || []}
            onResult={handleWheelResult}
            onBusyChange={handleWheelBusyChange}
          />
        </DialogContent>
      </Dialog>

      {/* Bonus wheel dialog */}
      <Dialog
        open={showBonusWheel}
        onOpenChange={(open) => { if (!open && bonusWheelBusy) return; setShowBonusWheel(open); }}
      >
        <DialogContent
          className={bonusWheelBusy ? '[&>button]:hidden' : ''}
          onEscapeKeyDown={(e) => { if (bonusWheelBusy) e.preventDefault(); }}
          onInteractOutside={(e) => { if (bonusWheelBusy) e.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle>Bonus Spin</DialogTitle>
          </DialogHeader>
          <SpinWheel
            prizes={config?.wheel?.prizes || []}
            onResult={handleBonusSpinResult}
            onBusyChange={handleBonusBusyChange}
          />
        </DialogContent>
      </Dialog>

      {/* Reward reveal overlay — one clear reveal after confirmed success */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setRevealed(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-4xl mb-2">🎉</div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Reward Claimed!</h3>
              <p className="text-slate-600">{revealed.awarded}</p>
              <Button onClick={() => setRevealed(null)} className="mt-4 w-full bg-purple-600 hover:bg-purple-700">
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}