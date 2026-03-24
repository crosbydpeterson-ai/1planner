import React from 'react';
import { motion } from 'framer-motion';

export default function StarlightFestivalVisual({ progress }) {
  const fill = Math.min(progress, 100);
  const starsLit = Math.floor((fill / 100) * 12);
  const lanternCount = Math.floor((fill / 100) * 6);

  return (
    <div className="relative w-56 h-72 mx-auto">
      {/* Stardust particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: ['#fde68a', '#c4b5fd', '#93c5fd', '#fca5a5'][i % 4],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 85}%`,
          }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.3, 1.2, 0.3],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}

      <svg viewBox="0 0 220 280" className="w-full h-full drop-shadow-xl">
        <defs>
          <radialGradient id="festGlow" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#818cf8" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fde68a" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Night sky glow */}
        <ellipse cx="110" cy="130" rx="105" ry="120" fill="url(#festGlow)" />

        {/* Stars in the sky - light up with progress */}
        {[
          [35, 30], [70, 20], [110, 15], [150, 22], [185, 35],
          [25, 65], [60, 55], [100, 48], [140, 52], [175, 60],
          [50, 90], [155, 85],
        ].map(([x, y], i) => {
          const lit = i < starsLit;
          return (
            <motion.g key={`star-${i}`}>
              {lit && (
                <motion.circle
                  cx={x} cy={y} r="6" fill="url(#starGlow)"
                  animate={{ opacity: [0.3, 0.7, 0.3], r: [5, 7, 5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                />
              )}
              <motion.polygon
                points={`${x},${y - 4} ${x + 1.5},${y - 1} ${x + 4},${y - 1} ${x + 2},${y + 1.5} ${x + 3},${y + 4} ${x},${y + 2.5} ${x - 3},${y + 4} ${x - 2},${y + 1.5} ${x - 4},${y - 1} ${x - 1.5},${y - 1}`}
                fill={lit ? '#fde68a' : '#4b5563'}
                animate={lit ? { opacity: [0.7, 1, 0.7] } : {}}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
              />
            </motion.g>
          );
        })}

        {/* Ground / festival area */}
        <path d="M0,230 Q55,220 110,222 Q165,220 220,230 L220,280 L0,280 Z" fill="#1e1b4b" />
        <path d="M0,235 Q55,228 110,230 Q165,228 220,235 L220,280 L0,280 Z" fill="#312e81" opacity="0.5" />

        {/* Festival tree / pole */}
        <rect x="106" y="140" width="8" height="92" fill="#78716c" rx="2" />

        {/* Central star topper */}
        <motion.g
          animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{ transformOrigin: '110px 130px' }}
        >
          <polygon
            points="110,118 113,127 122,127 115,132 117,141 110,136 103,141 105,132 98,127 107,127"
            fill="#fbbf24" stroke="#f59e0b" strokeWidth="1"
          />
        </motion.g>

        {/* Hanging lanterns */}
        {[...Array(lanternCount)].map((_, i) => {
          const lx = 60 + i * 22;
          const ly = 160 + (i % 2) * 15;
          const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#c084fc', '#fb923c'];
          return (
            <motion.g key={`lantern-${i}`}
              animate={{ y: [0, -3, 0], rotate: [-2, 2, -2] }}
              transition={{ duration: 3 + i * 0.3, repeat: Infinity }}
              style={{ transformOrigin: `${lx}px ${ly - 8}px` }}
            >
              <line x1={lx} y1={ly - 14} x2={lx} y2={ly - 5} stroke="#a8a29e" strokeWidth="0.8" />
              <rect x={lx - 5} y={ly - 5} width="10" height="14" rx="3" fill={colors[i]} opacity="0.8" />
              <motion.rect
                x={lx - 5} y={ly - 5} width="10" height="14" rx="3"
                fill="white" opacity="0.15"
                animate={{ opacity: [0.1, 0.25, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              />
            </motion.g>
          );
        })}

        {/* Connection strings from pole to lanterns */}
        {lanternCount > 0 && (
          <path d={`M110,150 Q85,155 60,${160}`} stroke="#a8a29e" strokeWidth="0.5" fill="none" opacity="0.5" />
        )}
        {lanternCount > 2 && (
          <path d={`M110,150 Q135,155 160,${160}`} stroke="#a8a29e" strokeWidth="0.5" fill="none" opacity="0.5" />
        )}

        {/* Shooting star at high progress */}
        {fill > 70 && (
          <motion.g
            animate={{ x: [0, 80], y: [0, 40], opacity: [1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
          >
            <circle cx="30" cy="30" r="2" fill="#fde68a" />
            <line x1="30" y1="30" x2="20" y2="25" stroke="#fde68a" strokeWidth="1.5" opacity="0.5" />
          </motion.g>
        )}

        {/* Nebula wisps at high progress */}
        {fill > 50 && (
          <motion.ellipse
            cx="110" cy="80" rx="50" ry="20"
            fill="#c084fc" opacity="0.05"
            animate={{ opacity: [0.03, 0.08, 0.03], rx: [45, 55, 45] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        )}
      </svg>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-violet-300/90 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(fill)}% lit
      </motion.div>
    </div>
  );
}