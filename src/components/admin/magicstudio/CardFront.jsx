import React from 'react';
import CardTemplateArt from '@/components/admin/magicstudio/CardTemplateArt';
import { getTemplate, alpha } from '@/lib/cardDesigns';
import { APP_LOGO_URL, CARD_W, CARD_H } from '@/lib/brandAssets';

// Wallet-size card front: logo, printed nickname and the chosen art. The number
// and PIN never appear here — they belong to the back.
export default function CardFront({ name, design, scale = 1 }) {
  const template = getTemplate(design.templateId);
  const c = design.colors;
  const isPet = !!design.petId;
  const frame =
    template.id === 'holo_collector'
      ? 'rgba(255,255,255,0.85)'
      : template.id === 'pet_passport'
      ? alpha(c.primary, 0.6)
      : alpha(c.primary, 0.85);

  return (
    <div style={{ width: CARD_W * scale, height: CARD_H * scale }}>
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 22,
          border: `3px solid ${frame}`,
          boxShadow: `inset 0 0 26px ${alpha(c.primary, 0.35)}`,
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          color: template.text,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <CardTemplateArt templateId={template.id} colors={c} backgroundUri={design.backgroundUri} />

        <div style={{ position: 'absolute', inset: 0, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src={APP_LOGO_URL}
                alt="1Planner"
                style={{ width: 40, height: 40, borderRadius: 999, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.75)' }}
              />
              <div style={{ lineHeight: 1.05 }}>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 0.5 }}>1Planner</div>
                <div style={{ fontSize: 10, letterSpacing: 2.4, opacity: 0.8, textTransform: 'uppercase' }}>Quest Planner</div>
              </div>
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 1.6,
                padding: '5px 9px',
                borderRadius: 999,
                background: alpha(c.ink, 0.35),
                border: `1px solid ${alpha(c.primary, 0.8)}`,
                color: template.text,
              }}
            >
              MAGIC CARD
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.75 }}>Card holder</div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  lineHeight: 1.1,
                  marginTop: 4,
                  textShadow: template.id === 'midnight_quest' || template.id === 'neon_arcade' ? `0 0 14px ${alpha(c.primary, 0.9)}` : 'none',
                  wordBreak: 'break-word',
                }}
              >
                {name || 'Magic Card'}
              </div>
            </div>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: alpha(c.ink, template.id === 'pet_passport' ? 0.06 : 0.32),
                border: `2px solid ${alpha(c.accent, 0.85)}`,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {isPet && design.petImageUrl ? (
                <img src={design.petImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 46, lineHeight: 1 }}>{isPet ? design.petEmoji || '🐾' : design.sticker || '⭐'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}