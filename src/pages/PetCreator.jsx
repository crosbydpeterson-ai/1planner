import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Wand2, Loader2, Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function PetCreator() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [petIdea, setPetIdea] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedPet, setGeneratedPet] = useState(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    checkAccess();
    base44.analytics.track({ eventName: 'pet_creator_viewed' });
  }, []);

  const checkAccess = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      navigate(createPageUrl('Home'));
      return;
    }

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0 || !profiles[0].isPetCreator) {
        toast.error('You do not have Pet Creator access');
        navigate(createPageUrl('Dashboard'));
        return;
      }
      setProfile(profiles[0]);
    } catch (e) {
      navigate(createPageUrl('Dashboard'));
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!petIdea.trim()) {
      toast.error('Describe your creature idea!');
      return;
    }

    setGenerating(true);
    setGeneratedPet(null);
    setGeneratedImageUrl(null);

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a magical creature designer for a KIDS school gamification app.

Create a magical companion based on: "${petIdea}"

WHAT YOU CAN CREATE:
- Traditional pets, magical creatures, living objects, food creatures, nature spirits, abstract concepts, robots, mythical beings - ANYTHING fun!

CONTENT RULES (FOR CHILDREN):
- Must be appropriate for elementary/middle school kids
- NO violence, weapons, scary monsters, demons, horror
- NO inappropriate content
- Keep it cute, fun, positive, school-friendly!
- If idea is inappropriate, make a safe alternative

Generate:
- name: Creative 2-3 word name
- description: Fun 1-2 sentence description
- emoji: Single emoji that fits
- rarity: uncommon, rare, or epic
- theme: { primary, secondary, accent, bg } - all valid hex codes`,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            emoji: { type: "string" },
            rarity: { type: "string", enum: ["uncommon", "rare", "epic"] },
            theme: {
              type: "object",
              properties: {
                primary: { type: "string" },
                secondary: { type: "string" },
                accent: { type: "string" },
                bg: { type: "string" }
              }
            }
          }
        }
      });

      setGeneratedPet(result);
      generateImage(result);
    } catch (e) {
      toast.error('Generation failed, try again!');
    }
    setGenerating(false);
  };

  const generateImage = async (pet) => {
    setGeneratingImage(true);
    try {
      const imgResult = await base44.integrations.Core.GenerateImage({
        prompt: `Cute cartoon creature for kids game: ${pet.name}. ${pet.description}. Style: adorable, colorful, Pixar-style, game mascot, kid-friendly. Colors: ${pet.theme?.primary}, ${pet.theme?.secondary}. White background, centered, high quality.`
      });
      setGeneratedImageUrl(imgResult.url);
    } catch (e) {
      console.log('Image failed, using emoji');
    }
    setGeneratingImage(false);
  };

  const handleSavePet = async () => {
    if (!generatedPet) return;

    try {
      await base44.entities.CustomPet.create({
        name: generatedPet.name,
        description: generatedPet.description,
        emoji: generatedPet.emoji,
        imageUrl: generatedImageUrl || '',
        rarity: generatedPet.rarity,
        xpRequired: 999999,
        isGiftOnly: true,
        theme: generatedPet.theme
      });

      toast.success(`🎉 ${generatedPet.name} created!`, {
        description: 'Waiting for admin approval'
      });
      
      setPetIdea('');
      setGeneratedPet(null);
      setGeneratedImageUrl(null);
    } catch (e) {
      toast.error('Failed to save pet');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Pet Creator</h1>
              <p className="text-sm text-slate-500">Create magical creatures!</p>
            </div>
          </div>
        </motion.div>

        {/* Creator Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/40"
        >
          <div className="text-center mb-4">
            <span className="text-5xl">🥚✨</span>
          </div>

          <Textarea
            value={petIdea}
            onChange={(e) => setPetIdea(e.target.value)}
            placeholder="Describe your creature... (e.g., 'A rainbow slime that loves reading', 'A tiny robot made of pencils')"
            className="min-h-[100px] bg-white/50 border-white/40 mb-4"
          />

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Magic...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Creature
              </>
            )}
          </Button>
        </motion.div>

        {/* Preview */}
        {generatedPet && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 rounded-2xl p-6 text-center"
            style={{ backgroundColor: generatedPet.theme?.bg || '#f8fafc' }}
          >
            {/* Image or Emoji */}
            <div className="relative w-32 h-32 mx-auto mb-4">
              {generatingImage ? (
                <div className="w-full h-full rounded-2xl bg-white/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: generatedPet.theme?.primary }} />
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

            {!generatingImage && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => generateImage(generatedPet)}
                className="mb-2"
                style={{ color: generatedPet.theme?.primary }}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {generatedImageUrl ? 'New Image' : 'Generate Image'}
              </Button>
            )}

            <h3 
              className="text-xl font-bold mb-1"
              style={{ color: generatedPet.theme?.primary }}
            >
              {generatedPet.name}
            </h3>
            <p className="text-sm text-slate-600 mb-3">{generatedPet.description}</p>
            
            <div 
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize text-white mb-4"
              style={{ backgroundColor: generatedPet.theme?.secondary }}
            >
              {generatedPet.rarity}
            </div>

            {/* Theme preview */}
            <div className="flex justify-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full shadow" style={{ backgroundColor: generatedPet.theme?.primary }} />
              <div className="w-6 h-6 rounded-full shadow" style={{ backgroundColor: generatedPet.theme?.secondary }} />
              <div className="w-6 h-6 rounded-full shadow" style={{ backgroundColor: generatedPet.theme?.accent }} />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setGeneratedPet(null); setGeneratedImageUrl(null); }}
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                onClick={handleSavePet}
                disabled={generatingImage}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Save Pet
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}