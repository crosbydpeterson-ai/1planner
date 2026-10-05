import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem, ChevronUp, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EggOpenAnimation from '@/components/eggs/EggOpenAnimation';
import { getEggShopPrice } from '@/lib/lootEggPrice';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const slotLabel = (index, perRow) => {
  const row = Math.floor(index / perRow);
  const col = index % perRow;
  return String.fromCharCode(65 + row) + (col + 1);
};

export default function LootEggVendingMachine({ profile, setProfile }) {
  const [lootEggs, setLootEggs] = useState([]);
  const [customPets, setCustomPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [dispensing, setDispensing] = useState(null); // { egg, drop } while animating
  const [openingEgg, setOpeningEgg] = useState(null);
  const machineRef = useRef(null);

  const loadEggs = useCallback(async () => {
    setError(false);
    setLoading(true);
    try {
      const [allLootEggs, allCustomPets] = await Promise.all([
        base44.entities.LootEgg.filter({ isActive: true, inShop: true }),
        base44.entities.CustomPet.list(),
      ]);
      setLootEggs(allLootEggs);
      setCustomPets(allCustomPets);
    } catch (e) {
      console.error('Failed to load loot eggs:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEggs();
  }, [loadEggs]);

  // Responsive: 3 per row on tablet/desktop, 2 on phones
  const [perRow, setPerRow] = useState(3);
  useEffect(() => {
    const update = () => setPerRow(window.innerWidth < 640 ? 2 : 3);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const selectedEgg = selectedSlot != null ? lootEggs[selectedSlot] : null;
  const selectedPrice = selectedEgg ? getEggShopPrice(selectedEgg) : 0;
  const currentGems = profile?.gems || 0;
  const canAfford = selectedEgg && currentGems >= selectedPrice;
  const isFree = selectedPrice === 0;

  const selectEgg = (index) => {
    if (purchasing || dispensing) return;
    setSelectedSlot(index);
  };

  const moveSelection = (delta) => {
    if (purchasing || dispensing) return;
    if (lootEggs.length === 0) return;
    setSelectedSlot((prev) => {
      if (prev == null) return delta > 0 ? 0 : lootEggs.length - 1;
      const next = (prev + delta + lootEggs.length) % lootEggs.length;
      return next;
    });
  };

  const runDispensing = (egg, drop) =>
    new Promise((resolve) => {
      if (prefersReducedMotion()) {
        resolve();
        return;
      }
      setDispensing({ egg, drop });
      // Safety net: resolve after the drop animation finishes.
      // DispenseEgg's onAnimationComplete also clears the dispensing state.
      setTimeout(() => {
        setDispensing(null);
        resolve();
      }, 1100);
    });

  const handleBuy = async () => {
    if (purchasing || dispensing) return;
    if (selectedEgg == null) return;
    const price = getEggShopPrice(selectedEgg);
    if (currentGems < price) {
      toast.error(`Not enough gems! Need ${price} 💎`);
      return;
    }
    setPurchasing(true);
    try {
      // 1. Create the LootEggDrop FIRST — the egg is dispensed.
      // If this fails, no gems are touched.
      const drop = await base44.entities.LootEggDrop.create({
        lootEggId: selectedEgg.id,
        profileId: profile.id,
        username: profile.username,
        source: 'shop_purchase',
      });

      // 2. Deduct gems only after the drop exists. If deduction fails,
      // the user keeps the egg (favorable) and we retry once.
      if (price > 0) {
        const deduct = async () => {
          const fresh = await base44.entities.UserProfile.filter({ id: profile.id });
          const p = fresh[0];
          if (!p) throw new Error('Profile not found');
          const newGems = (p.gems || 0) - price;
          await base44.entities.UserProfile.update(profile.id, { gems: newGems });
          setProfile((prev) => ({ ...prev, gems: newGems }));
        };
        try {
          await deduct();
        } catch (e1) {
          console.error('Gem deduction failed, retrying...', e1);
          try {
            await deduct();
          } catch (e2) {
            console.error('Gem deduction retry failed (egg still dispensed)', e2);
            toast.error('Gems could not be deducted — you still received the egg.');
          }
        }
      }

      // 3. Dispensing animation, then open the egg.
      await runDispensing(selectedEgg, drop);
      setOpeningEgg({ egg: selectedEgg, drop });
      toast.success('Egg purchased! Opening now...');
    } catch (e) {
      console.error('Egg purchase failed:', e);
      toast.error('Purchase failed - please try again');
    } finally {
      setPurchasing(false);
    }
  };

  const handleOpenEgg = async (prize) => {
    if (!openingEgg) return;
    const { drop } = openingEgg;
    await base44.entities.LootEggDrop.update(drop.id, { isOpened: true, wonPrize: prize });

    const freshProfiles = await base44.entities.UserProfile.filter({ id: profile.id });
    const p = freshProfiles[0] || profile;

    if (prize.type === 'xp') {
      await base44.entities.UserProfile.update(p.id, { xp: (p.xp || 0) + parseInt(prize.value || '0') });
      toast.success(`+${prize.value} XP!`);
    } else if (prize.type === 'coins') {
      await base44.entities.UserProfile.update(p.id, { questCoins: (p.questCoins || 0) + parseInt(prize.value || '0') });
      toast.success(`+${prize.value} Quest Coins!`);
    } else if (prize.type === 'pet') {
      let petId = prize.value || '';
      if (petId && !petId.startsWith('custom_') && petId.length > 10) {
        petId = `custom_${petId}`;
      }
      const up = [...(p.unlockedPets || [])];
      if (!up.includes(petId)) up.push(petId);
      const ut = [...(p.unlockedThemes || [])];
      if (petId.startsWith('custom_')) {
        try {
          const rawId = petId.replace('custom_', '');
          const petRecords = await base44.entities.CustomPet.filter({ id: rawId });
          if (petRecords.length > 0 && petRecords[0].theme) {
            const themeKey = `pet_theme_${rawId}`;
            if (!ut.includes(themeKey)) ut.push(themeKey);
          }
        } catch (e) {
          console.error('Failed to fetch pet theme for egg prize', e);
        }
      }
      await base44.entities.UserProfile.update(p.id, { unlockedPets: up, unlockedThemes: ut });
      toast.success('🐾 New pet unlocked!');
    } else if (prize.type === 'theme') {
      const ut = [...(p.unlockedThemes || [])];
      let themeId = prize.value || '';
      if (themeId && !themeId.startsWith('custom_') && themeId.length > 10) {
        themeId = `custom_${themeId}`;
      }
      if (!ut.includes(themeId)) ut.push(themeId);
      await base44.entities.UserProfile.update(p.id, { unlockedThemes: ut });
      toast.success('New theme unlocked!');
    } else if (prize.type === 'magic_egg') {
      await base44.entities.MagicEgg.create({ userId: p.userId, source: 'global_event' });
      toast.success('Magic Egg received!');
    } else if (prize.type === 'title') {
      const titles = [...(p.unlockedTitles || [])];
      if (!titles.includes(prize.value)) titles.push(prize.value);
      await base44.entities.UserProfile.update(p.id, { unlockedTitles: titles });
      toast.success(`New title: ${prize.value}!`);
    } else if (prize.type === 'cosmetic') {
      const uc = [...(p.unlockedCosmetics || [])];
      if (!uc.includes(prize.value)) uc.push(prize.value);
      await base44.entities.UserProfile.update(p.id, { unlockedCosmetics: uc });
      toast.success('Cosmetic unlocked!');
    }
    setOpeningEgg(null);
    // Refresh profile + eggs to sync balances and stock
    const fresh = await base44.entities.UserProfile.filter({ id: profile.id });
    if (fresh[0]) setProfile((prev) => ({ ...prev, ...fresh[0] }));
    await loadEggs();
  };

  // ---- Loading / Error states ----
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Stocking the vending machine…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 bg-white rounded-2xl border border-slate-100">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-slate-600 font-semibold">Couldn't load loot eggs.</p>
        <Button variant="outline" onClick={loadEggs}>Retry</Button>
      </div>
    );
  }
  if (lootEggs.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
        <span className="text-6xl block mb-4">🥚</span>
        <p className="text-slate-500 font-semibold">No eggs stocked yet!</p>
      </div>
    );
  }

  // Group eggs into rows
  const rows = [];
  for (let i = 0; i < lootEggs.length; i += perRow) {
    rows.push(lootEggs.slice(i, i + perRow));
  }

  return (
    <div className="relative mx-auto w-full max-w-[860px] pb-6">
      {/* ---------- Machine body ---------- */}
      <div
        ref={machineRef}
        className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-purple-300/40"
        style={{
          background: 'linear-gradient(160deg, #9D4EDD 0%, #7F5AF0 45%, #6D28D9 100%)',
          boxShadow: '0 20px 50px -12px rgba(124,58,237,0.45), inset 0 2px 6px rgba(255,255,255,0.25), inset 0 -6px 16px rgba(0,0,0,0.2)',
        }}
      >
        {/* ---------- Marquee ---------- */}
        <div className="px-4 py-3 text-center border-b border-purple-300/30"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))' }}>
          <span className="text-white font-black text-base sm:text-lg tracking-[0.2em] uppercase drop-shadow">
            ✨ LOOT EGGS ✨
          </span>
        </div>

        {/* ---------- Display + Side panel ---------- */}
        <div className="flex flex-col md:flex-row gap-2 md:gap-3 p-2 md:p-3">
          {/* Glass display */}
          <div
            className="relative flex-1 rounded-2xl overflow-hidden border-2 border-indigo-400/25"
            style={{
              background: 'linear-gradient(180deg, #2D1B4E 0%, #1A1033 100%)',
              boxShadow: 'inset 0 4px 14px rgba(0,0,0,0.5)',
            }}
          >
            {/* Glass reflection */}
            <div className="pointer-events-none absolute inset-0 z-10"
              style={{ background: 'linear-gradient(105deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.05) 100%)' }} />

            {/* Shelves */}
            <div className="relative z-0">
              {rows.map((rowEggs, rowIdx) => (
                <div key={rowIdx}>
                  {/* Overhead lights */}
                  <div className="flex justify-around px-3 pt-3">
                    {rowEggs.map((egg, colIdx) => (
                      <div key={egg.id} className="flex-1 flex justify-center">
                        <div className="w-6 h-1.5 rounded-full"
                          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5), rgba(255,255,255,0))' }} />
                      </div>
                    ))}
                  </div>
                  {/* Eggs row */}
                  <div className={`grid gap-1 px-2 sm:px-3 pt-1 pb-2`} style={{ gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))` }}>
                    {rowEggs.map((egg, colIdx) => {
                      const flatIdx = rowIdx * perRow + colIdx;
                      const isSelected = selectedSlot === flatIdx;
                      const price = getEggShopPrice(egg);
                      const affordable = currentGems >= price;
                      return (
                        <button
                          key={egg.id}
                          onClick={() => selectEgg(flatIdx)}
                          className={`relative flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                            isSelected ? 'bg-cyan-400/10' : 'hover:bg-white/5'
                          }`}
                          style={isSelected ? { boxShadow: '0 0 0 2px rgba(0,229,255,0.7), 0 0 18px rgba(0,229,255,0.45)' } : {}}
                        >
                          {/* Slot label */}
                          <span className="text-[10px] font-bold text-indigo-200/70 tracking-wider">
                            {slotLabel(flatIdx, perRow)}
                          </span>
                          {/* Selected badge */}
                          {isSelected && (
                            <span className="absolute top-1 right-1 text-[8px] font-black text-cyan-900 bg-cyan-300 px-1.5 py-0.5 rounded-full shadow">
                              SELECTED
                            </span>
                          )}
                          {/* Egg image */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center"
                            style={{ filter: `drop-shadow(0 0 8px ${egg.color || '#6366f1'}66)` }}>
                            {egg.imageUrl ? (
                              <img src={egg.imageUrl} alt={egg.name} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-3xl sm:text-4xl">{egg.emoji || '🥚'}</span>
                            )}
                          </div>
                          {/* Name */}
                          <span className="text-white text-[10px] sm:text-xs font-semibold text-center leading-tight line-clamp-2 min-h-[28px]">
                            {egg.name}
                          </span>
                          {/* Price pill */}
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-purple-300/40"
                            style={{ background: '#4A2C85' }}>
                            <Gem className="w-2.5 h-2.5 text-purple-200" />
                            <span className="text-purple-100 text-[10px] font-black">{price}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Shelf ledge */}
                  <div className="mx-3 h-2 rounded-b-xl"
                    style={{ background: 'linear-gradient(90deg, #4338ca 0%, #6d28d9 50%, #4338ca 100%)', boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }} />
                </div>
              ))}
            </div>

            {/* Dispensing overlay */}
            <AnimatePresence>
              {dispensing && (
                <DispenseEgg
                  key="dispense"
                  egg={dispensing.egg}
                  onDone={() => setDispensing(null)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ---------- Side control panel ---------- */}
          <div className="flex md:flex-col items-center justify-between md:justify-start gap-2 md:gap-4 md:w-28 rounded-2xl p-3 border border-purple-300/30"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))' }}>
            {/* Diamond emblem */}
            <div className="hidden md:flex w-14 h-14 items-center justify-center shrink-0">
              <div className="w-12 h-12 rotate-45 rounded-md"
                style={{ background: 'linear-gradient(135deg, #c4b5fd, #7c3aed)', boxShadow: '0 0 16px rgba(167,139,250,0.6)' }}>
                <div className="w-full h-full flex items-center justify-center -rotate-45">
                  <Gem className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Slot display */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] uppercase tracking-wider text-purple-200/70 font-bold">Slot</span>
              <div className="w-14 h-8 rounded-md flex items-center justify-center border-2 border-purple-300/40"
                style={{ background: '#1A1033' }}>
                <span className="text-cyan-300 font-mono font-bold text-sm">
                  {selectedSlot != null ? slotLabel(selectedSlot, perRow) : '--'}
                </span>
              </div>
            </div>

            {/* Nav buttons — up/down actually change selection */}
            <div className="flex md:flex-col gap-2 items-center">
              <button
                onClick={() => moveSelection(-1)}
                disabled={purchasing || dispensing}
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-purple-200/40 bg-purple-600/40 hover:bg-purple-500/60 transition-colors disabled:opacity-40"
                aria-label="Previous egg"
              >
                <ChevronUp className="w-5 h-5 text-white" />
              </button>
              {/* Gem indicator — glows when an egg is selected (decorative, not a button) */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={selectedEgg ? { background: 'radial-gradient(circle, rgba(0,229,255,0.5), rgba(124,58,237,0.3))', boxShadow: '0 0 12px rgba(0,229,255,0.6)' } : { background: 'rgba(255,255,255,0.06)' }}
              >
                <Gem className={`w-4 h-4 ${selectedEgg ? 'text-cyan-200' : 'text-purple-300/50'}`} />
              </div>
              <button
                onClick={() => moveSelection(1)}
                disabled={purchasing || dispensing}
                className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-purple-200/40 bg-purple-600/40 hover:bg-purple-500/60 transition-colors disabled:opacity-40"
                aria-label="Next egg"
              >
                <ChevronDown className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* ---------- Bottom control bar ---------- */}
        <div className="mx-2 md:mx-3 mb-2 rounded-2xl p-3 border border-purple-300/30 flex items-center gap-3"
          style={{ background: 'linear-gradient(180deg, rgba(45,27,78,0.9), rgba(26,16,51,0.9))' }}>
          {/* Thumbnail + name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border border-purple-300/30"
              style={{ background: '#1A1033' }}>
              {selectedEgg ? (
                selectedEgg.imageUrl ? (
                  <img src={selectedEgg.imageUrl} alt={selectedEgg.name} className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <span className="text-2xl">{selectedEgg.emoji || '🥚'}</span>
                )
              ) : (
                <span className="text-2xl opacity-40">🥚</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate">
                {selectedEgg ? selectedEgg.name : 'Select an egg'}
              </p>
              <p className="text-purple-200/70 text-xs">
                {selectedEgg
                  ? canAfford
                    ? isFree ? 'Free to claim' : `${selectedPrice} gems`
                    : `Need ${selectedPrice} gems — you have ${currentGems}`
                  : 'Choose an egg, then tap Buy.'}
              </p>
            </div>
          </div>

          {/* Buy button */}
          <Button
            onClick={handleBuy}
            disabled={selectedEgg == null || !canAfford || purchasing || dispensing}
            className="shrink-0 font-bold text-white border-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
          >
            {purchasing ? (
              <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Buying…</>
            ) : dispensing ? (
              'Dispensing…'
            ) : selectedEgg == null ? (
              'Select an egg'
            ) : !canAfford ? (
              'Not enough gems'
            ) : (
              <><Gem className="w-4 h-4 mr-1" /> Buy • {selectedPrice} gems</>
            )}
          </Button>
        </div>

        {/* ---------- Pickup hatch ---------- */}
        <div className="mx-auto mb-3 w-3/4">
          <div
            className="rounded-2xl py-2 text-center border border-purple-300/30 transition-all"
            style={{
              background: dispensing
                ? 'linear-gradient(180deg, rgba(0,229,255,0.35), rgba(45,27,78,0.8))'
                : 'linear-gradient(180deg, rgba(45,27,78,0.6), rgba(26,16,51,0.6))',
              boxShadow: dispensing ? '0 0 24px rgba(0,229,255,0.5), inset 0 0 16px rgba(0,229,255,0.3)' : 'inset 0 4px 10px rgba(0,0,0,0.4)',
            }}
          >
            <span className="text-white/80 text-xs font-bold tracking-[0.2em] uppercase">✨ Pickup ✨</span>
          </div>
        </div>

        {/* ---------- Feet ---------- */}
        <div className="flex justify-center gap-20 px-4">
          <div className="w-6 h-3 rounded-b-xl" style={{ background: 'linear-gradient(180deg, #4c1d95, #2e1065)' }} />
          <div className="w-6 h-3 rounded-b-xl" style={{ background: 'linear-gradient(180deg, #4c1d95, #2e1065)' }} />
        </div>
      </div>

      {/* ---------- Egg open animation ---------- */}
      <AnimatePresence>
        {openingEgg && (
          <EggOpenAnimation
            egg={openingEgg.egg}
            prizes={openingEgg.egg.prizes || []}
            onOpen={handleOpenEgg}
            onClose={() => setOpeningEgg(null)}
            customPets={customPets}
            autoOpen={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Dispensing animation ---------- */
function DispenseEgg({ egg, onDone }) {
  return (
    <motion.div
      className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      initial={{ top: '8%', scale: 1, opacity: 1, rotate: 0 }}
      animate={{ top: '82%', scale: 0.55, opacity: 0.85, rotate: -8 }}
      transition={{ duration: 1.0, ease: 'easeIn' }}
      onAnimationComplete={onDone}
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center"
        style={{ filter: `drop-shadow(0 0 12px ${egg.color || '#6366f1'})` }}>
        {egg.imageUrl ? (
          <img src={egg.imageUrl} alt={egg.name} className="w-full h-full object-contain" />
        ) : (
          <span className="text-4xl">{egg.emoji || '🥚'}</span>
        )}
      </div>
    </motion.div>
  );
}