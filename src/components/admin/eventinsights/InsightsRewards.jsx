import React from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import ChartCard from "../analytics/ChartCard";
import { TOOLTIP_STYLE, AXIS_TICK, CHART_COLORS } from "../analytics/analyticsUtils";
import { ANALYTICS_DEPLOY_NOTE } from "@/lib/analyticsTracking";

export default function InsightsRewards({ m }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-base">Rewards</span>
        <span className="text-[11px] text-slate-500">selected period · confirmed outcomes only</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Confirmed reward claims by type"
          subtitle={`via community-event tiers · ${m.claims.total} claims, ${m.claims.uniqueClaimers} unique claimers`}>
          {m.claims.byType.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No confirmed claims in this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={m.claims.byType} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {m.claims.byType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Wheel reward outcomes by type"
          subtitle={`completed spins only · ${m.wheel.totalSpins} spins, ${m.wheel.uniqueSpinners} unique spinners`}>
          {m.wheel.byOutcome.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-1">
              <span>No wheel spins recorded yet.</span>
              <span className="text-[11px] text-slate-500">{ANALYTICS_DEPLOY_NOTE}</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.wheel.byOutcome} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={AXIS_TICK} />
                <YAxis tick={AXIS_TICK} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
                <Bar dataKey="value" name="Spins" fill="#EC4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
        <p>Wheel outcomes are <span className="text-slate-300">actual recorded results</span>, never the configured odds. Duplicate-to-respin outcomes are not tracked, so none are shown.</p>
        <p>{ANALYTICS_DEPLOY_NOTE}</p>
      </div>
    </div>
  );
}