/**
 * Shared daily reward utilities.
 * All date calculations use America/Chicago timezone for consistency.
 * This is the single source of truth for eligibility, dates, streaks, and status messages.
 */

/**
 * Get a stable YYYY-MM-DD date key in America/Chicago timezone.
 */
export function getChicagoDateKey(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

/**
 * Get yesterday's date key in America/Chicago timezone.
 */
export function getChicagoYesterdayKey(date = new Date()) {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return getChicagoDateKey(d);
}

/**
 * Get the day-of-month (1-31) in America/Chicago timezone.
 */
export function getChicagoDayOfMonth(date = new Date()) {
  return parseInt(date.toLocaleString('en-US', { timeZone: 'America/Chicago', day: 'numeric' }), 10);
}

/**
 * Determine if a user is eligible to claim the daily reward.
 * Shared calculation for banner, card, dialog, and validation.
 *
 * @param {object|null} progress - DailyRewardProgress record (or null if not loaded)
 * @param {object|null} config - daily_rewards_config setting value (or null)
 * @returns {{ canClaim: boolean, reason: 'ready'|'already_claimed'|'need_assignment'|'no_config'|'loading' }}
 */
export function getDailyRewardEligibility(progress, config) {
  if (!config) return { canClaim: false, reason: 'no_config' };

  const today = getChicagoDateKey();
  const lastClaim = progress?.lastClaimDate;
  const requireAssignment = config.requireAssignment !== false; // default true

  // Already claimed today — both modes prevent a second claim
  if (lastClaim === today) {
    return { canClaim: false, reason: 'already_claimed' };
  }

  if (requireAssignment) {
    // Must have completed a qualifying assignment today
    if (!progress) return { canClaim: false, reason: 'loading' };
    const isEligible = !!progress.eligible;
    const eligibleDate = progress.eligibleDate;
    if (!isEligible || eligibleDate !== today) {
      return { canClaim: false, reason: 'need_assignment' };
    }
    return { canClaim: true, reason: 'ready' };
  }

  // No assignment required — can claim once per day
  return { canClaim: true, reason: 'ready' };
}

/**
 * Get a human-readable status message for the daily reward.
 * Bonus wheel eligibility is kept separate from the ordinary daily reward.
 */
export function getDailyRewardStatusMessage(progress, config) {
  if (!config) return 'Reward configuration unavailable';

  if (progress?.bonusWheelTokens > 0) {
    return `Bonus spins available: ${progress.bonusWheelTokens}`;
  }

  const { reason } = getDailyRewardEligibility(progress, config);
  switch (reason) {
    case 'ready':
      return 'Ready to claim today';
    case 'already_claimed':
      return 'Already claimed today';
    case 'need_assignment':
      return 'Complete a quest today to unlock';
    case 'no_config':
      return 'Reward configuration unavailable';
    case 'loading':
      return 'Loading daily reward…';
    default:
      return 'Complete a quest today to unlock';
  }
}

/**
 * Compute the effective reward index based on schedule type and progress.
 * Uses Chicago timezone for all date comparisons.
 */
export function getEffectiveIndex(progress, config) {
  if (!config) return 0;

  if (config.scheduleType === 'monthly') {
    const day = getChicagoDayOfMonth();
    return Math.min(30, day - 1);
  }

  const period = config.scheduleType === 'streak14' ? 14 : 7;
  const last = progress?.lastClaimDate;
  const yesterday = getChicagoYesterdayKey();
  const today = getChicagoDateKey();

  if (last === yesterday) {
    return ((progress?.currentIndex || 0) + 1) % period;
  }
  if (last === today) {
    return progress?.currentIndex || 0; // already claimed today
  }
  // missed day -> reset
  return 0;
}

/**
 * Compute the next streak count after a claim.
 * If the last claim was yesterday (consecutive), increment; otherwise reset to 1.
 */
export function getNextStreakCount(progress) {
  const yesterday = getChicagoYesterdayKey();
  return progress?.lastClaimDate === yesterday ? (progress?.streakCount || 0) + 1 : 1;
}

/**
 * Get milliseconds until next Chicago midnight.
 * Uses Intl.DateTimeFormat with formatToParts to correctly handle the timezone
 * offset, including daylight saving transitions.
 */
export function getMsUntilNextChicagoMidnight(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const p = {};
  parts.forEach(pt => { if (pt.type !== 'literal') p[pt.type] = pt.value; });

  const chicagoNow = new Date(
    parseInt(p.year, 10),
    parseInt(p.month, 10) - 1,
    parseInt(p.day, 10),
    parseInt(p.hour, 10) % 24,
    parseInt(p.minute, 10),
    parseInt(p.second, 10)
  );
  const nextMidnight = new Date(chicagoNow);
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);

  return Math.max(0, nextMidnight.getTime() - chicagoNow.getTime());
}

/**
 * Format milliseconds as a human-readable countdown string.
 * "8h 20m" when hours remain, "12m 5s" when only minutes remain, "5s" otherwise.
 */
export function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}