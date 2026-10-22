import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Eye, Pencil, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { parseSeasonDate } from '@/lib/seasonUtils';
import { countLaneSlots, buildTiers, getSeasonWorkflow } from '@/lib/seasonStudio';
import SeasonStateBadge from './SeasonStateBadge';

const day = (value) => {
  const date = parseSeasonDate(value);
  return date ? format(date, 'MMM d, yyyy') : '—';
};

/** One season in the studio library, with its state and its actions. */
export default function SeasonLibraryRow({ season, now, claimedCount = 0, canDelete, onEdit, onDuplicate, onPreview, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const workflow = getSeasonWorkflow(season, now);
  const counts = countLaneSlots(buildTiers(season.rewards || []));
  const tiers = new Set((season.rewards || []).map((reward) => Number(reward.xpRequired) || 0)).size;

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
      <div className="flex flex-wrap items-start gap-4">
        {season.artworkUrl ? (
          <img src={season.artworkUrl} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-600 text-2xl">🎟️</div>
        )}

        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-white">{season.name}</h3>
            <SeasonStateBadge workflow={workflow} />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {day(season.startDate)} – {day(season.endDate)} · {tiers} tier{tiers === 1 ? '' : 's'} · {counts.free} Free / {counts.plus} Plus
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {workflow.studentVisible ? 'Students can pick this season' : workflow.state === 'ended' ? 'Finished — kept in the Season Book' : 'Hidden from students'}
            {claimedCount > 0 && ` · ${claimedCount} reward${claimedCount === 1 ? '' : 's'} claimed`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {confirming ? (
            <>
              <span className="mr-1 text-xs text-red-300">Delete this season?</span>
              <Button size="sm" variant="outline" onClick={() => setConfirming(false)} className="border-slate-600 text-slate-300">
                <X className="mr-1 h-3 w-3" /> Cancel
              </Button>
              <Button size="sm" onClick={() => onDelete(season)} className="bg-red-600 hover:bg-red-500">
                <Trash2 className="mr-1 h-3 w-3" /> Delete
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => onEdit(season)} className="border-purple-500/50 text-purple-200 hover:bg-purple-500/10">
                <Pencil className="mr-1 h-3 w-3" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDuplicate(season)} title="Duplicate into a draft" className="text-slate-300 hover:text-white">
                <Copy className="mr-1 h-3 w-3" /> Duplicate
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onPreview(season)} className="text-slate-300 hover:text-white">
                <Eye className="mr-1 h-3 w-3" /> Preview
              </Button>
              {canDelete && (
                <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} title="Delete season" className="text-slate-400 hover:text-red-300">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}