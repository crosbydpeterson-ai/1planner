import React from 'react';
import CardFront from '@/components/admin/magicstudio/CardFront';
import CardBack from '@/components/admin/magicstudio/CardBack';
import { CARD_IN, PRINT_SCALE } from '@/lib/cardPrint';

// One wallet-size card at an exact spot on a Letter page. The dashed line is
// the card's own edge, so trimming along it leaves a full-size card with no
// stray white border and no shaved artwork.
export default function PrintCardSlot({ side, card, design, name, leftIn, topIn }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${leftIn}in`,
        top: `${topIn}in`,
        width: `${CARD_IN.w}in`,
        height: `${CARD_IN.h}in`,
        overflow: 'hidden',
        outline: '1px dashed #94a3b8',
      }}
    >
      {side === 'front' ? (
        <CardFront name={name} design={design} scale={PRINT_SCALE} />
      ) : (
        <CardBack number={card?.number || ''} design={design} scale={PRINT_SCALE} />
      )}
    </div>
  );
}