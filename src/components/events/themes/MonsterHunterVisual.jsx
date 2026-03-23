import React from 'react';
import { motion } from 'framer-motion';

export default function MonsterHunterVisual({ progress }) {
  const damage = Math.min(progress, 100);
  const healthRemaining = 100 - damage;

  return (
    <div className="relative w-60 h-80 mx-auto">
      {/* Impact flashes - bigger, more dramatic */}
      {damage > 15 && [...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${15 + Math.random() * 55}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.2, 1.8, 0],
            rotate: [0, Math.random() * 90],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: Math.random() * 6,
            repeatDelay: 2.5 + Math.random() * 5,
          }}
        >
          {['💥', '⚔️', '🔥', '💢'][i % 4]}
        </motion.div>
      ))}

      {/* Screen shake at critical HP */}
      <motion.div
        animate={damage > 85 ? {
          x: [-1, 1, -1, 0],
          y: [-0.5, 0.5, 0],
        } : {}}
        transition={{ duration: 0.3, repeat: Infinity }}
      >
        <svg viewBox="0 0 240 320" className="w-full h-full">
          <defs>
            <radialGradient id="monsterGlow2" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2 + damage / 300} />
              <stop offset="60%" stopColor="#ef4444" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="dragonScale2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b91c1c" />
              <stop offset="30%" stopColor="#dc2626" />
              <stop offset="70%" stopColor="#991b1b" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
            <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
            <filter id="dragonGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background glow */}
          <ellipse cx="120" cy="150" rx="115" ry="135" fill="url(#monsterGlow2)" />

          {/* Ground shadow */}
          <ellipse cx="120" cy="275" rx="80" ry="12" fill="#000" opacity="0.15" />

          {/* Dragon Body */}
          <motion.g
            animate={{
              x: damage > 70 ? [0, -3, 3, -2, 0] : [0, -1, 1, 0],
              y: [0, -2, 1, 0],
            }}
            transition={{ duration: damage > 70 ? 1.5 : 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Tail */}
            <motion.path
              d="M120,215 Q150,245 178,248 Q192,244 198,232 Q202,225 195,222"
              stroke="#991b1b" strokeWidth="10" fill="none" strokeLinecap="round"
              animate={{ d: [
                "M120,215 Q150,245 178,248 Q192,244 198,232 Q202,225 195,222",
                "M120,215 Q145,250 175,252 Q190,248 195,235 Q200,228 192,225",
                "M120,215 Q150,245 178,248 Q192,244 198,232 Q202,225 195,222",
              ]}}
              transition={{ duration: 4, repeat: Infinity }}
            />
            {/* Tail spike */}
            <motion.polygon
              points="195,222 205,215 200,228"
              fill="#78350f"
              animate={{ rotate: [0, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              style={{ transformOrigin: '195px 222px' }}
            />

            {/* Wings - more detailed */}
            <motion.g
              animate={{ rotate: [0, -3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{ transformOrigin: '65px 155px' }}
            >
              <path d="M65,155 Q22,105 28,60 Q35,45 45,55 Q50,80 58,105 Q55,130 65,155" fill="#991b1b" opacity="0.75" />
              <path d="M55,130 Q35,95 40,70" stroke="#7f1d1d" strokeWidth="1.5" fill="none" opacity="0.4" />
              <path d="M58,115 Q42,88 45,65" stroke="#7f1d1d" strokeWidth="1" fill="none" opacity="0.3" />
            </motion.g>
            <motion.g
              animate={{ rotate: [0, 3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{ transformOrigin: '175px 155px' }}
            >
              <path d="M175,155 Q218,105 212,60 Q205,45 195,55 Q190,80 182,105 Q185,130 175,155" fill="#991b1b" opacity="0.75" />
              <path d="M185,130 Q205,95 200,70" stroke="#7f1d1d" strokeWidth="1.5" fill="none" opacity="0.4" />
            </motion.g>

            {/* Body */}
            <ellipse cx="120" cy="170" rx="58" ry="48" fill="url(#dragonScale2)" />
            {/* Scale pattern */}
            <motion.g opacity="0.15">
              {[...Array(5)].map((_, i) => (
                <path key={i} d={`M${85 + i * 15},${155 + i * 3} Q${90 + i * 15},${150 + i * 3} ${95 + i * 15},${155 + i * 3}`} stroke="#fca5a5" strokeWidth="1" fill="none" />
              ))}
            </motion.g>

            {/* Belly */}
            <ellipse cx="120" cy="180" rx="32" ry="28" fill="#fca5a5" opacity="0.2" />

            {/* Neck */}
            <path d="M105,130 Q108,115 110,100 L130,100 Q132,115 135,130" fill="#dc2626" />

            {/* Head */}
            <ellipse cx="120" cy="100" rx="40" ry="34" fill="#dc2626" />
            {/* Head top ridge */}
            <path d="M95,80 Q120,70 145,80" stroke="#b91c1c" strokeWidth="3" fill="none" />

            {/* Horns - more dramatic */}
            <path d="M88,82 Q78,50 68,38" stroke="#92400e" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M152,82 Q162,50 172,38" stroke="#92400e" strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* Horn tips */}
            <circle cx="68" cy="38" r="3" fill="#78350f" />
            <circle cx="172" cy="38" r="3" fill="#78350f" />

            {/* Eyes - glowing */}
            <motion.g filter="url(#dragonGlow)">
              <motion.ellipse
                cx="104" cy="95" rx="9" ry="7"
                fill="url(#eyeGlow)"
                animate={{ ry: damage > 70 ? [7, 3, 7] : [7, 4, 7] }}
                transition={{ duration: damage > 70 ? 1.5 : 3, repeat: Infinity, delay: 0.8 }}
              />
              <motion.ellipse
                cx="136" cy="95" rx="9" ry="7"
                fill="url(#eyeGlow)"
                animate={{ ry: damage > 70 ? [7, 3, 7] : [7, 4, 7] }}
                transition={{ duration: damage > 70 ? 1.5 : 3, repeat: Infinity, delay: 0.8 }}
              />
            </motion.g>
            <ellipse cx="104" cy="95" rx="3.5" ry="6" fill="#1e1e1e" />
            <ellipse cx="136" cy="95" rx="3.5" ry="6" fill="#1e1e1e" />
            {/* Eye glint */}
            <circle cx="107" cy="92" r="2" fill="white" opacity="0.5" />
            <circle cx="139" cy="92" r="2" fill="white" opacity="0.5" />

            {/* Snout */}
            <ellipse cx="120" cy="115" rx="18" ry="10" fill="#b91c1c" />
            <circle cx="112" cy="114" r="2.5" fill="#1e1e1e" />
            <circle cx="128" cy="114" r="2.5" fill="#1e1e1e" />
            {/* Teeth hint */}
            {damage > 50 && (
              <g opacity="0.6">
                <rect x="108" y="120" width="3" height="4" rx="1" fill="white" />
                <rect x="115" y="121" width="3" height="3" rx="1" fill="white" />
                <rect x="129" y="120" width="3" height="4" rx="1" fill="white" />
              </g>
            )}

            {/* Fire breath */}
            {damage > 50 && (
              <motion.g
                animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.15, 0.8] }}
                transition={{ duration: damage > 75 ? 0.8 : 1.5, repeat: Infinity }}
                style={{ transformOrigin: '120px 125px' }}
              >
                <ellipse cx="120" cy="130" rx={damage > 75 ? 12 : 7} ry={damage > 75 ? 6 : 4} fill="#f97316" opacity="0.7" />
                <ellipse cx="120" cy="133" rx={damage > 75 ? 8 : 5} ry={damage > 75 ? 3 : 2} fill="#fbbf24" opacity="0.5" />
              </motion.g>
            )}

            {/* Damage cracks - progressive */}
            {damage > 20 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.8 }}>
                <path d="M92,145 L86,162 L97,156 L89,172" stroke="#fbbf24" strokeWidth="2" fill="none" />
              </motion.g>
            )}
            {damage > 40 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 0.8 }}>
                <path d="M145,140 L153,155 L143,158 L150,170" stroke="#fbbf24" strokeWidth="2" fill="none" />
                <path d="M108,165 L103,178 L115,173" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
              </motion.g>
            )}
            {damage > 65 && (
              <motion.g
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <path d="M125,118 L130,135 L118,130 L126,148" stroke="#f97316" strokeWidth="2.5" fill="none" />
                <circle cx="120" cy="155" r="10" fill="#ef4444" opacity="0.25" />
              </motion.g>
            )}
            {damage > 85 && (
              <motion.g
                animate={{ opacity: [0.3, 0.9, 0.3] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <path d="M100,90 L95,105 L108,100" stroke="#f97316" strokeWidth="2" fill="none" />
                <circle cx="115" cy="170" r="14" fill="#ef4444" opacity="0.2" />
                <circle cx="135" cy="145" r="8" fill="#ef4444" opacity="0.2" />
              </motion.g>
            )}
          </motion.g>

          {/* HP Bar - upgraded */}
          <g>
            <rect x="30" y="272" width="180" height="16" rx="8" fill="#1e1e1e" opacity="0.6" />
            <rect x="31" y="273" width="178" height="14" rx="7" fill="#292524" opacity="0.4" />
            <motion.rect
              x="32" y="274"
              height="12" rx="6"
              fill={healthRemaining > 50 ? '#22c55e' : healthRemaining > 25 ? '#f59e0b' : '#ef4444'}
              initial={{ width: 176 }}
              animate={{ width: (healthRemaining / 100) * 176 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
            {/* HP bar shine */}
            <rect x="32" y="274" width={(healthRemaining / 100) * 176} height="5" rx="3" fill="white" opacity="0.1" />
            <text x="120" y="284" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
              HP: {Math.round(healthRemaining)}%
            </text>
          </g>

          {/* Boss name plate */}
          <g>
            <rect x="55" y="296" width="130" height="18" rx="5" fill="#1e1e1e" opacity="0.4" />
            <text x="120" y="309" textAnchor="middle" fill="#fca5a5" fontSize="9" fontWeight="600">
              🐉 Ancient Dragon
            </text>
          </g>
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-red-400/90 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(damage)}% damage dealt
      </motion.div>
    </div>
  );
}