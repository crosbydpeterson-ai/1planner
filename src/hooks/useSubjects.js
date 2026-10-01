import { useState, useEffect, useCallback } from 'react';
import { getAllSubjects, invalidateSubjects } from '@/lib/subjects';

/**
 * Hook that loads all subjects (built-in + custom).
 * Returns { subjects, loading, reload }.
 */
export function useSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => { invalidateSubjects(); setReloadKey((k) => k + 1); }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const all = await getAllSubjects();
        if (active) setSubjects(all);
      } catch (e) {
        console.error('Failed to load subjects', e);
      }
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [reloadKey]);

  return { subjects, loading, reload };
}