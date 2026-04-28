import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { PET_TYPES, PET_EMOJIS, PET_TO_CHESS_NAME } from '@/lib/pawSpellConstants';
import { Wand2, ShoppingBag, Sparkles, Check } from 'lucide-react';

const PET_OPTIONS = Object.values(PET_TYPES);

export default function SkinShopPanel({ pawProfile, onBack, onProfileUpdate }) {
  const [skins, setSkins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('browse'); // 'browse' | 'generate'
  const [genPetType, setGenPetType] = useState(PET_TYPES.SPRITE);
  const [genPrompt, setGenPrompt] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState(null);

  useEffect(() => {
    loadSkins();
  }, []);

  const loadSkins = async () => {
    setLoading(true);
    const all = await base44.entities.PawSpellSkin.filter({ isPublic: true });
    setSkins(all);
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    if (pawProfile.tokens < 30) { alert('Not enough tokens! You need 30 tokens to generate a skin.'); return; }
    setGenLoading(true);
    try {
      const fullPrompt = `Dark fantasy pet skin for a chess game creature called "${PET_TO_CHESS_NAME[genPetType]}". Style: ${genPrompt}. Cute creature illustration, glowing magical aura, dark background, vibrant colors, game art style.`;
      const res = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
      setGenResult({ imageUrl: res.url, petType: genPetType, prompt: genPrompt });
      // Deduct tokens
      await base44.entities.PawSpellProfile.update(pawProfile.id, {
        tokens: (pawProfile.tokens || 100) - 30
      });
      onProfileUpdate({ ...pawProfile, tokens: (pawProfile.tokens || 100) - 30 });
    } catch (e) {
      alert('Generation failed. Try again!');
    }
    setGenLoading(false);
  };

  const handleSaveSkin = async () => {
    if (!genResult) return;
    const skinName = prompt('Name your skin:', `${genResult.prompt} ${PET_TO_CHESS_NAME[genResult.petType]}`);
    if (!skinName) return;
    const skin = await base44.entities.PawSpellSkin.create({
      name: skinName,
      petType: genResult.petType,
      imageUrl: genResult.imageUrl,
      prompt: genResult.prompt,
      createdByProfileId: pawProfile.profileId,
      createdByUsername: pawProfile.username,
      price: 50,
      isPublic: true,
    });
    // Add to owned skins
    const newOwned = [...(pawProfile.ownedSkinIds || []), skin.id];
    await base44.entities.PawSpellProfile.update(pawProfile.id, { ownedSkinIds: newOwned });
    onProfileUpdate({ ...pawProfile, ownedSkinIds: newOwned });
    setGenResult(null);
    setTab('browse');
    await loadSkins();
    alert('Skin saved to your collection!');
  };

  const handleEquip = async (skin) => {
    const current = pawProfile.equippedSkins || {};
    const newEquipped = { ...current, [skin.petType]: skin.id };
    await base44.entities.PawSpellProfile.update(pawProfile.id, { equippedSkins: newEquipped });
    onProfileUpdate({ ...pawProfile, equippedSkins: newEquipped });
    alert(`Equipped "${skin.name}" for ${PET_TO_CHESS_NAME[skin.petType]}!`);
  };

  const handleBuy = async (skin) => {
    if ((pawProfile.tokens || 0) < skin.price) { alert(`Not enough tokens! Need ${skin.price}.`); return; }
    const newOwned = [...(pawProfile.ownedSkinIds || []), skin.id];
    const newTokens = (pawProfile.tokens || 0) - skin.price;
    await base44.entities.PawSpellProfile.update(pawProfile.id, { ownedSkinIds: newOwned, tokens: newTokens });
    onProfileUpdate({ ...pawProfile, ownedSkinIds: newOwned, tokens: newTokens });
    alert(`Purchased "${skin.name}"!`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="text-purple-400 hover:text-purple-200 text-sm">← Back</button>
        <h2 className="text-lg font-bold text-purple-200 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" /> Skin Shop
        </h2>
        <span className="ml-auto text-sm text-yellow-300 font-bold">🪙 {pawProfile.tokens || 0}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['browse', 'generate'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${tab === t ? 'bg-purple-700 text-white' : 'bg-purple-900/40 text-purple-400 hover:text-purple-200'}`}>
            {t === 'browse' ? '🛒 Browse' : '✨ Generate (30 🪙)'}
          </button>
        ))}
      </div>

      {tab === 'browse' && (
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full" /></div>
          ) : skins.length === 0 ? (
            <div className="text-center py-8 text-purple-400">No skins yet. Generate the first one!</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {skins.map(skin => {
                const owned = (pawProfile.ownedSkinIds || []).includes(skin.id);
                const equipped = pawProfile.equippedSkins?.[skin.petType] === skin.id;
                return (
                  <div key={skin.id} className="bg-purple-950/50 border border-purple-800 rounded-xl overflow-hidden">
                    <img src={skin.imageUrl} alt={skin.name} className="w-full h-28 object-cover" />
                    <div className="p-2">
                      <p className="text-purple-200 text-xs font-bold truncate">{skin.name}</p>
                      <p className="text-purple-400 text-xs">{PET_EMOJIS[skin.petType]} {PET_TO_CHESS_NAME[skin.petType]}</p>
                      <div className="mt-2">
                        {equipped ? (
                          <span className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Equipped</span>
                        ) : owned ? (
                          <Button size="sm" onClick={() => handleEquip(skin)} className="h-6 text-xs bg-purple-700 hover:bg-purple-600 w-full">Equip</Button>
                        ) : (
                          <Button size="sm" onClick={() => handleBuy(skin)} className="h-6 text-xs bg-yellow-700 hover:bg-yellow-600 w-full">Buy {skin.price} 🪙</Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'generate' && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-purple-300 text-sm mb-2">Choose pet type:</p>
            <div className="grid grid-cols-3 gap-2">
              {PET_OPTIONS.map(pt => (
                <button key={pt} onClick={() => setGenPetType(pt)}
                  className={`p-2 rounded-xl text-center text-xs border transition-colors ${genPetType === pt ? 'bg-purple-700 border-purple-400 text-white' : 'bg-purple-950/40 border-purple-800 text-purple-400 hover:border-purple-600'}`}>
                  <div className="text-xl mb-1">{PET_EMOJIS[pt]}</div>
                  <div>{PET_TO_CHESS_NAME[pt]?.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-purple-300 text-sm mb-2">Describe your skin:</p>
            <Input
              value={genPrompt}
              onChange={e => setGenPrompt(e.target.value)}
              placeholder="e.g. golden fire wings, crystal armor, shadow mist..."
              className="bg-slate-900 border-purple-700 text-purple-200 placeholder:text-purple-600"
            />
          </div>
          <Button onClick={handleGenerate} disabled={genLoading || !genPrompt.trim()} className="bg-purple-700 hover:bg-purple-600 gap-2">
            <Wand2 className="w-4 h-4" />
            {genLoading ? 'Generating...' : 'Generate Skin (30 🪙)'}
          </Button>
          {genResult && (
            <div className="border border-purple-600 rounded-xl overflow-hidden">
              <img src={genResult.imageUrl} alt="Generated skin" className="w-full h-40 object-cover" />
              <div className="p-3 flex gap-2">
                <Button onClick={handleSaveSkin} className="flex-1 bg-green-700 hover:bg-green-600 text-sm">Save to Collection</Button>
                <Button variant="outline" onClick={() => setGenResult(null)} className="text-purple-400 border-purple-700 text-sm">Discard</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}