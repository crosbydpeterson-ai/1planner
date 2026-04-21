import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PETS } from '@/components/quest/PetCatalog';
import { Plus, Trash2, Trophy } from 'lucide-react';

export default function GameScorePrizesEditor({ game, onSave }) {
  const [prizes, setPrizes] = useState(game.scorePrizes || []);
  const [saving, setSaving] = useState(false);
  const [petSearch, setPetSearch] = useState('');

  const addPrize = () => {
    setPrizes(prev => [...prev, { score: 100, petId: '' }]);
  };

  const updatePrize = (i, field, val) => {
    setPrizes(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  };

  const removePrize = (i) => {
    setPrizes(prev => prev.filter((_, idx) => idx !== i));
  };

  const save = async () => {
    setSaving(true);
    await base44.entities.MiniGame.update(game.id, { scorePrizes: prizes });
    setSaving(false);
    onSave?.(prizes);
  };

  const filteredPets = PETS.filter(p =>
    !petSearch || p.name.toLowerCase().includes(petSearch.toLowerCase())
  ).slice(0, 20);

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

      {prizes.map((prize, i) => {
        const pet = PETS.find(p => p.id === prize.petId);
        return (
          <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex flex-col gap-1 flex-1">
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
                <select
                  value={prize.petId}
                  onChange={e => updatePrize(i, 'petId', e.target.value)}
                  className="flex-1 h-7 text-xs rounded-md border border-input bg-background px-2"
                >
                  <option value="">— Select pet —</option>
                  {PETS.map(p => (
                    <option key={p.id} value={p.id}>{p.emoji} {p.name} ({p.rarity})</option>
                  ))}
                </select>
              </div>
            </div>
            {pet && <span className="text-2xl">{pet.emoji}</span>}
            <Button size="sm" variant="ghost" onClick={() => removePrize(i)} className="text-red-500 hover:text-red-700 h-7 w-7 p-0">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        );
      })}

      <Button onClick={save} disabled={saving} size="sm" className="w-full">
        {saving ? 'Saving...' : 'Save Score Prizes'}
      </Button>
    </div>
  );
}