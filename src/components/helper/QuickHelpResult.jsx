import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ScanLine } from 'lucide-react';

const FIELD_LABELS = {
  xp: 'XP',
  questCoins: 'Quest Coins',
  passcode: 'Passcode',
  account: 'Account',
};

// Step 5: the receipt. Close is the only way out — another change needs
// another scan of the card.
export default function QuickHelpResult({ result, card, admin, onClose }) {
  const changes = Object.entries(result?.changes || {});
  const when = result?.appliedAt ? new Date(result.appliedAt) : new Date();

  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <p className="text-sm font-bold text-white mt-2">{result?.summary}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{result?.actionLabel}</p>
      </div>

      {changes.length > 0 && (
        <div className="rounded-xl bg-slate-800 border border-slate-700 divide-y divide-slate-700/70">
          {changes.map(([field, change]) => (
            <div key={field} className="flex items-center justify-between px-3 py-2 gap-3">
              <span className="text-[11px] text-slate-400">{FIELD_LABELS[field] || field}</span>
              <span className="text-xs text-white font-mono truncate">
                {String(change?.before)} → {String(change?.after)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-slate-800/60 border border-slate-700 px-3 py-2 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Recorded</p>
        <p className="text-[11px] text-slate-300">
          {admin?.username} · {card?.nickname || 'Helper card'}
        </p>
        <p className="text-[11px] text-slate-400">{when.toLocaleString()}</p>
      </div>

      <p className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
        <ScanLine className="w-3 h-3" /> Scan the card again for another action
      </p>

      <Button onClick={onClose} className="w-full bg-indigo-600 hover:bg-indigo-700">
        {result?.switched ? 'Done — switching account' : 'Close'}
      </Button>
    </div>
  );
}