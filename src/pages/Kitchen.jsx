import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ChefHat, ArrowLeft, UtensilsCrossed, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import VendingMachine from '@/components/kitchen/VendingMachine';
import FoodFeedingModal from '@/components/student/FoodFeedingModal';
import GlassIcon from '@/components/ui/GlassIcon';
import { toast } from 'sonner';

export default function Kitchen() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('vending');
  const [foodItems, setFoodItems] = useState([]);
  const [foodInventory, setFoodInventory] = useState([]);
  const [showFeeding, setShowFeeding] = useState(false);

  useEffect(() => {
    loadData();
    base44.analytics.track({ eventName: 'kitchen_page_viewed' });
  }, []);

  const loadData = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) { navigate(createPageUrl('Home')); return; }

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) { navigate(createPageUrl('Home')); return; }
      const me = profiles[0];
      setProfile(me);

      const [items, inventory] = await Promise.all([
        base44.entities.FoodItem.filter({ isActive: true }),
        base44.entities.FoodInventory.filter({ userProfileId: profileId })
      ]);
      setFoodItems(items);
      setFoodInventory(inventory.filter(f => f.quantity > 0));
    } catch (e) {
      console.error('Error loading kitchen:', e);
    }
    setLoading(false);
  };

  const handlePurchaseFood = async (item) => {
    if ((profile?.questCoins || 0) < item.price) {
      toast.error('Not enough Quest Coins!');
      return false;
    }

    try {
      const newCoins = profile.questCoins - item.price;
      await base44.entities.UserProfile.update(profile.id, { questCoins: newCoins });

      // Check if user already has this food in inventory
      const existing = foodInventory.find(f => f.foodItemId === item.id);
      if (existing) {
        await base44.entities.FoodInventory.update(existing.id, { quantity: existing.quantity + 1 });
        setFoodInventory(prev => prev.map(f => f.id === existing.id ? { ...f, quantity: f.quantity + 1 } : f));
      } else {
        const newInv = await base44.entities.FoodInventory.create({
          userProfileId: profile.id,
          foodItemId: item.id,
          foodName: item.name,
          foodImageUrl: item.imageUrl || '',
          foodFlavor: item.flavor,
          foodDescription: item.description || '',
          foodRarity: item.rarity,
          quantity: 1
        });
        setFoodInventory(prev => [...prev, newInv]);
      }

      setProfile(prev => ({ ...prev, questCoins: newCoins }));
      
      base44.analytics.track({
        eventName: 'food_purchased',
        properties: { food_name: item.name, food_rarity: item.rarity, price: item.price }
      });

      toast.success(`Bought ${item.name}!`);
      return true;
    } catch (e) {
      toast.error('Purchase failed');
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  const RARITY_COLORS = {
    common: 'text-slate-500', uncommon: 'text-green-600', rare: 'text-blue-600',
    epic: 'text-purple-600', legendary: 'text-yellow-600'
  };

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 lg:px-8 xl:px-12 2xl:px-16 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-5"
        >
          <div className="flex items-center gap-3">
            <GlassIcon icon={ChefHat} color="orange" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Kitchen</h1>
              <p className="text-sm text-slate-500">Buy food & feed your pets</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-xl">
            <Coins className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-amber-900">{profile.questCoins || 0}</span>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="mb-5">
          <TabsList className="bg-white shadow-sm border border-slate-100 p-1 rounded-xl">
            <TabsTrigger value="vending" className="rounded-lg gap-1.5">
              🍽️ Vending Machine
            </TabsTrigger>
            <TabsTrigger value="inventory" className="rounded-lg gap-1.5">
              🎒 My Food ({foodInventory.reduce((s, f) => s + f.quantity, 0)})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vending" className="mt-4">
            <div className="max-w-md mx-auto">
              <VendingMachine
                foodItems={foodItems}
                profile={profile}
                onPurchase={handlePurchaseFood}
              />
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="mt-4">
            {foodInventory.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <span className="text-5xl block mb-3">🍽️</span>
                <p className="text-slate-500 font-semibold">No food yet!</p>
                <p className="text-slate-400 text-sm mt-1">Buy food from the vending machine.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {foodInventory.map(food => (
                    <motion.div
                      key={food.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl p-3 shadow-md border border-slate-100 text-center"
                    >
                      {food.foodImageUrl ? (
                        <img src={food.foodImageUrl} alt={food.foodName} className="w-16 h-16 rounded-lg object-cover mx-auto mb-2" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-orange-50 flex items-center justify-center text-3xl mx-auto mb-2">🍽️</div>
                      )}
                      <p className="font-bold text-sm text-slate-800 truncate">{food.foodName}</p>
                      <p className={`text-xs font-semibold capitalize ${RARITY_COLORS[food.foodRarity] || 'text-slate-400'}`}>
                        {food.foodRarity}
                      </p>
                      <p className="text-slate-400 text-xs">×{food.quantity}</p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <Button
                    onClick={() => setShowFeeding(true)}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-8 h-12 rounded-xl shadow-lg"
                  >
                    <UtensilsCrossed className="w-5 h-5 mr-2" />
                    Feed a Pet! 🌟
                  </Button>
                  <p className="text-slate-400 text-xs mt-2">Feed food to a pet to create a new Legendary pet!</p>
                </motion.div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {showFeeding && (
        <FoodFeedingModal
          profileId={profile.id}
          onClose={() => {
            setShowFeeding(false);
            loadData(); // Refresh after feeding
          }}
        />
      )}
    </div>
  );
}