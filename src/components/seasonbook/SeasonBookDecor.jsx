import React from 'react';
import { BookOpen, Sparkle } from 'lucide-react';

const ITEMS = [
  { Icon: BookOpen, cls: 'top-16 left-6 w-14 h-14 -rotate-12' },
  { Icon: BookOpen, cls: 'top-[40%] left-3 w-12 h-12 rotate-6' },
  { Icon: BookOpen, cls: 'bottom-24 left-8 w-14 h-14 -rotate-6' },
  { Icon: BookOpen, cls: 'top-24 right-6 w-12 h-12 rotate-12' },
  { Icon: BookOpen, cls: 'top-[55%] right-4 w-14 h-14 -rotate-12' },
  { Icon: Sparkle, cls: 'top-40 left-20 w-4 h-4' },
  { Icon: Sparkle, cls: 'top-[30%] left-10 w-3 h-3' },
  { Icon: Sparkle, cls: 'bottom-40 left-24 w-4 h-4' },
  { Icon: Sparkle, cls: 'top-44 right-20 w-4 h-4' },
  { Icon: Sparkle, cls: 'top-[45%] right-14 w-3 h-3' },
  { Icon: Sparkle, cls: 'bottom-32 right-24 w-5 h-5' },
];

export default function SeasonBookDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {ITEMS.map(({ Icon, cls }, i) => (
        <Icon key={i} className={'absolute text-white/10 ' + cls} strokeWidth={1.5} />
      ))}
    </div>
  );
}