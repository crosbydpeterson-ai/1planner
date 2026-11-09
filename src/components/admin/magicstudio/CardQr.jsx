import React from 'react';
import { encodeQr } from '@/lib/qrCode';

// A QR code drawn as plain black squares on white, with the standard four
// modules of quiet zone baked into the drawing. Scanners need that white
// margin to find the code, and it keeps the card's artwork out of the way.
const QUIET = 4;

export default function CardQr({ value, size = 132, color = '#000000' }) {
  const { size: count, modules } = encodeQr(value);
  const total = count + QUIET * 2;

  const squares = [];
  modules.forEach((row, r) => {
    row.forEach((dark, c) => {
      if (dark) {
        squares.push(
          <rect key={`${r}-${c}`} x={c + QUIET} y={r + QUIET} width={1} height={1} fill={color} />
        );
      }
    });
  });

  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ display: 'block', flexShrink: 0 }}
      role="img"
      aria-label="Card QR code"
    >
      <rect x={0} y={0} width={total} height={total} fill="#ffffff" />
      {squares}
    </svg>
  );
}