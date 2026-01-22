import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Gift, ArrowLeft, Star, Zap, Lock, Check, Sparkles, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PETS, RARITY_COLORS } from '@/components/quest/PetCatalog';
import GlassIcon from '@/components/ui/GlassIcon';
import MagicEggCreator from '@/components/rewards/MagicEggCreator';
import Tutorial from '@/components/tutorial/Tutorial';
import { toast } from 'sonner';

export default function Rewards() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [customPets, setCustomPets] = useState([]);
  const [magicEggs, setMagicEggs] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const [profiles, dbCustomPets, dbMagicEggs] = await Promise.all([
        base44.entities.UserProfile.filter({ id: profileId }),
        base44.entities.CustomPet.list(),
        base44.entities.MagicEgg.list()
      ]);
      if (profiles.length === 0) {
        navigate(createPageUrl('Home'));
        return;
      }
      setProfile(profiles[0]);
      setCustomPets(dbCustomPets);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  const userXp = profile.xp || 0;
  const unlockedPetIds = profile.unlockedPets || ['starter_slime'];

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
              <p className="text-sm text-slate-500">Your pets & their themes</p>
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

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative rounded-xl p-4 mb-6 overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <p className="text-sm text-slate-600 relative z-10">
            <Star className="w-4 h-4 inline mr-1 text-amber-500" />
            Complete assignments to earn <strong>25 XP</strong> and a <strong>random pet</strong>! 
            Each pet has its own <strong>exclusive theme</strong> that activates when equipped.
          </p>
        </motion.div>

        {/* Titles Section */}
        {(profile.unlockedTitles?.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-purple-500" />
              <h2 className="font-bold text-slate-800">Your Titles</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.unlockedTitles.map((title) => {
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

        {/* Magic Eggs Section */}
        {magicEggs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="font-bold text-slate-800">Magic Eggs</h2>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{magicEggs.length} available</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {magicEggs.map((egg, index) => (
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

        {/* Pet Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
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
                {/* Equipped badge */}
                {isEquipped && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-md z-10">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                
                {/* Lock icon */}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm rounded-2xl z-20">
                    <Lock className="w-8 h-8 text-slate-500" />
                  </div>
                )}
                
                {/* Pet emoji or image */}
                <div className="relative z-10">
                  {pet.imageUrl ? (
                    <img src={pet.imageUrl} alt={pet.name} className="w-14 h-14 mx-auto mb-3 rounded-lg object-cover" />
                  ) : (
                    <div className="text-5xl text-center mb-3">{pet.emoji}</div>
                  )}
                </div>
                
                {/* Pet name */}
                <h3 className="font-bold text-slate-800 text-center text-sm mb-1 relative z-10">{pet.name}</h3>
                
                {/* Rarity badge */}
                <div className={`text-xs text-center px-2 py-1 rounded-full ${rarityStyle.bg} ${rarityStyle.text} capitalize mb-2 relative z-10`}>
                  {pet.rarity}
                </div>
                
                {/* Theme preview - liquid glass style */}
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
                
                {/* Description */}
                <p className="text-xs text-slate-500 text-center line-clamp-2 relative z-10">{pet.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
      
      {/* Tutorial */}
      <Tutorial profile={profile} currentPage="Rewards" onComplete={() => {}} />
    </div>
  );
}