import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NOTEBOOK_RARITIES } from '@/lib/notebookDrops';

// Particle component
function Particle({ color }) {
  const angle = Math.random() * 360;
  const dist = 60 + Math.random() * 120;
  const x = Math.cos((angle * Math.PI) / 180) * dist;
  const y = Math.sin((angle * Math.PI) / 180) * dist;
  const size = 4 + Math.random() * 8;
  const delay = Math.random() * 0.3;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        top: '50%',
        left: '50%',
        marginTop: -size / 2,
        marginLeft: -size / 2,
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0 }}
      transition={{ duration: 0.8 + Math.random() * 0.4, delay, ease: 'easeOut' }}
    />
  );
}

// Individual item card that flies in
function ItemCard({ item, index, total, rarityKey }) {
  const rarity = NOTEBOOK_RARITIES[rarityKey];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 40, rotate: (Math.random() - 0.5) * 30 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
      transition={{
        delay: 0.6 + index * 0.15,
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      className="flex flex-col items-center gap-1"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${rarity.color}33, ${rarity.color}66)`,
          border: `2px solid ${rarity.color}88`,
          boxShadow: `0 0 16px ${rarity.glow}`,
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(circle at 30% 30%, white, transparent)` }}
        />
        <span className="relative z-10">{item.emoji}</span>
      </div>
      <div className="text-center">
        <div className="text-white text-xs font-semibold leading-tight max-w-[72px] line-clamp-2">
          {item.label}
        </div>
        {item.type === 'pet' && (
          <div className="text-xs mt-0.5 capitalize" style={{ color: rarity.color }}>
            {item.rarity} pet
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function NotebookDropReveal({ rarityKey, items, onClose }) {
  const rarity = NOTEBOOK_RARITIES[rarityKey];
  const [phase, setPhase] = useState('notebook'); // 'notebook' → 'open' → 'items'
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('open');
      setParticles(Array.from({ length: 24 }, (_, i) => i));
    }, 1200);
    const t2 = setTimeout(() => setPhase('items'), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse at center, ${rarity.color}22, #00000099)` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={phase === 'items' ? onClose : undefined}
      />

      {/* Main container */}
      <div className="relative z-10 flex flex-col items-center px-6 max-w-sm w-full">
        {/* Rarity label */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <div
            className="px-6 py-1.5 rounded-full font-bold text-sm tracking-widest uppercase"
            style={{
              background: `linear-gradient(90deg, ${rarity.color}44, ${rarity.color}88, ${rarity.color}44)`,
              border: `1px solid ${rarity.color}`,
              color: rarity.color,
              boxShadow: `0 0 20px ${rarity.glow}`,
            }}
          >
            ✦ {rarity.label} Drop ✦
          </div>
        </motion.div>

        {/* Notebook / open animation */}
        <div className="relative flex items-center justify-center mb-6" style={{ width: 140, height: 140 }}>
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle, ${rarity.glow}, transparent 70%)` }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />

          {/* Notebook closed */}
          <AnimatePresence>
            {phase === 'notebook' && (
              <motion.div
                key="closed"
                className="text-8xl select-none"
                initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: [0, -5, 5, -3, 0] }}
                exit={{ scale: 1.4, opacity: 0, rotate: 15 }}
                transition={{ duration: 0.5, rotate: { duration: 0.8, delay: 0.4 } }}
              >
                📔
              </motion.div>
            )}
          </AnimatePresence>

          {/* Open burst */}
          <AnimatePresence>
            {(phase === 'open' || phase === 'items') && (
              <motion.div
                key="open"
                className="text-8xl select-none"
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              >
                📖
              </motion.div>
            )}
          </AnimatePresence>

          {/* Particles */}
          {phase === 'open' &&
            particles.map(i => <Particle key={i} color={rarity.color} />)}
        </div>

        {/* Items grid */}
        <AnimatePresence>
          {phase === 'items' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <div
                className={`
                  rounded-3xl p-5 backdrop-blur-xl border relative overflow-hidden
                `}
                style={{
                  background: `linear-gradient(135deg, #0f172a, #1e1b4b)`,
                  borderColor: `${rarity.color}55`,
                  boxShadow: `0 0 40px ${rarity.glow}`,
                }}
              >
                {/* Sheen */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-10"
                  style={{ background: `linear-gradient(135deg, white 0%, transparent 50%)` }}
                />

                <div className="text-center mb-4 relative z-10">
                  <div className="text-white/60 text-xs uppercase tracking-widest">You got</div>
                </div>

                <div
                  className={`
                    relative z-10 flex flex-wrap justify-center gap-4
                    ${items.length <= 2 ? 'gap-6' : 'gap-3'}
                  `}
                >
                  {items.map((item, i) => (
                    <ItemCard
                      key={`${item.label}-${i}`}
                      item={item}
                      index={i}
                      total={items.length}
                      rarityKey={rarityKey}
                    />
                  ))}
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + items.length * 0.15 + 0.3 }}
                  onClick={onClose}
                  className="relative z-10 mt-5 w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: `linear-gradient(90deg, ${rarity.color}88, ${rarity.color})`,
                    boxShadow: `0 4px 14px ${rarity.glow}`,
                  }}
                >
                  Awesome! Collect
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap hint */}
        {phase !== 'items' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{ delay: 0.8, duration: 2, repeat: Infinity }}
            className="text-white/40 text-xs mt-4"
          >
            Opening notebook…
          </motion.p>
        )}
      </div>
    </div>
  );
}