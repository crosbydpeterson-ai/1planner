import React from 'react';

/**
 * Wheel Theme Catalog — Enhanced Edition
 * Each theme controls: segment colors, rim style, rim chase lights, outer decorations,
 * pointer style, center hub with pulse glow, gradient overlay, texture pattern,
 * spin button gradient, and floating particle type.
 */

export const WHEEL_THEMES = [
  {
    id: 'classic',
    name: 'Classic',
    emoji: '🎯',
    description: 'Purple rim with chase lights',
    defaultColors: ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'],
    rim: { color: '#7c3aed', innerColor: '#a78bfa', dotColor: '#ffffff', dotCount: 16 },
    lights: { color: '#fbbf24', count: 12, speed: 3 },
    decor: { type: 'diamonds', color: '#a78bfa' },
    pointer: { color: '#7c3aed', stroke: '#ffffff', glow: '#a78bfa' },
    center: { ringFill: '#ffffff', ringStroke: '#7c3aed', fill: '#7c3aed', hubEmoji: '🎯' },
    centerPulse: true,
    segment: { stroke: '#ffffff', strokeWidth: 2 },
    gradient: { opacity: 0.2 },
    pattern: null,
    bgGlow: '#7c3aed',
    buttonGradient: ['#7c3aed', '#a78bfa'],
    particle: { type: 'sparkle', color: '#c4b5fd' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    description: 'Deep blues with wave rim & bubbles',
    defaultColors: ['#0ea5e9', '#06b6d4', '#0891b2', '#0284c7', '#155e75', '#0369a1', '#075985', '#0c4a6e', '#1e40af', '#1e3a8a'],
    rim: { color: '#0c4a6e', innerColor: '#0ea5e9', dotColor: '#bae6fd', dotCount: 20 },
    lights: { color: '#22d3ee', count: 16, speed: 4 },
    decor: { type: 'waves', color: '#0ea5e9' },
    pointer: { color: '#0c4a6e', stroke: '#bae6fd', glow: '#22d3ee' },
    center: { ringFill: '#bae6fd', ringStroke: '#0c4a6e', fill: '#0c4a6e', hubEmoji: '🌊' },
    centerPulse: true,
    segment: { stroke: '#bae6fd', strokeWidth: 1.5 },
    gradient: { opacity: 0.25 },
    pattern: { type: 'waves', color: '#ffffff', opacity: 0.18 },
    bgGlow: '#0ea5e9',
    buttonGradient: ['#0c4a6e', '#0ea5e9'],
    particle: { type: 'bubble', color: '#7dd3fc' },
  },
  {
    id: 'fire',
    name: 'Fire',
    emoji: '🔥',
    description: 'Reds & oranges with flame rim',
    defaultColors: ['#ef4444', '#f97316', '#f59e0b', '#dc2626', '#ea580c', '#b91c1c', '#d97706', '#fbbf24', '#fde047', '#fb923c'],
    rim: { color: '#7c2d12', innerColor: '#f97316', dotColor: '#fbbf24', dotCount: 16 },
    lights: { color: '#fde047', count: 14, speed: 2 },
    decor: { type: 'flames', color: '#f97316' },
    pointer: { color: '#7c2d12', stroke: '#fbbf24', glow: '#f97316' },
    center: { ringFill: '#7c2d12', ringStroke: '#f97316', fill: '#f97316', hubEmoji: '🔥' },
    centerPulse: true,
    segment: { stroke: '#fbbf24', strokeWidth: 1.5 },
    gradient: { opacity: 0.3 },
    pattern: { type: 'embers', color: '#fde047', opacity: 0.25 },
    bgGlow: '#f97316',
    buttonGradient: ['#dc2626', '#f97316'],
    particle: { type: 'ember', color: '#fb923c' },
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🍀',
    description: 'Greens with leaf rim & fireflies',
    defaultColors: ['#16a34a', '#15803d', '#22c55e', '#166534', '#4ade80', '#65a30d', '#86efac', '#14532d', '#3b82f6', '#84cc16'],
    rim: { color: '#14532d', innerColor: '#22c55e', dotColor: '#bbf7d0', dotCount: 16 },
    lights: { color: '#fde047', count: 10, speed: 5 },
    decor: { type: 'leaves', color: '#22c55e' },
    pointer: { color: '#14532d', stroke: '#bbf7d0', glow: '#4ade80' },
    center: { ringFill: '#bbf7d0', ringStroke: '#14532d', fill: '#14532d', hubEmoji: '🍀' },
    centerPulse: true,
    segment: { stroke: '#bbf7d0', strokeWidth: 1.5 },
    gradient: { opacity: 0.25 },
    pattern: { type: 'leaves', color: '#ffffff', opacity: 0.15 },
    bgGlow: '#22c55e',
    buttonGradient: ['#14532d', '#22c55e'],
    particle: { type: 'firefly', color: '#fde047' },
  },
  {
    id: 'crystal',
    name: 'Crystal',
    emoji: '💎',
    description: 'Purple-pink with gem rim & sparkles',
    defaultColors: ['#a855f7', '#ec4899', '#8b5cf6', '#d946ef', '#c026d3', '#7c3aed', '#f472b6', '#a78bfa', '#e879f9', '#f0abfc'],
    rim: { color: '#581c87', innerColor: '#a855f7', dotColor: '#f0abfc', dotCount: 20 },
    lights: { color: '#f0abfc', count: 16, speed: 3 },
    decor: { type: 'gems', color: '#a855f7' },
    pointer: { color: '#581c87', stroke: '#f0abfc', glow: '#d946ef' },
    center: { ringFill: '#f0abfc', ringStroke: '#581c87', fill: '#581c87', hubEmoji: '💎' },
    centerPulse: true,
    segment: { stroke: '#f0abfc', strokeWidth: 1.5 },
    gradient: { opacity: 0.3 },
    pattern: { type: 'sparkles', color: '#ffffff', opacity: 0.3 },
    bgGlow: '#a855f7',
    buttonGradient: ['#581c87', '#a855f7'],
    particle: { type: 'sparkle', color: '#f0abfc' },
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    emoji: '🌟',
    description: 'Indigo-violet with star rim',
    defaultColors: ['#4f46e5', '#4338ca', '#6366f1', '#3730a3', '#818cf8', '#7c3aed', '#312e81', '#8b5cf6', '#a5b4fc', '#6d28d9'],
    rim: { color: '#1e1b4b', innerColor: '#4f46e5', dotColor: '#c7d2fe', dotCount: 24 },
    lights: { color: '#c7d2fe', count: 20, speed: 4 },
    decor: { type: 'stars', color: '#4f46e5' },
    pointer: { color: '#1e1b4b', stroke: '#c7d2fe', glow: '#818cf8' },
    center: { ringFill: '#1e1b4b', ringStroke: '#4f46e5', fill: '#4f46e5', hubEmoji: '🌟' },
    centerPulse: true,
    segment: { stroke: '#c7d2fe', strokeWidth: 1 },
    gradient: { opacity: 0.35 },
    pattern: { type: 'dots', color: '#ffffff', opacity: 0.4 },
    bgGlow: '#4f46e5',
    buttonGradient: ['#1e1b4b', '#4f46e5'],
    particle: { type: 'star', color: '#c7d2fe' },
  },
  {
    id: 'neon',
    name: 'Neon',
    emoji: '⚡',
    description: 'Dark with bright neon chase',
    defaultColors: ['#06b6d4', '#f43f5e', '#a3e635', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#fbbf24', '#22d3ee', '#e879f9'],
    rim: { color: '#0f172a', innerColor: '#06b6d4', dotColor: '#22d3ee', dotCount: 16 },
    lights: { color: '#22d3ee', count: 16, speed: 1.5 },
    decor: { type: 'neon', color: '#06b6d4' },
    pointer: { color: '#06b6d4', stroke: '#0f172a', glow: '#22d3ee' },
    center: { ringFill: '#0f172a', ringStroke: '#06b6d4', fill: '#0f172a', hubEmoji: '⚡' },
    centerPulse: true,
    segment: { stroke: '#0f172a', strokeWidth: 2 },
    gradient: { opacity: 0.2 },
    pattern: { type: 'stripes', color: '#ffffff', opacity: 0.12 },
    bgGlow: '#06b6d4',
    buttonGradient: ['#0f172a', '#06b6d4'],
    particle: { type: 'neon', color: '#22d3ee' },
  },
  {
    id: 'gold',
    name: 'Gold',
    emoji: '👑',
    description: 'Gold with shimmer & crown rim',
    defaultColors: ['#f59e0b', '#fbbf24', '#fde047', '#eab308', '#d97706', '#fcd34d', '#b45309', '#fef3c7', '#a16207', '#facc15'],
    rim: { color: '#78350f', innerColor: '#f59e0b', dotColor: '#fde047', dotCount: 20 },
    lights: { color: '#fde047', count: 16, speed: 3 },
    decor: { type: 'crowns', color: '#f59e0b' },
    pointer: { color: '#78350f', stroke: '#fde047', glow: '#fbbf24' },
    center: { ringFill: '#fde047', ringStroke: '#78350f', fill: '#78350f', hubEmoji: '👑' },
    centerPulse: true,
    segment: { stroke: '#fde047', strokeWidth: 1.5 },
    gradient: { opacity: 0.3 },
    pattern: { type: 'sparkles', color: '#ffffff', opacity: 0.25 },
    bgGlow: '#f59e0b',
    buttonGradient: ['#78350f', '#f59e0b'],
    particle: { type: 'coin', color: '#fde047' },
  },
  {
    id: 'ice',
    name: 'Ice',
    emoji: '❄️',
    description: 'Cyan-white with snowflake rim',
    defaultColors: ['#06b6d4', '#22d3ee', '#67e8f9', '#0891b2', '#0ea5e9', '#a5f3fc', '#155e75', '#cffafe', '#0e7490', '#7dd3fc'],
    rim: { color: '#0e7490', innerColor: '#22d3ee', dotColor: '#cffafe', dotCount: 20 },
    lights: { color: '#cffafe', count: 16, speed: 4 },
    decor: { type: 'snowflakes', color: '#22d3ee' },
    pointer: { color: '#0e7490', stroke: '#cffafe', glow: '#67e8f9' },
    center: { ringFill: '#cffafe', ringStroke: '#0e7490', fill: '#0e7490', hubEmoji: '❄️' },
    centerPulse: true,
    segment: { stroke: '#cffafe', strokeWidth: 1.5 },
    gradient: { opacity: 0.3 },
    pattern: { type: 'snowflakes', color: '#ffffff', opacity: 0.3 },
    bgGlow: '#22d3ee',
    buttonGradient: ['#0e7490', '#22d3ee'],
    particle: { type: 'snowflake', color: '#cffafe' },
  },
  {
    id: 'candy',
    name: 'Candy',
    emoji: '🍬',
    description: 'Pink-purple with sprinkle rim',
    defaultColors: ['#ec4899', '#f472b6', '#a855f7', '#fbcfe8', '#c026d3', '#e879f9', '#d946ef', '#f0abfc', '#db2777', '#f9a8d4'],
    rim: { color: '#be185d', innerColor: '#ec4899', dotColor: '#fbcfe8', dotCount: 16 },
    lights: { color: '#f0abfc', count: 14, speed: 3 },
    decor: { type: 'hearts', color: '#ec4899' },
    pointer: { color: '#be185d', stroke: '#fbcfe8', glow: '#f472b6' },
    center: { ringFill: '#fbcfe8', ringStroke: '#be185d', fill: '#be185d', hubEmoji: '🍬' },
    centerPulse: true,
    segment: { stroke: '#fbcfe8', strokeWidth: 1.5 },
    gradient: { opacity: 0.25 },
    pattern: { type: 'sprinkles', color: '#ffffff', opacity: 0.35 },
    bgGlow: '#ec4899',
    buttonGradient: ['#be185d', '#ec4899'],
    particle: { type: 'sprinkle', color: '#f0abfc' },
  },
];

const THEME_MAP = Object.fromEntries(WHEEL_THEMES.map(t => [t.id, t]));

export function getWheelTheme(themeId) {
  return THEME_MAP[themeId] || WHEEL_THEMES[0];
}

// ─── SVG Pattern Definitions ───

function renderPatternDef(patternType, color, id) {
  switch (patternType) {
    case 'waves':
      return (
        <pattern id={id} width="24" height="12" patternUnits="userSpaceOnUse">
          <path d="M0,6 Q6,0 12,6 T24,6" fill="none" stroke={color} strokeWidth="1.2" />
        </pattern>
      );
    case 'dots':
      return (
        <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1" fill={color} />
        </pattern>
      );
    case 'sparkles':
      return (
        <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M9,3 L10,7 L14,9 L10,11 L9,15 L8,11 L4,9 L8,7 Z" fill={color} />
        </pattern>
      );
    case 'stripes':
      return (
        <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={color} strokeWidth="2" />
        </pattern>
      );
    case 'embers':
      return (
        <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="4" r="1" fill={color} />
          <circle cx="10" cy="8" r="0.7" fill={color} />
          <circle cx="6" cy="12" r="1.2" fill={color} opacity="0.7" />
          <circle cx="12" cy="2" r="0.5" fill={color} />
        </pattern>
      );
    case 'snowflakes':
      return (
        <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
          <g stroke={color} strokeWidth="0.7" fill="none" strokeLinecap="round">
            <line x1="9" y1="3" x2="9" y2="15" />
            <line x1="3" y1="9" x2="15" y2="9" />
            <line x1="5" y1="5" x2="13" y2="13" />
            <line x1="13" y1="5" x2="5" y2="13" />
          </g>
        </pattern>
      );
    case 'sprinkles':
      return (
        <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
          <rect x="1" y="5" width="3" height="1.2" fill={color} rx="0.5" transform="rotate(30 2.5 5.6)" />
          <rect x="7" y="1" width="3" height="1.2" fill={color} rx="0.5" transform="rotate(-25 8.5 1.6)" />
          <rect x="8" y="8" width="3" height="1.2" fill={color} rx="0.5" transform="rotate(55 9.5 8.6)" />
        </pattern>
      );
    case 'leaves':
      return (
        <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M9,4 C6,4 4,7 4,9 C4,11 6,14 9,14 C12,14 14,11 14,9 C14,7 12,4 9,4 Z" fill={color} />
          <line x1="9" y1="4" x2="9" y2="14" stroke={color} strokeWidth="0.5" opacity="0.5" />
        </pattern>
      );
    default:
      return null;
  }
}

// ─── Outer Decoration SVG Generator ───

export function renderOuterDecor(decor, cx, cy, outerR) {
  if (!decor) return null;
  const count = decor.count || 12;
  const elems = [];
  const baseR = outerR + 6;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const x = cx + baseR * Math.cos(angle);
    const y = cy + baseR * Math.sin(angle);
    const rot = (angle * 180 / Math.PI) + 90;

    switch (decor.type) {
      case 'diamonds':
        elems.push(
          <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
            <path d="M0,-5 L4,0 L0,5 L-4,0 Z" fill={decor.color} opacity="0.8" />
            <path d="M0,-3 L2,0 L0,3 L-2,0 Z" fill="#ffffff" opacity="0.4" />
          </g>
        );
        break;
      case 'waves':
        elems.push(
          <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
            <path d="M-5,0 Q-2.5,-3 0,0 T5,0" fill="none" stroke={decor.color} strokeWidth="2" strokeLinecap="round" />
          </g>
        );
        break;
      case 'flames':
        elems.push(
          <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
            <path d="M0,-6 C-3,-3 -4,0 -2,3 C-1,1 0,0 0,-1 C0,1 1,3 2,4 C4,1 3,-2 0,-6 Z" fill={decor.color} opacity="0.85" />
            <path d="M0,-3 C-1,-1 -1.5,1 0,2 C1,0 1,-1 0,-3 Z" fill="#fde047" opacity="0.7" />
          </g>
        );
        break;
      case 'leaves':
        elems.push(
          <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
            <path d="M0,-6 C-3,-4 -4,-1 -3,2 C-1,0 1,0 3,2 C4,-1 3,-4 0,-6 Z" fill={decor.color} opacity="0.8" />
            <line x1="0" y1="-6" x2="0" y2="2" stroke="#14532d" strokeWidth="0.5" />
          </g>
        );
        break;
      case 'gems':
        elems.push(
          <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
            <path d="M0,-6 L4,-2 L2,4 L-2,4 L-4,-2 Z" fill={decor.color} opacity="0.85" />
            <path d="M0,-6 L0,4 M-4,-2 L4,-2" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
          </g>
        );
        break;
      case 'stars':
        elems.push(
          <g key={i} transform={`translate(${x},${y})`}>
            <path d="M0,-6 L1.5,-1.5 L6,-1.5 L2.5,1.5 L4,6 L0,3 L-4,6 L-2.5,1.5 L-6,-1.5 L-1.5,-1.5 Z" fill={decor.color} opacity="0.85" />
          </g>
        );
        break;
      case 'neon':
        elems.push(
          <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
            <rect x="-3" y="-1" width="6" height="2" rx="1" fill={decor.color} opacity="0.9" />
            <rect x="-2" y="-0.5" width="4" height="1" rx="0.5" fill="#ffffff" opacity="0.6" />
          </g>
        );
        break;
      case 'crowns':
        elems.push(
          <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
            <path d="M-4,2 L-4,-2 L-2,0 L0,-3 L2,0 L4,-2 L4,2 Z" fill={decor.color} opacity="0.9" />
            <circle cx="0" cy="-3" r="1" fill="#fde047" />
          </g>
        );
        break;
      case 'snowflakes':
        elems.push(
          <g key={i} transform={`translate(${x},${y})`} stroke={decor.color} strokeWidth="1" fill="none" strokeLinecap="round">
            <line x1="0" y1="-5" x2="0" y2="5" />
            <line x1="-5" y1="0" x2="5" y2="0" />
            <line x1="-3.5" y1="-3.5" x2="3.5" y2="3.5" />
            <line x1="3.5" y1="-3.5" x2="-3.5" y2="3.5" />
          </g>
        );
        break;
      case 'hearts':
        elems.push(
          <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
            <path d="M0,3 C-3,0 -4,-2 -2,-3 C-1,-3.5 0,-2 0,-1 C0,-2 1,-3.5 2,-3 C4,-2 3,0 0,3 Z" fill={decor.color} opacity="0.85" />
          </g>
        );
        break;
    }
  }
  return elems;
}

/**
 * ThemeDefs — renders SVG <defs> with gradient and pattern definitions for a theme.
 */
export function ThemeDefs({ theme, uid }) {
  const defs = [];
  const prefix = `tw-${uid || 'w'}`;

  if (theme?.gradient) {
    defs.push(
      <radialGradient key="grad" id={`${prefix}-grad`} cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity={theme.gradient.opacity} />
        <stop offset="100%" stopColor="#000000" stopOpacity={theme.gradient.opacity * 0.5} />
      </radialGradient>
    );
  }

  if (theme?.pattern) {
    const patternEl = renderPatternDef(theme.pattern.type, theme.pattern.color, `${prefix}-pat`);
    if (patternEl) defs.push(<React.Fragment key="pat">{patternEl}</React.Fragment>);
  }

  return defs.length > 0 ? <defs>{defs}</defs> : null;
}

export default function WheelThemeCatalog() { return null; }