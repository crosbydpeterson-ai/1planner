import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ClipboardList, Trophy, Gift, Sparkles } from 'lucide-react';

export default function QuickNavWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 gap-4"
    >
      <Link to={createPageUrl('Assignments')}>
        <div className="relative rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] overflow-hidden backdrop-blur-xl bg-gradient-to-br from-emerald-500/90 to-teal-600/90 border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          <ClipboardList className="w-8 h-8 mb-3 drop-shadow-lg relative z-10" />
          <h3 className="font-bold text-lg relative z-10">Assignments</h3>
          <p className="text-emerald-100 text-sm relative z-10">Complete quests</p>
        </div>
      </Link>

      <Link to={createPageUrl('Leaderboard')}>
        <div className="relative rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] overflow-hidden backdrop-blur-xl bg-gradient-to-br from-amber-500/90 to-orange-600/90 border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          <Trophy className="w-8 h-8 mb-3 drop-shadow-lg relative z-10" />
          <h3 className="font-bold text-lg relative z-10">Leaderboard</h3>
          <p className="text-amber-100 text-sm relative z-10">See rankings</p>
        </div>
      </Link>

      <Link to={createPageUrl('Rewards')}>
        <div className="relative rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] overflow-hidden backdrop-blur-xl bg-gradient-to-br from-purple-500/90 to-pink-600/90 border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          <Gift className="w-8 h-8 mb-3 drop-shadow-lg relative z-10" />
          <h3 className="font-bold text-lg relative z-10">Collection</h3>
          <p className="text-purple-100 text-sm relative z-10">Pets & themes</p>
        </div>
      </Link>

      <Link to={createPageUrl('Season')}>
        <div className="relative rounded-2xl p-5 text-white shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] overflow-hidden backdrop-blur-xl bg-gradient-to-br from-indigo-500/90 to-violet-600/90 border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          <Sparkles className="w-8 h-8 mb-3 drop-shadow-lg relative z-10" />
          <h3 className="font-bold text-lg relative z-10">Season</h3>
          <p className="text-indigo-100 text-sm relative z-10">Earn rewards</p>
        </div>
      </Link>
    </motion.div>
  );
}