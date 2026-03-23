import React from 'react';
import { motion } from 'framer-motion';

export default function WorldTreeVisual({ progress }) {
  const growth = Math.min(progress, 100);
  const trunkHeight = 60 + (growth / 100) * 110;
  const crownSize = 20 + (growth / 100) * 85;

  return (
    <div className="relative w-60 h-80 mx-auto">
      {/* Floating leaf particles */}
      {growth > 15 && [...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-base"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${5 + Math.random() * 50}%`,
          }}
          animate={{
            y: [-5, 25, -5],
            x: [-5, 8, -5],
            rotate: [0, 30, -15, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        >
          {['🍃', '🌿', '✨', '🍂'][i % 4]}
        </motion.div>
      ))}

      {/* Fireflies at night */}
      {growth > 40 && [...Array(6)].map((_, i) => (
        <motion.div
          key={`fly-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 60}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5],
            x: [0, (Math.random() - 0.5) * 20, 0],
            y: [0, (Math.random() - 0.5) * 15, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      <svg viewBox="0 0 240 320" className="w-full h-full">
        <defs>
          <radialGradient id="treeGlow2" cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#22c55e" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="crownGrad2" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="30%" stopColor="#4ade80" />
            <stop offset="65%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>
          <linearGradient id="trunkGrad2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5c2d0e" />
            <stop offset="30%" stopColor="#78350f" />
            <stop offset="50%" stopColor="#92400e" />
            <stop offset="70%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#5c2d0e" />
          </linearGradient>
          <filter id="foliageGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient glow */}
        <ellipse cx="120" cy="140" rx="110" ry="130" fill="url(#treeGlow2)" />

        {/* Grass ground */}
        <ellipse cx="120" cy="290" rx="90" ry="15" fill="#15803d" opacity="0.25" />
        {/* Small grass blades */}
        {[...Array(10)].map((_, i) => (
          <motion.line
            key={`grass-${i}`}
            x1={40 + i * 18} y1="290"
            x2={38 + i * 18 + (Math.random() - 0.5) * 6} y2={283 - Math.random() * 8}
            stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"
            animate={{ x2: [38 + i * 18 - 2, 38 + i * 18 + 2, 38 + i * 18 - 2] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}

        {/* Roots - more detailed */}
        {growth > 5 && (
          <motion.g opacity={Math.min(growth / 25, 1)}>
            <path d="M105,285 Q75,290 45,296" stroke="#5c2d0e" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M135,285 Q160,292 185,298" stroke="#5c2d0e" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M115,287 Q90,300 65,308" stroke="#78350f" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M125,288 Q145,302 170,306" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
          </motion.g>
        )}

        {/* Trunk - tapered */}
        <motion.path
          d={`M107,290 Q105,${290 - trunkHeight / 2} 108,${290 - trunkHeight} L132,${290 - trunkHeight} Q135,${290 - trunkHeight / 2} 133,290 Z`}
          fill="url(#trunkGrad2)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />
        {/* Bark texture */}
        <motion.g opacity={Math.min(growth / 50, 0.4)}>
          <path d={`M115,${290 - trunkHeight * 0.3} Q118,${290 - trunkHeight * 0.4} 115,${290 - trunkHeight * 0.5}`} stroke="#5c2d0e" strokeWidth="1" fill="none" />
          <path d={`M125,${290 - trunkHeight * 0.5} Q122,${290 - trunkHeight * 0.6} 125,${290 - trunkHeight * 0.7}`} stroke="#5c2d0e" strokeWidth="1" fill="none" />
        </motion.g>

        {/* Branches */}
        {growth > 25 && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}>
            <path d={`M120,${290 - trunkHeight + 25} Q85,${290 - trunkHeight + 5} 55,${290 - trunkHeight - 5}`} stroke="#78350f" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d={`M120,${290 - trunkHeight + 25} Q155,${290 - trunkHeight + 5} 180,${290 - trunkHeight - 5}`} stroke="#78350f" strokeWidth="5.5" fill="none" strokeLinecap="round" />
            {growth > 50 && (
              <>
                <path d={`M90,${290 - trunkHeight + 12} Q65,${290 - trunkHeight - 15} 48,${290 - trunkHeight - 25}`} stroke="#78350f" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d={`M150,${290 - trunkHeight + 12} Q170,${290 - trunkHeight - 10} 185,${290 - trunkHeight - 20}`} stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
              </>
            )}
          </motion.g>
        )}

        {/* Crown / Foliage - layered */}
        {growth > 12 && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3 }}
            style={{ transformOrigin: `120px ${290 - trunkHeight}px` }}
            filter="url(#foliageGlow)"
          >
            {/* Back foliage layer */}
            <ellipse cx="120" cy={290 - trunkHeight - crownSize * 0.35} rx={crownSize * 1.05} ry={crownSize * 0.75} fill="#16a34a" opacity="0.7" />
            {/* Side clusters */}
            <ellipse cx={120 - crownSize * 0.5} cy={290 - trunkHeight - crownSize * 0.1} rx={crownSize * 0.6} ry={crownSize * 0.55} fill="#22c55e" opacity="0.8" />
            <ellipse cx={120 + crownSize * 0.5} cy={290 - trunkHeight - crownSize * 0.1} rx={crownSize * 0.6} ry={crownSize * 0.55} fill="#22c55e" opacity="0.8" />
            {/* Main crown */}
            <ellipse cx="120" cy={290 - trunkHeight - crownSize * 0.3} rx={crownSize} ry={crownSize * 0.7} fill="url(#crownGrad2)" opacity="0.9" />
            {/* Highlight */}
            <ellipse cx="105" cy={290 - trunkHeight - crownSize * 0.45} rx={crownSize * 0.3} ry={crownSize * 0.2} fill="#86efac" opacity="0.3" />
          </motion.g>
        )}

        {/* Glowing fruits */}
        {growth > 55 && [...Array(Math.min(Math.floor((growth - 55) / 7), 7))].map((_, i) => (
          <motion.g key={i}>
            <motion.circle
              cx={65 + i * 18} cy={290 - trunkHeight - crownSize * 0.2 + (i % 3 === 0 ? -12 : i % 3 === 1 ? 5 : -3)}
              r="5" fill="#fbbf24"
              animate={{ opacity: [0.5, 1, 0.5], r: [4, 6.5, 4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }}
            />
            {/* Fruit glow */}
            <motion.circle
              cx={65 + i * 18} cy={290 - trunkHeight - crownSize * 0.2 + (i % 3 === 0 ? -12 : i % 3 === 1 ? 5 : -3)}
              r="10" fill="#fbbf24" opacity="0"
              animate={{ opacity: [0, 0.15, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.25 }}
            />
          </motion.g>
        ))}

        {/* Magic aura at 90%+ */}
        {growth > 90 && (
          <motion.ellipse
            cx="120" cy={290 - trunkHeight - crownSize * 0.2}
            rx={crownSize * 1.2} ry={crownSize * 0.9}
            fill="none" stroke="#86efac" strokeWidth="1.5"
            animate={{ opacity: [0, 0.3, 0], rx: [crownSize * 1.1, crownSize * 1.3, crownSize * 1.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}
      </svg>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-emerald-300/90 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(growth)}% grown
      </motion.div>
    </div>
  );
}