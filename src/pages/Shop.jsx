import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Coins, Sparkles, Clock, Package, Shield, Gem } from 'lucide-react';
import LockedOverlay from '@/components/common/LockedOverlay';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GlassIcon from '@/components/ui/GlassIcon';
import Tutorial from '@/components/tutorial/Tutorial';
import { toast } from 'sonner';
import EggOpenAnimation from '@/components/eggs/EggOpenAnimation';

export default function Shop() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState('shop');
  const [filter, setFilter] = useState('all');
  const [shopItems, setShopItems] = useState([]);
  const [locks, setLocks] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bundles, setBundles] = useState([]);
  const [lootEggs, setLootEggs] = useState([]);
  const [customPets, setCustomPets] = useState([]);
  const [openingEgg, setOpeningEgg] = useState(null);

  useEffect(() => {
    loadData();
    base44.analytics.track({ eventName: 'shop_viewed' });
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

      const me = profiles[0];
      setProfile(me);

      // Admin check (Crosby or first profile)
      const allProfiles = await base44.entities.UserProfile.list('created_date', 1);
      const adminUser = me.username?.toLowerCase?.() === 'crosby' || (allProfiles[0] && allProfiles[0].id === me.id);
      setIsAdmin(!!adminUser);

      // Load locks
      const settings = await base44.entities.AppSetting.list();
      const fl = settings.find(s => s.key === 'feature_locks');
      setLocks(fl ? fl.value : null);

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

      // Load loot eggs for egg shop tab
      const [allLootEggs, allCustomPets] = await Promise.all([
        base44.entities.LootEgg.filter({ isActive: true, inShop: true }),
        base44.entities.CustomPet.list()
      ]);
      setLootEggs(allLootEggs);
      setCustomPets(allCustomPets);
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
      // Build update object
      const updates = {
        questCoins: profile.questCoins - item.price,
        unlockedPets: [...(profile.unlockedPets || [])],
        unlockedThemes: [...(profile.unlockedThemes || [])],
        unlockedTitles: [...(profile.unlockedTitles || [])],
        xp: profile.xp || 0
      };

      // Apply item effects
      if (item.itemType === 'pet') {
        let petId = item.itemData?.petId;
        // Check if this is a custom pet ID (from CustomPet entity)
        if (petId && petId.length === 24 && !petId.startsWith('custom_')) {
          petId = `custom_${petId}`;
        }
        if (petId && !updates.unlockedPets.includes(petId)) {
          updates.unlockedPets.push(petId);
        }
      } else if (item.itemType === 'theme') {
        const themeId = item.itemData?.themeId;
        if (themeId && !updates.unlockedThemes.includes(themeId)) {
          updates.unlockedThemes.push(themeId);
        }
      } else if (item.itemType === 'title') {
        // Use the item name as the title if itemData.title is not set
        const title = item.itemData?.title || item.name;
        if (title && !updates.unlockedTitles.includes(title)) {
          updates.unlockedTitles.push(title);
        }
      } else if (item.itemType === 'xp_booster') {
        updates.xp += (item.itemData?.xpAmount || 0);
      } else if (item.itemType === 'magic_egg') {
        await base44.entities.MagicEgg.create({ userId: profile.userId, source: 'shop' });
      }

      // Save to database
      await base44.entities.UserProfile.update(profile.id, updates);

      // Update stock
      if (item.stockRemaining !== null) {
        const newStock = item.stockRemaining - 1;
        await base44.entities.ShopItem.update(item.id, { stockRemaining: newStock });
        if (newStock <= 0) {
          setShopItems(shopItems.filter(i => i.id !== item.id));
        }
      }

      // Update local state
      setProfile({ ...profile, ...updates });
      
      // Analytics
      base44.analytics.track({
        eventName: 'shop_item_purchased',
        properties: {
          item_name: item.name,
          item_type: item.itemType,
          item_price: item.price,
          coins_remaining: updates.questCoins
        }
      });
      
      toast.success(`✓ ${item.name} purchased!`);
      
      // Reload to sync
      await loadData();
    } catch (e) {
      console.error('Purchase failed:', e);
      toast.error('Purchase failed - please try again');
    }
  };

  const handlePurchaseBundle = async (bundle) => {
    if (profile.questCoins < bundle.bundlePrice) {
      toast.error('Not enough Quest Coins!');
      return;
    }

    try {
      // Fetch all bundle items
      const itemsData = await Promise.all(
        bundle.itemIds.map(id => base44.entities.ShopItem.filter({ id }))
      );

      // Build complete update object
      const updates = {
        questCoins: profile.questCoins - bundle.bundlePrice,
        unlockedPets: [...(profile.unlockedPets || [])],
        unlockedThemes: [...(profile.unlockedThemes || [])],
        unlockedTitles: [...(profile.unlockedTitles || [])],
        xp: profile.xp || 0
      };

      let itemCount = 0;

      // Process each item
      for (const itemArr of itemsData) {
        const item = itemArr[0];
        if (!item) continue;

        itemCount++;

        if (item.itemType === 'pet') {
          let petId = item.itemData?.petId;
          // Check if this is a custom pet ID (from CustomPet entity)
          if (petId && petId.length === 24 && !petId.startsWith('custom_')) {
            petId = `custom_${petId}`;
          }
          if (petId && !updates.unlockedPets.includes(petId)) {
            updates.unlockedPets.push(petId);
          }
        } else if (item.itemType === 'theme') {
          const themeId = item.itemData?.themeId;
          if (themeId && !updates.unlockedThemes.includes(themeId)) {
            updates.unlockedThemes.push(themeId);
          }
        } else if (item.itemType === 'title') {
          // Use the item name as the title if itemData.title is not set
          const title = item.itemData?.title || item.name;
          if (title && !updates.unlockedTitles.includes(title)) {
            updates.unlockedTitles.push(title);
          }
        } else if (item.itemType === 'xp_booster') {
          updates.xp += (item.itemData?.xpAmount || 0);
        } else if (item.itemType === 'magic_egg') {
          await base44.entities.MagicEgg.create({ userId: profile.userId, source: 'shop_bundle' });
        }
      }

      // Save to database
      await base44.entities.UserProfile.update(profile.id, updates);

      // Update stock
      if (bundle.stockRemaining !== null) {
        const newStock = bundle.stockRemaining - 1;
        await base44.entities.Bundle.update(bundle.id, { stockRemaining: newStock });
        if (newStock <= 0) {
          setBundles(bundles.filter(b => b.id !== bundle.id));
        }
      }

      // Update local state
      setProfile({ ...profile, ...updates });
      
      // Analytics
      base44.analytics.track({
        eventName: 'bundle_purchased',
        properties: {
          bundle_name: bundle.name,
          bundle_price: bundle.bundlePrice,
          items_count: itemCount,
          coins_remaining: updates.questCoins
        }
      });
      
      toast.success(`✓ ${bundle.name} purchased! Got ${itemCount} items!`);
      
      // Reload to sync
      await loadData();
    } catch (e) {
      console.error('Bundle purchase failed:', e);
      toast.error('Purchase failed - please try again');
    }
  };

  const handleBuyEgg = async (egg) => {
    const gemCost = egg.shopGemPrice || egg.vendingGemPrice || 2;
    const currentGems = profile?.gems || 0;
    if (currentGems < gemCost) {
      toast.error(`Not enough gems! Need ${gemCost} 💎`);
      return;
    }
    const newGems = currentGems - gemCost;
    await base44.entities.UserProfile.update(profile.id, { gems: newGems });
    const drop = await base44.entities.LootEggDrop.create({
      lootEggId: egg.id,
      profileId: profile.id,
      username: profile.username,
      source: 'shop_purchase',
    });
    setProfile(prev => ({ ...prev, gems: newGems }));
    setOpeningEgg({ egg, drop });
    toast.success('Egg purchased! Opening now...');
  };

  const handleOpenEgg = async (prize) => {
    if (!openingEgg) return;
    const { drop } = openingEgg;
    await base44.entities.LootEggDrop.update(drop.id, { isOpened: true, wonPrize: prize });
    const p = profile;
    if (prize.type === 'xp') {
      await base44.entities.UserProfile.update(p.id, { xp: (p.xp || 0) + parseInt(prize.value || '0') });
      toast.success(`+${prize.value} XP!`);
    } else if (prize.type === 'coins') {
      await base44.entities.UserProfile.update(p.id, { questCoins: (p.questCoins || 0) + parseInt(prize.value || '0') });
      toast.success(`+${prize.value} Quest Coins!`);
    } else if (prize.type === 'pet') {
      const up = [...(p.unlockedPets || [])];
      if (!up.includes(prize.value)) up.push(prize.value);
      await base44.entities.UserProfile.update(p.id, { unlockedPets: up });
      toast.success('New pet unlocked!');
    } else if (prize.type === 'theme') {
      const ut = [...(p.unlockedThemes || [])];
      if (!ut.includes(prize.value)) ut.push(prize.value);
      await base44.entities.UserProfile.update(p.id, { unlockedThemes: ut });
      toast.success('New theme unlocked!');
    } else if (prize.type === 'magic_egg') {
      await base44.entities.MagicEgg.create({ userId: p.userId, source: 'global_event' });
      toast.success('Magic Egg received!');
    } else if (prize.type === 'title') {
      const titles = [...(p.unlockedTitles || [])];
      if (!titles.includes(prize.value)) titles.push(prize.value);
      await base44.entities.UserProfile.update(p.id, { unlockedTitles: titles });
      toast.success(`New title: ${prize.value}!`);
    } else if (prize.type === 'cosmetic') {
      const uc = [...(p.unlockedCosmetics || [])];
      if (!uc.includes(prize.value)) uc.push(prize.value);
      await base44.entities.UserProfile.update(p.id, { unlockedCosmetics: uc });
      toast.success('Cosmetic unlocked!');
    }
    setOpeningEgg(null);
    await loadData();
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

  const userLock = locks?.users?.[profile.id]?.shop;
  const isLocked = !isAdmin && ((typeof userLock === 'object' ? userLock.locked : !!userLock));
  const lockMsg = typeof userLock === 'object' ? (userLock.message || '') : '';
  if (isLocked) {
    return <LockedOverlay featureLabel="Shop" message={lockMsg || "An Admin or Mod has locked this feature. You can't currently use it."} />;
  }

  const filteredItems = filter === 'all' 
    ? shopItems 
    : shopItems.filter(item => item.itemType === filter);

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 lg:px-8 xl:px-12 2xl:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <GlassIcon icon={ShoppingBag} color="purple" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Quest Shop</h1>
                <p className="text-sm text-slate-500">Spend your currencies</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-amber-100 px-3 py-2 rounded-xl">
                <Coins className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-amber-900 text-sm">{profile.questCoins || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-100 px-3 py-2 rounded-xl">
                <Gem className="w-4 h-4 text-purple-600" />
                <span className="font-bold text-purple-900 text-sm">{profile.gems || 0}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main tabs: Shop vs Egg Shop */}
        <Tabs value={mainTab} onValueChange={setMainTab} className="mb-4">
          <TabsList className="bg-white shadow-sm border border-slate-100 p-1 rounded-xl">
            <TabsTrigger value="shop" className="rounded-lg gap-1.5">
              🛒 Shop
            </TabsTrigger>
            <TabsTrigger value="egg_shop" className="rounded-lg gap-1.5">
              🥚 Loot Eggs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="egg_shop" className="mt-4">
            {lootEggs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                <span className="text-6xl block mb-4">🥚</span>
                <p className="text-slate-500 font-semibold">No eggs stocked yet!</p>
              </div>
            ) : (
              /* Vending Machine */
              <div className="relative mx-auto max-w-sm">
                {/* Machine body */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl"
                  style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)' }}>
                  
                  {/* Top branding strip */}
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 flex items-center justify-between">
                    <span className="text-white font-black text-sm tracking-widest uppercase">✨ Loot Eggs</span>
                    <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full">
                      <Gem className="w-3 h-3 text-purple-200" />
                      <span className="text-white text-xs font-bold">{profile.gems || 0} gems</span>
                    </div>
                  </div>

                  {/* Glass panel */}
                  <div className="mx-3 mt-3 mb-2 rounded-2xl overflow-hidden border-2 border-indigo-400/30"
                    style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(4px)' }}>
                    
                    {/* Shelf rows — group eggs into rows of 3 */}
                    {Array.from({ length: Math.ceil(lootEggs.length / 3) }, (_, rowIdx) => {
                      const rowEggs = lootEggs.slice(rowIdx * 3, rowIdx * 3 + 3);
                      return (
                        <div key={rowIdx}>
                          <div className="grid grid-cols-3 gap-1 px-2 pt-3 pb-1">
                            {rowEggs.map((egg, colIdx) => {
                              const gemCost = egg.shopGemPrice || 2;
                              const canAfford = (profile?.gems || 0) >= gemCost;
                              const slotLabel = String.fromCharCode(65 + rowIdx) + (colIdx + 1);
                              return (
                                <motion.button
                                  key={egg.id}
                                  whileHover={canAfford ? { scale: 1.05 } : {}}
                                  whileTap={canAfford ? { scale: 0.95 } : {}}
                                  disabled={!canAfford}
                                  onClick={() => handleBuyEgg(egg)}
                                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${canAfford ? 'hover:bg-white/10 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
                                >
                                  {/* Slot label */}
                                  <span className="text-[9px] font-bold text-indigo-300 tracking-wider">{slotLabel}</span>
                                  {/* Egg image */}
                                  <div className="w-14 h-16 flex items-center justify-center relative"
                                    style={{ filter: canAfford ? `drop-shadow(0 0 8px ${egg.color || '#6366f1'}88)` : 'none' }}>
                                    {egg.imageUrl
                                      ? <img src={egg.imageUrl} alt={egg.name} className="w-full h-full object-contain" />
                                      : <span className="text-3xl">{egg.emoji || '🥚'}</span>}
                                  </div>
                                  {/* Egg name */}
                                  <span className="text-white text-[10px] font-semibold text-center leading-tight line-clamp-2">{egg.name}</span>
                                  {/* Price tag */}
                                  <div className="flex items-center gap-0.5 bg-purple-900/60 border border-purple-500/40 px-1.5 py-0.5 rounded-full">
                                    <Gem className="w-2.5 h-2.5 text-purple-300" />
                                    <span className="text-purple-200 text-[10px] font-black">{gemCost}</span>
                                  </div>
                                </motion.button>
                              );
                            })}
                            {/* Fill empty slots in last row */}
                            {rowEggs.length < 3 && Array.from({ length: 3 - rowEggs.length }, (_, i) => (
                              <div key={`empty-${i}`} className="flex flex-col items-center gap-1 p-2 opacity-20">
                                <span className="text-[9px] text-indigo-400">—</span>
                                <div className="w-14 h-16 rounded-lg border border-dashed border-indigo-700/40" />
                              </div>
                            ))}
                          </div>
                          {/* Shelf ledge */}
                          <div className="mx-2 h-1.5 rounded-full mb-1"
                            style={{ background: 'linear-gradient(90deg, #4338ca, #6d28d9, #4338ca)' }} />
                        </div>
                      );
                    })}
                    <div className="h-2" />
                  </div>

                  {/* Bottom panel — coin slot / gem indicator */}
                  <div className="mx-3 mb-3 bg-indigo-950/60 rounded-2xl px-4 py-3 flex items-center justify-between border border-indigo-500/20">
                    <div className="text-xs text-indigo-300">
                      <p className="font-bold text-white text-sm">💎 Gem Store</p>
                      <p className="text-indigo-400 text-[10px]">Click an egg to purchase</p>
                    </div>
                    <div className="w-8 h-6 bg-indigo-900 rounded border-2 border-indigo-600 flex items-center justify-center">
                      <div className="w-4 h-1 bg-indigo-400 rounded-full" />
                    </div>
                  </div>

                  {/* Side accent lines */}
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-purple-800 via-indigo-900 to-purple-800 rounded-l-3xl" />
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-b from-purple-800 via-indigo-900 to-purple-800 rounded-r-3xl" />
                </div>

                {/* Machine legs */}
                <div className="flex justify-center gap-24 mt-1">
                  <div className="w-4 h-3 bg-indigo-900 rounded-b-lg" />
                  <div className="w-4 h-3 bg-indigo-900 rounded-b-lg" />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="shop" className="mt-4">

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
                      {bundle.stockRemaining !== null ? (
                        <p className="text-purple-100 text-xs mt-2">
                          Only {bundle.stockRemaining} remaining!
                        </p>
                      ) : (
                        <p className="text-purple-100 text-xs mt-2">
                          Unlimited stock
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
                  
                  {item.stockRemaining !== null ? (
                    <p className="text-xs text-amber-600 mb-2">
                      Only {item.stockRemaining} left!
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-600 mb-2">
                      Unlimited stock
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
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Tutorial */}
      <Tutorial profile={profile} currentPage="Shop" onComplete={() => {}} />

      <AnimatePresence>
        {openingEgg && (
          <EggOpenAnimation
            egg={openingEgg.egg}
            prizes={openingEgg.egg.prizes || []}
            onOpen={handleOpenEgg}
            onClose={() => setOpeningEgg(null)}
            customPets={customPets}
            autoOpen={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
}