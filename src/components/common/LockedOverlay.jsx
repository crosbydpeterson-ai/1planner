import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { DEFAULT_LOCK_PAGE_CONFIG } from '@/lib/featureLocks';

export default function LockedOverlay({ featureLabel = 'This page', message = '', lockPageConfig = null }) {
  const navigate = useNavigate();
  const cfg = lockPageConfig || DEFAULT_LOCK_PAGE_CONFIG;

  // Redirect mode — send user to the configured URL
  if (cfg.mode === 'redirect' && cfg.redirectUrl) {
    window.location.href = cfg.redirectUrl;
    return null;
  }

  const bgStyle = cfg.backgroundImage
    ? { backgroundImage: `url(${cfg.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: cfg.backgroundColor };

  const fullMessage = message || cfg.message;
  const displayLabel = message ? featureLabel : '';

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={bgStyle}>
      {!cfg.backgroundImage && <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 50% 50%, ${cfg.accentColor}33, transparent 70%)` }} />}
      <div className="relative max-w-xl w-full text-center rounded-3xl shadow-2xl p-8"
        style={{ backgroundColor: cfg.cardColor, color: cfg.textColor }}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: cfg.accentColor + '22' }}>
          <span className="text-4xl">{cfg.emoji}</span>
        </div>
        <h1 className="text-2xl font-extrabold mb-2" style={{ color: cfg.textColor }}>{cfg.title}</h1>
        <p className="leading-relaxed" style={{ color: cfg.textColor + 'cc' }}>
          {displayLabel && <>The <span className="font-semibold">{displayLabel}</span> has been locked.{' '}</>}
          {fullMessage}
        </p>
        {cfg.showContact && (
          <p className="mt-3 text-sm" style={{ color: cfg.textColor + '99' }}>{cfg.contactText}</p>
        )}
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-2.5 rounded-xl font-semibold text-sm transition-transform hover:scale-105"
          style={{ backgroundColor: cfg.buttonColor, color: cfg.buttonTextColor }}
        >
          {cfg.buttonText}
        </button>
      </div>
    </div>
  );
}