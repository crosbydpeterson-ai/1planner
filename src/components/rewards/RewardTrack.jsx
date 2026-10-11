import React from 'react';
import { Check, Star, Coins, PawPrint, Palette, Tag, Gift } from 'lucide-react';
import { getChicagoDateKey } from '@/lib/dailyRewardUtils';

const REWARD_ICONS = {
  xp: Star,
  coins: Coins,
  pet: PawPrint,
  theme: Palette,
  title: Tag,
  wheel: Gift,
};

function getRewardLabel(reward) {
  if (!reward) return '—';
  if (reward.type === 'xp') return `+${reward.amount || 0} XP`;
  if (reward.type === 'coins') return `+${reward.amount || 0}`;
  if (reward.type === 'pet') return reward.name || 'Pet';
  if (reward.type === 'theme') return reward.name || 'Theme';
  if (reward.type === 'title') return reward.value || 'Title';
  if (reward.type === 'wheel') return 'Spin';
  return '';
}

export default function RewardTrack({ rewards, period, effectiveIndex, progress, scheduleType }) {
  const lastClaim = progress?.lastClaimDate;
  const claimedToday = lastClaim === getChicagoDateKey();

  const slots = Array.from({ length: period }, (_, idx) => {
    const reward = rewards[idx] || { type: 'xp', amount: 25 };
    const isClaimed = claimedToday ? idx <= effectiveIndex : idx < effectiveIndex;
    const isReady = idx === effectiveIndex && !claimedToday;
    return { idx, reward, isClaimed, isReady };
  });

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-hide">
      {slots.map(({ idx, reward, isClaimed, isReady }) => {
        const Icon = REWARD_ICONS[reward.type] || Gift;
        return (
          <div
            key={idx}
            className={`flex-shrink-0 w-16 sm:w-[4.5rem] rounded-2xl p-2 sm:p-2.5 flex flex-col items-center gap-1 border-2 transition-all snap-start ${
              isReady
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : isClaimed
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-100 bg-slate-50'
            }`}
          >
            <div className={`text-[10px] font-medium ${
              isReady ? 'text-indigo-600' : isClaimed ? 'text-emerald-600' : 'text-slate-400'
            }`}>
              {scheduleType === 'monthly' ? `Day ${idx + 1}` : `${idx + 1}`}
            </div>

            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center ${
              isClaimed ? 'bg-emerald-100' : isReady ? 'bg-indigo-100' : 'bg-slate-100'
            }`}>
              {isClaimed ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Icon className={`w-4 h-4 ${isReady ? 'text-indigo-600' : 'text-slate-400'}`} />
              )}
            </div>

            <div className={`text-[10px] sm:text-[11px] font-medium text-center leading-tight ${
              isReady ? 'text-indigo-700' : isClaimed ? 'text-emerald-600' : 'text-slate-500'
            }`}>
              {getRewardLabel(reward)}
            </div>

            {isReady && (
              <div className="text-[9px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                Ready
              </div>
            )}
            {isClaimed && !isReady && (
              <div className="text-[9px] text-emerald-500 font-medium">Claimed</div>
            )}
          </div>
        );
      })}
    </div>
  );
}