import React, { useMemo } from 'react';

const DEFAULT_COLORS = [
  '#7c3aed', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16',
];

const TYPE_ICONS = { xp: '⭐', coins: '🪙', pet: '🐾', theme: '🎨', title: '🏷️', default: '🎁' };

function getIcon(type) { return TYPE_ICONS[type] || TYPE_ICONS.default; }

function getPrizeLabel(prize) {
  if (!prize) return '';
  if (prize.label) return prize.label;
  if (prize.type === 'xp') return `+${prize.amount || 0} XP`;
  if (prize.type === 'coins') return `+${prize.amount || 0} Coins`;
  if (prize.type === 'pet') return 'Pet';
  if (prize.type === 'theme') return 'Theme';
  if (prize.type === 'title') return 'Title';
  return 'Reward';
}

function segmentPath(cx, cy, r, startAngle, endAngle) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
}

/**
 * Reusable SVG wheel preview — used in editor and library list.
 * @param {Array} prizes - Prize objects with type, amount, value, label, weight, color
 * @param {Array} [colors] - Optional color palette override
 * @param {number} [size=180] - SVG size in px
 */
export default function WheelPreview({ prizes = [], colors, size = 180 }) {
  const palette = colors && colors.length > 0 ? colors : DEFAULT_COLORS;

  const totalWeight = useMemo(
    () => prizes.reduce((s, p) => s + Math.max(0, Number(p.weight) || 0), 0),
    [prizes]
  );

  const segments = useMemo(() => {
    if (!prizes.length || totalWeight <= 0) return [];
    let angle = 0;
    return prizes.map((p, i) => {
      const slice = (Math.max(0, Number(p.weight) || 0) / totalWeight) * 360;
      const seg = {
        ...p,
        startAngle: angle,
        endAngle: angle + slice,
        midAngle: angle + slice / 2,
        color: p.color || palette[i % palette.length],
      };
      angle += slice;
      return seg;
    });
  }, [prizes, totalWeight, palette]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;

  if (segments.length === 0) {
    return (
      <div
        className="rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 text-sm text-center px-4"
        style={{ width: size, height: size }}
      >
        Add prizes to see preview
      </div>
    );
  }

  return (
    <svg width={size} height={size}>
      {segments.map((seg, i) => {
        const segAngle = seg.endAngle - seg.startAngle;
        const iconRad = (seg.midAngle * Math.PI) / 180;
        const iconR = r * 0.6;
        const ix = cx + iconR * Math.cos(iconRad);
        const iy = cy + iconR * Math.sin(iconRad);
        const pct = totalWeight > 0 ? Math.round((Math.max(0, Number(seg.weight) || 0) / totalWeight) * 100) : 0;
        return (
          <g key={i}>
            <path
              d={segmentPath(cx, cy, r, seg.startAngle, seg.endAngle)}
              fill={seg.color}
              stroke="white"
              strokeWidth="1.5"
            />
            {segAngle > 20 && (
              <text
                x={ix} y={iy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={size > 150 ? 14 : 11}
                transform={`rotate(${seg.midAngle + 90}, ${ix}, ${iy})`}
              >
                {getIcon(seg.type)}
              </text>
            )}
            {segAngle > 35 && size > 150 && (() => {
              const lbl = getPrizeLabel(seg);
              return (
                <text
                  x={cx + (r * 0.32) * Math.cos(iconRad)}
                  y={cy + (r * 0.32) * Math.sin(iconRad)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="7"
                  fill="white"
                  fontWeight="700"
                  transform={`rotate(${seg.midAngle + 90}, ${cx + (r * 0.32) * Math.cos(iconRad)}, ${cy + (r * 0.32) * Math.sin(iconRad)})`}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                >
                  {lbl.length > 8 ? lbl.slice(0, 7) + '…' : lbl}
                </text>
              );
            })()}
            {segAngle > 25 && size > 150 && (
              <text
                x={cx + (r * 0.85) * Math.cos(iconRad)}
                y={cy + (r * 0.85) * Math.sin(iconRad)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="6"
                fill="white"
                opacity="0.8"
                transform={`rotate(${seg.midAngle + 90}, ${cx + (r * 0.85) * Math.cos(iconRad)}, ${cy + (r * 0.85) * Math.sin(iconRad)})`}
              >
                {pct}%
              </text>
            )}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={size > 150 ? 14 : 10} fill="white" stroke="#7c3aed" strokeWidth="2" />
    </svg>
  );
}