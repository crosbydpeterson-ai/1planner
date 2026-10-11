import { base44 } from '@/api/base44Client';
import {
  getChicagoDateKey,
  getDailyRewardEligibility,
  getEffectiveIndex,
  getNextStreakCount,
} from './dailyRewardUtils';

/**
 * Compute the profile patch needed to grant a reward.
 * Returns { updates, awarded } where updates is a partial UserProfile patch.
 */
export function computeRewardUpdates(profile, rwd) {
  const updates = {};
  let awarded = '';

  if (!rwd) return { updates, awarded };

  if (rwd.type === 'xp') {
    const amt = Number(rwd.amount) || 0;
    updates.xp = (profile.xp || 0) + amt;
    awarded = `+${amt} XP`;
  } else if (rwd.type === 'coins') {
    const amt = Number(rwd.amount) || 0;
    updates.questCoins = (profile.questCoins || 0) + amt;
    awarded = `+${amt} Quest Coins`;
  } else if (rwd.type === 'pet') {
    const id = String(rwd.value || '');
    const current = profile.unlockedPets || ['starter_slime'];
    if (id && !current.includes(id)) updates.unlockedPets = [...current, id];
    awarded = `Pet: ${rwd.name || rwd.value || 'New pet'}`;
  } else if (rwd.type === 'theme') {
    const id = String(rwd.value || '');
    const current = profile.unlockedThemes || [];
    if (id && !current.includes(id)) updates.unlockedThemes = [...current, id];
    awarded = `Theme: ${rwd.name || rwd.value || 'New theme'}`;
  } else if (rwd.type === 'title') {
    const t = String(rwd.value || '');
    const current = profile.unlockedTitles || [];
    if (t && !current.includes(t)) updates.unlockedTitles = [...current, t];
    awarded = `Title: ${t || 'New title'}`;
  }

  return { updates, awarded };
}

/**
 * Re-fetch the latest progress record for a user.
 * Throws on failure — caller must surface a retryable error, NOT fall back to stale data.
 */
