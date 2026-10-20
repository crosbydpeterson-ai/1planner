// Pure aggregation helpers for Event Insights. No I/O here.
import { chicagoDateKey, chicagoHour, isWithin } from './centralTime';

export function pct(numerator, denominator) {
  if (!denominator) return null;
  return Math.round((numerator / denominator) * 100);
}

function distinctSet(items, keyFn, filterFn) {
  const set = new Set();
  for (const it of items || []) {
    if (filterFn && !filterFn(it)) continue;
    const k = keyFn(it);
    if (k != null && k !== '') set.add(k);
  }
  return set;
}

// ---- Students / sessions (UserSession) --------------------------------

export function activeStudentSet(sessions, range) {
  return distinctSet(sessions, (s) => s.profileId, (s) => isWithin(s.sessionStart, range));
}

// Active in the window AND seen before the window started.
export function returningStudentSet(sessions, range) {
  const active = activeStudentSet(sessions, range);
  const prior = distinctSet(
    sessions,
    (s) => s.profileId,
    (s) => s.sessionStart && new Date(s.sessionStart).getTime() < range.startUtc.getTime()
  );
  const out = new Set();
  for (const id of active) if (prior.has(id)) out.add(id);
  return out;
}

// Distinct active students per Central-Time day.
export function activeByDay(sessions, dayKeys) {
  const byDay = new Map(dayKeys.map((k) => [k, new Set()]));
  for (const s of sessions || []) {
    if (!s.profileId || !s.sessionStart) continue;
    const k = chicagoDateKey(new Date(s.sessionStart));
    if (byDay.has(k)) byDay.get(k).add(s.profileId);
  }
  return dayKeys.map((k) => ({ day: k, value: byDay.get(k).size }));
}

// Session *starts* grouped by Central-Time hour (not "students online by hour").
export function sessionStartsByHour(sessions, range) {
  const buckets = Array.from({ length: 24 }, () => 0);
  for (const s of sessions || []) {
    if (!isWithin(s.sessionStart, range)) continue;
    buckets[chicagoHour(new Date(s.sessionStart))] += 1;
  }
  return buckets.map((value, hour) => ({ hour, value }));
}

// ---- Event participation (EventParticipation) -------------------------

// Deduped by userId (participation records reference UserProfile.userId).
export function participationStats(participations, eventId) {
  const rows = (participations || []).filter((p) => !eventId || p.eventId === eventId);
  const reached = distinctSet(rows, (p) => p.userId, (p) => !!p.seen);
  const completed = distinctSet(rows, (p) => p.userId, (p) => !!p.completed);
  const seenWithTime = rows.filter((p) => p.seenAt);
  return { reached, completed, hasTimedReach: seenWithTime.length > 0, recordCount: rows.length };
}

// Reach (first seen) per Central-Time day — participation completion has no
// per-action timestamp, so this charts when students first reached the event.
export function reachByDay(participations, eventId, dayKeys) {
  const byDay = new Map(dayKeys.map((k) => [k, new Set()]));
  for (const p of participations || []) {
    if (eventId && p.eventId !== eventId) continue;
    if (!p.userId || !p.seenAt || !p.seen) continue;
    const k = chicagoDateKey(new Date(p.seenAt));
    if (byDay.has(k)) byDay.get(k).add(p.userId);
  }
  return dayKeys.map((k) => ({ day: k, value: byDay.get(k).size }));
}

// ---- Reward claims (GlobalEventClaim) --------------------------------

export function claimsStats(claims, globalEvents, eventId, range) {
  const tierMap = new Map((globalEvents || []).map((e) => [e.id, e.tiers || []]));
  const rows = (claims || []).filter(
    (c) => (!eventId || c.eventId === eventId) && isWithin(c.created_date, range)
  );
  const byType = {};
  const claimers = new Set();
  for (const c of rows) {
    claimers.add(c.userProfileId);
    const tiers = tierMap.get(c.eventId) || [];
    const type = tiers[c.tierIndex]?.rewardType || 'unknown';
    byType[type] = (byType[type] || 0) + 1;
  }
  return {
    total: rows.length,
    uniqueClaimers: claimers.size,
    byType: Object.entries(byType).map(([name, value]) => ({ name, value })),
  };
}

// ---- Wheel + quest outcomes (AnalyticsAction, recorded from deploy) ----

export function wheelStats(actions, range) {
  const inRange = (actions || []).filter((a) => isWithin(a.timestamp, range));
  const daily = inRange.filter((a) => a.actionType === 'daily_spin');
  const bonus = inRange.filter((a) => a.actionType === 'bonus_spin');
  const spins = [...daily, ...bonus];
  const spinners = new Set(spins.map((s) => s.profileId));
  const byOutcome = {};
  for (const s of spins) {
    const k = s.rewardType || 'unknown';
    byOutcome[k] = (byOutcome[k] || 0) + 1;
  }
  return {
    dailySpins: daily.length,
    bonusSpins: bonus.length,
    totalSpins: spins.length,
    uniqueSpinners: spinners.size,
    byOutcome: Object.entries(byOutcome).map(([name, value]) => ({ name, value })),
  };
}

export function questStats(actions, range, dayKeys) {
  const rows = (actions || []).filter((a) => a.actionType === 'quest_complete' && isWithin(a.timestamp, range));
  const byDay = new Map(dayKeys.map((k) => [k, 0]));
  for (const r of rows) {
    const k = chicagoDateKey(new Date(r.timestamp));
    if (byDay.has(k)) byDay.set(k, byDay.get(k) + 1);
  }
  return {
    total: rows.length,
    byDay: dayKeys.map((k) => ({ day: k, value: byDay.get(k) })),
  };
}

// ---- Event comparison -------------------------------------------------

export function eventComparison(adminEvents, globalEvents, participations, claims) {
  const rows = [];
  const seen = new Set();

  for (const e of adminEvents || []) {
    const pRows = (participations || []).filter((p) => p.eventId === e.id);
    const participants = distinctSet(pRows, (p) => p.userId, (p) => !!p.completed).size;
    const reached = distinctSet(pRows, (p) => p.userId, (p) => !!p.seen).size;
    if (pRows.length === 0) continue;
    seen.add(e.id);
    rows.push({
      id: e.id,
      name: e.name || 'Event',
      type: 'Activity event',
      start: e.startTime,
      end: e.endTime,
      participants,
      reached,
      claims: 0,
    });
  }

  for (const g of globalEvents || []) {
    const cRows = (claims || []).filter((c) => c.eventId === g.id);
    if (cRows.length === 0 && seen.has(g.id)) continue;
    if (cRows.length === 0) continue;
    rows.push({
      id: g.id,
      name: g.name || 'Event',
      type: 'Community event',
      start: g.startDate,
      end: g.endDate,
      participants: 0,
      reached: 0,
      claims: cRows.length,
    });
  }

  return rows.sort((a, b) => (b.participants + b.claims) - (a.participants + a.claims));
}

export function durationDays(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (isNaN(ms) || ms < 0) return null;
  return Math.max(1, Math.round(ms / 86400000));
}