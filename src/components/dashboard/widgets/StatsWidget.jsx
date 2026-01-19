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
      <div className="relative rounded-xl p-4 text-center overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
        <Zap className="w-5 h-5 mx-auto mb-1 text-amber-500 relative z-10" />
        <p className="text-xl font-bold text-slate-800 relative z-10">{xp || 0}</p>
        <p className="text-xs text-slate-400 relative z-10">Total XP</p>
      </div>
      <div className="relative rounded-xl p-4 text-center overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent pointer-events-none" />
        <Star className="w-5 h-5 mx-auto mb-1 text-purple-500 relative z-10" />
        <p className="text-xl font-bold text-slate-800 relative z-10">{petsCount || 1}</p>
        <p className="text-xs text-slate-400 relative z-10">Pets</p>
      </div>
      <div className="relative rounded-xl p-4 text-center overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
        <ClipboardList className="w-5 h-5 mx-auto mb-1 text-emerald-500 relative z-10" />
        <p className="text-xl font-bold text-slate-800 relative z-10">{completedCount || 0}</p>
        <p className="text-xs text-slate-400 relative z-10">Completed</p>
      </div>
    </motion.div>
  );
}