import React from 'react';
import { motion } from 'framer-motion';

export default function SkyFortressVisual({ progress }) {
  const fill = Math.min(progress, 100);
  const bridgeSections = Math.floor((fill / 100) * 5);
  const gearSpeed = 4 - (fill / 100) * 2;

  return (
    <div className="relative w-56 h-72 mx-auto">
      {/* Clouds drifting */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{
            width: 30 + Math.random() * 40,
            height: 10 + Math.random() * 8,
            top: `${10 + Math.random() * 70}%`,
            left: '-20%',
          }}
          animate={{ x: ['0%', '400%'] }}
          transition={{
            duration: 12 + Math.random() * 10,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: 'linear',
          }}
        />
      ))}

      {/* Wind particles */}
      {fill > 20 && [...Array(8)].map((_, i) => (
        <motion.div
          key={`wind-${i}`}
          className="absolute w-6 h-px bg-white/20"
          style={{
            top: `${15 + Math.random() * 65}%`,
            left: '-10%',
          }}
          animate={{ x: [0, 300], opacity: [0, 0.5, 0] }}
          transition={{
            duration: 1.5 + Math.random() * 1,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      <svg viewBox="0 0 220 280" className="w-full h-full drop-shadow-xl">
        <defs>
          <linearGradient id="skyStone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="50%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          <linearGradient id="skyMetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d4d4d8" />
            <stop offset="50%" stopColor="#a1a1aa" />
            <stop offset="100%" stopColor="#71717a" />
          </linearGradient>
          <linearGradient id="skyGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {/* Floating island base */}
        <path d="M40,180 Q50,220 80,235 Q110,245 140,235 Q170,220 180,180" fill="#57534e" />
        <path d="M40,180 Q60,200 110,205 Q160,200 180,180" fill="#6b7280" />
        {/* Stalactites under island */}
        <path d="M70,225 L75,250 L80,225" fill="#44403c" />
        <path d="M110,235 L115,260 L120,235" fill="#44403c" />
        <path d="M145,228 L150,248 L155,228" fill="#44403c" />

        {/* Fortress main structure */}
        <rect x="55" y="100" width="110" height="82" fill="url(#skyStone)" rx="3" />
        {/* Fortress windows */}
        {[...Array(3)].map((_, i) => (
          <motion.rect
            key={`win-${i}`} x={72 + i * 28} y="118" width="12" height="16" rx="6"
            fill={fill > 30 + i * 20 ? '#60a5fa' : '#1f2937'}
            animate={fill > 30 + i * 20 ? { opacity: [0.6, 1, 0.6] } : {}}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}

        {/* Towers */}
        <rect x="45" y="70" width="30" height="112" fill="url(#skyStone)" rx="2" />
        <rect x="145" y="70" width="30" height="112" fill="url(#skyStone)" rx="2" />
        {/* Tower roofs */}
        <polygon points="42,70 60,40 78,70" fill="#4b5563" />
        <polygon points="142,70 160,40 178,70" fill="#4b5563" />
        {/* Flags */}
        <line x1="60" y1="40" x2="60" y2="25" stroke="#71717a" strokeWidth="1.5" />
        <line x1="160" y1="40" x2="160" y2="25" stroke="#71717a" strokeWidth="1.5" />
        <motion.polygon
          points="60,25 75,30 60,35" fill="#3b82f6"
          animate={{ scaleX: [1, 0.85, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: '60px 30px' }}
        />
        <motion.polygon
          points="160,25 175,30 160,35" fill="#3b82f6"
          animate={{ scaleX: [1, 0.85, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          style={{ transformOrigin: '160px 30px' }}
        />

        {/* Gears */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: gearSpeed, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '110px 160px' }}
        >
          <circle cx="110" cy="160" r="12" fill="none" stroke="url(#skyMetal)" strokeWidth="3" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <line key={a} x1="110" y1="160" x2={110 + Math.cos(a * Math.PI / 180) * 14} y2={160 + Math.sin(a * Math.PI / 180) * 14}
              stroke="#a1a1aa" strokeWidth="2"
            />
          ))}
        </motion.g>
        <circle cx="110" cy="160" r="4" fill="#71717a" />

        {/* Bridge sections building from left */}
        {[...Array(5)].map((_, i) => {
          if (i >= bridgeSections) return null;
          return (
            <motion.rect
              key={`bridge-${i}`}
              x={5 + i * 8} y="175" width="7" height="4" rx="1"
              fill="url(#skyMetal)"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
            />
          );
        })}

        {/* Propeller under island */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '110px 248px' }}
        >
          <ellipse cx="110" cy="248" rx="20" ry="3" fill="#a1a1aa" opacity="0.5" />
          <ellipse cx="110" cy="248" rx="3" ry="20" fill="#a1a1aa" opacity="0.5" />
        </motion.g>

        {/* Energy beam at high progress */}
        {fill > 75 && (
          <motion.line
            x1="110" y1="100" x2="110" y2="20"
            stroke="url(#skyGlow)" strokeWidth="3" strokeLinecap="round"
            animate={{ opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </svg>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-blue-300/90 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(fill)}% ascended
      </motion.div>
    </div>
  );
}