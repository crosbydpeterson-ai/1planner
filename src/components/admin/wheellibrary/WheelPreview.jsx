import React, { useMemo } from 'react';
import { getWheelTheme, ThemeDefs, renderOuterDecor } from '@/components/wheellibrary/WheelThemeCatalog';

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
      const seg = { ...p, startAngle: angle, endAngle: angle + slice, midAngle: angle + slice / 2, color: p.color || palette[i % palette.length] };
      angle += slice;
      return seg;
    });
  }, [prizes, totalWeight, palette]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 12;
  const rimR = size / 2 - 6;
  const outerR = size / 2 - 2;

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
      {/* Outer themed decorations */}
      {size > 150 && renderOuterDecor(theme.decor, cx, cy, outerR)}
      {/* Themed rim */}
      <circle cx={cx} cy={cy} r={rimR} fill="none" stroke={theme.rim.color} strokeWidth={size > 150 ? 6 : 4} />
      <circle cx={cx} cy={cy} r={rimR - 1} fill="none" stroke={theme.rim.innerColor} strokeWidth="1.5" />
      {/* Rim dots */}
      {Array.from({ length: theme.rim.dotCount }).map((_, i) => {
        const a = (i / theme.rim.dotCount) * 2 * Math.PI;
        const dx = cx + (rimR - 3) * Math.cos(a);
        const dy = cy + (rimR - 3) * Math.sin(a);
        return <circle key={`dot${i}`} cx={dx} cy={dy} r={size > 150 ? 1.5 : 1} fill={theme.rim.dotColor} opacity="0.6" />;
      })}
      {/* Chase lights (static preview) */}
      {theme.lights && Array.from({ length: theme.lights.count }).map((_, i) => {
        const a = (i / theme.lights.count) * 2 * Math.PI;
        const lx = cx + (rimR - 1) * Math.cos(a);
        const ly = cy + (rimR - 1) * Math.sin(a);
        return <circle key={`lit${i}`} cx={lx} cy={ly} r={size > 150 ? 2 : 1.5} fill={theme.lights.color} opacity={i % 2 === 0 ? 0.9 : 0.3} />;
      })}

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
      {/* Center hub */}
      <circle cx={cx} cy={cy} r={size > 150 ? 16 : 12} fill={theme.center.ringFill} stroke={theme.center.ringStroke} strokeWidth="2.5" />
      <circle cx={cx} cy={cy} r={size > 150 ? 11 : 8} fill={theme.center.fill} />
      {size > 120 && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize={size > 150 ? 11 : 8} fill="white">
          {theme.center.hubEmoji}
        </text>
      )}
    </svg>
  );
}