import React, { useMemo, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Zap, Coins, PawPrint, Palette, Tag, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Segment colors cycling palette
const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16',
];

const TYPE_ICONS = {
  xp: '⚡',
  coins: '🪙',
  pet: '🐾',
  theme: '🎨',
  title: '🏷️',
  default: '🎁',
};

function getIcon(type) {
  return TYPE_ICONS[type] || TYPE_ICONS.default;
}

// Build SVG path for a pie segment
function segmentPath(cx, cy, r, startAngle, endAngle) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
}

export default function SpinWheel({ prizes = [], onResult, disabled = false }) {
  const controls = useAnimation();
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState(null);
  const currentRotation = useRef(0);

  const totalWeight = useMemo(
    () => prizes.reduce((s, p) => s + Math.max(0, Number(p.weight) || 0), 0),
    [prizes]
  );

  // Build segments with angle info
  const segments = useMemo(() => {
    if (!prizes.length || totalWeight <= 0) return [];
    let angle = 0;
    return prizes.map((p, i) => {
      const slice = (Math.max(0, Number(p.weight) || 0) / totalWeight) * 360;
      const seg = { ...p, startAngle: angle, endAngle: angle + slice, midAngle: angle + slice / 2, color: COLORS[i % COLORS.length] };
      angle += slice;
      return seg;
    });
  }, [prizes, totalWeight]);

  const pickPrize = () => {
    const r = Math.random() * totalWeight;
    let sum = 0;
    for (const p of prizes) {
      sum += Math.max(0, Number(p.weight) || 0);
      if (r <= sum) return p;
    }
    return prizes[prizes.length - 1];
  };

  const handleSpin = async () => {
    if (disabled || spinning || prizes.length === 0 || totalWeight <= 0) return;
    setSpinning(true);
    setLanded(null);

    const prize = pickPrize();

    // Find the segment for prize
    const idx = prizes.indexOf(prize);
    const seg = segments[idx];

    // Needle is at top = 270deg in SVG coords.
    // To land seg.midAngle under the needle, wheel must rotate so that:
    // (seg.midAngle + rotation) % 360 === 270
    // => rotation needed = (270 - seg.midAngle + 360) % 360
    const targetAngle = (270 - seg.midAngle + 360) % 360;
    const fullSpins = 5 * 360;
    const base = currentRotation.current % 360;
    let delta = (targetAngle - base + 360) % 360;
    if (delta < 10) delta += 360;
    const totalSpin = fullSpins + delta;
    const newRotation = currentRotation.current + totalSpin;

    await controls.start({
      rotate: newRotation,
      transition: { duration: 4, ease: [0.17, 0.67, 0.21, 1.0] },
    });

    currentRotation.current = newRotation;
    setLanded(prize);
    setSpinning(false);

    setTimeout(() => {
      onResult && onResult(prize);
    }, 800);
  };

  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Wheel */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Needle pointer at top */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-2 z-10">
          <div style={{
            width: 0, height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '24px solid #1e293b',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))'
          }} />
        </div>

        <motion.div animate={controls} style={{ originX: '50%', originY: '50%', width: size, height: size }}>
          <svg width={size} height={size}>
            {/* Segments */}
            {segments.map((seg, i) => {
              const midRad = ((seg.midAngle) * Math.PI) / 180;
              const textR = r * 0.62;
              const tx = cx + textR * Math.cos(midRad);
              const ty = cy + textR * Math.sin(midRad);
              const iconR = r * 0.82;
              const ix = cx + iconR * Math.cos(midRad);
              const iy = cy + iconR * Math.sin(midRad);
              const segAngle = seg.endAngle - seg.startAngle;
              const showLabel = segAngle > 25;
              return (
                <g key={i}>
                  <path
                    d={segmentPath(cx, cy, r, seg.startAngle, seg.endAngle)}
                    fill={seg.color}
                    stroke="white"
                    strokeWidth="2"
                  />
                  {/* Icon (emoji) */}
                  {segAngle > 15 && (
                    <text
                      x={ix} y={iy}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={segAngle > 40 ? 18 : 13}
                      transform={`rotate(${seg.midAngle + 90}, ${ix}, ${iy})`}
                    >
                      {getIcon(seg.type)}
                    </text>
                  )}
                  {/* Label */}
                  {showLabel && (
                    <text
                      x={tx} y={ty}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={segAngle > 50 ? 11 : 9}
                      fill="white"
                      fontWeight="600"
                      transform={`rotate(${seg.midAngle + 90}, ${tx}, ${ty})`}
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {seg.label?.length > 10 ? seg.label.slice(0, 9) + '…' : seg.label}
                    </text>
                  )}
                </g>
              );
            })}
            {/* Center circle */}
            <circle cx={cx} cy={cy} r={22} fill="white" stroke="#e2e8f0" strokeWidth="3" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={20}>🎯</text>
          </svg>
        </motion.div>
      </div>

      {/* Result banner */}
      {landed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-emerald-800 font-semibold text-sm animate-pulse">
          {getIcon(landed.type)} {landed.label}!
        </div>
      )}

      <Button
        onClick={handleSpin}
        disabled={disabled || spinning || prizes.length === 0 || totalWeight <= 0}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-base py-5"
      >
        {spinning ? '🌀 Spinning...' : '🎰 SPIN!'}
      </Button>
    </div>
  );
}