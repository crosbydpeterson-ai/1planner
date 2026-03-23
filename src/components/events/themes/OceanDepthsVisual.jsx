import React from 'react';
import { motion } from 'framer-motion';

export default function OceanDepthsVisual({ progress }) {
  const depth = Math.min(progress, 100);

  return (
    <div className="relative w-56 h-72 mx-auto">
      {/* Bubble particles */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-cyan-300/30"
          style={{
            width: 4 + Math.random() * 8,
            height: 4 + Math.random() * 8,
            left: `${15 + Math.random() * 70}%`,
            bottom: `${5 + Math.random() * 30}%`,
          }}
          animate={{
            y: [0, -120 - Math.random() * 80],
            x: [0, (Math.random() - 0.5) * 20],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      <svg viewBox="0 0 220 300" className="w-full h-full">
        <defs>
          <radialGradient id="oceanGlow" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0e7490" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#0891b2" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#164e63" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="pearlGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f0fdfa" />
            <stop offset="100%" stopColor="#99f6e4" />
          </linearGradient>
        </defs>

        {/* Deep glow */}
        <ellipse cx="110" cy="170" rx="100" ry="120" fill="url(#oceanGlow)" />

        {/* Water background */}
        <rect x="20" y="20" width="180" height="260" rx="20" fill="url(#waterGrad)" />

        {/* Light rays from surface */}
        <motion.g
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <polygon points="70,20 90,120 60,120" fill="white" opacity="0.08" />
          <polygon points="120,20 140,100 110,100" fill="white" opacity="0.06" />
          <polygon points="160,20 170,90 150,90" fill="white" opacity="0.05" />
        </motion.g>

        {/* Seaweed */}
        <motion.path
          d="M45,280 Q50,240 42,200 Q48,170 40,140"
          stroke="#059669" strokeWidth="4" fill="none" strokeLinecap="round"
          animate={{ d: [
            "M45,280 Q50,240 42,200 Q48,170 40,140",
            "M45,280 Q40,240 48,200 Q42,170 46,140",
            "M45,280 Q50,240 42,200 Q48,170 40,140",
          ]}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          opacity={0.5 + depth / 200}
        />
        <motion.path
          d="M175,280 Q170,250 178,220 Q172,190 176,165"
          stroke="#10b981" strokeWidth="3.5" fill="none" strokeLinecap="round"
          animate={{ d: [
            "M175,280 Q170,250 178,220 Q172,190 176,165",
            "M175,280 Q180,250 172,220 Q178,190 174,165",
            "M175,280 Q170,250 178,220 Q172,190 176,165",
          ]}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          opacity={0.4 + depth / 200}
        />

        {/* Giant clam shell */}
        <motion.g
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {/* Bottom shell */}
          <path d="M65,235 Q110,260 155,235 Q155,250 110,265 Q65,250 65,235Z" fill="#a8a29e" stroke="#78716c" strokeWidth="1.5" />
          {/* Shell ridges */}
          <path d="M75,240 Q110,255 145,240" stroke="#78716c" strokeWidth="0.8" fill="none" opacity="0.5" />
          <path d="M80,245 Q110,258 140,245" stroke="#78716c" strokeWidth="0.8" fill="none" opacity="0.5" />

          {/* Top shell - opens based on progress */}
          <motion.path
            d={`M65,235 Q110,${235 - depth * 0.4} 155,235 Q155,220 110,${215 - depth * 0.3} Q65,220 65,235Z`}
            fill="#d6d3d1" stroke="#a8a29e" strokeWidth="1.5"
          />

          {/* Pearl inside */}
          {depth > 15 && (
            <motion.g>
              <motion.circle
                cx="110" cy="240" r={8 + depth / 15}
                fill="url(#pearlGrad)"
                animate={{
                  filter: ['drop-shadow(0 0 4px #99f6e4)', 'drop-shadow(0 0 12px #5eead4)', 'drop-shadow(0 0 4px #99f6e4)'],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <circle cx="106" cy="236" r="3" fill="white" opacity="0.6" />
            </motion.g>
          )}
        </motion.g>

        {/* Fish swimming */}
        {depth > 25 && (
          <motion.g
            animate={{ x: [-30, 250] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <ellipse cx="0" cy="120" rx="12" ry="6" fill="#f97316" opacity="0.7" />
            <polygon points="-14,120 -8,114 -8,126" fill="#f97316" opacity="0.7" />
            <circle cx="6" cy="118" r="1.5" fill="#1e1e1e" />
          </motion.g>
        )}
        {depth > 50 && (
          <motion.g
            animate={{ x: [250, -30] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear', delay: 2 }}
          >
            <ellipse cx="0" cy="160" rx="10" ry="5" fill="#3b82f6" opacity="0.6" />
            <polygon points="12,160 6,155 6,165" fill="#3b82f6" opacity="0.6" />
            <circle cx="-5" cy="158" r="1.2" fill="#1e1e1e" />
          </motion.g>
        )}

        {/* Sandy bottom */}
        <ellipse cx="110" cy="278" rx="85" ry="8" fill="#d4a574" opacity="0.2" />

        {/* Small coral */}
        <circle cx="55" cy="270" r="6" fill="#fb7185" opacity="0.4" />
        <circle cx="60" cy="265" r="4" fill="#f472b6" opacity="0.35" />
        <circle cx="165" cy="272" r="5" fill="#c084fc" opacity="0.35" />
        <circle cx="160" cy="267" r="3.5" fill="#a78bfa" opacity="0.3" />
      </svg>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-teal-300/80 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(depth)}% discovered
      </motion.div>
    </div>
  );
}