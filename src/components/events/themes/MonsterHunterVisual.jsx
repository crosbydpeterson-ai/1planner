import React from 'react';
import { motion } from 'framer-motion';

export default function MonsterHunterVisual({ progress }) {
  const damage = Math.min(progress, 100);
  const healthRemaining = 100 - damage;

  return (
    <div className="relative w-56 h-72 mx-auto">
      {/* Impact flashes */}
      {damage > 20 && [...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${25 + Math.random() * 50}%`,
            top: `${20 + Math.random() * 50}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.3, 1.5, 0],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: Math.random() * 5,
            repeatDelay: 3 + Math.random() * 4,
          }}
        >
          <span className="text-xl">💥</span>
        </motion.div>
      ))}

      <svg viewBox="0 0 230 300" className="w-full h-full">
        <defs>
          <radialGradient id="monsterGlow" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15 + damage / 500} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="dragonScale" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#991b1b" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>
        </defs>

        {/* Glow */}
        <ellipse cx="115" cy="140" rx="110" ry="130" fill="url(#monsterGlow)" />

        {/* Dragon Body */}
        <motion.g
          animate={{
            x: [0, -2, 2, 0],
            y: [0, -1, 1, 0],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Body */}
          <ellipse cx="115" cy="165" rx="55" ry="45" fill="url(#dragonScale)" />

          {/* Head */}
          <ellipse cx="115" cy="105" rx="38" ry="32" fill="#dc2626" />

          {/* Horns */}
          <path d="M85,85 Q78,55 70,45" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M145,85 Q152,55 160,45" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" />

          {/* Eyes */}
          <motion.ellipse
            cx="100" cy="100" rx="8" ry="6"
            fill="#fbbf24"
            animate={{ ry: [6, 2, 6] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <motion.ellipse
            cx="130" cy="100" rx="8" ry="6"
            fill="#fbbf24"
            animate={{ ry: [6, 2, 6] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <ellipse cx="100" cy="100" rx="3" ry="5" fill="#1e1e1e" />
          <ellipse cx="130" cy="100" rx="3" ry="5" fill="#1e1e1e" />

          {/* Snout / Nose */}
          <ellipse cx="115" cy="118" rx="15" ry="8" fill="#b91c1c" />
          <circle cx="109" cy="117" r="2" fill="#1e1e1e" />
          <circle cx="121" cy="117" r="2" fill="#1e1e1e" />

          {/* Wings */}
          <path d="M60,150 Q20,100 30,70 Q40,90 55,110 Q50,130 60,150" fill="#991b1b" opacity="0.7" />
          <path d="M170,150 Q210,100 200,70 Q190,90 175,110 Q180,130 170,150" fill="#991b1b" opacity="0.7" />

          {/* Tail */}
          <path d="M115,210 Q140,240 170,245 Q185,240 190,230" stroke="#991b1b" strokeWidth="8" fill="none" strokeLinecap="round" />

          {/* Belly */}
          <ellipse cx="115" cy="175" rx="30" ry="25" fill="#fca5a5" opacity="0.3" />

          {/* Damage cracks */}
          {damage > 25 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <path d="M90,140 L85,155 L95,150 L88,165" stroke="#fbbf24" strokeWidth="2" fill="none" />
            </motion.g>
          )}
          {damage > 50 && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <path d="M140,135 L148,148 L138,152 L145,163" stroke="#fbbf24" strokeWidth="2" fill="none" />
              <path d="M105,160 L100,172 L112,168" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
            </motion.g>
          )}
          {damage > 75 && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <path d="M120,120 L125,135 L115,130 L122,145" stroke="#f97316" strokeWidth="2.5" fill="none" />
              <circle cx="115" cy="150" r="8" fill="#ef4444" opacity="0.3" />
            </motion.g>
          )}

          {/* Fire breath (appears when monster is angry at low health) */}
          {damage > 60 && (
            <motion.g
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.9, 1.1, 0.9] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{ transformOrigin: '115px 125px' }}
            >
              <ellipse cx="115" cy="130" rx="6" ry="4" fill="#f97316" opacity="0.6" />
            </motion.g>
          )}
        </motion.g>

        {/* HP Bar */}
        <g>
          <rect x="35" y="255" width="160" height="14" rx="7" fill="#1e1e1e" opacity="0.5" />
          <motion.rect
            x="35" y="255"
            height="14" rx="7"
            fill={healthRemaining > 50 ? '#22c55e' : healthRemaining > 25 ? '#f59e0b' : '#ef4444'}
            initial={{ width: 160 }}
            animate={{ width: (healthRemaining / 100) * 160 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <text x="115" y="266" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
            HP: {Math.round(healthRemaining)}%
          </text>
        </g>
      </svg>

      {/* Damage label */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-red-400/80 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(damage)}% damage dealt
      </motion.div>
    </div>
  );
}