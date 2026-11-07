import React from 'react';
import CardFront from '@/components/admin/magicstudio/CardFront';
import CardBack from '@/components/admin/magicstudio/CardBack';
import { CARD_IN, PAGE_IN, PRINT_SCALE, cardLeftIn } from '@/lib/cardPrint';

// One wallet-size card placed on a Letter page, with a dashed cut guide drawn
// just outside the card so trimming does not shave the artwork.
export default function PrintCardSlot({ side, card, design, name }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${cardLeftIn(side)}in`,
        top: `${PAGE_IN.margin}in`,
        width: `${CARD_IN.w}in`,
        height: `${CARD_IN.h}in`,
      }}
    >
      <div style={{ width: '100%', height: '100%', outline: '1px dashed #b6c2d1', outlineOffset: '4px' }}>
        {side === 'front' ? (
          <CardFront name={name} design={design} scale={PRINT_SCALE} />
        ) : (
          <CardBack number={card?.number || ''} design={design} scale={PRINT_SCALE} />
        )}
      </div>
    </div>
  );
}