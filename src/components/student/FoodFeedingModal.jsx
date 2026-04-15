import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ChefHat, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PETS } from '@/components/quest/PetCatalog';
import { toast } from 'sonner';

const RARITY_COLORS = {
  common: 'text-slate-400', uncommon: 'text-green-400', rare: 'text-blue-400',
  epic: 'text-purple-400', legendary: 'text-yellow-400'
};

const RARITY_BORDER = {
  common: 'border-slate-400/40', uncommon: 'border-green-400/40', rare: 'border-blue-400/40',
  epic: 'border-purple-400/40', legendary: 'border-yellow-400/40'
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
      setFeedStep('🧠 AI is creating your new pet & theme...');
      const llmResult = await base44.integrations.Core.InvokeLLM({
        prompt: `A student is feeding a special food item to their digital pet in a gamified school app! Create a fun new transformed pet AND a matching theme.

Original Pet: ${selectedPet.name} (${selectedPet.description || 'a cool digital pet'}, rarity: ${selectedPet.rarity || 'common'})
Food Consumed: ${selectedFood.foodName} — Flavor: ${selectedFood.foodFlavor}
Food Description: ${selectedFood.foodDescription || ''}

Create a LEGENDARY food-themed pet that is inspired by BOTH the food AND the original pet.
Also create a vibrant matching theme with 4 hex color values that reflect the food's colors/vibe.

Return JSON with:
- name: creative pet name combining the pet's spirit with the food theme
- description: 2-3 fun, exciting sentences describing the transformed pet (kid-friendly!)
- theme: object with keys primary, secondary, accent, bg (all hex color strings e.g. "#ff6b6b")`,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
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

      setFeedStep('🎨 Drawing your new pet...');
      const imgResult = await base44.integrations.Core.GenerateImage({
        prompt: `Cute cartoon ${selectedPet.name} transformed after eating ${selectedFood.foodName}. Named "${llmResult.name}". ${selectedFood.foodFlavor} colors and flavor effects on the creature. Vibrant, magical, kid-friendly digital art style, white background, legendary quality`
      });

      setFeedStep('✨ Adding pet & theme to your collection...');

      const themeData = llmResult.theme || { primary: '#f97316', secondary: '#fb923c', accent: '#fbbf24', bg: '#fff7ed' };

      // Create the pet
      const newPetRecord = await base44.entities.CustomPet.create({
        name: llmResult.name,
        description: llmResult.description,
        rarity: 'legendary',
        xpRequired: 0,
        isGiftOnly: true,
        imageUrl: imgResult.url,
        imageSource: 'ai_generated',
        createdSourceTab: 'unknown',
        theme: themeData,
        lore: `Born when ${selectedPet.name} devoured a magical ${selectedFood.foodName} and transformed forever!`
      });

      // Create the matching theme
      const newThemeRecord = await base44.entities.CustomTheme.create({
        name: `${llmResult.name} Theme`,
        rarity: 'legendary',
        xpRequired: 0,
        description: `A legendary theme born from ${selectedFood.foodName} and ${selectedPet.name}!`,
        primaryColor: themeData.primary,
        secondaryColor: themeData.secondary,
        accentColor: themeData.accent,
        bgColor: themeData.bg,
      });

      const newPetId = `custom_${newPetRecord.id}`;
      const newThemeId = `custom_${newThemeRecord.id}`;

      const currentPets = [...(profile.unlockedPets || [])];
      if (!currentPets.includes(newPetId)) currentPets.push(newPetId);

      const currentThemes = [...(profile.unlockedThemes || [])];
      if (!currentThemes.includes(newThemeId)) currentThemes.push(newThemeId);

      await base44.entities.UserProfile.update(profile.id, {
        unlockedPets: currentPets,
        unlockedThemes: currentThemes,
        equippedPetId: newPetId
      });

      // Consume the food
      if (selectedFood.quantity <= 1) {
        await base44.entities.FoodInventory.delete(selectedFood.id);
      } else {
        await base44.entities.FoodInventory.update(selectedFood.id, { quantity: selectedFood.quantity - 1 });
      }

      setResult({ pet: newPetRecord, theme: newThemeRecord });
      toast.success(`🍽️ ${llmResult.name} appeared!`);
    } catch (e) {
      toast.error('Feeding failed: ' + e.message);
    }
    setFeeding(false);
    setFeedStep('');
  };

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-br from-orange-950 via-amber-950 to-yellow-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-amber-800/40 shrink-0">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-orange-400" />
          <h1 className="text-white font-bold text-lg">Pet Fuse Kitchen 🍽️</h1>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-orange-400" />
            <p className="text-white/50">Loading your inventory...</p>
          </div>
        ) : result ? (
          // ── SUCCESS SCREEN ──
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-full px-6 py-10 text-center"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">{result.pet.name}</h2>
            <p className="text-amber-200/70 text-base mb-6 max-w-sm">{result.pet.description}</p>

            {result.pet.imageUrl && (
              <img
                src={result.pet.imageUrl}
                alt={result.pet.name}
                className="w-48 h-48 rounded-3xl object-cover mx-auto mb-6 border-4 border-yellow-400 shadow-2xl"
              />
            )}

            <div className="bg-yellow-500/20 rounded-2xl px-6 py-4 mb-6 max-w-sm w-full border border-yellow-500/30">
              <div className="text-yellow-300 font-bold text-lg mb-1">⭐ LEGENDARY PET</div>
              <div className="text-yellow-200/70 text-sm">Added to your collection & equipped!</div>
            </div>

            <div className="bg-white/10 rounded-2xl px-6 py-4 mb-8 max-w-sm w-full border border-white/20">
              <div className="text-white font-bold mb-2">🎨 Matching Theme Created!</div>
              <div className="flex justify-center gap-2 mb-2">
                {result.theme && [result.theme.primaryColor, result.theme.secondaryColor, result.theme.accentColor, result.theme.bgColor].map((c, i) => (
                  <div key={i} className="w-9 h-9 rounded-full ring-2 ring-white/30 shadow-lg" style={{ backgroundColor: c }} />
                ))}
              </div>
              <div className="text-white/50 text-xs">{result.pet.name} Theme — unlock it in your Collection!</div>
            </div>

            <Button onClick={onClose} className="bg-orange-500 hover:bg-orange-400 text-white px-10 h-12 text-base font-bold rounded-2xl">
              Awesome! 🎊
            </Button>
          </motion.div>
        ) : foodInventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full px-6 text-center gap-3">
            <div className="text-6xl">🍽️</div>
            <p className="text-white font-semibold text-xl">No food items yet!</p>
            <p className="text-white/40 text-sm">Buy food from the Shop or earn them through 1Pass rewards.</p>
          </div>
        ) : (
          <div className="px-5 py-5 flex flex-col gap-5">

            {/* Food selection */}
            <div>
              <h3 className="text-amber-200 font-bold text-base mb-3">🍱 Choose a Food ({foodInventory.length} items)</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {foodInventory.map(food => (
                  <motion.div
                    key={food.id}
                    whileTap={{ scale: 0.93 }}
                    onClick={() => setSelectedFood(food)}
                    className={`rounded-2xl p-3 border-2 cursor-pointer transition-all text-center relative ${
                      selectedFood?.id === food.id
                        ? 'border-orange-400 bg-orange-500/25 shadow-lg shadow-orange-500/20'
                        : 'border-white/10 bg-white/5 hover:border-white/30'
                    }`}
                  >
                    {selectedFood?.id === food.id && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {food.foodImageUrl
                      ? <img src={food.foodImageUrl} className="w-14 h-14 rounded-xl mx-auto object-cover mb-2" alt={food.foodName} />
                      : <div className="text-3xl mb-2">🍽️</div>}
                    <p className="text-white text-xs font-medium truncate leading-tight">{food.foodName}</p>
                    <p className={`text-xs capitalize mt-0.5 ${RARITY_COLORS[food.foodRarity] || 'text-slate-400'}`}>×{food.quantity}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pet selection */}
            <div>
              <h3 className="text-amber-200 font-bold text-base mb-3">🐾 Choose a Pet to Fuse ({pets.length})</h3>
              {pets.length === 0 ? (
                <p className="text-white/40 text-sm text-center py-6">No pets unlocked yet!</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {pets.map(pet => (
                    <motion.div
                      key={pet.displayId}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setSelectedPet(pet)}
                      className={`rounded-2xl p-3 border-2 cursor-pointer transition-all text-center relative ${
                        selectedPet?.displayId === pet.displayId
                          ? `border-amber-400 bg-amber-500/25 shadow-lg shadow-amber-500/20`
                          : `border-white/10 bg-white/5 hover:border-white/30 ${RARITY_BORDER[pet.rarity] || ''}`
                      }`}
                    >
                      {selectedPet?.displayId === pet.displayId && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {pet.imageUrl
                        ? <img src={pet.imageUrl} className="w-14 h-14 rounded-xl mx-auto object-cover mb-2" alt={pet.name} />
                        : <div className="text-3xl mb-2">{pet.emoji || '🐾'}</div>}
                      <p className="text-white text-xs font-medium truncate leading-tight">{pet.name}</p>
                      <p className={`text-xs capitalize mt-0.5 ${RARITY_COLORS[pet.rarity] || 'text-slate-400'}`}>{pet.rarity || 'common'}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Fusion Preview */}
            <AnimatePresence>
              {selectedFood && selectedPet && !feeding && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white/5 rounded-2xl p-4 border border-amber-500/20 text-center"
                >
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="text-center">
                      {selectedPet.imageUrl
                        ? <img src={selectedPet.imageUrl} className="w-12 h-12 rounded-xl object-cover mx-auto" alt={selectedPet.name} />
                        : <div className="text-3xl">{selectedPet.emoji || '🐾'}</div>}
                      <p className="text-white/60 text-xs mt-1">{selectedPet.name}</p>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-amber-400 font-bold text-lg">+</span>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-center">
                      {selectedFood.foodImageUrl
                        ? <img src={selectedFood.foodImageUrl} className="w-12 h-12 rounded-xl object-cover mx-auto" alt={selectedFood.foodName} />
                        : <div className="text-3xl">🍽️</div>}
                      <p className="text-white/60 text-xs mt-1">{selectedFood.foodName}</p>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-amber-400 font-bold text-lg">=</span>
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400/30 to-orange-500/30 border border-yellow-400/40 flex items-center justify-center mx-auto">
                        <Sparkles className="w-6 h-6 text-yellow-300" />
                      </div>
                      <p className="text-yellow-300 text-xs mt-1 font-semibold">New Legendary!</p>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs">A new pet AND a matching theme will be created! ✨ Food will be consumed.</p>
                </motion.div>
              )}
            </AnimatePresence>

            {feeding && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-amber-500/10 rounded-2xl p-6 border border-amber-500/30 text-center"
              >
                <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-3" />
                <p className="text-white font-semibold">{feedStep || 'Creating your new pet...'}</p>
                <p className="text-white/40 text-xs mt-1">This takes a moment ✨</p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Feed Button */}
      {!result && !loading && foodInventory.length > 0 && (
        <div className="shrink-0 px-5 py-4 border-t border-amber-800/40 bg-black/20">
          <Button
            onClick={handleFeed}
            disabled={!selectedFood || !selectedPet || feeding}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold h-13 text-base rounded-2xl h-12 disabled:opacity-40"
          >
            {feeding
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Fusing...</>
              : <><Sparkles className="w-4 h-4 mr-2" />Fuse Pet + Food → New Legendary! 🌟</>}
          </Button>
        </div>
      )}
    </div>
  );
}