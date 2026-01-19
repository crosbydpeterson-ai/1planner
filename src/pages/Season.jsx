import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Calendar, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';
import SeasonRewards from '@/components/quest/SeasonRewards';
import GlassIcon from '@/components/ui/GlassIcon';
import { toast } from 'sonner';
import { PETS } from '@/components/quest/PetCatalog';

export default function Season() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
      setProfile(profiles[0]);

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

  const handleClaimReward = async (reward) => {
    if (!profile || !season) return;

    // Verify eligibility server-side style (in frontend for demo)
    if ((profile.xp || 0) < reward.xpRequired) {
      toast.error('Not enough XP to claim this reward!');
      return;
    }

    if ((profile.claimedSeasonRewards || []).includes(reward.xpRequired)) {
      toast.error('Reward already claimed!');
      return;
    }

    try {
      const claimedSeasonRewards = [...(profile.claimedSeasonRewards || []), reward.xpRequired];
      
      // Add reward based on type
      let updateData = { claimedSeasonRewards };
      
      if (reward.type === 'pet') {
        const currentPets = profile.unlockedPets || [];
        if (!currentPets.includes(reward.value)) {
          updateData.unlockedPets = [...currentPets, reward.value];
        }
      } else if (reward.type === 'theme') {
        const currentThemes = profile.unlockedThemes || [];
        if (!currentThemes.includes(reward.value)) {
          updateData.unlockedThemes = [...currentThemes, reward.value];
        }
      } else if (reward.type === 'title') {
        const currentTitles = profile.unlockedTitles || [];
        if (!currentTitles.includes(reward.value)) {
          updateData.unlockedTitles = [...currentTitles, reward.value];
        }
      }

      await base44.entities.UserProfile.update(profile.id, updateData);
      setProfile({ ...profile, ...updateData });

      toast.success(`${reward.name} claimed!`, {
        description: `You unlocked a new ${reward.type}!`
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

  const userXp = profile.xp || 0;
  const daysLeft = season ? differenceInDays(new Date(season.endDate), new Date()) : 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4 pb-8">
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
                    {(profile.claimedSeasonRewards || []).length}/{season.rewards?.length || 0}
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
                claimedRewards={profile.claimedSeasonRewards || []}
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