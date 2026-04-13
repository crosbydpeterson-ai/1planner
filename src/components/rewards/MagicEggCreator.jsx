import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { colorStyle } from '@/components/theme/themeUtils';

export default function MagicEggCreator({ egg, profile, onPetCreated }) {
  const [showDialog, setShowDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [petIdea, setPetIdea] = useState('');
  const [generatedPet, setGeneratedPet] = useState(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [step, setStep] = useState('idea'); // 'idea', 'generating', 'preview', 'hatching'

  const handleGeneratePet = async () => {
    if (!petIdea.trim()) {
      toast.error('Tell me about your dream pet!');
      return;
    }

    setStep('generating');
    setGenerating(true);
    setGeneratingImage(true);

    try {
      const { data } = await base44.functions.invoke('generateEggPet', {
        action: 'generate',
        petIdea: petIdea.trim()
      });

      setGeneratedPet(data.concept);
      setGeneratedImageUrl(data.imageUrl || null);
      setStep('preview');
    } catch (e) {
      toast.error('Magic failed! Try again.');
      setStep('idea');
    }
    setGenerating(false);
    setGeneratingImage(false);
  };

  const handleHatchPet = async () => {
    if (!generatedPet) return;
    
    setStep('hatching');

    try {
      const { data } = await base44.functions.invoke('generateEggPet', {
        action: 'hatch',
        eggId: egg.id,
        profileId: profile.id,
        petData: {
          name: generatedPet.name,
          description: generatedPet.description,
          emoji: generatedPet.emoji,
          imageUrl: generatedImageUrl || '',
          rarity: generatedPet.rarity,
          theme: generatedPet.theme
        }
      });

      toast.success(`🎉 ${generatedPet.name} hatched!`, {
        description: 'Your new pet is now equipped!'
      });

      window.dispatchEvent(new Event('themeUpdated'));
      onPetCreated(data.pet, data.petId, data.theme, data.themeId);
      setShowDialog(false);
      setStep('idea');
      setPetIdea('');
      setGeneratedPet(null);
      setGeneratedImageUrl(null);
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
        <DialogContent hideClose onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()} className="bg-white/90 backdrop-blur-xl border border-white/40 max-w-md">
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
                  className="rounded-2xl p-6 text-center relative overflow-hidden"
                  style={colorStyle(generatedPet.theme?.bg || '#f8fafc')}
                >
                  {/* Pet Image or Emoji */}
                  <div className="relative w-32 h-32 mx-auto mb-3">
                    {generatingImage ? (
                      <div className="w-full h-full rounded-2xl bg-white/50 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: generatedPet.theme?.primary }} />
                          <p className="text-xs text-slate-500">Creating art...</p>
                        </div>
                      </div>
                    ) : generatedImageUrl ? (
                      <img 
                        src={generatedImageUrl} 
                        alt={generatedPet.name}
                        className="w-full h-full object-cover rounded-2xl shadow-xl"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-7xl">
                        {generatedPet.emoji}
                      </div>
                    )}
                  </div>
                  

                  
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
                    <div className="w-6 h-6 rounded-full shadow-lg" style={colorStyle(generatedPet.theme?.primary || '#6366f1')} />
                    <div className="w-6 h-6 rounded-full shadow-lg" style={colorStyle(generatedPet.theme?.secondary || '#a855f7')} />
                    <div className="w-6 h-6 rounded-full shadow-lg" style={colorStyle(generatedPet.theme?.accent || '#f59e0b')} />
                  </div>
                </div>

                <Button
                  onClick={handleHatchPet}
                  disabled={generatingImage}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Hatch Pet!
                </Button>
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