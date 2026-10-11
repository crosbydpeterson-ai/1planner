import { useEffect, useRef } from 'react';
import { getChicagoDateKey } from '@/lib/dailyRewardUtils';

/**
 * Calls `onRefresh` when the page becomes visible (returns to foreground)
 * or when the Chicago date key changes (midnight rollover).
 *
 * This prevents stale daily reward state when a tab is left open overnight.
 *
 * @param {function} onRefresh - Callback to invoke on refresh. Kept in a ref
 *   so it can change every render without re-subscribing listeners.
 */
export function useDailyRewardRefresh(onRefresh) {
  const callbackRef = useRef(onRefresh);
  callbackRef.current = onRefresh;

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        callbackRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    // Check once per minute whether the Chicago date key changed.
    let lastDateKey = getChicagoDateKey();
    const interval = setInterval(() => {
      const currentKey = getChicagoDateKey();
      if (currentKey !== lastDateKey) {
        lastDateKey = currentKey;
        callbackRef.current();
      }
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);
}