import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { THEME_LIBRARY, THEME_CATEGORIES } from '@/lib/featureLocks';
import { toast } from 'sonner';

export default function ThemeLibrary({ lockPageConfig, applyTheme, savedThemes = [] }) {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = category === 'All' ? THEME_LIBRARY : THEME_LIBRARY.filter(t => t.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    return list;
  }, [category, search]);

  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">🎨 Theme Library</h3>
          <p className="text-slate-400 text-sm mt-1">Browse {THEME_LIBRARY.length} themes — click to apply instantly</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search themes..."
          className="bg-slate-700 border-slate-600 text-white pl-10" />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {THEME_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${category === cat ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Theme grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
        {filtered.map(theme => {
          const isActive = lockPageConfig.backgroundColor === theme.bg && lockPageConfig.accentColor === theme.accent;
          return (
            <button key={theme.name} onClick={() => applyTheme(theme)}
              className={`group relative rounded-xl overflow-hidden border-2 transition-all text-left ${isActive ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-slate-600 hover:border-purple-500'}`}>
              {/* Preview swatch */}
              <div className="h-20 flex items-center justify-center relative" style={{ backgroundColor: theme.bg }}>
                <div className="flex gap-1">
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.accent }} />
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.btn }} />
                  <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: theme.card, borderColor: theme.accent }} />
                </div>
                <span className="absolute top-1 right-1 text-lg">{theme.emoji}</span>
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-purple-600/40">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              {/* Label */}
              <div className="px-2 py-1.5 bg-slate-700/60">
                <p className="text-xs font-medium text-slate-200 truncate">{theme.name}</p>
                <p className="text-[10px] text-slate-500">{theme.category}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Saved custom themes */}
      {savedThemes.length > 0 && (
        <div className="pt-2">
          <Label className="text-slate-300 mb-2 block">💾 Your Saved Themes</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {savedThemes.map((t, i) => (
              <button key={i} onClick={() => applyTheme(t)}
                className="rounded-lg border border-slate-600 hover:border-purple-500 p-2 bg-slate-700/40 text-left">
                <div className="flex gap-1 mb-1">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.bg }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.accent }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.btn }} />
                </div>
                <span className="text-xs text-slate-300">{t.name || `Theme ${i + 1}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}