import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const COLOR_THEMES = [
  { name: 'Electric Blue', colors: ['#3B82F6', '#1D4ED8', '#60A5FA'] },
  { name: 'Sunset Orange', colors: ['#F97316', '#EA580C', '#FB923C'] },
  { name: 'Forest Green', colors: ['#22C55E', '#16A34A', '#4ADE80'] },
  { name: 'Royal Purple', colors: ['#A855F7', '#7C3AED', '#C084FC'] },
  { name: 'Amber Gold', colors: ['#F59E0B', '#D97706', '#FCD34D'] },
  { name: 'Teal Mint', colors: ['#14B8A6', '#0D9488', '#5EEAD4'] },
  { name: 'Rose Pink', colors: ['#EC4899', '#DB2777', '#F472B6'] },
  { name: 'Navy Slate', colors: ['#64748B', '#475569', '#94A3B8'] },
];

const FONTS = [
  { name: 'Poppins', style: "'Poppins', sans-serif" },
  { name: 'Space Grotesk', style: "'Space Grotesk', sans-serif" },
  { name: 'Inter', style: "'Inter', sans-serif" },
  { name: 'DM Sans', style: "'DM Sans', sans-serif" },
  { name: 'Playfair Display', style: "'Playfair Display', serif" },
  { name: 'JetBrains Mono', style: "'JetBrains Mono', monospace" },
];

export default function BuilderStylePicker({ onConfirm }) {
  const [selectedColor, setSelectedColor] = useState('Teal Mint');
  const [selectedFont, setSelectedFont] = useState('Inter');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-3">Pick a style for your game</h3>
      
      {/* Color Theme */}
      <p className="text-xs font-medium text-slate-500 mb-2">Color Theme</p>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {COLOR_THEMES.map(theme => (
          <button
            key={theme.name}
            onClick={() => setSelectedColor(theme.name)}
            className={`relative p-2 rounded-xl border-2 transition-all ${
              selectedColor === theme.name
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-100 hover:border-slate-200'
            }`}
          >
            {selectedColor === theme.name && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              {theme.colors.map((c, i) => (
                <div
                  key={i}
                  className="h-2 rounded-full"
                  style={{ backgroundColor: c, width: `${100 - i * 15}%` }}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 text-center leading-tight">{theme.name}</p>
          </button>
        ))}
      </div>

      {/* Font */}
      <p className="text-xs font-medium text-slate-500 mb-2">Font</p>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {FONTS.map(f => (
          <button
            key={f.name}
            onClick={() => setSelectedFont(f.name)}
            className={`p-2 rounded-xl border-2 text-sm transition-all ${
              selectedFont === f.name
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-100 hover:border-slate-200'
            }`}
            style={{ fontFamily: f.style }}
          >
            <div className="flex items-center justify-between">
              <span className="text-slate-700">{f.name}</span>
              {selectedFont === f.name && (
                <div className="w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <Button
        onClick={() => onConfirm(selectedColor, selectedFont)}
        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl"
      >
        Confirm
      </Button>
    </div>
  );
}