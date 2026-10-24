import moment from 'moment';

// Server timestamps arrive without a timezone marker, e.g.
// "2026-10-24T21:12:38.201000", and they are UTC wall-clock time. Parsing one
// as-is makes the browser read it as local time, so a post written seconds ago
// shows as "in 5 hours" for anyone in a timezone behind UTC. Normalize unmarked
// values to UTC before formatting.

export function parseServerDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);

  const raw = String(value).trim();
  // Already carries a zone (Z or ±hh:mm) — trust it.
  if (/(?:z|[+-]\d{2}:?\d{2})$/i.test(raw)) return new Date(raw);

  // Accept "YYYY-MM-DD HH:mm:ss" and trim sub-millisecond precision, which some
  // engines refuse to parse.
  const normalized = raw.replace(' ', 'T').replace(/(\.\d{3})\d+$/, '$1');
  return new Date(`${normalized}Z`);
}

const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime());

// Relative label ("just now", "3 minutes ago") computed against local time.
export function timeAgo(value) {
  const date = parseServerDate(value);
  return isValidDate(date) ? moment(date).fromNow() : '';
}