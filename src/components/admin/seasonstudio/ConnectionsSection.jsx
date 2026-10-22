import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Link2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { parseSeasonDate } from '@/lib/seasonUtils';

const renderWhen = (item) => {
  const start = parseSeasonDate(item.startDate);
  const end = parseSeasonDate(item.endDate || item.startDate);
  if (!start) return 'no dates set';
  return `${format(start, 'MMM d')}${end ? ` – ${format(end, 'MMM d, yyyy')}` : ''}`;
};

/**
 * Related events and wheels. Linking only records the relationship — it never
 * activates, dates or edits the event or wheel, which stay owned by their own
 * admin tools.
 */
export default function ConnectionsSection({ draft, onPatch, permissions = {}, claimedCount }) {
  const [events, setEvents] = useState([]);
  const [wheels, setWheels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [eventList, wheelList] = await Promise.all([
          base44.entities.AdminEvent.list('-created_date'),
          base44.entities.SpinWheelPreset.list('-created_date'),
        ]);
        if (!alive) return;
        setEvents(eventList || []);
        setWheels(wheelList || []);
      } catch (e) {
        console.error('Season Studio could not load connections', e);
      }
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggle = (field, id) => {
    const current = draft[field] || [];
    onPatch({ [field]: current.includes(id) ? current.filter((x) => x !== id) : [...current, id] });
  };

  const groups = [
    { field: 'linkedEventIds', items: events, allowed: !!permissions.manageEvents, title: 'Events', empty: 'No events exist yet.' },
    { field: 'linkedWheelIds', items: wheels, allowed: !!permissions.manageWheelLibrary, title: 'Spin wheels', empty: 'No wheels exist yet.', warning: 'Linking never activates a wheel — publish it in the wheel library when you want it live.' },
  ];

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading events and wheels…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.field} className="space-y-2">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-purple-300" />
            <h4 className="text-sm font-black uppercase tracking-wide text-white">{group.title}</h4>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {(draft[group.field] || []).length} linked
            </span>
          </div>
          {!group.allowed && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Your role can't change {group.title.toLowerCase()} links. Ask an admin with that permission.
            </p>
          )}
          {group.warning && <p className="text-[11px] text-slate-500">{group.warning}</p>}
          {group.items.length === 0 ? (
            <p className="text-xs text-slate-500">{group.empty}</p>
          ) : (
            <div className="space-y-1.5">
              {group.items.slice(0, 30).map((item) => {
                const linked = (draft[group.field] || []).includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!group.allowed}
                    onClick={() => toggle(group.field, item.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                      linked ? 'border-purple-500/50 bg-purple-500/10' : 'border-slate-700 bg-slate-800/60 hover:bg-slate-800'
                    } ${group.allowed ? '' : 'opacity-60'}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{item.name || item.title}</span>
                      <span className="block truncate text-[10px] uppercase tracking-wide text-slate-400">
                        {renderWhen(item)} · {item.status || (item.isActive === false ? 'inactive' : 'active')}
                      </span>
                    </span>
                    {linked && <Check className="h-4 w-4 shrink-0 text-purple-300" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {permissions.viewEventAnalytics ? (
        <p className="rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300">
          {claimedCount || 0} reward{claimedCount === 1 ? '' : 's'} claimed by students in this season so far.
        </p>
      ) : (
        <p className="text-[11px] text-slate-500">Claim analytics need the "view event analytics" permission.</p>
      )}
    </div>
  );
}