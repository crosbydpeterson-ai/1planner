import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, History } from 'lucide-react';
import { listHelperActions, ACTION_LABELS } from '@/lib/helperCards';

const STATUS_STYLE = {
  applied: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  blocked: 'bg-red-500/15 text-red-300 border-red-500/30',
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

// Who used the card, on whom, for what, and when.
export default function HelperCardHistoryDialog({ open, card, onClose }) {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    if (!open || !card) return;
    let cancelled = false;
    setRows(null);
    (async () => {
      try {
        const list = await listHelperActions(card.id);
        if (!cancelled) setRows(list);
      } catch (e) {
        console.error('Failed to load helper card history:', e);
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, card]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-indigo-400" /> {card?.nickname || 'Helper card'} history
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {card ? `${card.adminUsername || 'Admin'} · ${card.number}` : ''}
          </DialogDescription>
        </DialogHeader>

        {rows === null ? (
          <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading history…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-8">This card has not been used yet.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((row) => (
              <div key={row.id} className="rounded-xl bg-slate-800 border border-slate-700 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white">{ACTION_LABELS[row.actionType] || row.actionType}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {row.adminUsername || 'admin'} → {row.targetUsername || 'student'}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_STYLE[row.status] || STATUS_STYLE.pending}`}>
                    {row.status}
                  </span>
                </div>
                {row.summary && <p className="text-[11px] text-slate-200 mt-1 break-words">{row.summary}</p>}
                {row.blockedReason && <p className="text-[11px] text-red-300 mt-1 break-words">{row.blockedReason}</p>}
                <p className="text-[10px] text-slate-500 mt-1">
                  {new Date(row.appliedAt || row.created_date).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}