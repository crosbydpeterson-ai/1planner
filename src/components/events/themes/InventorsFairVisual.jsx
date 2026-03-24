import React from 'react';
import { motion } from 'framer-motion';

const GEARS = [
  { cx: 100, cy: 90, r: 28, teeth: 10, speed: 8, dir: 1, color: '#b45309' },
  { cx: 148, cy: 108, r: 18, teeth: 8, speed: 8, dir: -1, color: '#92400e' },
  { cx: 60, cy: 120, r: 22, teeth: 9, speed: 8, dir: -1, color: '#a16207' },
  { cx: 135, cy: 60, r: 14, teeth: 7, speed: 6, dir: 1, color: '#78350f' },
];

function GearShape({ cx, cy, r, teeth, color }) {
  const toothHeight = r * 0.25;
  const inner = r - toothHeight * 0.5;
  const outer = r + toothHeight * 0.5;
  let d = '';
  for (let i = 0; i < teeth; i++) {
    const a1 = (i / teeth) * Math.PI * 2;
    const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
    const a3 = ((i + 0.5) / teeth) * Math.PI * 2;
    const a4 = ((i + 0.7) / teeth) * Math.PI * 2;
    const cmd = i === 0 ? 'M' : 'L';
    d += `${cmd}${cx + Math.cos(a1) * inner},${cy + Math.sin(a1) * inner} `;
    d += `L${cx + Math.cos(a2) * outer},${cy + Math.sin(a2) * outer} `;
    d += `L${cx + Math.cos(a3) * outer},${cy + Math.sin(a3) * outer} `;
    d += `L${cx + Math.cos(a4) * inner},${cy + Math.sin(a4) * inner} `;
  }
  d += 'Z';
  return (
    <>
      <path d={d} fill={color} stroke="#78350f" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r * 0.3} fill="#451a03" />
      <circle cx={cx} cy={cy} r={r * 0.15} fill={color} />
    </>
  );
}

