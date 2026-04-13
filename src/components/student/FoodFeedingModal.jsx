import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { X, Loader2, ChefHat, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PETS } from '@/components/quest/PetCatalog';
import { toast } from 'sonner';

const RARITY_COLORS = {
  common: 'text-slate-400', uncommon: 'text-green-400', rare: 'text-blue-400',
  epic: 'text-purple-400', legendary: 'text-yellow-400'
};

export default function FoodFeedingModal({ profileId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [foodInventory, setFoodInventory] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [feeding, setFeeding] = useState(false);
  const [feedStep, setFeedStep] = useState('');
  const [newPet, setNewPet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [profileId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (!profiles[0]) return;
      const p = profiles[0];
      setProfile(p);

      const food = await base44.entities.FoodInventory.filter({ userProfileId: profileId });
      setFoodInventory(food.filter(f => f.quantity > 0));

      const unlockedIds = p.unlockedPets || [];
      const petList = [];
      const allCustomPets = await base44.entities.CustomPet.list();
      const customPetMap = {};
      allCustomPets.forEach(pet => { customPetMap[pet.id] = pet; });

      for (const id of unlockedIds) {
        if (id.startsWith('custom_')) {
          const dbId = id.replace('custom_', '');
          if (customPetMap[dbId]) petList.push({ ...customPetMap[dbId], displayId: id });
        } else {
          const builtIn = PETS.find(p2 => p2.id === id);
          if (builtIn) petList.push({ ...builtIn, displayId: id });
        }
      }
      setPets(petList);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleFeed = async () => {
    if (!selectedFood || !selectedPet || !profile) return;
    setFeeding(true);
    try {
      setFeedStep('🧠 AI is creating your new pet...');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `A student is feeding a special food item to their digital pet in a gamified school app! Create a fun new transformed pet.

Original Pet: ${selectedPet.name} (${selectedPet.description || 'a cool digital pet'})
Food Consumed: ${selectedFood.foodName} — Flavor: ${selectedFood.foodFlavor}
Food Description: ${selectedFood.foodDescription || ''}

Create a LEGENDARY food-themed pet that is inspired by BOTH the food AND the original pet — like the pet absorbed the food's essence and transformed!

Return JSON with:
- name: a creative name (combines the pet's spirit with the food theme)
- description: 2-3 fun, exciting sentences describing the transformed pet (kid-friendly!)`,
        response_json_schema: {
          type: 'object',
          properties: { name: { type: 'string' }, description: { type: 'string' } }
        }
      });

      setFeedStep('🎨 Drawing your new pet...');
      const imgResult = await base44.integrations.Core.GenerateImage({
        prompt: `Cute cartoon ${selectedPet.name} transformed after eating ${selectedFood.foodName}. Named "${result.name}". ${selectedFood.foodFlavor} colors and flavor effects on the creature. Vibrant, magical, kid-friendly digital art style, white background, legendary quality`
      });

      setFeedStep('✨ Adding to your collection...');
      const newPetRecord = await base44.entities.CustomPet.create({
        name: result.name,
        description: result.description,
        rarity: 'legendary',
        xpRequired: 0,
        isGiftOnly: true,
        imageUrl: imgResult.url,
        imageSource: 'ai_generated',
        createdSourceTab: 'unknown',
        lore: `Born when ${selectedPet.name} devoured a magical ${selectedFood.foodName} and transformed forever!`
      });

      const newId = `custom_${newPetRecord.id}`;
      const currentPets = [...(profile.unlockedPets || [])];
      if (!currentPets.includes(newId)) {
        currentPets.push(newId);
        await base44.entities.UserProfile.update(profile.id, { unlockedPets: currentPets });
      }

      // Consume the food
      if (selectedFood.quantity <= 1) {
        await base44.entities.FoodInventory.delete(selectedFood.id);
      } else {
        await base44.entities.FoodInventory.update(selectedFood.id, { quantity: selectedFood.quantity - 1 });
      }

      setNewPet(newPetRecord);
      toast.success(`🍽️ ${result.name} appeared!`);
    } catch (e) {
      toast.error('Feeding failed: ' + e.message);
    }
    setFeeding(false);
    setFeedStep('');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-orange-950 via-amber-950 to-yellow-950 rounded-3xl border border-amber-500/30 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        <div className="sticky top-0 flex items-center justify-between p-4 bg-black/20 backdrop-blur rounded-t-3xl">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-400" />
            <h2 className="text-white font-bold">Pet Food 🍽️</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-2" />
              <p className="text-white/50 text-sm">Loading your inventory...</p>
            </div>
          ) : newPet ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center py-6">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-bold text-white mb-1">{newPet.name}</h3>
              <p className="text-amber-200/70 text-sm mb-3 px-4">{newPet.description}</p>
              {newPet.imageUrl && (
                <img src={newPet.imageUrl} alt={newPet.name} className="w-36 h-36 rounded-2xl object-cover mx-auto mb-3 border-2 border-yellow-400 shadow-xl" />
              )}
              <div className="bg-yellow-500/20 rounded-full px-4 py-1 inline-block text-yellow-300 text-sm font-semibold mb-4">
                ⭐ LEGENDARY — Added to your collection!
              </div>
              <br />
              <Button onClick={onClose} className="bg-orange-500 hover:bg-orange-400 text-white px-8">
                Awesome! 🎊
              </Button>
            </motion.div>
          ) : foodInventory.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="text-white/70 font-semibold">No food items yet!</p>
              <p className="text-white/40 text-sm mt-1">Buy food from the Shop or earn them through 1Pass rewards.</p>
            </div>
          ) : (
            <>
              {/* Food selection */}
              <div className="mb-4">
                <h3 className="text-amber-200 font-semibold text-sm mb-2">
                  🍱 Your Food ({foodInventory.length} items)
                </h3>
                <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                  {foodInventory.map(food => (
                    <div key={food.id} onClick={() => setSelectedFood(food)}
                      className={`rounded-xl p-2 border-2 cursor-pointer transition-all text-center ${selectedFood?.id === food.id ? 'border-orange-400 bg-orange-500/20' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                      {food.foodImageUrl
                        ? <img src={food.foodImageUrl} className="w-11 h-11 rounded-lg mx-auto object-cover mb-1" alt={food.foodName} />
                        : <div className="text-2xl mb-1">🍽️</div>}
                      <p className="text-white text-xs truncate leading-tight">{food.foodName}</p>
                      <p className={`text-xs capitalize ${RARITY_COLORS[food.foodRarity] || 'text-slate-400'}`}>×{food.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pet selection */}
              <div className="mb-4">
                <h3 className="text-amber-200 font-semibold text-sm mb-2">
                  🐾 Choose a Pet to Feed
                </h3>
                {pets.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-3">No pets unlocked yet!</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
                    {pets.map(pet => (
                      <div key={pet.displayId} onClick={() => setSelectedPet(pet)}
                        className={`rounded-xl p-2 border-2 cursor-pointer transition-all text-center ${selectedPet?.displayId === pet.displayId ? 'border-amber-400 bg-amber-500/20' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                        {pet.imageUrl
                          ? <img src={pet.imageUrl} className="w-11 h-11 rounded-lg mx-auto object-cover mb-1" alt={pet.name} />
                          : <div className="text-2xl mb-1">{pet.emoji || '🐾'}</div>}
                        <p className="text-white text-xs truncate leading-tight">{pet.name}</p>
                        <p className="text-white/40 text-xs capitalize">{pet.rarity || 'common'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview & feed */}
              {selectedFood && selectedPet && !feeding && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/10 mb-4 text-center">
                  <p className="text-white/70 text-sm">
                    Feed <span className="text-orange-300 font-semibold">{selectedFood.foodName}</span> to <span className="text-amber-300 font-semibold">{selectedPet.name}</span>
                  </p>
                  <p className="text-white/40 text-xs mt-1">A new Legendary pet will be born! 🌟 (The food will be consumed)</p>
                </div>
              )}

              {feeding && (
                <div className="bg-white/5 rounded-xl p-4 border border-amber-500/20 mb-4 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-orange-400 mx-auto mb-2" />
                  <p className="text-white font-semibold text-sm">{feedStep || 'Creating your new pet...'}</p>
                  <p className="text-white/40 text-xs">This takes a moment ✨</p>
                </div>
              )}

              <Button
                onClick={handleFeed}
                disabled={!selectedFood || !selectedPet || feeding}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold h-11">
                {feeding
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating new pet...</>
                  : <><Heart className="w-4 h-4 mr-2" />Feed Pet & Create New One! 🌟</>}
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}