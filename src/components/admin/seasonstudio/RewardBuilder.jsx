import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import TierRow from './TierRow';
import XpPlanner from './XpPlanner';
import { countLaneSlots } from '@/lib/seasonStudio';

/**
 * The Free + Plus reward builder. Tiers are rows; each row owns its own slots,
 * so an empty slot on one track never shifts rewards on the other.
 */
export default function RewardBuilder({ draft, onPatch, assets, titleSuggestions = [] }) {
  const tiers = draft.tiers || [];
  const counts = useMemo(() => countLaneSlots(tiers), [tiers]);

  const setTiers = (next) => onPatch({ tiers: next });
  const patchTier = (index, patch) => setTiers(tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));

  const addTier = () => {
    const highest = tiers.reduce((max, tier) => Math.max(max, Number(tier.xpRequired) || 0), 0);
    setTiers([
      ...tiers,
      {
        key: `tier_${Math.random().toString(36).slice(2, 9)}`,
        xpRequired: highest > 0 ? highest + 100 : 100,
        free: [{ id: `slot_${Math.random().toString(36).slice(2, 9)}`, lane: 'free', type: 'coins', value: '50', name: '' }],
        plus: [{ id: `slot_${Math.random().toString(36).slice(2, 9)}`, lane: 'plus', type: 'theme', value: '', name: '' }],
      },
    ]);
  };

  const duplicateTier = (index) => {
    const source = tiers[index];
    const cloneSlot = (slot, lane) => ({ ...slot, id: undefined, lane, name: slot.name });
    const copy = {
      key: `tier_${Math.random().toString(36).slice(2, 9)}`,
      xpRequired: (Number(source.xpRequired) || 0) + 100,
      free: (source.free || []).map((slot) => cloneSlot(slot, 'free')),
      plus: (source.plus || []).map((slot) => cloneSlot(slot, 'plus')),
    };
    setTiers([...tiers.slice(0, index + 1), copy, ...tiers.slice(index + 1)]);
  };

  const moveTier = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= tiers.length) return;
    const next = [...tiers];
    [next[index], next[target]] = [next[target], next[index]];
    setTiers(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-white">Rewards</h3>
          <p className="text-xs text-slate-400">
            {counts.free} Free · {counts.plus} 1Pass Plus · {tiers.length} tier{tiers.length === 1 ? '' : 's'}
          </p>
        </div>
        <Button type="button" onClick={addTier} className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
          <Plus className="mr-2 h-4 w-4" /> Add tier
        </Button>
      </div>

      {tiers.length === 0 && (
        <p className="rounded-2xl border border-dashed border-slate-600 px-4 py-8 text-center text-sm text-slate-400">
          No tiers yet. Add one to start building the Free and Plus tracks.
        </p>
      )}

      <div className="space-y-3">
        {tiers.map((tier, index) => (
          <TierRow
            key={tier.key || `tier-${index}`}
            tier={tier}
            tierNumber={index + 1}
            assets={assets}
            titleSuggestions={titleSuggestions}
            canMoveUp={index > 0}
            canMoveDown={index < tiers.length - 1}
            onPatch={(patch) => patchTier(index, patch)}
            onMove={(direction) => moveTier(index, direction)}
            onDuplicate={() => duplicateTier(index)}
            onRemove={() => setTiers(tiers.filter((_, i) => i !== index))}
          />
        ))}
      </div>

      <XpPlanner tiers={tiers} xpPerQuest={draft.xpPerQuest} onXpPerQuestChange={(value) => onPatch({ xpPerQuest: value })} />
    </div>
  );
}