async function fetchFreshProgress(profileId) {
  const rows = await base44.entities.DailyRewardProgress.filter({ userProfileId: profileId });
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Re-fetch the latest profile for accurate balance math.
 * Throws on failure — caller surfaces a retryable error.
 */
async function fetchFreshProfile(profileId) {
  const rows = await base44.entities.UserProfile.filter({ id: profileId });
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Claim the daily reward.
 *
 * Re-fetches progress AND profile before claiming to detect concurrent claims
 * and use accurate balances. Granting the reward and recording the claim are
 * separate writes — partial success is reported explicitly.
 *
 * @param {object} profile - Current UserProfile
 * @param {object|null} progress - Current DailyRewardProgress (may be stale)
 * @param {object} config - daily_rewards_config setting value
 * @param {object} [wheelPrize] - Prize landed on the wheel (for wheel-type rewards)
 * @returns {{ ok: boolean, error?: string, profile?: object, progress?: object, awarded?: string, reward?: object, partial?: boolean, retryable?: boolean }}
 */
export async function claimDailyReward(profile, progress, config, wheelPrize) {
  const today = getChicagoDateKey();

  // Fresh progress — failure is a retryable error, NOT a silent fallback
  let currentProgress;
  try {
    currentProgress = await fetchFreshProgress(profile.id);
  } catch {
    return { ok: false, error: 'connection_error', retryable: true };
  }

  // Check eligibility with fresh data
  const eligibility = getDailyRewardEligibility(currentProgress, config);
  if (!eligibility.canClaim) {
    return { ok: false, error: eligibility.reason, progress: currentProgress };
  }

  const effectiveIndex = getEffectiveIndex(currentProgress, config);
  const reward = config?.rewards?.[effectiveIndex] || null;

  if (reward?.type === 'wheel' && !wheelPrize) {
    return { ok: false, error: 'no_prize', progress: currentProgress };
  }
  if (!reward) {
    return { ok: false, error: 'no_reward', progress: currentProgress };
  }

  const rwd = wheelPrize || reward;

  // Fresh profile for accurate balances
  let freshProfile = profile;
  try {
    const fp = await fetchFreshProfile(profile.id);
    if (fp) freshProfile = fp;
  } catch {
    return { ok: false, error: 'connection_error', retryable: true };
  }

  const { updates, awarded } = computeRewardUpdates(freshProfile, rwd);

  // --- Step 1: Grant reward to profile ---
  let updatedProfile = { ...freshProfile };
  if (Object.keys(updates).length > 0) {
    try {
      await base44.entities.UserProfile.update(profile.id, updates);
      updatedProfile = { ...freshProfile, ...updates };
    } catch {
      return { ok: false, error: 'profile_update_failed', retryable: true, progress: currentProgress };
    }
  }

  // --- Step 2: Mark progress as claimed (separate write) ---
  const nextStreak = getNextStreakCount(currentProgress);
  const nextIndex = effectiveIndex;
  let updatedProgress;

  try {
    if (!currentProgress?.id) {
      const created = await base44.entities.DailyRewardProgress.create({
        userProfileId: profile.id,
        lastClaimDate: today,
        currentIndex: nextIndex,
        streakCount: nextStreak,
        eligible: false,
      });
      updatedProgress = { ...created };
    } else {
      await base44.entities.DailyRewardProgress.update(currentProgress.id, {
        lastClaimDate: today,
        currentIndex: nextIndex,
        streakCount: nextStreak,
        eligible: false,
      });
      updatedProgress = {
        ...currentProgress,
        lastClaimDate: today,
        currentIndex: nextIndex,
        streakCount: nextStreak,
        eligible: false,
      };
    }
  } catch {
    // Partial success: profile has the reward, but progress was not marked.
    // Report honestly — do NOT pretend this is atomic.
    return {
      ok: false,
      error: 'progress_update_failed',
      partial: true,
      profile: updatedProfile,
      progress: currentProgress,
      awarded,
      reward: rwd,
    };
  }

  return { ok: true, profile: updatedProfile, progress: updatedProgress, awarded, reward: rwd };
}

/**
 * Use a bonus spin. Does NOT advance the streak or consume the daily reward.
 * Only decrements bonusWheelTokens and grants the wheel prize.
 *
 * @param {object} profile - Current UserProfile
 * @param {object|null} progress - Current DailyRewardProgress
 * @param {object} config - daily_rewards_config setting value
 * @param {object} wheelPrize - Prize landed on the bonus wheel
 * @returns {{ ok: boolean, error?: string, profile?: object, progress?: object, awarded?: string, reward?: object, partial?: boolean, retryable?: boolean }}
 */
export async function claimBonusSpin(profile, progress, config, wheelPrize) {
  const today = getChicagoDateKey();

  // Fresh progress
  let currentProgress;
  try {
    currentProgress = await fetchFreshProgress(profile.id);
  } catch {
    return { ok: false, error: 'connection_error', retryable: true };
  }

  if (Number(currentProgress?.bonusWheelTokens || 0) <= 0) {
    return { ok: false, error: 'no_tokens', progress: currentProgress };
  }

  if (!wheelPrize) {
    return { ok: false, error: 'no_prize', progress: currentProgress };
  }

  // Fresh profile
  let freshProfile = profile;
  try {
    const fp = await fetchFreshProfile(profile.id);
    if (fp) freshProfile = fp;
  } catch {
    return { ok: false, error: 'connection_error', retryable: true };
  }

  const { updates, awarded } = computeRewardUpdates(freshProfile, wheelPrize);

  // --- Step 1: Grant reward to profile ---
  let updatedProfile = { ...freshProfile };
  if (Object.keys(updates).length > 0) {
    try {
      await base44.entities.UserProfile.update(profile.id, updates);
      updatedProfile = { ...freshProfile, ...updates };
    } catch {
      return { ok: false, error: 'profile_update_failed', retryable: true, progress: currentProgress };
    }
  }

  // --- Step 2: Decrement bonus token (separate write) ---
  const tokens = Math.max(0, Number(currentProgress.bonusWheelTokens || 0) - 1);
  let updatedProgress;

  try {
    if (!currentProgress?.id) {
      const created = await base44.entities.DailyRewardProgress.create({
        userProfileId: profile.id,
        bonusWheelTokens: tokens,
        wheelLastSpinDate: today,
      });
      updatedProgress = { ...created };
    } else {
      await base44.entities.DailyRewardProgress.update(currentProgress.id, {
        bonusWheelTokens: tokens,
        wheelLastSpinDate: today,
      });
      updatedProgress = {
        ...currentProgress,
        bonusWheelTokens: tokens,
        wheelLastSpinDate: today,
      };
    }
  } catch {
    return {
      ok: false,
      error: 'progress_update_failed',
      partial: true,
      profile: updatedProfile,
      progress: currentProgress,
      awarded,
      reward: wheelPrize,
    };
  }

  return { ok: true, profile: updatedProfile, progress: updatedProgress, awarded, reward: wheelPrize };
}