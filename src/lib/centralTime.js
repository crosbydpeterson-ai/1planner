// America/Chicago time helpers for analytics.
// All day keys, hour grouping, and filter boundaries use Central Time so that
// grouping is correct regardless of the viewer's own timezone. Never derive a
// "day" from toISOString().slice(0,10) — that groups by UTC and shifts the day
// boundary away from Central midnight.

const TZ = 'America/Chicago';

// 'YYYY-MM-DD' key for the Central-Time calendar day containing `date`.
export function chicagoDateKey(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: TZ });
}

// Central-Time hour (0–23) for an instant.
export function chicagoHour(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, hour: '2-digit', hour12: false,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === 'hour')?.value ?? '0';
  return parseInt(h, 10) % 24;
}

// Offset (minutes) of Central Time vs UTC at a given instant (e.g. -300 CST, -360 CDT).
export function chicagoOffsetMinutes(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date);
  const p = {};
  parts.forEach((pt) => { if (pt.type !== 'literal') p[pt.type] = pt.value; });
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, (+p.hour) % 24, +p.minute, +p.second);
  return Math.round((asUTC - date.getTime()) / 60000);
}

// The UTC instant corresponding to Central-Time midnight starting `dateKey`.
// Uses a same-day probe so DST transitions resolve to the right offset.
export function centralMidnightUtc(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d, 18, 0, 0)); // ~noon Central, same CT day
  const off = chicagoOffsetMinutes(probe);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - off * 60000);
}

export function addDaysKey(dateKey, delta) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

// Inclusive [startKey, endKey] -> half-open UTC window [startUtc, endUtcExclusive).
export function centralRange(startKey, endKey) {
  return {
    startUtc: centralMidnightUtc(startKey),
    endUtcExclusive: centralMidnightUtc(addDaysKey(endKey, 1)),
  };
}

export function lastNDayKeys(n, from = new Date()) {
  const end = chicagoDateKey(from);
  const keys = [];
  for (let i = n - 1; i >= 0; i--) keys.push(addDaysKey(end, -i));
  return keys;
}

export function dayKeysBetween(startKey, endKey, max = 400) {
  const keys = [];
  let k = startKey;
  let guard = 0;
  while (k <= endKey && guard < max) { keys.push(k); k = addDaysKey(k, 1); guard++; }
  return keys;
}

export function formatDayShort(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

export function formatCentralDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    timeZone: TZ, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function formatHourLabel(h) {
  const hr = ((h % 24) + 24) % 24;
  const ampm = hr < 12 ? 'AM' : 'PM';
  const display = hr % 12 === 0 ? 12 : hr % 12;
  return `${display}${ampm}`;
}

export function isWithin(iso, range) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return false;
  return t >= range.startUtc.getTime() && t < range.endUtcExclusive.getTime();
}