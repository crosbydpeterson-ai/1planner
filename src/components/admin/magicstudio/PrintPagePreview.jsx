import React from 'react';
import CardFront from '@/components/admin/magicstudio/CardFront';
import CardBack from '@/components/admin/magicstudio/CardBack';
import { CARD_IN, PAGE_IN, slotPos } from '@/lib/cardPrint';

const PAGE_PX = 240;

// On-screen miniature of one printed Letter page, showing where each card lands
// so the mirrored back position is visible before printing.
export default function PrintPagePreview({ side, label, entries }) {
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
        {entries.map((entry, index) => {
          const { left, top } = slotPos(index, side);
          return (
            <div
              key={`${side}-${index}`}
              style={{
                position: 'absolute',
                left: left * toPx,
                top: top * toPx,
                width: cardW,
                height: cardH,
                outline: '1px dashed #cbd5e1',
                overflow: 'hidden',
              }}
            >
              {side === 'front' ? (
                <CardFront name={entry.name} design={entry.design} scale={cardW / 520} />
              ) : (
                <CardBack number={entry.card?.number || ''} design={entry.design} scale={cardW / 520} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}