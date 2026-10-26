import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import SupportRequestDetail from './SupportRequestDetail';
import { loadMessagesForThreads } from '@/lib/dmMessages';
import {
  SUPPORT_RESOLVED,
  loadSupportAdmins,
  loadSupportThreads,
  markSupportRead,
  supportStatusLabel,
  supportStatusOf,
} from '@/lib/byteSupport';

const FILTERS = [
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'all', label: 'All' },
];

/**
 * "Escalated from Byte" — the support inbox for the app's named support admins.
 *
 * Viewing a request is a plain read: no AI call is made here, and the shared
 * transcript was snapshotted at handoff time, so opening a ticket costs nothing.
 */
export default function SupportInbox({ currentProfile, supportAdminIds }) {
  const [threads, setThreads] = useState([]);
  const [records, setRecords] = useState({});
  const [supportAdmins, setSupportAdmins] = useState({ profileIds: [], usernames: {} });
  const [active, setActive] = useState(null);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refreshTimer = useRef(null);

  const loadThreads = async () => {
    const { threads: rows } = await loadSupportThreads();
    setThreads(rows);
    setActive((prev) => (prev ? rows.find((t) => t.id === prev.id) || prev : null));
  };

  useEffect(() => {
    (async () => {
      try {
        const admins = await loadSupportAdmins();
        setSupportAdmins({ profileIds: admins.profileIds, usernames: admins.usernames });
        await loadThreads();
      } catch (err) {
        console.error('Could not load support requests', err);
        setError('Could not load support requests. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
    const unsub = base44.entities.DMThread.subscribe(() => {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => {
        loadThreads().catch((err) => console.error('Support refresh failed', err));
      }, 800);
    });
    return () => { clearTimeout(refreshTimer.current); unsub?.(); };
  }, [currentProfile.id]);

  const open = async (thread) => {
    setError('');
    try {
      const { byThread } = await loadMessagesForThreads([thread.id]);
      setRecords((prev) => ({ ...prev, ...byThread }));
    } catch (err) {
      console.error('Could not load the conversation', err);
      setError('Could not load this conversation’s messages.');
    }
    // Only marked read because a person is opening it right now.
    try {
      const updated = await markSupportRead(thread);
      setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setActive(updated);
    } catch (err) {
      console.error('Could not mark the request read', err);
      setActive(thread);
    }
  };

  const applyUpdate = (updated) => {
    setThreads((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setActive(updated);
  };

  // A stored reply belongs in the open conversation straight away.
  const applyStoredMessage = (threadId, message) => {
    if (!message) return;
    setRecords((prev) => ({ ...prev, [threadId]: [...(prev[threadId] || []), message] }));
  };

  if (!supportAdminIds.includes(String(currentProfile.id))) {
    return <p className="max-w-md mx-auto text-sm text-slate-500 py-10 text-center">Support requests are limited to the app’s support admins.</p>;
  }

  if (active) {
    return (
      <SupportRequestDetail
        thread={active}
        records={records[active.id] || []}
        currentProfile={currentProfile}
        supportAdmins={supportAdmins}
        onThreadUpdate={applyUpdate}
        onMessageSaved={applyStoredMessage}
        onBack={() => setActive(null)}
      />
    );
  }

  const visible = threads.filter((t) => {
    const status = supportStatusOf(t);
    if (filter === 'open') return status !== SUPPORT_RESOLVED;
    if (filter === 'resolved') return status === SUPPORT_RESOLVED;
    return true;
  });
  const openCount = threads.filter((t) => supportStatusOf(t) !== SUPPORT_RESOLVED).length;
  const unreadCount = threads.filter((t) => t.hasUnreadAdmin && supportStatusOf(t) !== SUPPORT_RESOLVED).length;

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-1 px-1 flex items-center gap-2">
        Escalated from Byte
        {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
      </h2>
      <p className="text-[11px] text-slate-500 mb-3 px-1">
        Requests students sent from their Byte conversation. Replies go straight back into that same chat.
      </p>

      <div className="flex gap-2 mb-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-xl border transition-colors',
              filter === f.key ? 'bg-blue-500/80 text-white border-white/30' : 'bg-white/20 text-slate-600 border-white/30 hover:bg-white/30'
            )}
          >
            {f.label}
            {f.key === 'open' && openCount > 0 ? ` (${openCount})` : ''}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-2 text-xs text-red-600 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl px-3 py-2 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}

      <div className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl overflow-hidden">
        {loading && (
          <p className="text-center text-slate-500 text-sm py-10 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading requests…
          </p>
        )}
        {!loading && visible.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-10">
            {filter === 'resolved' ? 'Nothing resolved yet' : 'No requests to show'}
          </p>
        )}
        {visible.map((thread, i) => {
          const unread = thread.hasUnreadAdmin && supportStatusOf(thread) !== SUPPORT_RESOLVED;
          return (
            <button
              key={thread.id}
              onClick={() => open(thread)}
              className={cn('w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/25', i > 0 && 'border-t border-white/20')}
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm border border-white/30 flex items-center justify-center text-slate-700 font-bold">
                  {thread.studentUsername?.[0]?.toUpperCase() || '?'}
                </div>
                {unread && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white/70" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn('text-sm truncate', unread ? 'font-bold text-slate-900' : 'font-medium text-slate-700')}>
                    {thread.studentUsername}
                  </p>
                  <p className="text-[10px] text-slate-500 shrink-0">
                    {thread.supportRequestedAt ? new Date(thread.supportRequestedAt).toLocaleDateString() : ''}
                  </p>
                </div>
                <p className="text-xs text-slate-500 truncate">{thread.escalationSummary || 'No summary'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full border',
                      supportStatusOf(thread) === SUPPORT_RESOLVED
                        ? 'bg-emerald-500/20 text-emerald-800 border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-800 border-amber-500/40'
                    )}
                  >
                    {supportStatusLabel(supportStatusOf(thread))}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Bot className="w-3 h-3" />
                    {thread.supportAssignedAdminUsername ? `Assigned: ${thread.supportAssignedAdminUsername}` : 'Unassigned'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}