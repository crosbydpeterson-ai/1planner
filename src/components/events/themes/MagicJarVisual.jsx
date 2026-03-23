import React from 'react';
import { motion } from 'framer-motion';

export default function MagicJarVisual({ progress }) {
  const fillHeight = Math.min(progress, 100);

  const getGlowColor = () => {
    if (fillHeight > 80) return '#a855f7';
    if (fillHeight > 50) return '#8b5cf6';
    if (fillHeight > 25) return '#7c3aed';
    return '#6d28d9';
  };

  return (
    <div className="relative w-52 h-72 mx-auto">
      {/* Magical orbiting particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3 + Math.random() * 5,
            height: 3 + Math.random() * 5,
            background: `radial-gradient(circle, ${['#c084fc', '#a855f7', '#818cf8', '#e879f9'][i % 4]}, transparent)`,
            left: `${15 + Math.random() * 70}%`,
            bottom: `${5 + Math.random() * 75}%`,
          }}
          animate={{
            y: [-10, -50 - Math.random() * 30, -10],
            x: [0, (Math.random() - 0.5) * 30, 0],
            opacity: [0, 0.9, 0],
            scale: [0.3, 1.5, 0.3],
          }}
          transition={{
            duration: 2 + Math.random() * 2.5,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Rune circle around jar at high fill */}
      {fillHeight > 60 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-48 h-48 rounded-full border border-purple-400/20 mt-4" />
        </motion.div>
      )}
      {fillHeight > 80 && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-56 h-56 rounded-full border border-dashed border-violet-400/15 mt-4" />
        </motion.div>
      )}

      <svg viewBox="0 0 200 280" className="w-full h-full drop-shadow-2xl">
        <defs>
          <radialGradient id="jarGlow2" cx="50%" cy="60%" r="55%">
            <stop offset="0%" stopColor={getGlowColor()} stopOpacity="0.4" />
            <stop offset="60%" stopColor={getGlowColor()} stopOpacity="0.1" />
            <stop offset="100%" stopColor={getGlowColor()} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="liquidGrad2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e879f9" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#c084fc" stopOpacity="0.9" />
            <stop offset="60%" stopColor="#8b5cf6" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="glassShine2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.2" />
            <stop offset="20%" stopColor="white" stopOpacity="0.08" />
            <stop offset="50%" stopColor="white" stopOpacity="0" />
            <stop offset="80%" stopColor="white" stopOpacity="0.05" />
            <stop offset="100%" stopColor="white" stopOpacity="0.12" />
          </linearGradient>
          <clipPath id="jarBody2">
            <path d="M55,70 Q45,90 40,120 Q35,180 40,220 Q45,250 60,260 Q80,270 100,270 Q120,270 140,260 Q155,250 160,220 Q165,180 160,120 Q155,90 145,70 Z" />
          </clipPath>
          <filter id="liquidGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer glow - more intense */}
        <ellipse cx="100" cy="170" rx="95" ry="115" fill="url(#jarGlow2)" />

        {/* Liquid inside jar */}
        <g clipPath="url(#jarBody2)">
          <motion.rect
            x="30" width="140" height="210"
            fill="url(#liquidGrad2)"
            initial={{ y: 270 }}
            animate={{ y: 270 - (fillHeight / 100) * 210 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          {/* Liquid surface with wobble */}
          <motion.ellipse
            cx="100" rx="70" ry="10"
            fill="#e879f9" fillOpacity="0.5"
            initial={{ cy: 270 }}
            animate={{ 
              cy: 270 - (fillHeight / 100) * 210,
              rx: [68, 72, 68],
            }}
            transition={{ 
              cy: { duration: 1.5, ease: 'easeOut' },
              rx: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
          {/* Bubbles inside liquid - more of them */}
          {fillHeight > 10 && [...Array(8)].map((_, i) => (
            <motion.circle
              key={i}
              cx={55 + (i % 5) * 20 + Math.random() * 10}
              r={2 + Math.random() * 4}
              fill="white" fillOpacity="0.3"
              animate={{
                cy: [265, 270 - (fillHeight / 100) * 200 - 10, 265],
                opacity: [0, 0.5, 0],
                r: [2, 4, 2],
              }}
              transition={{
                duration: 2.5 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.4 + Math.random(),
              }}
            />
          ))}
          {/* Swirling magic inside */}
          {fillHeight > 30 && (
            <motion.ellipse
              cx="100" rx="25" ry="40"
              fill="#e879f9" fillOpacity="0.15"
              animate={{
                cy: [270 - (fillHeight / 100) * 100, 270 - (fillHeight / 100) * 150, 270 - (fillHeight / 100) * 100],
                rx: [20, 35, 20],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </g>

        {/* Jar outline - glass effect */}
        <path
          d="M55,70 Q45,90 40,120 Q35,180 40,220 Q45,250 60,260 Q80,270 100,270 Q120,270 140,260 Q155,250 160,220 Q165,180 160,120 Q155,90 145,70 Z"
          fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5"
        />
        {/* Glass shine overlay */}
        <path
          d="M55,70 Q45,90 40,120 Q35,180 40,220 Q45,250 60,260 Q80,270 100,270 Q120,270 140,260 Q155,250 160,220 Q165,180 160,120 Q155,90 145,70 Z"
          fill="url(#glassShine2)"
        />

        {/* Cork / lid with metallic look */}
        <rect x="50" y="55" width="100" height="20" rx="5" fill="#78350f" opacity="0.85" />
        <rect x="52" y="58" width="96" height="4" rx="2" fill="#92400e" opacity="0.5" />
        <rect x="48" y="50" width="104" height="9" rx="4" fill="#a8a29e" opacity="0.65" />
        <rect x="55" y="52" width="35" height="3" rx="1.5" fill="white" opacity="0.25" />

        {/* Magical symbols on jar at high fill */}
        {fillHeight > 50 && (
          <motion.g
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <circle cx="70" cy="170" r="6" fill="none" stroke="#c084fc" strokeWidth="1" opacity="0.4" />
            <circle cx="130" cy="180" r="5" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.3" />
            <polygon points="100,140 103,148 97,148" fill="none" stroke="#e879f9" strokeWidth="1" opacity="0.35" />
          </motion.g>
        )}
      </svg>

      {/* Percentage label */}
      <motion.div
        className="absolute bottom-1 left-1/2 -translate-x-1/2 text-purple-200/90 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(fillHeight)}%
      </motion.div>
    </div>
  );
}