import React from 'react';
import { motion } from 'framer-motion';

export default function ElementalConfluxVisual({ progress }) {
  const fill = Math.min(progress, 100);
  const activeElements = Math.floor((fill / 100) * 4);
  const portalIntensity = fill / 100;

  const elements = [
    { name: 'Fire', color: '#ef4444', glow: '#fca5a5', cx: 60, cy: 100, emoji: '🔥' },
    { name: 'Water', color: '#3b82f6', glow: '#93c5fd', cx: 160, cy: 100, emoji: '💧' },
    { name: 'Earth', color: '#22c55e', glow: '#86efac', cx: 60, cy: 190, emoji: '🌿' },
    { name: 'Air', color: '#a78bfa', glow: '#c4b5fd', cx: 160, cy: 190, emoji: '💨' },
  ];

  return (
    <div className="relative w-56 h-72 mx-auto">
      {/* Elemental energy particles */}
      {fill > 10 && [...Array(12)].map((_, i) => {
        const elem = elements[i % 4];
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              background: elem.color,
              left: `${20 + Math.random() * 60}%`,
              top: `${15 + Math.random() * 65}%`,
            }}
            animate={{
              x: [0, (Math.random() - 0.5) * 40, 0],
              y: [0, (Math.random() - 0.5) * 40, 0],
              opacity: [0, 0.7, 0],
              scale: [0.3, 1.2, 0.3],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 4,
            }}
          />
        );
      })}

      <svg viewBox="0 0 220 280" className="w-full h-full drop-shadow-xl">
        <defs>
          {elements.map((el, i) => (
            <radialGradient key={`grad-${i}`} id={`elemGrad${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={el.glow} stopOpacity="0.6" />
              <stop offset="100%" stopColor={el.color} stopOpacity="0" />
            </radialGradient>
          ))}
          <radialGradient id="portalGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity={0.15 * portalIntensity} />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity={0.1 * portalIntensity} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
          <filter id="elemBlur">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* Central portal */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '110px 145px' }}
        >
          <circle cx="110" cy="145" r={25 + fill * 0.2} fill="url(#portalGrad)" />
          <circle cx="110" cy="145" r={20 + fill * 0.15} fill="none"
            stroke="#818cf8" strokeWidth="1" strokeDasharray="4 4" opacity={0.2 + portalIntensity * 0.3}
          />
        </motion.g>
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '110px 145px' }}
        >
          <circle cx="110" cy="145" r={32 + fill * 0.15} fill="none"
            stroke="#c4b5fd" strokeWidth="0.8" strokeDasharray="6 8" opacity={0.15 + portalIntensity * 0.2}
          />
        </motion.g>

        {/* Central rune */}
        <motion.circle
          cx="110" cy="145" r={6 + fill * 0.04}
          fill="white" opacity={0.1 + portalIntensity * 0.4}
          animate={{ opacity: [0.1 + portalIntensity * 0.2, 0.3 + portalIntensity * 0.4, 0.1 + portalIntensity * 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Elemental orbs */}
        {elements.map((el, i) => {
          const active = i < activeElements;
          return (
            <motion.g key={`elem-${i}`}>
              {/* Glow */}
              {active && (
                <motion.circle
                  cx={el.cx} cy={el.cy} r="25"
                  fill={`url(#elemGrad${i})`}
                  animate={{ opacity: [0.3, 0.7, 0.3], r: [22, 28, 22] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
              )}

              {/* Orb */}
              <motion.circle
                cx={el.cx} cy={el.cy} r="16"
                fill={active ? el.color : '#374151'} opacity={active ? 0.9 : 0.3}
                animate={active ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                style={{ transformOrigin: `${el.cx}px ${el.cy}px` }}
              />
              <circle cx={el.cx} cy={el.cy} r="8"
                fill={active ? el.glow : '#4b5563'} opacity={active ? 0.3 : 0.1}
              />
              {/* Inner shine */}
              <circle cx={el.cx - 4} cy={el.cy - 4} r="3"
                fill="white" opacity={active ? 0.2 : 0.05}
              />

              {/* Energy beam to center when active */}
              {active && (
                <motion.line
                  x1={el.cx} y1={el.cy}
                  x2="110" y2="145"
                  stroke={el.color} strokeWidth="2" strokeLinecap="round"
                  animate={{ opacity: [0.1, 0.5, 0.1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                />
              )}

              {/* Label */}
              <text x={el.cx} y={el.cy + 28} textAnchor="middle"
                fill={active ? el.color : '#6b7280'} fontSize="8" fontWeight="600"
              >
                {el.name}
              </text>
            </motion.g>
          );
        })}

        {/* Rune circle around everything at high progress */}
        {fill > 60 && (
          <motion.circle
            cx="110" cy="145" r="85" fill="none"
            stroke="#818cf8" strokeWidth="1" strokeDasharray="3 6"
            opacity={0.15}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: '110px 145px' }}
          />
        )}

        {/* Energy eruption at near-complete */}
        {fill > 90 && (
          <motion.g
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {[0, 90, 180, 270].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <motion.line
                  key={angle}
                  x1={110 + Math.cos(rad) * 10} y1={145 + Math.sin(rad) * 10}
                  x2={110 + Math.cos(rad) * 50} y2={145 + Math.sin(rad) * 50}
                  stroke="white" strokeWidth="1.5" strokeLinecap="round"
                  opacity="0.3"
                />
              );
            })}
          </motion.g>
        )}
      </svg>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-indigo-300/90 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(fill)}% balanced
      </motion.div>
    </div>
  );
}