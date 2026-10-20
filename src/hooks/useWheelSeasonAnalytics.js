import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { safeRead } from '@/lib/dataCache';

/**
 * Lazily loads the wheel-library presets and recorded wheel/quest actions for
 * the analytics dashboard's Wheel & Season section. Only runs when mounted.
 */
export default function useWheelSeasonAnalytics({ enabled = true } = {}) {
  const [data, setData] = useState({ presets: [], actions: [] });
  const [status, setStatus] = useState({ loading: false, error: null, lastUpdated: null });
  const tokenRef = useRef(0);

  const load = useCallback(async ({ force = false } = {}) => {
    if (!enabled) return;
    const token = ++tokenRef.current;
    setStatus((s) => ({ ...s, loading: true, error: null }));
    const ttl = force ? 0 : 60_000;
    try {
      const [presets, actions] = await Promise.all([
        safeRead('analytics:wheelPresets', () => base44.entities.SpinWheelPreset.list('-created_date'), { ttl }),
        safeRead('analytics:actions', () => base44.entities.AnalyticsAction.list('-created_date', 500), { ttl }),
      ]);
      if (token !== tokenRef.current) return;
      setData({ presets: presets || [], actions: actions || [] });
      setStatus({ loading: false, error: null, lastUpdated: new Date() });
    } catch (e) {
      if (token !== tokenRef.current) return;
      console.error('Wheel/season analytics load failed:', e);
      setStatus((s) => ({ ...s, loading: false, error: 'Failed to load wheel data.' }));
    }
  }, [enabled]);

  useEffect(() => { if (enabled) load({ force: true }); }, [enabled, load]);

  return { ...data, ...status, refresh: () => load({ force: true }) };
}