import React, { useMemo } from 'react';
import { getWheelTheme, ThemeDefs } from '@/components/wheellibrary/WheelThemeCatalog';

const TYPE_ICONS = { xp: '⭐', coins: '🪙', pet: '🐾', theme: '🎨', title: '🏷️', song: '🎵', playlist: '🎶', default: '🎁' };

function getIcon(type) { return TYPE_ICONS[type] || TYPE_ICONS.default; }

function getPrizeLabel(prize, assets) {
  if (!prize) return '';
  if (prize.label) return prize.label;
  if (prize.type === 'xp') return `${prize.amount || 0} XP`;
  if (prize.type === 'coins') return `${prize.amount || 0} Coins`;
  if (prize.type === 'pet') return assets?.pets?.[prize.value]?.name || 'Pet';
  if (prize.type === 'theme') return assets?.themes?.[prize.value]?.name || 'Theme';
  if (prize.type === 'title') return prize.value || 'Title';
  if (prize.type === 'song') return assets?.songs?.[prize.value]?.title || 'Song';
  if (prize.type === 'playlist') return assets?.playlists?.[prize.value]?.name || 'Playlist';
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
 * Reusable SVG wheel preview with themed rendering.
 * @param {Array} prizes - Prize objects
 * @param {Array} [colors] - Optional color palette override
 * @param {string} [wheelTheme] - Theme ID from WheelThemeCatalog
 * @param {object} [assets] - Optional asset maps for labels
 * @param {number} [size=180] - SVG size in px
 */
export default function WheelPreview({ prizes = [], colors, wheelTheme: themeId, assets, size = 180 }) {
  const theme = useMemo(() => getWheelTheme(themeId), [themeId]);
  const palette = (colors && colors.length > 0) ? colors : theme.defaultColors;

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
  const rimR = size / 2 - 2;

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
      <ThemeDefs theme={theme} uid="prev" />
      {/* Themed rim */}
      <circle cx={cx} cy={cy} r={rimR} fill="none" stroke={theme.rim.color} strokeWidth={size > 150 ? 5 : 3} />
      <circle cx={cx} cy={cy} r={rimR - 1} fill="none" stroke={theme.rim.innerColor} strokeWidth="1.5" />

      {segments.map((seg, i) => {
        const segAngle = seg.endAngle - seg.startAngle;
        const iconRad = (seg.midAngle * Math.PI) / 180;
        const iconR = r * 0.6;
        const ix = cx + iconR * Math.cos(iconRad);
        const iy = cy + iconR * Math.sin(iconRad);
        const pct = totalWeight > 0 ? Math.round((Math.max(0, Number(seg.weight) || 0) / totalWeight) * 100) : 0;
        const pathD = segmentPath(cx, cy, r, seg.startAngle, seg.endAngle);
        return (
          <g key={i}>
            <path
              d={pathD}
              fill={seg.color}
              stroke={theme.segment.stroke}
              strokeWidth={size > 150 ? theme.segment.strokeWidth : 1}
            />
            {theme.gradient && (
              <path d={pathD} fill="url(#tw-prev-grad)" opacity={theme.gradient.opacity} />
            )}
            {theme.pattern && (
              <path d={pathD} fill="url(#tw-prev-pat)" opacity={theme.pattern.opacity} />
            )}
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
              const lbl = getPrizeLabel(seg, assets);
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
      {/* Themed center hub */}
      <circle cx={cx} cy={cy} r={size > 150 ? 14 : 10} fill={theme.center.ringFill} stroke={theme.center.ringStroke} strokeWidth="2" />
      <circle cx={cx} cy={cy} r={size > 150 ? 9 : 7} fill={theme.center.fill} />
      {size > 120 && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={size > 150 ? 10 : 8} fill="white">
          {theme.center.hubEmoji}
        </text>
      )}
    </svg>
  );
}