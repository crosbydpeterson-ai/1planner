import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { nowInTimezone, parseSeasonDate } from '@/lib/seasonUtils';
import SeasonRow from '@/components/admin/seasons/SeasonRow';

/**
 * Every season in one place, newest first, with a single button to start a new
 * one. Creation itself stays on the AI/manual season generator above.
 */
export default function SeasonManagerPanel({
  seasons = [],
  onSeasonsChange,
  onNewSeason,
  customPets,
  customThemes,
  adminProfile,
  isSuperAdmin,
}) {
  const now = nowInTimezone();
  const ordered = [...seasons].sort(
    (a, b) => (parseSeasonDate(b.startDate)?.getTime() || 0) - (parseSeasonDate(a.startDate)?.getTime() || 0)
  );

  const replace = (updated) => onSeasonsChange(seasons.map((s) => (s.id === updated.id ? updated : s)));
  const drop = (id) => onSeasonsChange(seasons.filter((s) => s.id !== id));

  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-bold text-lg">All Seasons ({seasons.length})</h2>
          <p className="text-xs text-slate-400">Edit dates, take a season live, or manage its rewards.</p>
        </div>
        <Button onClick={onNewSeason} className="bg-gradient-to-r from-amber-500 to-orange-600">
          <Plus className="w-4 h-4 mr-2" /> New Season
        </Button>
      </div>

      {ordered.length === 0 ? (
        <p className="text-center py-8 text-slate-400">No seasons yet. Create one to start a 1Pass season.</p>
      ) : (
        <div className="space-y-3">
          {ordered.map((season) => (
            <SeasonRow
              key={season.id}
              season={season}
              now={now}
              isSuperAdmin={isSuperAdmin}
              customPets={customPets}
              customThemes={customThemes}
              adminProfile={adminProfile}
              onSeasonChanged={replace}
              onSeasonDeleted={drop}
            />
          ))}
        </div>
      )}
    </div>
  );
}