import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import confetti from 'canvas-confetti';

const PRIZE_LABELS = {
  loot_egg: '🥚 Loot Egg',
  magic_egg: '🪄 Magic Egg',
  coins_50: '🪙 50 Coins',
  coins_100: '🪙 100 Coins',
  coins_200: '🪙 200 Coins',
  xp_50: '⚡ 50 XP',
  xp_100: '⚡ 100 XP',
};

export default function PinataEvent({ event, profile, onClose }) {
  const [currentHits, setCurrentHits] = useState(event.config?.currentHits || 0);
  const [totalHits] = useState(event.config?.totalHits || event.config?.pinataHits || 50);
  const [broken, setBroken] = useState(false);
  const [hitting, setHitting] = useState(false);
  const [myHits, setMyHits] = useState(0);
  const [prize, setPrize] = useState(null);
  const unsubRef = useRef(null);

  const progress = Math.min((currentHits / totalHits) * 100, 100);
  const remaining = Math.max(totalHits - currentHits, 0);

  useEffect(() => {
    // Subscribe to real-time hit count updates
    unsubRef.current = base44.entities.AdminEvent.subscribe((evt) => {
      if (evt.id === event.id && evt.data) {
        const hits = evt.data.config?.currentHits || 0;
        setCurrentHits(hits);
        if (hits >= totalHits && !broken) {
          handleBreak(evt.data.config?.prizePool || event.config?.prizePool || []);
        }
      }
    });
    return () => unsubRef.current?.();
  }, [broken]);

  const handleBreak = (prizePool) => {
    setBroken(true);
    confetti({ particleCount: 300, spread: 160, origin: { y: 0.4 } });
    if (prizePool?.length > 0) {
      const won = prizePool[Math.floor(Math.random() * prizePool.length)];
      setPrize(won);
    }
  };

  const hitPinata = async () => {
    if (hitting || broken || currentHits >= totalHits) return;
    setHitting(true);
    setMyHits(h => h + 1);
    const newHits = currentHits + 1;
    const newConfig = { ...event.config, currentHits: newHits };
    await base44.entities.AdminEvent.update(event.id, { config: newConfig });
    setCurrentHits(newHits);
    if (newHits >= totalHits) {
      handleBreak(event.config?.prizePool || []);
    }
    setTimeout(() => setHitting(false), 300);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm mx-4 rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #db2777)', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        <div className="p-6 text-center">
          <h2 className="text-2xl font-black text-white mb-1">🪅 Piñata Smash!</h2>
          <p className="text-purple-200 text-sm mb-4">{remaining > 0 ? `${remaining} hits left to break it!` : 'It broke! 🎉'}</p>

          {/* Piñata */}
          <motion.div
            className="text-8xl mb-4 cursor-pointer select-none inline-block"
            animate={hitting ? { rotate: [-5, 5, -5, 0], scale: [1, 1.15, 1] } : broken ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] } : {}}
            transition={{ duration: 0.3 }}
            onClick={hitPinata}
            title="Click to hit!"
          >
            {broken ? '💥' : '🪅'}
          </motion.div>

          {/* Progress Bar */}
          <div className="bg-white/20 rounded-full h-4 mb-3 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #fbbf24, #f97316)' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-white/70 text-xs mb-4">{currentHits} / {totalHits} hits • You hit: {myHits}x</p>

          {/* Prize display */}
          <AnimatePresence>
            {broken && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/20 rounded-2xl p-4 mb-4"
              >
                <p className="text-white font-bold text-lg">🎁 You won!</p>
                <p className="text-yellow-300 text-xl font-black mt-1">
                  {prize ? (PRIZE_LABELS[prize] || prize) : '🎊 A surprise!'}
                </p>
                <p className="text-white/60 text-xs mt-1">Prize delivered to your account</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!broken && (
            <motion.button
              onClick={hitPinata}
              whileTap={{ scale: 0.9 }}
              className="w-full py-3 rounded-2xl font-black text-lg text-white mb-3 transition-all"
              style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)' }}
            >
              🔨 SMASH IT!
            </motion.button>
          )}

          <button onClick={onClose} className="text-white/50 hover:text-white/80 text-sm transition-colors">
            {broken ? 'Awesome, close!' : 'Close for now'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}