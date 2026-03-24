import React from 'react';
import { motion } from 'framer-motion';

export default function DragonsHoardVisual({ progress }) {
  const fill = Math.min(progress, 100);
  const treasurePiles = Math.floor((fill / 100) * 6);
  const dragonAwake = fill > 80;

  return (
    <div className="relative w-56 h-72 mx-auto">
      {/* Sparkles from treasure */}
      {fill > 10 && [...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${40 + Math.random() * 40}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.3, 1, 0.3],
            y: [-5, -15, -5],
          }}
          transition={{
            duration: 1.5 + Math.random() * 1.5,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        >
          ✨
        </motion.div>
      ))}

      <svg viewBox="0 0 220 280" className="w-full h-full drop-shadow-xl">
        <defs>
          <radialGradient id="hoardCaveGlow" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.1 + fill * 0.003} />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hoardGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="caveWall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#57534e" />
            <stop offset="100%" stopColor="#292524" />
          </linearGradient>
        </defs>

        {/* Cave background */}
        <path d="M10,260 Q10,60 60,40 Q110,20 160,40 Q210,60 210,260 Z" fill="url(#caveWall)" />
        <ellipse cx="110" cy="180" rx="95" ry="80" fill="url(#hoardCaveGlow)" />

        {/* Cave interior - dark */}
        <path d="M25,255 Q25,80 70,55 Q110,38 150,55 Q195,80 195,255 Z" fill="#1c1917" />

        {/* Treasure piles - grow with progress */}
        <motion.g
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Base gold layer */}
          <motion.ellipse
            cx="110" cy="230" rx={30 + fill * 0.4} ry={8 + fill * 0.08}
            fill="url(#hoardGold)"
            animate={{ ry: [8 + fill * 0.08, 9 + fill * 0.08, 8 + fill * 0.08] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Coin stacks */}
          {[...Array(treasurePiles)].map((_, i) => {
            const cx = 65 + i * 18;
            const h = 10 + i * 3;
            return (
              <motion.g key={`pile-${i}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.15 }}
              >
                <rect x={cx - 6} y={225 - h} width="12" height={h} rx="2" fill="#fbbf24" />
                <ellipse cx={cx} cy={225 - h} rx="7" ry="3" fill="#fde68a" />
                <motion.ellipse
                  cx={cx} cy={225 - h} rx="3" ry="1.5" fill="white" opacity="0.2"
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              </motion.g>
            );
          })}

          {/* Gems scattered */}
          {fill > 25 && <polygon points="82,218 86,210 90,218" fill="#ef4444" />}
          {fill > 45 && <polygon points="128,215 132,207 136,215" fill="#3b82f6" />}
          {fill > 65 && <polygon points="105,212 109,204 113,212" fill="#a855f7" />}
        </motion.g>

        {/* Sleeping dragon - curled up */}
        <motion.g
          animate={dragonAwake ? { x: [0, -2, 2, 0] } : {}}
          transition={{ duration: 0.5, repeat: dragonAwake ? Infinity : 0 }}
        >
          {/* Dragon body coiled */}
          <ellipse cx="110" cy="170" rx="45" ry="28" fill="#dc2626" opacity="0.9" />
          <ellipse cx="110" cy="178" rx="30" ry="15" fill="#fca5a5" opacity="0.15" />

          {/* Tail wrapping around */}
          <path d="M155,170 Q175,155 180,140 Q182,130 175,128" stroke="#b91c1c" strokeWidth="8" fill="none" strokeLinecap="round" />

          {/* Head resting */}
          <ellipse cx="72" cy="155" rx="22" ry="18" fill="#dc2626" />
          {/* Snout */}
          <ellipse cx="56" cy="160" rx="12" ry="8" fill="#b91c1c" />
          <circle cx="52" cy="158" r="1.5" fill="#1e1e1e" />
          <circle cx="60" cy="158" r="1.5" fill="#1e1e1e" />

          {/* Eyes - closed when sleeping, open when awake */}
          {dragonAwake ? (
            <motion.g
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ellipse cx="66" cy="150" rx="5" ry="4" fill="#fbbf24" />
              <ellipse cx="80" cy="148" rx="5" ry="4" fill="#fbbf24" />
              <ellipse cx="66" cy="150" rx="2" ry="3.5" fill="#1e1e1e" />
              <ellipse cx="80" cy="148" rx="2" ry="3.5" fill="#1e1e1e" />
            </motion.g>
          ) : (
            <g>
              <line x1="61" y1="150" x2="71" y2="150" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" />
              <line x1="75" y1="148" x2="85" y2="148" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {/* Sleeping Zs */}
          {!dragonAwake && (
            <motion.g
              animate={{ opacity: [0, 1, 0], y: [0, -15, -30] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <text x="88" y="135" fill="#a8a29e" fontSize="10" fontWeight="bold">z</text>
              <text x="95" y="125" fill="#a8a29e" fontSize="8" fontWeight="bold">z</text>
              <text x="100" y="118" fill="#a8a29e" fontSize="6" fontWeight="bold">z</text>
            </motion.g>
          )}

          {/* Smoke from nostrils when awake */}
          {dragonAwake && (
            <motion.g
              animate={{ opacity: [0.3, 0.7, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <circle cx="48" cy="155" r="4" fill="#a8a29e" opacity="0.3" />
              <circle cx="44" cy="148" r="3" fill="#a8a29e" opacity="0.2" />
            </motion.g>
          )}

          {/* Wings folded */}
          <path d="M90,155 Q95,130 115,125 Q120,135 110,155" fill="#991b1b" opacity="0.6" />
          <path d="M130,155 Q135,130 150,128 Q148,140 140,155" fill="#991b1b" opacity="0.6" />
        </motion.g>

        {/* Cave mouth outline */}
        <path d="M20,260 Q20,70 65,45 Q110,25 155,45 Q200,70 200,260"
          fill="none" stroke="#78716c" strokeWidth="3" />

        {/* Stalactites */}
        <polygon points="55,60 58,90 52,90" fill="#57534e" />
        <polygon points="100,35 103,60 97,60" fill="#57534e" />
        <polygon points="155,55 158,82 152,82" fill="#57534e" />
      </svg>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-yellow-300/90 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(fill)}% raided
      </motion.div>
    </div>
  );
}