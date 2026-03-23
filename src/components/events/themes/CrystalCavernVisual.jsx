import React from 'react';
import { motion } from 'framer-motion';

export default function CrystalCavernVisual({ progress }) {
  const fill = Math.min(progress, 100);
  const crystalCount = Math.floor((fill / 100) * 7) + 2;

  const crystals = [
    { x: 60, h: 50, color: '#06b6d4', delay: 0 },
    { x: 85, h: 70, color: '#8b5cf6', delay: 0.1 },
    { x: 110, h: 90, color: '#3b82f6', delay: 0.2 },
    { x: 135, h: 65, color: '#a855f7', delay: 0.15 },
    { x: 155, h: 45, color: '#06b6d4', delay: 0.25 },
    { x: 50, h: 35, color: '#8b5cf6', delay: 0.3 },
    { x: 168, h: 40, color: '#3b82f6', delay: 0.35 },
    { x: 75, h: 55, color: '#a855f7', delay: 0.2 },
    { x: 142, h: 60, color: '#06b6d4', delay: 0.1 },
  ];

  return (
    <div className="relative w-56 h-72 mx-auto">
      {/* Sparkle particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: ['#06b6d4', '#8b5cf6', '#3b82f6', '#a855f7'][i % 4],
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 70}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}

      <svg viewBox="0 0 220 300" className="w-full h-full">
        <defs>
          <radialGradient id="cavernGlow" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="crystalBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="crystalPurple" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.9" />
          </linearGradient>
          <filter id="crystalGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background glow */}
        <ellipse cx="110" cy="200" rx="100" ry="80" fill="url(#cavernGlow)" />

        {/* Cave floor */}
        <ellipse cx="110" cy="275" rx="90" ry="15" fill="#1e293b" opacity="0.5" />

        {/* Crystals growing from bottom */}
        {crystals.slice(0, crystalCount).map((c, i) => {
          const scaledH = c.h * (fill / 100) * 1.2;
          return (
            <motion.g key={i} filter="url(#crystalGlow)">
              <motion.polygon
                points={`${c.x},275 ${c.x - 8},275 ${c.x - 4},${275 - scaledH} ${c.x + 4},${275 - scaledH} ${c.x + 8},275`}
                fill={c.color}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 0.85, scaleY: 1 }}
                transition={{ duration: 1, delay: c.delay, ease: 'easeOut' }}
                style={{ transformOrigin: `${c.x}px 275px` }}
              />
              {/* Shine line */}
              <motion.line
                x1={c.x - 2} y1={275 - scaledH + 5}
                x2={c.x - 2} y2={275 - scaledH * 0.4}
                stroke="white" strokeWidth="1.5" strokeLinecap="round"
                opacity="0.3"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.4, 0.1] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
              {/* Tip glow */}
              {fill > 40 && (
                <motion.circle
                  cx={c.x} cy={275 - scaledH}
                  r="4"
                  fill={c.color}
                  animate={{ opacity: [0.3, 0.9, 0.3], r: [3, 6, 3] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              )}
            </motion.g>
          );
        })}

        {/* Stalactites from ceiling */}
        {fill > 30 && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.5 }}>
            <polygon points="45,0 50,35 40,35" fill="#475569" />
            <polygon points="90,0 95,25 85,25" fill="#475569" />
            <polygon points="140,0 145,30 135,30" fill="#475569" />
            <polygon points="175,0 180,20 170,20" fill="#475569" />
          </motion.g>
        )}

        {/* Energy beams between crystals at high progress */}
        {fill > 70 && (
          <motion.g
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <line x1="85" y1={275 - 70 * fill / 100} x2="110" y2={275 - 90 * fill / 100} stroke="#67e8f9" strokeWidth="1" opacity="0.5" />
            <line x1="110" y1={275 - 90 * fill / 100} x2="135" y2={275 - 65 * fill / 100} stroke="#c4b5fd" strokeWidth="1" opacity="0.5" />
          </motion.g>
        )}
      </svg>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-cyan-300/80 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(fill)}% crystallized
      </motion.div>
    </div>
  );
}