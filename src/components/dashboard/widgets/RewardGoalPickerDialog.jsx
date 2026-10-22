import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, RotateCw } from 'lucide-react';
import { REWARD_ICONS, REWARD_KIND_LABELS } from '@/lib/widgetAssets';

/**
 * Picker for the single reward a student follows.
 *
 * Lists only rewards that exist right now — the live 1Pass season's Free and
 * Plus rewards, and prizes on wheels that are actually running for this
 * student. Selecting one only records the choice; it never claims anything.
 */
export default function RewardGoalPickerDialog({ open, onOpenChange, candidates, catalogs, onSelect, savedGoal }) {
  const [query, setQuery] = useState('');

  const seasonList = candidates?.season || [];
  const wheelList = candidates?.wheel || [];

  const matches = (label, type) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (label || '').toLowerCase().includes(q) || (REWARD_KIND_LABELS[type] || '').toLowerCase().includes(q);
  };

  const filteredSeason = useMemo(
    () => seasonList.filter((c) => matches(c.label || REWARD_KIND_LABELS[c.type], c.type)),
    [seasonList, query]
  );
  const filteredWheel = useMemo(
    () => wheelList.filter((c) => matches(c.label || REWARD_KIND_LABELS[c.type], c.type)),
    [wheelList, query]
  );

  const isSaved = (candidate) =>
    savedGoal &&
    ((candidate.kind === 'season' && savedGoal.kind === 'season' && savedGoal.rewardId === candidate.rewardId) ||
      (candidate.kind === 'wheel' && savedGoal.kind === 'wheel' && savedGoal.prizeKey === candidate.prizeKey && savedGoal.wheelId === candidate.wheelId));

  const seasonName = seasonList[0]?.seasonName || '1Pass';

  const renderSeasonRow = (c) => (
    <li key={`s:${c.rewardId}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
      <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0" aria-hidden="true">
        {REWARD_ICONS[c.type] || REWARD_ICONS.default}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {c.label || REWARD_KIND_LABELS[c.type] || 'Reward'}
        </p>
        <p className="text-[11px] text-slate-500">
          {c.xpRequired > 0 ? `${c.xpRequired} XP` : 'No XP requirement'}
          {c.lane === 'plus' ? ' · requires 1Pass Plus' : ''}
          {c.claimed ? ' · already collected' : ''}
        </p>
      </div>
      <Button
        size="sm"
        variant={isSaved(c) ? 'outline' : 'default'}
        className={`h-8 rounded-xl shrink-0 ${isSaved(c) ? '' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        disabled={isSaved(c)}
        onClick={() => onSelect(c)}
      >
        {isSaved(c) ? 'Following' : 'Follow'}
      </Button>
    </li>
  );

  const renderWheelRow = (c) => (
    <li key={`w:${c.wheelId}:${c.prizeKey}`} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5">
      <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0" aria-hidden="true">
        {REWARD_ICONS[c.type] || REWARD_ICONS.default}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {c.label || REWARD_KIND_LABELS[c.type] || 'Prize'}
        </p>
        <p className="text-[11px] text-slate-500 truncate">
          {c.destination === 'bonus' ? 'Bonus spins' : 'Daily wheel'} · {c.wheelName}
          {typeof c.chance === 'number' ? ` · ≈${c.chance}% chance` : ''}
        </p>
      </div>
      <Button
        size="sm"
        variant={isSaved(c) ? 'outline' : 'default'}
        className={`h-8 rounded-xl shrink-0 ${isSaved(c) ? '' : 'bg-indigo-600 hover:bg-indigo-700'}`}
        disabled={isSaved(c)}
        onClick={() => onSelect(c)}
      >
        {isSaved(c) ? 'Following' : 'Follow'}
      </Button>
    </li>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Pick a reward to follow</DialogTitle>
          <DialogDescription>
            Choose one reward and Home will show how close you are. Following never claims or reserves it.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rewards"
            className="pl-9"
          />
        </div>

        <div className="overflow-y-auto pr-1 space-y-4 mt-1">
          <section>
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" /> {seasonName} rewards
            </h4>
            {filteredSeason.length === 0 ? (
              <p className="text-xs text-slate-400">
                {seasonList.length === 0 ? 'No 1Pass season is running right now.' : 'No rewards match that search.'}
              </p>
            ) : (
              <ul className="space-y-2">{filteredSeason.map(renderSeasonRow)}</ul>
            )}
          </section>

          <section>
            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
              <RotateCw className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" /> Wheel prizes
            </h4>
            {filteredWheel.length === 0 ? (
              <p className="text-xs text-slate-400">
                {wheelList.length === 0 ? 'No wheel is running right now.' : 'No prizes match that search.'}
              </p>
            ) : (
              <ul className="space-y-2">{filteredWheel.map(renderWheelRow)}</ul>
            )}
          </section>
        </div>

        <Button variant="outline" className="mt-2" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}