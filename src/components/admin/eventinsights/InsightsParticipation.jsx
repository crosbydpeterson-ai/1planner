import React from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell, PieChart, Pie, Legend,
} from "recharts";
import ChartCard from "../analytics/ChartCard";
import { TOOLTIP_STYLE, AXIS_TICK, CHART_COLORS } from "../analytics/analyticsUtils";
import { formatDayShort, formatCentralDateTime } from "@/lib/centralTime";
import { durationDays } from "@/lib/eventInsightsCompute";

export default function InsightsParticipation({ m }) {
  const dayData = m.activeByDay.map((d, i) => ({
    day: formatDayShort(d.day),
    active: d.value,
    reached: m.reachByDay[i]?.value || 0,
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-base">Participation</span>
        <span className="text-[11px] text-slate-500">selected period</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Unique active students by day" subtitle="distinct profiles with a session start that Central-Time day">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dayData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="active" name="Active students" stroke="#6366F1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Unique event reach by day"
          subtitle={m.eventId ? "first time each profile reached the selected event" : "first time each profile reached any event"}>
          {m.hasParticipants ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={AXIS_TICK} />
                <YAxis tick={AXIS_TICK} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
                <Bar dataKey="reached" name="Reached" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">No participation records for this selection.</div>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Participation comparison between events"
        subtitle="Unique participants / claims per event. Longer events have more opportunity to accumulate activity — this does not by itself show an event caused a change." height="h-auto">
        {m.comparison.length === 0 ? (
          <div className="text-slate-400 text-sm py-6 text-center">No event participation or claims recorded yet.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs text-left">
                    <th className="py-2 pr-3">Event</th>
                    <th className="py-2 pr-3">Dates</th>
                    <th className="py-2 pr-3">Days</th>
                    <th className="py-2 pr-3">Participants</th>
                    <th className="py-2">Claims</th>
                  </tr>
                </thead>
                <tbody>
                  {m.comparison.map((e) => {
                    const days = durationDays(e.start, e.end);
                    return (
                      <tr key={e.id} className="border-t border-slate-700/60 text-slate-200">
                        <td className="py-2 pr-3">
                          <span className="font-medium">{e.name}</span>
                          <span className="text-slate-500 text-xs ml-1">({e.type})</span>
                        </td>
                        <td className="py-2 pr-3 text-xs text-slate-400">
                          {e.start ? formatCentralDateTime(e.start) : "—"} → {e.end ? formatCentralDateTime(e.end) : "—"}
                        </td>
                        <td className="py-2 pr-3">{days ?? "—"}</td>
                        <td className="py-2 pr-3 font-semibold text-purple-300">{e.participants}</td>
                        <td className="py-2 font-semibold text-amber-300">{e.claims}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={m.comparison.map((e) => ({ name: e.name, participants: e.participants, claims: e.claims }))}
                  margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={AXIS_TICK} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={AXIS_TICK} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
                  <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
                  <Bar dataKey="participants" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="claims" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </ChartCard>
    </div>
  );
}