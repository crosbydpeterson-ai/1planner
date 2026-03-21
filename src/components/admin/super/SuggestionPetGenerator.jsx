import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

// Takes all suggestion-box responses, extracts pet ideas via AI,
// filters for kid-appropriateness, then generates a CustomPet + image for each.

export default function SuggestionPetGenerator({ responses }) {
  const [phase, setPhase] = useState('idle'); // idle | scanning | previewing | generating
  const [scannedPets, setScannedPets] = useState([]);
  const [generatingIndex, setGeneratingIndex] = useState(-1);
  const [doneIds, setDoneIds] = useState(new Set());

  const handleScan = async () => {
    const allText = responses
      .map(r => r.content)
      .filter(Boolean)
      .join('\n');

    if (!allText.trim()) {
      toast.error('No response text to scan.');
      return;
    }

    setPhase('scanning');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a content moderator and creative pet designer for a CHILDREN'S school app.

Below are student suggestion-box responses. Your job is to:
1. Read through all responses and extract any pet ideas mentioned (e.g. "I want a dragon", "a rainbow cat", "pizza dog").
2. Filter OUT anything inappropriate for elementary/middle school kids (violence, scary monsters, adult themes, weapons, horror, rude content).
3. For each appropriate pet idea, design a unique magical companion with a name, description, emoji, rarity, and 4 hex theme colors.
4. Deduplicate — if multiple students suggested the same animal type, make ONE creative version of it.
5. Return at most 10 pets.

Responses:
${allText}

IMPORTANT: Only include pets that are safe, fun, and school-appropriate. Be creative with names!`,
        response_json_schema: {
          type: 'object',
          properties: {
            pets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  emoji: { type: 'string' },
                  rarity: { type: 'string', enum: ['common', 'uncommon', 'rare', 'epic'] },
                  theme: {
                    type: 'object',
                    properties: {
                      primary: { type: 'string' },
                      secondary: { type: 'string' },
                      accent: { type: 'string' },
                      bg: { type: 'string' }
                    },
                    required: ['primary', 'secondary', 'accent', 'bg']
                  }
                },
                required: ['name', 'description', 'emoji', 'rarity', 'theme']
              }
            }
          },
          required: ['pets']
        }
      });

      setScannedPets(result.pets || []);
      setPhase('previewing');
    } catch (e) {
      toast.error('Scan failed. Try again.');
      setPhase('idle');
    }
  };

  const handleGenerateOne = async (pet, index) => {
    setGeneratingIndex(index);
    try {
      // Generate image
      let imageUrl = '';
      try {
        const imgResult = await base44.integrations.Core.GenerateImage({
          prompt: `Cute cartoon pet character for a CHILDREN'S educational game: ${pet.name}. ${pet.description}. Style: adorable, friendly, colorful digital art, game mascot style, simple clean design, kid-friendly, Pixar-style cuteness. Color scheme: primary ${pet.theme?.primary}, secondary ${pet.theme?.secondary}. White background, centered, high quality illustration.`
        });
        imageUrl = imgResult.url || '';
      } catch (_) {}

      // Create the pet
      await base44.entities.CustomPet.create({
        name: pet.name,
        description: pet.description,
        emoji: pet.emoji,
        imageUrl,
        rarity: pet.rarity,
        xpRequired: 0,
        isGiftOnly: false,
        theme: pet.theme,
        createdSourceTab: 'admin_eggs',
        imageSource: imageUrl ? 'ai_generated' : 'emoji_only'
      });

      setDoneIds(prev => new Set([...prev, index]));
      toast.success(`${pet.name} created!`);
    } catch (e) {
      toast.error(`Failed to create ${pet.name}`);
    }
    setGeneratingIndex(-1);
  };

  const handleGenerateAll = async () => {
    setPhase('generating');
    for (let i = 0; i < scannedPets.length; i++) {
      if (doneIds.has(i)) continue;
      await handleGenerateOne(scannedPets[i], i);
    }
    setPhase('previewing');
    toast.success('All pets created!');
  };

  if (phase === 'idle') {
    return (
      <Button
        onClick={handleScan}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
        size="sm"
      >
        <Sparkles className="w-4 h-4 mr-1" />
        Generate Pets from Responses
      </Button>
    );
  }

  if (phase === 'scanning') {
    return (
      <div className="flex items-center gap-2 text-purple-600 text-sm py-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Scanning responses for pet ideas…
      </div>
    );
  }

  return (
    <div className="mt-3 border border-purple-200 rounded-xl p-4 bg-purple-50 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-purple-800">
          {scannedPets.length} pet{scannedPets.length !== 1 ? 's' : ''} found from responses
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setPhase('idle'); setScannedPets([]); setDoneIds(new Set()); }}
          >
            <X className="w-3 h-3 mr-1" /> Reset
          </Button>
          <Button
            size="sm"
            onClick={handleGenerateAll}
            disabled={generatingIndex >= 0 || doneIds.size === scannedPets.length}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {generatingIndex >= 0 ? (
              <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="w-3 h-3 mr-1" /> Create All</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {scannedPets.map((pet, i) => {
          const isDone = doneIds.has(i);
          const isThis = generatingIndex === i;
          return (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-white border border-purple-100"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: pet.theme?.bg || '#f8fafc' }}
              >
                {pet.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{pet.name}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{pet.rarity}</p>
              </div>
              <div className="flex-shrink-0">
                {isDone ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : isThis ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={generatingIndex >= 0}
                    onClick={() => handleGenerateOne(pet, i)}
                    className="text-xs h-7 px-2"
                  >
                    Create
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}