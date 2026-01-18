import React from 'react';
import { Star, Zap, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const XP_LEVELS = [
  { level: 1, xp: 0, title: "Novice" },
  { level: 2, xp: 100, title: "Apprentice" },
  { level: 3, xp: 250, title: "Student" },
  { level: 4, xp: 500, title: "Scholar" },
  { level: 5, xp: 1000, title: "Expert" },
  { level: 6, xp: 1500, title: "Master" },
  { level: 7, xp: 2500, title: "Sage" },
  { level: 8, xp: 4000, title: "Legend" },
  { level: 9, xp: 7500, title: "Mythic" },
  { level: 10, xp: 10000, title: "Champion" }
];

export const getLevelInfo = (xp) => {
  let currentLevel = XP_LEVELS[0];
  let nextLevel = XP_LEVELS[1];
  
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].xp) {
      currentLevel = XP_LEVELS[i];
      nextLevel = XP_LEVELS[i + 1] || null;
      break;
    }
  }
  
  const progress = nextLevel 
    ? ((xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100
    : 100;
    
  return { currentLevel, nextLevel, progress };
};

export default function XPProgress({ xp = 0, showDetails = true }) {
  const { currentLevel, nextLevel, progress } = getLevelInfo(xp);
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Level {currentLevel.level}</p>
            <p className="text-lg font-bold text-slate-800">{currentLevel.title}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-amber-600">
            <Zap className="w-4 h-4" />
            <span className="font-bold text-lg">{xp.toLocaleString()}</span>
          </div>
          <p className="text-xs text-slate-400">XP</p>
        </div>
      </div>
      
      {showDetails && nextLevel && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{currentLevel.xp} XP</span>
            <span>{nextLevel.xp} XP</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1 text-center">
            {nextLevel.xp - xp} XP to {nextLevel.title}
          </p>
        </div>
      )}
      
      {!nextLevel && (
        <div className="mt-4 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
          <Trophy className="w-5 h-5 text-amber-500" />
          <span className="font-semibold text-amber-700">Maximum Level Achieved!</span>
        </div>
      )}
    </div>
  );
}