import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Gift, ArrowLeft, Palette, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PetCard from '@/components/quest/PetCard';
import ThemeCard from '@/components/quest/ThemeCard';
import { PETS, getUnlockedPets } from '@/components/quest/PetCatalog';
import { THEMES, getUnlockedThemes } from '@/components/quest/ThemeCatalog';
import { toast } from 'sonner';

export default function Rewards() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pets');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      navigate(createPageUrl('Home'));
      return;
    }

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) {
        navigate(createPageUrl('Home'));
        return;
      }
      setProfile(profiles[0]);
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const handleEquipPet = async (petId) => {
    if (!profile) return;

    // Verify user has unlocked this pet
    const unlockedPets = getUnlockedPets(profile.xp || 0);
    if (!unlockedPets.includes(petId)) {
      toast.error('You have not unlocked this pet yet!');
      return;
    }

    try {
      await base44.entities.UserProfile.update(profile.id, {
        equippedPetId: petId
      });
      setProfile({ ...profile, equippedPetId: petId });
      const pet = PETS.find(p => p.id === petId);
      toast.success(`${pet?.emoji} ${pet?.name} equipped!`);
    } catch (e) {
      console.error('Error equipping pet:', e);
      toast.error('Failed to equip pet');
    }
  };

  const handleEquipTheme = async (themeId) => {
    if (!profile) return;

    // Verify user has unlocked this theme
    const unlockedThemes = getUnlockedThemes(profile.xp || 0);
    if (!unlockedThemes.includes(themeId)) {
      toast.error('You have not unlocked this theme yet!');
      return;
    }

    try {
      await base44.entities.UserProfile.update(profile.id, {
        equippedThemeId: themeId
      });
      setProfile({ ...profile, equippedThemeId: themeId });
      const theme = THEMES.find(t => t.id === themeId);
      toast.success(`${theme?.name} theme applied!`);
    } catch (e) {
      console.error('Error applying theme:', e);
      toast.error('Failed to apply theme');
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

  const userXp = profile.xp || 0;
  const unlockedPetIds = getUnlockedPets(userXp);
  const unlockedThemeIds = getUnlockedThemes(userXp);

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
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Rewards</h1>
              <p className="text-sm text-slate-500">Unlock pets & themes with XP</p>
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
              <p className="text-amber-100 text-sm">Unlocked</p>
              <p className="text-xl font-bold">{unlockedPetIds.length} pets • {unlockedThemeIds.length} themes</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-white shadow-sm border border-slate-100 p-1 rounded-xl mb-6 w-full">
            <TabsTrigger value="pets" className="flex-1 rounded-lg">
              <Star className="w-4 h-4 mr-2" />
              Pets ({unlockedPetIds.length}/{PETS.length})
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex-1 rounded-lg">
              <Palette className="w-4 h-4 mr-2" />
              Themes ({unlockedThemeIds.length}/{THEMES.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pets">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {PETS.map((pet, index) => (
                <motion.div
                  key={pet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PetCard
                    pet={pet}
                    isUnlocked={unlockedPetIds.includes(pet.id)}
                    isEquipped={profile.equippedPetId === pet.id}
                    onEquip={handleEquipPet}
                    userXp={userXp}
                  />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          <TabsContent value="themes">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {THEMES.map((theme, index) => (
                <motion.div
                  key={theme.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ThemeCard
                    theme={theme}
                    isUnlocked={unlockedThemeIds.includes(theme.id)}
                    isEquipped={profile.equippedThemeId === theme.id}
                    onEquip={handleEquipTheme}
                    userXp={userXp}
                  />
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}