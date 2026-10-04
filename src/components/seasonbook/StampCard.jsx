import React, { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import StampArt from '@/components/seasonbook/StampArt';
import { getStampMaskStyle } from '@/components/seasonbook/stampMask';

// Match the existing claim-key format from Season.jsx
export function getRewardClaimKey(seasonId, reward, rewardIndex) {
  const rewardValue = reward?.value || reward?.name || 'reward';
  return `${seasonId}:${rewardIndex}:${reward.type}:${rewardValue}`;
}

// Ownership rules:
//   Permanent (pet/theme/title) → check current profile inventory
//   Consumable (coins/food/magic_egg) → check season claim record
export function isRewardOwned(reward, rewardIndex, seasonId, profile, claimedKeys) {
  if (!reward) return false;
  if (reward.type === 'pet') return (profile.unlockedPets || []).includes(reward.value);
  if (reward.type === 'theme') return (profile.unlockedThemes || []).includes(reward.value);
  if (reward.type === 'title') {
    const titleVal = (reward.value || reward.name || '').trim();
    return (profile.unlockedTitles || []).includes(titleVal);
  }
  return claimedKeys.includes(getRewardClaimKey(seasonId, reward, rewardIndex));
}

const STAMP_MASK = getStampMaskStyle(7, 26);
const PAPER_TEXTURE = {
  backgroundColor: '#F8F1E3',
  backgroundImage:
    'radial-gradient(rgba(120,90,60,0.06) 1px, transparent 1px), radial-gradient(rgba(120,90,60,0.04) 1px, transparent 1px)',
  backgroundSize: '7px 7px, 11px 11px',
  backgroundPosition: '0 0, 3px 5px',
};

export default function StampCard({ reward, rewardIndex, isOwned, petCache, themeCache }) {
  const [imgError, setImgError] = useState(false);
  // Track rule: original array indexes 0,2,4… = Free; 1,3,5… = Plus
  const isPlus = rewardIndex % 2 === 1;

  const petDisplay = useMemo(() => {
    if (reward.type !== 'pet' || !reward.value) return null;
    const val = String(reward.value);
    if (val.startsWith('custom_')) {
      const pet = petCache[val.replace('custom_', '')];
      if (pet) return { name: pet.name, image: pet.imageUrl, emoji: pet.emoji, theme: pet.theme };
    }
    const builtIn = PETS.find((p) => p.id === val);
    return builtIn ? { name: builtIn.name, image: null, emoji: builtIn.emoji, theme: builtIn.theme } : null;
  }, [reward, petCache]);

  const themeDisplay = useMemo(() => {
    if (reward.type !== 'theme' || !reward.value) return null;
    const val = String(reward.value);
    if (val.startsWith('custom_')) {
      const t = themeCache[val.replace('custom_', '')];
      if (t) return { name: t.name, primary: t.primaryColor, secondary: t.secondaryColor, accent: t.accentColor, bg: t.bgColor };
    }
    const b = THEMES.find((t) => t.id === val);
    return b ? { name: b.name, ...b.colors } : null;
  }, [reward, themeCache]);

  useEffect(() => { setImgError(false); }, [petDisplay?.image]);

  const displayName = isOwned ? (petDisplay?.name || themeDisplay?.name || reward.name || reward.value || 'Reward') : '???';
  const ariaLabel = isOwned ? displayName : `Uncollected ${reward.type === 'magic_egg' ? 'egg' : reward.type} reward`;
  const trackPill = isPlus ? 'bg-[#FF4FA3] text-white' : 'bg-[#2ED3F0] text-[#0B3A55]';

  return (
    <div className="relative drop-shadow-[0_6px_0_rgba(30,10,80,0.35)]" role="img" aria-label={ariaLabel}>
      {isOwned && (
        <div className="absolute -top-3 -right-3 z-10 w-11 h-11 rounded-full bg-[#22C55E] border-[3px] border-white shadow-md flex items-center justify-center">
          <Check className="w-6 h-6 text-white" strokeWidth={4} />
        </div>
      )}

      <div style={{ ...STAMP_MASK, ...PAPER_TEXTURE }} className="p-[16px] pt-[12px] flex flex-col">
        <div className="flex items-center justify-between h-5 px-0.5">
          <span className="text-[11px] font-bold text-[#A08BC8]">#{String(rewardIndex + 1).padStart(3, '0')}</span>
          {!isOwned && <span className="text-[10px] font-bold text-[#B5A6CF]">{isPlus ? 'Plus' : 'Free'}</span>}
        </div>

        <div className="mt-1 aspect-[16/10] w-full rounded-lg overflow-hidden ring-1 ring-black/5">
          <StampArt reward={reward} isOwned={isOwned} petDisplay={petDisplay} themeDisplay={themeDisplay} imgError={imgError} onImgError={() => setImgError(true)} />
        </div>

        <div className="mt-3 text-center text-[15px] md:text-base font-extrabold leading-tight text-[#3E1F7A] line-clamp-1 min-h-[20px]" aria-hidden="true">
          {displayName}
        </div>
        <div className="mt-1.5 mb-1 flex justify-center" aria-hidden="true">
          <span className={cn('text-[11px] font-bold px-4 py-0.5 rounded-full', isOwned ? trackPill : 'bg-[#E4DDEC] text-[#7E7396]')}>
            {isOwned ? (isPlus ? 'Plus' : 'Free') : 'Not collected'}
          </span>
        </div>
      </div>
    </div>
  );
}