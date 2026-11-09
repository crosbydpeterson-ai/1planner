import React from 'react';
import CardQr from '@/components/admin/magicstudio/CardQr';
import CardTemplateArt from '@/components/admin/magicstudio/CardTemplateArt';
import { getTemplate, normalizeDesign, alpha } from '@/lib/cardDesigns';

// The helper card is drawn on the same 520 × 328 artboard the printed wallet
// card uses, so the print sheet can scale it straight onto paper.
export const HELPER_CARD_W = 520;
export const HELPER_CARD_H = 328;

const QR_SIZE = 168;

// A helper card wears the same art as a magic card — the studio's templates,
// palette and sticker — but keeps its number on the front as one large QR code,
// because it is scanned by an admin rather than kept in a wallet.
export default function HelperCardFace({ card }) {
  const design = normalizeDesign(card?.design);
  const template = getTemplate(design.templateId);
  const c = design.colors;
  const textColor = design.textColor || template.text;
  const frame =
    template.frame === 'holo'
      ? 'rgba(255,255,255,0.85)'
      : template.frame === 'soft'
      ? alpha(c.primary, 0.6)
      : alpha(c.primary, 0.85);
  const title = design.displayName || card?.nickname || 'Helper Card';
  const sticker = design.sticker || '🛠️';

  return (
    <div
      style={{
        width: HELPER_CARD_W,
        height: HELPER_CARD_H,
        // The border is part of the footprint so the artboard matches the cut
        // guides the print sheet draws around it.
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 22,
        border: `3px solid ${frame}`,
        boxShadow: `inset 0 0 26px ${alpha(c.primary, 0.35)}`,
        color: textColor,
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
      }}
    >
      <CardTemplateArt templateId={template.art} colors={c} backgroundUri={design.backgroundUri} />

      <div style={{ position: 'absolute', inset: 0, padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 22 }}>
        <div style={{ background: '#ffffff', padding: 10, borderRadius: 16, flexShrink: 0, position: 'relative' }}>
          <CardQr value={card?.number || ''} size={QR_SIZE} />
        </div>

        <div style={{ position: 'relative', minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: 2.6, textTransform: 'uppercase', opacity: 0.8 }}>1Planner</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  marginTop: 3,
                  padding: '4px 9px',
                  borderRadius: 999,
                  background: alpha(c.ink, 0.35),
                  border: `1px solid ${alpha(c.primary, 0.8)}`,
                  display: 'inline-block',
                }}
              >
                Helper Card
              </div>
            </div>
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: alpha(c.ink, template.stickerBg),
                border: `2px solid ${alpha(c.accent, 0.85)}`,
                fontSize: 32,
                lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {sticker}
            </div>
          </div>

          <div
            style={{
              fontSize: 24,
              fontWeight: 900,
              lineHeight: 1.15,
              textShadow: template.glow ? `0 0 14px ${alpha(c.primary, 0.9)}` : 'none',
              wordBreak: 'break-word',
            }}
          >
            {title}
          </div>

          <div style={{ fontSize: 11, opacity: 0.8 }}>{card?.adminUsername || 'Admin'} · admin only</div>

          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, letterSpacing: 1.6, opacity: 0.95, wordBreak: 'break-all' }}>
            {card?.number || ''}
          </div>

          <div style={{ fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.6 }}>
            One action per scan
          </div>
        </div>
      </div>
    </div>
  );
}