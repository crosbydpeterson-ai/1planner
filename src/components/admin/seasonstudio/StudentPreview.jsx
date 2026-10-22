import React, { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Eye, Lock, Sparkles } from 'lucide-react';
import SeasonRewards from '@/components/quest/SeasonRewards';
import { buildXpPlan, tiersToRewards } from '@/lib/seasonStudio';

/**
 * The real student reward components, rendered in preview mode: the XP slider
 * and the Free / Plus toggle only change what is displayed. Nothing is granted,
 * no progress is written and no claim can be made from here.
 */
export default function StudentPreview({ draft }) {
  const plan = useMemo(() => buildXpPlan(draft.tiers, draft.xpPerQuest), [draft.tiers, draft.xpPerQuest]);
  const rewards = useMemo(() => tiersToRewards(draft.tiers), [draft.tiers]);
  const [xp, setXp] = useState(null);
  const [hasPlus, setHasPlus] = useState(false);

  const maxXp = Math.max(plan.finalXp, 100);
  const currentXp = xp === null ? Math.round(maxXp / 2) : xp;

  const season = {
    id: 'preview',
    name: draft.name || 'Untitled season',
    startDate: draft.startDate,
    endDate: draft.endDate,
    artworkUrl: draft.artworkUrl,
    rewards,
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white">
              <Eye className="h-4 w-4 text-purple-300" /> Student preview
            </h4>
            <p className="text-[11px] text-slate-400">Read-only. Students never see this screen.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHasPlus(false)}
              className={`rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${hasPlus ? 'border-slate-600 text-slate-400' : 'border-sky-400/60 bg-sky-500/15 text-sky-200'}`}
            >
              Free
            </button>
            <button
              type="button"
              onClick={() => setHasPlus(true)}
              className={`flex items-center gap-1 rounded-xl border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${hasPlus ? 'border-yellow-300 bg-yellow-400 text-slate-900' : 'border-slate-600 text-slate-400'}`}
            >
              {hasPlus ? <Sparkles className="h-3 w-3" /> : <Lock className="h-3 w-3" />} 1Pass Plus
            </button>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-slate-400">
            <span>Preview XP</span>
            <span className="text-white">{currentXp}</span>
          </div>
          <Slider value={[currentXp]} max={maxXp} step={5} onValueChange={([value]) => setXp(value)} />
        </div>
      </div>

      {rewards.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-600 px-4 py-8 text-center text-sm text-slate-400">
          Add rewards to see how the season looks to a student.
        </p>
      ) : (
        <div className="rounded-[28px] border border-slate-700 bg-[radial-gradient(circle_at_top,_#7c3aed_0%,_#581c87_45%,_#2e1065_100%)] p-3 md:p-5">
          {draft.artworkUrl && (
            <img src={draft.artworkUrl} alt="" className="mb-3 h-24 w-full rounded-2xl object-cover md:h-32" />
          )}
          <div className="mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">1Pass</p>
            <h3 className="text-2xl font-black uppercase text-white">{season.name}</h3>
          </div>
          <SeasonRewards season={season} userXp={currentXp} claimedRewards={[]} hasPlus={hasPlus} previewOnly />
        </div>
      )}
    </div>
  );
}