export default function InventorsFairVisual({ progress }) {
  const machineGlow = Math.min(progress / 100, 1);
  const sparksActive = progress > 20;
  const steamActive = progress > 40;
  const lightbulbOn = progress > 60;
  const fullPower = progress > 85;

  return (
    <div className="relative flex items-center justify-center" style={{ height: 220 }}>
      {/* Steam particles */}
      {steamActive && [...Array(6)].map((_, i) => (
        <motion.div
          key={`steam-${i}`}
          className="absolute rounded-full bg-white/20"
          style={{
            width: 6 + Math.random() * 8,
            height: 6 + Math.random() * 8,
            left: `${35 + Math.random() * 30}%`,
            bottom: `${50 + Math.random() * 20}%`,
          }}
          animate={{
            y: [-10, -60 - Math.random() * 40],
            opacity: [0.5, 0],
            scale: [1, 2],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Sparks */}
      {sparksActive && [...Array(8)].map((_, i) => (
        <motion.div
          key={`spark-${i}`}
          className="absolute w-1 h-1 rounded-full bg-amber-400"
          style={{
            left: `${40 + Math.random() * 20}%`,
            top: `${30 + Math.random() * 20}%`,
          }}
          animate={{
            x: [0, (Math.random() - 0.5) * 40],
            y: [0, (Math.random() - 0.5) * 40],
            opacity: [1, 0],
            scale: [1, 0],
          }}
          transition={{
            duration: 0.5 + Math.random() * 0.5,
            repeat: Infinity,
            delay: Math.random() * 2,
            repeatDelay: 1 + Math.random() * 2,
          }}
        />
      ))}

      <svg viewBox="0 0 200 180" className="w-56 h-auto">
        <defs>
          <radialGradient id="ifGlow" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity={machineGlow * 0.6} />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="ifMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#78716c" />
            <stop offset="100%" stopColor="#44403c" />
          </linearGradient>
          <linearGradient id="ifCopper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
        </defs>

        {/* Background glow */}
        <circle cx="100" cy="90" r="80" fill="url(#ifGlow)" />

        {/* Base platform */}
        <rect x="30" y="145" width="140" height="12" rx="4" fill="url(#ifMetal)" stroke="#57534e" strokeWidth="1" />
        <rect x="40" y="140" width="120" height="8" rx="3" fill="url(#ifCopper)" stroke="#92400e" strokeWidth="0.5" />

        {/* Machine body */}
        <rect x="55" y="80" width="90" height="62" rx="6" fill="url(#ifMetal)" stroke="#57534e" strokeWidth="1.5" />
        {/* Rivets */}
        {[62, 138, 62, 138].map((x, i) => (
          <circle key={`rivet-${i}`} cx={x} cy={i < 2 ? 88 : 134} r="2" fill="#a8a29e" />
        ))}

        {/* Boiler / cylinder */}
        <ellipse cx="100" cy="80" rx="35" ry="10" fill="#57534e" />
        <rect x="65" y="60" width="70" height="20" rx="3" fill="url(#ifMetal)" stroke="#57534e" strokeWidth="1" />
        <ellipse cx="100" cy="60" rx="35" ry="10" fill="#78716c" stroke="#57534e" strokeWidth="1" />

        {/* Smokestack */}
        <rect x="82" y="30" width="10" height="30" fill="#57534e" />
        <rect x="78" y="26" width="18" height="6" rx="2" fill="#44403c" />

        {/* Steam puffs from smokestack */}
        {steamActive && (
          <>
            <motion.circle cx="87" cy="20" r="5" fill="white" fillOpacity={0.3}
              animate={{ cy: [20, 5], r: [5, 10], fillOpacity: [0.3, 0] }}
              transition={{ duration: 2, repeat: Infinity }} />
            <motion.circle cx="90" cy="18" r="4" fill="white" fillOpacity={0.2}
              animate={{ cy: [18, 0], r: [4, 8], fillOpacity: [0.2, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }} />
          </>
        )}

        {/* Animated gears */}
        {GEARS.map((gear, i) => (
          <motion.g
            key={i}
            style={{ originX: `${gear.cx}px`, originY: `${gear.cy}px` }}
            animate={{ rotate: gear.dir * 360 }}
            transition={{ duration: gear.speed / Math.max(machineGlow, 0.3), repeat: Infinity, ease: 'linear' }}
          >
            <GearShape cx={gear.cx} cy={gear.cy} r={gear.r} teeth={gear.teeth} color={gear.color} />
          </motion.g>
        ))}

        {/* Gauge / meter */}
        <circle cx="100" cy="110" r="14" fill="#292524" stroke="#78716c" strokeWidth="1.5" />
        <circle cx="100" cy="110" r="11" fill="#1c1917" />
        <motion.line
          x1="100" y1="110"
          x2="100" y2="100"
          stroke="#ef4444"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ originX: '100px', originY: '110px' }}
          animate={{ rotate: [-60, -60 + (progress / 100) * 120] }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
        <circle cx="100" cy="110" r="2" fill="#fbbf24" />

        {/* Lightbulb on top */}
        <circle cx="120" cy="48" r="8" fill={lightbulbOn ? '#fbbf24' : '#57534e'} stroke="#78716c" strokeWidth="1" />
        {lightbulbOn && (
          <motion.circle cx="120" cy="48" r="12" fill="none" stroke="#fbbf24" strokeWidth="0.5"
            animate={{ r: [12, 18], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <rect x="117" y="55" width="6" height="4" rx="1" fill="#78716c" />

        {/* Conveyor belt dots at bottom */}
        {[50, 70, 90, 110, 130, 150].map((x, i) => (
          <motion.circle
            key={`conv-${i}`}
            cx={x}
            cy="152"
            r="2"
            fill="#a8a29e"
            animate={{ cx: [x, x - 20] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: i * 0.3 }}
          />
        ))}

        {/* Full power energy arcs */}
        {fullPower && (
          <>
            <motion.path
              d="M70 70 Q80 50 90 70"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
            />
            <motion.path
              d="M110 70 Q120 50 130 70"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
            />
          </>
        )}
      </svg>

      {/* Progress text */}
      <motion.div
        className="absolute bottom-0 text-center"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span className="text-amber-400/80 text-sm font-bold">
          {progress.toFixed(1)}% Powered
        </span>
      </motion.div>
    </div>
  );
}