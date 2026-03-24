import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Cog, Sparkles, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import BazaarItemCard from '@/components/bazaar/BazaarItemCard';

export default function InnovationBazaar() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) { navigate(createPageUrl('Home')); return; }

    const [profiles, bazaarItems, events] = await Promise.all([
      base44.entities.UserProfile.filter({ id: profileId }),
      base44.entities.BazaarItem.filter({ isActive: true }),
      base44.entities.GlobalEvent.filter({ isActive: true }),
    ]);

    if (profiles.length === 0) { navigate(createPageUrl('Home')); return; }
    setProfile(profiles[0]);
    setItems(bazaarItems);
    setActiveEvent(events.find(e => e.theme === 'inventors_fair') || null);
    setLoading(false);
  };

  const handlePurchase = async (item) => {
    if ((profile.cogwheels || 0) < item.cogwheelPrice) {
      toast.error('Not enough Cogwheels!');
      return;
    }

    const updates = {
      cogwheels: (profile.cogwheels || 0) - item.cogwheelPrice,
      unlockedPets: [...(profile.unlockedPets || [])],
      unlockedThemes: [...(profile.unlockedThemes || [])],
      unlockedTitles: [...(profile.unlockedTitles || [])],
      unlockedCosmetics: [...(profile.unlockedCosmetics || [])],
    };

    if (item.itemType === 'pet') {
      let petId = item.itemData?.petId;
      if (petId && petId.length === 24 && !petId.startsWith('custom_')) petId = `custom_${petId}`;
      if (petId && !updates.unlockedPets.includes(petId)) updates.unlockedPets.push(petId);
    } else if (item.itemType === 'theme') {
      const themeId = item.itemData?.themeId;
      if (themeId && !updates.unlockedThemes.includes(themeId)) updates.unlockedThemes.push(themeId);
    } else if (item.itemType === 'title') {
      const title = item.itemData?.title || item.name;
      if (title && !updates.unlockedTitles.includes(title)) updates.unlockedTitles.push(title);
    } else if (item.itemType === 'cosmetic') {
      const cosmeticId = item.itemData?.cosmeticId;
      if (cosmeticId && !updates.unlockedCosmetics.includes(cosmeticId)) updates.unlockedCosmetics.push(cosmeticId);
    } else if (item.itemType === 'magic_egg') {
      await base44.entities.MagicEgg.create({ userId: profile.userId, source: 'shop' });
    }

    await base44.entities.UserProfile.update(profile.id, updates);

    if (item.stockRemaining !== null && item.stockRemaining !== undefined) {
      const newStock = item.stockRemaining - 1;
      await base44.entities.BazaarItem.update(item.id, { stockRemaining: newStock });
    }

    setProfile({ ...profile, ...updates });
    toast.success(`⚙️ ${item.name} acquired!`);
    await loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <Cog className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700 mb-2">Innovation Bazaar is Closed</h2>
        <p className="text-slate-500 text-sm">The Inventors' Fair event is not currently active. Check back when it opens!</p>
      </div>
    );
  }

  const RARITY_COLORS = {
    common: 'border-slate-300 bg-slate-50',
    uncommon: 'border-green-300 bg-green-50',
    rare: 'border-blue-300 bg-blue-50',
    epic: 'border-purple-300 bg-purple-50',
    legendary: 'border-amber-400 bg-amber-50',
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="w-full px-4 lg:px-8 xl:px-12 2xl:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Cog className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Innovation Bazaar</h1>
                <p className="text-sm text-slate-500">Spend Cogwheels on exclusive steampunk gear</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-xl">
              <Cog className="w-5 h-5 text-amber-700" />
              <span className="font-bold text-amber-900">{profile.cogwheels || 0}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Earn 1 Cogwheel for every 5 XP contributed to the Inventors' Fair event.
          </p>
        </motion.div>

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-100"
              >
                <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No bazaar items available yet</p>
              </motion.div>
            ) : (
              items.map((item, index) => (
                <BazaarItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  canAfford={(profile.cogwheels || 0) >= item.cogwheelPrice}
                  onPurchase={handlePurchase}
                  rarityColors={RARITY_COLORS}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}