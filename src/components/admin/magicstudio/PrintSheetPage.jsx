import React from 'react';
import PrintCardSlot from '@/components/admin/magicstudio/PrintCardSlot';
import { slotPos } from '@/lib/cardPrint';

// One printed Letter page: every card of this sheet, one side each.
export default function PrintSheetPage({ side, entries }) {
  return (
    <div className="magic-print-page">
      {entries.map((entry, index) => {
        const { left, top } = slotPos(index, side);
        return (
          <PrintCardSlot
            key={`${side}-${index}`}
            side={side}
            card={entry.card}
            design={entry.design}
            name={entry.name}
            leftIn={left}
            topIn={top}
          />
        );
      })}
    </div>
  );
}