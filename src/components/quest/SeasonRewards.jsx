import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Gift, Lock, Check, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PETS } from '@/components/quest/PetCatalog';

const REWARD_TYPE_ICONS = {
  pet: "🐾",
  theme: "🎨",
  title: "🏆",
  coins: "🪙",
  magic_egg: "🥚"
};

export default function SeasonRewards({ season, userXp, claimedRewards = [], onClaim }) {
  const [petCache, setPetCache] = useState({});

  useEffect(() => {
    if (!season?.rewards) return;
    const petRewards = season.rewards.filter(r => r.type === 'pet' && r.value);
    if (petRewards.length === 0) return;

    const customIds = petRewards
      .filter(r => String(r.value).startsWith('custom_'))
      .map(r => String(r.value).replace('custom_', ''));

    if (customIds.length === 0) return;

    (async () => {
      const pets = await base44.entities.CustomPet.list();
      const map = {};
      pets.forEach(p => { map[p.id] = p; });
      setPetCache(map);
    })();
  }, [season]);

  const getPetDisplay = (reward) => {
    if (reward.type !== 'pet' || !reward.value) return null;
    const val = String(reward.value);
    if (val.startsWith('custom_')) {
      const pet = petCache[val.replace('custom_', '')];
      if (pet) return { name: pet.name, image: pet.imageUrl, emoji: pet.emoji };
    } else {
      const builtIn = PETS.find(p => p.id === val);
      if (builtIn) return { name: builtIn.name, image: null, emoji: builtIn.emoji };
    }
    return null;
  };

  if (!season) return null;

  const getRewardClaimKey = (reward, rewardIndex) => {
    const rewardValue = reward?.value || reward?.name || 'reward';
    return `${season.id}:${rewardIndex}:${reward.type}:${rewardValue}`;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{season.name}</h2>
          <p className="text-sm text-slate-500">Season Rewards</p>
        </div>
      </div>
      
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-6 top-0 bottom-0 w-1 bg-slate-100 rounded-full" />
        
        <div className="space-y-4">
          {season.rewards?.map((reward, index) => {
            const isUnlocked = userXp >= reward.xpRequired;
            const claimKey = getRewardClaimKey(reward, index);
            const isClaimed = claimedRewards.includes(claimKey);
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "relative flex items-center gap-4 p-4 rounded-xl ml-3",
                  isUnlocked ? "bg-white border-2 border-purple-200" : "bg-slate-50 border border-slate-200",
                  isClaimed && "opacity-60"
                )}
              >
                {/* Connector dot */}
                <div className={cn(
                  "absolute -left-3 w-7 h-7 rounded-full flex items-center justify-center",
                  isUnlocked ? "bg-purple-500" : "bg-slate-300"
                )}>
                  {isClaimed ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : isUnlocked ? (
                    <Gift className="w-4 h-4 text-white" />
                  ) : (
                    <Lock className="w-3 h-3 text-white" />
                  )}
                </div>
                
                {/* Reward info */}
                <div className="flex-1 ml-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const petDisplay = getPetDisplay(reward);
                      if (petDisplay?.image) {
                        return <img src={petDisplay.image} alt={petDisplay.name} className="w-10 h-10 rounded-lg object-cover" />;
                      }
                      if (petDisplay?.emoji) {
                        return <span className="text-2xl">{petDisplay.emoji}</span>;
                      }
                      return <span className="text-2xl">{REWARD_TYPE_ICONS[reward.type] || "🎁"}</span>;
                    })()}
                    <div>
                      <h3 className="font-bold text-slate-800">
                        {(() => {
                          const petDisplay = getPetDisplay(reward);
                          return petDisplay?.name || reward.name;
                        })()}
                      </h3>
                      <p className="text-xs text-slate-500 capitalize">{reward.type}</p>
                    </div>
                  </div>
                </div>
                
                {/* XP requirement */}
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-600">{reward.xpRequired} XP</div>
                  {!isUnlocked && (
                    <div className="text-xs text-slate-400">
                      {reward.xpRequired - userXp} more
                    </div>
                  )}
                </div>
                
                {/* Claim button */}
                {isUnlocked && !isClaimed && (
                  <Button
                    size="sm"
                    onClick={() => onClaim && onClaim(reward, index)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Claim
                  </Button>
                )}
                
                {isClaimed && (
                  <div className="text-sm font-semibold text-emerald-600">Claimed!</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}