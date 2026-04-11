import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, FlaskConical, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PETS } from '@/components/quest/PetCatalog';
import { toast } from 'sonner';

export default function FusionLabEvent({ event, profile, onClose }) {
  const [pets, setPets] = useState([]);
  const [selected, setSelected] = useState([]);
  const [fusing, setFusing] = useState(false);
  const [fusedPet, setFusedPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fuseStep, setFuseStep] = useState('');

  useEffect(() => { loadPets(); }, []);

  const loadPets = async () => {
    setLoading(true);
    const unlockedIds = profile?.unlockedPets || [];
    const petList = [];
    for (const id of unlockedIds.slice(0, 30)) {
      if (id.startsWith('custom_')) {
        try {
          const dbId = id.replace('custom_', '');
          const recs = await base44.entities.CustomPet.filter({ id: dbId });
          if (recs[0]) petList.push({ ...recs[0], displayId: id });
        } catch {}
      } else {
        const builtIn = PETS.find(p => p.id === id);
        if (builtIn) petList.push({ ...builtIn, displayId: id });
      }
    }
    setPets(petList);
    setLoading(false);
  };

  const toggleSelect = (pet) => {
    setSelected(prev => {
      if (prev.find(p => p.displayId === pet.displayId)) return prev.filter(p => p.displayId !== pet.displayId);
      if (prev.length >= 2) return prev;
      return [...prev, pet];
    });
  };

  const handleFuse = async () => {
    if (selected.length !== 2) return;
    setFusing(true);
    const [pet1, pet2] = selected;
    try {
      setFuseStep('🧠 AI is combining your pets...');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a fun fusion pet for a 5th-grade gamified school app!

Pet 1: ${pet1.name} — ${pet1.description || 'a cool digital pet'}
Pet 2: ${pet2.name} — ${pet2.description || 'an awesome digital pet'}

Fuse them into ONE Legendary pet with:
- A creative, exciting name (don't just smash names together — be clever!)
- A fun 2-3 sentence description (kid-friendly, exciting, school-themed if possible)

Return JSON with: name, description`,
        response_json_schema: {
          type: 'object',
          properties: { name: { type: 'string' }, description: { type: 'string' } }
        }
      });

      setFuseStep('🎨 Generating fusion artwork...');
      const imgResult = await base44.integrations.Core.GenerateImage({
        prompt: `Cute magical fusion creature combining ${pet1.name} and ${pet2.name}, named ${result.name}. Vibrant glowing colors, fusion energy effects, cartoon digital art style, white background, kid-friendly, epic legendary quality`
      });

      setFuseStep('✨ Adding to your collection...');
      const newPetRecord = await base44.entities.CustomPet.create({
        name: result.name,
        description: result.description,
        rarity: 'legendary',
        xpRequired: 0,
        isGiftOnly: true,
        imageUrl: imgResult.url,
        imageSource: 'ai_generated',
        createdSourceTab: 'unknown',
        lore: `Born in the Fusion Lab when ${pet1.name} and ${pet2.name} merged their powers during a special event!`
      });

      const newId = `custom_${newPetRecord.id}`;
      const currentPets = [...(profile.unlockedPets || [])];
      if (!currentPets.includes(newId)) {
        currentPets.push(newId);
        await base44.entities.UserProfile.update(profile.id, { unlockedPets: currentPets });
      }

      setFusedPet({ ...newPetRecord, displayId: newId });
      toast.success(`🧪 ${result.name} was born from the fusion!`);
    } catch (e) {
      toast.error('Fusion failed: ' + e.message);
    }
    setFusing(false);
    setFuseStep('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-emerald-900/95 via-teal-900/95 to-cyan-900/95 backdrop-blur-sm overflow-y-auto">

      {/* Header */}
      <div className="sticky top-0 flex items-center justify-between p-4 z-10 bg-black/20 backdrop-blur">
        <div className="bg-white/10 rounded-2xl px-4 py-2 border border-white/20">
          <h2 className="text-white font-bold text-lg">🧪 Fusion Lab is LIVE!</h2>
          <p className="text-white/70 text-sm">Select 2 pets to fuse into a Legendary!</p>
        </div>
        <button onClick={onClose} className="bg-white/10 rounded-full p-2 border border-white/20 text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {fusedPet ? (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center mt-4">
            <p className="text-6xl mb-4">🎉</p>
            <h2 className="text-3xl font-bold text-white mb-2">{fusedPet.name}</h2>
            <p className="text-white/70 mb-4">{fusedPet.description}</p>
            {fusedPet.imageUrl && <img src={fusedPet.imageUrl} alt={fusedPet.name} className="w-40 h-40 rounded-2xl object-cover mx-auto mb-4 border-2 border-yellow-400 shadow-xl" />}
            <div className="inline-block bg-yellow-500/20 border border-yellow-500/40 rounded-full px-4 py-1 text-yellow-300 text-sm font-semibold mb-6">⭐ LEGENDARY — Added to your collection!</div>
            <br />
            <Button onClick={onClose} className="bg-white/20 hover:bg-white/30 text-white px-8">Close Lab 🧪</Button>
          </motion.div>
        ) : (
          <>
            {/* Selection slots */}
            <div className="flex gap-3 mb-4 mt-4">
              {[0, 1].map(i => (
                <div key={i} className={`flex-1 rounded-2xl border-2 p-3 text-center transition-all min-h-[80px] flex flex-col items-center justify-center ${selected[i] ? 'border-emerald-400 bg-emerald-500/20' : 'border-white/20 bg-white/5'}`}>
                  {selected[i] ? (
                    <>
                      {selected[i].imageUrl
                        ? <img src={selected[i].imageUrl} className="w-12 h-12 rounded-xl object-cover mb-1" alt={selected[i].name} />
                        : <div className="text-3xl mb-1">{selected[i].emoji || '🐾'}</div>}
                      <p className="text-white text-sm font-medium">{selected[i].name}</p>
                    </>
                  ) : (
                    <p className="text-white/40 text-sm">Pet {i + 1}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Fuse button */}
            {selected.length === 2 && !fusing && (
              <Button onClick={handleFuse} className="w-full mb-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold h-12">
                <FlaskConical className="w-5 h-5 mr-2" /> Fuse These Pets!
              </Button>
            )}

            {fusing && (
              <div className="bg-white/10 rounded-2xl p-5 text-center mb-4 border border-white/20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-2" />
                <p className="text-white font-semibold">{fuseStep || 'Fusion in progress...'}</p>
                <p className="text-white/50 text-sm">This may take a moment ✨</p>
              </div>
            )}

            {/* Pet grid */}
            {loading ? (
              <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin text-white/60 mx-auto" /></div>
            ) : pets.length === 0 ? (
              <div className="text-center py-8 text-white/50">No pets unlocked yet! Earn some XP first.</div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {pets.map(pet => {
                  const isSelected = !!selected.find(p => p.displayId === pet.displayId);
                  const isDisabled = !isSelected && selected.length >= 2;
                  return (
                    <motion.div key={pet.displayId} whileTap={{ scale: 0.95 }}
                      onClick={() => !isDisabled && !fusing && toggleSelect(pet)}
                      className={`rounded-2xl p-3 border-2 text-center transition-all ${isSelected ? 'border-emerald-400 bg-emerald-500/20 cursor-pointer' : isDisabled ? 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed' : 'border-white/20 bg-white/10 hover:border-white/40 cursor-pointer'}`}>
                      {pet.imageUrl
                        ? <img src={pet.imageUrl} className="w-14 h-14 rounded-xl mx-auto object-cover mb-1" alt={pet.name} />
                        : <div className="text-3xl mb-1">{pet.emoji || '🐾'}</div>}
                      <p className="text-white text-xs font-medium truncate">{pet.name}</p>
                      <p className="text-white/50 text-xs capitalize">{pet.rarity || 'common'}</p>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}