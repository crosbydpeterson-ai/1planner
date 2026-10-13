import { base44 } from '@/api/base44Client';

/**
 * Fetches a UserProfile by id with retry to ride out transient rate-limits.
 * Returns the profiles array (same shape as UserProfile.filter).
 * Throws only after all retries are exhausted.
 */
export async function fetchProfileWithRetry(profileId, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await base44.entities.UserProfile.filter({ id: profileId });
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
}

/**
 * Retry wrapper for any async operation. Useful for batched API calls
 * that may hit transient rate-limits.
 */
export async function withRetry(fn, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
}