import React, { useMemo, useRef, useState } from "react";
import { RefreshCw, Download, CalendarRange, AlertTriangle, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useEventInsights from "@/hooks/useEventInsights";
import { centralRange, lastNDayKeys, dayKeysBetween, chicagoDateKey, formatCentralDateTime } from "@/lib/centralTime";
import {
  activeStudentSet, returningStudentSet, activeByDay, sessionStartsByHour,
  participationStats, reachByDay, claimsStats, wheelStats, questStats, eventComparison, pct,
} from "@/lib/eventInsightsCompute";
import { exportElementToPdf } from "@/lib/exportAnalyticsPdf";
import InsightsSummary from "./InsightsSummary";
import InsightsOverview from "./InsightsOverview";
import InsightsParticipation from "./InsightsParticipation";
import InsightsRewards from "./InsightsRewards";
import InsightsTiming from "./InsightsTiming";

const PRESETS = [
  { id: "7", label: "Last 7 days", days: 7 },
  { id: "14", label: "Last 14 days", days: 14 },
  { id: "30", label: "Last 30 days", days: 30 },
  { id: "custom", label: "Custom", days: null },
];

function todayKey() { return chicagoDateKey(new Date()); }

export default function EventInsights() {
  const today = todayKey();
  const [preset, setPreset] = useState("14");
  const [customStart, setCustomStart] = useState(lastNDayKeys(14)[0]);
  const [customEnd, setCustomEnd] = useState(today);
  const [eventId, setEventId] = useState("");
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef(null);

  const { sessions, participations, claims, globalEvents, adminEvents, actions, loading, error, partial, lastUpdated, refresh } =
    useEventInsights({ enabled: true });

  const { startKey, endKey } = useMemo(() => {
    if (preset === "custom") {
      const s = customStart <= customEnd ? customStart : customEnd;
      const e = customStart <= customEnd ? customEnd : customStart;
      return { startKey: s, endKey: e };
    }
    const days = PRESETS.find((p) => p.id === preset)?.days || 14;
    const keys = lastNDayKeys(days);
    return { startKey: keys[0], endKey: keys[keys.length - 1] };
  }, [preset, customStart, customEnd]);

  const dayKeys = useMemo(() => dayKeysBetween(startKey, endKey), [startKey, endKey]);
  const range = useMemo(() => centralRange(startKey, endKey), [startKey, endKey]);

  const eventOptions = useMemo(() => [
    { id: "", label: "All events" },
    ...adminEvents.map((e) => ({ id: e.id, label: `${e.name || "Event"} — activity`, start: e.startTime, end: e.endTime })),
    ...globalEvents.map((e) => ({ id: e.id, label: `${e.name || "Event"} — community`, start: e.startDate, end: e.endDate })),
  ], [adminEvents, globalEvents]);

  const selectedEvent = useMemo(() => eventOptions.find((o) => o.id === eventId) || null, [eventOptions, eventId]);

  const m = useMemo(() => {
    const active = activeStudentSet(sessions, range);
    const returning = returningStudentSet(sessions, range);
    const participation = participationStats(participations, eventId);
    const claimStats = claimsStats(claims, globalEvents, eventId, range);
    const wheel = wheelStats(actions, range);
    const quest = questStats(actions, range, dayKeys);
    return {
      range, dayKeys, eventId, selectedEvent,
      startKey, endKey,
      activeCount: active.size,
      returningCount: returning.size,
      activeByDay: activeByDay(sessions, dayKeys),
      hourBuckets: sessionStartsByHour(sessions, range),
      reachedCount: participation.reached.size,
      completedCount: participation.completed.size,
      participationRecordCount: participation.recordCount,
      reachByDay: reachByDay(participations, eventId, dayKeys),
      participationRate: pct(participation.completed.size, active.size),
      claims: claimStats,
      wheel,
      quest,
      comparison: eventComparison(adminEvents, globalEvents, participations, claims),
      hasParticipants: participation.recordCount > 0,
    };
  }, [sessions, participations, claims, globalEvents, adminEvents, actions, range, dayKeys, eventId, selectedEvent, startKey, endKey]);

  const useEntireEventRange = () => {
    if (!selectedEvent?.start || !selectedEvent?.end) return;
    setPreset("custom");
    setCustomStart(chicagoDateKey(new Date(selectedEvent.start)));
    setCustomEnd(chicagoDateKey(new Date(selectedEvent.end)));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportElementToPdf(reportRef.current, `event-insights-${startKey}_to_${endKey}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-white font-bold text-lg">📈 Event Insights</h2>
            <p className="text-xs text-slate-400">Read-only. Aggregate view for planning events — all times America/Chicago.</p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && <span className="text-[11px] text-slate-500">Updated {formatCentralDateTime(lastUpdated.toISOString())}</span>}
            <Button size="sm" variant="outline" onClick={refresh} disabled={loading} className="border-slate-600 text-slate-200">
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}Refresh
            </Button>
            <Button size="sm" onClick={handleExport} disabled={exporting} className="bg-indigo-600 hover:bg-indigo-700">
              {exporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}Export PDF
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button key={p.id} onClick={() => setPreset(p.id)}
              className={cn("text-xs px-3 py-1.5 rounded-lg transition-colors",
                preset === p.id ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600")}>
              {p.label}
            </button>
          ))}
          {preset === "custom" && (
            <div className="flex items-center gap-2">
              <input type="date" value={customStart} max={today} onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded-lg px-2 py-1" />
              <span className="text-slate-500 text-xs">to</span>
              <input type="date" value={customEnd} max={today} onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded-lg px-2 py-1" />
            </div>
          )}
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-slate-200 text-xs rounded-lg px-2 py-1.5 max-w-[240px]">
            {eventOptions.map((o) => <option key={o.id || "all"} value={o.id}>{o.label}</option>)}
          </select>
          {selectedEvent?.start && selectedEvent?.end && (
            <button onClick={useEntireEventRange}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center gap-1">
              <CalendarRange className="w-3.5 h-3.5" /> Entire event
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-500">
          Showing <span className="text-slate-300">{startKey}</span> to <span className="text-slate-300">{endKey}</span> (inclusive), Central Time.
          {partial && " · Session/participation reads are capped at the most recent records; totals may undercount."}
        </p>
      </div>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2 text-amber-200 text-sm">
          <AlertTriangle className="w-4 h-4" /> {error} Showing last loaded data.
          <Button size="sm" variant="ghost" onClick={refresh} className="text-amber-200 underline">Retry</Button>
        </div>
      )}

      <div ref={reportRef} className="space-y-5 bg-slate-900 rounded-2xl p-1">
        <InsightsSummary m={m} />
        <InsightsOverview m={m} />
        <InsightsParticipation m={m} />
        <InsightsRewards m={m} />
        <InsightsTiming m={m} />
        <div className="flex items-start gap-2 text-[11px] text-slate-500 px-1">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p>
            Definitions: active students = distinct profiles with a recorded session start in the window (not accounts merely
            marked active). Event participants = distinct profiles with a completed participation record for the selected event
            (opening the event page is counted separately as "reached"). Claims = successful recorded reward claims.
            Wheel/quest outcomes are recorded from this build onward.
          </p>
        </div>
      </div>
    </div>
  );
}