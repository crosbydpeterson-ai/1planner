import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { 
  Sword, Sparkles, ClipboardList, Trophy, Gift, 
  LogOut, Settings, ChevronRight, Zap, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import XPProgress from '@/components/quest/XPProgress';
import { PETS, getPetTheme } from '@/components/quest/PetCatalog';

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [currentPet, setCurrentPet] = useState(null);
  const [petTheme, setPetTheme] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      navigate(createPageUrl('Home'));
      return;
    }

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) {
        localStorage.clear();
        navigate(createPageUrl('Home'));
        return;
      }

      const p = profiles[0];
      setProfile(p);

      // Get equipped pet and its theme
      const pet = PETS.find(pet => pet.id === p.equippedPetId) || PETS[0];
      setCurrentPet(pet);
      setPetTheme(pet.theme);

      // Load visible assignments
      const assignments = await base44.entities.Assignment.filter({ isApproved: true });
      const visible = assignments.filter(a => {
        if (a.target === 'everyone' || a.subject === 'everyone') return true;
        if (a.subject === 'math' && a.target === p.mathTeacher) return true;
        if (a.subject === 'reading' && a.target === p.readingTeacher) return true;
        return false;
      });
      setRecentAssignments(visible.slice(0, 3));
    } catch (e) {
      console.error('Error loading profile:', e);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('quest_user_id');
    localStorage.removeItem('quest_profile_id');
    localStorage.removeItem('quest_username');
    navigate(createPageUrl('Login'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  const themeColors = petTheme || PETS[0].theme;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4 pb-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})` }}
            >
              <Sword className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Quest Planner</h1>
              <p className="text-sm text-slate-500">Welcome back, {profile.username}!</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-600"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </motion.div>

        {/* XP Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-slate-100"
        >
          <XPProgress xp={profile.xp || 0} />
        </motion.div>

        {/* Pet & Theme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {/* Equipped Pet */}
          <div className="bg-white rounded-2xl shadow-md p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{currentPet?.emoji || '🟢'}</div>
              <div>
                <p className="text-xs text-slate-400">Companion</p>
                <p className="font-semibold text-slate-800">{currentPet?.name || 'Starter Slime'}</p>
              </div>
            </div>
          </div>

          {/* Pet's Theme */}
          <div className="bg-white rounded-2xl shadow-md p-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div 
                  className="w-4 h-8 rounded-full"
                  style={{ backgroundColor: themeColors.primary }}
                />
                <div 
                  className="w-4 h-8 rounded-full"
                  style={{ backgroundColor: themeColors.secondary }}
                />
                <div 
                  className="w-4 h-8 rounded-full"
                  style={{ backgroundColor: themeColors.accent }}
                />
              </div>
              <div>
                <p className="text-xs text-slate-400">Pet's Theme</p>
                <p className="font-semibold text-slate-800">{currentPet?.name || 'Starter'}'s Colors</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-xl font-bold text-slate-800">{profile.xp || 0}</p>
            <p className="text-xs text-slate-400">Total XP</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <Star className="w-5 h-5 mx-auto mb-1 text-purple-500" />
            <p className="text-xl font-bold text-slate-800">{profile.unlockedPets?.length || 1}</p>
            <p className="text-xs text-slate-400">Pets</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
            <ClipboardList className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            <p className="text-xl font-bold text-slate-800">{profile.completedAssignments?.length || 0}</p>
            <p className="text-xs text-slate-400">Completed</p>
          </div>
        </motion.div>

        {/* Recent Assignments */}
        {recentAssignments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-md p-5 border border-slate-100 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">Recent Assignments</h2>
              <Link 
                to={createPageUrl('Assignments')}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentAssignments.map((assignment) => {
                const isCompleted = profile.completedAssignments?.includes(assignment.id);
                return (
                  <div 
                    key={assignment.id}
                    className={`p-3 rounded-xl border ${isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${isCompleted ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>
                        {assignment.title}
                      </span>
                      {assignment.xpReward && (
                        <span className="text-xs font-semibold text-amber-600">+{assignment.xpReward} XP</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Navigation Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-4"
        >
          <Link to={createPageUrl('Assignments')}>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
              <ClipboardList className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg">Assignments</h3>
              <p className="text-emerald-100 text-sm">Complete quests for XP</p>
            </div>
          </Link>

          <Link to={createPageUrl('Leaderboard')}>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
              <Trophy className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg">Leaderboard</h3>
              <p className="text-amber-100 text-sm">See top students</p>
            </div>
          </Link>

          <Link to={createPageUrl('Rewards')}>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
              <Gift className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg">Rewards</h3>
              <p className="text-purple-100 text-sm">Pets, themes & more</p>
            </div>
          </Link>

          <Link to={createPageUrl('Season')}>
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow">
              <Sparkles className="w-8 h-8 mb-3" />
              <h3 className="font-bold text-lg">Season</h3>
              <p className="text-indigo-100 text-sm">Claim season rewards</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}