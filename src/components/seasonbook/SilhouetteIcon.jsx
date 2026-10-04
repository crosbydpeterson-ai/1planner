import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable solid-black SVG silhouettes for unowned rewards.
 * Used when transparency cannot be reliably established from existing
 * asset information (e.g. opaque pet PNGs would become black rectangles
 * under brightness(0), so we show a type silhouette instead).
 */
const SILHOUETTES = {
  pet: (
    <g fill="#000">
      <ellipse cx="50" cy="64" rx="22" ry="18" />
      <circle cx="28" cy="40" r="9" />
      <circle cx="50" cy="30" r="9" />
      <circle cx="72" cy="40" r="9" />
    </g>
  ),
  theme: (
    <g fill="#000">
      <path d="M50 14 Q18 14 18 46 Q18 72 44 74 Q52 74 52 66 Q52 56 62 56 Q80 56 80 42 Q80 14 50 14 Z" />
    </g>
  ),
  title: (
    <g fill="#000">
      <path d="M28 16 L72 16 L70 48 Q70 58 50 58 Q30 58 30 48 Z" />
      <rect x="44" y="58" width="12" height="14" />
      <rect x="32" y="72" width="36" height="6" rx="2" />
    </g>
  ),
  coins: (
    <g fill="#000">
      <circle cx="50" cy="50" r="32" />
      <circle cx="50" cy="50" r="22" fill="#FFF8E1" />
      <circle cx="50" cy="50" r="14" />
    </g>
  ),
  magic_egg: (
    <g fill="#000">
      <ellipse cx="50" cy="52" rx="26" ry="36" />
    </g>
  ),
  food: (
    <g fill="#000">
      <path d="M18 42 L82 42 L76 74 Q76 80 50 80 Q24 80 24 74 Z" />
      <ellipse cx="50" cy="42" rx="32" ry="7" />
    </g>
  ),
};

export default function SilhouetteIcon({ type, className }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('w-16 h-16', className)}
      aria-hidden="true"
    >
      {SILHOUETTES[type] || SILHOUETTES.pet}
    </svg>
  );
}