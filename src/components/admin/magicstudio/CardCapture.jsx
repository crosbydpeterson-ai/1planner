import React from 'react';
import CardFront from '@/components/admin/magicstudio/CardFront';
import CardBack from '@/components/admin/magicstudio/CardBack';
import { CARD_W, CARD_H } from '@/lib/brandAssets';

// Full-size front and back kept off-screen, so the PDF export can capture the
// exact artwork without depending on the browser's print dialog.
export default function CardCapture({ refs, card, design, name }) {
  return (
    <div
      aria-hidden
      style={{ position: 'fixed', left: -10000, top: 0, width: CARD_W, pointerEvents: 'none' }}
    >
      <div ref={(el) => (refs.current.front = el)} style={{ width: CARD_W, height: CARD_H }}>
        <CardFront name={name} design={design} />
      </div>
      <div ref={(el) => (refs.current.back = el)} style={{ width: CARD_W, height: CARD_H }}>
        <CardBack number={card?.number || ''} design={design} />
      </div>
    </div>
  );
}