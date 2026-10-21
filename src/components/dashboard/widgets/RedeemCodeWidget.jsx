import React from 'react';
import { Ticket, X } from 'lucide-react';

/**
 * Compact, dismissible reward-card prompt for the signed-in dashboard.
 * It is a plain in-flow card, so it never covers assignments or navigation.
 */
export default function RedeemCodeWidget({ onOpen, onDismiss }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-amber-50 shadow-sm p-4">
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss reward code widget"
        className="absolute right-1.5 top-1.5 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-600">

        <X className="w-4 h-4" />
      </button>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pr-6 sm:pr-7">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-amber-400 text-white shadow-sm">
          <Ticket className="w-5 h-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-800">Got a reward card?</h3>
          <p className="text-xs text-slate-500">Enter your code to reveal your reward.</p>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="w-full shrink-0 rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 sm:w-auto">

          Redeem code
        </button>
      </div>
    </div>);

}