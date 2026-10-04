import React from 'react';
import { cn } from '@/lib/utils';
import { getSeasonEmoji } from '@/components/seasonbook/seasonIcons';

export default function SeasonSelector({ seasons, selectedId, onSelect }) {
  return (
    <div className="mx-auto w-full max-w-4xl rounded-3xl border-2 border-[#8E6BEA]/60 bg-[#3A1C94]/80 p-1.5 shadow-[0_5px_0_rgba(25,8,70,0.45)] overflow-x-auto scrollbar-hide">
      <div className="flex gap-1.5 min-w-max md:min-w-0">
        {seasons.map((s) => {
          const selected = s.id === selectedId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              aria-pressed={selected}
              className={cn(
                'flex-1 min-w-[170px] flex items-center justify-center gap-2 rounded-2xl border-[3px] px-4 py-2.5 text-base font-bold whitespace-nowrap transition-colors',
                selected
                  ? 'border-yellow-300 bg-[#6A3FE0] text-white shadow-[0_0_14px_rgba(253,224,71,0.35)]'
                  : 'border-transparent bg-[#2C1577] text-[#B9A6F0] hover:text-white hover:bg-[#341A88]'
              )}
            >
              <span className="text-lg" aria-hidden="true">{getSeasonEmoji(s.name)}</span>
              <span className="max-w-[260px] truncate">{s.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}