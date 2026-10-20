import React, { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, AreaChart, Area,
} from "recharts";
import ChartCard, { SectionHeader } from "./ChartCard";
import { TOOLTIP_STYLE, AXIS_TICK, getLastNDates, formatDayLabel, countByDay } from "./analyticsUtils";
import { TrendingUp } from "lucide-react";

export default function EngagementAnalytics({
  users = [], assignments = [], shopItems = [], customPets = [], magicEggs = [], range = 14,
}) {
  const days = useMemo(() => getLastNDates(range), [range]);

  const series = useMemo(() => {
    const newUsers = countByDay(users, "created_date", days);
    const newAssignments = countByDay(assignments, "created_date", days);
    const newShopItems = countByDay(shopItems, "created_date", days);
    const newPets = countByDay(customPets, "created_date", days);
    const newEggs = countByDay(magicEggs, "created_date", days);
    return days.map((d, i) => ({
      day: formatDayLabel(d),
      users: newUsers[i],
      assignments: newAssignments[i],
      shopItems: newShopItems[i],
      pets: newPets[i],
      eggs: newEggs[i],
    }));
  }, [users, assignments, shopItems, customPets, magicEggs, days]);

  const totals = useMemo(() => ({
    users: series.reduce((a, b) => a + b.users, 0),
    assignments: series.reduce((a, b) => a + b.assignments, 0),
    shopItems: series.reduce((a, b) => a + b.shopItems, 0),
    pets: series.reduce((a, b) => a + b.pets, 0),
    eggs: series.reduce((a, b) => a + b.eggs, 0),
  }), [series]);

  return (
    <div className="space-y-3">
      <SectionHeader title={`Engagement (last ${range} days)`} icon={TrendingUp} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "New Users", value: totals.users, color: "text-indigo-400" },
          { label: "New Assignments", value: totals.assignments, color: "text-emerald-400" },
          { label: "New Shop Items", value: totals.shopItems, color: "text-amber-400" },
          { label: "New Pets", value: totals.pets, color: "text-pink-400" },
          { label: "New Magic Eggs", value: totals.eggs, color: "text-lime-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <ChartCard title="Combined Activity" className="lg:col-span-2" height="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            <Line type="monotone" dataKey="users" stroke="#6366F1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="assignments" stroke="#22C55E" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="shopItems" stroke="#F59E0B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="pets" stroke="#EC4899" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="eggs" stroke="#84CC16" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="New Users" height="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="users" stroke="#6366F1" fill="url(#gUsers)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New Assignments" height="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gAsgn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="assignments" stroke="#22C55E" fill="url(#gAsgn)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New Pets & Magic Eggs" height="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
              <Line type="monotone" dataKey="pets" stroke="#EC4899" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="eggs" stroke="#84CC16" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New Shop Items" height="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gShop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="shopItems" stroke="#F59E0B" fill="url(#gShop)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}