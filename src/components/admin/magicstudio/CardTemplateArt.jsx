import React from 'react';
import { alpha } from '@/lib/cardDesigns';

// Background art for every template style. Built from gradients and shapes only,
// so it renders the same in the editor, the print sheet and the PDF export.
const layer = (backgroundImage, extra = {}) => (
  <div style={{ position: 'absolute', inset: 0, backgroundImage, ...extra }} />
);

const STARS =
  'radial-gradient(1.6px 1.6px at 22% 26%, #ffffff, transparent), radial-gradient(1.2px 1.2px at 62% 14%, #ffffff, transparent), radial-gradient(1.4px 1.4px at 40% 72%, #ffffff, transparent), radial-gradient(1.1px 1.1px at 84% 58%, #ffffff, transparent), radial-gradient(1.5px 1.5px at 12% 82%, #ffffff, transparent), radial-gradient(1.2px 1.2px at 72% 86%, #ffffff, transparent)';

const BUBBLES = [
  { left: '10%', top: '52%', size: 26 },
  { left: '76%', top: '16%', size: 16 },
  { left: '58%', top: '66%', size: 34 },
  { left: '34%', top: '28%', size: 12 },
  { left: '88%', top: '74%', size: 20 },
  { left: '46%', top: '44%', size: 9 },
];

