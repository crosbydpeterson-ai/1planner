import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function SeasonBookHeader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div className="hidden md:block text-white font-extrabold text-xl tracking-tight lowercase">1planner</div>
      <div className="text-center">
        <h1 className="relative inline-flex items-center gap-2 md:gap-3 text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-[0_3px_0_rgba(40,10,110,0.6)]">
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-300 fill-yellow-300 shrink-0" aria-hidden="true" />
          Season Collection
          <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-300 fill-yellow-300 shrink-0" aria-hidden="true" />
        </h1>
        <p className="text-[#D9CCFF] text-base md:text-lg font-semibold mt-0.5">Your seasons. Your collection.</p>
      </div>
      <div className="flex justify-center md:justify-end">
        <Link
          to={createPageUrl('Season')}
          className="inline-flex items-center gap-2 rounded-2xl border-[3px] border-[#B79CFF] bg-[#4A25B0] px-5 py-2.5 text-white font-bold shadow-[0_5px_0_rgba(25,8,70,0.55)] hover:bg-[#5730C4] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-yellow-300" strokeWidth={3} /> Back to 1Pass
        </Link>
      </div>
    </div>
  );
}