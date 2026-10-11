import React from 'react';
import { Gift, Check, Star, Coins, PawPrint, Palette, Tag, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REWARD_ICONS = {
  xp: Star, coins: Coins, pet: PawPrint, theme: Palette, title: Tag, wheel: Gift,
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
    case 'already_claimed': return { text: 'Claimed today', color: 'text-slate-500', icon: Check };
    case 'need_assignment': return { text: 'Complete a quest today to unlock', color: 'text-slate-500', icon: null };
    case 'no_config': return { text: 'Reward configuration unavailable', color: 'text-slate-500', icon: null };
    case 'loading': return { text: 'Loading…', color: 'text-slate-500', icon: null };
    default: return { text: 'Reward unavailable', color: 'text-slate-500', icon: null };
  }
}

export default function TodayRewardCard({ reward, eligibility, claiming, onClaim, countdown }) {
  const TodayIcon = reward ? (REWARD_ICONS[reward.type] || Gift) : Gift;
  const status = getStatusInfo(eligibility.reason);
  const StatusIcon = status.icon;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-amber-50 flex items-center justify-center">
            <TodayIcon className="w-10 h-10 text-purple-600" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400" />
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
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl"
        >
          <Gift className="w-4 h-4 mr-2" />
          {claiming ? 'Claiming...' : 'Claim reward'}
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