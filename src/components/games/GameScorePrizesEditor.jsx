import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PETS } from '@/components/quest/PetCatalog';
import { Plus, Trash2, Trophy, Search } from 'lucide-react';

const RARITY_COLORS = {
  common: 'bg-gray-100 border-gray-300',
  uncommon: 'bg-green-50 border-green-300',
  rare: 'bg-blue-50 border-blue-300',
  epic: 'bg-purple-50 border-purple-300',
  legendary: 'bg-amber-50 border-amber-400',
};

function PetPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customPets, setCustomPets] = useState([]);

  useEffect(() => {
    base44.entities.CustomPet.list('-created_date', 500).then(setCustomPets);
  }, []);

  // Build unified list: catalog pets + custom pets
  const catalogEntries = PETS.map(p => ({ id: p.id, name: p.name, emoji: p.emoji, rarity: p.rarity, imageUrl: null, isCustom: false }));
  const customEntries = customPets.map(p => ({ id: `custom_${p.id}`, name: p.name, emoji: p.emoji || '🐾', rarity: p.rarity, imageUrl: p.imageUrl || null, isCustom: true }));
  const allPets = [...catalogEntries, ...customEntries];

  const filtered = search ? allPets.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : allPets;
  const selected = allPets.find(p => p.id === value);

  return (
    <div className="flex-1 relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 h-8 px-2 rounded-md border border-input bg-background text-xs hover:bg-slate-50 transition-colors"
      >
        {selected ? (
          <>
            {selected.imageUrl
              ? <img src={selected.imageUrl} className="w-5 h-5 rounded object-cover" alt="" />
              : <span className="text-lg leading-none">{selected.emoji}</span>}
            <span className="font-medium">{selected.name}</span>
            <span className="text-slate-400 capitalize">({selected.rarity})</span>
            {selected.isCustom && <span className="text-indigo-400 text-[10px]">custom</span>}
          </>
        ) : (
          <span className="text-slate-400">— Select a pet —</span>
        )}
        <span className="ml-auto text-slate-400">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 border border-slate-200 rounded-xl bg-white shadow-xl">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search pets..."
                className="w-full pl-6 pr-2 py-1 text-xs border border-slate-200 rounded-lg outline-none"
              />
            </div>
          </div>
          <div className="p-2 grid grid-cols-2 gap-1 max-h-64 overflow-y-auto">
            {filtered.length === 0 && <p className="col-span-2 text-xs text-slate-400 text-center py-3">No pets found</p>}
            {filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange(p.id); setOpen(false); setSearch(''); }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left transition-colors hover:brightness-95 ${RARITY_COLORS[p.rarity] || 'bg-gray-100 border-gray-300'} ${value === p.id ? 'ring-2 ring-indigo-400' : ''}`}
              >
                {p.imageUrl
                  ? <img src={p.imageUrl} className="w-5 h-5 rounded object-cover shrink-0" alt="" />
                  : <span className="text-xl leading-none shrink-0">{p.emoji}</span>}
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold truncate">{p.name}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{p.rarity}{p.isCustom ? ' · custom' : ''}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GameScorePrizesEditor({ game, onSave }) {
  const [prizes, setPrizes] = useState(game.scorePrizes || []);
  const [saving, setSaving] = useState(false);

  const addPrize = () => setPrizes(prev => [...prev, { score: 100, petId: '' }]);
  const updatePrize = (i, field, val) => setPrizes(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  const removePrize = (i) => setPrizes(prev => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    setSaving(true);
    await base44.entities.MiniGame.update(game.id, { scorePrizes: prizes });
    setSaving(false);
    onSave?.(prizes);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" /> Score Prizes
        </h4>
        <Button size="sm" variant="outline" onClick={addPrize} className="h-7 text-xs gap-1">
          <Plus className="w-3 h-3" /> Add Prize
        </Button>
      </div>

      {prizes.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-3">No score prizes set. Add one above!</p>
      )}

      {prizes.map((prize, i) => (
        <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-16 shrink-0">Score ≥</span>
              <Input
                type="number"
                value={prize.score}
                onChange={e => updatePrize(i, 'score', Number(e.target.value))}
                className="h-7 text-sm w-24"
                min={0}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-16 shrink-0">Pet</span>
              <PetPicker value={prize.petId} onChange={val => updatePrize(i, 'petId', val)} />
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => removePrize(i)} className="text-red-500 hover:text-red-700 h-7 w-7 p-0 shrink-0">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}

      <Button onClick={save} disabled={saving} size="sm" className="w-full">
        {saving ? 'Saving...' : 'Save Score Prizes'}
      </Button>
    </div>
  );
}