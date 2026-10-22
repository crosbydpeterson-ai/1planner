import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp, Copy, Plus, Trash2 } from 'lucide-react';
import RewardSlot from './RewardSlot';

const LANE_META = {
  free: { label: 'Free track', hint: 'Every student can claim these', addLabel: 'Add Free reward', tone: 'text-sky-300', button: 'border-sky-500/40 text-sky-200 hover:bg-sky-500/10' },
  plus: { label: '1Pass Plus', hint: 'Only students with Plus can claim', addLabel: 'Add Plus reward', tone: 'text-fuchsia-300', button: 'border-fuchsia-500/40 text-fuchsia-200 hover:bg-fuchsia-500/10' },
};

/** One tier row: an XP threshold with its own Free and Plus slots. */
export default function TierRow({ tier, tierNumber, assets, titleSuggestions, canMoveUp, canMoveDown, onPatch, onMove, onDuplicate, onRemove }) {
  const updateSlot = (lane, index, patch) =>
    onPatch({ [lane]: tier[lane].map((slot, i) => (i === index ? { ...slot, ...patch } : slot)) });

  const removeSlot = (lane, index) => onPatch({ [lane]: tier[lane].filter((_, i) => i !== index) });

  const addSlot = (lane) =>
    onPatch({
      [lane]: [
        ...tier[lane],
        { id: `slot_${Math.random().toString(36).slice(2, 9)}`, lane, type: lane === 'plus' ? 'theme' : 'coins', value: lane === 'plus' ? '' : '50', name: '' },
      ],
    });

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-purple-600/25 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-purple-200">
          Tier {tierNumber}
        </span>
        <Input
          type="number"
          min="1"
          value={tier.xpRequired}
          onChange={(e) => onPatch({ xpRequired: e.target.value })}
          className="h-9 w-28 border-slate-600 bg-slate-900 text-sm font-bold text-white"
        />
        <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">XP</span>
        <div className="ml-auto flex items-center gap-1">
          <Button type="button" size="icon" variant="ghost" disabled={!canMoveUp} onClick={() => onMove(-1)} className="h-8 w-8 text-slate-400 hover:text-white">
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" disabled={!canMoveDown} onClick={() => onMove(1)} className="h-8 w-8 text-slate-400 hover:text-white">
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={onDuplicate} title="Duplicate tier" className="h-8 w-8 text-slate-400 hover:text-white">
            <Copy className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" onClick={onRemove} title="Delete tier" className="h-8 w-8 text-slate-400 hover:text-red-300">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {['free', 'plus'].map((lane) => (
          <div key={lane} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-black uppercase tracking-wide ${LANE_META[lane].tone}`}>{LANE_META[lane].label}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{LANE_META[lane].hint}</p>
              </div>
            </div>
            {tier[lane].length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-600 px-3 py-4 text-center text-[11px] text-slate-500">
                Empty slot — the other track is untouched
              </div>
            )}
            {tier[lane].map((slot, index) => (
              <RewardSlot
                key={slot.id || index}
                slot={slot}
                lane={lane}
                assets={assets}
                titleSuggestions={titleSuggestions}
                onChange={(patch) => updateSlot(lane, index, patch)}
                onRemove={() => removeSlot(lane, index)}
              />
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => addSlot(lane)} className={`w-full ${LANE_META[lane].button}`}>
              <Plus className="mr-1 h-3 w-3" /> {LANE_META[lane].addLabel}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}