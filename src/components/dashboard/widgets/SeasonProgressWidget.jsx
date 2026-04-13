import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, ChevronRight, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { differenceInDays } from 'date-fns';

export default function SeasonProgressWidget({ userXp, claimedRewards, seasonXp, activeSeasonId }) {
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeason();
  }, []);

  const loadSeason = async () => {
    try {
      const seasons = await base44.entities.Season.filter({ isActive: true });
      if (seasons.length > 0) {
        setSeason(seasons[0]);
      }
    } catch (e) {
      console.error('Error loading season:', e);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-md p-4 border border-slate-100"
      >
        <div className="py-4 text-center text-slate-400 text-sm">Loading...</div>
      </motion.div>
    );
  }

  if (!season) return null;

  const daysLeft = differenceInDays(new Date(season.endDate), new Date());
  const totalRewards = season.rewards?.length || 0;
  const claimedCount = claimedRewards?.length || 0;
  // Show season-scoped XP
  const displayXp = (activeSeasonId === season.id) ? (seasonXp || 0) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-4 shadow-xl overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/5 pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-800">{season.name}</h3>
        </div>
        <Link 
          to={createPageUrl('Season')}
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
        >
          View <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="flex items-center justify-between relative z-10">
        <div>
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <Calendar className="w-3 h-3" />
            {daysLeft} days left
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-800">{displayXp} XP</p>
          <p className="text-xs text-slate-500">{claimedCount}/{totalRewards} rewards</p>
        </div>
      </div>
    </motion.div>
  );
}