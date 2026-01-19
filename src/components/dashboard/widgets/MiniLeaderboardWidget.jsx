import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PETS } from '@/components/quest/PetCatalog';

export default function MiniLeaderboardWidget({ currentUserId }) {
  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTop3();
  }, []);

  const loadTop3 = async () => {
    try {
      const allProfiles = await base44.entities.UserProfile.list('-xp', 10);
      const visible = allProfiles
        .filter(p => !p.isLocked && !p.hiddenFromLeaderboard)
        .slice(0, 3);
      
      const withPets = visible.map(p => {
        const pet = PETS.find(pet => pet.id === p.equippedPetId);
        return { ...p, emoji: pet?.emoji || '🟢' };
      });
      
      setTopUsers(withPets);
    } catch (e) {
      console.error('Error loading leaderboard:', e);
    }
    setLoading(false);
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-4 overflow-hidden bg-white/60 backdrop-blur-xl border border-white/40 shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-800">Top 3</h3>
          </div>
          <Link 
            to={createPageUrl('Leaderboard')}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="py-4 text-center text-slate-400 text-sm">Loading...</div>
        ) : topUsers.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-sm">No users yet</div>
        ) : (
          <div className="space-y-2">
            {topUsers.map((user, index) => (
              <div 
                key={user.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  user.id === currentUserId 
                    ? 'bg-indigo-500/20 backdrop-blur-sm border border-indigo-300/30' 
                    : 'bg-white/40 backdrop-blur-sm border border-white/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{medals[index]}</span>
                  <span className="text-lg">{user.emoji}</span>
                  <span className="font-medium text-slate-700 text-sm">{user.username}</span>
                </div>
                <span className="text-sm font-semibold text-amber-600">{user.xp || 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}