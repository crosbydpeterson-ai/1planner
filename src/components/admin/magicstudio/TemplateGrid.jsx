import React from 'react';
import { CARD_TEMPLATES } from '@/lib/cardDesigns';
import { cn } from '@/lib/utils';

export default function TemplateGrid({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {CARD_TEMPLATES.map((template) => {
        const active = value === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onChange(template)}
            className={cn(
              'rounded-xl border p-2 text-left transition',
              active ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-slate-200 hover:border-slate-300'
            )}
          >
            <div
              className="h-10 w-full rounded-lg mb-1.5"
              style={{
                background:
                  template.id === 'holo_collector'
                    ? 'linear-gradient(120deg, #ec4899, #facc15, #38bdf8, #ec4899)'
                    : template.id === 'pet_passport'
                    ? 'linear-gradient(150deg, #fffaf0, #fbbf24 70%, #f97316)'
                    : template.id === 'midnight_quest'
                    ? 'radial-gradient(circle at 75% 25%, #fbbf24 0%, transparent 45%), linear-gradient(160deg, #1e1b4b, #070b23)'
                    : 'linear-gradient(160deg, #22d3ee 0%, #0b0620 60%, #a855f7 100%)',
              }}
            />
            <div className="text-xs font-semibold text-slate-800 leading-tight">{template.name}</div>
            <div className="text-[10px] text-slate-500 leading-tight">{template.blurb}</div>
          </button>
        );
      })}
    </div>
  );
}