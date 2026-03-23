import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function StarConstellationVisual({ progress }) {
  const lit = Math.min(progress, 100);

  const stars = useMemo(() => [
    { x: 110, y: 50, r: 5 },
    { x: 65, y: 90, r: 4 },
    { x: 155, y: 85, r: 4.5 },
    { x: 45, y: 145, r: 3.5 },
    { x: 175, y: 140, r: 4 },
    { x: 80, y: 180, r: 4.5 },
    { x: 140, y: 185, r: 4 },
    { x: 110, y: 230, r: 5 },
    { x: 55, y: 220, r: 3.5 },
    { x: 165, y: 225, r: 3.5 },
  ], []);

  const connections = useMemo(() => [
    [0, 1], [0, 2], [1, 3], [2, 4], [1, 5], [2, 6],
    [5, 7], [6, 7], [3, 8], [4, 9], [8, 7], [9, 7],
  ], []);

  const litStarCount = Math.floor((lit / 100) * stars.length);
  const litConnections = Math.floor((lit / 100) * connections.length);

  return (
    <div className="relative w-56 h-72 mx-auto">
      {/* Twinkling background stars */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: 1 + Math.random() * 2,
            height: 1 + Math.random() * 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{ opacity: [0, 0.6, 0] }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      <svg viewBox="0 0 220 280" className="w-full h-full">
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
          <filter id="starBlur">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Nebula cloud background */}
        <motion.ellipse
          cx="110" cy="140" rx="80" ry="90"
          fill="#7c3aed" opacity="0.06"
          animate={{ rx: [80, 85, 80], ry: [90, 95, 90] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.ellipse
          cx="90" cy="120" rx="50" ry="60"
          fill="#3b82f6" opacity="0.05"
          animate={{ rx: [50, 55, 50] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />

        {/* Constellation lines */}
        {connections.slice(0, litConnections).map(([a, b], i) => (
          <motion.line
            key={`line-${i}`}
            x1={stars[a].x} y1={stars[a].y}
            x2={stars[b].x} y2={stars[b].y}
            stroke="#fbbf24"
            strokeWidth="1.2"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 0.4, pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.5 + i * 0.15 }}
          />
        ))}

        {/* Stars */}
        {stars.map((star, i) => {
          const isLit = i < litStarCount;
          return (
            <g key={i}>
              {/* Outer glow */}
              {isLit && (
                <motion.circle
                  cx={star.x} cy={star.y} r={star.r * 3}
                  fill="#fbbf24" opacity="0"
                  animate={{ opacity: [0.05, 0.15, 0.05] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                />
              )}
              {/* Star point shape */}
              <motion.circle
                cx={star.x} cy={star.y} r={star.r}
                fill={isLit ? '#fbbf24' : '#475569'}
                filter={isLit ? 'url(#starBlur)' : undefined}
                initial={{ scale: 0 }}
                animate={{ scale: 1, opacity: isLit ? 1 : 0.3 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              />
              {/* Cross sparkle on lit stars */}
              {isLit && (
                <motion.g
                  animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                  style={{ transformOrigin: `${star.x}px ${star.y}px` }}
                >
                  <line x1={star.x} y1={star.y - star.r * 2} x2={star.x} y2={star.y + star.r * 2} stroke="#fbbf24" strokeWidth="0.8" opacity="0.5" />
                  <line x1={star.x - star.r * 2} y1={star.y} x2={star.x + star.r * 2} y2={star.y} stroke="#fbbf24" strokeWidth="0.8" opacity="0.5" />
                </motion.g>
              )}
            </g>
          );
        })}

        {/* Shooting star at high progress */}
        {lit > 70 && (
          <motion.g
            animate={{
              x: [220, -30],
              y: [-10, 100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 5,
              ease: 'easeIn',
            }}
          >
            <circle cx="0" cy="0" r="2" fill="white" />
            <line x1="0" y1="0" x2="15" y2="-6" stroke="white" strokeWidth="1.5" opacity="0.6" />
            <line x1="0" y1="0" x2="25" y2="-8" stroke="white" strokeWidth="0.8" opacity="0.3" />
          </motion.g>
        )}
      </svg>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-amber-300/80 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(lit)}% illuminated
      </motion.div>
    </div>
  );
}