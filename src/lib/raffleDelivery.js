import { base44 } from '@/api/base44Client';
import { DELIVERY, normalizedRewardData, randomCode, maskCode } from '@/lib/raffleLogic';
import { OUTCOME, redeemCodeForProfile } from '@/lib/redeemExecution';
import { getRaffle, getRedeemCode, getResult, setRafflePaused, updateResult } from '@/lib/raffleData';

/**
 * Raffle prize delivery.
 *
 * Delivery is deliberately a separate step from choosing a winner: a result row
 * is saved first, and only then does the app try to hand the prize over. Each
 * delivery goes through the same redeem-code path a student would use by hand,
 * with a one-use code created for that single result.
 *
 * The rule this file exists to enforce: a saved winner is never replaced, and an
 * uncertain delivery is never retried automatically.
 */

/** A result stuck mid-delivery is uncertain, not "in progress". */
const STALE_DELIVERY_MS = 2 * 60 * 1000;

export function codePayloadFor(result) {
  return {
    code: randomCode(10),
    label: `Raffle: ${result.raffleTitle || 'Raffle'} → ${result.username || 'student'} (${
      result.prizeLabel || 'prize'
    })`,
    rewardType: result.rewardType,
    rewardData: result.rewardData || normalizedRewardData(result),
    maxUses: 1,
    isActive: true,
    usedBy: [],
  };
}

const isStale = (result, now = Date.now()) => {
  if ((result?.deliveryStatus || DELIVERY.PENDING) !== DELIVERY.DELIVERING) return false;
  const stamp = result.updated_date || result.selectionSavedAt;
  if (!stamp) return true;
  return now - new Date(stamp).getTime() > STALE_DELIVERY_MS;
};

export const staleDeliveries = (results) => (results || []).filter((r) => isStale(r));

/**
 * An attempt that was interrupted (tab closed, browser killed) can only be
 * classified, never retried: the prize may already be in the student's account.
 */
export async function settleStaleDeliveries(results) {
  const stale = staleDeliveries(results);
  const settled = [];
  for (const result of stale) {
    const patch = {
      deliveryStatus: DELIVERY.NEEDS_REVIEW,
      deliveryError: 'A delivery attempt was interrupted, so it could not be confirmed.',
    };
    await updateResult(result.id, patch);
    settled.push({ ...result, ...patch });
  }
  return settled;
}

/**
 * Deliver one saved result.
 * Returns { status, message, patch } where status is a DELIVERY value, or
 * 'paused'/'skipped' when nothing was attempted.
 */
export async function deliverResult(result, raffle, { actor = 'admin' } = {}) {
  if (!result) return { status: 'skipped', message: 'No result to deliver.' };
  if (raffle?.paused) return { status: 'paused', message: 'The raffle is paused.' };
  if (!result.rewardType) {
    const patch = {
      deliveryStatus: DELIVERY.FAILED,
      deliveryError: 'This result has no reward attached — check the prize configuration.',
    };
    await updateResult(result.id, patch);
    return { status: DELIVERY.FAILED, message: patch.deliveryError, patch };
  }

  // Always work from the stored row, not from what the screen showed.
  const fresh = (await getResult(result.id)) || result;
  if ((fresh.deliveryStatus || DELIVERY.PENDING) === DELIVERY.DELIVERED) {
    return { status: DELIVERY.DELIVERED, message: 'Already delivered.', patch: {} };
  }

  // An earlier attempt may have landed even though it was never confirmed.
  if (fresh.codeId) {
    const code = await getRedeemCode(fresh.codeId);
    if (code) {
      const usedBy = code.usedBy || [];
      if (usedBy.includes(fresh.profileId)) {
        const patch = {
          deliveryStatus: DELIVERY.DELIVERED,
          deliveryError: '',
          deliveredAt: new Date().toISOString(),
          deliveredBy: actor,
        };
        await updateResult(fresh.id, patch);
        return { status: DELIVERY.DELIVERED, message: 'This code was already redeemed — marked delivered.', patch };
      }
      if (usedBy.length > 0) {
        const patch = {
          deliveryStatus: DELIVERY.NEEDS_REVIEW,
          deliveryError: 'This prize code was redeemed by a different student.',
        };
        await updateResult(fresh.id, patch);
        return { status: DELIVERY.NEEDS_REVIEW, message: patch.deliveryError, patch };
      }
    }
    // The code row is gone. Nothing can have been redeemed, so a fresh code is safe.
    if (!code) {
      await updateResult(fresh.id, { codeId: '', codeMasked: '' });
      fresh.codeId = '';
    }
  }

  // Create the code and persist the association *before* redeeming, so a crash
  // between the two steps still leaves a recoverable trail.
  let codeRow = fresh.codeId ? await getRedeemCode(fresh.codeId) : null;
  if (!codeRow) {
    try {
      codeRow = await createRaffleCode(fresh);
    } catch (err) {
      console.error('Raffle: could not create prize code', err);
      const patch = {
        deliveryStatus: DELIVERY.FAILED,
        deliveryError: 'Could not prepare the prize code — nothing was applied.',
        deliveryAttempts: (fresh.deliveryAttempts || 0) + 1,
      };
      await updateResult(fresh.id, patch);
      return { status: DELIVERY.FAILED, message: patch.deliveryError, patch };
    }
    const patch = {
      codeId: codeRow.id,
      codeMasked: maskCode(codeRow.code),
      deliveryStatus: DELIVERY.DELIVERING,
      deliveryAttempts: (fresh.deliveryAttempts || 0) + 1,
    };
    await updateResult(fresh.id, patch);
    Object.assign(fresh, patch);
  } else {
    const patch = {
      deliveryStatus: DELIVERY.DELIVERING,
      deliveryAttempts: (fresh.deliveryAttempts || 0) + 1,
    };
    await updateResult(fresh.id, patch);
    Object.assign(fresh, patch);
  }

  let outcome;
  try {
    outcome = await redeemCodeForProfile({ code: codeRow.code, profileId: fresh.profileId });
  } catch (err) {
    // The shared path only throws for unclassified failures — treat as uncertain.
    console.error('Raffle delivery failed unexpectedly', err);
    outcome = { outcome: OUTCOME.APPLIED_UNCONFIRMED, detail: 'The delivery ended unexpectedly.' };
  }

  const now = new Date().toISOString();
  let patch;
  if (outcome.outcome === OUTCOME.REDEEMED) {
    patch = { deliveryStatus: DELIVERY.DELIVERED, deliveryError: '', deliveredAt: now, deliveredBy: actor };
  } else if (outcome.outcome === OUTCOME.APPLIED_UNCONFIRMED || outcome.outcome === OUTCOME.PARTLY_APPLIED) {
    patch = { deliveryStatus: DELIVERY.NEEDS_REVIEW, deliveryError: outcome.detail || 'Could not be confirmed.' };
  } else {
    patch = { deliveryStatus: DELIVERY.FAILED, deliveryError: outcome.detail || 'Nothing was applied.' };
  }
  await updateResult(fresh.id, patch);
  return { status: patch.deliveryStatus, message: outcome.message || patch.deliveryError, patch };
}

