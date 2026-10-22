import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { LogOut, Settings, Ticket, Wand2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PETS, getPetTheme } from '@/components/quest/PetCatalog';
import BrandLogo from '@/components/branding/BrandLogo';

// Widget components
import WidgetGrid from '@/components/dashboard/WidgetGrid';
import WidgetCustomizer from '@/components/dashboard/WidgetCustomizer';
import { LEGACY_DEFAULT_WIDGETS, getActiveWidgetIds } from '@/lib/widgetRegistry';
// EventManager removed — events only show on Events page
import XPWidget from '@/components/dashboard/widgets/XPWidget';
import PetWidget from '@/components/dashboard/widgets/PetWidget';
import StatsWidget from '@/components/dashboard/widgets/StatsWidget';
import MiniLeaderboardWidget from '@/components/dashboard/widgets/MiniLeaderboardWidget';
import RecentAssignmentsWidget from '@/components/dashboard/widgets/RecentAssignmentsWidget';
import SeasonProgressWidget from '@/components/dashboard/widgets/SeasonProgressWidget';
import QuickNavWidget from '@/components/dashboard/widgets/QuickNavWidget';
import GlobalEventWidget from '@/components/events/GlobalEventWidget';
import Tutorial from '@/components/tutorial/Tutorial';
import WhatsNewPopup from '@/components/announcements/WhatsNewPopup';
import PromoBanner from '@/components/dashboard/PromoBanner';
import RedeemCodeWidget from '@/components/dashboard/widgets/RedeemCodeWidget';
// Optional Home widgets (added to the widget gallery; off until a student adds them)
import MiniMusicPlayerWidget from '@/components/dashboard/widgets/MiniMusicPlayerWidget';
import EventTicketWidget from '@/components/dashboard/widgets/EventTicketWidget';
import PetSpotlightWidget from '@/components/dashboard/widgets/PetSpotlightWidget';
import RewardGoalWidget from '@/components/dashboard/widgets/RewardGoalWidget';
import StickyNoteWidget from '@/components/dashboard/widgets/StickyNoteWidget';
import CollectionSpotlightWidget from '@/components/dashboard/widgets/CollectionSpotlightWidget';
import NextQuestWidget from '@/components/dashboard/widgets/NextQuestWidget';
import WeekWrappedWidget from '@/components/dashboard/widgets/WeekWrappedWidget';
import WheelWindowWidget from '@/components/dashboard/widgets/WheelWindowWidget';
import SchoolBulletinWidget from '@/components/dashboard/widgets/SchoolBulletinWidget';
import CollectionWishlistWidget from '@/components/dashboard/widgets/CollectionWishlistWidget';
import RedeemCodeDialog from '@/components/redeem/RedeemCodeDialog';
import { dismissRedeemWidget, isRedeemWidgetDismissed } from '@/lib/redeemWidgetDismissal';
import { invalidateProfile } from '@/lib/dataCache';
import { useAuth } from '@/lib/AuthContext';
import { isLogoutRestricted } from '@/lib/logoutRestriction';
import LogoutCodeDialog from '@/components/auth/LogoutCodeDialog';

// The layout an account gets before it has saved one — the original widgets.
// Optional widgets are only ever added on purpose, from the widget gallery.
const DEFAULT_WIDGETS = [...LEGACY_DEFAULT_WIDGETS];

