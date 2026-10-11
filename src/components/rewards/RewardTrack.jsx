import React from 'react';
import { Check, Star, Coins, PawPrint, Palette, Tag, Gift, Lock, Disc3 } from 'lucide-react';
import { getChicagoDateKey } from '@/lib/dailyRewardUtils';

const REWARD_ICONS = {
  xp: Star,
  coins: Coins,
  pet: PawPrint,
  theme: Palette,
  title: Tag,
  wheel: Disc3,
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

function Slot({ idx, reward, isClaimed, isReady, isToday, scheduleType }) {
  const Icon = REWARD_ICONS[reward.type] || Gift;
  const label = getRewardLabel(reward);

  return (
    <div
      className={`flex-shrink-0 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center gap-1 border-2 transition-all snap-start ${
        isReady
          ? 'border-purple-500 bg-gradient-to-b from-purple-50 to-white shadow-md'
          : isClaimed
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-slate-100 bg-white'
      }`}
      style={{ width: '4.5rem' }}
    >
      <div className={`text-[10px] font-semibold ${
        isReady ? 'text-purple-600' : isClaimed ? 'text-emerald-600' : 'text-slate-400'
      }`}>
        {scheduleType === 'monthly' ? `Day ${idx + 1}` : `Day ${idx + 1}`}
      </div>

      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
        isClaimed
          ? 'bg-emerald-100'
          : isReady
            ? 'bg-purple-100'
            : 'bg-slate-50'
      }`}>
        {isClaimed ? (
          <Check className="w-4 h-4 text-emerald-600" />
        ) : (
          <Icon className={`w-4 h-4 ${isReady ? 'text-purple-600' : 'text-slate-400'}`} />
        )}
      </div>

      <div className={`text-[10px] sm:text-[11px] font-medium text-center leading-tight min-h-[1.5rem] ${
        isReady ? 'text-purple-700' : isClaimed ? 'text-emerald-600' : 'text-slate-500'
      }`}>
        {label}
      </div>

      {isReady && (
        <div className="text-[9px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
          Ready
        </div>
      )}
      {isClaimed && !isReady && (
        <div className="text-[9px] text-emerald-500 font-semibold">Claimed</div>
      )}
      {!isClaimed && !isReady && (
        <Lock className="w-3 h-3 text-slate-300" />
      )}
    </div>
  );
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

  // 7-day on tablet/desktop: evenly distributed grid
  if (period === 7) {
    return (
      <>
        {/* Mobile: horizontal scroll with snap */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-hide sm:hidden">
          {slots.map((s) => (
            <Slot key={s.idx} {...s} scheduleType={scheduleType} />
          ))}
        </div>
        {/* Tablet/desktop: 7-column grid */}
        <div className="hidden sm:grid sm:grid-cols-7 sm:gap-3">
          {slots.map((s) => (
            <Slot key={s.idx} {...s} scheduleType={scheduleType} />
          ))}
        </div>
      </>
    );
  }

  // 14-day / monthly: horizontal scroll with snap
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-hide">
      {slots.map((s) => (
        <Slot key={s.idx} {...s} scheduleType={scheduleType} />
      ))}
    </div>
  );
}