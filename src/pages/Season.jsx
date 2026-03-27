import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Calendar, Zap } from 'lucide-react';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import LockedOverlay from '@/components/common/LockedOverlay';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';
import SeasonRewards from '@/components/quest/SeasonRewards';
import GlassIcon from '@/components/ui/GlassIcon';
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
  const getSeasonXp = (userProfile, activeSeason) => {
    if (!userProfile || !activeSeason) return 0;
    if (userProfile.activeSeasonId === activeSeason.id) {
      return userProfile.seasonXp || 0;
    }
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

      // Load active season
      const seasons = await base44.entities.Season.filter({ isActive: true });
      if (seasons.length > 0) {
        setSeason(seasons[0]);
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
        // Check if it's a built-in pet ID or a custom pet DB ID
        const isBuiltIn = PETS.some(p => p.id === reward.value);
        const petId = isBuiltIn ? reward.value : `custom_${reward.value}`;
        const currentPets = profile.unlockedPets || [];
        if (!currentPets.includes(petId)) {
          updateData.unlockedPets = [...currentPets, petId];
        }
      } else if (reward.type === 'theme') {
        // Check if it's a built-in theme ID or a custom theme DB ID
        const isBuiltIn = THEMES.some(t => t.id === reward.value);
        const themeId = isBuiltIn ? reward.value : `custom_${reward.value}`;
        const currentThemes = profile.unlockedThemes || [];
        if (!currentThemes.includes(themeId)) {
          updateData.unlockedThemes = [...currentThemes, themeId];
        }
      } else if (reward.type === 'title') {
        const currentTitles = profile.unlockedTitles || [];
        if (!currentTitles.includes(reward.value)) {
          updateData.unlockedTitles = [...currentTitles, reward.value];
        }
      } else if (reward.type === 'coins') {
        const coinAmount = parseInt(reward.value, 10) || 0;
        updateData.questCoins = (profile.questCoins || 0) + coinAmount;
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
    return <LockedOverlay featureLabel="Season Pass" message={lockMsg || "An Admin or Mod has locked this feature. You can't currently use it."} />;
  }

  const userXp = getSeasonXp(profile, season);
  const daysLeft = season ? differenceInDays(new Date(season.endDate), new Date()) : 0;

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 lg:px-8 xl:px-12 2xl:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <GlassIcon icon={Sparkles} color="primary" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Season Pass</h1>
              <p className="text-sm text-slate-500">Earn exclusive rewards</p>
            </div>
          </div>
        </motion.div>

        {season ? (
          <>
            {/* Season Banner - Liquid Glass */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative rounded-2xl p-6 text-white mb-6 shadow-xl overflow-hidden backdrop-blur-xl bg-gradient-to-r from-indigo-500/90 via-purple-500/90 to-pink-500/90 border border-white/20"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <h2 className="text-2xl font-bold mb-1 drop-shadow-lg">{season.name}</h2>
                  <div className="flex items-center gap-2 text-indigo-100">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {format(new Date(season.startDate), 'MMM d')} - {format(new Date(season.endDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold drop-shadow-lg">{daysLeft}</div>
                  <div className="text-indigo-200 text-sm">days left</div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between relative z-10">
                <div>
                  <p className="text-indigo-200 text-sm">Your XP</p>
                  <p className="text-2xl font-bold flex items-center gap-1 drop-shadow-lg">
                    <Zap className="w-5 h-5" />
                    {userXp.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-indigo-200 text-sm">Rewards Claimed</p>
                  <p className="text-2xl font-bold drop-shadow-lg">
                    {getClaimedRewardsForSeason(profile, season).length}/{season.rewards?.length || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Rewards Track */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100"
            >
              <SeasonRewards
                season={season}
                userXp={userXp}
                claimedRewards={getClaimedRewardsForSeason(profile, season)}
                onClaim={handleClaimReward}
              />
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-white rounded-2xl border border-slate-100"
          >
            <Sparkles className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Active Season</h3>
            <p className="text-slate-500">Check back later for the next season!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}