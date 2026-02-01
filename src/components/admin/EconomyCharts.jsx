import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#6366F1", // indigo-500
  "#22C55E", // green-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#06B6D4", // cyan-500
  "#84CC16", // lime-500
  "#F97316", // orange-500
];

function formatDayLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getLastNDates(n = 14) {
  const days = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    days.push(key);
  }
  return days;
}

export default function EconomyCharts({ users = [], assignments = [], shopItems = [], bundles = [], events = [] }) {
  const topXP = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.xp || 0) - (a.xp || 0))
      .slice(0, 10)
      .map((u) => ({ name: u.username || (u.userId || "user").slice(0, 6), xp: u.xp || 0 }));
  }, [users]);

  const topCoins = useMemo(() => {
    return [...users]
      .sort((a, b) => (b.questCoins || 0) - (a.questCoins || 0))
      .slice(0, 10)
      .map((u) => ({ name: u.username || (u.userId || "user").slice(0, 6), coins: u.questCoins || 0 }));
  }, [users]);

  const rarityBreakdown = useMemo(() => {
    const counts = shopItems.reduce((acc, item) => {
      const r = item.rarity || "common";
      acc[r] = (acc[r] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [shopItems]);

  const avgPriceByRarity = useMemo(() => {
    const agg = shopItems.reduce((acc, item) => {
      const r = item.rarity || "common";
      const price = Number(item.price) || 0;
      if (!acc[r]) acc[r] = { sum: 0, count: 0 };
      acc[r].sum += price;
      acc[r].count += 1;
      return acc;
    }, {});
    return Object.entries(agg).map(([rarity, { sum, count }]) => ({ rarity, avgPrice: count ? Math.round((sum / count) * 100) / 100 : 0 }));
  }, [shopItems]);

  const activitySeries = useMemo(() => {
    const days = getLastNDates(14);
    const countOnDay = (arr, key = "created_date") => (d) => arr.filter((x) => (x?.[key] || "").slice(0, 10) === d).length;
    const usersOn = countOnDay(users);
    const assignmentsOn = countOnDay(assignments);
    const itemsOn = countOnDay(shopItems);

    return days.map((d) => ({
      day: formatDayLabel(d),
      users: usersOn(d),
      assignments: assignmentsOn(d),
      shopItems: itemsOn(d),
    }));
  }, [users, assignments, shopItems]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top XP */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <h3 className="text-white font-semibold mb-2">Top 10 Users by XP</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topXP} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 12 }} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "#cbd5e1" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} />
              <Bar dataKey="xp" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Coins */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <h3 className="text-white font-semibold mb-2">Top 10 Users by Coins</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCoins} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 12 }} interval={0} angle={-25} textAnchor="end" height={50} />
              <YAxis tick={{ fill: "#cbd5e1" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} />
              <Bar dataKey="coins" fill="#22C55E" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Items by Rarity */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <h3 className="text-white font-semibold mb-2">Shop Items by Rarity</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={rarityBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {rarityBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} />
              <Legend wrapperStyle={{ color: "#cbd5e1" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Avg Price by Rarity */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <h3 className="text-white font-semibold mb-2">Avg Item Price by Rarity</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={avgPriceByRarity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="rarity" tick={{ fill: "#cbd5e1" }} />
              <YAxis tick={{ fill: "#cbd5e1" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} />
              <Bar dataKey="avgPrice" fill="#F59E0B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity over time */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 lg:col-span-2">
        <h3 className="text-white font-semibold mb-2">Activity (last 14 days)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={activitySeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: "#cbd5e1" }} />
              <YAxis tick={{ fill: "#cbd5e1" }} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" }} />
              <Legend wrapperStyle={{ color: "#cbd5e1" }} />
              <Line type="monotone" dataKey="users" stroke="#6366F1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="assignments" stroke="#22C55E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="shopItems" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}