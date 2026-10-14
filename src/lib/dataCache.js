import { base44 } from '@/api/base44Client';

/**
 * Shared frontend data-access layer.
 *
 * Goals (per PRD "Core Rate-Limit Protections"):
 *  - Short-lived caching of safe reads (profile, app settings) keyed by
 *    quest_profile_id so repeated page loads reuse one result.
 *  - In-flight request deduplication: identical concurrent reads join the
 *    same promise instead of firing N calls.
 *  - Rate-limit-aware cooldown: when a safe read is rate-limited, set a
 *    shared cooldown and retry only the failed read with bounded backoff;
 *    successful parallel reads are left intact.
 *  - Mutations (purchases, reward claims, equips) are NEVER cached or
 *    auto-retried — they go through `mutate()` which throws to the caller.
 */

const DEFAULT_PROFILE_TTL = 15_000; // 15s
const DEFAULT_SETTINGS_TTL = 20_000; // 20s

// key -> { data, expiresAt }
const cache = new Map();
// key -> Promise (in-flight dedup)
const inflight = new Map();

// Global rate-limit cooldown timestamp. While set, safe reads wait briefly
// before attempting again so we don't pile on during a limit window.
let rateLimitedUntil = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Detect whether an error is a rate-limit response.
 * Honors Base44 SDK error shapes and standard HTTP 429 signals.
 */
export function isRateLimitError(err) {
  if (!err) return false;
  const status = err.status || err.statusCode || err.response?.status;
  if (status === 429) return true;
  const msg = (err.message || err.error || '').toString().toLowerCase();
  return msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('429');
}

/**
 * Extract a Retry-After hint (ms) from an error if the server provided one.
 */
function retryAfterMs(err) {
  const ra = err?.headers?.['retry-after'] || err?.retryAfter;
  if (!ra) return null;
  const n = parseFloat(ra);
  if (!isNaN(n)) return Math.min(n * 1000, 5000);
  return null;
}

/**
 * Wait out the current rate-limit cooldown if one is active.
 */
async function waitForCooldown() {
  const now = Date.now();
  if (rateLimitedUntil > now) {
    await sleep(rateLimitedUntil - now);
  }
}

/**
 * Bounded exponential backoff with jitter for rate-limited reads.
 */
function backoffDelay(attempt) {
  const base = Math.min(400 * Math.pow(2, attempt), 2000);
  const jitter = Math.random() * 200;
  return base + jitter;
}

/**
 * Run a safe read with rate-limit-aware retry. Only the failed call retries;
 * callers using Promise.all will still lose the batch, but the cooldown
 * prevents an immediate retry storm.
 */
async function runWithRetry(fn, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    await waitForCooldown();
    try {
      return await fn();
    } catch (err) {
      if (isRateLimitError(err)) {
        const wait = retryAfterMs(err) ?? backoffDelay(attempt);
        rateLimitedUntil = Math.max(rateLimitedUntil, Date.now() + wait);
        if (attempt === retries - 1) throw err;
        await sleep(wait);
        continue;
      }
      throw err; // non-rate-limit errors bubble immediately
    }
  }
}

/**
 * Cached, in-flight-deduplicated safe read.
 * @param {string} key - cache key (include profileId for profile-scoped data)
 * @param {() => Promise} fn - the read operation
 * @param {object} opts - { ttl } max age in ms
 */
export async function safeRead(key, fn, { ttl = 15_000 } = {}) {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }
  if (cached) cache.delete(key);

  const existing = inflight.get(key);
  if (existing) return existing;

  const p = (async () => {
    try {
      const data = await runWithRetry(fn);
      cache.set(key, { data, expiresAt: Date.now() + ttl });
      return data;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

/**
 * Cached UserProfile fetch keyed by profileId.
 */
export async function fetchProfile(profileId, { ttl = DEFAULT_PROFILE_TTL } = {}) {
  if (!profileId) return [];
  return safeRead(
    `profile:${profileId}`,
    () => base44.entities.UserProfile.filter({ id: profileId }),
    { ttl }
  );
}

/**
 * Cached AppSetting.list() shared across every page that needs locks/config.
 */
export async function getAppSettings({ ttl = DEFAULT_SETTINGS_TTL } = {}) {
  return safeRead('appSettings', () => base44.entities.AppSetting.list(), { ttl });
}

/**
 * Run a mutation (purchase, reward claim, equip, update). No caching, no
 * auto-retry — the caller handles errors via the existing UI.
 */
export async function mutate(fn) {
  return fn();
}

/**
 * Invalidate the cached profile for a given profileId (e.g. after an update).
 */
export function invalidateProfile(profileId) {
  if (!profileId) return;
  cache.delete(`profile:${profileId}`);
}

/**
 * Invalidate cached app settings (e.g. after an admin changes them).
 */
export function invalidateAppSettings() {
  cache.delete('appSettings');
}

/**
 * Clear all cached reads. Call on profile switch so the next page loads
 * fresh data for the new profile.
 */
export function onProfileSwitch() {
  cache.clear();
  inflight.clear();
  rateLimitedUntil = 0;
}