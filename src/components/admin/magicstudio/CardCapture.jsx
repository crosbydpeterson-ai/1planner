import React from 'react';
import CardFront from '@/components/admin/magicstudio/CardFront';
import CardBack from '@/components/admin/magicstudio/CardBack';
import { CARD_W, CARD_H } from '@/lib/brandAssets';

// Full-size front and back of every card, kept off-screen, so the PDF export
// can capture the exact artwork without depending on the browser's print dialog.
export default function CardCapture({ refs, items }) {
  return (
    <div
      aria-hidden
      style={{ position: 'fixed', left: -10000, top: 0, width: CARD_W, pointerEvents: 'none' }}
    >
      {items.map((item, index) => (
        <div key={item.card?.id || index}>
          <div
            ref={(el) => {
              refs.current[index] = { ...(refs.current[index] || {}), front: el };
            }}
            style={{ width: CARD_W, height: CARD_H }}
          >
            <CardFront name={item.name} design={item.design} />
          </div>
          <div
            ref={(el) => {
              refs.current[index] = { ...(refs.current[index] || {}), back: el };
            }}
            style={{ width: CARD_W, height: CARD_H }}
          >
            <CardBack number={item.card?.number || ''} design={item.design} />
          </div>
        </div>
      ))}
    </div>
  );
}