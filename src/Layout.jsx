import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ClipboardList, Trophy, Gem, Sparkles, Shield, ShoppingBag, Coins, CalendarHeart, Info, MessageSquare, ChefHat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import ThemedBackground from '@/components/theme/ThemedBackground';
import ChatbotWidget from '@/components/chat/ChatbotWidget';
import { getPetTheme } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import BrandLogo from '@/components/branding/BrandLogo';

export default function Layout({ children, currentPageName }) {
        const navigate = useNavigate();
        const [themeColors, setThemeColors] = useState(null);
        const [isAdmin, setIsAdmin] = useState(false);
      const [roleLabel, setRoleLabel] = useState('Admin');
        const [showEmailDialog, setShowEmailDialog] = useState(false);
        const [contactEmail, setContactEmail] = useState('');
        const [savingEmail, setSavingEmail] = useState(false);
        const [profileIdState, setProfileIdState] = useState(null);
        const [featureLocks, setFeatureLocks] = useState(null);
        const [currentProfile, setCurrentProfile] = useState(null);
  
  useEffect(() => {
    loadUserTheme();
    checkAdminStatus();
    checkContactEmail();
    loadFeatureLocks();

    // Load active background image
    (async () => {
      try {
        const recs = await base44.entities.AppCustomization.filter({ type: 'background', is_active: true });
        const url = recs[0]?.image || recs[0]?.imageUrl || null;
        if (url) {
          window.__app_custom_bg_url = url;
        } else {
          delete window.__app_custom_bg_url;
        }
      } catch (e) {
        console.error('Failed to load custom background', e);
      }
    })();

    // Subscribe to background updates
    const unsub = base44.entities.AppCustomization.subscribe((evt) => {
      if (['create','update','delete'].includes(evt.type)) {
        (async () => {
          try {
            const recs = await base44.entities.AppCustomization.filter({ type: 'background', is_active: true });
            const url = recs[0]?.image || recs[0]?.imageUrl || null;
            if (url) {
              window.__app_custom_bg_url = url;
            } else {
              delete window.__app_custom_bg_url;
            }
          } catch (e) {
            console.error('Failed to refresh custom background', e);
          }
        })();
      }
    });

    // Listen for theme updates
    const handleThemeUpdate = () => loadUserTheme();
    window.addEventListener('themeUpdated', handleThemeUpdate);
    return () => {
      window.removeEventListener('themeUpdated', handleThemeUpdate);
      unsub?.();
    };
  }, []);

  const checkAdminStatus = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) return;

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) return;

      const profile = profiles[0];
      setCurrentProfile(profile);

      // Admin if rank is admin/super_admin or username is "Crosby" (case-insensitive)
      const nameIsCrosby = (typeof profile.username === 'string' && profile.username.toLowerCase() === 'crosby');
      if (profile.rank === 'super_admin' || nameIsCrosby) {
        setIsAdmin(true);
        setRoleLabel('Super Admin');
        return;
      }
      if (profile.rank === 'admin') {
        setIsAdmin(true);
        setRoleLabel('Admin');
        return;
      }
    } catch (e) {
      console.error('Error checking admin status:', e);
    }
  };

  const loadUserTheme = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) return;

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) return;
      const p = profiles[0];

      // 1) If a standalone theme is equipped, prefer it over pet theme
      if (p.equippedThemeId) {
        if (String(p.equippedThemeId).startsWith('custom_')) {
          const tid = String(p.equippedThemeId).replace('custom_', '');
          const ct = await base44.entities.CustomTheme.filter({ id: tid });
          if (ct.length > 0) {
            // Pass raw values (may be gradient strings or hex)
            setThemeColors({
              primary: ct[0].primaryColor,
              secondary: ct[0].secondaryColor,
              accent: ct[0].accentColor,
              bg: ct[0].bgColor,
            });
            return;
          }
        } else {
          const t = THEMES.find(t => t.id === p.equippedThemeId);
          if (t?.colors) {
            setThemeColors(t.colors);
            return;
          }
        }
      }

      // 2) Otherwise derive theme from equipped pet
      if (p.equippedPetId) {
        const petId = p.equippedPetId;
        if (String(petId).startsWith('custom_')) {
          const customPetId = String(petId).replace('custom_', '');
          const customPets = await base44.entities.CustomPet.filter({ id: customPetId });
          if (customPets.length > 0 && customPets[0].theme) {
            setThemeColors(customPets[0].theme);
            return;
          }
        }
        const petTheme = getPetTheme(petId);
        setThemeColors(petTheme);
        return;
      }

      // 3) Fallback: no theme
      setThemeColors(null);
    } catch (e) {
      console.error('Error loading theme:', e);
    }
  };

  const checkContactEmail = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) return;
    setProfileIdState(profileId);
    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length > 0) {
        const email = profiles[0].contactEmail || '';
        setContactEmail(email);
        if (!email) setShowEmailDialog(true);
      }
    } catch (e) {
      console.error('Error checking contact email:', e);
    }
  };

  const loadFeatureLocks = async () => {
    try {
      const settings = await base44.entities.AppSetting.list();
      const locksSetting = settings.find(s => s.key === 'feature_locks');
      setFeatureLocks(locksSetting ? locksSetting.value : null);
    } catch (e) {
      console.error('Error loading feature locks:', e);
    }
  };

  const isFeatureLockedForUser = (feature) => {
    if (isAdmin) return false;
    if (!featureLocks || !currentProfile) return false;
    const globalLocked = !!featureLocks.global?.[feature];
    const mathLock = !!(featureLocks.classes?.math?.[currentProfile.mathTeacher]?.[feature]);
    const readingLock = !!(featureLocks.classes?.reading?.[currentProfile.readingTeacher]?.[feature]);
    const userEntry = featureLocks.users?.[currentProfile.id]?.[feature];
    const userLocked = typeof userEntry === 'object' ? !!userEntry.locked : !!userEntry;
    return globalLocked || mathLock || readingLock || userLocked;
  };

  const saveContactEmail = async () => {
    if (!contactEmail?.trim()) return;
    const profileId = profileIdState || localStorage.getItem('quest_profile_id');
    if (!profileId) return;
    try {
      setSavingEmail(true);
      await base44.entities.UserProfile.update(profileId, { contactEmail: contactEmail.trim() });
      setSavingEmail(false);
      setShowEmailDialog(false);
    } catch (e) {
      setSavingEmail(false);
      console.error('Failed to save contact email:', e);
    }
  };

  // Don't show navigation on Home (login) page or Admin page
  const hideNav = currentPageName === 'Home' || currentPageName === 'Admin' || currentPageName === 'CommunityWall' || currentPageName === 'community';

  
  const navItems = [
            { name: 'Dashboard', icon: Home, label: 'Home' },
            { name: 'Assignments', icon: ClipboardList, label: 'Quests' },
            { name: 'Shop', icon: ShoppingBag, label: 'Shop' },
            { name: 'Marketplace', icon: Coins, label: 'Market' },
            { name: 'Leaderboard', icon: Trophy, label: 'Rank' },
            { name: 'Rewards', icon: Gem, label: 'Collection' },
            { name: 'Season', icon: Sparkles, label: '1Pass' },
            { name: 'Kitchen', icon: ChefHat, label: 'Kitchen', customPath: '/Kitchen' },
            { name: 'Events', icon: CalendarHeart, label: 'Events' },
            { name: 'Info', icon: Info, label: 'Info' },
            { name: 'community', icon: MessageSquare, label: 'Community', customPath: '/community' },
          ];

  const visibleNavItems = navItems.filter((item) => {
    if (isAdmin) return true;
    if (item.name === 'Shop') return !isFeatureLockedForUser('shop');
    if (item.name === 'Rewards') return !isFeatureLockedForUser('pets');
    if (item.name === 'Season') return !isFeatureLockedForUser('battlePass');
    if (item.name === 'Marketplace') return !isFeatureLockedForUser('market');
    return true;
  });

  return (
    <div className="min-h-screen pb-20 relative">
      {(() => {
        const [customBgUrl, setCustomBgUrl] = [null, null];
        return null;
      })()}
      {/* Background */}
      {typeof window !== 'undefined' && window.__app_custom_bg_url ? (
        <div className="fixed inset-0 -z-10">
          <img src={window.__app_custom_bg_url} alt="Background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/10" />
        </div>
      ) : (
        <ThemedBackground colors={themeColors} />
      )}
      <header className="fixed top-3 left-3 z-50">
        <BrandLogo size="md" />
      </header>
      {children}
      {!hideNav && currentPageName !== 'CommunityWall' && currentPageName !== 'community' && <ChatbotWidget />}
      
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 safe-area-pb z-40">
          <div className="max-w-md mx-auto flex items-center justify-around">
            {visibleNavItems.map((item) => {
              const isActive = currentPageName === item.name || (item.name === 'community' && currentPageName === 'CommunityWall');
              return (
                <Link
                  key={item.name}
                  to={item.customPath || createPageUrl(item.name)}
                  className={cn(
                    "flex flex-col items-center py-1 px-3 rounded-xl transition-all",
                    isActive 
                      ? "text-indigo-600" 
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive && "scale-110")} />
                  <span className="text-xs mt-1 font-medium">{item.label}</span>
                </Link>
              );
              })}
              {isAdmin && (
              <Link
                to={createPageUrl('Admin')}
                className={cn(
                  "flex flex-col items-center py-1 px-3 rounded-xl transition-all",
                  currentPageName === 'Admin' 
                    ? "text-red-600" 
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Shield className="w-5 h-5" />
                <span className="text-xs mt-1 font-medium">{roleLabel}</span>
              </Link>
              )}
          </div>
        </nav>
      )}

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add your contact email</DialogTitle>
            <DialogDescription>
              We’ll use this to send assignment updates and announcements.
              Emails come from 1planner@factvsfalse.com. After saving, please check your Gmail to see what Crosby said.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="you@example.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full"
            />
            <div className="text-xs text-slate-500">
              Tip: Open Gmail in a new tab —
              <a className="underline ml-1" href="https://mail.google.com" target="_blank" rel="noreferrer">mail.google.com</a>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Later</Button>
            <Button onClick={saveContactEmail} disabled={savingEmail || !contactEmail?.trim()}>
              {savingEmail ? 'Saving...' : 'Save email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .safe-area-pb {
          padding-bottom: max(env(safe-area-inset-bottom), 8px);
        }
      `}</style>
      </div>
      );
}