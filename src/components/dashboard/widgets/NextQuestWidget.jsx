import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Calendar, Zap, ChevronRight, RefreshCw } from 'lucide-react';
import { getChicagoDateKey } from '@/lib/dailyRewardUtils';
import { formatDayShort } from '@/lib/centralTime';
import WidgetShell from './WidgetShell';

/**
 * "What should I do first?" — one quest to do next.
 *
 * Ordering is overdue first (most overdue at the top), then the nearest due
 * date, then quests with no due date. Completed quests are excluded, and the
 * list handed in is already filtered to the classes this student is in (the
 * dashboard's existing visibility rule), so nothing from another class or a
 * hidden/unapproved quest can appear. "Pick another" simply walks that same
 * in-memory list — it never refetches.
 */
function orderEligible(assignments, completedIds, todayKey) {
  const pending = (assignments || []).filter((a) => !(completedIds || []).includes(a.id));
  const overdue = [];
  const upcoming = [];
  const undated = [];

  pending.forEach((a) => {
    if (!a.dueDate) {
      undated.push(a);
      return;
    }
    // dueDate is a date-only string, so a string compare is the calendar compare.
    if (a.dueDate < todayKey) overdue.push(a);
    else upcoming.push(a);
  });

  overdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return [...overdue, ...upcoming, ...undated];
}

const subjectLabel = (subject) =>
  !subject || subject === 'everyone'
    ? 'All students'
    : subject.charAt(0).toUpperCase() + subject.slice(1);

export default function NextQuestWidget({ assignments, completedIds, loadFailed = false }) {
  const [offset, setOffset] = useState(0);

  const todayKey = getChicagoDateKey();
  const eligible = useMemo(
    () => orderEligible(assignments, completedIds, todayKey),
    [assignments, completedIds, todayKey]
  );

  if (loadFailed) {
    return (
      <WidgetShell
        icon={ListChecks}
        title="What Should I Do First?"
        error="Couldn't load your quests."
      />
    );
  }

  if (eligible.length === 0) {
    return (
      <WidgetShell
        icon={ListChecks}
        title="What Should I Do First?"
        empty="You're all caught up! 🎉"
        emptyHint="No unfinished quests right now."
        emptyAction={
          <Link
            to="/Assignments"
            className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            View quests <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        }
      />
    );
  }

  const index = offset % eligible.length;
  const quest = eligible[index];
  const isOverdue = !!quest.dueDate && quest.dueDate < todayKey;

  return (
    <WidgetShell
      icon={ListChecks}
      title="Do this first"
      action={
        <Link
          to="/Assignments"
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
        >
          All quests <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      }
    >
      <div className={`rounded-xl border p-3 ${isOverdue ? 'bg-rose-50/70 border-rose-200/70' : 'bg-white/40 border-white/40'}`}>
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-800 leading-snug">{quest.title}</p>
          {quest.xpReward ? (
            <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100/80 border border-amber-200/70 rounded-full px-2 py-0.5">
              <Zap className="w-3 h-3" aria-hidden="true" /> {quest.xpReward} XP
            </span>
          ) : null}
        </div>

        {quest.description ? (
          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{quest.description}</p>
        ) : null}

        <div className="flex items-center flex-wrap gap-2 mt-2.5">
          <span className="text-[11px] font-medium text-slate-600 bg-white/60 rounded-full px-2 py-0.5">
            {subjectLabel(quest.subject)}
          </span>
          {quest.dueDate ? (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 ${
                isOverdue ? 'text-rose-700 bg-rose-100/80' : 'text-slate-600 bg-white/60'
              }`}
            >
              <Calendar className="w-3 h-3" aria-hidden="true" />
              {isOverdue ? 'Overdue · was due ' : 'Due '}
              {formatDayShort(quest.dueDate)}
            </span>
          ) : (
            <span className="text-[11px] text-slate-500">No due date</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Link
          to="/Assignments"
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2"
        >
          Open assignment
        </Link>
        {eligible.length > 1 ? (
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-white/80 text-indigo-700 hover:bg-indigo-50 text-sm font-medium px-3 py-2"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" /> Pick another
          </button>
        ) : null}
      </div>

      {eligible.length > 1 ? (
        <p className="text-[11px] text-slate-400 mt-2 text-center">
          {eligible.length} unfinished quests · showing {index + 1}
        </p>
      ) : null}
    </WidgetShell>
  );
}