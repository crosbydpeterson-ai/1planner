import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { PET_TYPES, PET_EMOJIS, PET_TO_CHESS_NAME } from '@/lib/pawSpellConstants';
import { Wand2, ShoppingBag, Sparkles, Check, Layers } from 'lucide-react';

const PET_OPTIONS = Object.values(PET_TYPES);

export default function SkinShopPanel({ pawProfile, onBack, onProfileUpdate }) {
  const [skins, setSkins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('browse'); // 'browse' | 'generate' | 'fullset'

  // Single skin generation
  const [genPetType, setGenPetType] = useState(PET_TYPES.SPRITE);
  const [genPrompt, setGenPrompt] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState(null);

  // Full set generation
  const [setPrompt, setSetPrompt] = useState('');
  const [setGenLoading, setSetGenLoading] = useState(false);
  const [setProgress, setSetProgress] = useState([]); // [{petType, label, done, imageUrl}]
  const [setResults, setSetResults] = useState(null); // final array of {petType, imageUrl}

  useEffect(() => { loadSkins(); }, []);

  const loadSkins = async () => {
    setLoading(true);
    const all = await base44.entities.PawSpellSkin.filter({ isPublic: true });
    setSkins(all);
    setLoading(false);
  };

  // --- Single skin ---
  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    if ((pawProfile.tokens || 0) < 30) { alert('Not enough tokens! You need 30 tokens to generate a skin.'); return; }
    setGenLoading(true);
    try {
      const fullPrompt = `Dark fantasy pet skin for a chess game creature called "${PET_TO_CHESS_NAME[genPetType]}". Style: ${genPrompt}. Cute creature illustration, glowing magical aura, dark background, vibrant colors, game art style.`;
      const res = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
      setGenResult({ imageUrl: res.url, petType: genPetType, prompt: genPrompt });
      const newTokens = (pawProfile.tokens || 100) - 30;
      await base44.entities.PawSpellProfile.update(pawProfile.id, { tokens: newTokens });
      onProfileUpdate({ ...pawProfile, tokens: newTokens });
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
    const newOwned = [...(pawProfile.ownedSkinIds || []), skin.id];
    await base44.entities.PawSpellProfile.update(pawProfile.id, { ownedSkinIds: newOwned });
    onProfileUpdate({ ...pawProfile, ownedSkinIds: newOwned });
    setGenResult(null);
    setTab('browse');
    await loadSkins();
    alert('Skin saved to your collection!');
  };

  // --- Full set generation (all 6 pieces, one style, 75 tokens) ---
  const handleGenerateSet = async () => {
    if (!setPrompt.trim()) return;
    if ((pawProfile.tokens || 0) < 75) { alert('Not enough tokens! You need 75 tokens to generate a full set.'); return; }

    setSetGenLoading(true);
    setSetResults(null);

    // Deduct tokens upfront
    const newTokens = (pawProfile.tokens || 0) - 75;
    await base44.entities.PawSpellProfile.update(pawProfile.id, { tokens: newTokens });
    onProfileUpdate({ ...pawProfile, tokens: newTokens });

    const pieces = PET_OPTIONS.map(pt => ({ petType: pt, label: PET_TO_CHESS_NAME[pt], done: false, imageUrl: null }));
    setSetProgress(pieces.map(p => ({ ...p })));

    const results = [];
    for (let i = 0; i < pieces.length; i++) {
      const pt = pieces[i].petType;
      const label = pieces[i].label;
      try {
        const prompt = `Dark fantasy pet skin for a chess game creature called "${label}". Style: ${setPrompt}. Cute creature illustration, glowing magical aura, dark background, vibrant colors, game art style. Consistent art style with matching theme.`;
        const res = await base44.integrations.Core.GenerateImage({ prompt });
        results.push({ petType: pt, imageUrl: res.url });
        setSetProgress(prev => prev.map((p, idx) => idx === i ? { ...p, done: true, imageUrl: res.url } : p));
      } catch (e) {
        results.push({ petType: pt, imageUrl: null });
        setSetProgress(prev => prev.map((p, idx) => idx === i ? { ...p, done: true, imageUrl: null, error: true } : p));
      }
    }

    setSetResults(results);
    setSetGenLoading(false);
  };

  const handleSaveSet = async () => {
    if (!setResults) return;
    const setName = prompt('Name your skin set:', setPrompt);
    if (!setName) return;

    const newOwnedIds = [];
    for (const r of setResults) {
      if (!r.imageUrl) continue;
      const skin = await base44.entities.PawSpellSkin.create({
        name: `${setName} — ${PET_TO_CHESS_NAME[r.petType]}`,
        petType: r.petType,
        imageUrl: r.imageUrl,
        prompt: setPrompt,
        createdByProfileId: pawProfile.profileId,
        createdByUsername: pawProfile.username,
        price: 75,
        isPublic: true,
      });
      newOwnedIds.push(skin.id);
    }

    // Auto-equip the full set
    const newEquipped = { ...(pawProfile.equippedSkins || {}) };
    setResults.forEach((r, i) => { if (r.imageUrl) newEquipped[r.petType] = newOwnedIds[i]; });

    const newOwned = [...(pawProfile.ownedSkinIds || []), ...newOwnedIds];
    await base44.entities.PawSpellProfile.update(pawProfile.id, { ownedSkinIds: newOwned, equippedSkins: newEquipped });
    onProfileUpdate({ ...pawProfile, ownedSkinIds: newOwned, equippedSkins: newEquipped });

    setSetResults(null);
    setSetProgress([]);
    setSetPrompt('');
    setTab('browse');
    await loadSkins();
    alert('Full set saved & auto-equipped! 🎉');
  };

  // --- Buy / Equip ---
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
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setTab('browse')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${tab === 'browse' ? 'bg-purple-700 text-white' : 'bg-purple-900/40 text-purple-400 hover:text-purple-200'}`}>
          🛒 Browse
        </button>
        <button onClick={() => setTab('generate')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${tab === 'generate' ? 'bg-purple-700 text-white' : 'bg-purple-900/40 text-purple-400 hover:text-purple-200'}`}>
          ✨ Single (30 🪙)
        </button>
        <button onClick={() => setTab('fullset')}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${tab === 'fullset' ? 'bg-amber-700 text-white' : 'bg-amber-900/30 text-amber-400 hover:text-amber-200'}`}>
          👑 Full Set (75 🪙)
        </button>
      </div>

      {/* BROWSE */}
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

      {/* SINGLE GENERATE */}
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

      {/* FULL SET GENERATE */}
      {tab === 'fullset' && (
        <div className="flex flex-col gap-4">
          <div className="bg-amber-950/30 border border-amber-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-amber-400" />
              <p className="text-amber-300 font-bold text-sm">Full Set Generator</p>
            </div>
            <p className="text-amber-400/80 text-xs">One prompt → 6 matching skins for every piece (Sprite, Golem, Gryphon, Wisp, Dragon, Unicorn). Auto-equipped after saving.</p>
          </div>

          <div>
            <p className="text-purple-300 text-sm mb-2">Describe the set theme:</p>
            <Input
              value={setPrompt}
              onChange={e => setSetPrompt(e.target.value)}
              placeholder="e.g. galaxy void armor, neon cyberpunk, cherry blossom spirits..."
              className="bg-slate-900 border-amber-700 text-purple-200 placeholder:text-purple-600"
              disabled={setLoading}
            />
          </div>

          {!setGenLoading && !setResults && (
            <Button
              onClick={handleGenerateSet}
              disabled={!setPrompt.trim() || (pawProfile.tokens || 0) < 75}
              className="bg-amber-700 hover:bg-amber-600 gap-2 h-12 text-base"
            >
              <Sparkles className="w-5 h-5" />
              Generate Full Set (75 🪙)
            </Button>
          )}

          {/* Progress during generation */}
          {(setGenLoading || setResults) && setProgress.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-purple-300 text-sm font-medium">
                {setGenLoading ? 'Generating your set...' : 'Set ready! Preview below:'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {setProgress.map((p) => (
                  <div key={p.petType} className="bg-purple-950/50 border border-purple-800 rounded-xl overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.label} className="w-full h-20 object-cover" />
                    ) : (
                      <div className="w-full h-20 flex items-center justify-center bg-purple-950">
                        {p.done
                          ? <span className="text-red-400 text-xs">Failed</span>
                          : <div className="animate-spin w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full" />
                        }
                      </div>
                    )}
                    <div className="p-1.5 text-center">
                      <p className="text-xs text-purple-300 font-medium truncate">{PET_EMOJIS[p.petType]} {p.label?.split(' ')[0]}</p>
                      {p.done && !p.error && <span className="text-green-400 text-xs">✓</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {setResults && !setGenLoading && (
            <div className="flex gap-2">
              <Button onClick={handleSaveSet} className="flex-1 bg-green-700 hover:bg-green-600 gap-2">
                <Check className="w-4 h-4" /> Save & Equip Set
              </Button>
              <Button variant="outline" onClick={() => { setSetResults(null); setSetProgress([]); }} className="text-purple-400 border-purple-700">
                Discard
              </Button>
            </div>
          )}

          {(pawProfile.tokens || 0) < 75 && !setGenLoading && (
            <p className="text-red-400 text-xs text-center">You need {75 - (pawProfile.tokens || 0)} more tokens</p>
          )}
        </div>
      )}
    </div>
  );
}