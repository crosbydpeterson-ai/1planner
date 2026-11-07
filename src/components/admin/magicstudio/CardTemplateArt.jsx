import React from 'react';
import { alpha } from '@/lib/cardDesigns';

// Background art for each template. Built from gradients and dots only, so it
// renders the same in the editor, the print sheet and an exported image.
export default function CardTemplateArt({ templateId, colors, backgroundUri }) {
  const c = colors;
  const layer = (backgroundImage, extra = {}) => (
    <div style={{ position: 'absolute', inset: 0, backgroundImage, ...extra }} />
  );

  let art = null;

  if (templateId === 'neon_arcade') {
    art = (
      <>
        {layer(`linear-gradient(160deg, ${alpha(c.primary, 0.22)} 0%, ${c.ink} 55%, ${alpha(c.secondary, 0.3)} 100%)`)}
        {layer('repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 18px), repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 18px)')}
        {layer(`linear-gradient(90deg, transparent, ${alpha(c.primary, 0.55)}, transparent)`, { top: 46, height: 2 })}
        {/* pixel corners */}
        {[[14, 14], [14, 'auto'], ['auto', 14], ['auto', 'auto']].map((pos, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: pos[0],
              bottom: pos[1] === 'auto' ? 14 : undefined,
              left: pos[1] === 'auto' ? undefined : 14,
              right: pos[1] === 'auto' ? 14 : undefined,
              width: 14,
              height: 14,
              background: i % 2 ? c.accent : c.primary,
              boxShadow: `0 0 12px ${alpha(i % 2 ? c.accent : c.primary, 0.9)}`,
            }}
          />
        ))}
      </>
    );
  } else if (templateId === 'pet_passport') {
    art = (
      <>
        {layer(`linear-gradient(150deg, #fffaf0 0%, ${alpha(c.secondary, 0.35)} 60%, ${alpha(c.primary, 0.22)} 100%)`)}
        {layer('radial-gradient(circle at 18% 22%, rgba(255,255,255,0.85), transparent 45%)')}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${c.primary}, ${c.secondary}, ${c.accent})` }} />
        <div style={{ position: 'absolute', right: 18, bottom: 12, fontSize: 46, opacity: 0.18 }}>🐾</div>
        <div style={{ position: 'absolute', left: 110, bottom: 28, fontSize: 30, opacity: 0.14 }}>🐾</div>
      </>
    );
  } else if (templateId === 'holo_collector') {
    art = (
      <>
        {layer(`linear-gradient(120deg, ${c.primary} 0%, ${c.accent} 28%, ${c.secondary} 55%, ${c.primary} 78%, ${c.accent} 100%)`, { opacity: 0.9 })}
        {layer('repeating-linear-gradient(115deg, rgba(255,255,255,0.55) 0 5px, rgba(255,255,255,0) 5px 22px)', { opacity: 0.45 })}
        {layer(`radial-gradient(circle at 78% 18%, rgba(255,255,255,0.75), transparent 38%)`)}
        {layer('linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 45%)')}
      </>
    );
  } else {
    art = (
      <>
        {layer(`radial-gradient(circle at 76% 18%, ${alpha(c.accent, 0.35)}, transparent 52%), linear-gradient(160deg, ${alpha(c.primary, 0.3)} 0%, ${c.ink} 62%, #04050f 100%)`)}
        {layer(
          'radial-gradient(1.6px 1.6px at 22% 26%, #ffffff, transparent), radial-gradient(1.2px 1.2px at 62% 14%, #ffffff, transparent), radial-gradient(1.4px 1.4px at 40% 72%, #ffffff, transparent), radial-gradient(1.1px 1.1px at 84% 58%, #ffffff, transparent), radial-gradient(1.5px 1.5px at 12% 82%, #ffffff, transparent), radial-gradient(1.2px 1.2px at 72% 86%, #ffffff, transparent)',
          { opacity: 0.9 }
        )}
      </>
    );
  }

  return (
    <>
      {art}
      {backgroundUri && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${backgroundUri})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
    </>
  );
}