import React from 'react';
import { Sparkles } from 'lucide-react';

const RARITY_COLORS = {
  common: 'text-slate-400 bg-slate-400/10',
  uncommon: 'text-emerald-400 bg-emerald-400/10',
  rare: 'text-blue-400 bg-blue-400/10',
  epic: 'text-purple-400 bg-purple-400/10',
  legendary: 'text-amber-400 bg-amber-400/10',
};

export default function PetConceptPostDisplay({ data }) {
  if (!data) return null;
  const { name, description, rarity, imageUrl } = data;
  const rarityClass = RARITY_COLORS[rarity] || RARITY_COLORS.common;

  return (
    <div className="mt-2 bg-[#2b2d31] rounded-lg border border-[#3f4147] p-3">
      <div className="flex items-start gap-3">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{name}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded capitalize ${rarityClass}`}>
              {rarity}
            </span>
          </div>
          <p className="text-xs text-[#949ba4] mt-1 line-clamp-3">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2">
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span className="text-[10px] text-amber-400 font-medium">Pet Concept Idea</span>
      </div>
    </div>
  );
}