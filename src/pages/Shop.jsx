import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Coins, Sparkles, Clock, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GlassIcon from '@/components/ui/GlassIcon';
import { toast } from 'sonner';

export default function Shop() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [shopItems, setShopItems] = useState([]);
  const [bundles, setBundles] = useState([]);

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

      // Load shop items and bundles
      const items = await base44.entities.ShopItem.filter({ isActive: true });
      const bundleList = await base44.entities.Bundle.filter({ isActive: true });
      
      // Get all item IDs that are in bundles
      const bundledItemIds = new Set();
      bundleList.forEach(bundle => {
        bundle.itemIds?.forEach(id => bundledItemIds.add(id));
      });

      // Filter active items (within date range and not in bundles)
      const now = new Date();
      const activeItems = items.filter(item => {
        // Exclude items that are in bundles
        if (bundledItemIds.has(item.id)) return false;
        
        if (!item.isLimited) return true;
        const start = item.startDate ? new Date(item.startDate) : null;
        const end = item.endDate ? new Date(item.endDate) : null;
        if (start && now < start) return false;
        if (end && now > end) return false;
        if (item.stockRemaining !== null && item.stockRemaining <= 0) return false;
        return true;
      });

      const activeBundles = bundleList.filter(bundle => {
        if (!bundle.isLimited) return true;
        const start = bundle.startDate ? new Date(bundle.startDate) : null;
        const end = bundle.endDate ? new Date(bundle.endDate) : null;
        if (start && now < start) return false;
        if (end && now > end) return false;
        if (bundle.stockRemaining !== null && bundle.stockRemaining <= 0) return false;
        return true;
      });

      setShopItems(activeItems);
      setBundles(activeBundles);
    } catch (e) {
      console.error('Error loading shop:', e);
    }
    setLoading(false);
  };

  const handlePurchaseItem = async (item) => {
    if (profile.questCoins < item.price) {
      toast.error('Not enough Quest Coins!');
      return;
    }

    try {
      const newCoins = profile.questCoins - item.price;
      const updates = { questCoins: newCoins };

      // Apply item effect based on type
      if (item.itemType === 'pet') {
        const petId = item.itemData?.petId;
        if (petId && !profile.unlockedPets?.includes(petId)) {
          updates.unlockedPets = [...(profile.unlockedPets || []), petId];
        }
      } else if (item.itemType === 'theme') {
        const themeId = item.itemData?.themeId;
        if (themeId && !profile.unlockedThemes?.includes(themeId)) {
          updates.unlockedThemes = [...(profile.unlockedThemes || []), themeId];
        }
      } else if (item.itemType === 'title') {
        const title = item.itemData?.title;
        if (title && !profile.unlockedTitles?.includes(title)) {
          updates.unlockedTitles = [...(profile.unlockedTitles || []), title];
        }
      } else if (item.itemType === 'xp_booster') {
        const xpAmount = item.itemData?.xpAmount || 0;
        updates.xp = (profile.xp || 0) + xpAmount;
      } else if (item.itemType === 'magic_egg') {
        await base44.entities.MagicEgg.create({ userId: profile.userId });
      }

      await base44.entities.UserProfile.update(profile.id, updates);

      // Update stock if limited
      if (item.stockRemaining !== null) {
        await base44.entities.ShopItem.update(item.id, {
          stockRemaining: item.stockRemaining - 1
        });
      }

      setProfile({ ...profile, ...updates });
      toast.success(`Purchased ${item.name}!`);
      loadData();
    } catch (e) {
      console.error('Error purchasing item:', e);
      toast.error('Purchase failed');
    }
  };

  const handlePurchaseBundle = async (bundle) => {
    if (profile.questCoins < bundle.bundlePrice) {
      toast.error('Not enough Quest Coins!');
      return;
    }

    try {
      // Load all items in the bundle
      const items = await Promise.all(
        bundle.itemIds.map(id => base44.entities.ShopItem.filter({ id }))
      );

      let newCoins = profile.questCoins - bundle.bundlePrice;
      let newUnlockedPets = [...(profile.unlockedPets || [])];
      let newUnlockedThemes = [...(profile.unlockedThemes || [])];
      let newUnlockedTitles = [...(profile.unlockedTitles || [])];
      let newXP = profile.xp || 0;

      // Apply all item effects
      for (const itemArr of items) {
        const item = itemArr[0];
        if (!item) continue;

        if (item.itemType === 'pet') {
          const petId = item.itemData?.petId;
          if (petId && !newUnlockedPets.includes(petId)) {
            newUnlockedPets.push(petId);
          }
        } else if (item.itemType === 'theme') {
          const themeId = item.itemData?.themeId;
          if (themeId && !newUnlockedThemes.includes(themeId)) {
            newUnlockedThemes.push(themeId);
          }
        } else if (item.itemType === 'title') {
          const title = item.itemData?.title;
          if (title && !newUnlockedTitles.includes(title)) {
            newUnlockedTitles.push(title);
          }
        } else if (item.itemType === 'xp_booster') {
          const xpAmount = item.itemData?.xpAmount || 0;
          newXP += xpAmount;
        } else if (item.itemType === 'magic_egg') {
          await base44.entities.MagicEgg.create({ userId: profile.userId });
        }
      }
      
      const updates = {
        questCoins: newCoins,
        unlockedPets: newUnlockedPets,
        unlockedThemes: newUnlockedThemes,
        unlockedTitles: newUnlockedTitles,
        xp: newXP
      };

      await base44.entities.UserProfile.update(profile.id, updates);

      // Update stock if limited
      if (bundle.stockRemaining !== null) {
        await base44.entities.Bundle.update(bundle.id, {
          stockRemaining: bundle.stockRemaining - 1
        });
      }

      setProfile({ ...profile, ...updates });
      toast.success(`Purchased ${bundle.name}!`);
      loadData();
    } catch (e) {
      console.error('Error purchasing bundle:', e);
      toast.error('Purchase failed');
    }
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  const filteredItems = filter === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.itemType === filter);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-4 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <GlassIcon icon={ShoppingBag} color="purple" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Quest Shop</h1>
                <p className="text-sm text-slate-500">Spend your coins on cool items</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-xl">
              <Coins className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-amber-900">{profile.questCoins || 0}</span>
            </div>
          </div>
        </motion.div>

        {/* Bundles Section */}
        {bundles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Limited-Time Bundles
            </h2>
            <div className="space-y-4">
              {bundles.map((bundle) => (
                <motion.div
                  key={bundle.id}
                  className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold mb-1">{bundle.name}</h3>
                      <p className="text-purple-100 text-sm">{bundle.description}</p>
                    </div>
                    {bundle.isLimited && bundle.endDate && (
                      <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(bundle.endDate)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">{bundle.bundlePrice}</span>
                        <Coins className="w-5 h-5" />
                      </div>
                      {bundle.originalPrice && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-purple-200 line-through text-sm">{bundle.originalPrice}</span>
                          <span className="bg-yellow-400 text-purple-900 px-2 py-0.5 rounded-full text-xs font-bold">
                            {bundle.discountPercent}% OFF
                          </span>
                        </div>
                      )}
                      {bundle.stockRemaining !== null && (
                        <p className="text-purple-100 text-xs mt-2">
                          Only {bundle.stockRemaining} remaining!
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => handlePurchaseBundle(bundle)}
                      disabled={profile.questCoins < bundle.bundlePrice}
                      className="bg-white text-purple-600 hover:bg-purple-50"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Buy Bundle
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-white shadow-sm border border-slate-100 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
              <TabsTrigger value="pet" className="rounded-lg">Pets</TabsTrigger>
              <TabsTrigger value="theme" className="rounded-lg">Themes</TabsTrigger>
              <TabsTrigger value="magic_egg" className="rounded-lg">Eggs</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Shop Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-100"
              >
                <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No items available</p>
              </motion.div>
            ) : (
              filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl p-4 shadow-lg border border-slate-100 hover:shadow-xl transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">{item.name}</h3>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                    {item.isLimited && item.endDate && (
                      <div className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                        <Clock className="w-3 h-3" />
                        {getTimeRemaining(item.endDate)}
                      </div>
                    )}
                  </div>
                  
                  {item.stockRemaining !== null && (
                    <p className="text-xs text-amber-600 mb-2">
                      Only {item.stockRemaining} left!
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-slate-800">{item.price}</span>
                      <Coins className="w-5 h-5 text-amber-600" />
                    </div>
                    <Button
                      onClick={() => handlePurchaseItem(item)}
                      disabled={profile.questCoins < item.price}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Buy
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}