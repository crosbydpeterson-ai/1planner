import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ClipboardList, Trophy, Gift, Sparkles, Egg } from 'lucide-react';

export default function QuickNavWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 sm:grid-cols-3 gap-4"
    >
      <Link to={createPageUrl('Assignments')}>
        <div className="relative rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/5 pointer-events-none" />
          <ClipboardList className="w-8 h-8 mb-3 text-emerald-600 relative z-10" />
          <h3 className="font-bold text-lg text-slate-800 relative z-10">Quests</h3>
          <p className="text-slate-500 text-sm relative z-10">Complete quests</p>
        </div>
      </Link>

      <Link to={createPageUrl('Leaderboard')}>
        <div className="relative rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/5 pointer-events-none" />
          <Trophy className="w-8 h-8 mb-3 text-amber-600 relative z-10" />
          <h3 className="font-bold text-lg text-slate-800 relative z-10">Rank</h3>
          <p className="text-slate-500 text-sm relative z-10">See rankings</p>
        </div>
      </Link>

      <Link to={createPageUrl('Rewards')}>
        <div className="relative rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/5 pointer-events-none" />
          <Gift className="w-8 h-8 mb-3 text-purple-600 relative z-10" />
          <h3 className="font-bold text-lg text-slate-800 relative z-10">Collection</h3>
          <p className="text-slate-500 text-sm relative z-10">Pets & themes</p>
        </div>
      </Link>

      <Link to={createPageUrl('Season')}>
        <div className="relative rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-violet-500/5 pointer-events-none" />
          <Sparkles className="w-8 h-8 mb-3 text-indigo-600 relative z-10" />
          <h3 className="font-bold text-lg text-slate-800 relative z-10">Season</h3>
          <p className="text-slate-500 text-sm relative z-10">Earn rewards</p>
        </div>
      </Link>

      <Link to={createPageUrl('Eggs')}>
        <div className="relative rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-yellow-500/5 pointer-events-none" />
          <Egg className="w-8 h-8 mb-3 text-amber-600 relative z-10" />
          <h3 className="font-bold text-lg text-slate-800 relative z-10">Eggs</h3>
          <p className="text-slate-500 text-sm relative z-10">Open loot eggs</p>
        </div>
      </Link>
    </motion.div>
  );
}