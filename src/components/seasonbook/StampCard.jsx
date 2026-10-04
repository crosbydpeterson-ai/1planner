import React, { useState, useEffect, useMemo } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import StampArt from '@/components/seasonbook/StampArt';
import { getStampMaskStyle } from '@/components/seasonbook/stampMask';
import { isPetEquipped, isThemeEquipped, isTitleEquipped } from '@/lib/equipHelpers';

const EQUIP_LABEL = { pet: 'Equip Pet', theme: 'Equip Theme', title: 'Equip Title' };
const isEquippableType = (t) => t === 'pet' || t === 'theme' || t === 'title';

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
  // Song/playlist rewards grant permanent access — check the unlock inventory.
  if (reward.type === 'song') return (profile.unlockedTrackIds || []).includes(reward.value);
  if (reward.type === 'playlist') return (profile.unlockedPlaylistIds || []).includes(reward.value);
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

export default function StampCard({ reward, rewardIndex, isOwned, petCache, themeCache, trackCache, playlistCache, profile, onEquip, equipping, equippingKey }) {
  const [imgError, setImgError] = useState(false);
  // Track rule: original array indexes 0,2,4… = Free; 1,3,5… = Plus
  const isPlus = rewardIndex % 2 === 1;

  const myKey = `${reward.type}:${rewardIndex}`;
  const isThisEquipping = equippingKey === myKey;

  // Equipped status uses the shared helpers so it matches the Collection page,
  // including standalone-theme precedence over pet themes.
  const isEquipped =
    reward.type === 'pet' ? isPetEquipped(profile, reward.value)
    : reward.type === 'theme' ? isThemeEquipped(profile, reward.value)
    : reward.type === 'title' ? isTitleEquipped(profile, (reward.value || reward.name || '').trim())
    : false;

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

  const trackDisplay = useMemo(() => {
    if (reward.type !== 'song' || !reward.value) return null;
    const t = trackCache?.[reward.value];
    return t ? { name: t.title, coverUri: t.coverImageUri } : null;
  }, [reward, trackCache]);

  const playlistDisplay = useMemo(() => {
    if (reward.type !== 'playlist' || !reward.value) return null;
    const p = playlistCache?.[reward.value];
    return p ? { name: p.name, coverUri: p.coverImageUri } : null;
  }, [reward, playlistCache]);

  useEffect(() => { setImgError(false); }, [petDisplay?.image, trackDisplay?.coverUri, playlistDisplay?.coverUri]);

  // A custom pet/theme whose underlying record no longer exists can't be equipped.
  // A broken image URL alone does NOT block equipping — only a missing record.
  const assetMissing = isOwned && isEquippableType(reward.type) &&
    ((reward.type === 'pet' && !petDisplay) || (reward.type === 'theme' && !themeDisplay));
  // Show the equip area for any owned pet/theme/title; the area branches into
  // Asset-missing / Equipped / Equip button.
  const showEquipArea = isOwned && isEquippableType(reward.type);

  const displayName = isOwned ? (petDisplay?.name || themeDisplay?.name || trackDisplay?.name || playlistDisplay?.name || reward.name || reward.value || 'Reward') : '???';
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
          <StampArt reward={reward} isOwned={isOwned} petDisplay={petDisplay} themeDisplay={themeDisplay} trackDisplay={trackDisplay} playlistDisplay={playlistDisplay} imgError={imgError} onImgError={() => setImgError(true)} />
        </div>

        <div className="mt-3 text-center text-[15px] md:text-base font-extrabold leading-tight text-[#3E1F7A] line-clamp-1 min-h-[20px]" aria-hidden="true">
          {displayName}
        </div>
        <div className="mt-1.5 flex justify-center" aria-hidden="true">
          <span className={cn('text-[11px] font-bold px-4 py-0.5 rounded-full', isOwned ? trackPill : 'bg-[#E4DDEC] text-[#7E7396]')}>
            {isOwned ? (isPlus ? 'Plus' : 'Free') : 'Not collected'}
          </span>
        </div>

        {showEquipArea && (
          <div className="mt-1.5 mb-1 flex justify-center">
            {assetMissing ? (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#E4DDEC] text-[#9A8AB0]">Asset missing</span>
            ) : isEquipped ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[#4ADE80] text-white shadow-sm">
                <Check className="w-3 h-3" strokeWidth={4} /> Equipped
              </span>
            ) : (
              <button
                type="button"
                disabled={equipping}
                onClick={() => onEquip?.(reward, rewardIndex)}
                className={cn(
                  'inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-1.5 rounded-full border-2 transition-colors min-h-[36px]',
                  isThisEquipping
                    ? 'bg-[#7C4DFF] border-[#B79CFF] text-white cursor-wait'
                    : 'bg-[#6A3FE0] border-[#B79CFF] text-white hover:bg-[#7C4DFF] active:bg-[#5730C4]',
                  equipping && !isThisEquipping && 'opacity-50 cursor-not-allowed hover:bg-[#6A3FE0]'
                )}
              >
                {isThisEquipping ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Equipping…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" /> {EQUIP_LABEL[reward.type]}
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}