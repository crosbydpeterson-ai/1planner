/**
 * Per-account preferences for the optional Home widgets (note, reward goal,
 * wishlist, bulletin read-state).
 *
 * Every key is namespaced with the profile id, so two students sharing one
 * browser never see each other's note, goal, wishlist or read announcements.
 * This module is deliberately separate from credentials/session keys
 * (pin_*, quest_profile_id, quest_admin_auth) and never touches them.
 *
 * Nothing here throws: if a browser blocks storage, the widget still works for
 * the session and the caller can tell the student why it did not save.
 */
const PREFIX = 'quest_widget_prefs:';

export const STORAGE_BLOCKED_MESSAGE =
  "This browser is blocking saved data, so this widget can't remember anything here.";

// Preference slots, so callers never invent overlapping keys.
export const PREF_KEYS = {
  note: 'stickyNote',
  rewardGoal: 'rewardGoal',
  wishlist: 'wishlist',
  bulletinRead: 'bulletinRead',
};

const keyFor = (profileId, key) => `${PREFIX}${profileId}:${key}`;

function storage() {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Read one preference for this account, or `fallback` when absent/unreadable. */
export function readWidgetPref(profileId, key, fallback = null) {
  if (!profileId || !key) return fallback;
  const store = storage();
  if (!store) return fallback;
  try {
    const raw = store.getItem(keyFor(profileId, key));
    if (raw === null || raw === undefined) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Save one preference for this account.
 * @returns {{ ok: boolean, error?: string }} — never throws.
 */
export function writeWidgetPref(profileId, key, value) {
  if (!profileId || !key) return { ok: false, error: 'no_profile' };
  const store = storage();
  if (!store) return { ok: false, error: 'unavailable' };
  try {
    store.setItem(keyFor(profileId, key), JSON.stringify(value));
    return { ok: true };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}

/** Forget one preference for this account. */
export function clearWidgetPref(profileId, key) {
  if (!profileId || !key) return { ok: false, error: 'no_profile' };
  const store = storage();
  if (!store) return { ok: false, error: 'unavailable' };
  try {
    store.removeItem(keyFor(profileId, key));
    return { ok: true };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}