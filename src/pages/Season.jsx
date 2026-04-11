import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Calendar, Zap, Crown, Star } from 'lucide-react';
import LockedOverlay from '@/components/common/LockedOverlay';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';
import SeasonRewards from '@/components/quest/SeasonRewards';
import { toast } from 'sonner';

export default function Season() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locks, setLocks] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadData();
    base44.analytics.track({ eventName: 'season_page_viewed' });
  }, []);

  // Compute season XP: if profile is tracking the current season, use seasonXp; otherwise 0
  // Also auto-migrate: if activeSeasonId is stale/missing, bind to the displayed season
  const getSeasonXp = (userProfile, activeSeason) => {
    if (!userProfile || !activeSeason) return 0;
    if (userProfile.activeSeasonId === activeSeason.id) {
      return userProfile.seasonXp || 0;
    }
    // activeSeasonId doesn't match — either stale or never set
    // If user has seasonXp but wrong activeSeasonId, show 0 (they haven't earned in this season)
    return 0;
  };



  const getRewardClaimKey = (seasonId, reward, rewardIndex) => {
    const rewardValue = reward?.value || reward?.name || 'reward';
    return `${seasonId}:${rewardIndex}:${reward.type}:${rewardValue}`;
  };

  const getClaimedRewardsForSeason = (userProfile, activeSeason) => {
    if (!userProfile || !activeSeason) return [];

    const claimsBySeason = userProfile.claimedSeasonRewardsBySeason || {};
    if (Array.isArray(claimsBySeason[activeSeason.id])) {
      return claimsBySeason[activeSeason.id];
    }

    // No claims recorded for this season yet — return empty
    // (Legacy migration only applies to the very first season before claimsBySeason existed)
    return [];
  };

  const loadData = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      navigate(createPageUrl('Home'));
      return;
    }

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) {
        navigate(createPageUrl('Home'));
        return;
      }
      const me = profiles[0];
      setProfile(me);

      // Admin check
      const allProfiles = await base44.entities.UserProfile.list('created_date', 1);
      const adminUser = me.username?.toLowerCase?.() === 'crosby' || (allProfiles[0] && allProfiles[0].id === me.id);
      setIsAdmin(!!adminUser);

      // Locks
      const settings = await base44.entities.AppSetting.list();
      const fl = settings.find(s => s.key === 'feature_locks');
      setLocks(fl ? fl.value : null);

      // Load active season — if user has an activeSeasonId, show that season; otherwise pick by date
      const seasons = await base44.entities.Season.filter({ isActive: true });
      if (seasons.length > 0) {
        // Prefer the season the user is already tracking
        let current = me.activeSeasonId ? seasons.find(s => s.id === me.activeSeasonId) : null;
        if (!current) {
          // User has no activeSeasonId or it doesn't match any active season — pick by date
          const now = new Date();
          current = seasons.find(s => new Date(s.startDate) <= now && new Date(s.endDate) >= now) || seasons[0];
          // Bind user to this season (first visit)
          await base44.entities.UserProfile.update(me.id, { activeSeasonId: current.id, seasonXp: 0 });
          me.activeSeasonId = current.id;
          me.seasonXp = 0;
          setProfile({ ...me });
        }
        setSeason(current);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const handleClaimReward = async (reward, rewardIndex) => {
    if (!profile || !season) return;

    // Verify eligibility server-side style (in frontend for demo)
    const currentSeasonXp = getSeasonXp(profile, season);
    if (currentSeasonXp < reward.xpRequired) {
      toast.error('Not enough XP to claim this reward!');
      return;
    }

    const existingClaimedRewards = getClaimedRewardsForSeason(profile, season);
    const rewardClaimKey = getRewardClaimKey(season.id, reward, rewardIndex);

    if (existingClaimedRewards.includes(rewardClaimKey)) {
      toast.error('Reward already claimed!');
      return;
    }

    try {
      const claimsBySeason = profile.claimedSeasonRewardsBySeason || {};
      const claimedSeasonRewards = [...existingClaimedRewards, rewardClaimKey];
      
      // Add reward based on type
      let updateData = {
        claimedSeasonRewardsBySeason: {
          ...claimsBySeason,
          [season.id]: claimedSeasonRewards
        }
      };
      
      if (reward.type === 'pet') {
        // Use the value as-is — it already has the correct format (built-in ID or custom_<id>)
        const petId = reward.value;
        const currentPets = profile.unlockedPets || [];
        if (!currentPets.includes(petId)) {
          updateData.unlockedPets = [...currentPets, petId];
        }
      } else if (reward.type === 'theme') {
        // Use the value as-is — it already has the correct format (built-in ID or custom_<id>)
        const themeId = reward.value;
        const currentThemes = profile.unlockedThemes || [];
        if (!currentThemes.includes(themeId)) {
          updateData.unlockedThemes = [...currentThemes, themeId];
        }
      } else if (reward.type === 'title') {
        const titleValue = (reward.value || reward.name || '').trim();
        if (!titleValue) {
          throw new Error('Title reward is missing a value');
        }
        const currentTitles = profile.unlockedTitles || [];
        if (!currentTitles.includes(titleValue)) {
          updateData.unlockedTitles = [...currentTitles, titleValue];
        }
      } else if (reward.type === 'coins') {
        const coinAmount = parseInt(reward.value, 10) || 0;
        updateData.questCoins = (profile.questCoins || 0) + coinAmount;
      } else if (reward.type === 'food' && reward.value) {
        // Grant a food item to inventory
        try {
          const foodItems = await base44.entities.FoodItem.filter({ id: reward.value });
          if (foodItems.length > 0) {
            const food = foodItems[0];
            const existingInv = await base44.entities.FoodInventory.filter({ userProfileId: profile.id, foodItemId: food.id });
            if (existingInv.length > 0) {
              await base44.entities.FoodInventory.update(existingInv[0].id, { quantity: (existingInv[0].quantity || 0) + 1 });
            } else {
              await base44.entities.FoodInventory.create({
                userProfileId: profile.id,
                foodItemId: food.id,
                foodName: food.name,
                foodImageUrl: food.imageUrl || '',
                foodFlavor: food.flavor,
                foodDescription: food.description || '',
                foodRarity: food.rarity,
                quantity: 1
              });
            }
          }
        } catch (e) {
          console.error('Error granting food reward:', e);
        }
      }

      await base44.entities.UserProfile.update(profile.id, updateData);
      const updatedProfile = { ...profile, ...updateData };
      setProfile(updatedProfile);

      toast.success(`${reward.name} claimed!`, {
        description: reward.type === 'coins' 
          ? `You received ${reward.value} Quest Coins!` 
          : `You unlocked a new ${reward.type}!`
      });
    } catch (e) {
      console.error('Error claiming reward:', e);
      toast.error('Failed to claim reward');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  const userLock = locks?.users?.[profile.id]?.battlePass;
  const isLocked = !isAdmin && ((typeof userLock === 'object' ? userLock.locked : !!userLock));
  const lockMsg = typeof userLock === 'object' ? (userLock.message || '') : '';
  if (isLocked) {
    return <LockedOverlay featureLabel="1Pass" message={lockMsg || "An Admin or Mod has locked this feature. You can't currently use it."} />;
  }

  const userXp = getSeasonXp(profile, season);
  const daysLeft = season ? differenceInDays(new Date(season.endDate), new Date()) : 0;
  const maxXp = season?.rewards?.length > 0 ? Math.max(...season.rewards.map(r => r.xpRequired || 0)) : 200;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#7c3aed_0%,_#581c87_35%,_#2e1065_100%)] px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3 md:gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="rounded-2xl border-2 border-white/20 bg-black/20 text-white hover:bg-white/10 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="text-white/70 text-xs md:text-sm font-black uppercase tracking-[0.2em]">1planner</div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">1Pass</h1>
            </div>
          </div>
          <div className="rounded-2xl border-[3px] border-lime-300 bg-lime-400 px-4 py-2 text-slate-900 shadow-[0_8px_0_rgba(0,0,0,0.22)]">
            <div className="text-[10px] md:text-xs font-black uppercase">Rewards</div>
            <div className="text-sm md:text-base font-black">{getClaimedRewardsForSeason(profile, season).length}/{season?.rewards?.length || 0}</div>
          </div>
        </motion.div>

        {season ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-[32px] border-[4px] border-violet-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.16),_rgba(255,255,255,0.04))] p-5 md:p-6 shadow-[0_14px_0_rgba(0,0,0,0.28)] backdrop-blur-sm"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-900 shadow-[0_5px_0_rgba(0,0,0,0.18)]">
                    <Crown className="w-4 h-4" />
                    1Pass Live
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-4xl font-black uppercase text-white">{season.name}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-white/80 text-xs md:text-sm font-bold uppercase">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(season.startDate), 'MMM d')} - {format(new Date(season.endDate), 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        <span>{daysLeft} Days Left</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-xl rounded-[28px] border-[4px] border-slate-900/20 bg-black/20 p-4">
                  <div className="mb-2 flex items-center justify-between text-white font-black uppercase text-xs md:text-sm">
                    <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-300" /> XP Progress</span>
                    <span>{userXp}/{maxXp}</span>
                  </div>
                  <div className="h-6 rounded-full border-[3px] border-slate-900/20 bg-slate-900/30 p-1">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-500"
                      style={{ width: `${Math.min((userXp / maxXp) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-white/10 px-3 py-3 text-white">
                      <div className="text-[10px] font-black uppercase text-white/70">Your XP</div>
                      <div className="text-lg font-black">{userXp}</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-3 py-3 text-white">
                      <div className="text-[10px] font-black uppercase text-white/70">Claimed</div>
                      <div className="text-lg font-black">{getClaimedRewardsForSeason(profile, season).length}</div>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-3 py-3 text-white">
                      <div className="text-[10px] font-black uppercase text-white/70">1Pass Plus</div>
                      <div className="text-lg font-black">{profile.has1PassPlus ? 'ON' : 'OFF'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SeasonRewards
                season={season}
                userXp={userXp}
                claimedRewards={getClaimedRewardsForSeason(profile, season)}
                onClaim={handleClaimReward}
                hasPlus={!!profile.has1PassPlus}
              />
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border-[4px] border-violet-300 bg-white/10 p-12 text-center shadow-[0_12px_0_rgba(0,0,0,0.25)]"
          >
            <Sparkles className="w-12 h-12 mx-auto text-yellow-300 mb-3" />
            <h3 className="text-2xl font-black uppercase text-white mb-2">No Active 1Pass</h3>
            <p className="text-white/70 font-bold uppercase text-sm">Check back later for the next drop.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}