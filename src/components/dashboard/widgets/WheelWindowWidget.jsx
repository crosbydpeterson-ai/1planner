import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCw, ChevronRight, Clock, Calendar } from 'lucide-react';
import { loadWheelWindow } from '@/lib/dashboardData';
import { getDailyRewardEligibility } from '@/lib/dailyRewardUtils';
import { useCountdown } from '@/hooks/useCountdown';
import { formatCentralDateTime } from '@/lib/centralTime';
import { REWARD_ICONS } from '@/lib/widgetAssets';
import WidgetShell from './WidgetShell';

/**
 * Wheel window — the wheel that is actually live for this student.
 *
 * Everything comes from the existing wheel library (schedule, season dates,
 * fallback and destination rules) and the existing eligibility helpers. This
 * widget is strictly read-only: it never spins, never claims and never grants,
 * so mounting, previewing or refreshing it cannot consume a spin. When
 * eligibility cannot be determined it says so rather than implying a spin is
 * waiting.
 */
function prizeLabel(prize) {
  if (!prize) return 'Reward';
  if (prize.label) return prize.label;
  if (prize.name) return prize.name;
  if (prize.type === 'xp') return `${prize.amount || 0} XP`;
  if (prize.type === 'coins') return `${prize.amount || 0} Coins`;
  return REWARD_ICONS[prize.type] ? `${prize.type.charAt(0).toUpperCase()}${prize.type.slice(1)}` : 'Reward';
}

function describeDailySpin(progress, config) {
  if (!config || !progress) {
    return { state: 'unknown', text: 'Eligibility can’t be checked right now' };
  }
  const { reason } = getDailyRewardEligibility(progress, config);
  if (reason === 'ready') return { state: 'available', text: 'A spin is ready' };
  if (reason === 'already_claimed') return { state: 'used', text: 'Already spun today' };
  if (reason === 'need_assignment') return { state: 'locked', text: 'Finish a quest today to unlock' };
  if (reason === 'no_config') return { state: 'unknown', text: 'Wheel rewards are not configured' };
  return { state: 'unknown', text: 'Eligibility can’t be checked right now' };
}

function describeBonusSpins(progress) {
  if (!progress) return { state: 'unknown', text: 'Bonus spins can’t be checked right now' };
  const tokens = Number(progress.bonusWheelTokens) || 0;
  if (tokens > 0) return { state: 'available', text: `${tokens} bonus spin${tokens === 1 ? '' : 's'} available` };
  return { state: 'none', text: 'No bonus spins yet' };
}

export default function WheelWindowWidget({ profileId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeKey, setActiveKey] = useState('daily');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await loadWheelWindow(profileId));
    } catch (e) {
      console.error('Wheel window load failed:', e);
      setError("Couldn't load the wheel.");
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    load();
  }, [load]);

  const choices = useMemo(() => {
    if (!data) return [];
    const list = [];
    const dailyWheel = data.daily?.wheel;
    const bonusWheel = data.bonus?.wheel;
    if (dailyWheel?.prizes?.length) list.push({ key: 'daily', label: 'Daily wheel', wheel: dailyWheel });
    if (bonusWheel?.prizes?.length) list.push({ key: 'bonus', label: 'Bonus spins', wheel: bonusWheel });
    return list;
  }, [data]);

  const active = choices.find((c) => c.key === activeKey) || choices[0] || null;

  const endIso = useMemo(() => {
    if (!active?.wheel) return null;
    if (active.wheel.followSeasonDates && active.wheel.seasonId && data?.seasons) {
      const season = data.seasons.find((s) => s.id === active.wheel.seasonId);
      if (season?.endDate) return new Date(`${season.endDate}T23:59:59`).toISOString();
      return null;
    }
    return active.wheel.endDate || null;
  }, [active, data]);

  const countdown = useCountdown(endIso);

  const status = useMemo(() => {
    if (!data || !active) return null;
    if (active.key === 'bonus') return describeBonusSpins(data.progress);
    return describeDailySpin(data.progress, data.config);
  }, [data, active]);

  const prizes = useMemo(() => {
    const list = (active?.wheel?.prizes || []).filter((p) => (Number(p.weight) || 0) > 0);
    const totalWeight = list.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
    return list.slice(0, 3).map((p, i) => ({
      key: `${p.type}:${p.value || p.amount || i}`,
      label: prizeLabel(p),
      emoji: REWARD_ICONS[p.type] || REWARD_ICONS.default,
      chance: totalWeight > 0 ? Math.round(((Number(p.weight) || 0) / totalWeight) * 100) : null,
    }));
  }, [active]);

  const statusStyles = {
    available: 'text-emerald-700 bg-emerald-100/80 border-emerald-200/70',
    used: 'text-slate-600 bg-white/60 border-white/60',
    locked: 'text-amber-700 bg-amber-100/80 border-amber-200/70',
    none: 'text-slate-600 bg-white/60 border-white/60',
    unknown: 'text-slate-500 bg-white/60 border-white/60',
  };

  return (
    <WidgetShell
      icon={RotateCw}
      title="Wheel Window"
      loading={loading}
      error={error}
      onRetry={load}
      empty={!loading && !error && choices.length === 0 ? 'No wheel available right now' : null}
      emptyHint={!loading && !error && choices.length === 0 ? 'It will appear here when one goes live.' : null}
      action={
        <Link
          to="/Rewards?tab=daily"
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
        >
          Open wheel <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      }
    >
      {active ? (
        <>
          {choices.length > 1 ? (
            <div className="flex gap-1.5 mb-3" role="tablist" aria-label="Available wheels">
              {choices.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="tab"
                  aria-selected={active.key === c.key}
                  onClick={() => setActiveKey(c.key)}
                  className={`flex-1 rounded-xl px-2 py-1.5 text-xs font-medium border transition-colors ${
                    active.key === c.key
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white/50 text-slate-600 border-white/60 hover:bg-white/70'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : null}

          <p className="font-semibold text-slate-800 text-sm truncate">{active.wheel.name}</p>

          {status ? (
            <span
              className={`inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold border rounded-full px-2 py-0.5 ${statusStyles[status.state] || statusStyles.unknown}`}
            >
              <Clock className="w-3 h-3" aria-hidden="true" />
              {status.text}
            </span>
          ) : null}

          {prizes.length > 0 ? (
            <div className="mt-3">
              <p className="text-[11px] text-slate-400 mb-1.5">On the wheel</p>
              <div className="grid grid-cols-3 gap-2">
                {prizes.map((p) => (
                  <div
                    key={p.key}
                    className="rounded-xl bg-white/40 border border-white/40 p-2 text-center"
                  >
                    <span className="text-lg block" aria-hidden="true">{p.emoji}</span>
                    <span className="text-[11px] font-medium text-slate-700 block truncate">{p.label}</span>
                    {p.chance !== null ? (
                      <span className="text-[10px] text-slate-500">≈{p.chance}% chance</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {endIso ? (
            <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-2.5">
              <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
              Ends {formatCentralDateTime(endIso)}
              {countdown.label && !countdown.ended ? ` · in ${countdown.label}` : ''}
            </p>
          ) : null}
        </>
      ) : null}
    </WidgetShell>
  );
}