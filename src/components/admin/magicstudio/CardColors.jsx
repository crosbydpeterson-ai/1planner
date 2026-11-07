import React from 'react';

const FIELDS = [
  { key: 'primary', label: 'Main' },
  { key: 'secondary', label: 'Second' },
  { key: 'accent', label: 'Accent' },
];

export default function CardColors({ colors, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {FIELDS.map((field) => (
        <label key={field.key} className="rounded-xl border border-slate-200 p-2 flex items-center gap-2 cursor-pointer">
          <input
            type="color"
            value={colors[field.key]}
            onChange={(e) => onChange({ ...colors, [field.key]: e.target.value })}
            className="h-7 w-7 rounded-md border-0 bg-transparent p-0 cursor-pointer"
            aria-label={field.label}
          />
          <span className="text-[11px] font-medium text-slate-600">{field.label}</span>
        </label>
      ))}
    </div>
  );
}