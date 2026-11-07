import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import CardFront from '@/components/admin/magicstudio/CardFront';
import { cn } from '@/lib/utils';

// One theme tile in the picker. The preview is the real card front, so what the
// admin taps is exactly what the card will look like.
export default function ThemeTile({ design, label, blurb, active, onSelect, onDelete }) {
  return (
    <div className={cn('group relative rounded-xl border p-1.5 transition',
      active ? 'border-indigo-400 ring-2 ring-indigo-300 bg-indigo-50/60' : 'border-slate-200 hover:border-slate-300')}>
      <button type="button" onClick={onSelect} className="block w-full text-left">
        <div className="flex justify-center overflow-hidden rounded-lg bg-slate-100 py-1.5">
          <CardFront name="" design={design} scale={0.17} />
        </div>
        <p className="mt-1.5 px-0.5 text-[10px] font-semibold text-slate-800 leading-tight truncate">{label}</p>
        <p className="px-0.5 text-[9px] text-slate-500 leading-tight truncate">{blurb}</p>
      </button>
      {active && (
        <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
          <Check className="w-3 h-3" />
        </span>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          title="Delete this theme"
          className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-slate-500 opacity-0 shadow transition group-hover:opacity-100 hover:text-red-600"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}