import React from 'react';
import CardQr from '@/components/admin/magicstudio/CardQr';

// The helper card is drawn on the same 520 × 328 artboard the printed wallet
// card uses, so the print dialog can scale it straight onto paper.
export const HELPER_CARD_W = 520;
export const HELPER_CARD_H = 328;

// A helper card is never decorated: one large black-on-white QR, the admin it
// belongs to, and nothing that could be mistaken for a login card.
export default function HelperCardFace({ card }) {
  return (
    <div
      style={{
        width: HELPER_CARD_W,
        height: HELPER_CARD_H,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 22,
        background: 'linear-gradient(140deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '24px 26px',
        boxSizing: 'border-box',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 82% 18%, rgba(99,102,241,0.35), transparent 62%)',
        }}
      />

      <div style={{ background: '#ffffff', padding: 10, borderRadius: 14, flexShrink: 0, position: 'relative' }}>
        <CardQr value={card.number} size={168} />
      </div>

      <div style={{ position: 'relative', minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 10, letterSpacing: 3, opacity: 0.65, textTransform: 'uppercase' }}>1Planner</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 0.4, marginTop: 2 }}>Helper Card</div>
        {card.nickname && (
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4, lineHeight: 1.3 }}>{card.nickname}</div>
        )}
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 10 }}>
          {card.adminUsername || 'Admin'} · admin only
        </div>
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
            letterSpacing: 1.6,
            marginTop: 8,
            opacity: 0.95,
            wordBreak: 'break-all',
          }}
        >
          {card.number}
        </div>
        <div style={{ fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.55, marginTop: 10 }}>
          One action per scan
        </div>
      </div>
    </div>
  );
}