export default function CardTemplateArt({ templateId, colors, backgroundUri }) {
  const c = colors;
  let art = null;

  if (templateId === 'passport') {
    art = (
      <>
        {layer(`linear-gradient(150deg, #fffaf0 0%, ${alpha(c.secondary, 0.35)} 60%, ${alpha(c.primary, 0.22)} 100%)`)}
        {layer('radial-gradient(circle at 18% 22%, rgba(255,255,255,0.85), transparent 45%)')}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, ${c.primary}, ${c.secondary}, ${c.accent})` }} />
        <div style={{ position: 'absolute', right: 18, bottom: 12, fontSize: 46, opacity: 0.18 }}>🐾</div>
        <div style={{ position: 'absolute', left: 110, bottom: 28, fontSize: 30, opacity: 0.14 }}>🐾</div>
      </>
    );
  } else if (templateId === 'holo') {
    art = (
      <>
        {layer(`linear-gradient(120deg, ${c.primary} 0%, ${c.accent} 28%, ${c.secondary} 55%, ${c.primary} 78%, ${c.accent} 100%)`, { opacity: 0.9 })}
        {layer('repeating-linear-gradient(115deg, rgba(255,255,255,0.55) 0 5px, rgba(255,255,255,0) 5px 22px)', { opacity: 0.45 })}
        {layer('radial-gradient(circle at 78% 18%, rgba(255,255,255,0.75), transparent 38%)')}
        {layer('linear-gradient(180deg, rgba(255,255,255,0.35), rgba(255,255,255,0) 45%)')}
      </>
    );
  } else if (templateId === 'aurora') {
    art = (
      <>
        {layer(`linear-gradient(180deg, ${c.ink} 0%, ${alpha(c.ink, 0.92)} 55%, #02060f 100%)`)}
        {layer(
          `radial-gradient(120% 65% at 18% 6%, ${alpha(c.primary, 0.8)}, transparent 62%), radial-gradient(95% 55% at 62% 0%, ${alpha(c.secondary, 0.75)}, transparent 64%), radial-gradient(85% 55% at 92% 26%, ${alpha(c.accent, 0.6)}, transparent 66%)`,
          { opacity: 0.92 }
        )}
        {layer(
          `radial-gradient(70% 22% at 34% 40%, ${alpha(c.primary, 0.5)}, transparent 70%), radial-gradient(60% 18% at 76% 58%, ${alpha(c.accent, 0.42)}, transparent 72%)`
        )}
        {layer(STARS, { opacity: 0.6 })}
      </>
    );
  } else if (templateId === 'synth') {
    art = (
      <>
        {layer(`linear-gradient(180deg, ${alpha(c.ink, 0.96)} 0%, ${alpha(c.secondary, 0.82)} 58%, ${alpha(c.primary, 0.92)} 100%)`)}
        <div
          style={{
            position: 'absolute', left: '50%', top: '20%', width: 150, height: 150, marginLeft: -75, borderRadius: '50%',
            background: `linear-gradient(180deg, ${c.accent}, ${c.primary} 70%)`,
            boxShadow: `0 0 50px ${alpha(c.accent, 0.65)}`,
          }}
        />
        {layer('repeating-linear-gradient(180deg, rgba(0,0,0,0.42) 0 5px, transparent 5px 15px)', { top: '20%', height: 110, opacity: 0.85 })}
        {layer(
          'repeating-linear-gradient(90deg, rgba(255,255,255,0.22) 0 1px, transparent 1px 32px), repeating-linear-gradient(0deg, rgba(255,255,255,0.22) 0 1px, transparent 1px 14px)',
          { top: '66%', bottom: 0 }
        )}
      </>
    );
  } else if (templateId === 'ocean') {
    art = (
      <>
        {layer(`linear-gradient(180deg, ${alpha(c.primary, 0.62)} 0%, ${alpha(c.secondary, 0.55)} 45%, ${c.ink} 100%)`)}
        {layer(`radial-gradient(80% 45% at 22% 0%, ${alpha(c.accent, 0.42)}, transparent 55%)`)}
        {BUBBLES.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', left: b.left, top: b.top, width: b.size, height: b.size, borderRadius: '50%',
              border: `2px solid ${alpha(c.accent, 0.55)}`, background: alpha(c.accent, 0.16),
            }}
          />
        ))}
        {layer('repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 2px, transparent 2px 26px)')}
      </>
    );
  } else if (templateId === 'dots') {
    art = (
      <>
        {layer(`linear-gradient(140deg, #fff7fb 0%, ${alpha(c.secondary, 0.6)} 55%, ${alpha(c.primary, 0.4)} 100%)`)}
        {layer(`radial-gradient(${alpha(c.primary, 0.42)} 22%, transparent 23%)`, { backgroundSize: '30px 30px' })}
        {layer(`radial-gradient(${alpha(c.accent, 0.5)} 14%, transparent 15%)`, { backgroundSize: '30px 30px', backgroundPosition: '15px 15px' })}
        <div style={{ position: 'absolute', right: 14, bottom: 10, fontSize: 52, opacity: 0.16 }}>🍭</div>
      </>
    );
  } else if (templateId === 'lava') {
    art = (
      <>
        {layer(`radial-gradient(120% 80% at 50% 112%, ${alpha(c.secondary, 0.9)}, transparent 62%), linear-gradient(180deg, ${c.ink} 0%, ${alpha(c.secondary, 0.4)} 58%, ${c.ink} 100%)`)}
        {layer(
          `repeating-linear-gradient(72deg, ${alpha(c.primary, 0.55)} 0 2px, transparent 2px 46px), repeating-linear-gradient(-64deg, ${alpha(c.accent, 0.4)} 0 1.5px, transparent 1.5px 58px)`,
          { opacity: 0.85 }
        )}
        {layer(
          `radial-gradient(${alpha(c.accent, 0.8)} 1.6px, transparent 2.2px)`,
          { backgroundSize: '64px 56px', opacity: 0.8 }
        )}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: -12, height: 40, background: `linear-gradient(180deg, transparent, ${alpha(c.primary, 0.6)})` }} />
      </>
    );
  } else if (templateId === 'swirl') {
    art = (
      <>
        {layer(`radial-gradient(circle at 70% 30%, ${alpha(c.secondary, 0.55)}, transparent 58%), ${c.ink}`)}
        {layer(
          `conic-gradient(from 210deg at 70% 30%, ${alpha(c.primary, 0.8)}, transparent 22%, ${alpha(c.accent, 0.7)} 38%, transparent 55%, ${alpha(c.secondary, 0.65)} 72%, transparent 88%)`,
          { opacity: 0.9 }
        )}
        {layer(STARS, { opacity: 0.85 })}
      </>
    );
  } else if (templateId === 'ice') {
    art = (
      <>
        {layer(`linear-gradient(160deg, #f8fdff 0%, ${alpha(c.secondary, 0.75)} 55%, ${alpha(c.primary, 0.5)} 100%)`)}
        {layer(
          `repeating-linear-gradient(58deg, rgba(255,255,255,0.85) 0 2px, transparent 2px 44px), repeating-linear-gradient(-58deg, rgba(255,255,255,0.7) 0 2px, transparent 2px 52px), repeating-linear-gradient(0deg, ${alpha(c.accent, 0.12)} 0 1px, transparent 1px 38px)`
        )}
        <div style={{ position: 'absolute', right: 16, bottom: 12, fontSize: 48, opacity: 0.22 }}>❄️</div>
      </>
    );
  } else if (templateId === 'comic') {
    art = (
      <>
        {layer(`linear-gradient(135deg, ${c.secondary} 0%, #ffffff 46%, ${alpha(c.secondary, 0.92)} 100%)`)}
        {layer(`repeating-conic-gradient(from 0deg at 78% 22%, ${alpha(c.primary, 0.38)} 0deg 6deg, transparent 6deg 14deg)`, { opacity: 0.65 })}
        {layer(`radial-gradient(${alpha(c.accent, 0.55)} 2.6px, transparent 3px)`, { backgroundSize: '14px 14px', opacity: 0.5 })}
        <div style={{ position: 'absolute', inset: 10, border: `3px solid ${c.ink}`, borderRadius: 14, opacity: 0.22 }} />
        <div style={{ position: 'absolute', right: 12, bottom: 8, fontSize: 40, opacity: 0.22 }}>💥</div>
      </>
    );
  } else if (templateId === 'grid') {
    art = (
      <>
        {layer(`linear-gradient(160deg, ${alpha(c.primary, 0.22)} 0%, ${c.ink} 55%, ${alpha(c.secondary, 0.3)} 100%)`)}
        {layer('repeating-linear-gradient(0deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 18px), repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 18px)')}
        {layer(`linear-gradient(90deg, transparent, ${alpha(c.primary, 0.55)}, transparent)`, { top: 46, height: 2 })}
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
  } else {
    art = (
      <>
        {layer(`radial-gradient(circle at 76% 18%, ${alpha(c.accent, 0.35)}, transparent 52%), linear-gradient(160deg, ${alpha(c.primary, 0.3)} 0%, ${c.ink} 62%, #04050f 100%)`)}
        {layer(STARS, { opacity: 0.9 })}
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