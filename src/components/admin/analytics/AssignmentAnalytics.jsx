import React, { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import ChartCard, { SectionHeader } from "./ChartCard";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK, groupCount, bucketValues, avg, sumBy, formatNumber } from "./analyticsUtils";
import { ClipboardList } from "lucide-react";

const XP_BUCKETS = [
  { label: "0–25", min: 0, max: 25 },
  { label: "25–50", min: 25, max: 50 },
  { label: "50–100", min: 50, max: 100 },
  { label: "100–250", min: 100, max: 250 },
  { label: "250+", min: 250, max: null },
];

export default function AssignmentAnalytics({ assignments = [], teacherName }) {
  const bySubject = useMemo(() => groupCount(assignments, (a) => a.subject || "everyone", {
    everyone: "Everyone", math: "Math", reading: "Reading",
  }), [assignments]);

  const byStatus = useMemo(() => [
    { name: "Approved", value: assignments.filter((a) => a.isApproved).length },
    { name: "Flagged", value: assignments.filter((a) => a.isFlagged).length },
    { name: "Pending", value: assignments.filter((a) => !a.isApproved && !a.isFlagged).length },
  ], [assignments]);

  const byTeacher = useMemo(() => {
    const m = {};
    for (const a of assignments) {
      const t = a.target;
      const label = !t || t === "everyone" ? "Everyone" : (teacherName ? teacherName(t) : t);
      m[label] = (m[label] || 0) + 1;
    }
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [assignments, teacherName]);

  const xpBuckets = useMemo(() => bucketValues(assignments.map((a) => a.xpReward || 0), XP_BUCKETS), [assignments]);
  const avgXp = avg(assignments, "xpReward");
  const totalXpAvailable = sumBy(assignments, "xpReward");

  return (
    <div className="space-y-3">
      <SectionHeader title="Assignments & Quests" icon={ClipboardList} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Total Assignments</p>
          <p className="text-xl font-bold text-white">{formatNumber(assignments.length)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Avg XP Reward</p>
          <p className="text-xl font-bold text-white">{formatNumber(avgXp)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Total XP Available</p>
          <p className="text-xl font-bold text-white">{formatNumber(totalXpAvailable)}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 border border-slate-700">
          <p className="text-xs text-slate-400">Flagged Rate</p>
          <p className="text-xl font-bold text-white">{assignments.length ? Math.round((assignments.filter(a=>a.isFlagged).length / assignments.length) * 100) : 0}%</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Assignments by Subject">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={bySubject} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {bySubject.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Assignment Status">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {byStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Assignments per Teacher / Target">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byTeacher} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" fill="#22C55E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="XP Reward Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={xpBuckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}