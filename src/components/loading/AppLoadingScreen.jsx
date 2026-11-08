import React from 'react';
import { Home, Music2, ClipboardList, Gamepad2, CalendarHeart, Trophy, Gem, Sparkles, Stamp, Store, Bell } from 'lucide-react';
import BrandLogo from '@/components/branding/BrandLogo';

const NAV_ITEMS = [
  { label: 'Home', Icon: Home },
  { label: 'Music', Icon: Music2 },
  { label: 'Quests', Icon: ClipboardList },
  { label: 'Games', Icon: Gamepad2 },
  { label: 'Events', Icon: CalendarHeart },
  { label: 'Rank', Icon: Trophy },
  { label: 'Collection', Icon: Gem },
  { label: '1Pass', Icon: Sparkles },
  { label: 'Season Book', Icon: Stamp },
  { label: 'Marketplace', Icon: Store },
  { label: 'Updates', Icon: Bell },
];

// Soft translucent circles drifting in the background.
const BLOBS = [
  { size: 300, top: '-6%', left: '-8%', color: '#dcd4f5', blur: 2, dur: 11, delay: 0 },
  { size: 190, top: '12%', left: '74%', color: '#f7e3d1', blur: 2, dur: 9, delay: 1.2 },
  { size: 120, top: '58%', left: '8%', color: '#e7defb', blur: 1, dur: 13, delay: 0.6 },
  { size: 74, top: '38%', left: '18%', color: '#f7e3d1', blur: 0, dur: 8, delay: 2 },
  { size: 240, top: '70%', left: '66%', color: '#e9e1fb', blur: 3, dur: 12, delay: 1.8 },
  { size: 62, top: '22%', left: '46%', color: '#dcd4f5', blur: 0, dur: 10, delay: 0.9 },
];

// Sparse dots and dashes sprinkled across the screen.
const PARTICLES = [
  { top: '16%', left: '30%', color: '#5b4b8a', size: 4, dash: false, dur: 7, delay: 0.4 },
  { top: '28%', left: '62%', color: '#e08a4a', size: 5, dash: true, dur: 9, delay: 1.4 },
  { top: '44%', left: '84%', color: '#8fb8e6', size: 3, dash: false, dur: 6, delay: 0.8 },
  { top: '62%', left: '26%', color: '#5b4b8a', size: 3, dash: true, dur: 8, delay: 2.1 },
  { top: '72%', left: '52%', color: '#e08a4a', size: 4, dash: false, dur: 10, delay: 0.2 },
  { top: '34%', left: '10%', color: '#8fb8e6', size: 4, dash: true, dur: 7, delay: 1.7 },
  { top: '54%', left: '70%', color: '#5b4b8a', size: 3, dash: false, dur: 9, delay: 2.6 },
  { top: '10%', left: '88%', color: '#e08a4a', size: 3, dash: false, dur: 8, delay: 1.1 },
];

export default function AppLoadingScreen() {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: 'linear-gradient(150deg, #efe8fb 0%, #f8f4ff 45%, #ffffff 100%)' }}
    >
      {/* Floating soft shapes */}
      {BLOBS.map((b, i) => (
        <div
          key={`blob-${i}`}
          className="loading-blob absolute rounded-full pointer-events-none"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            background: b.color,
            opacity: 0.75,
            filter: b.blur ? `blur(${b.blur}px)` : 'none',
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}

      {/* Sparse particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={`particle-${i}`}
          className="loading-particle absolute pointer-events-none"
          style={{
            top: p.top,
            left: p.left,
            width: p.dash ? p.size * 3 : p.size,
            height: p.size,
            borderRadius: p.dash ? 2 : '999px',
            background: p.color,
            opacity: 0.55,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Layered footer wave */}
      <svg
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        style={{ height: 'clamp(90px, 16vh, 170px)' }}
        aria-hidden="true"
      >
        <path
          d="M0,120 C240,60 420,190 700,140 C960,94 1140,30 1440,90 L1440,220 L0,220 Z"
          fill="#f7e3d1"
          opacity="0.85"
        />
        <path
          d="M0,160 C260,110 460,210 760,168 C1010,132 1200,80 1440,132 L1440,220 L0,220 Z"
          fill="#e5dbf8"
          opacity="0.9"
        />
        <path
          d="M0,192 C300,160 520,214 820,196 C1080,180 1240,154 1440,178 L1440,220 L0,220 Z"
          fill="#d9c9f4"
          opacity="0.85"
        />
      </svg>

      {/* Brand mark */}
      <header className="fixed top-3 left-3 z-20">
        <BrandLogo size="md" />
      </header>

      {/* Centered ring spinner */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div
          className="h-12 w-12 rounded-full animate-spin"
          style={{ border: '3px solid rgba(94, 106, 210, 0.18)', borderTopColor: '#5e6ad2' }}
        />
        <span className="sr-only">Loading</span>
      </div>

      {/* Nav bar in its resting state */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 border-t"
        style={{ background: 'rgba(255, 255, 255, 0.92)', borderColor: '#e7e2f3' }}
      >
        <div className="overflow-hidden">
          <div className="flex items-center justify-center gap-1 py-2 px-2 min-w-max mx-auto">
            {NAV_ITEMS.map(({ label, Icon }) => (
              <div key={label} className="flex flex-col items-center py-1 px-3">
                <Icon className="w-5 h-5" style={{ color: '#6b6b7b' }} />
                <span className="text-xs mt-1 font-medium whitespace-nowrap" style={{ color: '#4a4a4a' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}