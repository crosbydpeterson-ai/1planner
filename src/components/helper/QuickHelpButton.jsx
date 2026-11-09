import React from 'react';
import { LifeBuoy } from 'lucide-react';

// The one way into Quick Help on any device. It is labelled rather than an
// icon-only circle, because a bare life buoy reads as decoration to students.
export default function QuickHelpButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Quick Help"
      title="Quick Help — scan a Helper Card"
      className="flex items-center gap-1.5 h-10 pl-2.5 pr-3 rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-600 hover:text-indigo-700 hover:border-indigo-200 hover:shadow-lg active:scale-95 transition-all"
    >
      <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
        <LifeBuoy className="w-3.5 h-3.5" />
      </span>
      <span className="text-xs font-semibold whitespace-nowrap">Quick Help</span>
    </button>
  );
}