import React from 'react';
import { motion } from 'framer-motion';

export default function VolcanoForgeVisual({ progress }) {
  const heat = Math.min(progress, 100);
  const lavaLevel = heat / 100;

  return (
    <div className="relative w-56 h-72 mx-auto">
      {/* Ember particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 4,
            height: 2 + Math.random() * 4,
            background: ['#ef4444', '#f97316', '#fbbf24', '#ff6b35'][i % 4],
            left: `${30 + Math.random() * 40}%`,
            bottom: `${40 + Math.random() * 30}%`,
          }}
          animate={{
            y: [0, -60 - Math.random() * 80],
            x: [0, (Math.random() - 0.5) * 40],
            opacity: [0, 1, 0],
            scale: [1, 0.3],
          }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Smoke at high heat */}
      {heat > 60 && [...Array(4)].map((_, i) => (
        <motion.div
          key={`smoke-${i}`}
          className="absolute rounded-full bg-slate-400/20"
          style={{
            width: 15 + Math.random() * 20,
            height: 15 + Math.random() * 20,
            left: `${35 + Math.random() * 30}%`,
            top: '10%',
          }}
          animate={{
            y: [0, -40],
            opacity: [0, 0.3, 0],
            scale: [0.5, 2],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}

      <svg viewBox="0 0 220 300" className="w-full h-full">
        <defs>
          <radialGradient id="volcGlow" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2 + heat / 300} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lavaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
            <stop offset="40%" stopColor="#f97316" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="rockGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#57534e" />
            <stop offset="100%" stopColor="#292524" />
          </linearGradient>
          <clipPath id="craterClip">
            <path d="M70,80 Q80,60 110,55 Q140,60 150,80 Q155,100 150,150 Q140,160 110,165 Q80,160 70,150 Q65,100 70,80 Z" />
          </clipPath>
        </defs>

        {/* Glow */}
        <ellipse cx="110" cy="100" rx="100" ry="80" fill="url(#volcGlow)" />

        {/* Mountain shape */}
        <polygon points="10,280 70,80 110,55 150,80 210,280" fill="url(#rockGrad)" />

        {/* Rock texture lines */}
        <path d="M50,200 Q80,195 90,210" stroke="#44403c" strokeWidth="1.5" fill="none" opacity="0.5" />
        <path d="M130,190 Q150,200 160,210" stroke="#44403c" strokeWidth="1.5" fill="none" opacity="0.5" />
        <path d="M70,240 Q100,235 130,245" stroke="#44403c" strokeWidth="1.5" fill="none" opacity="0.5" />

        {/* Crater opening */}
        <ellipse cx="110" cy="75" rx="42" ry="22" fill="#1c1917" />

        {/* Lava inside crater */}
        <g clipPath="url(#craterClip)">
          <motion.rect
            x="65" width="90" height="120"
            fill="url(#lavaGrad)"
            initial={{ y: 165 }}
            animate={{ y: 165 - lavaLevel * 110 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          {/* Lava surface bubbles */}
          {heat > 20 && [...Array(4)].map((_, i) => (
            <motion.circle
              key={i}
              cx={85 + i * 15}
              r={3 + Math.random() * 3}
              fill="#fbbf24"
              fillOpacity="0.6"
              animate={{
                cy: [165 - lavaLevel * 100, 165 - lavaLevel * 100 - 8, 165 - lavaLevel * 100],
                r: [2, 5, 2],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </g>

        {/* Crater rim highlight */}
        <ellipse cx="110" cy="75" rx="42" ry="22" fill="none" stroke="#78716c" strokeWidth="3" />

        {/* Lava drips down sides */}
        {heat > 50 && (
          <motion.g
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <path d="M85,90 Q83,120 80,150" stroke="#f97316" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
            <path d="M135,90 Q138,115 140,140" stroke="#ef4444" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
          </motion.g>
        )}

        {/* Ground */}
        <ellipse cx="110" cy="280" rx="100" ry="10" fill="#292524" opacity="0.3" />
      </svg>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-orange-300/80 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(heat)}% forged
      </motion.div>
    </div>
  );
}