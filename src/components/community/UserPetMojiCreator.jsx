import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, Egg } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function UserPetMojiCreator({ open, onClose, profile }) {
  const [mode, setMode] = useState('pet');
  const [eggs, setEggs] = useState([]);
  const [customPets, setCustomPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [action, setAction] = useState('');
  const [freeDescription, setFreeDescription] = useState('');
  const [name, setName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (open && profile) loadData();
  }, [open, profile]);

  const loadData = async () => {
    setLoadingData(true);
    const [userEggs, pets] = await Promise.all([
      base44.entities.MagicEgg.filter({ userId: profile.userId, isUsed: false }),
      base44.entities.CustomPet.list('-created_date'),
    ]);
    setEggs(userEggs);
    setCustomPets(pets);
    setLoadingData(false);
  };

  const ownedPetIds = profile?.unlockedPets || [];

  // Filter to only pets the user owns
  const availablePets = customPets.filter(p => ownedPetIds.includes(`custom_${p.id}`));

  const handleGenerate = async () => {
    if (eggs.length === 0) { toast.error('You need a Magic Egg to create a petmoji!'); return; }

    let prompt = '';
    if (mode === 'pet') {
      if (!selectedPetId) { toast.error('Select a pet first'); return; }
      if (!action.trim()) { toast.error('Describe what the pet is doing'); return; }
      const pet = customPets.find(p => p.id === selectedPetId);
      if (!pet) return;
      prompt = `Create a small square emoji-style sticker of a cute cartoon ${pet.name} character ${action.trim()}. The character should match this description: ${pet.description || pet.name}. Style: kawaii emoji sticker, transparent background feel, vibrant colors, simple clean design, expressive face, chibi proportions. Make it look like a chat reaction emoji.`;
      if (!name) setName(`${pet.name} ${action.trim().slice(0, 20)}`);
    } else {
      if (!freeDescription.trim()) { toast.error('Describe the petmoji'); return; }
      prompt = `Create a small square emoji-style sticker: ${freeDescription.trim()}. Style: kawaii emoji sticker, transparent background feel, vibrant colors, simple clean design, expressive face, chibi proportions. Make it look like a chat reaction emoji.`;
      if (!name) setName(freeDescription.trim().slice(0, 30));
    }

    setGenerating(true);
    setPreviewUrl(null);
    const result = await base44.integrations.Core.GenerateImage({ prompt });
    setPreviewUrl(result.url);
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!previewUrl || !name.trim()) { toast.error('Generate an image and give it a name'); return; }
    if (eggs.length === 0) { toast.error('No magic egg available!'); return; }

    setSaving(true);
    // Consume the egg
    const egg = eggs[0];
    await base44.entities.MagicEgg.update(egg.id, {
      isUsed: true,
      hatchedByProfileId: profile.id,
      hatchedByUsername: profile.username,
    });

    const pet = mode === 'pet' ? customPets.find(p => p.id === selectedPetId) : null;
    await base44.entities.PetMoji.create({
      name: name.trim(),
      description: mode === 'pet' ? `${pet?.name || ''} ${action}` : freeDescription,
      imageUrl: previewUrl,
      basePetId: pet?.id || '',
      basePetName: pet?.name || '',
      isActive: true,
    });

    // Remove used egg from local state
    setEggs(eggs.filter(e => e.id !== egg.id));
    setPreviewUrl(null);
    setName('');
    setAction('');
    setFreeDescription('');
    setSelectedPetId('');
    setSaving(false);
    toast.success('🎉 Petmoji created! It\'s now available for everyone!');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-[#313338] border-[#1e1f22] text-[#dbdee1]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-2xl">🥚✨</span> Create a Petmoji
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-[#5865f2] mx-auto" /></div>
        ) : eggs.length === 0 ? (
          <div className="py-8 text-center space-y-3">
            <Egg className="w-12 h-12 text-[#6d6f78] mx-auto" />
            <p className="text-[#949ba4] text-sm">You need a <span className="text-amber-400 font-semibold">Magic Egg</span> to create a petmoji.</p>
            <p className="text-[#6d6f78] text-xs">Get one from the shop, events, or admin gifts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Egg count */}
            <div className="bg-[#2b2d31] rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-lg">🥚</span>
              <span className="text-sm text-[#dbdee1]">You have <span className="text-amber-400 font-bold">{eggs.length}</span> Magic Egg{eggs.length > 1 ? 's' : ''}</span>
              <span className="text-[10px] text-[#6d6f78] ml-auto">Costs 1 egg</span>
            </div>

            {/* Mode */}
            <div className="flex gap-2">
              <Button size="sm" variant={mode === 'pet' ? 'default' : 'outline'}
                onClick={() => setMode('pet')}
                className={mode === 'pet' ? 'bg-[#5865f2]' : 'border-[#3f4147] text-[#dbdee1] hover:bg-[#35373c]'}
              >🐾 From My Pet</Button>
              <Button size="sm" variant={mode === 'describe' ? 'default' : 'outline'}
                onClick={() => setMode('describe')}
                className={mode === 'describe' ? 'bg-[#5865f2]' : 'border-[#3f4147] text-[#dbdee1] hover:bg-[#35373c]'}
              >✏️ Describe</Button>
            </div>

            {mode === 'pet' && (
              <div className="space-y-3">
                <div>
                  <Label className="text-[#949ba4] text-xs">Select Your Pet</Label>
                  <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                    <SelectTrigger className="bg-[#1e1f22] border-[#1e1f22] text-white">
                      <SelectValue placeholder="Choose a pet..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2b2d31] border-[#1e1f22]">
                      {availablePets.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-[#dbdee1] focus:bg-[#5865f2] focus:text-white">
                          {p.emoji || '🐾'} {p.name}
                        </SelectItem>
                      ))}
                      {availablePets.length === 0 && (
                        <div className="px-3 py-2 text-xs text-[#6d6f78]">No custom pets unlocked</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#949ba4] text-xs">What is the pet doing?</Label>
                  <Input
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    placeholder="e.g. giving a thumbs up, crying, dancing..."
                    className="bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-[#6d6f78]"
                  />
                </div>
              </div>
            )}

            {mode === 'describe' && (
              <div>
                <Label className="text-[#949ba4] text-xs">Describe your petmoji</Label>
                <Textarea
                  value={freeDescription}
                  onChange={(e) => setFreeDescription(e.target.value)}
                  placeholder="e.g. A tiny dragon blowing fire hearts..."
                  className="bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-[#6d6f78] min-h-[60px]"
                />
              </div>
            )}

            <div>
              <Label className="text-[#949ba4] text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Petmoji name"
                className="bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-[#6d6f78]"
              />
            </div>

            <Button onClick={handleGenerate} disabled={generating} className="w-full bg-[#5865f2] hover:bg-[#4752c4]">
              {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Wand2 className="w-4 h-4 mr-2" />Generate Preview</>}
            </Button>

            {previewUrl && (
              <div className="bg-[#2b2d31] rounded-xl p-4 space-y-3 text-center">
                <img src={previewUrl} alt="Preview" className="w-28 h-28 rounded-xl object-cover mx-auto" />
                <div className="flex gap-2">
                  <Button onClick={handleGenerate} disabled={generating} variant="outline" className="flex-1 border-[#3f4147] text-[#dbdee1] hover:bg-[#35373c]">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔄 Retry'}
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '🥚 Use Egg & Save'}
                  </Button>
                </div>
                <p className="text-[10px] text-[#6d6f78]">This will use 1 Magic Egg</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}