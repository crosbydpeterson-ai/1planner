import React from 'react';
import { RotateCcw } from 'lucide-react';

// Readability controls for the card back: printed text and barcode colour.
// Both default to the theme, and an override can be cleared again.
export default function BackColors({ design, textFallback, onChange }) {
  const rows = [
    { key: 'backTextColor', label: 'Back text', fallback: textFallback || '#101828' },
    { key: 'barcodeColor', label: 'Barcode', fallback: '#101828' },
  ];

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-2 py-1.5"
        >
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="color"
              value={design[row.key] || row.fallback}
              onChange={(e) => onChange({ ...design, [row.key]: e.target.value })}
              className="h-7 w-7 rounded-md border-0 bg-transparent p-0 cursor-pointer"
              aria-label={row.label}
            />
            <span className="text-[11px] font-medium text-slate-600">{row.label}</span>
          </label>
          {design[row.key] ? (
            <button
              type="button"
              onClick={() => onChange({ ...design, [row.key]: '' })}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-700"
            >
              <RotateCcw className="w-3 h-3" /> Theme default
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">Theme default</span>
          )}
        </div>
      ))}
    </div>
  );
}