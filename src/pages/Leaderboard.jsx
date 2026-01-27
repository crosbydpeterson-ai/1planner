import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeaderboardRow from '@/components/quest/LeaderboardRow';
import GlassIcon from '@/components/ui/GlassIcon';
import { PETS } from '@/components/quest/PetCatalog';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // Live update leaderboard when user profiles change (e.g., cosmetic positions)
  useEffect(() => {
    const unsubscribe = base44.entities.UserProfile.subscribe((event) => {
      if (event.type === 'update') {
        setLeaderboard(prev => prev.map(u => u.id === event.id ? { ...u, ...event.data } : u));
      }
    });
    return unsubscribe;
  }, []);

  const loadData = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      navigate(createPageUrl('Home'));
      setLoading(false);
      return;
    }

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      }

      await loadLeaderboard();
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const loadLeaderboard = async () => {
    setRefreshing(true);
    try {
      // Get all visible users (not locked, not hidden)
      const allProfiles = await base44.entities.UserProfile.list('-xp');
      const visible = allProfiles.filter(p => !p.isLocked && !p.hiddenFromLeaderboard);
      
      // Add pet emoji to each user
      const withPets = visible.map(p => {
        const pet = PETS.find(pet => pet.id === p.equippedPetId);
        return {
          ...p,
          equippedPetEmoji: pet?.emoji || '🟢'
        };
      });
      
      setLeaderboard(withPets);
    } catch (e) {
      console.error('Error loading leaderboard:', e);
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentUserRank = profile ? leaderboard.findIndex(p => p.id === profile.id) + 1 : 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <GlassIcon icon={Trophy} color="amber" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Leaderboard</h1>
                <p className="text-sm text-slate-500">Top students by XP</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadLeaderboard}
            disabled={refreshing}
            className="rounded-xl"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </motion.div>

        {/* Your rank card - Liquid Glass */}
        {profile && currentUserRank > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl p-5 text-white mb-6 shadow-xl overflow-hidden backdrop-blur-xl bg-gradient-to-r from-indigo-500/90 to-purple-600/90 border border-white/20"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-indigo-200 text-sm">Your Rank</p>
                <p className="text-4xl font-bold drop-shadow-lg">#{currentUserRank}</p>
              </div>
              <div className="text-right">
                <p className="text-indigo-200 text-sm">Total XP</p>
                <p className="text-3xl font-bold drop-shadow-lg">{(profile.xp || 0).toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 text-sm text-slate-500 mb-4"
        >
          <Users className="w-4 h-4" />
          <span>{leaderboard.length} students competing</span>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
              <Trophy className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No students yet</p>
            </div>
          ) : (
            leaderboard.map((user, index) => (
              <LeaderboardRow
                key={user.id}
                user={user}
                rank={index + 1}
                isCurrentUser={profile?.id === user.id}
              />
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}