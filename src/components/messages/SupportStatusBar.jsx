import React from 'react';
import { Clock, CheckCircle2, MessageSquareReply, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPPORT_REPLIED, SUPPORT_RESOLVED, supportStatusLabel, supportStatusOf } from '@/lib/byteSupport';

const CHIP = {
  waiting: 'bg-amber-500/20 text-amber-800 border-amber-500/40',
  replied: 'bg-blue-500/20 text-blue-800 border-blue-500/40',
  resolved: 'bg-emerald-500/20 text-emerald-800 border-emerald-500/40',
};

const NOTE = {
  waiting: 'An admin will reply in this conversation. Replies can take time, so there is no need to send it again.',
  replied: "An admin replied above. Keep messaging here and they'll see it.",
  resolved: 'An admin marked this resolved. Reply or reopen it if you still need help.',
};

export default function SupportStatusBar({ thread, onReopen, busy, statusOverride }) {
  const status = statusOverride || supportStatusOf(thread);
  if (!status) return null;

  const Icon = status === SUPPORT_RESOLVED ? CheckCircle2 : status === SUPPORT_REPLIED ? MessageSquareReply : Clock;
  const who = thread.supportAssignedAdminUsername;

  return (
    <div className="px-3 pt-3">
      <div className={cn('backdrop-blur-xl border rounded-xl px-3 py-2', CHIP[status])}>
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 shrink-0" />
          <p className="text-xs font-semibold flex-1">
            {supportStatusLabel(status)}
            {status !== SUPPORT_RESOLVED && who ? ` · ${who}` : ''}
            {status === SUPPORT_RESOLVED && thread.supportResolvedByUsername ? ` by ${thread.supportResolvedByUsername}` : ''}
          </p>
          {status === SUPPORT_RESOLVED && (
            <button
              onClick={onReopen}
              disabled={busy}
              className="flex items-center gap-1 text-[11px] font-semibold bg-white/50 hover:bg-white/70 disabled:opacity-50 rounded-full px-2 py-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reopen
            </button>
          )}
        </div>
        <p className="text-[11px] mt-1 opacity-90">{NOTE[status]}</p>
      </div>
    </div>
  );
}