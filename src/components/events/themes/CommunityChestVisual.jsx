import React from 'react';
import { motion } from 'framer-motion';

export default function CommunityChestVisual({ progress }) {
  const fill = Math.min(progress, 100);
  const lidAngle = Math.min(fill / 100 * 25, 25);
  const coinCount = Math.floor((fill / 100) * 12);

  return (
    <div className="relative w-52 h-60 mx-auto">
      {/* Sparkle particles */}
      {fill > 10 && [...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-sm"
          style={{
            left: `${25 + Math.random() * 50}%`,
            top: `${20 + Math.random() * 40}%`,
          }}
          animate={{
            y: [-5, -20, -5],
            opacity: [0, 1, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        >
          ✨
        </motion.div>
      ))}

      <svg viewBox="0 0 220 260" className="w-full h-full drop-shadow-xl">
        <defs>
          <radialGradient id="chestGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="woodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a16207" />
            <stop offset="50%" stopColor="#854d0e" />
            <stop offset="100%" stopColor="#713f12" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <clipPath id="chestInterior">
            <rect x="35" y="120" width="150" height="100" rx="4" />
          </clipPath>
        </defs>

        {/* Glow */}
        <ellipse cx="110" cy="160" rx="100" ry="90" fill="url(#chestGlow)" />

        {/* Chest body */}
        <rect x="30" y="120" width="160" height="105" rx="8" fill="url(#woodGrad)" stroke="#78350f" strokeWidth="2" />

        {/* Metal bands */}
        <rect x="30" y="140" width="160" height="6" fill="#a8a29e" opacity="0.5" rx="2" />
        <rect x="30" y="195" width="160" height="6" fill="#a8a29e" opacity="0.5" rx="2" />

        {/* Treasure inside */}
        <g clipPath="url(#chestInterior)">
          {/* Gold pile */}
          <motion.g
            initial={{ y: 120 }}
            animate={{ y: 220 - (fill / 100) * 100 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <ellipse cx="110" cy="0" rx="70" ry="20" fill="url(#goldGrad)" />
            <rect x="40" y="0" width="140" height="100" fill="url(#goldGrad)" opacity="0.9" />

            {/* Individual coins */}
            {[...Array(coinCount)].map((_, i) => (
              <motion.ellipse
                key={i}
                cx={55 + (i % 6) * 20}
                cy={-5 - Math.floor(i / 6) * 15}
                rx="8"
                ry="5"
                fill="#fde68a"
                stroke="#f59e0b"
                strokeWidth="1"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}

            {/* Gems */}
            {fill > 40 && (
              <>
                <motion.polygon points="80,-10 85,-20 90,-10" fill="#ef4444" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }} />
                <motion.polygon points="130,-8 135,-18 140,-8" fill="#3b82f6" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
              </>
            )}
            {fill > 70 && (
              <motion.polygon points="105,-15 110,-25 115,-15" fill="#a855f7" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
            )}
          </motion.g>
        </g>

        {/* Chest lid */}
        <motion.g
          style={{ transformOrigin: '30px 120px' }}
          animate={{ rotate: -lidAngle }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <path d="M30,120 Q30,85 110,80 Q190,85 190,120 Z" fill="url(#woodGrad)" stroke="#78350f" strokeWidth="2" />
          <path d="M30,118 Q30,95 110,90 Q190,95 190,118" fill="none" stroke="#a8a29e" strokeWidth="4" opacity="0.4" />
        </motion.g>

        {/* Lock / clasp */}
        <rect x="100" y="115" width="20" height="18" rx="3" fill="#a8a29e" opacity="0.7" />
        <circle cx="110" cy="126" r="3" fill="#78716c" />
      </svg>

      {/* Fill label */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-amber-300/80 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(fill)}% filled
      </motion.div>
    </div>
  );
}