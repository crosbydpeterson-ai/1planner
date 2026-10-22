import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarRange, ChevronDown, Zap, CheckCircle2, Gem, RotateCw } from 'lucide-react';
import { loadWeekHistory, loadAssetCatalogs } from '@/lib/dashboardData';
import { getChicagoWeekRange, summarizeWeek, WEEK_HISTORY_NOTE } from '@/lib/weekWrapped';
import { describeAsset } from '@/lib/widgetAssets';
import WidgetShell from './WidgetShell';

/**
 * Week wrapped — a compact recap of the current school week (Monday–Sunday,
 * America/Chicago), expandable into a fuller view.
 *
 * Every number comes from recorded completed outcomes for this profile, never
 * from lifetime XP and never from what happens to be in the inventory, so the
 * widget cannot overstate a student's week. When nothing has been recorded it
 * says so instead of inventing a figure. It is private: nothing is shared and
 * no export is offered.
 */
export default function WeekWrappedWidget({ profileId }) {
  const [actions, setActions] = useState([]);
  const [catalogs, setCatalogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  const weekRange = useMemo(() => getChicagoWeekRange(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await loadWeekHistory(profileId);
      setActions(rows);
      const summary = summarizeWeek(rows, getChicagoWeekRange());
      if (summary.collectibles.length > 0) {
        try {
          setCatalogs(await loadAssetCatalogs());
        } catch {
          setCatalogs({});
        }
      }
    } catch (e) {
      console.error('Week wrapped load failed:', e);
      setError("Couldn't load your week.");
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => summarizeWeek(actions, weekRange), [actions, weekRange]);

  const collectibleChips = summary.collectibles.map((c) => {
    const asset = describeAsset(c.type, c.id, catalogs, { amount: c.amount });
    return { key: `${c.type}:${c.id}`, ...asset };
  });

  const tiles = [
    { key: 'quests', label: 'Quests done', value: summary.questsCompleted, Icon: CheckCircle2, tint: 'text-emerald-600' },
    { key: 'xp', label: 'XP earned', value: summary.xpEarned, Icon: Zap, tint: 'text-amber-500' },
    { key: 'new', label: 'New items', value: summary.collectibles.length, Icon: Gem, tint: 'text-purple-500' },
  ];

  return (
    <WidgetShell
      icon={CalendarRange}
      title="Week Wrapped"
      loading={loading}
      error={error}
      onRetry={load}
      action={
        <span className="text-[11px] text-slate-500 shrink-0">Mon–Sun · {weekRange.label}</span>
      }
    >
      {!summary.hasHistory ? (
        <div className="py-3 text-center">
          <p className="text-sm text-slate-500">Nothing recorded this week yet</p>
          <p className="text-xs text-slate-400 mt-1">{WEEK_HISTORY_NOTE}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {tiles.map((t) => (
              <div key={t.key} className="rounded-xl bg-white/40 border border-white/40 p-2.5 text-center">
                <t.Icon className={`w-4 h-4 mx-auto mb-1 ${t.tint}`} aria-hidden="true" />
                <p className="text-lg font-bold text-slate-800 leading-none">{t.value}</p>
                <p className="text-[10px] text-slate-500 mt-1">{t.label}</p>
              </div>
            ))}
          </div>

          {summary.spins > 0 ? (
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
              <RotateCw className="w-3 h-3" aria-hidden="true" />
              {summary.spins} wheel spin{summary.spins === 1 ? '' : 's'} this week
            </p>
          ) : null}

          {expanded ? (
            <div className="mt-3 pt-3 border-t border-white/20 space-y-3">
              <p className="text-xs text-slate-600">
                {summary.questsCompleted} quest{summary.questsCompleted === 1 ? '' : 's'} finished and{' '}
                {summary.xpEarned} XP earned between {weekRange.label}.
              </p>

              {collectibleChips.length > 0 ? (
                <div>
                  <p className="text-[11px] text-slate-400 mb-1.5">Added to your collection</p>
                  <div className="flex flex-wrap gap-1.5">
                    {collectibleChips.map((c) => (
                      <span
                        key={c.key}
                        className="inline-flex items-center gap-1 rounded-full bg-white/60 border border-white/60 px-2 py-0.5 text-[11px] text-slate-700"
                      >
                        <span aria-hidden="true">{c.emoji}</span>
                        {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No new collectibles recorded this week.</p>
              )}

              <p className="text-[11px] text-slate-400">{WEEK_HISTORY_NOTE}</p>
              <p className="text-[11px] text-slate-400">Only you can see this recap.</p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-3 w-full inline-flex items-center justify-center gap-1 rounded-xl border border-indigo-200 bg-white/70 hover:bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-2"
          >
            {expanded ? 'Hide full recap' : 'See full recap'}
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </>
      )}
    </WidgetShell>
  );
}