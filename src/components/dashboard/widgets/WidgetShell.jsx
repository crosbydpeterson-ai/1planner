import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * The shared 1planner widget shell used by the optional Home widgets.
 *
 * It reproduces the existing dashboard widget treatment exactly (glass card,
 * rounded corners, soft border and shadow) and owns the three inline states
 * every widget needs: loading, error (with retry) and empty. Keeping one shell
 * means a widget can never blank the whole dashboard — a failure stays inside
 * its own card.
 */
export default function WidgetShell({
  icon: Icon,
  title,
  action = null,
  loading = false,
  error = null,
  onRetry = null,
  empty = null,
  emptyHint = null,
  emptyAction = null,
  children,
  className = '',
  ...props
}) {
  return (
    <motion.div
      {...props}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl p-4 overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {Icon ? <Icon className="w-5 h-5 text-indigo-600 shrink-0" aria-hidden="true" /> : null}
            <h3 className="font-semibold text-slate-800 truncate">{title}</h3>
          </div>
          {action}
        </div>

        {loading ? (
          <div className="py-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        ) : error ? (
          <div className="py-4 text-center">
            <p className="text-sm text-slate-600 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
              {error}
            </p>
            {onRetry ? (
              <Button variant="outline" size="sm" className="mt-2 h-8 rounded-xl" onClick={onRetry}>
                Try again
              </Button>
            ) : null}
          </div>
        ) : empty ? (
          <div className="py-4 text-center text-slate-400 text-sm">
            <p>{empty}</p>
            {emptyHint ? <p className="text-xs mt-1">{emptyHint}</p> : null}
            {emptyAction ? <div className="mt-3 flex justify-center">{emptyAction}</div> : null}
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
}