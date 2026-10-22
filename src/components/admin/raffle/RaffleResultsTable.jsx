import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, RefreshCw, ShieldCheck } from 'lucide-react';
import { DELIVERY, KIND, deliveryLabel } from '@/lib/raffleLogic';

const STATUS_STYLE = {
  [DELIVERY.DELIVERED]: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  [DELIVERY.PENDING]: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
  [DELIVERY.DELIVERING]: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  [DELIVERY.FAILED]: 'bg-red-500/15 text-red-300 border-red-500/40',
  [DELIVERY.NEEDS_REVIEW]: 'bg-amber-500/15 text-amber-200 border-amber-500/40',
};

const STATUS_LABEL = {
  [DELIVERY.DELIVERED]: 'Delivered',
  [DELIVERY.PENDING]: 'Saved — not delivered yet',
  [DELIVERY.DELIVERING]: 'Delivering…',
  [DELIVERY.FAILED]: 'Failed (nothing applied)',
  [DELIVERY.NEEDS_REVIEW]: 'Needs review',
};

/**
 * Saved winners, their prizes and how delivery went. Winner selection is shown
 * separately from delivery so an admin can always tell "we chose someone" from
 * "the reward landed".
 */
export default function RaffleResultsTable({
  results = [],
  busy = false,
  revealedCodes = {},
  onRetry,
  onConfirm,
  onRevealCode,
}) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No winners saved yet. Draws appear here the moment they are saved — before delivery is attempted.
      </p>
    );
  }

  const sorted = results.slice().sort((a, b) => Number(a.seq) - Number(b.seq));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-400 border-b border-slate-700">
            <th className="py-2 pr-2">#</th>
            <th className="py-2 pr-2">Student</th>
            <th className="py-2 pr-2">Prize</th>
            <th className="py-2 pr-2">Saved</th>
            <th className="py-2 pr-2">Delivery</th>
            <th className="py-2 pr-2">Prize code</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => {
            const status = r.deliveryStatus || DELIVERY.PENDING;
            const code = revealedCodes[r.id];
            return (
              <tr key={r.id} className="border-b border-slate-800 align-top">
                <td className="py-2 pr-2 text-slate-500">{Number(r.seq) + 1}</td>
                <td className="py-2 pr-2 text-slate-200">
                  {r.username || 'Student'}
                  {r.kind === KIND.EVERYONE && (
                    <span className="ml-2 text-xs text-slate-400">base reward</span>
                  )}
                </td>
                <td className="py-2 pr-2 text-slate-200">
                  {r.prizeEmoji || '🎁'} {r.prizeLabel || 'Prize'}
                </td>
                <td className="py-2 pr-2 text-slate-400">
                  {r.selectionSavedAt ? new Date(r.selectionSavedAt).toLocaleString() : '—'}
                </td>
                <td className="py-2 pr-2">
                  <Badge variant="outline" className={STATUS_STYLE[status] || STATUS_STYLE[DELIVERY.PENDING]}>
                    {STATUS_LABEL[status] || status}
                  </Badge>
                  {r.deliveryError && <p className="text-xs text-amber-200 mt-1 max-w-[16rem]">{r.deliveryError}</p>}
                </td>
                <td className="py-2 pr-2 text-slate-300 font-mono text-xs">
                  {r.codeId ? (
                    code ? (
                      <span className="text-slate-100">{code}</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-300 hover:text-white h-6 px-2"
                        onClick={() => onRevealCode?.(r)}
                        disabled={busy}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> {r.codeMasked || 'Show'}
                      </Button>
                    )
                  ) : (
                    <span className="text-slate-500">none yet</span>
                  )}
                </td>
                <td className="py-2 whitespace-nowrap">
                  {status === DELIVERY.FAILED && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-sky-300 hover:text-white h-7 px-2"
                      onClick={() => onRetry?.(r)}
                      disabled={busy}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
                    </Button>
                  )}
                  {status === DELIVERY.NEEDS_REVIEW && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-emerald-300 hover:text-white h-7 px-2"
                      onClick={() => onConfirm?.(r)}
                      disabled={busy}
                      title="Only after you have checked the records yourself"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Confirm
                    </Button>
                  )}
                  {status === DELIVERY.DELIVERED && (
                    <span className="text-xs text-slate-500">{deliveryLabel(r).text}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-slate-500 mt-2">
        “Retry” only appears when nothing was applied. Anything that might already have landed is marked
        “Needs review” and needs a human check — the app will not retry or reroll it, because that could hand out
        the same prize twice.
      </p>
    </div>
  );
}