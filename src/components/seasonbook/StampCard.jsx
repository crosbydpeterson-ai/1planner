import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';

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

function RewardArt({ reward, isOwned, petDisplay, themeDisplay }) {
  // Silhouette: black out images/emojis when unowned
  const imgStyle = isOwned ? {} : { filter: 'brightness(0) saturate(0) opacity(0.22)' };
  const emojiClass = isOwned ? 'text-5xl' : 'text-5xl text-black/25';

  if (reward.type === 'pet') {
    if (petDisplay?.image) {
      return <img src={petDisplay.image} alt="" className="w-20 h-20 rounded-lg object-cover" style={imgStyle} />;
    }
    return <div className={emojiClass}>{petDisplay?.emoji || REWARD_TYPE_ICONS.pet}</div>;
  }

  if (reward.type === 'theme') {
    if (themeDisplay) {
      const dim = isOwned ? {} : { filter: 'brightness(0) saturate(0) opacity(0.3)' };
      return (
        <div className="flex gap-1.5">
          <div className="w-9 h-9 rounded-full shadow ring-2 ring-white/50" style={{ backgroundColor: isOwned ? themeDisplay.primary : '#333', ...dim }} />
          <div className="w-9 h-9 rounded-full shadow ring-2 ring-white/50" style={{ backgroundColor: isOwned ? themeDisplay.secondary : '#555', ...dim }} />
          <div className="w-9 h-9 rounded-full shadow ring-2 ring-white/50" style={{ backgroundColor: isOwned ? themeDisplay.accent : '#777', ...dim }} />
        </div>
      );
    }
    return <div className={emojiClass}>{REWARD_TYPE_ICONS.theme}</div>;
  }

  if (reward.type === 'title') {
    return (
      <div className={cn('text-center px-2 py-3', isOwned ? 'text-slate-800' : 'text-gray-400')}>
        <div className="text-base font-black uppercase leading-tight">{isOwned ? (reward.value || reward.name || 'Title') : '???'}</div>
      </div>
    );
  }

  // coins, magic_egg, food
  return <div className={emojiClass}>{REWARD_TYPE_ICONS[reward.type] || '🎁'}</div>;
}

export default function StampCard({ reward, rewardIndex, seasonId, isOwned, petCache, themeCache }) {
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

  const displayName = isOwned
    ? (petDisplay?.name || themeDisplay?.name || reward.name || reward.value || 'Reward')
    : '???';

  return (
    <div className="relative">
      {/* White perforated outer */}
      <div className="bg-white rounded-xl p-1.5 shadow-[0_6px_0_rgba(49,27,146,0.3)]">
        {/* Cream inner with dashed perforation border */}
        <div className="bg-[#FFF8E1] rounded-lg border-2 border-dashed border-purple-300/40 p-3 min-h-[210px] flex flex-col">
          {/* Top row: number + track label */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-purple-400/60">{String(rewardIndex + 1).padStart(2, '0')}</span>
            <span className={cn(
              'text-[10px] font-black uppercase px-2 py-0.5 rounded-full',
              isPlus ? 'bg-pink-500 text-white' : 'bg-cyan-500 text-white'
            )}>
              {isPlus ? '1Pass Plus' : 'Free'}
            </span>
          </div>

          {/* Image / art area */}
          <div className="flex-1 flex items-center justify-center py-2 min-h-[80px]">
            <RewardArt reward={reward} isOwned={isOwned} petDisplay={petDisplay} themeDisplay={themeDisplay} />
          </div>

          {/* Name */}
          <div className="text-center mt-1">
            <div className={cn(
              'text-sm font-black uppercase leading-tight line-clamp-2',
              isOwned ? 'text-slate-800' : 'text-gray-400'
            )}>
              {displayName}
            </div>
          </div>

          {/* Owned / Not collected badge */}
          <div className="mt-2 flex justify-center">
            {isOwned ? (
              <div className="flex items-center gap-1 bg-lime-500 rounded-full px-2 py-0.5">
                <Check className="w-3 h-3 text-white" />
                <span className="text-[10px] font-black uppercase text-white">Owned</span>
              </div>
            ) : (
              <div className="text-[10px] font-bold uppercase text-gray-400">Not collected</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}