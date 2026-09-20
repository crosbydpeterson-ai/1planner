import { useState, useEffect, useCallback } from 'react';
import { loadAndSeedTeachers, groupTeachers } from '@/lib/teachers';

/**
 * Hook that loads (and auto-seeds) the live teacher list.
 * Returns { teachers, loading, reload } where teachers = { all, math, reading }.
 */
export function useTeachers() {
  const [teachers, setTeachers] = useState({ all: [], math: [], reading: [] });
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const all = await loadAndSeedTeachers();
        if (active) setTeachers(groupTeachers(all));
      } catch (e) {
        console.error('Failed to load teachers', e);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return { teachers, loading, reload };
}