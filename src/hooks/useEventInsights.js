import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { safeRead } from '@/lib/dataCache';

const SESSION_LIMIT = 1000;
const LIST_LIMIT = 500;

/**
 * Lazy loader for Event Insights data. Only fetches when `enabled` (the
 * permitted analytics view is open), caches through the shared safeRead layer,
 * deduplicates in-flight reads, and ignores obsolete results after a refresh.
 *
 * Loads raw, range-independent datasets once; date-range and event filtering
 * happen in the component so changing filters never re-hits the network.
 */
export default function useEventInsights({ enabled }) {
  const [data, setData] = useState({
    sessions: [], participations: [], claims: [], globalEvents: [], adminEvents: [], actions: [],
  });
  const [status, setStatus] = useState({ loading: false, error: null, partial: false, lastUpdated: null });
  const tokenRef = useRef(0);

  const load = useCallback(async ({ force = false } = {}) => {
    if (!enabled) return;
    const token = ++tokenRef.current;
    setStatus((s) => ({ ...s, loading: true, error: null }));
    const ttl = force ? 0 : 60_000;

    try {
      const [sessions, participations, claims, globalEvents, adminEvents, actions] = await Promise.all([
        safeRead('analytics:sessions', () => base44.entities.UserSession.list('-sessionStart', SESSION_LIMIT), { ttl }),
        safeRead('analytics:participation', () => base44.entities.EventParticipation.list('-eventStartTime', LIST_LIMIT), { ttl }),
        safeRead('analytics:claims', () => base44.entities.GlobalEventClaim.list('-created_date', LIST_LIMIT), { ttl }),
        safeRead('analytics:globalEvents', () => base44.entities.GlobalEvent.list('-created_date'), { ttl }),
        safeRead('analytics:adminEvents', () => base44.entities.AdminEvent.list('-created_date'), { ttl }),
        safeRead('analytics:actions', () => base44.entities.AnalyticsAction.list('-created_date', LIST_LIMIT), { ttl }),
      ]);

      if (token !== tokenRef.current) return; // obsolete response — ignore
      setData({
        sessions: sessions || [],
        participations: participations || [],
        claims: claims || [],
        globalEvents: globalEvents || [],
        adminEvents: adminEvents || [],
        actions: actions || [],
      });
      setStatus({
        loading: false,
        error: null,
        partial: (sessions?.length || 0) >= SESSION_LIMIT || (participations?.length || 0) >= LIST_LIMIT,
        lastUpdated: new Date(),
      });
    } catch (e) {
      if (token !== tokenRef.current) return;
      console.error('Event Insights load failed:', e);
      setStatus((s) => ({ ...s, loading: false, error: 'Failed to load event data.' }));
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) load({ force: true });
  }, [enabled, load]);

  return { ...data, ...status, refresh: () => load({ force: true }) };
}