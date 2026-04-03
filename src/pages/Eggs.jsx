import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Egg } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EggCard from '@/components/eggs/EggCard';
import EggOpenAnimation from '@/components/eggs/EggOpenAnimation';
import { PETS } from '@/components/quest/PetCatalog';

export default function Eggs() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lootEggs, setLootEggs] = useState([]);
  const [myDrops, setMyDrops] = useState([]);
  const [openingEgg, setOpeningEgg] = useState(null); // { egg, drop }
  const [customPets, setCustomPets] = useState([]);
  const [customThemes, setCustomThemes] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) { navigate(createPageUrl('Home')); return; }
    const [profiles, eggs, drops, pets, themes] = await Promise.all([
      base44.entities.UserProfile.filter({ id: profileId }),
      base44.entities.LootEgg.filter({ isActive: true }),
      base44.entities.LootEggDrop.filter({ profileId }),
      base44.entities.CustomPet.list(),
      base44.entities.CustomTheme.list(),
    ]);
    if (profiles.length === 0) { navigate(createPageUrl('Home')); return; }
    setProfile(profiles[0]);
    setLootEggs(eggs);
    setMyDrops(drops);
    setCustomPets(pets);
    setCustomThemes(themes);
    setLoading(false);
  };

  const handleOpenEgg = async (prize) => {
    if (!openingEgg) return;
    const { drop } = openingEgg;

    // Mark drop as opened
    await base44.entities.LootEggDrop.update(drop.id, { isOpened: true, wonPrize: prize });

    // Apply prize to user profile
    const p = profile;
    if (prize.type === 'xp') {
      const newXp = (p.xp || 0) + parseInt(prize.value || '0');
      await base44.entities.UserProfile.update(p.id, { xp: newXp });
      toast.success(`+${prize.value} XP!`);
    } else if (prize.type === 'coins') {
      const newCoins = (p.questCoins || 0) + parseInt(prize.value || '0');
      await base44.entities.UserProfile.update(p.id, { questCoins: newCoins });
      toast.success(`+${prize.value} Quest Coins!`);
    } else if (prize.type === 'pet') {
      const up = [...(p.unlockedPets || [])];
      if (!up.includes(prize.value)) up.push(prize.value);
      await base44.entities.UserProfile.update(p.id, { unlockedPets: up });
      toast.success(`New pet unlocked!`);
    } else if (prize.type === 'theme') {
      const ut = [...(p.unlockedThemes || [])];
      if (!ut.includes(prize.value)) ut.push(prize.value);
      await base44.entities.UserProfile.update(p.id, { unlockedThemes: ut });
      toast.success(`New theme unlocked!`);
    } else if (prize.type === 'magic_egg') {
      await base44.entities.MagicEgg.create({ userId: p.userId, source: 'global_event' });
      toast.success(`Magic Egg received!`);
    } else if (prize.type === 'title') {
      const titles = [...(p.unlockedTitles || [])];
      if (!titles.includes(prize.value)) titles.push(prize.value);
      await base44.entities.UserProfile.update(p.id, { unlockedTitles: titles });
      toast.success(`New title: ${prize.value}!`);
    } else if (prize.type === 'cosmetic') {
      const uc = [...(p.unlockedCosmetics || [])];
      if (!uc.includes(prize.value)) uc.push(prize.value);
      await base44.entities.UserProfile.update(p.id, { unlockedCosmetics: uc });
      toast.success(`Cosmetic unlocked!`);
    }

    setOpeningEgg(null);
    await loadData(); // refresh
  };

  const unopenedDrops = myDrops.filter(d => !d.isOpened);
  const openedDrops = myDrops.filter(d => d.isOpened);

  // Group unopened drops by egg type
  const eggGroups = {};
  unopenedDrops.forEach(d => {
    if (!eggGroups[d.lootEggId]) eggGroups[d.lootEggId] = [];
    eggGroups[d.lootEggId].push(d);
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen pb-24 px-4 pt-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(createPageUrl('Dashboard'))} className="text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">My Eggs</h1>
            <p className="text-sm text-slate-500">{unopenedDrops.length} egg{unopenedDrops.length !== 1 ? 's' : ''} waiting to open</p>
          </div>
        </motion.div>

        {/* Unopened eggs */}
        {Object.keys(eggGroups).length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {Object.entries(eggGroups).map(([eggId, drops]) => {
              const egg = lootEggs.find(e => e.id === eggId);
              if (!egg) return null;
              return (
                <EggCard
                  key={eggId}
                  egg={egg}
                  count={drops.length}
                  onClick={() => setOpeningEgg({ egg, drop: drops[0] })}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-6xl block mb-4">🥚</span>
            <p className="text-slate-500 text-lg">No eggs to open</p>
            <p className="text-slate-400 text-sm mt-1">Complete quests or check the shop to get eggs!</p>
          </div>
        )}

        {/* History */}
        {openedDrops.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Opened History</h2>
            <div className="space-y-2">
              {openedDrops.slice(0, 20).map(d => {
                const egg = lootEggs.find(e => e.id === d.lootEggId);
                return (
                  <div key={d.id} className="bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{egg?.emoji || '🐣'}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-700">{egg?.name || 'Egg'}</p>
                        <p className="text-xs text-slate-500">Won: {d.wonPrize?.label || 'Unknown'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(d.updated_date || d.created_date).toLocaleDateString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Opening animation */}
      <AnimatePresence>
        {openingEgg && (
          <EggOpenAnimation
            egg={openingEgg.egg}
            prizes={openingEgg.egg.prizes || []}
            onOpen={handleOpenEgg}
            onClose={() => setOpeningEgg(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}