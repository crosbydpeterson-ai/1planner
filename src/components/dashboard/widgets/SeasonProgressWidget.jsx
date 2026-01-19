import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sparkles, ChevronRight, Calendar } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { differenceInDays, format } from 'date-fns';

export default function SeasonProgressWidget({ userXp, claimedRewards }) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-4 text-white shadow-xl overflow-hidden backdrop-blur-xl bg-gradient-to-r from-indigo-500/90 to-purple-600/90 border border-white/20"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">{season.name}</h3>
        </div>
        <Link 
          to={createPageUrl('Season')}
          className="flex items-center gap-1 text-sm text-indigo-200 hover:text-white"
        >
          View <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="flex items-center justify-between relative z-10">
        <div>
          <div className="flex items-center gap-1 text-indigo-200 text-xs">
            <Calendar className="w-3 h-3" />
            {daysLeft} days left
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{claimedCount}/{totalRewards}</p>
          <p className="text-xs text-indigo-200">rewards claimed</p>
        </div>
      </div>
    </motion.div>
  );
}