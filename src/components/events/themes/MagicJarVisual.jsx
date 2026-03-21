import React from 'react';
import { motion } from 'framer-motion';

export default function MagicJarVisual({ progress }) {
  const fillHeight = Math.min(progress, 100);
  
  // Color shifts as jar fills
  const getGlowColor = () => {
    if (fillHeight > 80) return '#a855f7';
    if (fillHeight > 50) return '#8b5cf6';
    if (fillHeight > 25) return '#7c3aed';
    return '#6d28d9';
  };

  return (
    <div className="relative w-48 h-64 mx-auto">
      {/* Floating particles */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: `radial-gradient(circle, ${getGlowColor()}, transparent)`,
            left: `${20 + Math.random() * 60}%`,
            bottom: `${10 + Math.random() * 70}%`,
          }}
          animate={{
            y: [-10, -30, -10],
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Jar SVG */}
      <svg viewBox="0 0 200 280" className="w-full h-full drop-shadow-2xl">
        {/* Glow behind jar */}
        <defs>
          <radialGradient id="jarGlow" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor={getGlowColor()} stopOpacity="0.3" />
            <stop offset="100%" stopColor={getGlowColor()} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="glassShine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0.15" />
            <stop offset="30%" stopColor="white" stopOpacity="0.05" />
            <stop offset="70%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
          <clipPath id="jarBody">
            <path d="M55,70 Q45,90 40,120 Q35,180 40,220 Q45,250 60,260 Q80,270 100,270 Q120,270 140,260 Q155,250 160,220 Q165,180 160,120 Q155,90 145,70 Z" />
          </clipPath>
        </defs>

        {/* Outer glow */}
        <ellipse cx="100" cy="170" rx="90" ry="110" fill="url(#jarGlow)" />

        {/* Liquid inside jar (clipped) */}
        <g clipPath="url(#jarBody)">
          <motion.rect
            x="30"
            width="140"
            height="210"
            fill="url(#liquidGrad)"
            initial={{ y: 270 }}
            animate={{ y: 270 - (fillHeight / 100) * 210 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          {/* Liquid surface wobble */}
          <motion.ellipse
            cx="100"
            rx="70"
            ry="8"
            fill="#c084fc"
            fillOpacity="0.5"
            initial={{ cy: 270 }}
            animate={{ cy: 270 - (fillHeight / 100) * 210 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          {/* Bubbles inside liquid */}
          {fillHeight > 10 && [...Array(5)].map((_, i) => (
            <motion.circle
              key={i}
              cx={70 + i * 15}
              r={2 + Math.random() * 3}
              fill="white"
              fillOpacity="0.3"
              animate={{
                cy: [260, 270 - (fillHeight / 100) * 200, 260],
                opacity: [0, 0.4, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.6,
              }}
            />
          ))}
        </g>

        {/* Jar outline */}
        <path
          d="M55,70 Q45,90 40,120 Q35,180 40,220 Q45,250 60,260 Q80,270 100,270 Q120,270 140,260 Q155,250 160,220 Q165,180 160,120 Q155,90 145,70 Z"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2.5"
        />

        {/* Glass shine overlay */}
        <path
          d="M55,70 Q45,90 40,120 Q35,180 40,220 Q45,250 60,260 Q80,270 100,270 Q120,270 140,260 Q155,250 160,220 Q165,180 160,120 Q155,90 145,70 Z"
          fill="url(#glassShine)"
        />

        {/* Jar lid / cork */}
        <rect x="50" y="55" width="100" height="20" rx="4" fill="#92400e" opacity="0.8" />
        <rect x="48" y="52" width="104" height="8" rx="3" fill="#a8a29e" opacity="0.6" />

        {/* Lid shine */}
        <rect x="55" y="54" width="40" height="3" rx="1.5" fill="white" opacity="0.2" />
      </svg>

      {/* Percentage label */}
      <motion.div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/80 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(fillHeight)}%
      </motion.div>
    </div>
  );
}