import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ClipboardList, Trophy, Gem, Sparkles, Shield, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import ThemedBackground from '@/components/theme/ThemedBackground';
import ChatbotWidget from '@/components/chat/ChatbotWidget';
import { PETS, getPetTheme } from '@/components/quest/PetCatalog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Layout({ children, currentPageName }) {
        const navigate = useNavigate();
        const [themeColors, setThemeColors] = useState(null);
        const [isAdmin, setIsAdmin] = useState(false);
        const [showEmailDialog, setShowEmailDialog] = useState(false);
        const [contactEmail, setContactEmail] = useState('');
        const [savingEmail, setSavingEmail] = useState(false);
        const [profileIdState, setProfileIdState] = useState(null);
  
  useEffect(() => {
    loadUserTheme();
    checkAdminStatus();
    checkContactEmail();

    // Listen for theme updates
    const handleThemeUpdate = () => loadUserTheme();
    window.addEventListener('themeUpdated', handleThemeUpdate);
    return () => window.removeEventListener('themeUpdated', handleThemeUpdate);
  }, []);

  const checkAdminStatus = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) return;
    
    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) return;
      
      const currentProfile = profiles[0];
      
      // Admin if rank is admin/super_admin or username is "Crosby" (case-insensitive)
      if (currentProfile.rank === 'admin' || currentProfile.rank === 'super_admin' || (typeof currentProfile.username === 'string' && currentProfile.username.toLowerCase() === 'crosby')) {
        setIsAdmin(true);
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
      if (profiles.length > 0 && profiles[0].equippedPetId) {
        const petId = profiles[0].equippedPetId;
        
        // Check if it's a custom pet
        if (petId.startsWith('custom_')) {
          const customPetId = petId.replace('custom_', '');
          const customPets = await base44.entities.CustomPet.filter({ id: customPetId });
          if (customPets.length > 0 && customPets[0].theme) {
            setThemeColors(customPets[0].theme);
            return;
          }
        }
        
        // Get theme from built-in pet
        const petTheme = getPetTheme(petId);
        setThemeColors(petTheme);
      }
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
  const hideNav = currentPageName === 'Home' || currentPageName === 'Admin';

  
  const navItems = [
    { name: 'Dashboard', icon: Home, label: 'Home' },
    { name: 'Assignments', icon: ClipboardList, label: 'Quests' },
    { name: 'Shop', icon: ShoppingBag, label: 'Shop' },
    { name: 'Leaderboard', icon: Trophy, label: 'Rank' },
    { name: 'Rewards', icon: Gem, label: 'Collection' },
    { name: 'Season', icon: Sparkles, label: 'Season' },
  ];

  return (
    <div className="min-h-screen pb-20 relative">
      <ThemedBackground colors={themeColors} />
      {children}
      {!hideNav && <ChatbotWidget />}
      
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 safe-area-pb">
          <div className="max-w-md mx-auto flex items-center justify-around">
            {navItems.map((item) => {
              const isActive = currentPageName === item.name;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
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
                <span className="text-xs mt-1 font-medium">Admin</span>
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