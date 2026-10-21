import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Radio, Star, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInCalendarDays, format } from 'date-fns';
import { getSeasonStatus, parseSeasonDate } from '@/lib/seasonUtils';
import PlusRewardsEditor from '@/components/admin/PlusRewardsEditor';

const STATUS_STYLES = {
  current: 'bg-emerald-500/20 text-emerald-300',
  upcoming: 'bg-sky-500/20 text-sky-300',
  ended: 'bg-slate-600/40 text-slate-300',
};
const STATUS_LABELS = { current: 'Current', upcoming: 'Upcoming', ended: 'Ended' };

const formatDay = (value) => {
  const d = parseSeasonDate(value);
  return d ? format(d, 'MMM d, yyyy') : '—';
};

/**
 * One season in the admin list: view, rename/re-date inline, take it live or
 * hide it, edit its rewards, or delete it.
 */
export default function SeasonRow({
  season,
  now,
  isSuperAdmin,
  customPets,
  customThemes,
  adminProfile,
  onSeasonChanged,
  onSeasonDeleted,
}) {
  const [editing, setEditing] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ name: season.name || '', startDate: season.startDate || '', endDate: season.endDate || '' });

  const startEdit = () => {
    setDraft({ name: season.name || '', startDate: season.startDate || '', endDate: season.endDate || '' });
    setEditing(true);
  };

  const status = getSeasonStatus(season, now);
  const start = parseSeasonDate(season.startDate);
  const end = parseSeasonDate(season.endDate);
  const days = start && end ? differenceInCalendarDays(end, start) + 1 : null;
  const rewardsCount = season.rewards?.length || 0;

  const save = async () => {
    if (!draft.name.trim()) return toast.error('Give the season a name');
    if (!draft.startDate || !draft.endDate) return toast.error('Start and end dates are required');
    if (parseSeasonDate(draft.endDate) < parseSeasonDate(draft.startDate)) {
      return toast.error('The end date must be on or after the start date');
    }

    setBusy(true);
    try {
      await base44.entities.Season.update(season.id, {
        name: draft.name.trim(),
        startDate: draft.startDate,
        endDate: draft.endDate,
      });
      onSeasonChanged({ ...season, name: draft.name.trim(), startDate: draft.startDate, endDate: draft.endDate });
      setEditing(false);
      toast.success('Season updated');
    } catch (e) {
      console.error(e);
      toast.error('Could not save the season');
    }
    setBusy(false);
  };

  const toggleLive = async () => {
    setBusy(true);
    try {
      await base44.entities.Season.update(season.id, { isActive: !season.isActive });
      onSeasonChanged({ ...season, isActive: !season.isActive });
      toast.success(season.isActive ? 'Hidden from students' : 'Live for students');
    } catch (e) {
      console.error(e);
      toast.error('Could not change the season');
    }
    setBusy(false);
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${season.name}"? Its rewards go with it and this can't be undone.`)) return;
    setBusy(true);
    try {
      await base44.entities.Season.delete(season.id);
      onSeasonDeleted(season.id);
      toast.success('Season deleted');
    } catch (e) {
      console.error(e);
      toast.error('Could not delete the season');
    }
    setBusy(false);
  };

  return (
    <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700">
      {editing ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Season name</label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Spring 2027"
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Starts</label>
              <Input
                type="date"
                value={draft.startDate?.slice(0, 10) || ''}
                onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Ends</label>
              <Input
                type="date"
                value={draft.endDate?.slice(0, 10) || ''}
                onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
                className="bg-slate-700 border-slate-600"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={busy} className="bg-amber-600">
              <Check className="w-4 h-4 mr-1" /> Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={busy} className="text-slate-300">
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-white truncate">{season.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
              {season.isActive ? (
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300">Live for students</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400">Hidden</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {formatDay(season.startDate)} → {formatDay(season.endDate)}
              {days ? ` • ${days} day${days === 1 ? '' : 's'}` : ''} • {rewardsCount} reward{rewardsCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={startEdit} disabled={busy} className="border-slate-600 text-slate-200">
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
            <Button size="sm" variant="outline" onClick={toggleLive} disabled={busy} className="border-slate-600 text-slate-200">
              <Radio className="w-3.5 h-3.5 mr-1" /> {season.isActive ? 'Hide' : 'Go live'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowRewards((v) => !v)}
              className="border-slate-600 text-slate-200"
            >
              <Star className="w-3.5 h-3.5 mr-1" /> Rewards
            </Button>
            {isSuperAdmin && (
              <Button size="sm" variant="ghost" onClick={remove} disabled={busy} className="text-red-400 hover:text-red-300">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {showRewards && !editing && (
        <div className="mt-3">
          <PlusRewardsEditor
            season={season}
            customPets={customPets}
            customThemes={customThemes}
            adminProfile={adminProfile}
            onSeasonUpdated={onSeasonChanged}
          />
        </div>
      )}
    </div>
  );
}