import React from 'react';
import { motion } from 'framer-motion';

export default function WorldTreeVisual({ progress }) {
  const growth = Math.min(progress, 100);
  
  const leafCount = Math.floor((growth / 100) * 20);
  const trunkHeight = 60 + (growth / 100) * 100;
  const crownSize = 20 + (growth / 100) * 80;

  return (
    <div className="relative w-56 h-72 mx-auto">
      {/* Floating leaf particles */}
      {growth > 20 && [...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-lg"
          style={{
            left: `${15 + Math.random() * 70}%`,
            top: `${10 + Math.random() * 40}%`,
          }}
          animate={{
            y: [-5, 15, -5],
            x: [-3, 5, -3],
            rotate: [0, 20, -10, 0],
            opacity: [0, 0.7, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        >
          🍃
        </motion.div>
      ))}

      <svg viewBox="0 0 220 300" className="w-full h-full">
        <defs>
          <radialGradient id="treeGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="crownGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="60%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>
          <linearGradient id="trunkGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="50%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>

        {/* Glow */}
        <ellipse cx="110" cy="130" rx="100" ry="120" fill="url(#treeGlow)" />

        {/* Ground */}
        <ellipse cx="110" cy="275" rx="70" ry="12" fill="#15803d" opacity="0.3" />

        {/* Roots */}
        {growth > 5 && (
          <g opacity={Math.min(growth / 30, 1)}>
            <path d="M95,270 Q70,275 50,280" stroke="#78350f" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M115,270 Q140,278 165,282" stroke="#78350f" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M105,272 Q85,285 70,290" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* Trunk */}
        <motion.rect
          x="97"
          width="26"
          rx="6"
          fill="url(#trunkGrad)"
          initial={{ y: 275, height: 0 }}
          animate={{ y: 275 - trunkHeight, height: trunkHeight }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {/* Branches */}
        {growth > 30 && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <path d={`M110,${275 - trunkHeight + 30} Q80,${275 - trunkHeight + 10} 60,${275 - trunkHeight + 5}`} stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d={`M110,${275 - trunkHeight + 30} Q140,${275 - trunkHeight + 10} 155,${275 - trunkHeight + 5}`} stroke="#78350f" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          </motion.g>
        )}

        {/* Crown / Foliage */}
        {growth > 15 && (
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            style={{ transformOrigin: '110px ' + (275 - trunkHeight) + 'px' }}
          >
            <ellipse cx="110" cy={275 - trunkHeight - crownSize * 0.3} rx={crownSize} ry={crownSize * 0.7} fill="url(#crownGrad)" opacity="0.9" />
            <ellipse cx="80" cy={275 - trunkHeight - crownSize * 0.1} rx={crownSize * 0.55} ry={crownSize * 0.5} fill="#22c55e" opacity="0.8" />
            <ellipse cx="140" cy={275 - trunkHeight - crownSize * 0.1} rx={crownSize * 0.55} ry={crownSize * 0.5} fill="#22c55e" opacity="0.8" />
          </motion.g>
        )}

        {/* Glowing fruits at high progress */}
        {growth > 60 && [...Array(Math.min(Math.floor((growth - 60) / 8), 5))].map((_, i) => (
          <motion.circle
            key={i}
            cx={75 + i * 18}
            cy={275 - trunkHeight - crownSize * 0.2 + (i % 2 === 0 ? -8 : 8)}
            r="5"
            fill="#fbbf24"
            animate={{ opacity: [0.5, 1, 0.5], r: [4, 6, 4] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </svg>

      {/* Growth label */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-emerald-300/80 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(growth)}% grown
      </motion.div>
    </div>
  );
}