import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Star, ClipboardList } from 'lucide-react';

export default function StatsWidget({ xp, petsCount, completedCount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-3"
    >
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/5" />
        <Zap className="w-5 h-5 mx-auto mb-1 text-amber-500 relative z-10" />
        <p className="text-xl font-bold text-slate-800 relative z-10">{xp || 0}</p>
        <p className="text-xs text-slate-400 relative z-10">Total XP</p>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/5" />
        <Star className="w-5 h-5 mx-auto mb-1 text-purple-500 relative z-10" />
        <p className="text-xl font-bold text-slate-800 relative z-10">{petsCount || 1}</p>
        <p className="text-xs text-slate-400 relative z-10">Pets</p>
      </div>
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/5" />
        <ClipboardList className="w-5 h-5 mx-auto mb-1 text-emerald-500 relative z-10" />
        <p className="text-xl font-bold text-slate-800 relative z-10">{completedCount || 0}</p>
        <p className="text-xs text-slate-400 relative z-10">Completed</p>
      </div>
    </motion.div>
  );
}