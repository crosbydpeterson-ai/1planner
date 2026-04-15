import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ChefHat, Heart, Sparkles, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PETS } from '@/components/quest/PetCatalog';
import { toast } from 'sonner';

const RARITY_COLORS = {
  common: 'text-slate-400', uncommon: 'text-green-400', rare: 'text-blue-400',
  epic: 'text-purple-400', legendary: 'text-yellow-400'
};

const RARITY_BORDER = {
  common: 'border-slate-400/40', uncommon: 'border-green-400/40', rare: 'border-blue-400/40',
  epic: 'border-purple-400/40', legendary: 'border-yellow-400/60'
};

export default function FoodFeedingModal({ profileId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [foodInventory, setFoodInventory] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [feeding, setFeeding] = useState(false);
  const [feedStep, setFeedStep] = useState('');
  const [result, setResult] = useState(null); // { pet, theme }
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
      const allCustomPets = await base44.entities.CustomPet.list('-created_date', 1000);
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
      // Step 1: Generate pet + theme concept
      setFeedStep('🧠 Creating your new pet & theme...');
      const conceptResult = await base44.integrations.Core.InvokeLLM({
        prompt: `A student is feeding a special food item to their digital pet in a gamified school app! 

Original Pet: ${selectedPet.name} (${selectedPet.description || 'a cool digital pet'})
Food Consumed: ${selectedFood.foodName} — Flavor: ${selectedFood.foodFlavor}
Food Description: ${selectedFood.foodDescription || ''}

Create a LEGENDARY food-themed pet AND a matching color theme inspired by BOTH the food AND the original pet.

Return JSON with:
- name: creative pet name (combines the pet's spirit with the food theme)
- description: 2-3 fun, exciting sentences describing the transformed pet (kid-friendly!)
- theme: {
    primary: hex color (main color from food's vibe),
    secondary: hex color (complementary),
    accent: hex color (bright pop),
    bg: hex color (soft background)
  }
- themeName: a cool name for the color theme (e.g. "Spicy Phoenix Glow")`,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            themeName: { type: 'string' },
            theme: {
              type: 'object',
              properties: {
                primary: { type: 'string' },
                secondary: { type: 'string' },
                accent: { type: 'string' },
                bg: { type: 'string' }
              }
            }
          }
        }
      });

      // Step 2: Generate pet image
      setFeedStep('🎨 Drawing your new pet...');
      const imgResult = await base44.integrations.Core.GenerateImage({
        prompt: `Cute cartoon ${selectedPet.name} transformed after eating ${selectedFood.foodName}. Named "${conceptResult.name}". ${selectedFood.foodFlavor} colors and flavor effects on the creature. Vibrant, magical, kid-friendly digital art style, white background, legendary quality`
      });

      // Step 3: Save pet
      setFeedStep('✨ Adding pet to your collection...');
      const newPetRecord = await base44.entities.CustomPet.create({
        name: conceptResult.name,
        description: conceptResult.description,
        rarity: 'legendary',
        xpRequired: 0,
        isGiftOnly: true,
        imageUrl: imgResult.url,
        imageSource: 'ai_generated',
        createdSourceTab: 'unknown',
        theme: conceptResult.theme,
        lore: `Born when ${selectedPet.name} devoured a magical ${selectedFood.foodName} and transformed forever!`
      });

      // Step 4: Save theme
      setFeedStep('🌈 Crafting your new theme...');
      const newThemeRecord = await base44.entities.CustomTheme.create({
        name: conceptResult.themeName || `${conceptResult.name} Theme`,
        rarity: 'legendary',
        xpRequired: 0,
        description: `A legendary theme born from the fusion of ${selectedPet.name} and ${selectedFood.foodName}.`,
        primaryColor: conceptResult.theme?.primary || '#f59e0b',
        secondaryColor: conceptResult.theme?.secondary || '#fbbf24',
        accentColor: conceptResult.theme?.accent || '#f97316',
        bgColor: conceptResult.theme?.bg || '#1a1a2e',
      });

      // Step 5: Update profile — unlock pet + theme
      const newPetId = `custom_${newPetRecord.id}`;
      const newThemeId = `custom_${newThemeRecord.id}`;
      const currentPets = [...(profile.unlockedPets || [])];
      const currentThemes = [...(profile.unlockedThemes || [])];
      if (!currentPets.includes(newPetId)) currentPets.push(newPetId);
      if (!currentThemes.includes(newThemeId)) currentThemes.push(newThemeId);

      await base44.entities.UserProfile.update(profile.id, {
        unlockedPets: currentPets,
        unlockedThemes: currentThemes,
        equippedPetId: newPetId
      });

      // Step 6: Consume food
      if (selectedFood.quantity <= 1) {
        await base44.entities.FoodInventory.delete(selectedFood.id);
      } else {
        await base44.entities.FoodInventory.update(selectedFood.id, { quantity: selectedFood.quantity - 1 });
      }

      setResult({ pet: newPetRecord, theme: newThemeRecord, petId: newPetId, themeId: newThemeId, themeColors: conceptResult.theme });
      toast.success(`🍽️ ${conceptResult.name} appeared!`);
    } catch (e) {
      toast.error('Feeding failed: ' + e.message);
    }
    setFeeding(false);
    setFeedStep('');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-br from-orange-950 via-amber-950 to-yellow-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur border-b border-amber-500/20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <ChefHat className="w-6 h-6 text-orange-400" />
          <h2 className="text-white font-bold text-xl">Pet Fusion Kitchen 🍽️</h2>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/10">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full min-h-64">
              <Loader2 className="w-10 h-10 animate-spin text-orange-400 mb-3" />
              <p className="text-white/50">Loading your inventory...</p>
            </motion.div>

          ) : result ? (
            <motion.div key="result" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center min-h-full py-8 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-3xl font-bold text-white mb-2">{result.pet.name}</h3>
              <p className="text-amber-200/70 mb-6 max-w-md">{result.pet.description}</p>

              {result.pet.imageUrl && (
                <img src={result.pet.imageUrl} alt={result.pet.name} className="w-48 h-48 rounded-3xl object-cover mx-auto mb-6 border-4 border-yellow-400 shadow-2xl shadow-yellow-500/30" />
              )}

              <div className="flex items-center gap-3 mb-6">
                <div className="bg-yellow-500/20 rounded-full px-5 py-2 text-yellow-300 font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> LEGENDARY PET — Added!
                </div>
              </div>

              {/* Theme preview */}
              <div className="bg-white/10 rounded-2xl p-5 border border-white/20 mb-6 w-full max-w-sm">
                <div className="flex items-center gap-2 mb-3 justify-center">
                  <Palette className="w-5 h-5 text-purple-300" />
                  <span className="text-white font-semibold">New Theme Unlocked!</span>
                </div>
                <p className="text-amber-200/70 text-sm mb-3">{result.theme.name}</p>
                <div className="flex justify-center gap-3">
                  {result.themeColors && Object.values(result.themeColors).map((c, i) => (
                    <div key={i} className="w-10 h-10 rounded-full ring-2 ring-white/30 shadow-lg" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <p className="text-white/40 text-xs mt-3">Equip it from your Collection → Themes!</p>
              </div>

              <Button onClick={onClose} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-10 h-12 text-base font-bold rounded-2xl">
                Awesome! 🎊
              </Button>
            </motion.div>

          ) : foodInventory.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full min-h-64 text-center">
              <div className="text-6xl mb-4">🍽️</div>
              <p className="text-white/70 font-semibold text-xl">No food items yet!</p>
              <p className="text-white/40 text-sm mt-2">Buy food from the Shop or earn them through 1Pass rewards.</p>
            </motion.div>

          ) : (
            <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Food selection */}
                <div>
                  <h3 className="text-amber-200 font-bold mb-3 flex items-center gap-2">
                    🍱 Your Food
                    <span className="text-xs font-normal text-white/40">({foodInventory.length} items)</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                    {foodInventory.map(food => (
                      <div key={food.id} onClick={() => setSelectedFood(food)}
                        className={`rounded-xl p-2 border-2 cursor-pointer transition-all text-center ${selectedFood?.id === food.id ? 'border-orange-400 bg-orange-500/25 scale-[1.03]' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                        {food.foodImageUrl
                          ? <img src={food.foodImageUrl} className="w-12 h-12 rounded-lg mx-auto object-cover mb-1" alt={food.foodName} />
                          : <div className="text-2xl mb-1">🍽️</div>}
                        <p className="text-white text-xs truncate leading-tight">{food.foodName}</p>
                        <p className={`text-xs capitalize ${RARITY_COLORS[food.foodRarity] || 'text-slate-400'}`}>×{food.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pet selection */}
                <div>
                  <h3 className="text-amber-200 font-bold mb-3 flex items-center gap-2">
                    🐾 Choose a Pet
                    <span className="text-xs font-normal text-white/40">({pets.length} pets)</span>
                  </h3>
                  {pets.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-6">No pets unlocked yet!</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                      {pets.map(pet => (
                        <div key={pet.displayId} onClick={() => setSelectedPet(pet)}
                          className={`rounded-xl p-2 border-2 cursor-pointer transition-all text-center ${selectedPet?.displayId === pet.displayId ? 'border-amber-400 bg-amber-500/25 scale-[1.03]' : `border-white/10 bg-white/5 hover:border-white/30`}`}>
                          {pet.imageUrl
                            ? <img src={pet.imageUrl} className="w-12 h-12 rounded-lg mx-auto object-cover mb-1" alt={pet.name} />
                            : <div className="text-2xl mb-1">{pet.emoji || '🐾'}</div>}
                          <p className="text-white text-xs truncate leading-tight">{pet.name}</p>
                          <p className={`text-xs capitalize ${RARITY_COLORS[pet.rarity] || 'text-slate-400'}`}>{pet.rarity || 'common'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview & feed */}
              <div className="mt-6">
                {feeding ? (
                  <div className="bg-white/5 rounded-2xl p-6 border border-amber-500/20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-3" />
                    <p className="text-white font-semibold text-lg">{feedStep || 'Creating your new pet & theme...'}</p>
                    <p className="text-white/40 text-sm mt-1">This takes a moment — something legendary is cooking ✨</p>
                  </div>
                ) : selectedFood && selectedPet ? (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center mb-4">
                    <p className="text-white/70 text-sm">
                      Feed <span className="text-orange-300 font-semibold">{selectedFood.foodName}</span> to <span className="text-amber-300 font-semibold">{selectedPet.name}</span>
                    </p>
                    <p className="text-white/40 text-xs mt-1">🌟 Creates a new Legendary pet AND a matching theme! (Food will be consumed)</p>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center mb-4">
                    <p className="text-white/30 text-sm">Select a food item and a pet above to begin fusion ✨</p>
                  </div>
                )}

                <Button
                  onClick={handleFeed}
                  disabled={!selectedFood || !selectedPet || feeding}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold h-14 text-base rounded-2xl disabled:opacity-40">
                  {feeding
                    ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating pet & theme...</>
                    : <><Heart className="w-5 h-5 mr-2" />Fuse & Create Legendary Pet + Theme! 🌟</>}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}