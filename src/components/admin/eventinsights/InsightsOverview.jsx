import React from "react";
import { Users, Repeat, PartyPopper, Percent, Gift, ClipboardCheck, Dices } from "lucide-react";
import StatCard from "../analytics/StatCard";
import { formatDayShort } from "@/lib/centralTime";

function fmtRange(m) {
  return `${formatDayShort(m.startKey)} – ${formatDayShort(m.endKey)}`;
}

export default function InsightsOverview({ m }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-white font-bold text-base">Overview</span>
        <span className="text-[11px] text-slate-500">selected period: {fmtRange(m)}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Unique active students" value={m.activeCount}
          sub="distinct profiles with a session start in period" color="text-blue-400" />
        <StatCard icon={Repeat} label="Returning students" value={m.returningCount}
          sub="active now, also active before this period" color="text-teal-400" />
        <StatCard icon={PartyPopper} label="Event participants" value={m.completedCount}
          sub={`completed participation${m.reachedCount ? ` · ${m.reachedCount} reached` : ""}`} color="text-purple-400" />
        <StatCard icon={Percent} label="Participation rate"
          value={m.participationRate == null ? "—" : `${m.participationRate}%`}
          sub={m.activeCount ? `${m.completedCount} participants ÷ ${m.activeCount} active students` : "no active students in period"}
          color="text-indigo-400" />
        <StatCard icon={Gift} label="Confirmed reward claims" value={m.claims.total}
          sub={`${m.claims.uniqueClaimers} unique claimers`} color="text-amber-400" />
        <StatCard icon={Dices} label="Wheel spins" value={m.wheel.totalSpins}
          sub={`${m.wheel.dailySpins} daily · ${m.wheel.bonusSpins} bonus · ${m.wheel.uniqueSpinners} spinners`} color="text-pink-400" />
        <StatCard icon={ClipboardCheck} label="Quest completions" value={m.quest.total}
          sub={m.quest.total === 0 ? "recorded from this build onward" : "completed quests in period"} color="text-emerald-400" />
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
        <p><span className="text-slate-300">Participation rate</span> = event participants ÷ <span className="text-slate-300">active students in the selected period</span>. It is not a percentage of all enrolled students — eligibility is not tracked, and participation records can exist for students without session tracking.</p>
        <p><span className="text-slate-300">Returning students</span> are counted only where earlier session history exists; incomplete history will undercount them.</p>
        {m.quest.total === 0 && <p className="text-amber-300/80">Historical quest-completion timing is unavailable — completions are counted only from this build onward.</p>}
      </div>
    </div>
  );
}