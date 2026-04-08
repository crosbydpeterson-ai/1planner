import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, Wand2, Download, Loader2, ScrollText, RefreshCw, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function LoreComicPanel() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingLore, setGeneratingLore] = useState(null); // petId
  const [generatingImage, setGeneratingImage] = useState(null); // petId
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [conversation, setConversation] = useState(null);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    setLoading(true);
    const all = await base44.entities.CustomPet.list('-created_date', 200);
    setPets(all);
    setLoading(false);
  };

  const generateLoreForPet = async (pet, sharedConv) => {
    setGeneratingLore(pet.id);
    try {
      let conv = sharedConv || conversation;
      if (!conv) {
        conv = await base44.agents.createConversation({
          agent_name: 'loreMaster',
          metadata: { name: 'Lore Generation Session' },
        });
        setConversation(conv);
      }

      await base44.agents.addMessage(conv, {
        role: 'user',
        content: `Generate lore for this pet and save it:\n\nName: ${pet.name}\nRarity: ${pet.rarity}\nDescription: ${pet.description || 'No description provided'}\nEmoji: ${pet.emoji || 'none'}\nPet ID: ${pet.id}\n\nWrite connected lore for this pet and update the CustomPet record.`,
      });

      // Poll for completion (wait up to 30s)
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const updated = await base44.entities.CustomPet.filter({ id: pet.id });
        if (updated[0]?.lore && updated[0].lore !== pet.lore) break;
      }

      await loadPets();
    } catch (e) {
      toast.error(`Failed lore for ${pet.name}: ` + e.message);
    }
    setGeneratingLore(null);
  };

  const generateAllLore = async () => {
    const noLore = pets.filter(p => !p.lore);
    if (noLore.length === 0) return;

    const conv = await base44.agents.createConversation({
      agent_name: 'loreMaster',
      metadata: { name: 'Bulk Lore Generation' },
    });
    setConversation(conv);

    toast.info(`Generating lore for ${noLore.length} pets in parallel...`);
    await Promise.all(noLore.map(pet => generateLoreForPet(pet, conv)));
    toast.success(`Done! Lore generated for ${noLore.length} pets.`);
    await loadPets();
  };

  const generateImageForPet = async (pet, sharedConv) => {
    setGeneratingImage(pet.id);
    try {
      let conv = sharedConv || conversation;
      if (!conv) {
        conv = await base44.agents.createConversation({
          agent_name: 'loreMaster',
          metadata: { name: 'Lore Image Session' },
        });
        setConversation(conv);
      }

      await base44.agents.addMessage(conv, {
        role: 'user',
        content: `Generate a lore illustration image for this pet and save it to loreImageUrl:\n\nName: ${pet.name}\nRarity: ${pet.rarity}\nDescription: ${pet.description || 'none'}\nLore: ${pet.lore || 'none'}\nTheme colors: ${JSON.stringify(pet.theme || {})}\nPet ID: ${pet.id}\n\nCreate an image prompt based on the pet's lore and theme, generate the image using Core.GenerateImage, then save the URL to the CustomPet record's loreImageUrl field and set loreImageGeneratedAt to now.`,
      });

      // Poll for loreImageUrl (up to 60s — image gen takes longer)
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const updated = await base44.entities.CustomPet.filter({ id: pet.id });
        if (updated[0]?.loreImageUrl && updated[0].loreImageUrl !== pet.loreImageUrl) break;
      }

      await loadPets();
    } catch (e) {
      toast.error(`Failed image for ${pet.name}: ` + e.message);
    }
    setGeneratingImage(null);
  };

  const generateAllImages = async () => {
    const noImage = pets.filter(p => p.lore && !p.loreImageUrl);
    if (noImage.length === 0) return;

    const conv = await base44.agents.createConversation({
      agent_name: 'loreMaster',
      metadata: { name: 'Bulk Lore Image Generation' },
    });
    setConversation(conv);

    toast.info(`Generating lore images for ${noImage.length} pets in parallel...`);
    await Promise.all(noImage.map(pet => generateImageForPet(pet, conv)));
    toast.success(`Done! Lore images generated for ${noImage.length} pets.`);
    await loadPets();
  };

  const downloadComic = async () => {
    setDownloadingPdf(true);
    try {
      const response = await base44.functions.invoke('generateLoreComic', {});
      // The response is binary PDF — open via blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pet-lore-comic.pdf';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Comic PDF downloaded!');
    } catch (e) {
      toast.error('Failed to generate PDF: ' + e.message);
    }
    setDownloadingPdf(false);
  };

  const rarityColor = {
    common: 'bg-slate-500',
    uncommon: 'bg-green-600',
    rare: 'bg-blue-600',
    epic: 'bg-purple-600',
    legendary: 'bg-yellow-500',
  };

  const withLore = pets.filter(p => p.lore);
  const withoutLore = pets.filter(p => !p.lore);
  const withImage = pets.filter(p => p.loreImageUrl);
  const loreButNoImage = pets.filter(p => p.lore && !p.loreImageUrl);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-5 border border-indigo-700">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-6 h-6 text-yellow-400" />
          <h2 className="text-xl font-bold text-white">The Lore Comic</h2>
        </div>
        <p className="text-indigo-300 text-sm mb-4">
          Generate interconnected lore for all pets — all rooted in <span className="text-yellow-300 font-semibold">The Great Wifi Incident</span>. Then export as a comic-style PDF.
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="bg-indigo-800/60 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-white">{pets.length}</div>
            <div className="text-xs text-indigo-300">Total Pets</div>
          </div>
          <div className="bg-green-800/60 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-green-300">{withLore.length}</div>
            <div className="text-xs text-green-400">Have Lore</div>
          </div>
          <div className="bg-red-800/60 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-red-300">{withoutLore.length}</div>
            <div className="text-xs text-red-400">Need Lore</div>
          </div>
          <div className="bg-blue-800/60 rounded-lg px-4 py-2 text-center">
            <div className="text-2xl font-bold text-blue-300">{withImage.length}</div>
            <div className="text-xs text-blue-400">Lore Art</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={downloadComic}
          disabled={downloadingPdf || withLore.length === 0}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
        >
          {downloadingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Download Lore Comic PDF
        </Button>
        {withoutLore.length > 0 && (
          <Button
            onClick={generateAllLore}
            disabled={generatingLore !== null || generatingImage !== null}
            className="bg-purple-600 hover:bg-purple-500"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate All Missing Lore ({withoutLore.length})
          </Button>
        )}
        {loreButNoImage.length > 0 && (
          <Button
            onClick={generateAllImages}
            disabled={generatingLore !== null || generatingImage !== null}
            className="bg-blue-600 hover:bg-blue-500"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Generate All Lore Art ({loreButNoImage.length})
          </Button>
        )}
        <Button variant="outline" onClick={loadPets} className="border-slate-600 text-slate-300">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Pet list */}
      <div className="space-y-3">
        {pets.map(pet => (
          <div key={pet.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Show lore art if available, else pet image */}
                {(pet.loreImageUrl || pet.imageUrl) ? (
                  <div className="relative flex-shrink-0">
                    <img src={pet.loreImageUrl || pet.imageUrl} alt={pet.name} className="w-12 h-12 rounded-lg object-cover" />
                    {pet.loreImageUrl && (
                      <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[8px] px-1 rounded">ART</span>
                    )}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-2xl flex-shrink-0">
                    {pet.emoji || '🐾'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold">{pet.name}</span>
                    <Badge className={`${rarityColor[pet.rarity]} text-white text-xs`}>{pet.rarity}</Badge>
                    {pet.lore ? (
                      <Badge className="bg-green-700 text-green-100 text-xs">✓ Lore</Badge>
                    ) : (
                      <Badge className="bg-red-800 text-red-200 text-xs">No Lore</Badge>
                    )}
                    {pet.loreImageUrl && (
                      <Badge className="bg-blue-700 text-blue-100 text-xs">🎨 Art</Badge>
                    )}
                  </div>
                  {pet.lore && (
                    <p className="text-slate-400 text-xs mt-1 line-clamp-2">{pet.lore}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => generateLoreForPet(pet)}
                  disabled={generatingLore !== null || generatingImage !== null}
                  className={pet.lore ? 'bg-slate-600 hover:bg-slate-500' : 'bg-purple-600 hover:bg-purple-500'}
                >
                  {generatingLore === pet.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ScrollText className="w-4 h-4" />
                  )}
                </Button>
                {pet.lore && (
                  <Button
                    size="sm"
                    onClick={() => generateImageForPet(pet)}
                    disabled={generatingLore !== null || generatingImage !== null}
                    className={pet.loreImageUrl ? 'bg-slate-600 hover:bg-slate-500' : 'bg-blue-600 hover:bg-blue-500'}
                    title={pet.loreImageUrl ? 'Regenerate lore art' : 'Generate lore art'}
                  >
                    {generatingImage === pet.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImageIcon className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}