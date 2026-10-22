import { useEffect, useState } from 'react';

/**
 * A local, ticking countdown to an instant.
 *
 * Ticking happens entirely in the browser: one timer per mounted countdown and
 * no network calls, so a dashboard countdown never adds load. The timer stops
 * on its own once the target passes.
 */
export function useCountdown(target) {
  const targetMs = target ? new Date(target).getTime() : null;
  const valid = targetMs !== null && !isNaN(targetMs);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!valid) return undefined;
    if (targetMs <= Date.now()) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [valid, targetMs]);

  const remainingMs = valid ? Math.max(0, targetMs - now) : null;

  return {
    remainingMs,
    ended: valid ? remainingMs <= 0 : false,
    label: valid ? formatRemaining(remainingMs) : '',
  };
}

/** "2d 4h", "3h 12m", "8m 40s" — compact and readable at a glance. */
export function formatRemaining(ms) {
  if (ms === null || ms === undefined || isNaN(ms)) return '';
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default useCountdown;