const createRaffleCode = (result) => base44.entities.RedeemCode.create(codePayloadFor(result));

/**
 * Deliver every saved result that is safe to attempt: never touches a delivered
 * prize, never retries anything that needs review, and never touches a result
 * left mid-delivery (that has to be classified first by settleStaleDeliveries).
 *
 * Stops early when the saved pause flag is set — checked before each prize, so a
 * pause from another device takes effect on the next student. A delivery already
 * in flight on another device can still finish, which is reported in the UI.
 */
export async function deliverPending(results, raffle, { actor = 'admin', onProgress, shouldStop } = {}) {
  const queue = (results || []).filter((r) => {
    const status = r.deliveryStatus || DELIVERY.PENDING;
    return status === DELIVERY.PENDING || status === DELIVERY.FAILED;
  });

  const summary = { delivered: 0, failed: 0, needsReview: 0, stopped: false, ran: 0 };
  let consecutiveReview = 0;

  for (const result of queue) {
    if (shouldStop?.()) {
      summary.stopped = true;
      break;
    }

    // Read the pause flag again: another admin may have paused since we started.
    const current = await getRaffle(raffle.id);
    if (current?.paused) {
      summary.stopped = true;
      break;
    }

    const out = await deliverResult(result, current || raffle, { actor });
    summary.ran += 1;
    if (out.status === DELIVERY.DELIVERED) {
      summary.delivered += 1;
      consecutiveReview = 0;
    } else if (out.status === DELIVERY.NEEDS_REVIEW) {
      summary.needsReview += 1;
      consecutiveReview += 1;
    } else if (out.status === DELIVERY.FAILED) {
      summary.failed += 1;
      consecutiveReview = 0;
    }

    onProgress?.({ result, outcome: out, summary });

    // Several unconfirmable deliveries in a row suggest something systemic.
    if (consecutiveReview >= 2) {
      await setRafflePaused(raffle.id, {
        paused: true,
        reason:
          'Two deliveries in a row could not be confirmed. Check those results before delivering more.',
        automatic: true,
        actor: 'auto',
      });
      summary.stopped = true;
      break;
    }
  }

  return summary;
}

/** Manual reconciliation: an admin checked the records and confirms the prize landed. */
export async function confirmDelivered(result, { actor }) {
  const patch = {
    deliveryStatus: DELIVERY.DELIVERED,
    deliveryError: '',
    deliveredAt: new Date().toISOString(),
    deliveredBy: `${actor || 'admin'}-confirmed`,
  };
  await updateResult(result.id, patch);
  return patch;
}