import { base44 } from '@/api/base44Client';

/**
 * Minimal, fire-and-forget analytics recording for completed outcomes.
 *
 * Recording never throws and never blocks the user action — analytics must not
 * change product behavior. Record once per completed outcome using a stable
 * operationId so a retry/re-render does not create a duplicate row.
 *
 * NOTE: the platform cannot enforce atomic dedup here, so an identical
 * operationId may in principle be written twice under extreme retry; callers
 * pass a deterministic id so this is unlikely.
 */
export function trackAction({
  actionType,
  profileId,
  eventId = null,
  wheelId = null,
  wheelVersion = null,
  rewardType = null,
  rewardAmount = null,
  rewardId = null,
  operationId = null,
}) {
  if (!actionType || !profileId) return;
  const opId = operationId || `${actionType}:${profileId}:${Date.now()}`;

  (async () => {
    try {
      await base44.entities.AnalyticsAction.create({
        actionType,
        profileId,
        eventId,
        wheelId,
        wheelVersion,
        rewardType,
        rewardAmount,
        rewardId,
        operationId: opId,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      // Never surface analytics failures to the user.
      console.warn('Analytics tracking skipped:', e?.message || e);
    }
  })();
}

export const ANALYTICS_DEPLOY_NOTE =
  'Recorded from this build onward; earlier history is unavailable.';