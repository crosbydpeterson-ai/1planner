import React from 'react';
import { Gift, Check, Star, Coins, PawPrint, Palette, Tag, Disc3, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REWARD_ICONS = {
  xp: Star, coins: Coins, pet: PawPrint, theme: Palette, title: Tag, wheel: Disc3,
};

function getRewardLabel(reward) {
  if (!reward) return '—';
  if (reward.type === 'xp') return `+${reward.amount || 0} XP`;
  if (reward.type === 'coins') return `+${reward.amount || 0} Coins`;
  if (reward.type === 'pet') return reward.name || 'New Pet';
  if (reward.type === 'theme') return reward.name || 'New Theme';
  if (reward.type === 'title') return reward.value || 'New Title';
  if (reward.type === 'wheel') return 'Spin the Wheel';
  return '';
}

function getStatusInfo(reason) {
  switch (reason) {
    case 'ready': return { text: 'Quest completed • Ready to claim', color: 'text-emerald-600', icon: Check };
    case 'already_claimed': return { text: 'Reward collected!', color: 'text-emerald-600', icon: Check };
    case 'need_assignment': return { text: 'Complete a quest today to unlock', color: 'text-slate-500', icon: null };
    case 'no_config': return { text: 'Reward configuration unavailable', color: 'text-slate-500', icon: null };
    case 'loading': return { text: 'Loading…', color: 'text-slate-500', icon: null };
    default: return { text: 'Reward unavailable', color: 'text-slate-500', icon: null };
  }
}

function MiniRewardPreview({ reward, label }) {
  if (!reward) return null;
  const Icon = REWARD_ICONS[reward.type] || Gift;
  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{label}</div>
        <div className="text-xs font-semibold text-slate-600 truncate">{getRewardLabel(reward)}</div>
      </div>
    </div>
  );
}

export default function TodayRewardCard({ reward, eligibility, claiming, onClaim, countdown, lastAwarded, tomorrowReward, wheelEnabled }) {
  const isClaimed = eligibility.reason === 'already_claimed';
  const isWheel = reward?.type === 'wheel' && wheelEnabled;
  const TodayIcon = reward ? (REWARD_ICONS[reward.type] || Gift) : Gift;
  const status = getStatusInfo(eligibility.reason);
  const StatusIcon = status.icon;

  // --- Claimed state: compact, positive ---
  if (isClaimed) {
    const awardedLabel = lastAwarded || (reward && !isWheel ? getRewardLabel(reward) : null);
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-emerald-700">Reward collected!</div>
            {awardedLabel ? (
              <div className="text-sm text-slate-600 truncate">{awardedLabel}</div>
            ) : (
              <div className="text-sm text-slate-400">Come back tomorrow for more.</div>
            )}
          </div>
        </div>

        {tomorrowReward && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500">Tomorrow</span>
            </div>
            <MiniRewardPreview reward={tomorrowReward} label="Next reward" />
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Next reset in {countdown}
          </span>
          <span>Daily reset: Central Time</span>
        </div>
      </div>
    );
  }

  // --- Ready / locked state ---
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="relative">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
            eligibility.canClaim
              ? 'bg-gradient-to-br from-purple-100 to-amber-50'
              : 'bg-slate-100'
          }`}>
            <TodayIcon className={`w-10 h-10 ${eligibility.canClaim ? 'text-purple-600' : 'text-slate-400'}`} />
          </div>
          {eligibility.canClaim && <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400" />}
        </div>

        <div>
          <div className="text-sm text-slate-500">Today's reward</div>
          <div className="text-2xl font-bold text-slate-800">{getRewardLabel(reward)}</div>
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          {StatusIcon && <StatusIcon className={`w-4 h-4 ${status.color}`} />}
          <span className={status.color}>{status.text}</span>
        </div>

        <Button
          onClick={onClaim}
          disabled={!eligibility.canClaim || !reward || claiming}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl"
        >
          {claiming ? 'Claiming…' : isWheel ? '🎡 Spin for reward' : 'Claim reward'}
        </Button>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Next reset in {countdown}
        </span>
        <span>Daily reset: Central Time</span>
      </div>
    </div>
  );
}