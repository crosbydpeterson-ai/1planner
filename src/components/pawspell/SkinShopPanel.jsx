import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { PET_TYPES, PET_EMOJIS, PET_TO_CHESS_NAME } from '@/lib/pawSpellConstants';
import { Wand2, ShoppingBag, Sparkles, Check, Layers, Tag, Package } from 'lucide-react';

const PET_OPTIONS = Object.values(PET_TYPES);

export default function SkinShopPanel({ pawProfile, onBack, onProfileUpdate }) {
  const [tab, setTab] = useState('shop'); // 'shop' | 'generate' | 'fullset' | 'collection'

  // Marketplace / browse
  const [shopSkins, setShopSkins] = useState([]);
  const [shopLoading, setShopLoading] = useState(true);

  // Collection
  const [ownedSkins, setOwnedSkins] = useState([]);
  const [petSkins, setPetSkins] = useState([]); // derived from CustomPets
  const [collectionLoading, setCollectionLoading] = useState(true);
  const [listingId, setListingId] = useState(null);
  const [listingPrice, setListingPrice] = useState('50');

  // Single skin generation
  const [genPetType, setGenPetType] = useState(PET_TYPES.SPRITE);
  const [genPrompt, setGenPrompt] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState(null);

  // Full set generation
  const [setPrompt, setSetPrompt] = useState('');
  const [fullSetLoading, setFullSetLoading] = useState(false);
  const [setProgress, setSetProgress] = useState([]);
  const [setResults, setSetResults] = useState(null);

  useEffect(() => {
    loadShop();
    loadCollection();
  }, []);

  // ── SHOP ──────────────────────────────────────────────────────────────────
  const loadShop = async () => {
    setShopLoading(true);
    const listed = await base44.entities.PawSpellSkin.filter({ isListed: true });
    // Don't show user's own skins in shop (they list/delist from collection)
    setShopSkins(listed.filter(s => s.createdByProfileId !== pawProfile.profileId));
    setShopLoading(false);
  };

  const handleBuy = async (skin) => {
    const price = skin.listedPrice || skin.price || 50;
    if ((pawProfile.tokens || 0) < price) { alert(`Not enough tokens! Need ${price} 🪙`); return; }
    const newOwned = [...(pawProfile.ownedSkinIds || []), skin.id];
    const newTokens = (pawProfile.tokens || 0) - price;
    // Credit the seller
    const sellerProfiles = await base44.entities.PawSpellProfile.filter({ profileId: skin.createdByProfileId });
    if (sellerProfiles[0]) {
      await base44.entities.PawSpellProfile.update(sellerProfiles[0].id, {
        tokens: (sellerProfiles[0].tokens || 0) + price,
      });
    }
    await base44.entities.PawSpellProfile.update(pawProfile.id, { ownedSkinIds: newOwned, tokens: newTokens });
    onProfileUpdate({ ...pawProfile, ownedSkinIds: newOwned, tokens: newTokens });
    setShopSkins(prev => prev.filter(s => s.id !== skin.id));
    // Delist after purchase
    await base44.entities.PawSpellSkin.update(skin.id, { isListed: false });
    alert(`Purchased "${skin.name}"! 🎉`);
    loadCollection();
  };

  // ── COLLECTION ────────────────────────────────────────────────────────────
  const loadCollection = async () => {
    setCollectionLoading(true);
    const ownedIds = pawProfile.ownedSkinIds || [];
    if (ownedIds.length > 0) {
      const all = await base44.entities.PawSpellSkin.filter({});
      setOwnedSkins(all.filter(s => ownedIds.includes(s.id)));
    } else {
      setOwnedSkins([]);
    }
    // Load pets as usable skins
    const profileId = pawProfile.profileId;
    const userProfile = await base44.entities.UserProfile.filter({ id: profileId });
    const unlockedPetIds = userProfile[0]?.unlockedPets || [];
    if (unlockedPetIds.length > 0) {
      const allPets = await base44.entities.CustomPet.filter({});
      const myPets = allPets.filter(p =>
        unlockedPetIds.includes('custom_' + p.id) || unlockedPetIds.includes(p.id)
      );
      setPetSkins(myPets.filter(p => p.imageUrl));
    } else {
      setPetSkins([]);
    }
    setCollectionLoading(false);
  };

  const handleEquipSkin = async (skin) => {
    const current = pawProfile.equippedSkins || {};
    const newEquipped = { ...current, [skin.petType]: skin.id };
    await base44.entities.PawSpellProfile.update(pawProfile.id, { equippedSkins: newEquipped });
    onProfileUpdate({ ...pawProfile, equippedSkins: newEquipped });
  };

  const handleEquipPetAsSkin = async (pet, petType) => {
    // Use pet image URL directly as a pseudo-skin key prefixed with "pet_"
    const pseudoId = 'pet_' + pet.id;
    const current = pawProfile.equippedSkins || {};
    const newEquipped = { ...current, [petType]: pseudoId };
    // Store the imageUrl mapping in a separate field so the game can look it up
    const petSkinMap = { ...(pawProfile.petSkinMap || {}), [pseudoId]: pet.imageUrl };
    await base44.entities.PawSpellProfile.update(pawProfile.id, { equippedSkins: newEquipped, petSkinMap });
    onProfileUpdate({ ...pawProfile, equippedSkins: newEquipped, petSkinMap });
    alert(`${pet.emoji || '🐾'} ${pet.name} equipped as ${PET_TO_CHESS_NAME[petType]}!`);
  };

  const handleUnequip = async (petType) => {
    const current = { ...(pawProfile.equippedSkins || {}) };
    delete current[petType];
    await base44.entities.PawSpellProfile.update(pawProfile.id, { equippedSkins: current });
    onProfileUpdate({ ...pawProfile, equippedSkins: current });
  };

  const handleListForSale = async (skin) => {
    const price = parseInt(listingPrice, 10);
    if (!price || price < 1) { alert('Enter a valid price'); return; }
    await base44.entities.PawSpellSkin.update(skin.id, { isListed: true, listedPrice: price, isPublic: true });
    setListingId(null);
    loadCollection();
    loadShop();
    alert(`Listed "${skin.name}" for ${price} 🪙!`);
  };

  const handleDelist = async (skin) => {
    await base44.entities.PawSpellSkin.update(skin.id, { isListed: false });
    loadCollection();
    loadShop();
  };

  // ── GENERATE SINGLE ───────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    if ((pawProfile.tokens || 0) < 30) { alert('Not enough tokens! You need 30 🪙'); return; }
    setGenLoading(true);
    const fullPrompt = `Dark fantasy pet skin for a chess game creature called "${PET_TO_CHESS_NAME[genPetType]}". Style: ${genPrompt}. Cute creature illustration, glowing magical aura, dark background, vibrant colors, game art style.`;
    const res = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
    setGenResult({ imageUrl: res.url, petType: genPetType, prompt: genPrompt });
    const newTokens = (pawProfile.tokens || 100) - 30;
    await base44.entities.PawSpellProfile.update(pawProfile.id, { tokens: newTokens });
    onProfileUpdate({ ...pawProfile, tokens: newTokens });
    setGenLoading(false);
  };

  const handleSaveSkin = async () => {
    if (!genResult) return;
    const skinName = prompt('Name your skin:', `${genResult.prompt} ${PET_TO_CHESS_NAME[genResult.petType]}`);
    if (!skinName) return;
    const skin = await base44.entities.PawSpellSkin.create({
      name: skinName, petType: genResult.petType, imageUrl: genResult.imageUrl,
      prompt: genResult.prompt, createdByProfileId: pawProfile.profileId,
      createdByUsername: pawProfile.username, price: 50, isPublic: false,
    });
    const newOwned = [...(pawProfile.ownedSkinIds || []), skin.id];
    await base44.entities.PawSpellProfile.update(pawProfile.id, { ownedSkinIds: newOwned });
    onProfileUpdate({ ...pawProfile, ownedSkinIds: newOwned });
    setGenResult(null);
    setTab('collection');
    loadCollection();
    alert('Skin saved! Equip it from your Collection 🎉');
  };

  // ── GENERATE FULL SET ─────────────────────────────────────────────────────
  const handleGenerateSet = async () => {
    if (!setPrompt.trim()) return;
    if ((pawProfile.tokens || 0) < 75) { alert('Not enough tokens! You need 75 🪙'); return; }
    setFullSetLoading(true);
    setSetResults(null);
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
      } catch {
        results.push({ petType: pt, imageUrl: null });
        setSetProgress(prev => prev.map((p, idx) => idx === i ? { ...p, done: true, error: true } : p));
      }
    }
    setSetResults(results);
    setFullSetLoading(false);
  };

  const handleSaveSet = async () => {
    if (!setResults) return;
    const setName = prompt('Name your skin set:', setPrompt);
    if (!setName) return;
    const newOwnedIds = [];
    for (const r of setResults) {
      if (!r.imageUrl) continue;
      const skin = await base44.entities.PawSpellSkin.create({
        name: `${setName} — ${PET_TO_CHESS_NAME[r.petType]}`, petType: r.petType,
        imageUrl: r.imageUrl, prompt: setPrompt, createdByProfileId: pawProfile.profileId,
        createdByUsername: pawProfile.username, price: 75, isPublic: false,
      });
      newOwnedIds.push(skin.id);
    }
    const newEquipped = { ...(pawProfile.equippedSkins || {}) };
    setResults.forEach((r, i) => { if (r.imageUrl) newEquipped[r.petType] = newOwnedIds[i]; });
    const newOwned = [...(pawProfile.ownedSkinIds || []), ...newOwnedIds];
    await base44.entities.PawSpellProfile.update(pawProfile.id, { ownedSkinIds: newOwned, equippedSkins: newEquipped });
    onProfileUpdate({ ...pawProfile, ownedSkinIds: newOwned, equippedSkins: newEquipped });
    setSetResults(null); setSetProgress([]); setSetPrompt('');
    setTab('collection');
    loadCollection();
    alert('Full set saved & auto-equipped! 🎉');
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
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
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {[
          { key: 'shop', label: '🛒 Shop' },
          { key: 'collection', label: '📦 Collection' },
          { key: 'generate', label: '✨ Generate (30 🪙)' },
          { key: 'fullset', label: '👑 Full Set (75 🪙)' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              tab === t.key
                ? (t.key === 'fullset' ? 'bg-amber-700 text-white' : 'bg-purple-700 text-white')
                : (t.key === 'fullset' ? 'bg-amber-900/30 text-amber-400 hover:text-amber-200' : 'bg-purple-900/40 text-purple-400 hover:text-purple-200')
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── SHOP TAB ── */}
      {tab === 'shop' && (
        <div className="flex-1 overflow-y-auto">
          {shopLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full" /></div>
          ) : shopSkins.length === 0 ? (
            <div className="text-center py-12 text-purple-400 text-sm">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No skins listed for sale yet.</p>
              <p className="text-xs mt-1 text-purple-600">Generate a skin and list it from your Collection!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {shopSkins.map(skin => (
                <div key={skin.id} className="bg-purple-950/50 border border-purple-800 rounded-xl overflow-hidden">
                  <img src={skin.imageUrl} alt={skin.name} className="w-full h-28 object-cover" />
                  <div className="p-2">
                    <p className="text-purple-200 text-xs font-bold truncate">{skin.name}</p>
                    <p className="text-purple-400 text-xs">{PET_EMOJIS[skin.petType]} {PET_TO_CHESS_NAME[skin.petType]}</p>
                    <p className="text-purple-500 text-xs">by {skin.createdByUsername}</p>
                    <Button size="sm" onClick={() => handleBuy(skin)}
                      className="mt-2 h-6 text-xs bg-yellow-700 hover:bg-yellow-600 w-full">
                      Buy {skin.listedPrice || skin.price} 🪙
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── COLLECTION TAB ── */}
      {tab === 'collection' && (
        <div className="flex-1 overflow-y-auto space-y-5">
          {collectionLoading ? (
            <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full" /></div>
          ) : (
            <>
              {/* Currently Equipped */}
              <div>
                <p className="text-purple-300 text-xs font-bold mb-2 uppercase tracking-wider">Currently Equipped</p>
                <div className="grid grid-cols-3 gap-2">
                  {PET_OPTIONS.map(pt => {
                    const eqId = pawProfile.equippedSkins?.[pt];
                    const skin = ownedSkins.find(s => s.id === eqId);
                    const petMap = pawProfile.petSkinMap || {};
                    const petImgUrl = eqId?.startsWith('pet_') ? petMap[eqId] : null;
                    return (
                      <div key={pt} className="bg-purple-950/40 border border-purple-800/50 rounded-xl overflow-hidden">
                        {petImgUrl ? (
                          <img src={petImgUrl} alt={pt} className="w-full h-16 object-cover" />
                        ) : skin ? (
                          <img src={skin.imageUrl} alt={skin.name} className="w-full h-16 object-cover" />
                        ) : (
                          <div className="w-full h-16 flex items-center justify-center text-2xl bg-purple-950">
                            {PET_EMOJIS[pt]}
                          </div>
                        )}
                        <div className="p-1.5 text-center">
                          <p className="text-xs text-purple-300 truncate">{PET_TO_CHESS_NAME[pt]?.split(' ')[0]}</p>
                          {eqId && (
                            <button onClick={() => handleUnequip(pt)} className="text-[10px] text-red-400 hover:text-red-300 mt-0.5">
                              unequip
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pet Skins (from user's unlocked pets) */}
              {petSkins.length > 0 && (
                <div>
                  <p className="text-purple-300 text-xs font-bold mb-1 uppercase tracking-wider">Your Pets as Skins</p>
                  <p className="text-purple-500 text-xs mb-2">Use your unlocked pets as piece images!</p>
                  <div className="grid grid-cols-2 gap-2">
                    {petSkins.map(pet => (
                      <div key={pet.id} className="bg-purple-950/50 border border-purple-800 rounded-xl overflow-hidden">
                        <img src={pet.imageUrl} alt={pet.name} className="w-full h-24 object-cover" />
                        <div className="p-2">
                          <p className="text-purple-200 text-xs font-bold truncate">{pet.emoji || '🐾'} {pet.name}</p>
                          <p className="text-purple-500 text-xs capitalize">{pet.rarity}</p>
                          <div className="mt-1.5">
                            <p className="text-purple-400 text-xs mb-1">Equip as:</p>
                            <div className="grid grid-cols-3 gap-1">
                              {PET_OPTIONS.map(pt => {
                                const isEq = pawProfile.equippedSkins?.[pt] === ('pet_' + pet.id);
                                return (
                                  <button key={pt} onClick={() => handleEquipPetAsSkin(pet, pt)}
                                    className={`text-[10px] px-1 py-0.5 rounded transition-colors ${isEq ? 'bg-green-700 text-white' : 'bg-purple-800/60 text-purple-300 hover:bg-purple-700'}`}>
                                    {isEq ? '✓' : ''} {PET_TO_CHESS_NAME[pt]?.split(' ')[0]}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Skins */}
              <div>
                <p className="text-purple-300 text-xs font-bold mb-2 uppercase tracking-wider">Generated Skins</p>
                {ownedSkins.length === 0 ? (
                  <p className="text-purple-500 text-xs text-center py-4">No generated skins yet. Use Generate to create some!</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {ownedSkins.map(skin => {
                      const equipped = pawProfile.equippedSkins?.[skin.petType] === skin.id;
                      const isMyCreation = skin.createdByProfileId === pawProfile.profileId;
                      const isCurrentlyListed = skin.isListed;
                      return (
                        <div key={skin.id} className="bg-purple-950/50 border border-purple-800 rounded-xl overflow-hidden">
                          <img src={skin.imageUrl} alt={skin.name} className="w-full h-28 object-cover" />
                          <div className="p-2 space-y-1">
                            <p className="text-purple-200 text-xs font-bold truncate">{skin.name}</p>
                            <p className="text-purple-400 text-xs">{PET_EMOJIS[skin.petType]} {PET_TO_CHESS_NAME[skin.petType]}</p>
                            {equipped ? (
                              <span className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Equipped</span>
                            ) : (
                              <Button size="sm" onClick={() => handleEquipSkin(skin)} className="h-6 text-xs bg-purple-700 hover:bg-purple-600 w-full">Equip</Button>
                            )}
                            {/* List/Delist — only for own creations */}
                            {isMyCreation && (
                              isCurrentlyListed ? (
                                <button onClick={() => handleDelist(skin)} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-1">
                                  <Tag className="w-3 h-3" /> Listed {skin.listedPrice} 🪙 — Delist
                                </button>
                              ) : listingId === skin.id ? (
                                <div className="flex gap-1 mt-1">
                                  <Input value={listingPrice} onChange={e => setListingPrice(e.target.value)}
                                    className="h-6 text-xs bg-slate-900 border-purple-700 text-purple-200 px-1 w-16" placeholder="Price" />
                                  <Button size="sm" onClick={() => handleListForSale(skin)} className="h-6 text-xs bg-green-700 hover:bg-green-600 px-2">List</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setListingId(null)} className="h-6 text-xs text-purple-400 px-1">✕</Button>
                                </div>
                              ) : (
                                <button onClick={() => { setListingId(skin.id); setListingPrice('50'); }}
                                  className="text-xs text-purple-400 hover:text-purple-200 flex items-center gap-1 mt-1">
                                  <Tag className="w-3 h-3" /> Sell in Shop
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── GENERATE SINGLE ── */}
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
            <Input value={genPrompt} onChange={e => setGenPrompt(e.target.value)}
              placeholder="e.g. golden fire wings, crystal armor, shadow mist..."
              className="bg-slate-900 border-purple-700 text-purple-200 placeholder:text-purple-600" />
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

      {/* ── FULL SET ── */}
      {tab === 'fullset' && (
        <div className="flex flex-col gap-4">
          <div className="bg-amber-950/30 border border-amber-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="w-5 h-5 text-amber-400" />
              <p className="text-amber-300 font-bold text-sm">Full Set Generator</p>
            </div>
            <p className="text-amber-400/80 text-xs">One prompt → 6 matching skins for every piece. Auto-equipped after saving.</p>
          </div>
          <div>
            <p className="text-purple-300 text-sm mb-2">Describe the set theme:</p>
            <Input value={setPrompt} onChange={e => setSetPrompt(e.target.value)}
              placeholder="e.g. galaxy void armor, neon cyberpunk, cherry blossom spirits..."
              className="bg-slate-900 border-amber-700 text-purple-200 placeholder:text-purple-600"
              disabled={fullSetLoading} />
          </div>
          {!fullSetLoading && !setResults && (
            <Button onClick={handleGenerateSet} disabled={!setPrompt.trim() || (pawProfile.tokens || 0) < 75}
              className="bg-amber-700 hover:bg-amber-600 gap-2 h-12 text-base">
              <Sparkles className="w-5 h-5" /> Generate Full Set (75 🪙)
            </Button>
          )}
          {(fullSetLoading || setResults) && setProgress.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-purple-300 text-sm font-medium">
                {fullSetLoading ? 'Generating your set...' : 'Set ready! Preview below:'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {setProgress.map(p => (
                  <div key={p.petType} className="bg-purple-950/50 border border-purple-800 rounded-xl overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.label} className="w-full h-20 object-cover" />
                    ) : (
                      <div className="w-full h-20 flex items-center justify-center bg-purple-950">
                        {p.done ? <span className="text-red-400 text-xs">Failed</span>
                          : <div className="animate-spin w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full" />}
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
          {setResults && !fullSetLoading && (
            <div className="flex gap-2">
              <Button onClick={handleSaveSet} className="flex-1 bg-green-700 hover:bg-green-600 gap-2">
                <Check className="w-4 h-4" /> Save & Equip Set
              </Button>
              <Button variant="outline" onClick={() => { setSetResults(null); setSetProgress([]); }} className="text-purple-400 border-purple-700">
                Discard
              </Button>
            </div>
          )}
          {(pawProfile.tokens || 0) < 75 && !fullSetLoading && (
            <p className="text-red-400 text-xs text-center">You need {75 - (pawProfile.tokens || 0)} more tokens</p>
          )}
        </div>
      )}
    </div>
  );
}