import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Calendar, ChevronRight, Clock } from 'lucide-react';
import { loadRelevantEvents } from '@/lib/dashboardData';
import { useCountdown } from '@/hooks/useCountdown';
import { formatCentralDateTime } from '@/lib/centralTime';
import WidgetShell from './WidgetShell';

// Event icons follow the shapes used in the event manager.
const EVENT_EMOJI = {
  bubble_pop: '🫧',
  balloon_pop: '🎈',
  fusion_lab: '🧪',
  pet_food: '🍽️',
  xp_boost: '⚡',
  mystery_box: '🎁',
  confetti: '🎊',
  pinata: '🪅',
  chaos_night: '🌪️',
};

const EVENT_KIND = {
  bubble_pop: 'Pop event',
  balloon_pop: 'Pop event',
  fusion_lab: 'Fusion Lab',
  pet_food: 'Kitchen event',
  xp_boost: 'XP boost',
  mystery_box: 'Mystery box',
  confetti: 'Celebration',
  pinata: 'Piñata',
  chaos_night: 'Chaos night',
};

/**
 * Only events a student may see: switched-on ones (a draft has isActive false,
 * so it never reaches here), minus anything already finished. Live events come
 * first, then the soonest upcoming ones.
 */
function buildRelevant(events) {
  const now = Date.now();
  const all = [];

  (events?.globalEvents || []).forEach((g) => {
    all.push({
      key: `g:${g.id}`,
      name: g.name,
      emoji: '🌍',
      kind: 'Community event',
      description: g.description || '',
      startTime: g.startDate || null,
      endTime: g.endDate || null,
    });
  });

  (events?.adminEvents || []).forEach((e) => {
    all.push({
      key: `a:${e.id}`,
      name: e.name,
      emoji: EVENT_EMOJI[e.type] || '🎉',
      kind: EVENT_KIND[e.type] || 'School event',
      description: '',
      startTime: e.startTime || null,
      endTime: e.endTime || null,
    });
  });

  const notFinished = all.filter((e) => !e.endTime || new Date(e.endTime).getTime() > now);
  const live = notFinished
    .filter((e) => !e.startTime || new Date(e.startTime).getTime() <= now)
    .sort((a, b) => {
      const aEnd = a.endTime ? new Date(a.endTime).getTime() : Infinity;
      const bEnd = b.endTime ? new Date(b.endTime).getTime() : Infinity;
      return aEnd - bEnd;
    });
  const upcoming = notFinished
    .filter((e) => e.startTime && new Date(e.startTime).getTime() > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return [...live, ...upcoming];
}

/** Ticket-shaped event card: name, dates and a local countdown. */
export default function EventTicketWidget() {
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setEvents(await loadRelevantEvents());
    } catch (e) {
      console.error('Event ticket load failed:', e);
      setError("Couldn't load events.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const relevant = useMemo(() => buildRelevant(events), [events]);
  const selected = relevant.find((e) => e.key === selectedKey) || relevant[0] || null;

  // The countdown target: the start while it is still upcoming, otherwise the end.
  const countdownTarget = selected
    ? selected.startTime && new Date(selected.startTime).getTime() > Date.now()
      ? selected.startTime
      : selected.endTime
    : null;
  const countdown = useCountdown(countdownTarget);
  const startsLater = !!selected?.startTime && new Date(selected.startTime).getTime() > Date.now();

  return (
    <WidgetShell
      icon={Ticket}
      title="Event Ticket"
      loading={loading}
      error={error}
      onRetry={load}
      empty={!loading && !error && relevant.length === 0 ? 'No events right now' : null}
      emptyHint={!loading && !error && relevant.length === 0 ? 'Check back when the next one starts.' : null}
      action={
        <Link
          to="/Events"
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
        >
          Open Events <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      }
    >
      {selected ? (
        <>
          <div className="relative rounded-xl overflow-hidden border border-amber-200/70 bg-gradient-to-br from-amber-100/80 to-white/50">
            <div className="flex items-center gap-3 p-3">
              <span className="text-3xl leading-none shrink-0" aria-hidden="true">{selected.emoji}</span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{selected.name}</p>
                <p className="text-[11px] text-slate-500">{selected.kind}</p>
              </div>
            </div>

            {/* Ticket perforation */}
            <div className="relative border-t border-dashed border-amber-300/80">
              <span className="absolute -left-2 -top-2 w-4 h-4 rounded-full bg-white/70" aria-hidden="true" />
              <span className="absolute -right-2 -top-2 w-4 h-4 rounded-full bg-white/70" aria-hidden="true" />
              <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-600 min-w-0">
                  {startsLater ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
                      Starts {formatCentralDateTime(selected.startTime)}
                    </span>
                  ) : selected.endTime ? (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
                      Ends {formatCentralDateTime(selected.endTime)}
                    </span>
                  ) : (
                    <span>Live now</span>
                  )}
                </div>
                <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-white/80 border border-amber-200 rounded-full px-2 py-0.5">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  {countdownTarget
                    ? `${startsLater ? 'Starts in' : 'Ends in'} ${countdown.label || '0s'}`
                    : 'Live now'}
                </span>
              </div>
            </div>
          </div>

          {selected.description ? (
            <p className="text-xs text-slate-600 mt-2">{selected.description}</p>
          ) : null}

          {relevant.length > 1 ? (
            <div className="mt-3 pt-3 border-t border-white/20">
              <p className="text-[11px] text-slate-400 mb-1.5">More events</p>
              <div className="space-y-1">
                {relevant.slice(1, 4).map((e) => (
                  <button
                    key={e.key}
                    type="button"
                    onClick={() => setSelectedKey(e.key)}
                    className="w-full flex items-center gap-2 rounded-lg bg-white/40 hover:bg-white/60 border border-white/40 px-2 py-1.5 text-left"
                  >
                    <span className="text-base" aria-hidden="true">{e.emoji}</span>
                    <span className="text-xs font-medium text-slate-700 truncate flex-1">{e.name}</span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {e.startTime && new Date(e.startTime).getTime() > Date.now()
                        ? formatCentralDateTime(e.startTime)
                        : 'Live'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </WidgetShell>
  );
}