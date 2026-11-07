import React from 'react';
import CardFront from '@/components/admin/magicstudio/CardFront';
import CardBack from '@/components/admin/magicstudio/CardBack';
import { CARD_IN, PAGE_IN, cardLeftIn } from '@/lib/cardPrint';

const PAGE_PX = 232;

// On-screen miniature of one printed Letter page, showing where the card lands
// so the mirrored back position is visible before printing.
export default function PrintPagePreview({ side, label, card, design, name }) {
  const toPx = PAGE_PX / PAGE_IN.w;
  const cardW = CARD_IN.w * toPx;
  const cardH = CARD_IN.h * toPx;

  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-1.5">{label}</p>
      <div
        className="mx-auto relative bg-white border border-slate-300 rounded-[3px]"
        style={{ width: PAGE_PX, height: PAGE_IN.h * toPx }}
      >
        <div
          style={{
            position: 'absolute',
            left: cardLeftIn(side) * toPx,
            top: PAGE_IN.margin * toPx,
            width: cardW,
            height: cardH,
            outline: '1px dashed #cbd5e1',
            outlineOffset: 2,
          }}
        >
          {side === 'front' ? (
            <CardFront name={name} design={design} scale={cardW / 520} />
          ) : (
            <CardBack number={card?.number || ''} design={design} scale={cardW / 520} />
          )}
        </div>
      </div>
    </div>
  );
}