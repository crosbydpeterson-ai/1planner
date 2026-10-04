import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Solid-black SVG silhouettes for unowned rewards. Used instead of
 * brightness(0) because pet images may be opaque (would become black boxes).
 */
const SILHOUETTES = {
  // Generic cute pet: round body, two ears, little feet and tail
  pet: (
    <path d="M30 30 L24 8 L42 22 Q50 20 58 22 L76 8 L70 30 Q80 40 80 54 Q80 70 68 78 L70 88 Q70 92 64 92 L58 92 Q54 92 54 88 L54 84 L46 84 L46 88 Q46 92 42 92 L36 92 Q30 92 30 88 L32 78 Q20 70 20 54 Q20 40 30 30 Z M78 66 Q94 60 92 44 Q98 62 82 74 Z" />
  ),
  cat: (
    <path d="M28 34 L22 6 L42 24 Q50 22 58 24 L78 6 L72 34 Q80 44 78 58 Q76 72 64 78 Q76 82 76 92 L24 92 Q24 82 36 78 Q24 72 22 58 Q20 44 28 34 Z M76 88 Q96 84 92 62 Q90 54 84 56 Q90 64 86 74 Q82 82 74 82 Z" />
  ),
  owl: (
    <path d="M24 20 L36 30 Q50 24 64 30 L76 20 L76 40 Q86 54 82 70 Q78 88 50 92 Q22 88 18 70 Q14 54 24 40 Z M34 92 L40 86 L44 92 Z M56 92 L60 86 L66 92 Z" />
  ),
  slime: (
    <path d="M50 18 Q56 18 58 26 Q84 32 88 64 Q90 84 72 86 Q62 92 50 86 Q38 92 28 86 Q10 84 12 64 Q16 32 42 26 Q44 18 50 18 Z" />
  ),
  dragon: (
    <path d="M30 40 L18 18 L36 30 L40 14 L48 30 Q62 26 70 36 L90 26 L80 46 Q86 58 80 70 L88 84 L72 80 Q62 90 46 88 L40 94 L36 84 Q22 78 22 62 Q22 48 30 40 Z M10 50 L28 46 L26 62 Z" />
  ),
  theme: (
    <g>
      <rect x="14" y="26" width="44" height="56" rx="6" transform="rotate(-12 36 54)" />
      <rect x="34" y="18" width="44" height="56" rx="6" transform="rotate(8 56 46)" />
    </g>
  ),
  title: (
    <g>
      <path d="M8 40 L22 40 L22 66 L8 66 L14 53 Z" />
      <path d="M92 40 L78 40 L78 66 L92 66 L86 53 Z" />
      <rect x="18" y="30" width="64" height="30" rx="4" />
      <path d="M18 60 L26 68 L26 60 Z M82 60 L74 68 L74 60 Z" />
    </g>
  ),
  coins: (
    <g>
      <ellipse cx="50" cy="78" rx="30" ry="10" />
      <rect x="20" y="62" width="60" height="16" />
      <ellipse cx="50" cy="62" rx="30" ry="10" />
      <circle cx="56" cy="36" r="24" />
    </g>
  ),
  magic_egg: <ellipse cx="50" cy="54" rx="30" ry="40" />,
  food: (
    <g>
      <path d="M12 48 L88 48 Q86 84 50 86 Q14 84 12 48 Z" />
      <path d="M30 44 Q30 22 50 22 Q70 22 70 44 Z" />
    </g>
  ),
};

export default function SilhouetteIcon({ type, className }) {
  return (
    <svg viewBox="0 0 100 100" className={cn('w-28 h-28 md:w-32 md:h-32', className)} aria-hidden="true">
      <g fill="#000">{SILHOUETTES[type] || SILHOUETTES.pet}</g>
    </svg>
  );
}