// Shared season selection and date logic used by both 1Pass (Season.jsx)
// and Season Book (SeasonBook.jsx) so their statuses always agree.

const DEFAULT_TZ = 'America/Chicago';

/**
 * Parse a date-only string (YYYY-MM-DD) as a local date at the start of that
 * calendar day.  `new Date("2026-10-31")` is interpreted as UTC midnight, which
 * shifts back to Oct 30 in Central time; this avoids that by building the
 * date from explicit local components.  Falls back to standard parsing for
 * non-date-only strings.  Returns null for invalid dates (never throws).
 */
export function parseSeasonDate(dateStr) {
  if (!dateStr) return null;
  try {
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d); // local midnight — not UTC
      if (isNaN(dt.getTime())) return null;
      return dt;
    }
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Returns a Date representing the start of "today" in the configured timezone.
 * Uses Intl.DateTimeFormat to get the calendar date in that zone, then builds
 * a local Date from those parts.  This gives consistent calendar-day
 * comparisons regardless of DST changes (no fixed UTC offsets).
 */
export function nowInTimezone(tz = DEFAULT_TZ) {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const get = (type) => parseInt(parts.find((p) => p.type === type).value, 10);
    return new Date(get('year'), get('month') - 1, get('day'));
  } catch {
    return new Date();
  }
}

/**
 * Season status: 'current' | 'upcoming' | 'ended'
 *  - Starts at the beginning of its start date.
 *  - Remains current throughout its entire end date.
 *  - Becomes ended on the following calendar day.
 * Invalid dates are treated as 'ended' (safe fallback — never crashes).
 */
export function getSeasonStatus(season, now) {
  const start = parseSeasonDate(season?.startDate);
  const end = parseSeasonDate(season?.endDate);
  if (!start || !end) return 'ended';
  if (now >= start && now <= end) return 'current';
  if (now < start) return 'upcoming';
  return 'ended';
}

/**
 * Select the season that 1Pass should display:
 *   1. The currently live season (among the given active seasons)
 *   2. If none live, the next upcoming active season
 *   3. If none, null
 * This is the single source of truth shared with Season Book.
 */
export function selectOnePassSeason(activeSeasons, now) {
  if (!activeSeasons || activeSeasons.length === 0) return null;
  const current = activeSeasons.find((s) => getSeasonStatus(s, now) === 'current');
  if (current) return current;
  const upcoming = activeSeasons
    .filter((s) => getSeasonStatus(s, now) === 'upcoming')
    .sort((a, b) => parseSeasonDate(a.startDate) - parseSeasonDate(b.startDate));
  return upcoming[0] || null;
}

/**
 * Build the ordered list of seasons for Season Book:
 *   1. The 1Pass season (Current or Upcoming) — only the one 1Pass shows
 *   2. All ended seasons (regardless of isActive), newest-ended first
 * Other future seasons are hidden.
 */
export function getSeasonBookSeasons(allSeasons, onePassSeason, now) {
  const ended = allSeasons
    .filter((s) => getSeasonStatus(s, now) === 'ended')
    .sort((a, b) => parseSeasonDate(b.endDate) - parseSeasonDate(a.endDate));

  const result = [];
  const seenIds = new Set();

  if (onePassSeason) {
    result.push(onePassSeason);
    seenIds.add(onePassSeason.id);
  }
  ended.forEach((s) => {
    if (!seenIds.has(s.id)) {
      result.push(s);
      seenIds.add(s.id);
    }
  });
  return result;
}

/**
 * Default selection: current season first, then newest ended, then upcoming.
 */
export function selectDefaultSeasonId(seasonBookSeasons, now) {
  if (!seasonBookSeasons || seasonBookSeasons.length === 0) return null;
  const current = seasonBookSeasons.find((s) => getSeasonStatus(s, now) === 'current');
  if (current) return current.id;
  const ended = seasonBookSeasons.find((s) => getSeasonStatus(s, now) === 'ended');
  if (ended) return ended.id;
  return seasonBookSeasons[0].id;
}

/**
 * Human-readable status label for a season.
 */
export function getSeasonStatusLabel(season, now) {
  const status = getSeasonStatus(season, now);
  if (status === 'current') return 'Current Season';
  if (status === 'upcoming') return 'Upcoming Season';
  return 'Ended Season';
}