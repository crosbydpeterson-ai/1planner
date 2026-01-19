import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function MagicEggCreator({ egg, profile, onPetCreated }) {
  const [showDialog, setShowDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [petIdea, setPetIdea] = useState('');
  const [generatedPet, setGeneratedPet] = useState(null);
  const [step, setStep] = useState('idea'); // 'idea', 'generating', 'preview', 'hatching'

  const handleGeneratePet = async () => {
    if (!petIdea.trim()) {
      toast.error('Tell me about your dream pet!');
      return;
    }

    setStep('generating');
    setGenerating(true);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a magical pet designer for a school gamification app called Quest Planner.

A student wants to create their own custom pet using a Magic Egg!

Their idea: "${petIdea}"

Generate a fun, school-appropriate pet based on their idea. The pet should:
- Have a creative, catchy name (2-3 words max)
- Be cute and friendly
- Have a fun description (1-2 sentences)
- Have a single emoji that fits the pet (just ONE emoji character)
- Have a cohesive color theme with 4 HEX color codes

IMPORTANT for theme colors:
- primary: Main color (vibrant, saturated) - MUST be a valid hex like #3b82f6
- secondary: Lighter/complementary color - MUST be a valid hex like #93c5fd  
- accent: Pop color for highlights - MUST be a valid hex like #f59e0b
- bg: Background color (light for light themes like #f0f9ff, dark for dark themes like #1e1b4b)

Make sure all colors work well together and match the pet's personality!`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Pet name, 2-3 words" },
            description: { type: "string", description: "Fun 1-2 sentence description" },
            emoji: { type: "string", description: "Single emoji character" },
            rarity: { type: "string", enum: ["uncommon", "rare", "epic"] },
            theme: {
              type: "object",
              properties: {
                primary: { type: "string", description: "Main hex color like #3b82f6" },
                secondary: { type: "string", description: "Secondary hex color like #93c5fd" },
                accent: { type: "string", description: "Accent hex color like #f59e0b" },
                bg: { type: "string", description: "Background hex color like #f0f9ff or #1e1b4b" }
              },
              required: ["primary", "secondary", "accent", "bg"]
            }
          },
          required: ["name", "description", "emoji", "rarity", "theme"]
        }
      });

      setGeneratedPet(result);
      setStep('preview');
    } catch (e) {
      toast.error('Magic failed! Try again.');
      setStep('idea');
    }
    setGenerating(false);
  };

  const handleHatchPet = async () => {
    if (!generatedPet) return;
    
    setStep('hatching');

    try {
      // Create the custom pet
      const newPet = await base44.entities.CustomPet.create({
        name: generatedPet.name,
        description: generatedPet.description,
        emoji: generatedPet.emoji,
        rarity: generatedPet.rarity,
        xpRequired: 999999,
        isGiftOnly: true,
        theme: generatedPet.theme
      });

      // Mark egg as used
      await base44.entities.MagicEgg.update(egg.id, {
        isUsed: true,
        createdPetId: newPet.id
      });

      // Add pet to user's collection
      const newPetId = `custom_${newPet.id}`;
      const unlockedPets = [...(profile.unlockedPets || []), newPetId];
      await base44.entities.UserProfile.update(profile.id, {
        unlockedPets,
        equippedPetId: newPetId
      });

      toast.success(`🎉 ${generatedPet.name} hatched!`, {
        description: 'Your new pet is now equipped!'
      });

      window.dispatchEvent(new Event('themeUpdated'));
      onPetCreated(newPet, newPetId);
      setShowDialog(false);
      setStep('idea');
      setPetIdea('');
      setGeneratedPet(null);
    } catch (e) {
      toast.error('Failed to hatch pet');
      setStep('preview');
    }
  };

  return (
    <>
      {/* Magic Egg Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setShowDialog(true)}
        className="relative rounded-2xl p-4 cursor-pointer overflow-hidden bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/20 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        
        {/* Sparkle effects */}
        <div className="absolute top-2 right-2 animate-pulse">
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>
        <div className="absolute bottom-3 left-3 animate-pulse delay-300">
          <Sparkles className="w-4 h-4 text-purple-400" />
        </div>
        
        <div className="relative z-10 text-center">
          <div className="text-5xl mb-3 animate-bounce">🥚</div>
          <h3 className="font-bold text-slate-800">Magic Egg</h3>
          <p className="text-xs text-purple-600 font-semibold">Tap to create your pet!</p>
        </div>
      </motion.div>

      {/* Creation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white/90 backdrop-blur-xl border border-white/40 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Magic Egg Creator
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {step === 'idea' && (
              <motion.div
                key="idea"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4 py-4"
              >
                <div className="text-center">
                  <div className="text-6xl mb-3">🥚✨</div>
                  <p className="text-slate-600">Describe your dream pet and AI magic will bring it to life!</p>
                </div>
                
                <div className="space-y-2">
                  <Label>What kind of pet do you want?</Label>
                  <Textarea
                    value={petIdea}
                    onChange={(e) => setPetIdea(e.target.value)}
                    placeholder="Example: A cool space dragon that loves math, or a rainbow cat that helps with reading..."
                    className="min-h-[100px] bg-white/50 border-white/40"
                  />
                </div>

                <Button
                  onClick={handleGeneratePet}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Use Magic!
                </Button>
              </motion.div>
            )}

            {step === 'generating' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center"
              >
                <div className="text-6xl mb-4 animate-bounce">🥚</div>
                <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-purple-500" />
                <p className="text-slate-600">Magic is happening...</p>
              </motion.div>
            )}

            {step === 'preview' && generatedPet && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4 py-4"
              >
                <div 
                  className="rounded-2xl p-6 text-center"
                  style={{ backgroundColor: generatedPet.theme?.bg || '#f8fafc' }}
                >
                  <div className="text-6xl mb-3">{generatedPet.emoji}</div>
                  <h3 
                    className="text-xl font-bold mb-1"
                    style={{ color: generatedPet.theme?.primary || '#6366f1' }}
                  >
                    {generatedPet.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">{generatedPet.description}</p>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize"
                    style={{ 
                      backgroundColor: generatedPet.theme?.secondary || '#a855f7',
                      color: 'white'
                    }}
                  >
                    {generatedPet.rarity}
                  </div>
                  
                  {/* Theme preview */}
                  <div className="flex justify-center gap-2 mt-4">
                    <div className="w-6 h-6 rounded-full shadow-lg" style={{ backgroundColor: generatedPet.theme?.primary }} />
                    <div className="w-6 h-6 rounded-full shadow-lg" style={{ backgroundColor: generatedPet.theme?.secondary }} />
                    <div className="w-6 h-6 rounded-full shadow-lg" style={{ backgroundColor: generatedPet.theme?.accent }} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => { setStep('idea'); setGeneratedPet(null); }}
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={handleHatchPet}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Hatch Pet!
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 'hatching' && (
              <motion.div
                key="hatching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center"
              >
                <motion.div 
                  className="text-6xl mb-4"
                  animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  🥚
                </motion.div>
                <p className="text-slate-600">Hatching your pet...</p>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}