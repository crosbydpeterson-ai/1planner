import React from 'react';

export default function ThemedBackground({ colors }) {
  const { primary, secondary, accent, bg } = colors || {
    primary: '#6366f1',
    secondary: '#a855f7',
    accent: '#f59e0b',
    bg: '#f8fafc'
  };

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${bg} 0%, ${primary}15 50%, ${secondary}20 100%)`
        }}
      />

      {/* Swirl pattern using radial gradients */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 30%, ${primary}25 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 80% 70%, ${secondary}20 0%, transparent 50%),
            radial-gradient(ellipse 50% 50% at 50% 50%, ${accent}15 0%, transparent 40%)
          `
        }}
      />

      {/* Line patterns */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 40px,
              ${primary}30 40px,
              ${primary}30 41px
            ),
            repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 40px,
              ${secondary}20 40px,
              ${secondary}20 41px
            )
          `
        }}
      />

      {/* Random dots/circles */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <pattern id="dots" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="2" fill={primary} />
            <circle cx="40" cy="30" r="1.5" fill={secondary} />
            <circle cx="25" cy="50" r="1" fill={accent} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Wavy lines using SVG */}
      <svg className="absolute inset-0 w-full h-full opacity-15" preserveAspectRatio="none">
        <path
          d={`M0,100 Q250,50 500,100 T1000,100 T1500,100 T2000,100`}
          stroke={primary}
          strokeWidth="2"
          fill="none"
          className="animate-pulse"
        />
        <path
          d={`M0,200 Q300,150 600,200 T1200,200 T1800,200`}
          stroke={secondary}
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d={`M0,300 Q200,350 400,300 T800,300 T1200,300 T1600,300 T2000,300`}
          stroke={accent}
          strokeWidth="1"
          fill="none"
        />
      </svg>
    </div>
  );
}