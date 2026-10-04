import React from 'react';
import SilhouetteIcon from '@/components/seasonbook/SilhouetteIcon';
import { colorStyle, extractHex } from '@/components/theme/themeUtils';

const TYPE_EMOJI = { pet: '🐾', theme: '🎨', title: '🏆', coins: '🪙', magic_egg: '🥚', food: '🍰' };

// Silhouette shapes we can reliably tell from built-in pet ids
const BUILTIN_SHAPES = { math_cat: 'cat', study_owl: 'owl', starter_slime: 'slime', book_dragon: 'dragon', celestial_dragon: 'dragon' };

function Sparkle({ className }) {
  return <span className={'absolute text-xs select-none ' + className}>✦</span>;
}

function OwnedWindow({ bg, children }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={bg || { background: 'linear-gradient(135deg,#3B1F8F,#7C4DFF)' }}>
      <Sparkle className="top-2 left-3 text-white/60" />
      <Sparkle className="top-4 right-5 text-yellow-200/80" />
      <Sparkle className="bottom-3 left-6 text-white/40" />
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

function TitleRibbon({ text }) {
  return (
    <div className="relative flex items-center justify-center w-[88%]">
      <div className="absolute -left-1 top-3 w-8 h-10 bg-[#C2185B] [clip-path:polygon(0_0,100%_0,100%_100%,0_100%,35%_50%)]" />
      <div className="absolute -right-1 top-3 w-8 h-10 bg-[#C2185B] [clip-path:polygon(0_0,100%_0,65%_50%,100%_100%,0_100%)]" />
      <div className="relative z-10 w-[82%] rounded-md bg-gradient-to-b from-[#FF5FA2] to-[#E91E63] px-3 py-2 shadow-lg border-2 border-yellow-200 text-center">
        <span className="text-white font-black text-sm md:text-base leading-tight line-clamp-2 drop-shadow">{text}</span>
      </div>
    </div>
  );
}

export default function StampArt({ reward, isOwned, petDisplay, themeDisplay, imgError, onImgError }) {
  if (!isOwned) {
    const shape = reward.type === 'pet' ? BUILTIN_SHAPES[reward.value] || 'pet' : reward.type;
    return (
      <div className="relative w-full h-full bg-[#EAE2D3] flex items-center justify-center overflow-hidden">
        <Sparkle className="top-3 left-4 text-[#B9A9C9]" />
        <Sparkle className="top-6 right-6 text-[#B9A9C9]" />
        <Sparkle className="bottom-4 left-8 text-[#C9BCD6]" />
        <Sparkle className="bottom-6 right-4 text-[#C9BCD6]" />
        <SilhouetteIcon type={shape} />
      </div>
    );
  }

  if (reward.type === 'pet') {
    const t = petDisplay?.theme;
    const bg = t ? { background: `linear-gradient(135deg, ${extractHex(t.bg)}, ${extractHex(t.primary)})` } : null;
    return (
      <OwnedWindow bg={bg}>
        {petDisplay?.image && !imgError ? (
          <img src={petDisplay.image} alt={petDisplay.name || 'Pet reward'} className="w-full h-full object-contain p-2 drop-shadow-lg" onError={onImgError} />
        ) : (
          <span className="text-7xl drop-shadow-lg">{petDisplay?.emoji || TYPE_EMOJI.pet}</span>
        )}
      </OwnedWindow>
    );
  }

  if (reward.type === 'theme') {
    const cols = themeDisplay ? [themeDisplay.primary, themeDisplay.secondary, themeDisplay.accent] : ['#4338ca', '#818cf8', '#c7d2fe'];
    return (
      <OwnedWindow bg={themeDisplay?.bg ? colorStyle(themeDisplay.bg) : null}>
        <div className="relative w-[70%] h-[78%]">
          {cols.map((c, i) => (
            <div
              key={i}
              className="absolute top-[8%] h-[84%] w-[46%] rounded-lg border-[3px] border-white/90 shadow-xl"
              style={{ left: `${i * 26}%`, transform: `rotate(${(i - 1) * 8}deg)`, zIndex: 3 - i, ...colorStyle(c || '#6366f1') }}
            />
          ))}
        </div>
      </OwnedWindow>
    );
  }

  if (reward.type === 'title') {
    return (
      <OwnedWindow>
        <TitleRibbon text={reward.value || reward.name || 'Title'} />
      </OwnedWindow>
    );
  }

  return (
    <OwnedWindow>
      <span className="text-7xl drop-shadow-lg">{TYPE_EMOJI[reward.type] || '🎁'}</span>
    </OwnedWindow>
  );
}