export default function Dashboard() {
  const navigate = useNavigate();
  const { authChecked, isAuthenticated, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [recentAssignments, setRecentAssignments] = useState([]);
  // Full visible list for the "what should I do first" widget; the list is
  // already filtered to this student's classes when it is loaded.
  const [visibleAssignments, setVisibleAssignments] = useState([]);
  const [assignmentsFailed, setAssignmentsFailed] = useState(false);
  const [currentPet, setCurrentPet] = useState(null);
  const [petTheme, setPetTheme] = useState(null);

  // Widget state
  const [activeWidgets, setActiveWidgets] = useState(DEFAULT_WIDGETS);
  const [editMode, setEditMode] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showLogoutCodeDialog, setShowLogoutCodeDialog] = useState(false);
  // Opened only from the reward widget or the header action — never on login.
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [showRedeemWidget, setShowRedeemWidget] = useState(false);

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      navigate(createPageUrl('Home'));
    }
  }, [authChecked, isAuthenticated]);

  useEffect(() => {
    if (authChecked && isAuthenticated) {
      loadProfile();
    }
  }, [authChecked, isAuthenticated]);

  const handleTutorialComplete = async () => {
    // Reload profile to reflect tutorial completion
    loadProfile();
  };

  const loadProfile = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      logout();
      return;
    }

    setLoadError(false);
    try {
      // Retry the critical profile fetch a couple times to ride out transient
      // rate-limits instead of immediately showing the error screen.
      let profiles = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          profiles = await base44.entities.UserProfile.filter({ id: profileId });
          break;
        } catch (err) {
          if (attempt === 2) throw err;
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        }
      }
      if (profiles.length === 0) {
        // Session points to a deleted profile — clear it and show login.
        logout();
        return;
      }

      const p = profiles[0];
      setProfile(p);

      // The dismissal is remembered per account, so it is read once the
      // profile id is known.
      setShowRedeemWidget(!isRedeemWidgetDismissed(p.id));

      // Saved layouts are kept as they are: unknown/removed ids are dropped, and
      // an absent or unusable config falls back to the original layout.
      setActiveWidgets(getActiveWidgetIds(p.widgetConfig));

      // Get equipped pet and its theme
      const pet = PETS.find((pet) => pet.id === p.equippedPetId) || PETS[0];
      setCurrentPet(pet);
      setPetTheme(pet.theme);

      // Load visible assignments — non-critical, so a failure here must not
      // blank the whole dashboard. Fall back to an empty list on error.
      let assignments = [];
      let assignmentLoadFailed = false;
      try {
        assignments = await base44.entities.Assignment.filter({ isApproved: true });
      } catch (assignErr) {
        console.error('Error loading assignments (non-fatal):', assignErr);
        assignmentLoadFailed = true;
      }
      let visible = assignments.filter((a) => {
        if (a.target === 'everyone' || a.subject === 'everyone') return true;
        if (a.subject === 'math' && a.target === p.mathTeacher) return true;
        if (a.subject === 'reading' && a.target === p.readingTeacher) return true;
        // Custom subject — check subjectAssignments map
        if (a.subject && a.subject !== 'math' && a.subject !== 'reading' && a.subject !== 'everyone') {
          const assignedTeacher = (p.subjectAssignments || {})[a.subject];
          if (assignedTeacher && a.target === assignedTeacher) return true;
        }
        if (a.target === p.userId) return true;
        return false;
      });
      setRecentAssignments(visible.slice(0, 3));
      setVisibleAssignments(visible);
      // Lets a widget tell "no quests" apart from "quests couldn't load".
      setAssignmentsFailed(assignmentLoadFailed);

      // Create tutorial assignment if user hasn't completed tutorial — non-critical
      if (!p.tutorialCompleted) {
        try {
          const tutorialExists = assignments.find((a) => a.title === '📚 Practice Assignment (Tutorial)' && a.target === p.userId);
          if (!tutorialExists) {
            await base44.entities.Assignment.create({
              title: '📚 Practice Assignment (Tutorial)',
              description: 'This is a practice assignment to help you learn! Complete it to earn 50 XP.',
              subject: 'everyone',
              target: p.userId,
              xpReward: 50,
              isApproved: true,
              isFlagged: false
            });
          }
        } catch (tutorialErr) {
          console.error('Error creating tutorial assignment (non-fatal):', tutorialErr);
        }
      }
    } catch (e) {
      // Transient network/rate-limit failure: keep the session and show Retry
      // instead of bouncing to Home (which caused the redirect loop).
      console.error('Error loading profile:', e);
      setLoadError(true);
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (profile) {
      try {
        const result = await isLogoutRestricted(profile);
        if (result.restricted) {
          setShowLogoutCodeDialog(true);
          return;
        }
      } catch (e) {
        // Fail open: don't block logout if the check itself errors.
      }
    }
    logout();
  };

  const handleLogoutCodeAccepted = () => {
    // Clear admin-session flags so they cannot carry into another login,
    // then perform the existing logout (which clears only session keys).
    localStorage.removeItem('quest_admin_auth');
    logout();
  };

  const handleDismissRedeemWidget = () => {
    dismissRedeemWidget(profile?.id);
    setShowRedeemWidget(false);
  };

  // After a confirmed reward: drop the cached profile row and re-read the
  // dashboard's own copy of it (XP, coins, pets, titles, unlocks).
  const handleRedeemed = () => {
    invalidateProfile(profile?.id);
    loadProfile();
  };

  // A widget equipped something (pet/title): refresh the cached profile row and
  // update the dashboard's own copy so every widget agrees — without refetching.
  const handleProfileUpdated = (updated) => {
    if (!updated) return;
    invalidateProfile(updated.id);
    setProfile(updated);
    const pet = PETS.find((p) => p.id === updated.equippedPetId) || PETS[0];
    setCurrentPet(pet);
    setPetTheme(pet.theme);
  };

  const handleToggleWidget = (widgetId) => {
    setActiveWidgets((prev) => {
      if (prev.includes(widgetId)) {
        return prev.filter((id) => id !== widgetId);
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
      </div>);

  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Couldn't load your dashboard. Check your connection and try again.</p>
          <Button onClick={() => { setLoading(true); loadProfile(); }}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const themeColors = petTheme || PETS[0].theme;

  const renderWidget = (widgetId) => {
    switch (widgetId) {
      case 'xp':
        return <XPWidget key={widgetId} xp={profile.xp} data-tutorial="xp-widget" />;
      case 'pet':
        return <PetWidget key={widgetId} pet={currentPet} themeColors={themeColors} data-tutorial="pet-widget" />;
      case 'stats':
        return (
          <StatsWidget
            key={widgetId}
            xp={profile.xp}
            petsCount={profile.unlockedPets?.length}
            completedCount={profile.completedAssignments?.length} />);


      case 'leaderboard':
        return <MiniLeaderboardWidget key={widgetId} currentUserId={profile.id} />;
      case 'assignments':
        return (
          <RecentAssignmentsWidget
            key={widgetId}
            assignments={recentAssignments}
            completedIds={profile.completedAssignments}
            data-tutorial="assignments-widget" />);


      case 'season':
        return (
          <SeasonProgressWidget
            key={widgetId}
            userXp={profile.xp}
            claimedRewards={profile.claimedSeasonRewards} />);


      case 'nav':
        return <QuickNavWidget key={widgetId} />;

      // --- optional widgets ---
      case 'musicPlayer':
        return <MiniMusicPlayerWidget key={widgetId} profile={profile} />;
      case 'eventTicket':
        return <EventTicketWidget key={widgetId} />;
      case 'petSpotlight':
        return <PetSpotlightWidget key={widgetId} profile={profile} />;
      case 'rewardGoal':
        return <RewardGoalWidget key={widgetId} profile={profile} />;
      case 'stickyNote':
        return <StickyNoteWidget key={widgetId} profileId={profile.id} />;
      case 'collectionNew':
        return (
          <CollectionSpotlightWidget
            key={widgetId}
            profile={profile}
            onProfileChange={handleProfileUpdated} />);


      case 'nextQuest':
        return (
          <NextQuestWidget
            key={widgetId}
            assignments={visibleAssignments}
            completedIds={profile.completedAssignments}
            loadFailed={assignmentsFailed} />);


      case 'weekWrapped':
        return <WeekWrappedWidget key={widgetId} profileId={profile.id} />;
      case 'wheelWindow':
        return <WheelWindowWidget key={widgetId} profileId={profile.id} />;
      case 'bulletin':
        return <SchoolBulletinWidget key={widgetId} profileId={profile.id} />;
      case 'wishlist':
        return <CollectionWishlistWidget key={widgetId} profile={profile} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 lg:px-8 xl:px-12 2xl:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6">

          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo size="lg" showText={false} />
            <div className="min-w-0">
              <p className="text-sm text-slate-500 truncate">Welcome back, {profile.username}!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Permanent entry point, so Home → Redeem Code always works */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRedeemDialog(true)}
              className="shrink-0 gap-1.5 rounded-xl border-purple-200 bg-white/80 text-purple-700 hover:bg-purple-50 hover:text-purple-800">

              <Ticket className="w-4 h-4" />
              Redeem Code
            </Button>
            {profile.isPetCreator &&
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl('PetCreator'))}
              className="text-pink-400 hover:text-pink-600"
              title="Pet Creator">
                <Wand2 className="w-5 h-5" />
              </Button>
            }
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl('UserSettings'))}
              className="text-slate-400 hover:text-slate-600"
              title="User Settings">

              <User className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCustomizer(true)}
              className="text-slate-400 hover:text-slate-600"
              data-tutorial="widget-settings">

              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600">

              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Promo Banner */}
        <PromoBanner profile={profile} />

        {/* Reward code widget — hidden only when this account dismissed it */}
        {showRedeemWidget &&
          <div className="mb-4">
            <RedeemCodeWidget
              onOpen={() => setShowRedeemDialog(true)}
              onDismiss={handleDismissRedeemWidget} />
          </div>
        }

        {/* Widgets */}
        <WidgetGrid
          widgets={activeWidgets}
          onReorder={handleReorderWidgets}
          editMode={editMode}>

          {activeWidgets.map((widgetId) => renderWidget(widgetId))}
        </WidgetGrid>
      </div>

      {/* Global Event Widget */}
      <div className="w-full px-4 lg:px-8 xl:px-12 2xl:px-16 mt-4 pb-4 relative z-0">
        <GlobalEventWidget profile={profile} />
      </div>

      {/* The single redemption dialog, shared by both entry points */}
      <RedeemCodeDialog
        open={showRedeemDialog}
        onOpenChange={setShowRedeemDialog}
        profile={profile}
        onRedeemed={handleRedeemed} />

      {/* Customizer Modal */}
      {showCustomizer &&
      <WidgetCustomizer
        activeWidgets={activeWidgets}
        onToggleWidget={handleToggleWidget}
        onReorder={handleReorderWidgets}
        onClose={() => setShowCustomizer(false)}
        onSave={handleSaveWidgets} />

      }

      {/* Events only on Events page now */}

      {/* Tutorial */}
      <Tutorial profile={profile} currentPage="Dashboard" onComplete={handleTutorialComplete} />

      {/* What's New Popup */}
      <WhatsNewPopup />

      {/* Temporary logout-code restriction dialog */}
      <LogoutCodeDialog
        open={showLogoutCodeDialog}
        onOpenChange={setShowLogoutCodeDialog}
        profile={profile}
        onAllowed={handleLogoutCodeAccepted}
      />
      </div>);

}