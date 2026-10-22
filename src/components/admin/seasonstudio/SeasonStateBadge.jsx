import React from 'react';
import { cn } from '@/lib/utils';
import { STATE_STYLES } from '@/lib/seasonStudio';

/** Draft / Scheduled / Live / Ended / Archived badge for a season. */
export default function SeasonStateBadge({ workflow, className }) {
  if (!workflow) return null;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide',
        STATE_STYLES[workflow.state] || STATE_STYLES.draft,
        className
      )}
    >
      {workflow.label}
    </span>
  );
}