import React from 'react';
import { encodeCode128, CODE128_QUIET } from '@/lib/code128';

// Barcode drawn as plain bars in Code 128, so it prints sharp and stays fully
// separate from the card artwork. A quiet zone of blank modules is baked into
// each side of the drawing, because a scanner needs white space to find the
// start and end of the code. The caller still keeps it on a white plate.
export default function CardCode({ value, height = 70, color = '#101828' }) {
  const modules = encodeCode128(value);
  const total = modules.reduce((sum, m) => sum + m.width, CODE128_QUIET * 2);

  const rects = [];
  let cursor = CODE128_QUIET;
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