import React from 'react';
import { encodeCode39 } from '@/lib/code39';

// Barcode drawn as plain bars, so it prints sharp and stays fully separate from
// the card artwork. The caller keeps it on a white plate with quiet-zone margins.
export default function CardCode({ value, height = 70, color = '#101828' }) {
  const modules = encodeCode39(value);
  const total = modules.reduce((sum, m) => sum + m.width, 0);

  const rects = [];
  let cursor = 0;
  modules.forEach((m, i) => {
    if (m.bar) rects.push(<rect key={i} x={cursor} y={0} width={m.width} height={100} fill={color} />);
    cursor += m.width;
  });

  return (
    <svg
      viewBox={`0 0 ${total} 100`}
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block' }}
      role="img"
      aria-label="Card barcode"
    >
      <rect x={0} y={0} width={total} height={100} fill="#ffffff" />
      {rects}
    </svg>
  );
}