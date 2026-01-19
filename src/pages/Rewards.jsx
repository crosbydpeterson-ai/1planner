import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Gift, ArrowLeft, Star, Zap, Lock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PETS, RARITY_COLORS } from '@/components/quest/PetCatalog';
import { toast } from 'sonner';

export default function Rewards() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const pet = PETS.find(p => p.id === petId);
      toast.success(`${pet?.emoji} ${pet?.name} equipped!`, {
        description: `${pet?.name}'s exclusive theme is now active!`
      });
      // Trigger theme update in layout
      window.dispatchEvent(new Event('themeUpdated'));
    } catch (e) {
      console.error('Error equipping pet:', e);
      toast.error('Failed to equip pet');
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
              <p className="text-xl font-bold">{unlockedPetIds.length} / {PETS.length}</p>
            </div>
          </div>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl p-4 mb-6 border border-slate-200"
        >
          <p className="text-sm text-slate-600">
            <Star className="w-4 h-4 inline mr-1 text-amber-500" />
            Complete assignments to earn <strong>25 XP</strong> and a <strong>random pet</strong>! 
            Each pet has its own <strong>exclusive theme</strong> that activates when equipped.
          </p>
        </motion.div>

        {/* Pet Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {PETS.map((pet, index) => {
            const isUnlocked = unlockedPetIds.includes(pet.id);
            const isEquipped = profile.equippedPetId === pet.id;
            const rarityStyle = RARITY_COLORS[pet.rarity];
            
            return (
              <motion.div
                key={pet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => isUnlocked && handleEquipPet(pet.id)}
                className={`
                  relative rounded-2xl p-4 border-2 transition-all cursor-pointer
                  ${isEquipped 
                    ? 'border-amber-400 bg-amber-50 shadow-lg scale-[1.02]' 
                    : isUnlocked 
                      ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md' 
                      : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed'
                  }
                `}
              >
                {/* Equipped badge */}
                {isEquipped && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Lock icon */}
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-100/50 rounded-2xl">
                    <Lock className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                
                {/* Pet emoji */}
                <div className="text-5xl text-center mb-3">{pet.emoji}</div>
                
                {/* Pet name */}
                <h3 className="font-bold text-slate-800 text-center text-sm mb-1">{pet.name}</h3>
                
                {/* Rarity badge */}
                <div className={`text-xs text-center px-2 py-1 rounded-full ${rarityStyle.bg} ${rarityStyle.text} capitalize mb-2`}>
                  {pet.rarity}
                </div>
                
                {/* Theme preview */}
                <div className="flex justify-center gap-1 mb-2">
                  <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: pet.theme.primary }} />
                  <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: pet.theme.secondary }} />
                  <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: pet.theme.accent }} />
                </div>
                
                {/* Description */}
                <p className="text-xs text-slate-500 text-center line-clamp-2">{pet.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}