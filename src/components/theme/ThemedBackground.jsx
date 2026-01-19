import React, { useMemo } from 'react';

export default function ThemedBackground({ colors }) {
  const { primary, secondary, accent, bg } = colors || {
    primary: '#6366f1',
    secondary: '#a855f7',
    accent: '#f59e0b',
    bg: '#f8fafc'
  };

  // Generate unique pattern ID to avoid conflicts
  const patternId = useMemo(() => `pattern-${Math.random().toString(36).substr(2, 9)}`, []);

  // Determine if it's a dark theme
  const isDark = bg.toLowerCase() < '#888888';

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base solid background */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: bg }}
      />

      {/* Large animated gradient blobs */}
      <div className="absolute inset-0">
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-3xl animate-blob"
          style={{
            background: `radial-gradient(circle, ${primary}40 0%, transparent 70%)`,
            top: '-20%',
            left: '-10%',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-3xl animate-blob animation-delay-2000"
          style={{
            background: `radial-gradient(circle, ${secondary}35 0%, transparent 70%)`,
            top: '40%',
            right: '-15%',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-3xl animate-blob animation-delay-4000"
          style={{
            background: `radial-gradient(circle, ${accent}30 0%, transparent 70%)`,
            bottom: '-10%',
            left: '30%',
          }}
        />
      </div>

      {/* Mesh gradient overlay */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(at 40% 20%, ${primary}20 0px, transparent 50%),
            radial-gradient(at 80% 0%, ${secondary}15 0px, transparent 50%),
            radial-gradient(at 0% 50%, ${accent}10 0px, transparent 50%),
            radial-gradient(at 80% 50%, ${primary}15 0px, transparent 50%),
            radial-gradient(at 0% 100%, ${secondary}20 0px, transparent 50%),
            radial-gradient(at 80% 100%, ${accent}15 0px, transparent 50%)
          `
        }}
      />

      {/* Geometric shapes */}
      <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`grad1-${patternId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primary} stopOpacity="0.5" />
            <stop offset="100%" stopColor={secondary} stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id={`grad2-${patternId}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={secondary} stopOpacity="0.4" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Floating circles */}
        <circle cx="10%" cy="20%" r="80" fill={`url(#grad1-${patternId})`} className="animate-float" />
        <circle cx="85%" cy="15%" r="50" fill={`url(#grad2-${patternId})`} className="animate-float animation-delay-1000" />
        <circle cx="70%" cy="70%" r="100" fill={`url(#grad1-${patternId})`} className="animate-float animation-delay-3000" />
        <circle cx="20%" cy="80%" r="60" fill={`url(#grad2-${patternId})`} className="animate-float animation-delay-2000" />
        
        {/* Decorative rings */}
        <circle cx="50%" cy="50%" r="200" stroke={primary} strokeWidth="1" fill="none" strokeOpacity="0.2" className="animate-pulse-slow" />
        <circle cx="50%" cy="50%" r="300" stroke={secondary} strokeWidth="0.5" fill="none" strokeOpacity="0.15" className="animate-pulse-slow animation-delay-1000" />
      </svg>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(${primary} 1px, transparent 1px),
            linear-gradient(90deg, ${primary} 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Noise texture overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Sparkle particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-sparkle"
            style={{
              backgroundColor: i % 3 === 0 ? primary : i % 3 === 1 ? secondary : accent,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Animated wave at bottom */}
      <svg 
        className="absolute bottom-0 left-0 w-full h-32 opacity-30"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          className="animate-wave"
          fill={primary}
          fillOpacity="0.3"
          d="M0,40 C360,100 720,0 1080,60 C1260,90 1380,70 1440,80 L1440,120 L0,120 Z"
        />
        <path
          className="animate-wave animation-delay-2000"
          fill={secondary}
          fillOpacity="0.2"
          d="M0,60 C240,20 480,100 720,60 C960,20 1200,80 1440,40 L1440,120 L0,120 Z"
        />
      </svg>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(30px, 10px) scale(1.02); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 0.8; transform: scale(1); }
        }
        @keyframes wave {
          0% { transform: translateX(0); }
          50% { transform: translateX(-25px); }
          100% { transform: translateX(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.02); }
        }
        .animate-blob { animation: blob 20s ease-in-out infinite; }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-sparkle { animation: sparkle 4s ease-in-out infinite; }
        .animate-wave { animation: wave 10s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-3000 { animation-delay: 3s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
}