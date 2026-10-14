import { base44 } from '@/api/base44Client';
import { getAppSettings } from '@/lib/dataCache';

/**
 * Temporary logout-code restriction (BEST-EFFORT, CLIENT-SIDE ONLY).
 *
 * This is NOT secure authentication. It is a UI friction layer to discourage
 * casual account switching while a real server-side auth fix is pending.
 * On the current Free plan there are no backend functions, so all checks
 * and usage counters run in the browser. A determined user can bypass them.
 * See the implementation summary for the full list of limitations.
 */

const SETTINGS_KEY = 'logout_restriction_settings';
export const CHICAGO_TZ = 'America/Chicago';

/** Format an ISO timestamp in America/Chicago for admin displays. */
export function formatChicagoDate(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleString('en-US', {
      timeZone: CHICAGO_TZ,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return String(isoString);
  }
}

/** Convert a Date to a value suitable for <input type="datetime-local">. */
export function toDateTimeLocalValue(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const chicago = new Date(d.toLocaleString('en-US', { timeZone: CHICAGO_TZ }));
    const pad = (n) => String(n).padStart(2, '0');
    return `${chicago.getFullYear()}-${pad(chicago.getMonth() + 1)}-${pad(chicago.getDate())}T${pad(chicago.getHours())}:${pad(chicago.getMinutes())}`;
  } catch {
    return '';
  }
}

/** Convert a datetime-local value to an ISO string (interpreted as Chicago time). */
export function fromDateTimeLocalValue(value) {
  if (!value) return null;
  try {
    // value is "YYYY-MM-DDTHH:mm" in the user's local interpretation; store as ISO.
    const d = new Date(value);
    return d.toISOString();
  } catch {
    return null;
  }
}

function rankOf(profile) {
  if (!profile) return 'user';
  if (profile.rank === 'admin' || profile.rank === 'super_admin') return profile.rank;
  if (typeof profile.username === 'string' && profile.username.toLowerCase() === 'crosby') return 'super_admin';
  return 'user';
}

function studentClassKeys(profile) {
  const keys = [];
  if (profile.mathTeacher) keys.push(`math:${profile.mathTeacher}`);
  if (profile.readingTeacher) keys.push(`reading:${profile.readingTeacher}`);
  if (profile.subjectAssignments) {
    for (const [slug, tid] of Object.entries(profile.subjectAssignments)) {
      if (tid) keys.push(`${slug}:${tid}`);
    }
  }
  return keys;
}

/**
 * Determine whether the logout restriction currently applies to a profile.
 * Returns { restricted: true, settings } or { restricted: false, reason }.
 * Fails OPEN (does not block logout) if settings can't be loaded, so students
 * are never locked out of their own account by a network error.
 */
export async function isLogoutRestricted(profile) {
  if (!profile) return { restricted: false, reason: 'no_profile' };
  if (rankOf(profile) !== 'user') return { restricted: false, reason: 'admin_bypass' };

  let settings = null;
  try {
    const all = await getAppSettings();
    settings = all.find((s) => s.key === SETTINGS_KEY)?.value || null;
  } catch (e) {
    return { restricted: false, reason: 'settings_load_failed' };
  }

  if (!settings || !settings.enabled) return { restricted: false, reason: 'disabled' };
  if (settings.autoEndDate && new Date() > new Date(settings.autoEndDate)) {
    return { restricted: false, reason: 'auto_ended' };
  }
  const exempt = settings.exemptProfileIds || [];
  if (exempt.includes(profile.id)) return { restricted: false, reason: 'exempt' };

  const scope = settings.scope || 'all';
  if (scope === 'profiles') {
    if (!(settings.targetProfileIds || []).includes(profile.id)) {
      return { restricted: false, reason: 'out_of_scope' };
    }
  } else if (scope === 'classes') {
    const keys = studentClassKeys(profile);
    const allowed = settings.targetClassKeys || [];
    if (!allowed.some((k) => keys.includes(k))) {
      return { restricted: false, reason: 'out_of_scope' };
    }
  }
  return { restricted: true, settings };
}

/**
 * Validate AND consume a logout code in one step.
 * Returns { success: true, code } or { success: false, reason }.
 * Invalid attempts do NOT consume a use.
 */
export async function attemptLogoutWithCode(codeValue, profile) {
  if (!codeValue || !profile) return { success: false, reason: 'missing_input' };

  let codes;
  try {
    codes = await base44.entities.LogoutCode.filter({ code: codeValue.trim() });
  } catch (e) {
    return { success: false, reason: 'load_failed' };
  }
  const code = codes[0];
  if (!code) return { success: false, reason: 'invalid' };
  if (!code.isActive) return { success: false, reason: 'revoked' };

  const now = new Date();
  if (code.validFrom && now < new Date(code.validFrom)) return { success: false, reason: 'not_yet_valid' };
  if (code.expiresAt && now > new Date(code.expiresAt)) return { success: false, reason: 'expired' };
  if (code.maxUses && (code.useCount || 0) >= code.maxUses) return { success: false, reason: 'exhausted' };

  if (code.scope === 'profiles') {
    if (!(code.allowedProfileIds || []).includes(profile.id)) return { success: false, reason: 'unauthorized' };
  } else if (code.scope === 'classes') {
    const keys = studentClassKeys(profile);
    if (!(code.allowedClassKeys || []).some((k) => keys.includes(k))) {
      return { success: false, reason: 'unauthorized' };
    }
  }

  if (code.maxUsesPerProfile) {
    const myUses = (code.usageHistory || []).filter((u) => u.profileId === profile.id).length;
    if (myUses >= code.maxUsesPerProfile) return { success: false, reason: 'per_profile_exhausted' };
  }

  try {
    await base44.entities.LogoutCode.update(code.id, {
      useCount: (code.useCount || 0) + 1,
      usageHistory: [...(code.usageHistory || []), { profileId: profile.id, timestamp: now.toISOString() }],
    });
    return { success: true, code };
  } catch (e) {
    return { success: false, reason: 'consume_failed' };
  }
}

/** Generate a random 8-char code (no ambiguous characters). */
export function generateCodeValue(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export const REASON_LABELS = {
  missing_input: 'Please enter a code.',
  invalid: 'That code is not valid.',
  revoked: 'That code has been revoked.',
  not_yet_valid: 'That code is not active yet.',
  expired: 'That code has expired.',
  exhausted: 'That code has reached its maximum uses.',
  per_profile_exhausted: 'You have already used that code the maximum number of times.',
  unauthorized: 'That code is not authorized for your account.',
  load_failed: 'Could not verify the code right now. Your session is unchanged. Please try again or contact an admin.',
  consume_failed: 'Could not record the code use right now. Your session is unchanged. Please try again.',
};

/** Compute the current status of a code record for filtering/display. */
export function codeStatus(code) {
  if (!code.isActive) return 'revoked';
  const now = new Date();
  if (code.validFrom && now < new Date(code.validFrom)) return 'pending';
  if (code.expiresAt && now > new Date(code.expiresAt)) return 'expired';
  if (code.maxUses && (code.useCount || 0) >= code.maxUses) return 'exhausted';
  return 'active';
}