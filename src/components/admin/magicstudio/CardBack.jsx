import React from 'react';
import CardCode from '@/components/admin/magicstudio/CardCode';
import CardQr from '@/components/admin/magicstudio/CardQr';
import CardTemplateArt from '@/components/admin/magicstudio/CardTemplateArt';
import { getTemplate, alpha } from '@/lib/cardDesigns';
import { CARD_W, CARD_H } from '@/lib/brandAssets';

// Wallet-size card back, wearing the same theme as the front. The number is
// printed exactly as stored (leading zeros included); the PIN is never printed.
// Text and bar colours are adjustable so both stay readable on any theme.
export default function CardBack({ number, design, scale = 1 }) {
  const template = getTemplate(design.templateId);
  const c = design.colors;
  const textColor = design.backTextColor || design.textColor || template.text;
  const barcodeColor = design.barcodeColor || '#101828';
  const frame =
    template.frame === 'holo'
      ? 'rgba(255,255,255,0.85)'
      : template.frame === 'soft'
      ? alpha(c.primary, 0.6)
      : alpha(c.primary, 0.85);

  return (
    <div style={{ width: CARD_W * scale, height: CARD_H * scale }}>
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          // The border is part of the card's footprint, so the artwork really is
          // CARD_W wide and prints inside its cut guides instead of 3px past them.
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 22,
          border: `3px solid ${frame}`,
          boxShadow: `inset 0 0 26px ${alpha(c.primary, 0.35)}`,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          color: textColor,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <CardTemplateArt templateId={template.art} colors={c} backgroundUri={design.backgroundUri} />

        {/* Theme scrim: keeps the printed text readable over any artwork. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(160deg, ${alpha(c.ink, 0.82)}, ${alpha(c.ink, 0.5)} 55%, ${alpha(c.primary, 0.42)})`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: `linear-gradient(90deg, ${c.primary}, ${c.secondary}, ${c.accent})`,
          }}
        />

        <div
          style={{
            position: 'relative',
            flex: 1,
            padding: '26px 22px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: 2.6, textTransform: 'uppercase', opacity: 0.9 }}>
            {design.displayName?.trim() || template.name} · Magic Login
          </div>

          {/* One white plate holds both codes, side by side: the QR code (read
              almost instantly) and the Code 128 bars (older scanners, and cards
              already printed). Both carry the card number exactly as stored —
              leading zeros included, never a URL, never the PIN. */}
          <div
            style={{
              background: '#ffffff',
              padding: '10px 12px',
              borderRadius: 10,
              width: '100%',
              border: `1px solid ${alpha(c.primary, 0.35)}`,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <CardQr value={number} size={132} />
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <CardCode value={number} height={76} color={barcodeColor} />
              <div
                style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 17,
                  letterSpacing: 2.2,
                  fontWeight: 700,
                  color: '#101828',
                }}
              >
                {number}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', opacity: 0.65 }}>
            1Planner · Scan to sign in
          </div>
        </div>
      </div>
    </div>
  );
}