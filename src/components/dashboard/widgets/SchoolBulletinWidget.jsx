import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, ChevronRight, ChevronDown } from 'lucide-react';
import { loadAnnouncements } from '@/lib/dashboardData';
import { PREF_KEYS, readWidgetPref, writeWidgetPref } from '@/lib/widgetPrefs';
import { formatCentralDateTime } from '@/lib/centralTime';
import WidgetShell from './WidgetShell';

/**
 * School bulletin — published announcements for students.
 *
 * Uses the existing Announcement records and their publishing controls:
 * only active ones, only those scheduled to be visible now, and only the ones
 * published to student surfaces (a popup-only announcement stays a popup).
 * Read state is remembered per account, so two students on one browser don't
 * hide each other's unread badges.
 */
export default function SchoolBulletinWidget({ profileId }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readIds, setReadIds] = useState(() => readWidgetPref(profileId, PREF_KEYS.bulletinRead, []));
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const records = await loadAnnouncements();
      const now = Date.now();
      setAnnouncements(
        records.filter((a) => {
          if (a.visibility === 'popup') return false;
          if (a.scheduledAt && new Date(a.scheduledAt).getTime() > now) return false;
          return true;
        })
      );
    } catch (e) {
      console.error('Bulletin load failed:', e);
      setError("Couldn't load announcements.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Re-read per-account state when the dashboard switches profiles.
    setReadIds(readWidgetPref(profileId, PREF_KEYS.bulletinRead, []));
    setOpenId(null);
    load();
  }, [profileId, load]);

  const markRead = (id) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      writeWidgetPref(profileId, PREF_KEYS.bulletinRead, next);
      return next;
    });
  };

  const handleToggle = (announcement) => {
    const nextOpen = openId === announcement.id ? null : announcement.id;
    setOpenId(nextOpen);
    if (nextOpen) markRead(announcement.id);
  };

  const unreadCount = announcements.filter((a) => !readIds.includes(a.id)).length;

  return (
    <WidgetShell
      icon={Megaphone}
      title="School Bulletin"
      loading={loading}
      error={error}
      onRetry={load}
      action={
        <Link
          to="/Info"
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
        >
          View all <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      }
      empty={announcements.length === 0 ? 'No announcements yet' : null}
      emptyHint={announcements.length === 0 ? 'School updates will appear here.' : null}
    >
      {unreadCount > 0 ? (
        <p className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/80 border border-indigo-200/70 rounded-full px-2 py-0.5 inline-block mb-2">
          {unreadCount} new
        </p>
      ) : null}

      <ul className="space-y-2">
        {announcements.slice(0, 3).map((a) => {
          const isUnread = !readIds.includes(a.id);
          const isOpen = openId === a.id;
          return (
            <li key={a.id} className="rounded-xl bg-white/40 border border-white/40 overflow-hidden">
              <button
                type="button"
                onClick={() => handleToggle(a)}
                aria-expanded={isOpen}
                className="w-full flex items-start gap-2.5 p-3 text-left hover:bg-white/40 transition-colors"
              >
                <span className="text-xl leading-none mt-0.5 shrink-0" aria-hidden="true">
                  {a.emoji || '🆕'}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-slate-800 text-sm">{a.title}</span>
                    {isUnread ? (
                      <span className="text-[10px] font-bold uppercase tracking-wide text-white bg-indigo-500 rounded-full px-1.5 py-0.5">
                        New
                      </span>
                    ) : null}
                  </span>
                  {isOpen ? (
                    <span className="block text-xs text-slate-600 mt-1.5 whitespace-pre-wrap">{a.content}</span>
                  ) : (
                    <span className="block text-xs text-slate-500 mt-0.5 truncate">{a.content}</span>
                  )}
                  <span className="block text-[11px] text-slate-400 mt-1">
                    {formatCentralDateTime(a.created_date)}
                  </span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>

      {announcements.length > 3 ? (
        <p className="text-[11px] text-slate-400 mt-2 text-center">
          {announcements.length - 3} more on the Info page
        </p>
      ) : null}
    </WidgetShell>
  );
}