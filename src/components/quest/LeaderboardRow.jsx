import React from 'react';
import { Crown, Medal, Award, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getLevelInfo } from './XPProgress';
import PetAvatar from './PetAvatar';

const RANK_ICONS = {
  1: { icon: Crown, color: "text-amber-500", bg: "bg-amber-50" },
  2: { icon: Medal, color: "text-slate-400", bg: "bg-slate-50" },
  3: { icon: Award, color: "text-orange-400", bg: "bg-orange-50" }
};

export default function LeaderboardRow({ user, rank, isCurrentUser }) {
  const rankStyle = RANK_ICONS[rank];
  const { currentLevel } = getLevelInfo(user.xp);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl transition-all",
        isCurrentUser ? "bg-indigo-50 border-2 border-indigo-200" : "bg-white border border-slate-100",
        rank <= 3 && "shadow-sm"
      )}
    >
      {/* Rank */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
        rankStyle ? rankStyle.bg : "bg-slate-100"
      )}>
        {rankStyle ? (
          <rankStyle.icon className={cn("w-5 h-5", rankStyle.color)} />
        ) : (
          <span className="text-slate-500">{rank}</span>
        )}
      </div>
      
      {/* Pet Avatar */}
      <PetAvatar 
        petId={user.equippedPetId} 
        cosmeticIds={user.equippedCosmetics || []}
        cosmeticPositions={user.cosmeticPositions || {}}
        size="md"
      />
      
      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={cn(
            "font-bold text-slate-800 truncate",
            isCurrentUser && "text-indigo-700"
          )}>
            {user.username}
          </h3>
          {user.equippedTitle && (
            <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-medium">
              {user.equippedTitle}
            </span>
          )}
          {isCurrentUser && (
            <span className="text-xs bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded-full">You</span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Level {currentLevel.level} • {currentLevel.title}
        </p>
        {user.statusMessage && (
          <p className="text-xs text-slate-500 italic mt-0.5 truncate">"{user.statusMessage}"</p>
        )}
      </div>
      
      {/* XP */}
      <div className="flex items-center gap-1 text-amber-600">
        <Zap className="w-4 h-4" />
        <span className="font-bold">{user.xp.toLocaleString()}</span>
      </div>
    </motion.div>
  );
}