import React, { useState, useEffect, useMemo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import SilhouetteIcon from '@/components/seasonbook/SilhouetteIcon';

const REWARD_TYPE_ICONS = {
  pet: '🐾',
  theme: '🎨',
  title: '🏆',
  coins: '🪙',
  magic_egg: '🥚',
  food: '🍽️'
};

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
  if (reward.type === 'pet') {
    return (profile.unlockedPets || []).includes(reward.value);
  }
  if (reward.type === 'theme') {
    return (profile.unlockedThemes || []).includes(reward.value);
  }
  if (reward.type === 'title') {
    const titleVal = (reward.value || reward.name || '').trim();
    return (profile.unlockedTitles || []).includes(titleVal);
  }
  // Consumable rewards — use the matching season claim record
  return claimedKeys.includes(getRewardClaimKey(seasonId, reward, rewardIndex));
}

// Reusable perforated-edge SVG mask (postage stamp scalloped edge)
function useStampMask() {
  return useMemo(() => {
    const circles = [];
    const step = 18;
    const r = 7;
    const vb = 200;
    for (let x = step / 2; x < vb; x += step) {
      circles.push(`<circle cx="${x}" cy="0" r="${r}" fill="transparent"/>`);
      circles.push(`<circle cx="${x}" cy="${vb}" r="${r}" fill="transparent"/>`);
    }
    for (let y = step / 2; y < vb; y += step) {
      circles.push(`<circle cx="0" cy="${y}" r="${r}" fill="transparent"/>`);
      circles.push(`<circle cx="${vb}" cy="${y}" r="${r}" fill="transparent"/>`);
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb} ${vb}" preserveAspectRatio="none"><rect width="${vb}" height="${vb}" fill="white"/>${circles.join('')}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, []);
}

function RewardArt({ reward, isOwned, petDisplay, themeDisplay, imgError, onImgError }) {
  if (reward.type === 'pet') {
    if (isOwned) {
      if (petDisplay?.image && !imgError) {
        return (
          <img
            src={petDisplay.image}
            alt={petDisplay.name || 'Pet reward'}
            className="w-20 h-20 rounded-2xl object-cover"
            onError={onImgError}
          />
        );
      }
      return <div className="text-5xl">{petDisplay?.emoji || REWARD_TYPE_ICONS.pet}</div>;
    }
    return <SilhouetteIcon type="pet" />;
  }

  if (reward.type === 'theme') {
    if (isOwned) {
      if (themeDisplay) {
        return (
          <div className="flex gap-1.5">
            <div className="w-9 h-9 rounded-full shadow ring-2 ring-white/50" style={{ backgroundColor: themeDisplay.primary }} />
            <div className="w-9 h-9 rounded-full shadow ring-2 ring-white/50" style={{ backgroundColor: themeDisplay.secondary }} />
            <div className="w-9 h-9 rounded-full shadow ring-2 ring-white/50" style={{ backgroundColor: themeDisplay.accent }} />
          </div>
        );
      }
      return <div className="text-5xl">{REWARD_TYPE_ICONS.theme}</div>;
    }
    return <SilhouetteIcon type="theme" />;
  }

  if (reward.type === 'title') {
    return (
      <div className={cn('text-center px-2 py-3', isOwned ? 'text-slate-800' : 'text-gray-400')}>
        <div className="text-base font-black uppercase leading-tight">
          {isOwned ? (reward.value || reward.name || 'Title') : '???'}
        </div>
      </div>
    );
  }

  // coins, magic_egg, food
  if (isOwned) {
    return <div className="text-5xl">{REWARD_TYPE_ICONS[reward.type] || '🎁'}</div>;
  }
  return <SilhouetteIcon type={reward.type} />;
}

export default function StampCard({ reward, rewardIndex, seasonId, isOwned, petCache, themeCache }) {
  const [imgError, setImgError] = useState(false);
  const stampMask = useStampMask();

  // Track rule: original array indexes 0,2,4… = Free; 1,3,5… = Plus
  const isPlus = rewardIndex % 2 === 1;

  const petDisplay = useMemo(() => {
    if (reward.type !== 'pet' || !reward.value) return null;
    const val = String(reward.value);
    if (val.startsWith('custom_')) {
      const pet = petCache[val.replace('custom_', '')];
      if (pet) return { name: pet.name, image: pet.imageUrl, emoji: pet.emoji };
    }
    const builtIn = PETS.find((p) => p.id === val);
    if (builtIn) return { name: builtIn.name, image: null, emoji: builtIn.emoji };
    return null;
  }, [reward, petCache]);

  const themeDisplay = useMemo(() => {
    if (reward.type !== 'theme' || !reward.value) return null;
    const val = String(reward.value);
    if (val.startsWith('custom_')) {
      const theme = themeCache[val.replace('custom_', '')];
      if (theme) return { name: theme.name, primary: theme.primaryColor, secondary: theme.secondaryColor, accent: theme.accentColor };
    }
    const builtIn = THEMES.find((t) => t.id === val);
    if (builtIn) return { name: builtIn.name, primary: builtIn.colors?.primary, secondary: builtIn.colors?.secondary, accent: builtIn.colors?.accent };
    return null;
  }, [reward, themeCache]);

  // Reset image error fallback when the image URL changes (e.g. switching seasons)
  useEffect(() => {
    setImgError(false);
  }, [petDisplay?.image]);

  const displayName = isOwned
    ? (petDisplay?.name || themeDisplay?.name || reward.name || reward.value || 'Reward')
    : '???';

  // Don't reveal names through accessible labels for unowned rewards
  const ariaLabel = isOwned ? displayName : `Uncollected ${reward.type} reward`;

  return (
    <div className="relative" aria-label={ariaLabel}>
      {/* Green checkmark badge for collected stamps */}
      {isOwned && (
        <div className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-emerald-500 ring-2 ring-white shadow-md flex items-center justify-center">
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      )}

      <div
        className="bg-white p-2.5 rounded-3xl"
        style={{
          WebkitMaskImage: stampMask,
          maskImage: stampMask,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
        }}
      >
        {/* Cream interior */}
        <div className="bg-[#FFF8E1] rounded-2xl p-3 min-h-[200px] flex flex-col overflow-hidden">
          {/* Top row: number + track label */}
          <div className="flex items-center justify-between mb-1 shrink-0">
            <span className="text-[10px] font-bold text-purple-400/50">
              #{String(rewardIndex + 1).padStart(3, '0')}
            </span>
            <span
              className={cn(
                'text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0',
                isPlus ? 'bg-pink-500 text-white' : 'bg-cyan-500 text-white'
              )}
            >
              {isPlus ? 'Plus' : 'Free'}
            </span>
          </div>

          {/* Image / art area */}
          <div className="flex-1 flex items-center justify-center py-2 min-h-[76px]">
            <RewardArt
              reward={reward}
              isOwned={isOwned}
              petDisplay={petDisplay}
              themeDisplay={themeDisplay}
              imgError={imgError}
              onImgError={() => setImgError(true)}
            />
          </div>

          {/* Name */}
          <div className="text-center mt-1 overflow-hidden">
            <div
              className={cn(
                'text-sm font-black uppercase leading-tight line-clamp-2',
                isOwned ? 'text-slate-800' : 'text-gray-400'
              )}
            >
              {displayName}
            </div>
          </div>

          {/* Owned / Not collected badge */}
          <div className="mt-1.5 flex justify-center shrink-0">
            {!isOwned && (
              <div className="text-[10px] font-bold uppercase text-gray-400">Not collected</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}