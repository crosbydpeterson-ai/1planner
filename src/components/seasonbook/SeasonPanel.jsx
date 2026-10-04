import React from 'react';
import { format } from 'date-fns';
import StampCard, { isRewardOwned } from '@/components/seasonbook/StampCard';
import { getSeasonEmoji } from '@/components/seasonbook/seasonIcons';
import { parseSeasonDate, getSeasonStatus } from '@/lib/seasonUtils';

const STATUS_TEXT = { current: 'Current season', upcoming: 'Upcoming season', ended: 'Ended season' };

export default function SeasonPanel({ season, now, profile, claimedKeys, collectedCount, petCache, themeCache, onEquip, equipping, equippingKey }) {
  const rewards = season.rewards || [];
  const status = getSeasonStatus(season, now);

  return (
    <div className="rounded-[36px] border-[5px] border-[#B79CFF] bg-gradient-to-b from-[#6A3FE0] via-[#5A30CC] to-[#4824AE] p-5 md:p-7 shadow-[0_12px_0_rgba(25,8,70,0.5)]">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-5xl md:text-6xl drop-shadow-lg shrink-0" aria-hidden="true">{getSeasonEmoji(season.name)}</span>
          <div className="min-w-0">
            <h2 className="text-3xl md:text-[42px] leading-none font-black uppercase text-white tracking-tight drop-shadow-[0_3px_0_rgba(40,10,110,0.5)] break-words">
              {season.name}
            </h2>
            <p className="text-[#D9CCFF] text-base md:text-lg font-semibold mt-1">
              {format(parseSeasonDate(season.startDate), 'MMMM')} • {STATUS_TEXT[status] || 'Ended season'}
            </p>
          </div>
        </div>
        <div className="self-start shrink-0 whitespace-nowrap rounded-2xl border-[3px] border-[#B79CFF] bg-[#3A1C94] px-5 py-2 text-lg font-bold text-white">
          <span className="text-yellow-300 font-black">{collectedCount} of {rewards.length}</span> collected
        </div>
      </div>

      {rewards.length === 0 ? (
        <p className="text-center text-[#D9CCFF] font-semibold py-16">No rewards in this season yet.</p>
      ) : (
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mt-6">
          {rewards.map((reward, index) => (
            <StampCard
              key={`${season.id}-${index}-${reward.type}-${reward.value || reward.name}`}
              reward={reward}
              rewardIndex={index}
              isOwned={isRewardOwned(reward, index, season.id, profile, claimedKeys)}
              petCache={petCache}
              themeCache={themeCache}
              profile={profile}
              onEquip={onEquip}
              equipping={equipping}
              equippingKey={equippingKey}
            />
          ))}
        </div>
      )}

      <p className="text-center text-[#C9B8F5] text-sm font-medium mt-6">
        Collected rewards stay yours after a season ends.
      </p>
    </div>
  );
}