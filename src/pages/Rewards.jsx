import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Gift, ArrowLeft, Star, Zap, Lock, Check, Sparkles, Award, Palette } from 'lucide-react';
import LockedOverlay from '@/components/common/LockedOverlay';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PETS, RARITY_COLORS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import PetAvatar from '@/components/quest/PetAvatar';
import GlassIcon from '@/components/ui/GlassIcon';
import MagicEggCreator from '@/components/rewards/MagicEggCreator';
import Tutorial from '@/components/tutorial/Tutorial';
import { toast } from 'sonner';

export default function Rewards() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [customPets, setCustomPets] = useState([]);
  const [customThemes, setCustomThemes] = useState([]);
  const [petCosmetics, setPetCosmetics] = useState([]);
  const [magicEggs, setMagicEggs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pets');
  const [locks, setLocks] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadData();
    base44.analytics.track({ eventName: 'rewards_viewed' });
  }, []);

  const loadData = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      navigate(createPageUrl('Home'));
      return;
    }

    try {
      const [profiles, dbCustomPets, dbCustomThemes, dbCosmetics, dbMagicEggs] = await Promise.all([
        base44.entities.UserProfile.filter({ id: profileId }),
        base44.entities.CustomPet.list(),
        base44.entities.CustomTheme.list(),
        base44.entities.PetCosmetic.list(),
        base44.entities.MagicEgg.list()
      ]);
      if (profiles.length === 0) {
        navigate(createPageUrl('Home'));
        return;
      }
      const me = profiles[0];
      setProfile(me);

      // Admin check
      const allProfiles = await base44.entities.UserProfile.list('created_date', 1);
      const adminUser = me.username?.toLowerCase?.() === 'crosby' || (allProfiles[0] && allProfiles[0].id === me.id);
      setIsAdmin(!!adminUser);

      // Locks
      const settings = await base44.entities.AppSetting.list();
      const fl = settings.find(s => s.key === 'feature_locks');
      setLocks(fl ? fl.value : null);

      setCustomPets(dbCustomPets);
      setCustomThemes(dbCustomThemes);
      setPetCosmetics(dbCosmetics);
      // Filter eggs for this user that haven't been used
      const userEggs = dbMagicEggs.filter(e => e.userId === profiles[0].userId && !e.isUsed);
      setMagicEggs(userEggs);
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const handleEquipPet = async (petId, petData) => {
    if (!profile) return;

    const unlockedPets = profile.unlockedPets || ['starter_slime'];
    if (!unlockedPets.includes(petId)) {
      toast.error('You have not unlocked this pet yet!');
      return;
    }

    try {
      await base44.entities.UserProfile.update(profile.id, {
        equippedPetId: petId
      });
      setProfile({ ...profile, equippedPetId: petId });
      toast.success(`${petData?.emoji || '🎁'} ${petData?.name} equipped!`, {
        description: `${petData?.name}'s exclusive theme is now active!`
      });
      // Trigger theme update in layout
      window.dispatchEvent(new Event('themeUpdated'));
    } catch (e) {
      console.error('Error equipping pet:', e);
      toast.error('Failed to equip pet');
    }
  };

  const handleEquipTheme = async (themeId, themeName) => {
    if (!profile) return;

    const unlockedThemes = profile.unlockedThemes || [];
    if (!unlockedThemes.includes(themeId)) {
      toast.error('You have not unlocked this theme yet!');
      return;
    }

    try {
      await base44.entities.UserProfile.update(profile.id, {
        equippedThemeId: themeId,
        equippedPetId: null // Clear pet to use standalone theme
      });
      setProfile({ ...profile, equippedThemeId: themeId, equippedPetId: null });
      toast.success(`${themeName} theme equipped!`);
      window.dispatchEvent(new Event('themeUpdated'));
    } catch (e) {
      console.error('Error equipping theme:', e);
      toast.error('Failed to equip theme');
    }
  };

  const handleEquipTitle = async (title) => {
    if (!profile) return;

    const unlockedTitles = profile.unlockedTitles || [];
    if (!unlockedTitles.includes(title)) {
      toast.error('You have not unlocked this title yet!');
      return;
    }

    try {
      // Toggle off if already equipped
      const newTitle = profile.equippedTitle === title ? '' : title;
      await base44.entities.UserProfile.update(profile.id, {
        equippedTitle: newTitle
      });
      setProfile({ ...profile, equippedTitle: newTitle });
      toast.success(newTitle ? `Title "${title}" equipped!` : 'Title removed');
    } catch (e) {
      console.error('Error equipping title:', e);
      toast.error('Failed to equip title');
    }
  };

  const handleToggleCosmetic = async (cosmeticId) => {
    if (!profile) return;

    const unlockedCosmetics = profile.unlockedCosmetics || [];
    if (!unlockedCosmetics.includes(cosmeticId)) {
      toast.error('You have not unlocked this cosmetic yet!');
      return;
    }

    try {
      const equippedCosmetics = profile.equippedCosmetics || [];
      const isEquipped = equippedCosmetics.includes(cosmeticId);
      
      const newEquipped = isEquipped 
        ? equippedCosmetics.filter(id => id !== cosmeticId)
        : [...equippedCosmetics, cosmeticId];
      
      await base44.entities.UserProfile.update(profile.id, {
        equippedCosmetics: newEquipped
      });
      setProfile({ ...profile, equippedCosmetics: newEquipped });
      toast.success(isEquipped ? 'Cosmetic removed' : 'Cosmetic equipped!');
    } catch (e) {
      console.error('Error toggling cosmetic:', e);
      toast.error('Failed to toggle cosmetic');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  const userLock = locks?.users?.[profile.id]?.pets;
  const isLocked = !isAdmin && ((typeof userLock === 'object' ? userLock.locked : !!userLock));
  const lockMsg = typeof userLock === 'object' ? (userLock.message || '') : '';
  if (isLocked) {
    return <LockedOverlay featureLabel="Collection" message={lockMsg || "An Admin or Mod has locked this feature. You can't currently use it."} />;
  }

  const userXp = profile.xp || 0;
  const unlockedPetIds = profile.unlockedPets || ['starter_slime'];
  const unlockedThemeIds = profile.unlockedThemes || ['default'];
  const unlockedCosmeticIds = profile.unlockedCosmetics || [];
  const unlockedTitles = profile.unlockedTitles || [];

  const handlePetCreated = (newPet, newPetId) => {
    setCustomPets([...customPets, newPet]);
    setMagicEggs(magicEggs.slice(1)); // Remove used egg
    setProfile({
      ...profile,
      unlockedPets: [...(profile.unlockedPets || []), newPetId],
      equippedPetId: newPetId
    });
  };

  // Combine built-in pets with custom pets
  const allPets = [
    ...PETS,
    ...customPets.map(cp => ({
      id: `custom_${cp.id}`,
      name: cp.name,
      rarity: cp.rarity,
      description: cp.description || '',
      emoji: cp.emoji || '🎁',
      imageUrl: cp.imageUrl,
      theme: cp.theme || { primary: '#6366f1', secondary: '#a855f7', accent: '#f59e0b', bg: '#f8fafc' }
    }))
  ];

  // Combine built-in themes with custom themes
  const allThemes = [
    ...THEMES,
    ...customThemes.map(ct => ({
      id: `custom_${ct.id}`,
      name: ct.name,
      rarity: ct.rarity,
      description: ct.description || '',
      xpRequired: ct.xpRequired,
      primary: ct.primaryColor,
      secondary: ct.secondaryColor,
      accent: ct.accentColor,
      bg: ct.bgColor
    }))
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <GlassIcon icon={Gift} color="purple" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Collection</h1>
              <p className="text-sm text-slate-500">Your pets, themes & cosmetics</p>
            </div>
          </div>
        </motion.div>

        {/* XP Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white mb-6 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm">Your XP</p>
              <p className="text-3xl font-bold flex items-center gap-2">
                <Zap className="w-6 h-6" />
                {userXp.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-amber-100 text-sm">Pets Collected</p>
              <p className="text-xl font-bold">{unlockedPetIds.length} / {allPets.length}</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/30 backdrop-blur-xl border border-white/20 mb-6 w-full grid grid-cols-3">
            <TabsTrigger value="pets" className="data-[state=active]:bg-white/60">
              <Star className="w-4 h-4 mr-2" />
              Pets ({unlockedPetIds.length})
            </TabsTrigger>
            <TabsTrigger value="themes" className="data-[state=active]:bg-white/60">
              <Palette className="w-4 h-4 mr-2" />
              Themes ({unlockedThemeIds.length})
            </TabsTrigger>
            <TabsTrigger value="cosmetics" className="data-[state=active]:bg-white/60">
              <Sparkles className="w-4 h-4 mr-2" />
              Cosmetics ({unlockedCosmeticIds.length + unlockedTitles.length})
            </TabsTrigger>
          </TabsList>

          {/* Pets Tab */}
          <TabsContent value="pets">
            {/* Magic Eggs */}
            {magicEggs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h2 className="font-bold text-slate-800">Magic Eggs</h2>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{magicEggs.length} available</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {magicEggs.map((egg) => (
                    <MagicEggCreator 
                      key={egg.id} 
                      egg={egg} 
                      profile={profile}
                      onPetCreated={handlePetCreated}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-xl p-4 mb-6 overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <p className="text-sm text-slate-600 relative z-10">
                <Star className="w-4 h-4 inline mr-1 text-amber-500" />
                Complete assignments to earn <strong>25 XP</strong> and a <strong>random pet</strong>! 
                Each pet has its own <strong>exclusive theme</strong> that activates when equipped.
              </p>
            </motion.div>

            {/* Pet Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allPets.map((pet, index) => {
                const isUnlocked = unlockedPetIds.includes(pet.id);
                const isEquipped = profile.equippedPetId === pet.id;
                const rarityStyle = RARITY_COLORS[pet.rarity] || RARITY_COLORS.common;
                const theme = pet.theme || { primary: '#6366f1', secondary: '#a855f7', accent: '#f59e0b' };
                
                return (
                  <motion.div
                    key={pet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => isUnlocked && handleEquipPet(pet.id, pet)}
                    className={`
                      relative rounded-2xl p-4 transition-all cursor-pointer overflow-hidden
                      ${isEquipped 
                        ? 'bg-amber-500/20 backdrop-blur-xl border border-amber-300/30 shadow-lg scale-[1.02]' 
                        : isUnlocked 
                          ? 'bg-white/20 backdrop-blur-xl border border-white/20 hover:bg-white/30 hover:shadow-md' 
                          : 'bg-white/10 backdrop-blur-xl border border-white/10 opacity-60 cursor-not-allowed'
                      }
                    `}
                  >
                    {isEquipped && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-md z-10">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                    
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm rounded-2xl z-20">
                        <Lock className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                    
                    <div className="relative z-10">
                      {pet.imageUrl ? (
                        <img src={pet.imageUrl} alt={pet.name} className="w-14 h-14 mx-auto mb-3 rounded-lg object-cover" />
                      ) : (
                        <div className="text-5xl text-center mb-3">{pet.emoji}</div>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-slate-800 text-center text-sm mb-1 relative z-10">{pet.name}</h3>
                    
                    <div className={`text-xs text-center px-2 py-1 rounded-full ${rarityStyle.bg} ${rarityStyle.text} capitalize mb-2 relative z-10`}>
                      {pet.rarity}
                    </div>
                    
                    <div className="flex justify-center gap-1 mb-2 relative z-10">
                      <div 
                        className="w-5 h-5 rounded-full shadow-lg ring-1 ring-white/30" 
                        style={{ 
                          backgroundColor: theme.primary,
                          boxShadow: `0 2px 8px ${theme.primary}50`
                        }} 
                      />
                      <div 
                        className="w-5 h-5 rounded-full shadow-lg ring-1 ring-white/30" 
                        style={{ 
                          backgroundColor: theme.secondary,
                          boxShadow: `0 2px 8px ${theme.secondary}50`
                        }} 
                      />
                      <div 
                        className="w-5 h-5 rounded-full shadow-lg ring-1 ring-white/30" 
                        style={{ 
                          backgroundColor: theme.accent,
                          boxShadow: `0 2px 8px ${theme.accent}50`
                        }} 
                      />
                    </div>
                    
                    <p className="text-xs text-slate-500 text-center line-clamp-2 relative z-10">{pet.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Themes Tab */}
          <TabsContent value="themes">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-xl p-4 mb-6 overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
              <p className="text-sm text-slate-600 relative z-10">
                <Palette className="w-4 h-4 inline mr-1 text-indigo-500" />
                Equip a <strong>standalone theme</strong> to customize your app colors without changing your pet!
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allThemes.map((theme, index) => {
                const isUnlocked = unlockedThemeIds.includes(theme.id);
                const isEquipped = profile.equippedThemeId === theme.id && !profile.equippedPetId;
                const rarityStyle = RARITY_COLORS[theme.rarity] || RARITY_COLORS.common;
                
                return (
                  <motion.div
                    key={theme.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => isUnlocked && handleEquipTheme(theme.id, theme.name)}
                    className={`
                      relative rounded-2xl p-4 transition-all cursor-pointer overflow-hidden
                      ${isEquipped 
                        ? 'bg-indigo-500/20 backdrop-blur-xl border border-indigo-300/30 shadow-lg scale-[1.02]' 
                        : isUnlocked 
                          ? 'bg-white/20 backdrop-blur-xl border border-white/20 hover:bg-white/30 hover:shadow-md' 
                          : 'bg-white/10 backdrop-blur-xl border border-white/10 opacity-60 cursor-not-allowed'
                      }
                    `}
                  >
                    {isEquipped && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-400 rounded-full flex items-center justify-center shadow-md z-10">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                    
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm rounded-2xl z-20">
                        <Lock className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                    
                    {/* Theme colors preview */}
                    <div className="relative z-10 mb-3">
                      <div className="flex justify-center gap-1">
                        <div className="w-10 h-10 rounded-full shadow-lg ring-2 ring-white/30" style={{ backgroundColor: theme.primary }} />
                        <div className="w-10 h-10 rounded-full shadow-lg ring-2 ring-white/30" style={{ backgroundColor: theme.secondary }} />
                      </div>
                      <div className="flex justify-center gap-1 mt-1">
                        <div className="w-6 h-6 rounded-full shadow-lg ring-1 ring-white/30" style={{ backgroundColor: theme.accent }} />
                        <div className="w-6 h-6 rounded-full shadow-lg ring-1 ring-white/30 border border-slate-300" style={{ backgroundColor: theme.bg }} />
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 text-center text-sm mb-1 relative z-10">{theme.name}</h3>
                    
                    <div className={`text-xs text-center px-2 py-1 rounded-full ${rarityStyle.bg} ${rarityStyle.text} capitalize mb-2 relative z-10`}>
                      {theme.rarity}
                    </div>
                    
                    {theme.description && (
                      <p className="text-xs text-slate-500 text-center line-clamp-2 relative z-10">{theme.description}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Cosmetics & Titles Tab */}
          <TabsContent value="cosmetics">
            {/* Titles Section */}
            {unlockedTitles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-5 h-5 text-purple-500" />
                  <h2 className="font-bold text-slate-800">Your Titles</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {unlockedTitles.map((title) => {
                    const isEquipped = profile.equippedTitle === title;
                    return (
                      <motion.button
                        key={title}
                        onClick={() => handleEquipTitle(title)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          px-4 py-2 rounded-xl font-semibold text-sm transition-all
                          ${isEquipped 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                            : 'bg-white/30 backdrop-blur-xl border border-white/20 text-slate-700 hover:bg-white/50'
                          }
                        `}
                      >
                        {isEquipped && <Check className="w-4 h-4 inline mr-1" />}
                        {title}
                      </motion.button>
                    );
                  })}
                </div>
                {profile.equippedTitle && (
                  <p className="text-xs text-slate-500 mt-2">
                    Your title "{profile.equippedTitle}" is shown on the leaderboard!
                  </p>
                )}
              </motion.div>
            )}

            {/* Pet Cosmetics Section */}
            {unlockedCosmeticIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                  <h2 className="font-bold text-slate-800">Pet Cosmetics</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {petCosmetics.filter(c => unlockedCosmeticIds.includes(c.id)).map((cosmetic, index) => {
                    const isEquipped = (profile.equippedCosmetics || []).includes(cosmetic.id);
                    const rarityStyle = RARITY_COLORS[cosmetic.rarity] || RARITY_COLORS.common;
                    
                    return (
                      <motion.div
                        key={cosmetic.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleToggleCosmetic(cosmetic.id)}
                        className={`
                          relative rounded-2xl p-4 transition-all cursor-pointer overflow-hidden
                          ${isEquipped 
                            ? 'bg-pink-500/20 backdrop-blur-xl border border-pink-300/30 shadow-lg scale-[1.02]' 
                            : 'bg-white/20 backdrop-blur-xl border border-white/20 hover:bg-white/30 hover:shadow-md'
                          }
                        `}
                      >
                        {isEquipped && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center shadow-md z-10">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        
                        <div className="relative z-10">
                          {cosmetic.imageUrl && (
                            <img src={cosmetic.imageUrl} alt={cosmetic.name} className="w-14 h-14 mx-auto mb-3 object-contain" />
                          )}
                        </div>
                        
                        <h3 className="font-bold text-slate-800 text-center text-sm mb-1 relative z-10">{cosmetic.name}</h3>
                        
                        <div className={`text-xs text-center px-2 py-1 rounded-full ${rarityStyle.bg} ${rarityStyle.text} capitalize mb-1 relative z-10`}>
                          {cosmetic.cosmeticType}
                        </div>
                        
                        {cosmetic.description && (
                          <p className="text-xs text-slate-500 text-center line-clamp-2 relative z-10">{cosmetic.description}</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {unlockedTitles.length === 0 && unlockedCosmeticIds.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No cosmetics or titles unlocked yet</p>
                <p className="text-sm">Check the shop for exclusive items!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Tutorial */}
      <Tutorial profile={profile} currentPage="Rewards" onComplete={() => {}} />
    </div>
  );
}