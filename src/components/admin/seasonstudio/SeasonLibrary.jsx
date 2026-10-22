import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { parseSeasonDate } from '@/lib/seasonUtils';
import { getSeasonWorkflow, getPublishState } from '@/lib/seasonStudio';
import SeasonLibraryRow from './SeasonLibraryRow';

const GROUPS = [
  { key: 'draft', title: 'Drafts', hint: 'Not visible to students' },
  { key: 'scheduled', title: 'Scheduled & live', hint: 'Published — students see the live one' },
  { key: 'ended', title: 'Finished', hint: 'Kept in the Season Book' },
  { key: 'archived', title: 'Archived', hint: 'Removed from the rotation' },
];

/** The season library, grouped by state, with create/edit/duplicate/preview. */
export default function SeasonLibrary({ seasons = [], now, claimCounts = {}, canDelete, onCreate, onEdit, onDuplicate, onPreview, onDelete }) {
  const grouped = GROUPS.map((group) => ({
    ...group,
    items: (seasons || [])
      .filter((season) => {
        const state = getSeasonWorkflow(season, now).state;
        if (group.key === 'scheduled') return state === 'live' || state === 'scheduled';
        return state === group.key;
      })
      .sort((a, b) => (parseSeasonDate(b.startDate)?.getTime() || 0) - (parseSeasonDate(a.startDate)?.getTime() || 0)),
  }));

  const archivedCount = (seasons || []).filter((season) => getPublishState(season) === 'archived').length;

  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Season Studio</h2>
          <p className="text-xs text-slate-400">
            {seasons.length} season{seasons.length === 1 ? '' : 's'} · {archivedCount} archived · new seasons start as a draft
          </p>
        </div>
        <Button onClick={onCreate} className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
          <Plus className="mr-2 h-4 w-4" /> New season
        </Button>
      </div>

      {seasons.length === 0 ? (
        <p className="py-8 text-center text-slate-400">No seasons yet. Create one to start a 1Pass season.</p>
      ) : (
        <div className="space-y-6">
          {grouped.filter((group) => group.items.length > 0).map((group) => (
            <div key={group.key}>
              <div className="mb-2 flex items-baseline gap-2">
                <h3 className="text-[11px] font-black uppercase tracking-wide text-slate-300">{group.title}</h3>
                <span className="text-[10px] uppercase tracking-wide text-slate-500">{group.hint}</span>
              </div>
              <div className="space-y-3">
                {group.items.map((season) => (
                  <SeasonLibraryRow
                    key={season.id}
                    season={season}
                    now={now}
                    claimedCount={claimCounts[season.id] || 0}
                    canDelete={canDelete}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onPreview={onPreview}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}