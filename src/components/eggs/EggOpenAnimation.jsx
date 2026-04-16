import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const RARITY_GLOW = {
  common: '#94a3b8',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

function getPrizeRarity(weight, totalWeight) {
  const pct = (weight / totalWeight) * 100;
  if (pct <= 2) return 'legendary';
  if (pct <= 8) return 'epic';
  if (pct <= 20) return 'rare';
  if (pct <= 40) return 'uncommon';
  return 'common';
}

const TYPE_EMOJI = {
  xp: '⚡', coins: '🪙', pet: '🐾', theme: '🎨',
  title: '🏷️', magic_egg: '🥚', cosmetic: '👒', default: '🎁',
};

export default function EggOpenAnimation({ egg, prizes, onOpen, onClose, customPets = [], autoOpen = false }) {
  const [phase, setPhase] = useState('idle'); // idle, shaking, cracking, reveal
  const [wonPrize, setWonPrize] = useState(null);
  const [showChances, setShowChances] = useState(false);

  // If all prizes have zero/missing weight, assign equal weight of 10 to each
  const normalizedPrizes = prizes.map(p => ({ ...p, weight: (p.weight && p.weight > 0) ? p.weight : 10 }));
  const totalWeight = normalizedPrizes.reduce((s, p) => s + p.weight, 0);

  // Auto-open: skip idle and start shaking immediately
  useEffect(() => {
    if (autoOpen && phase === 'idle') {
      handleOpen();
    }
  }, [autoOpen]);


  const pickPrize = () => {
    const r = Math.random() * totalWeight;
    let sum = 0;
    for (const p of normalizedPrizes) {
      sum += p.weight;
      if (r <= sum) return p;
    }
    return normalizedPrizes[normalizedPrizes.length - 1];
  };

  const handleOpen = async () => {
    setPhase('shaking');
    await new Promise(r => setTimeout(r, 1500));
    setPhase('cracking');
    const prize = pickPrize();
    setWonPrize(prize);
    await new Promise(r => setTimeout(r, 1200));
    setPhase('reveal');
  };

  const handleClaim = () => {
    onOpen(wonPrize);
  };

  const rarity = wonPrize ? getPrizeRarity(wonPrize.weight, totalWeight) : 'common';
  const glowColor = RARITY_GLOW[rarity] || '#6366f1';
  const chancePct = wonPrize ? ((wonPrize.weight / totalWeight) * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative flex flex-col items-center gap-6 p-8 max-w-sm w-full">
        
        {/* Close button */}
        {phase === 'idle' && (
          <button onClick={onClose} className="absolute top-2 right-2 text-white/50 hover:text-white text-xl">✕</button>
        )}

        {/* Egg name */}
        <h2 className="text-2xl font-bold text-white text-center">{!egg.imageUrl && (egg.emoji || '🥚')} {egg.name}</h2>

        {/* Egg visual */}
        <AnimatePresence mode="wait">
          {phase !== 'reveal' ? (
            <motion.div
              key="egg"
              className="relative"
              animate={
                phase === 'shaking' ? {
                  rotate: [0, -8, 8, -12, 12, -6, 6, 0],
                  scale: [1, 1.02, 0.98, 1.05, 0.95, 1.03, 1],
                } : phase === 'cracking' ? {
                  scale: [1, 1.3, 0],
                  opacity: [1, 1, 0],
                } : {}
              }
              transition={
                phase === 'shaking' ? { duration: 1.5, repeat: 0 } :
                phase === 'cracking' ? { duration: 1.2, ease: 'easeIn' } : {}
              }
            >
              <div 
                className="w-40 h-48 rounded-full flex items-center justify-center text-7xl relative overflow-hidden"
                style={{ 
                  background: egg.imageUrl ? 'transparent' : `radial-gradient(ellipse at 30% 30%, ${egg.color || '#6366f1'}88, ${egg.color || '#6366f1'})`,
                  boxShadow: `0 0 40px ${egg.color || '#6366f1'}66`
                }}
              >
                {egg.imageUrl ? (
                  <img src={egg.imageUrl} alt={egg.name} className="w-full h-full object-contain" />
                ) : (
                  <>
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-full" />
                    <span className="relative z-10">{egg.emoji || '🥚'}</span>
                  </>
                )}
                
                {/* Crack lines during cracking */}
                {phase === 'cracking' && (
                  <>
                    <motion.div 
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                      className="absolute top-1/4 left-1/2 w-1 h-1/2 bg-yellow-300/80 origin-top"
                      style={{ transform: 'rotate(15deg)' }}
                    />
                    <motion.div 
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                      transition={{ delay: 0.2 }}
                      className="absolute top-1/3 left-1/3 w-0.5 h-1/3 bg-yellow-200/60 origin-top"
                      style={{ transform: 'rotate(-20deg)' }}
                    />
                  </>
                )}
              </div>

              {/* Particle effects during shaking */}
              {phase === 'shaking' && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{ backgroundColor: egg.color || '#6366f1', top: '50%', left: '50%' }}
                      animate={{
                        x: [0, (Math.random() - 0.5) * 120],
                        y: [0, (Math.random() - 0.5) * 120],
                        opacity: [0.8, 0],
                        scale: [1, 0],
                      }}
                      transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="prize"
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring', bounce: 0.5 }}
              className="relative"
            >
              {/* Glow ring */}
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ boxShadow: `0 0 80px 30px ${glowColor}` }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />

              {/* Burst particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: glowColor, 
                    top: '50%', left: '50%',
                  }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
                  animate={{
                    x: Math.cos((i / 12) * Math.PI * 2) * 100,
                    y: Math.sin((i / 12) * Math.PI * 2) * 100,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 1.2, delay: 0.1 }}
                />
              ))}

              {(() => {
                // Show pet image if it's a custom pet prize
                let petImg = null;
                if (wonPrize?.type === 'pet' && wonPrize.value?.startsWith('custom_')) {
                  const petId = wonPrize.value.replace('custom_', '');
                  const pet = customPets.find(cp => cp.id === petId);
                  petImg = pet?.imageUrl || null;
                }
                return (
                  <div className="w-40 h-40 rounded-full flex items-center justify-center text-6xl overflow-hidden"
                    style={{ 
                      background: `radial-gradient(circle, ${glowColor}33, ${glowColor}11)`,
                      border: `3px solid ${glowColor}`
                    }}
                  >
                    {petImg
                      ? <img src={petImg} className="w-full h-full object-cover rounded-full" alt={wonPrize.label} />
                      : <span>{TYPE_EMOJI[wonPrize?.type] || '🎁'}</span>}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prize result */}
        {phase === 'reveal' && wonPrize && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center space-y-2"
          >
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: glowColor }}>{rarity}</p>
            <h3 className="text-xl font-bold text-white">{wonPrize.label}</h3>
            <p className="text-sm text-white/60">{chancePct}% chance</p>
            
            <Button onClick={handleClaim} className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-8 py-3">
              Claim Prize!
            </Button>
          </motion.div>
        )}

        {/* Open button */}
        {phase === 'idle' && (
          <div className="space-y-3 w-full">
            <Button onClick={handleOpen} className="w-full py-5 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              🔓 Open Egg!
            </Button>
            <button onClick={() => setShowChances(!showChances)} className="text-xs text-white/40 hover:text-white/70 w-full text-center">
              {showChances ? 'Hide' : 'Show'} drop rates
            </button>
          </div>
        )}

        {/* Drop rates */}
        {showChances && phase === 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="w-full space-y-1"
          >
            {normalizedPrizes.map((p, i) => {
              const pct = ((p.weight / totalWeight) * 100).toFixed(1);
              const r = getPrizeRarity(p.weight, totalWeight);
              return (
                <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{TYPE_EMOJI[p.type] || '🎁'}</span>
                    <span className="text-xs text-white/80">{p.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: RARITY_GLOW[r] }} />
                    </div>
                    <span className="text-xs font-mono" style={{ color: RARITY_GLOW[r] }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}