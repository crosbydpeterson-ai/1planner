import React, { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, AreaChart, Area,
} from "recharts";
import ChartCard, { SectionHeader } from "./ChartCard";
import { cn } from "@/lib/utils";
import { TOOLTIP_STYLE, AXIS_TICK, getLastNDates, formatDayLabel, countByDay } from "./analyticsUtils";
import { TrendingUp } from "lucide-react";

export default function EngagementAnalytics({
  users = [], assignments = [], shopItems = [], customPets = [], magicEggs = [], range = 14, onRangeChange,
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <SectionHeader title={`Content added (last ${range} days)`} icon={TrendingUp} />
        {onRangeChange && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400 mr-1">Selected period:</span>
            {[7, 14, 30].map((d) => (
              <button key={d} onClick={() => onRangeChange(d)}
                className={cn("text-xs px-3 py-1 rounded-lg transition-colors",
                  range === d ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600")}>
                {d}d
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-500">
        These count content created in the app — not student usage or acquisitions. Student activity and participation are in Event Insights.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Accounts created", value: totals.users, color: "text-indigo-400" },
          { label: "Assignments created", value: totals.assignments, color: "text-emerald-400" },
          { label: "Shop items created", value: totals.shopItems, color: "text-amber-400" },
          { label: "Custom pets created", value: totals.pets, color: "text-pink-400" },
          { label: "Magic eggs issued", value: totals.eggs, color: "text-lime-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <ChartCard title="Combined content added" height="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={AXIS_TICK} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
            <Line type="monotone" dataKey="users" name="Accounts" stroke="#6366F1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="assignments" name="Assignments" stroke="#22C55E" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="shopItems" name="Shop items" stroke="#F59E0B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="pets" name="Custom pets" stroke="#EC4899" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="eggs" name="Magic eggs" stroke="#84CC16" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Accounts created" height="h-56">
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

        <ChartCard title="Assignments created" height="h-56">
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

        <ChartCard title="Custom pets created & magic eggs issued" height="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ color: "#cbd5e1", fontSize: 12 }} />
              <Line type="monotone" dataKey="pets" name="Custom pets" stroke="#EC4899" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="eggs" name="Magic eggs" stroke="#84CC16" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Shop items created" height="h-56">
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