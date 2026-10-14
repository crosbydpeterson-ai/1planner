import { base44 } from '@/api/base44Client';
import {
  fetchProfile as cachedProfile,
  safeRead,
  isRateLimitError,
  onProfileSwitch,
  invalidateProfile,
  invalidateAppSettings,
  mutate,
} from '@/lib/dataCache';

/**
 * Fetches a UserProfile by id with short-lived caching + in-flight dedup
 * + rate-limit-aware retry. Returns the profiles array (same shape as
 * UserProfile.filter). Throws only after retries are exhausted.
 *
 * Drop-in replacement for the old retry-only helper; all existing call
 * sites now share one cached result per profileId.
 */
export async function fetchProfileWithRetry(profileId, retries = 3) {
  return cachedProfile(profileId, { ttl: 15_000 });
}

/**
 * Rate-limit-aware retry wrapper for a batch of reads. Keeps the same
 * signature as before so callers don't change, but now honors a shared
 * cooldown and bounded backoff instead of fast fixed waits.
 *
 * Note: if the batch is a Promise.all and one call rate-limits, the whole
 * batch rejects and retries. For shared single-call reads (profile,
 * settings) prefer `fetchProfile` / `getAppSettings` which also cache.
 */
export async function withRetry(fn, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (isRateLimitError(err)) {
        const wait = Math.min(400 * Math.pow(2, attempt), 2000) + Math.random() * 200;
        if (attempt === retries - 1) throw err;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
}

export { onProfileSwitch, invalidateProfile, invalidateAppSettings, mutate, safeRead };
export { getAppSettings } from '@/lib/dataCache';