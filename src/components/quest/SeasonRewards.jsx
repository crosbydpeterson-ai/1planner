import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Lock, Sparkles, Star, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PETS } from '@/components/quest/PetCatalog';

const REWARD_TYPE_ICONS = {
  pet: '🐾',
  theme: '🎨',
  title: '🏆',
  coins: '🪙',
  magic_egg: '🥚',
  food: '🍽️'
};

function RewardCard({ reward, index, tier, userXp, claimedRewards, onClaim, petCache, hasPlus }) {
  const claimIndex = typeof reward.seasonRewardIndex === 'number' ? reward.seasonRewardIndex : index;
  const claimKey = `${reward.seasonId}:${claimIndex}:${reward.type}:${reward?.value || reward?.name || 'reward'}`;
  const isUnlocked = userXp >= reward.xpRequired;
  const isClaimed = claimedRewards.includes(claimKey);
  const isPlusCard = tier === 'plus';
  const canUse = !isPlusCard || hasPlus;

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

  const displayName = petDisplay?.name || reward.name || reward.value || 'Reward';

  return (
    <div className="min-w-[148px] md:min-w-[172px] snap-start">
      <div className={cn(
        'relative rounded-[22px] border-[3px] p-2 shadow-[0_10px_0_rgba(0,0,0,0.22)]',
        isPlusCard
          ? 'bg-gradient-to-b from-pink-300 to-fuchsia-500 border-yellow-300'
          : 'bg-gradient-to-b from-sky-300 to-blue-500 border-cyan-100',
        !canUse && 'opacity-70 grayscale-[0.2]',
        isClaimed && 'ring-4 ring-green-300'
      )}>
        <div className="rounded-[16px] bg-white/18 p-3 backdrop-blur-[2px] min-h-[176px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="rounded-full bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              {reward.xpRequired} XP
            </div>
            <div className="rounded-full bg-black/20 p-1.5 text-white">
              {isClaimed ? <Check className="w-4 h-4" /> : !canUse ? <Lock className="w-4 h-4" /> : isUnlocked ? <Gift className="w-4 h-4" /> : <Star className="w-4 h-4" />}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center gap-3 py-3">
            {petDisplay?.image ? (
              <img src={petDisplay.image} alt={displayName} className="w-20 h-20 rounded-2xl object-cover border-4 border-white/70 shadow-lg" />
            ) : (
              <div className="text-6xl drop-shadow-md">{petDisplay?.emoji || REWARD_TYPE_ICONS[reward.type] || '🎁'}</div>
            )}
            <div>
              <div className="text-white font-black text-sm leading-tight uppercase tracking-wide">{displayName}</div>
              <div className="text-white/85 text-[11px] font-bold uppercase">{isPlusCard ? '1Pass Plus' : 'Free Track'}</div>
            </div>
          </div>

          <div>
            {isClaimed ? (
              <div className="w-full rounded-xl bg-green-500 px-3 py-2 text-center text-xs font-black uppercase text-white shadow-[0_4px_0_rgba(0,0,0,0.18)]">
                Claimed
              </div>
            ) : isUnlocked && canUse ? (
              <Button
                onClick={() => onClaim?.(reward, claimIndex)}
                className="w-full rounded-xl border-2 border-yellow-200 bg-yellow-400 text-slate-900 hover:bg-yellow-300 font-black uppercase shadow-[0_4px_0_rgba(146,93,0,0.45)]"
              >
                Claim
              </Button>
            ) : (
              <div className="w-full rounded-xl bg-slate-900/30 px-3 py-2 text-center text-[11px] font-black uppercase text-white">
                {!canUse ? 'Admin Gift' : `${Math.max(reward.xpRequired - userXp, 0)} XP Left`}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <div className="rounded-full border-[3px] border-slate-900 bg-white px-3 py-1 text-sm font-black text-slate-900 shadow-[0_4px_0_rgba(0,0,0,0.2)]">
          {index + 1}
        </div>
      </div>
    </div>
  );
}

function RewardLane({ title, subtitle, rewards, tier, userXp, claimedRewards, onClaim, petCache, hasPlus }) {
  return (
    <div className={cn(
      'rounded-[28px] border-[4px] p-4 md:p-5 shadow-[0_12px_0_rgba(0,0,0,0.25)]',
      tier === 'plus'
        ? 'bg-gradient-to-r from-fuchsia-700 via-purple-700 to-pink-700 border-yellow-300'
        : 'bg-gradient-to-r from-violet-700 via-indigo-700 to-violet-700 border-violet-300'
    )}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white text-xl md:text-2xl font-black uppercase tracking-wide">{title}</h3>
          <p className="text-white/80 text-xs md:text-sm font-bold uppercase">{subtitle}</p>
        </div>
        {tier === 'plus' && (
          <div className={cn(
            'rounded-2xl border-[3px] px-4 py-2 text-center shadow-[0_6px_0_rgba(0,0,0,0.2)]',
            hasPlus ? 'bg-yellow-400 border-yellow-100 text-slate-900' : 'bg-slate-900/25 border-white/20 text-white'
          )}>
            <div className="text-[10px] font-black uppercase">1Pass Plus</div>
            <div className="text-xs font-black uppercase">{hasPlus ? 'Gifted' : 'Locked'}</div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {rewards.map((reward, index) => (
            <motion.div
              key={`${tier}-${index}-${reward.type}-${reward.value || reward.name}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <RewardCard
                reward={reward}
                index={index}
                tier={tier}
                userXp={userXp}
                claimedRewards={claimedRewards}
                onClaim={onClaim}
                petCache={petCache}
                hasPlus={hasPlus}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SeasonRewards({ season, userXp, claimedRewards = [], onClaim, hasPlus = false }) {
  const [petCache, setPetCache] = useState({});

  useEffect(() => {
    if (!season?.rewards) return;
    const customIds = season.rewards
      .filter((reward) => reward.type === 'pet' && String(reward.value || '').startsWith('custom_'))
      .map((reward) => String(reward.value).replace('custom_', ''));

    if (customIds.length === 0) return;

    (async () => {
      const pets = await base44.entities.CustomPet.list();
      const map = {};
      pets.forEach((pet) => {
        map[pet.id] = pet;
      });
      setPetCache(map);
    })();
  }, [season]);

  if (!season) return null;

  const normalizedRewards = (season.rewards || []).map((reward, index) => ({
    ...reward,
    seasonId: season.id,
    seasonRewardIndex: index
  }));

  const freeRewards = normalizedRewards.filter((_, index) => index % 2 === 0);
  const plusRewards = normalizedRewards.filter((_, index) => index % 2 === 1);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-[24px] border-[4px] border-yellow-300 bg-gradient-to-r from-orange-400 via-yellow-300 to-amber-400 px-5 py-4 text-slate-900 shadow-[0_10px_0_rgba(0,0,0,0.25)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-[0_6px_0_rgba(0,0,0,0.25)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl md:text-2xl font-black uppercase tracking-wide">1Pass Rewards</div>
            <div className="text-xs md:text-sm font-bold uppercase opacity-80">Free lane + admin gifted 1Pass Plus lane</div>
          </div>
        </div>
        <div className="rounded-2xl bg-white/70 px-4 py-2 border-[3px] border-white text-right shadow-[0_6px_0_rgba(0,0,0,0.15)]">
          <div className="text-[10px] font-black uppercase">Current XP</div>
          <div className="text-lg font-black">{userXp}</div>
        </div>
      </div>

      {plusRewards.length > 0 && (
        <RewardLane
          title="1Pass Plus"
          subtitle="Admin gifted premium rewards"
          rewards={plusRewards}
          tier="plus"
          userXp={userXp}
          claimedRewards={claimedRewards}
          onClaim={onClaim}
          petCache={petCache}
          hasPlus={hasPlus}
        />
      )}

      <RewardLane
        title="1Pass"
        subtitle="Free rewards track"
        rewards={freeRewards}
        tier="free"
        userXp={userXp}
        claimedRewards={claimedRewards}
        onClaim={onClaim}
        petCache={petCache}
        hasPlus={hasPlus}
      />
    </div>
  );
}
