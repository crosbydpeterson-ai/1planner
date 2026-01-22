import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Sword, LogOut, Settings, Wand2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PETS, getPetTheme } from '@/components/quest/PetCatalog';
import GlassIcon from '@/components/ui/GlassIcon';

// Widget components
import WidgetGrid from '@/components/dashboard/WidgetGrid';
import WidgetCustomizer from '@/components/dashboard/WidgetCustomizer';
import EventManager from '@/components/events/EventManager';
import XPWidget from '@/components/dashboard/widgets/XPWidget';
import PetWidget from '@/components/dashboard/widgets/PetWidget';
import StatsWidget from '@/components/dashboard/widgets/StatsWidget';
import MiniLeaderboardWidget from '@/components/dashboard/widgets/MiniLeaderboardWidget';
import RecentAssignmentsWidget from '@/components/dashboard/widgets/RecentAssignmentsWidget';
import SeasonProgressWidget from '@/components/dashboard/widgets/SeasonProgressWidget';
import QuickNavWidget from '@/components/dashboard/widgets/QuickNavWidget';

const DEFAULT_WIDGETS = ['xp', 'pet', 'stats', 'leaderboard', 'assignments', 'season', 'nav'];
const ALL_WIDGETS = ['xp', 'pet', 'stats', 'leaderboard', 'assignments', 'season', 'nav'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [currentPet, setCurrentPet] = useState(null);
  const [petTheme, setPetTheme] = useState(null);
  
  // Widget state
  const [activeWidgets, setActiveWidgets] = useState(DEFAULT_WIDGETS);
  const [editMode, setEditMode] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);

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

      // Load widget config from profile or use all widgets as default
      if (p.widgetConfig && Array.isArray(p.widgetConfig)) {
        setActiveWidgets(p.widgetConfig);
      } else {
        setActiveWidgets(ALL_WIDGETS);
      }

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
    navigate(createPageUrl('Home'));
  };

  const handleToggleWidget = (widgetId) => {
    setActiveWidgets(prev => {
      if (prev.includes(widgetId)) {
        return prev.filter(id => id !== widgetId);
      } else {
        return [...prev, widgetId];
      }
    });
  };

  const handleReorderWidgets = (newOrder) => {
    setActiveWidgets(newOrder);
  };

  const handleSaveWidgets = async () => {
    try {
      await base44.entities.UserProfile.update(profile.id, {
        widgetConfig: activeWidgets
      });
      setShowCustomizer(false);
      setEditMode(false);
    } catch (e) {
      console.error('Error saving widget config:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  const themeColors = petTheme || PETS[0].theme;

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'xp':
        return <XPWidget key={widgetId} xp={profile.xp} />;
      case 'pet':
        return <PetWidget key={widgetId} pet={currentPet} themeColors={themeColors} />;
      case 'stats':
        return (
          <StatsWidget 
            key={widgetId}
            xp={profile.xp} 
            petsCount={profile.unlockedPets?.length} 
            completedCount={profile.completedAssignments?.length} 
          />
        );
      case 'leaderboard':
        return <MiniLeaderboardWidget key={widgetId} currentUserId={profile.id} />;
      case 'assignments':
        return (
          <RecentAssignmentsWidget 
            key={widgetId}
            assignments={recentAssignments} 
            completedIds={profile.completedAssignments} 
          />
        );
      case 'season':
        return (
          <SeasonProgressWidget 
            key={widgetId}
            userXp={profile.xp} 
            claimedRewards={profile.claimedSeasonRewards} 
          />
        );
      case 'nav':
        return <QuickNavWidget key={widgetId} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4 pb-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <GlassIcon icon={Sword} color="primary" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">Quest Planner</h1>
              <p className="text-sm text-slate-500">Welcome back, {profile.username}!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {profile.isPetCreator && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(createPageUrl('PetCreator'))}
                className="text-pink-400 hover:text-pink-600"
                title="Pet Creator"
              >
                <Wand2 className="w-5 h-5" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(createPageUrl('UserSettings'))}
              className="text-slate-400 hover:text-slate-600"
              title="User Settings"
            >
              <User className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowCustomizer(true)}
              className="text-slate-400 hover:text-slate-600"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Widgets */}
        <WidgetGrid 
          widgets={activeWidgets} 
          onReorder={handleReorderWidgets}
          editMode={editMode}
        >
          {activeWidgets.map(widgetId => renderWidget(widgetId))}
        </WidgetGrid>
      </div>

      {/* Customizer Modal */}
      {showCustomizer && (
        <WidgetCustomizer
          activeWidgets={activeWidgets}
          onToggleWidget={handleToggleWidget}
          onClose={() => setShowCustomizer(false)}
          onSave={handleSaveWidgets}
        />
      )}

      {/* Event Manager */}
      <EventManager profile={profile} />
    </div>
  );
}