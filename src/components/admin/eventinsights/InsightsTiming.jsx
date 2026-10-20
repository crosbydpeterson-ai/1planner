import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import ChartCard from "../analytics/ChartCard";
import { TOOLTIP_STYLE, AXIS_TICK } from "../analytics/analyticsUtils";
import { formatHourLabel } from "@/lib/centralTime";

const MIN_SAMPLE = 5;

function peakHourLabel(buckets) {
  let max = -1;
  let hour = 0;
  for (const b of buckets) { if (b.value > max) { max = b.value; hour = b.hour; } }
  return { max, hour };
}

export default function InsightsTiming({ m }) {
  const data = m.hourBuckets.map((b) => ({ hour: formatHourLabel(b.hour), value: b.value }));
  const peak = peakHourLabel(m.hourBuckets);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-base">Timing</span>
        <span className="text-[11px] text-slate-500">selected period · Central Time</span>
      </div>

      <ChartCard title="Session starts by Central-Time hour"
        subtitle='Counts when sessions began — not "students online by hour".' height="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis dataKey="hour" tick={AXIS_TICK} interval={1} />
            <YAxis tick={AXIS_TICK} allowDecimals={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#1e293b" }} />
            <Bar dataKey="value" name="Session starts" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={m.hourBuckets[i]?.hour === peak.hour && peak.max > 0 ? "#8B5CF6" : "#6366F1"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-[11px] text-slate-400">
        {peak.max >= MIN_SAMPLE ? (
          <p>
            Peak recorded session starts: <span className="text-slate-200">{formatHourLabel(peak.hour)}–{formatHourLabel((peak.hour + 1) % 24)}</span> Central
            ({peak.max} of {m.hourBuckets.reduce((a, b) => a + b.value, 0)} starts).
          </p>
        ) : (
          <p>Not enough recorded session starts in this period for a reliable timing pattern (minimum {MIN_SAMPLE}).</p>
        )}
      </div>
    </div>
  );
}