import { addDaysKey, centralMidnightUtc, chicagoDateKey, formatDayShort } from '@/lib/centralTime';

/**
 * Week recap maths. Everything here is derived from recorded completed
 * outcomes (AnalyticsAction rows) — never from lifetime XP and never from the
 * order of the student's current inventory, neither of which proves when
 * something was earned.
 *
 * The week runs Monday → Sunday in America/Chicago, which is the school week
 * this app already treats as its calendar unit.
 */
export const COLLECTIBLE_REWARD_TYPES = ['pet', 'theme', 'title', 'song', 'playlist'];

/** Monday–Sunday window (plus a label) containing the given Central-Time date. */
export function getChicagoWeekRange(now = new Date()) {
  const todayKey = chicagoDateKey(now);
  const [y, m, d] = todayKey.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startKey = addDaysKey(todayKey, -daysSinceMonday);
  const endKey = addDaysKey(startKey, 6);
  return {
    startKey,
    endKey,
    startUtc: centralMidnightUtc(startKey),
    endUtcExclusive: centralMidnightUtc(addDaysKey(endKey, 1)),
    label: `${formatDayShort(startKey)} – ${formatDayShort(endKey)}`,
  };
}

export function withinWeek(iso, range) {
  if (!iso || !range) return false;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return false;
  return t >= range.startUtc.getTime() && t < range.endUtcExclusive.getTime();
}

/**
 * Reduce recorded outcomes to this week's numbers.
 *
 * @param {Array} actions - AnalyticsAction rows for this profile this week
 * @param {object} range - from getChicagoWeekRange()
 * @returns {{ hasHistory, questsCompleted, xpEarned, spins, collectibles, rewardCounts }}
 */
export function summarizeWeek(actions, range) {
  const rows = (actions || []).filter((a) => withinWeek(a.timestamp, range));

  const quests = rows.filter((a) => a.actionType === 'quest_complete');
  const spins = rows.filter((a) => a.actionType === 'daily_spin' || a.actionType === 'bonus_spin');

  // XP is only counted from quest completions that recorded an amount — a row
  // without one contributes nothing rather than a guess.
  const xpEarned = quests.reduce(
    (sum, a) => sum + (a.rewardType === 'xp' ? Number(a.rewardAmount) || 0 : 0),
    0
  );

  // Deduplicate by asset so one pet handed out twice counts once.
  const seen = new Map();
  rows.forEach((a) => {
    if (!COLLECTIBLE_REWARD_TYPES.includes(a.rewardType) || !a.rewardId) return;
    const key = `${a.rewardType}:${a.rewardId}`;
    if (!seen.has(key)) {
      seen.set(key, {
        type: a.rewardType,
        id: a.rewardId,
        amount: Number(a.rewardAmount) || null,
        at: a.timestamp,
      });
    }
  });

  const rewardCounts = rows.reduce((acc, a) => {
    const key = a.rewardType || 'reward';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    hasHistory: rows.length > 0,
    questsCompleted: quests.length,
    xpEarned,
    spins: spins.length,
    collectibles: Array.from(seen.values()),
    rewardCounts,
  };
}

/**
 * Honest note about where these numbers come from. Outcomes are only recorded
 * from the build that added them onward, so a thin week can simply mean the
 * history started recently.
 */
export const WEEK_HISTORY_NOTE =
  'Recaps are built only from completed outcomes recorded in 1planner — older activity is not counted.';