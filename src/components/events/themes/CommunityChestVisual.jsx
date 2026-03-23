import React from 'react';
import { motion } from 'framer-motion';

export default function CommunityChestVisual({ progress }) {
  const fill = Math.min(progress, 100);
  const lidAngle = Math.min(fill / 100 * 30, 30);
  const coinCount = Math.floor((fill / 100) * 14);

  return (
    <div className="relative w-56 h-68 mx-auto">
      {/* Sparkle particles - more varied */}
      {fill > 10 && [...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${15 + Math.random() * 45}%`,
          }}
          animate={{
            y: [-5, -25 - Math.random() * 15, -5],
            opacity: [0, 1, 0],
            scale: [0.3, 1.3, 0.3],
          }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        >
          {['✨', '⭐', '💫'][i % 3]}
        </motion.div>
      ))}

      {/* Gold dust floating */}
      {fill > 40 && [...Array(8)].map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute w-1 h-1 rounded-full bg-amber-300"
          style={{
            left: `${25 + Math.random() * 50}%`,
            top: `${30 + Math.random() * 40}%`,
          }}
          animate={{
            y: [0, -15, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}

      <svg viewBox="0 0 220 270" className="w-full h-full drop-shadow-xl">
        <defs>
          <radialGradient id="chestGlow2" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="woodGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="30%" stopColor="#a16207" />
            <stop offset="60%" stopColor="#854d0e" />
            <stop offset="100%" stopColor="#713f12" />
          </linearGradient>
          <linearGradient id="goldGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="metalBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4d4d8" />
            <stop offset="50%" stopColor="#a1a1aa" />
            <stop offset="100%" stopColor="#71717a" />
          </linearGradient>
          <clipPath id="chestInterior2">
            <rect x="35" y="125" width="150" height="100" rx="4" />
          </clipPath>
          <filter id="goldGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background glow */}
        <ellipse cx="110" cy="165" rx="105" ry="95" fill="url(#chestGlow2)" />

        {/* Shadow under chest */}
        <ellipse cx="110" cy="232" rx="75" ry="8" fill="#000" opacity="0.15" />

        {/* Chest body */}
        <rect x="30" y="125" width="160" height="105" rx="8" fill="url(#woodGrad2)" stroke="#78350f" strokeWidth="2.5" />

        {/* Wood grain texture */}
        <path d="M40,145 Q80,142 120,146 Q160,143 180,147" stroke="#6b3a10" strokeWidth="0.8" fill="none" opacity="0.3" />
        <path d="M40,175 Q90,172 130,176 Q170,173 180,177" stroke="#6b3a10" strokeWidth="0.8" fill="none" opacity="0.25" />

        {/* Metal bands - shinier */}
        <rect x="28" y="142" width="164" height="8" fill="url(#metalBand)" opacity="0.6" rx="2" />
        <rect x="28" y="197" width="164" height="8" fill="url(#metalBand)" opacity="0.6" rx="2" />
        {/* Rivets */}
        {[38, 78, 142, 182].map((x) => (
          <g key={x}>
            <circle cx={x} cy="146" r="3" fill="#a8a29e" opacity="0.7" />
            <circle cx={x} cy="201" r="3" fill="#a8a29e" opacity="0.7" />
          </g>
        ))}

        {/* Treasure inside */}
        <g clipPath="url(#chestInterior2)">
          <motion.g
            initial={{ y: 130 }}
            animate={{ y: 225 - (fill / 100) * 105 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            filter="url(#goldGlow)"
          >
            <ellipse cx="110" cy="0" rx="72" ry="22" fill="url(#goldGrad2)" />
            <rect x="38" y="0" width="144" height="105" fill="url(#goldGrad2)" opacity="0.9" />

            {/* Coins */}
            {[...Array(coinCount)].map((_, i) => (
              <motion.g key={i}>
                <motion.ellipse
                  cx={50 + (i % 7) * 18} cy={-5 - Math.floor(i / 7) * 14}
                  rx="9" ry="5.5"
                  fill="#fde68a" stroke="#f59e0b" strokeWidth="1"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                />
                {/* Coin shine */}
                <ellipse
                  cx={48 + (i % 7) * 18} cy={-7 - Math.floor(i / 7) * 14}
                  rx="3" ry="2" fill="white" opacity="0.2"
                />
              </motion.g>
            ))}

            {/* Gems - bigger, more detailed */}
            {fill > 35 && (
              <motion.g animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}>
                <polygon points="75,-12 80,-24 85,-12" fill="#ef4444" />
                <polygon points="77,-12 80,-20 83,-12" fill="#fca5a5" opacity="0.3" />
              </motion.g>
            )}
            {fill > 55 && (
              <motion.g animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
                <polygon points="135,-10 140,-22 145,-10" fill="#3b82f6" />
                <polygon points="137,-10 140,-18 143,-10" fill="#93c5fd" opacity="0.3" />
              </motion.g>
            )}
            {fill > 75 && (
              <motion.g animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }}>
                <polygon points="105,-18 110,-30 115,-18" fill="#a855f7" />
                <polygon points="107,-18 110,-26 113,-18" fill="#d8b4fe" opacity="0.3" />
              </motion.g>
            )}

            {/* Crown treasure piece */}
            {fill > 85 && (
              <motion.g
                animate={{ y: [0, -3, 0], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <path d="M95,-25 L100,-38 L105,-30 L110,-40 L115,-30 L120,-38 L125,-25 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
              </motion.g>
            )}
          </motion.g>
        </g>

        {/* Chest lid */}
        <motion.g
          style={{ transformOrigin: '30px 125px' }}
          animate={{ rotate: -lidAngle }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <path d="M30,125 Q30,88 110,82 Q190,88 190,125 Z" fill="url(#woodGrad2)" stroke="#78350f" strokeWidth="2.5" />
          <path d="M30,122 Q30,98 110,93 Q190,98 190,122" fill="none" stroke="url(#metalBand)" strokeWidth="5" opacity="0.45" />
          {/* Lid wood grain */}
          <path d="M50,110 Q110,105 170,110" stroke="#6b3a10" strokeWidth="0.7" fill="none" opacity="0.25" />
        </motion.g>

        {/* Lock / clasp - more detailed */}
        <g>
          <rect x="98" y="118" width="24" height="22" rx="4" fill="url(#metalBand)" opacity="0.8" />
          <circle cx="110" cy="130" r="4" fill="#57534e" />
          <circle cx="110" cy="130" r="2" fill="#44403c" />
          <rect x="108" y="130" width="4" height="6" rx="1" fill="#57534e" />
        </g>

        {/* Light rays from open lid at high progress */}
        {fill > 60 && (
          <motion.g
            animate={{ opacity: [0.05, 0.2, 0.05] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <polygon points="90,120 85,60 95,60" fill="#fbbf24" opacity="0.15" />
            <polygon points="110,118 107,55 113,55" fill="#fbbf24" opacity="0.2" />
            <polygon points="130,120 125,60 135,60" fill="#fbbf24" opacity="0.15" />
          </motion.g>
        )}
      </svg>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-amber-300/90 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(fill)}% filled
      </motion.div>
    </div>
  );
}