import React from 'react';

/**
 * Wheel Theme Catalog
 * Each theme controls the visual design of a spin wheel: segment colors, rim style,
 * pointer style, center hub, gradient overlay, and texture pattern.
 */

export const WHEEL_THEMES = [
  {
    id: 'classic',
    name: 'Classic',
    emoji: '🎯',
    description: 'Purple rim with clean segments',
    defaultColors: ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#84cc16'],
    rim: { color: '#7c3aed', innerColor: '#a78bfa', dotColor: '#ffffff', dotCount: 16 },
    pointer: { color: '#7c3aed', stroke: '#ffffff' },
    center: { ringFill: '#ffffff', ringStroke: '#7c3aed', fill: '#7c3aed', hubEmoji: '🎯' },
    segment: { stroke: '#ffffff', strokeWidth: 2 },
    gradient: null,
    pattern: null,
    bgGlow: null,
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    description: 'Deep blues with wave textures',
    defaultColors: ['#0ea5e9', '#06b6d4', '#0891b2', '#0284c7', '#155e75', '#0369a1', '#075985', '#0c4a6e', '#1e40af', '#1e3a8a'],
    rim: { color: '#0c4a6e', innerColor: '#0ea5e9', dotColor: '#bae6fd', dotCount: 20 },
    pointer: { color: '#0c4a6e', stroke: '#bae6fd' },
    center: { ringFill: '#bae6fd', ringStroke: '#0c4a6e', fill: '#0c4a6e', hubEmoji: '🌊' },
    segment: { stroke: '#bae6fd', strokeWidth: 1.5 },
    gradient: { angle: 0, opacity: 0.25 },
    pattern: { type: 'waves', color: '#ffffff', opacity: 0.18 },
    bgGlow: '#0ea5e9',
  },
  {
    id: 'fire',
    name: 'Fire',
    emoji: '🔥',
    description: 'Reds and oranges with ember textures',
    defaultColors: ['#ef4444', '#f97316', '#f59e0b', '#dc2626', '#ea580c', '#b91c1c', '#d97706', '#fbbf24', '#fde047', '#fb923c'],
    rim: { color: '#7c2d12', innerColor: '#f97316', dotColor: '#fbbf24', dotCount: 16 },
    pointer: { color: '#7c2d12', stroke: '#fbbf24' },
    center: { ringFill: '#7c2d12', ringStroke: '#f97316', fill: '#f97316', hubEmoji: '🔥' },
    segment: { stroke: '#fbbf24', strokeWidth: 1.5 },
    gradient: { angle: 0, opacity: 0.3 },
    pattern: { type: 'embers', color: '#fde047', opacity: 0.25 },
    bgGlow: '#f97316',
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🍀',
    description: 'Greens with leaf textures',
    defaultColors: ['#16a34a', '#15803d', '#22c55e', '#166534', '#4ade80', '#65a30d', '#86efac', '#14532d', '#3b82f6', '#84cc16'],
    rim: { color: '#14532d', innerColor: '#22c55e', dotColor: '#bbf7d0', dotCount: 16 },
    pointer: { color: '#14532d', stroke: '#bbf7d0' },
    center: { ringFill: '#bbf7d0', ringStroke: '#14532d', fill: '#14532d', hubEmoji: '🍀' },
    segment: { stroke: '#bbf7d0', strokeWidth: 1.5 },
    gradient: { angle: 0, opacity: 0.25 },
    pattern: { type: 'leaves', color: '#ffffff', opacity: 0.15 },
    bgGlow: '#22c55e',
  },
  {
    id: 'crystal',
    name: 'Crystal',
    emoji: '💎',
    description: 'Purple-pink with sparkle textures',
    defaultColors: ['#a855f7', '#ec4899', '#8b5cf6', '#d946ef', '#c026d3', '#7c3aed', '#f472b6', '#a78bfa', '#e879f9', '#f0abfc'],
    rim: { color: '#581c87', innerColor: '#a855f7', dotColor: '#f0abfc', dotCount: 20 },
    pointer: { color: '#581c87', stroke: '#f0abfc' },
    center: { ringFill: '#f0abfc', ringStroke: '#581c87', fill: '#581c87', hubEmoji: '💎' },
    segment: { stroke: '#f0abfc', strokeWidth: 1.5 },
    gradient: { angle: 0, opacity: 0.3 },
    pattern: { type: 'sparkles', color: '#ffffff', opacity: 0.3 },
    bgGlow: '#a855f7',
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    emoji: '🌟',
    description: 'Indigo-violet with star textures',
    defaultColors: ['#4f46e5', '#4338ca', '#6366f1', '#3730a3', '#818cf8', '#7c3aed', '#312e81', '#8b5cf6', '#a5b4fc', '#6d28d9'],
    rim: { color: '#1e1b4b', innerColor: '#4f46e5', dotColor: '#c7d2fe', dotCount: 24 },
    pointer: { color: '#1e1b4b', stroke: '#c7d2fe' },
    center: { ringFill: '#1e1b4b', ringStroke: '#4f46e5', fill: '#4f46e5', hubEmoji: '🌟' },
    segment: { stroke: '#c7d2fe', strokeWidth: 1 },
    gradient: { angle: 0, opacity: 0.35 },
    pattern: { type: 'dots', color: '#ffffff', opacity: 0.4 },
    bgGlow: '#4f46e5',
  },
  {
    id: 'neon',
    name: 'Neon',
    emoji: '⚡',
    description: 'Dark with bright neon stripes',
    defaultColors: ['#06b6d4', '#f43f5e', '#a3e635', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#fbbf24', '#22d3ee', '#e879f9'],
    rim: { color: '#0f172a', innerColor: '#06b6d4', dotColor: '#22d3ee', dotCount: 16 },
    pointer: { color: '#06b6d4', stroke: '#0f172a' },
    center: { ringFill: '#0f172a', ringStroke: '#06b6d4', fill: '#0f172a', hubEmoji: '⚡' },
    segment: { stroke: '#0f172a', strokeWidth: 2 },
    gradient: { angle: 0, opacity: 0.2 },
    pattern: { type: 'stripes', color: '#ffffff', opacity: 0.12 },
    bgGlow: '#06b6d4',
  },
  {
    id: 'gold',
    name: 'Gold',
    emoji: '👑',
    description: 'Gold and amber with shimmer',
    defaultColors: ['#f59e0b', '#fbbf24', '#fde047', '#eab308', '#d97706', '#fcd34d', '#b45309', '#fef3c7', '#a16207', '#facc15'],
    rim: { color: '#78350f', innerColor: '#f59e0b', dotColor: '#fde047', dotCount: 20 },
    pointer: { color: '#78350f', stroke: '#fde047' },
    center: { ringFill: '#fde047', ringStroke: '#78350f', fill: '#78350f', hubEmoji: '👑' },
    segment: { stroke: '#fde047', strokeWidth: 1.5 },
    gradient: { angle: 0, opacity: 0.3 },
    pattern: { type: 'sparkles', color: '#ffffff', opacity: 0.25 },
    bgGlow: '#f59e0b',
  },
  {
    id: 'ice',
    name: 'Ice',
    emoji: '❄️',
    description: 'Cyan-white with snowflake textures',
    defaultColors: ['#06b6d4', '#22d3ee', '#67e8f9', '#0891b2', '#0ea5e9', '#a5f3fc', '#155e75', '#cffafe', '#0e7490', '#7dd3fc'],
    rim: { color: '#0e7490', innerColor: '#22d3ee', dotColor: '#cffafe', dotCount: 20 },
    pointer: { color: '#0e7490', stroke: '#cffafe' },
    center: { ringFill: '#cffafe', ringStroke: '#0e7490', fill: '#0e7490', hubEmoji: '❄️' },
    segment: { stroke: '#cffafe', strokeWidth: 1.5 },
    gradient: { angle: 0, opacity: 0.3 },
    pattern: { type: 'snowflakes', color: '#ffffff', opacity: 0.3 },
    bgGlow: '#22d3ee',
  },
  {
    id: 'candy',
    name: 'Candy',
    emoji: '🍬',
    description: 'Pink-purple with sprinkle textures',
    defaultColors: ['#ec4899', '#f472b6', '#a855f7', '#fbcfe8', '#c026d3', '#e879f9', '#d946ef', '#f0abfc', '#db2777', '#f9a8d4'],
    rim: { color: '#be185d', innerColor: '#ec4899', dotColor: '#fbcfe8', dotCount: 16 },
    pointer: { color: '#be185d', stroke: '#fbcfe8' },
    center: { ringFill: '#fbcfe8', ringStroke: '#be185d', fill: '#be185d', hubEmoji: '🍬' },
    segment: { stroke: '#fbcfe8', strokeWidth: 1.5 },
    gradient: { angle: 0, opacity: 0.25 },
    pattern: { type: 'sprinkles', color: '#ffffff', opacity: 0.35 },
    bgGlow: '#ec4899',
  },
];

const THEME_MAP = Object.fromEntries(WHEEL_THEMES.map(t => [t.id, t]));

export function getWheelTheme(themeId) {
  return THEME_MAP[themeId] || WHEEL_THEMES[0];
}

/**
 * Render SVG pattern <defs> for a given theme pattern type.
 */
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

/**
 * ThemeDefs — renders SVG <defs> with gradient and pattern definitions for a theme.
 * Must be rendered inside an <svg> element.
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