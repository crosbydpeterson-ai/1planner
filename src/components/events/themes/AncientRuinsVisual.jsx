import React from 'react';
import { motion } from 'framer-motion';

export default function AncientRuinsVisual({ progress }) {
  const fill = Math.min(progress, 100);
  const rubbleCleared = Math.floor((fill / 100) * 8);
  const glyphsLit = Math.floor((fill / 100) * 6);

  return (
    <div className="relative w-56 h-72 mx-auto">
      {/* Dust particles */}
      {fill > 5 && [...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-amber-200/40"
          style={{
            left: `${15 + Math.random() * 70}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          animate={{
            y: [0, -20 - Math.random() * 20, 0],
            x: [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 10],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 4,
          }}
        />
      ))}

      {/* Glyph glow at high progress */}
      {fill > 60 && [...Array(4)].map((_, i) => (
        <motion.div
          key={`glow-${i}`}
          className="absolute text-xs"
          style={{
            left: `${20 + i * 18}%`,
            top: `${35 + (i % 2) * 15}%`,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
        >
          {['𓂀', '𓁹', '𓃭', '𓆣'][i]}
        </motion.div>
      ))}

      <svg viewBox="0 0 220 280" className="w-full h-full drop-shadow-xl">
        <defs>
          <linearGradient id="ruinStone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a8a29e" />
            <stop offset="50%" stopColor="#78716c" />
            <stop offset="100%" stopColor="#57534e" />
          </linearGradient>
          <linearGradient id="ruinGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <radialGradient id="ruinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground */}
        <rect x="10" y="230" width="200" height="40" rx="4" fill="#44403c" />
        <rect x="10" y="230" width="200" height="8" fill="#57534e" rx="2" />

        {/* Central temple structure */}
        <rect x="60" y="100" width="100" height="130" fill="url(#ruinStone)" rx="3" />
        {/* Temple entrance */}
        <rect x="85" y="160" width="50" height="70" rx="2" fill="#292524" />
        <path d="M85,160 Q110,140 135,160" fill="url(#ruinStone)" stroke="#57534e" strokeWidth="1" />

        {/* Pillars */}
        <rect x="45" y="110" width="18" height="120" fill="url(#ruinStone)" rx="3" />
        <rect x="157" y="110" width="18" height="120" fill="url(#ruinStone)" rx="3" />
        {/* Pillar caps */}
        <rect x="42" y="105" width="24" height="10" rx="3" fill="#a8a29e" />
        <rect x="154" y="105" width="24" height="10" rx="3" fill="#a8a29e" />

        {/* Roof / pediment */}
        <polygon points="35,105 110,55 185,105" fill="url(#ruinStone)" stroke="#78716c" strokeWidth="1.5" />

        {/* Glyphs on temple face - light up progressively */}
        {[...Array(6)].map((_, i) => {
          const lit = i < glyphsLit;
          const gx = 70 + (i % 3) * 25;
          const gy = 120 + Math.floor(i / 3) * 22;
          return (
            <motion.g key={`glyph-${i}`}>
              <rect x={gx} y={gy} width="16" height="14" rx="2"
                fill={lit ? 'url(#ruinGold)' : '#57534e'}
                opacity={lit ? 1 : 0.4}
              />
              {lit && (
                <motion.rect x={gx} y={gy} width="16" height="14" rx="2"
                  fill="#fbbf24" opacity={0.3}
                  animate={{ opacity: [0.1, 0.4, 0.1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                />
              )}
            </motion.g>
          );
        })}

        {/* Rubble pieces - disappear as progress increases */}
        {[...Array(8)].map((_, i) => {
          if (i < rubbleCleared) return null;
          const rx = 30 + (i % 4) * 42;
          const ry = 210 + (i < 4 ? 0 : 15);
          return (
            <rect key={`rubble-${i}`} x={rx} y={ry} width={12 + Math.random() * 8} height={8 + Math.random() * 6}
              rx="2" fill="#78716c" opacity="0.7" transform={`rotate(${Math.random() * 30 - 15}, ${rx}, ${ry})`}
            />
          );
        })}

        {/* Artifact reveal at high progress */}
        {fill > 70 && (
          <motion.g
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ellipse cx="110" cy="215" rx="20" ry="6" fill="url(#ruinGlow)" />
            <motion.polygon
              points="110,190 120,210 100,210"
              fill="url(#ruinGold)" stroke="#d97706" strokeWidth="1"
              animate={{ y: [0, -3, 0], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.g>
        )}

        {/* Inner glow from entrance */}
        <motion.ellipse
          cx="110" cy="195" rx={15 + fill * 0.1} ry={10 + fill * 0.05}
          fill="#fbbf24" opacity={0.05 + fill * 0.002}
          animate={{ opacity: [0.05 + fill * 0.001, 0.1 + fill * 0.002, 0.05 + fill * 0.001] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Eye of the temple at top */}
        {fill > 40 && (
          <motion.g
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <circle cx="110" cy="78" r="8" fill="none" stroke="url(#ruinGold)" strokeWidth="1.5" />
            <circle cx="110" cy="78" r="3" fill="#fbbf24" />
          </motion.g>
        )}
      </svg>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-amber-300/90 text-sm font-bold"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {Math.round(fill)}% excavated
      </motion.div>
    </div>
  );
}