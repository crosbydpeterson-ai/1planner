import { getSeasonStatus, nowInTimezone, parseSeasonDate, selectOnePassSeason } from '@/lib/seasonUtils';

/**
 * 1Pass Plus access.
 *
 * A grant is either permanent (no expiry) or lasts a number of seasons, chosen
 * by the admin who gifts it. Everything that unlocks Plus content reads
 * `isPlusActive` rather than the raw `has1PassPlus` flag, so a lapsed grant
 * actually stops granting access.
 */
export function isPlusActive(profile, now = new Date()) {
  if (!profile?.has1PassPlus) return false;
  if (!profile.plusExpiresAt) return true; // permanent grant
  const expiry = new Date(profile.plusExpiresAt);
  if (isNaN(expiry.getTime())) return true;
  return expiry > now;
}

/** Super admin = rank super_admin, or the owner account named Crosby. */
export function isSuperAdminProfile(profile) {
  if (!profile) return false;
  const nameIsCrosby =
    typeof profile.username === 'string' && profile.username.toLowerCase() === 'crosby';
  return profile.rank === 'super_admin' || nameIsCrosby;
}

function orderedSeasons(seasons) {
  return (seasons || [])
    .filter((s) => s.startDate && s.endDate)
    .slice()
    .sort((a, b) => parseSeasonDate(a.startDate) - parseSeasonDate(b.startDate));
}

/**
 * The season a length is counted from: the season 1Pass is showing (the same
 * one Season.jsx picks among active seasons), else the calendar-current one,
 * else the next upcoming one, else the earliest season defined.
 */
export function plusAnchorSeason(seasons) {
  const ordered = orderedSeasons(seasons);
  if (ordered.length === 0) return null;
  const now = nowInTimezone();
  const shown = selectOnePassSeason(ordered.filter((s) => s.isActive), now);
  if (shown) return shown;
  return (
    ordered.find((s) => getSeasonStatus(s, now) === 'current') ||
    ordered.find((s) => getSeasonStatus(s, now) === 'upcoming') ||
    ordered[0]
  );
}

/**
 * Turn a season count into the moment a timed grant lapses: "1 season" runs
 * through the end of the season 1Pass is showing, "2 seasons" through the end
 * of the following one, and so on, never past the last season defined.
 *
 * Returns null for a permanent grant (count 0) and for a length that cannot be
 * measured — callers must refuse to grant a timed pass in that case rather than
 * let it silently become permanent.
 */
export function plusExpiryForSeasons(seasons, seasonCount) {
  if (!seasonCount || seasonCount <= 0) return null;

  const ordered = orderedSeasons(seasons);
  if (ordered.length === 0) return null;

  const anchor = plusAnchorSeason(ordered);
  if (!anchor) return null;

  const anchorIdx = Math.max(ordered.findIndex((s) => s.id === anchor.id), 0);
  const target = ordered[Math.min(anchorIdx + seasonCount - 1, ordered.length - 1)];
  const end = parseSeasonDate(target.endDate);
  if (!end) return null;

  end.setHours(23, 59, 59, 999);
  return end.toISOString();
}