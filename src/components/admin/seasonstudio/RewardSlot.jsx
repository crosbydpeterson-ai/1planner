import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Trash2 } from 'lucide-react';
import AssetPicker from './AssetPicker';
import { REWARD_TYPES, REWARD_TYPE_LIST, isPendingValue } from '@/lib/seasonStudio';

/**
 * One Free or Plus slot inside a tier. The control shown depends on the reward
 * type, and asset types only ever offer assets that exist.
 */
export default function RewardSlot({ slot, lane, onChange, onRemove, assets, titleSuggestions = [] }) {
  if (!slot) return null;
  const meta = REWARD_TYPES[slot.type];
  const pending = isPendingValue(slot);
  const laneRing = lane === 'plus' ? 'border-fuchsia-500/40' : 'border-sky-500/40';

  return (
    <div className={`space-y-2 rounded-xl border bg-slate-900/70 p-3 ${laneRing}`}>
      <div className="flex items-center gap-2">
        <Select value={slot.type} onValueChange={(type) => onChange({ type, value: '', name: '' })}>
          <SelectTrigger className="h-9 border-slate-600 bg-slate-800 text-xs text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REWARD_TYPE_LIST.map((type) => (
              <SelectItem key={type} value={type}>
                {REWARD_TYPES[type].icon} {REWARD_TYPES[type].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onRemove}
          title="Remove this reward"
          className="h-9 w-9 shrink-0 text-slate-400 hover:text-red-300"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {meta?.asset === 'amount' && (
        <Input
          type="number"
          min="1"
          value={slot.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder="Quest Coins"
          className="h-9 border-slate-600 bg-slate-800 text-xs text-white"
        />
      )}

      {meta?.asset === 'titles' && (
        <>
          <Input
            list={`season-titles-${slot.id || 'slot'}`}
            value={slot.value}
            onChange={(e) => onChange({ value: e.target.value })}
            placeholder="Exact title text"
            className="h-9 border-slate-600 bg-slate-800 text-xs text-white"
          />
          <datalist id={`season-titles-${slot.id || 'slot'}`}>
            {titleSuggestions.map((title) => (
              <option key={title} value={title} />
            ))}
          </datalist>
        </>
      )}

      {meta?.asset === 'none' && (
        <p className="rounded-lg bg-slate-800 px-2 py-2 text-[11px] text-slate-300">
          Grants one Magic Egg straight to the student's inventory.
        </p>
      )}

      {assets && ['pets', 'themes', 'tracks', 'playlists', 'foods'].includes(meta?.asset) && (
        <AssetPicker
          kind={meta.asset}
          value={slot.value}
          assets={assets}
          onChange={(item) => onChange({ value: item.id, name: slot.name || item.name })}
        />
      )}

      {slot.type !== 'coins' && (
        <Input
          value={slot.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Label students see (optional)"
          className="h-9 border-slate-600 bg-slate-800 text-xs text-white"
        />
      )}

      {pending && (
        <p className="flex items-start gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-300">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> Still generating — swap in a finished asset before publishing
        </p>
      )}
    </div>
  );
}