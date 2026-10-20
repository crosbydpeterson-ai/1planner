import React from "react";
import { Lightbulb } from "lucide-react";
import { formatHourLabel, formatDayShort } from "@/lib/centralTime";

const MIN_SAMPLE = 5;

/**
 * Small factual summary derived only from the displayed numbers.
 * Each line is gated on sample size so we never over-claim from 1–2 records.
 */
export default function InsightsSummary({ m }) {
  const lines = [];

  const totalStarts = m.hourBuckets.reduce((a, b) => a + b.value, 0);
  if (totalStarts >= MIN_SAMPLE) {
    let max = -1, hour = 0;
    for (const b of m.hourBuckets) if (b.value > max) { max = b.value; hour = b.hour; }
    lines.push(
      `Most recorded session starts occurred between ${formatHourLabel(hour)} and ${formatHourLabel((hour + 1) % 24)} Central (${max} of ${totalStarts}).`
    );
  }

  if (m.activeCount > 0) {
    lines.push(`${m.activeCount} distinct student${m.activeCount === 1 ? "" : "s"} had recorded activity during this period.`);
  }

  if (m.completedCount > 0) {
    lines.push(`${m.completedCount} student${m.completedCount === 1 ? "" : "s"} completed participation${m.eventId ? " in the selected event" : " across events"} during this period.`);
  }

  if (m.completedCount > 0 && m.claims.total > 0) {
    lines.push(`${m.claims.total} confirmed reward claim${m.claims.total === 1 ? "" : "s"} were recorded from ${m.claims.uniqueClaimers} unique claimer${m.claims.uniqueClaimers === 1 ? "" : "s"}.`);
  }

  if (m.wheel.totalSpins > 0) {
    lines.push(`${m.wheel.totalSpins} completed wheel spin${m.wheel.totalSpins === 1 ? "" : "s"} from ${m.wheel.uniqueSpinners} student${m.wheel.uniqueSpinners === 1 ? "" : "s"}.`);
  }

  return (
    <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-indigo-300" />
        <span className="text-white font-semibold text-sm">Event summary</span>
        <span className="text-[11px] text-slate-400">{formatDayShort(m.startKey)} – {formatDayShort(m.endKey)}</span>
      </div>
      {lines.length === 0 ? (
        <p className="text-sm text-slate-400">Not enough recorded activity in this period to summarise. Try a wider range or a different event.</p>
      ) : (
        <ul className="space-y-1">
          {lines.map((l, i) => (
            <li key={i} className="text-sm text-slate-200 flex gap-2">
              <span className="text-indigo-400">•</span>{l}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-slate-500 mt-2">
        Statements are drawn only from the numbers above. Timing needs at least {MIN_SAMPLE} observations before it is reported.
      </p>
    </div>
  );
}