import React, { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import ChartCard, { SectionHeader } from "./ChartCard";
import { TOOLTIP_STYLE, AXIS_TICK, CHART_COLORS, formatNumber, sumBy } from "./analyticsUtils";
import useWheelSeasonAnalytics from "@/hooks/useWheelSeasonAnalytics";
import { centralRange, lastNDayKeys } from "@/lib/centralTime";
import { wheelStats } from "@/lib/eventInsightsCompute";
import { ANALYTICS_DEPLOY_NOTE } from "@/lib/analyticsTracking";
import { Sparkles } from "lucide-react";

export default function WheelSeasonAnalytics({ seasons = [], users = [], range = 14 }) {
  const { presets, actions, loading, error } = useWheelSeasonAnalytics({ enabled: true });

  const rangeWindow = useMemo(() => {
    const keys = lastNDayKeys(range);
    return centralRange(keys[0], keys[keys.length - 1]);
  }, [range]);

  const spins = useMemo(() => wheelStats(actions, rangeWindow), [actions, rangeWindow]);

  const totalSeasonXp = sumBy(users, "seasonXp");
  const engaged = users.filter((u) => (u.seasonXp || 0) > 0).length;
  const totalClaimedRewards = users.reduce((a, u) => a + (u.claimedSeasonRewards?.length || 0), 0);
  const activeSeasons = seasons.filter((s) => s.isActive).length;

  const topSeason = useMemo(() =>
    [...users].sort((a, b) => (b.seasonXp || 0) - (a.seasonXp || 0)).slice(0, 10)
      .map((u) => ({ name: u.username || "user", value: u.seasonXp || 0 })), [users]);

  const tiersPerSeason = useMemo(() =>
    seasons.map((s) => ({ name: s.name, value: s.rewards?.length || 0 })), [seasons]);

  const presetsByStatus = useMemo(() => {
    const m = {};
    for (const p of presets) { const k = p.status || "draft"; m[k] = (m[k] || 0) + 1; }
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [presets]);

  const presetsByTheme = useMemo(() => {
    const m = {};
    for (const p of presets) { const k = p.wheelTheme || "classic"; m[k] = (m[k] || 0) + 1; }
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [presets]);

  return (
    <div className="space-y-3">
      <SectionHeader title="Wheels & Seasons" icon={Sparkles} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Active Seasons</p>
          <p className="text-xl font-bold text-white">{activeSeasons} <span className="text-sm text-slate-500">/ {seasons.length}</span></p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Total 1Pass XP</p>
          <p className="text-xl font-bold text-white">{formatNumber(totalSeasonXp)}</p>
          <p className="text-[11px] text-slate-500">{engaged} users with progress</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Claimed Season Rewards</p>
          <p className="text-xl font-bold text-white">{formatNumber(totalClaimedRewards)}</p>
          <p className="text-[11px] text-slate-500">current snapshot</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Wheel Presets</p>
          <p className="text-xl font-bold text-white">{presets.length}</p>
          <p className="text-[11px] text-slate-500">library</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Top 10 by 1Pass XP" subtitle="lifetime snapshot">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSeason} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} interval={0} angle={-25} textAnchor="end" height={55} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" name="1Pass XP" fill="#A855F7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Reward tiers configured per season" subtitle="lifetime snapshot">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tiersPerSeason} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} angle={-15} textAnchor="end" height={55} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" name="Tiers" fill="#14B8A6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Wheel presets by status" subtitle="library · lifetime snapshot">
          {presetsByStatus.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No wheel presets yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={presetsByStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {presetsByStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Wheel presets by theme" subtitle="library · lifetime snapshot">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={presetsByTheme} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} angle={-15} textAnchor="end" height={55} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" fill="#06B6D4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Actual wheel spins (last period)" subtitle={`completed spins only · daily ${spins.dailySpins} · bonus ${spins.bonusSpins} · ${spins.uniqueSpinners} unique spinners`}>
        {error ? (
          <div className="h-full flex items-center justify-center text-amber-300 text-sm">Wheel data failed to load.</div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">Loading wheel activity…</div>
        ) : spins.byOutcome.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-1">
            <span>No completed spins recorded yet.</span>
            <span className="text-[11px] text-slate-500">{ANALYTICS_DEPLOY_NOTE}</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={spins.byOutcome} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" name="Outcomes" fill="#EC4899" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}