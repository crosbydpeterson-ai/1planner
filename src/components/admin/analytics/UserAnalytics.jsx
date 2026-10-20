import React, { useMemo } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import ChartCard, { SectionHeader } from "./ChartCard";
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK, groupCount, bucketValues, formatNumber, sumBy } from "./analyticsUtils";
import { Users } from "lucide-react";

const XP_BUCKETS = [
  { label: "0–100", min: 0, max: 100 },
  { label: "100–500", min: 100, max: 500 },
  { label: "500–1k", min: 500, max: 1000 },
  { label: "1k–5k", min: 1000, max: 5000 },
  { label: "5k–25k", min: 5000, max: 25000 },
  { label: "25k+", min: 25000, max: null },
];

function topN(users, key, n = 10) {
  return [...users]
    .sort((a, b) => (b[key] || 0) - (a[key] || 0))
    .slice(0, n)
    .map((u) => ({ name: u.username || (u.userId || "user").slice(0, 8), value: u[key] || 0 }));
}

export default function UserAnalytics({ users = [], teacherName }) {
  const byRank = useMemo(() => groupCount(users, (u) => u.rank || "user", {
    user: "Student", admin: "Admin", super_admin: "Super Admin",
  }), [users]);

  const statusData = useMemo(() => {
    const active = users.filter((u) => !u.isBanned && !u.isLocked).length;
    return [
      { name: "Active", value: active },
      { name: "Banned", value: users.filter((u) => u.isBanned).length },
      { name: "Locked", value: users.filter((u) => u.isLocked).length },
      { name: "Flagged", value: users.filter((u) => u.flagged).length },
    ];
  }, [users]);

  const byMathTeacher = useMemo(() => {
    const m = {};
    for (const u of users) {
      const id = u.mathTeacher || "—";
      const label = id === "—" ? "Unassigned" : (teacherName ? teacherName(id) : id);
      m[label] = (m[label] || 0) + 1;
    }
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [users, teacherName]);

  const byReadingTeacher = useMemo(() => {
    const m = {};
    for (const u of users) {
      const id = u.readingTeacher || "—";
      const label = id === "—" ? "Unassigned" : (teacherName ? teacherName(id) : id);
      m[label] = (m[label] || 0) + 1;
    }
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [users, teacherName]);

  const xpBuckets = useMemo(() => bucketValues(users.map((u) => u.xp || 0), XP_BUCKETS), [users]);
  const topXP = useMemo(() => topN(users, "xp"), [users]);
  const topCoins = useMemo(() => topN(users, "questCoins"), [users]);
  const topGems = useMemo(() => topN(users, "gems"), [users]);
  const topSeason = useMemo(() => topN(users, "seasonXp"), [users]);

  return (
    <div className="space-y-3">
      <SectionHeader title="Users & Students" icon={Users} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Users by Rank">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byRank} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {byRank.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Account Status">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Students per Math Teacher">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byMathTeacher} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Students per Reading Teacher">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byReadingTeacher} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" fill="#22C55E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="XP Distribution" subtitle={`${formatNumber(sumBy(users, "xp"))} total XP across ${users.length} users`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={xpBuckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 by XP">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topXP} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} interval={0} angle={-25} textAnchor="end" height={55} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" name="XP" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 by Quest Coins">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCoins} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} interval={0} angle={-25} textAnchor="end" height={55} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" name="Coins" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 by Gems">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topGems} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} interval={0} angle={-25} textAnchor="end" height={55} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" name="Gems" fill="#06B6D4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top 10 by 1Pass XP">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSeason} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={AXIS_TICK} interval={0} angle={-25} textAnchor="end" height={55} />
              <YAxis tick={AXIS_TICK} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
              <Bar dataKey="value" name="1Pass XP" fill="#EC4899" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}