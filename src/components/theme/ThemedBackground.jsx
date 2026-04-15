import React, { useMemo } from 'react';
import { extractHex, isGradient } from './themeUtils';

export default function ThemedBackground({ colors }) {
  const rawColors = colors || {
    primary: '#6366f1',
    secondary: '#a855f7',
    accent: '#f59e0b',
    bg: '#f8fafc'
  };

  // Extract hex values for SVG / opacity usage, keep raw for backgrounds
  const primary = extractHex(rawColors.primary);
  const secondary = extractHex(rawColors.secondary);
  const accent = extractHex(rawColors.accent);
  const bg = extractHex(rawColors.bg);
  const bgRaw = rawColors.bg || '#f8fafc';

  // Generate unique pattern ID to avoid conflicts
  const patternId = useMemo(() => `pattern-${Math.random().toString(36).substr(2, 9)}`, []);

  // Pre-generate sparkle positions so they're stable across renders
  const sparkles = useMemo(() => 
    Array.from({ length: 35 }, (_, i) => ({
      width: Math.random() * 4 + 2,
      height: Math.random() * 4 + 2,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 8,
      duration: Math.random() * 3 + 3,
      glow: Math.random() * 10 + 5,
      colorIndex: i % 4,
    }))
  , []);

  // Determine if it's a dark theme based on background luminance
  const isDark = useMemo(() => {
    const hex = bg.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  }, [bg]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base background - supports gradients */}
      <div
        className="absolute inset-0"
        style={isGradient(bgRaw) ? { background: bgRaw } : { backgroundColor: bg }}
      />

      {/* MASSIVE animated gradient orbs - the main flex */}
      <div className="absolute inset-0">
        <div
          className="absolute w-[1200px] h-[1200px] rounded-full blur-[120px] animate-mega-blob"
          style={{
            background: `radial-gradient(circle, ${primary}50 0%, ${primary}20 40%, transparent 70%)`,
            top: '-40%',
            left: '-20%',
          }}
        />
        <div
          className="absolute w-[1000px] h-[1000px] rounded-full blur-[100px] animate-mega-blob animation-delay-3000"
          style={{
            background: `radial-gradient(circle, ${secondary}45 0%, ${secondary}15 40%, transparent 70%)`,
            top: '30%',
            right: '-30%',
          }}
        />
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-[80px] animate-mega-blob animation-delay-6000"
          style={{
            background: `radial-gradient(circle, ${accent}40 0%, ${accent}10 40%, transparent 70%)`,
            bottom: '-20%',
            left: '20%',
          }}
        />
        {/* Extra accent orb for more visual impact */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[60px] animate-mega-blob animation-delay-4000"
          style={{
            background: `radial-gradient(circle, ${primary}30 0%, ${secondary}15 50%, transparent 70%)`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Flowing aurora effect */}
      <div className="absolute inset-0 opacity-40">
        <div
          className="absolute inset-0 animate-aurora"
          style={{
            background: `
              linear-gradient(45deg, transparent 0%, ${primary}15 25%, transparent 50%),
              linear-gradient(135deg, transparent 0%, ${secondary}12 25%, transparent 50%),
              linear-gradient(225deg, transparent 0%, ${accent}10 25%, transparent 50%),
              linear-gradient(315deg, transparent 0%, ${primary}08 25%, transparent 50%)
            `,
            backgroundSize: '400% 400%',
          }}
        />
      </div>

      {/* Premium mesh gradient overlay */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `
            radial-gradient(ellipse at 20% 10%, ${primary}25 0px, transparent 50%),
            radial-gradient(ellipse at 80% 5%, ${secondary}20 0px, transparent 45%),
            radial-gradient(ellipse at 10% 60%, ${accent}15 0px, transparent 40%),
            radial-gradient(ellipse at 90% 50%, ${primary}18 0px, transparent 45%),
            radial-gradient(ellipse at 50% 90%, ${secondary}22 0px, transparent 50%),
            radial-gradient(ellipse at 30% 30%, ${accent}12 0px, transparent 35%)
          `
        }}
      />

      {/* Floating geometric shapes with glow */}
      <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`grad1-${patternId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.8" />
            <stop offset="100%" stopColor={secondary} stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`grad2-${patternId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={secondary} stopOpacity="0.7" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={`grad3-${patternId}`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.6" />
            <stop offset="100%" stopColor={primary} stopOpacity="0.2" />
          </linearGradient>
          <filter id={`glow-${patternId}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Floating circles with glow */}
        <circle cx="8%" cy="15%" r="100" fill={`url(#grad1-${patternId})`} className="animate-float-slow" filter={`url(#glow-${patternId})`} />
        <circle cx="92%" cy="20%" r="70" fill={`url(#grad2-${patternId})`} className="animate-float-slow animation-delay-2000" filter={`url(#glow-${patternId})`} />
        <circle cx="75%" cy="75%" r="120" fill={`url(#grad1-${patternId})`} className="animate-float-slow animation-delay-4000" filter={`url(#glow-${patternId})`} />
        <circle cx="15%" cy="85%" r="80" fill={`url(#grad3-${patternId})`} className="animate-float-slow animation-delay-3000" filter={`url(#glow-${patternId})`} />
        <circle cx="50%" cy="40%" r="60" fill={`url(#grad2-${patternId})`} className="animate-float-slow animation-delay-1000" filter={`url(#glow-${patternId})`} />
        
        {/* Decorative expanding rings */}
        <circle cx="50%" cy="50%" r="150" stroke={primary} strokeWidth="2" fill="none" strokeOpacity="0.3" className="animate-ring-expand" />
        <circle cx="50%" cy="50%" r="250" stroke={secondary} strokeWidth="1.5" fill="none" strokeOpacity="0.2" className="animate-ring-expand animation-delay-2000" />
        <circle cx="50%" cy="50%" r="350" stroke={accent} strokeWidth="1" fill="none" strokeOpacity="0.15" className="animate-ring-expand animation-delay-4000" />
        
        {/* Floating diamonds */}
        <polygon points="30,100 50,80 70,100 50,120" fill={`url(#grad3-${patternId})`} className="animate-float-rotate" filter={`url(#glow-${patternId})`} />
        <polygon points="85%,60% 87%,55% 89%,60% 87%,65%" fill={`url(#grad1-${patternId})`} className="animate-float-rotate animation-delay-3000" filter={`url(#glow-${patternId})`} style={{transform: 'scale(3)', transformOrigin: '87% 60%'}} />
      </svg>

      {/* Premium grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${primary}08 1.5px, transparent 1.5px),
            linear-gradient(90deg, ${primary}08 1.5px, transparent 1.5px)
          `,
          backgroundSize: '80px 80px',
          opacity: isDark ? 0.15 : 0.05
        }}
      />

      {/* Subtle dot pattern overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${primary}15 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: isDark ? 0.3 : 0.08
        }}
      />

      {/* Premium noise texture for depth */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: isDark ? 0.04 : 0.02
        }}
      />

      {/* Enhanced sparkle particles */}
      <div className="absolute inset-0">
        {sparkles.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-sparkle-enhanced"
            style={{
              width: `${s.width}px`,
              height: `${s.height}px`,
              backgroundColor: s.colorIndex === 0 ? primary : s.colorIndex === 1 ? secondary : s.colorIndex === 2 ? accent : '#ffffff',
              left: `${s.left}%`,
              top: `${s.top}%`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              boxShadow: `0 0 ${s.glow}px currentColor`,
            }}
          />
        ))}
      </div>

      {/* Animated flowing waves at bottom */}
      <svg 
        className="absolute bottom-0 left-0 w-full h-48 opacity-50"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`waveGrad1-${patternId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.5" />
            <stop offset="50%" stopColor={secondary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={primary} stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id={`waveGrad2-${patternId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={secondary} stopOpacity="0.4" />
            <stop offset="50%" stopColor={accent} stopOpacity="0.2" />
            <stop offset="100%" stopColor={secondary} stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <path
          className="animate-wave-flow"
          fill={`url(#waveGrad1-${patternId})`}
          d="M0,60 C240,120 480,20 720,80 C960,140 1200,40 1440,100 L1440,200 L0,200 Z"
        />
        <path
          className="animate-wave-flow animation-delay-2000"
          fill={`url(#waveGrad2-${patternId})`}
          d="M0,100 C360,40 720,140 1080,80 C1260,50 1380,90 1440,60 L1440,200 L0,200 Z"
        />
        <path
          className="animate-wave-flow animation-delay-4000"
          fill={primary}
          fillOpacity="0.15"
          d="M0,140 C180,100 360,160 540,120 C720,80 900,140 1080,100 C1260,60 1380,120 1440,80 L1440,200 L0,200 Z"
        />
      </svg>

      {/* Vignette effect for premium feel */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, transparent 50%, ${bg}40 100%)`
        }}
      />

      <style>{`
        @keyframes mega-blob {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          25% { transform: translate(40px, -50px) scale(1.1) rotate(5deg); }
          50% { transform: translate(-30px, 40px) scale(0.95) rotate(-3deg); }
          75% { transform: translate(50px, 20px) scale(1.05) rotate(3deg); }
        }
        @keyframes aurora {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); opacity: 0.7; }
          25% { transform: translateY(-30px) translateX(15px) rotate(5deg); opacity: 0.9; }
          50% { transform: translateY(-15px) translateX(-10px) rotate(-3deg); opacity: 0.8; }
          75% { transform: translateY(-40px) translateX(5px) rotate(3deg); opacity: 1; }
        }
        @keyframes float-rotate {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(180deg); }
        }
        @keyframes sparkle-enhanced {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes wave-flow {
          0% { transform: translateX(0); }
          50% { transform: translateX(-30px); }
          100% { transform: translateX(0); }
        }
        @keyframes ring-expand {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.1; transform: scale(1.1); }
        }
        .animate-mega-blob { animation: mega-blob 25s ease-in-out infinite; }
        .animate-aurora { animation: aurora 15s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 12s ease-in-out infinite; }
        .animate-float-rotate { animation: float-rotate 10s ease-in-out infinite; }
        .animate-sparkle-enhanced { animation: sparkle-enhanced 4s ease-in-out infinite; }
        .animate-wave-flow { animation: wave-flow 12s ease-in-out infinite; }
        .animate-ring-expand { animation: ring-expand 8s ease-in-out infinite; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-3000 { animation-delay: 3s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animation-delay-6000 { animation-delay: 6s; }
      `}</style>
    </div>
  );
}