import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Zap } from 'lucide-react';
import { buildXpPlan } from '@/lib/seasonStudio';

const LANE_LABEL = { free: 'Free', plus: '1Pass Plus' };

/** Final XP, tier gaps and a plain estimate of the quests each tier needs. */
export default function XpPlanner({ tiers, xpPerQuest, onXpPerQuestChange }) {
  const plan = buildXpPlan(tiers, xpPerQuest);

  return (
    <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-purple-200">
            <Zap className="h-4 w-4" /> XP plan
          </h4>
          <p className="text-xs text-purple-200/70">
            {plan.finalXp} XP finishes the season · about {plan.totalQuests} quests
          </p>
        </div>
        <div className="w-40">
          <Label className="text-[10px] font-black uppercase tracking-wide text-purple-200/80">XP per quest</Label>
          <Input
            type="number"
            min="1"
            value={xpPerQuest}
            onChange={(e) => onXpPerQuestChange(Number(e.target.value) || 0)}
            className="mt-1 h-9 border-purple-400/40 bg-slate-900/60 text-white"
          />
        </div>
      </div>

      <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-purple-200/60">
        Estimate only — it assumes every quest is worth the XP you set above.
      </p>

      {plan.rows.length === 0 ? (
        <p className="text-xs text-purple-200/70">Add tiers to see the pacing.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[380px] text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-purple-200/70">
                <th className="pb-1">Tier XP</th>
                <th className="pb-1">Gap</th>
                <th className="pb-1">Quests for gap</th>
                <th className="pb-1">Quests total</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {plan.rows.map((row) => (
                <tr key={row.xpRequired} className="border-t border-purple-400/20">
                  <td className="py-1 font-bold">{row.xpRequired}</td>
                  <td className="py-1">+{row.gap}</td>
                  <td className="py-1">~{row.quests}</td>
                  <td className="py-1 text-purple-200/80">~{row.cumulativeQuests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(plan.invalid.length > 0 || plan.duplicates.length > 0) && (
        <ul className="mt-3 space-y-1">
          {plan.invalid.length > 0 && (
            <li className="flex items-start gap-2 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {plan.invalid.length} tier{plan.invalid.length > 1 ? 's have' : ' has'} a missing or invalid XP threshold.
              </span>
            </li>
          )}
          {plan.duplicates.map((dupe) => (
            <li key={`${dupe.lane}-${dupe.xpRequired}`} className="flex items-start gap-2 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {dupe.count} {LANE_LABEL[dupe.lane]} rewards share {dupe.xpRequired} XP — students unlock them in the same tier.
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}