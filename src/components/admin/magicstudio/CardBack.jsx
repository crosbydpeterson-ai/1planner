import React from 'react';
import CardCode from '@/components/admin/magicstudio/CardCode';
import { getTemplate, alpha } from '@/lib/cardDesigns';
import { CARD_W, CARD_H } from '@/lib/brandAssets';

// Wallet-size card back: the scannable code on a plain white plate with clear
// margins. The number is printed exactly as stored (leading zeros included);
// the PIN is never printed.
export default function CardBack({ number, design, scale = 1 }) {
  const template = getTemplate(design.templateId);
  const c = design.colors;

  return (
    <div style={{ width: CARD_W * scale, height: CARD_H * scale }}>
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 22,
          border: `3px solid ${alpha(c.primary, 0.55)}`,
          background: '#ffffff',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          color: '#101828',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ height: 12, background: `linear-gradient(90deg, ${c.primary}, ${c.secondary}, ${c.accent})` }} />
        <div style={{ flex: 1, padding: '16px 22px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase', color: '#667085' }}>
            Scan to open {template.name}
          </div>
          {/* white plate + margins keep the bars readable */}
          <div style={{ background: '#ffffff', padding: '6px 14px', borderRadius: 8, width: '100%' }}>
            <CardCode value={number} height={86} />
          </div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 17, letterSpacing: 2.5, fontWeight: 600 }}>{number}</div>
          <div style={{ fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: '#98a2b3' }}>
            1Planner · Magic Login
          </div>
        </div>
      </div>
    </div>
  );
}