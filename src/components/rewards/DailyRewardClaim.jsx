import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import SpinWheel from './SpinWheel';
import { toast } from 'sonner';

// config example stored in AppSetting.key = 'daily_rewards_config'
// {
//   scheduleType: 'streak7'|'streak14'|'monthly',
//   rewards: [{ type: 'xp'|'coins'|'pet'|'theme'|'title'|'wheel', value?: string, amount?: number, name?: string }],
//   wheel: { enabled: boolean, prizes: [{ label, type, value?, amount?, weight }] },
//   claimMode: 'manual',
//   requireAssignment: true
// }

export default function DailyRewardClaim({ open, onOpenChange, profile, progress, config, onClaimed }) {
  const [claiming, setClaiming] = useState(false);
  const today = new Date().toLocaleDateString('en-CA');

  const period = useMemo(() => {
    if (config?.scheduleType === 'streak14') return 14;
    if (config?.scheduleType === 'monthly') return 31;
    return 7; // default
  }, [config]);

  const effectiveIndex = useMemo(() => {
    if (!config) return 0;
    if (config.scheduleType === 'monthly') {
      const d = new Date();
      return Math.min(30, d.getDate() - 1);
    }
    const last = progress?.lastClaimDate;
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toLocaleDateString('en-CA');
    if (last === yesterday) {
      return ((progress?.currentIndex || 0) + 1) % period;
    }
    if (last === today) {
      return progress?.currentIndex || 0; // already claimed today
    }
    // missed day -> reset
    return 0;
  }, [config, period, progress, today]);

  const reward = config?.rewards?.[effectiveIndex] || null;
  const disabled = !progress?.eligible || progress?.eligibleDate !== today || progress?.lastClaimDate === today;
  const hasBonusWheel = Number(progress?.bonusWheelTokens || 0) > 0;
  const shouldShowWheel = !!(config?.wheel?.enabled && ((reward?.type === 'wheel') || hasBonusWheel));

  const grantReward = async (rwd) => {
    if (!rwd) return;
    // Clone profile to compute updates
    const updates = {};
    let successMsg = '';

    if (rwd.type === 'xp') {
      const amt = Number(rwd.amount) || 0;
      updates.xp = (profile.xp || 0) + amt;
      successMsg = `+${amt} XP awarded!`;
    } else if (rwd.type === 'coins') {
      const amt = Number(rwd.amount) || 0;
      updates.questCoins = (profile.questCoins || 0) + amt;
      successMsg = `+${amt} Quest Coins awarded!`;
    } else if (rwd.type === 'pet') {
      const id = String(rwd.value || '');
      const current = profile.unlockedPets || ['starter_slime'];
      if (!current.includes(id)) {
        updates.unlockedPets = [...current, id];
      }
      successMsg = 'Pet unlocked!';
    } else if (rwd.type === 'theme') {
      const id = String(rwd.value || '');
      const current = profile.unlockedThemes || [];
      if (!current.includes(id)) {
        updates.unlockedThemes = [...current, id];
      }
      successMsg = 'Theme unlocked!';
    } else if (rwd.type === 'title') {
      const t = String(rwd.value || '');
      const current = profile.unlockedTitles || [];
      if (!current.includes(t)) {
        updates.unlockedTitles = [...current, t];
      }
      successMsg = 'Title unlocked!';
    }

    if (Object.keys(updates).length > 0) {
      await base44.entities.UserProfile.update(profile.id, updates);
    }
    toast.success(successMsg || 'Reward claimed!');
  };

  const handleClaim = async () => {
    if (disabled || !reward) return;
    setClaiming(true);
    try {
      if (reward.type === 'wheel' && config?.wheel?.enabled) {
        // handled via SpinWheel path, skip here
        setClaiming(false);
        return;
      }
      await grantReward(reward);
      // update progress
      const nextIndex = effectiveIndex;
      const nextStreak = (progress?.lastClaimDate === new Date(new Date().setDate(new Date().getDate() - 1)).toLocaleDateString('en-CA')) ? (progress?.streakCount || 0) + 1 : 1;
      await base44.entities.DailyRewardProgress.update(progress.id, {
        lastClaimDate: today,
        currentIndex: nextIndex,
        streakCount: nextStreak,
        eligible: false
      });
      onClaimed && onClaimed({ lastClaimDate: today, currentIndex: nextIndex, streakCount: nextStreak, eligible: false });
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed to claim reward');
    }
    setClaiming(false);
  };

  const handleWheelResult = async (prize) => {
    try {
      await grantReward(prize);
      const nextIndex = effectiveIndex;
      const nextStreak = (progress?.lastClaimDate === new Date(new Date().setDate(new Date().getDate() - 1)).toLocaleDateString('en-CA')) ? (progress?.streakCount || 0) + 1 : 1;
      await base44.entities.DailyRewardProgress.update(progress.id, {
        lastClaimDate: today,
        currentIndex: nextIndex,
        streakCount: nextStreak,
        eligible: false,
        wheelLastSpinDate: today
      });
      onClaimed && onClaimed({ lastClaimDate: today, currentIndex: nextIndex, streakCount: nextStreak, eligible: false, wheelLastSpinDate: today });
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed to record spin');
    }
  };

  const handleBonusWheelResult = async (prize) => {
    try {
      await grantReward(prize);
      const tokens = Math.max(0, Number(progress?.bonusWheelTokens || 0) - 1);
      await base44.entities.DailyRewardProgress.update(progress.id, {
        bonusWheelTokens: tokens,
        wheelLastSpinDate: today
      });
      onClaimed && onClaimed({ ...progress, bonusWheelTokens: tokens, wheelLastSpinDate: today });
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed to record bonus spin');
    }
  };

   return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Daily Reward</DialogTitle>
        </DialogHeader>

        {!reward ? (
          <div className="text-slate-500 text-sm">No reward configured for today.</div>
        ) : shouldShowWheel ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">{reward?.type === 'wheel' ? 'Spin the wheel to get your reward!' : 'Bonus Spin granted by admin'}</p>
            <SpinWheel prizes={config.wheel?.prizes || []} onResult={reward?.type === 'wheel' ? handleWheelResult : handleBonusWheelResult} />
            {hasBonusWheel && reward?.type !== 'wheel' && (
              <div className="text-xs text-slate-500">Bonus spins left: {progress?.bonusWheelTokens}</div>
            )}
          </div>
        ) : (
          <div className="bg-white/60 rounded-xl p-4 border border-white/50">
            <div className="text-slate-700 text-sm">Today's reward:</div>
            <div className="text-lg font-semibold text-slate-800 mt-1 capitalize">
              {reward.type === 'xp' && `+${reward.amount || 0} XP`}
              {reward.type === 'coins' && `+${reward.amount || 0} Quest Coins`}
              {reward.type === 'pet' && `Pet: ${reward.name || reward.value}`}
              {reward.type === 'theme' && `Theme: ${reward.name || reward.value}`}
              {reward.type === 'title' && `Title: ${reward.value}`}
            </div>
          </div>
        )}

        {(!reward || (reward.type !== 'wheel')) && (
          <DialogFooter>
            <Button onClick={handleClaim} disabled={disabled || claiming} className="bg-emerald-600 hover:bg-emerald-700">
              {claiming ? 'Claiming...' : 'Claim'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}