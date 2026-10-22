import { base44 } from '@/api/base44Client';
import { safeRead } from '@/lib/dataCache';
import { DELIVERY, RAFFLE_STATUS, resultRecordFor } from '@/lib/raffleLogic';

/**
 * Database access for raffles. Reads that an admin needs to be *current* (pause
 * state, saved results) are never cached; the student card uses the shared
 * short-lived cache because it only reads.
 */

const STATUS_VISIBLE_TO_STUDENTS = [RAFFLE_STATUS.READY, RAFFLE_STATUS.DRAWING, RAFFLE_STATUS.COMPLETED];

/**
 * A read with options comes back as a page ({ items, has_more }); without
 * options it is already an array. Raffle reads are small and unpaginated by
 * design, so normalising here keeps every caller working with a plain list.
 */
const asArray = (result) => (Array.isArray(result) ? result : result?.items || []);

export async function listRaffles() {
  return asArray(await base44.entities.Raffle.list({ sort: '-created_date', limit: 50 }));
}

export async function getRaffle(id) {
  const rows = await base44.entities.Raffle.filter({ id });
  return rows[0] || null;
}

export async function listResults(raffleId) {
  return asArray(await base44.entities.RaffleResult.filter({ raffleId }, { sort: 'seq', limit: 500 }));
}

export async function listProfiles() {
  return asArray(await base44.entities.UserProfile.list('-created_date'));
}

export async function createRaffle(payload) {
  return base44.entities.Raffle.create(payload);
}

export async function updateRaffle(id, patch) {
  return base44.entities.Raffle.update(id, patch);
}

export async function deleteRaffle(id) {
  return base44.entities.Raffle.delete(id);
}

/**
 * Freeze the entry list and the draw order, and mark the raffle ready. Only
 * ever called while the raffle is a draft — later profile changes cannot alter
 * a locked raffle.
 */
export async function lockRaffle({ raffle, participants, plan, seed, actor }) {
  return base44.entities.Raffle.update(raffle.id, {
    participants,
    plan,
    seed,
    status: RAFFLE_STATUS.READY,
    frozenAt: new Date().toISOString(),
    frozenBy: actor || 'admin',
  });
}

/**
 * Save the winner/prize records for the given plan entries. The result and the
 * prize are stored first; delivery happens afterwards as its own step.
 */
export async function savePlannedResults(raffle, entries) {
  if (!entries.length) return [];
  const records = entries.map((entry) => resultRecordFor(raffle, entry));
  return base44.entities.RaffleResult.bulkCreate(records);
}

export async function updateResult(id, patch) {
  return base44.entities.RaffleResult.update(id, patch);
}

export async function getResult(id) {
  const rows = await base44.entities.RaffleResult.filter({ id });
  return rows[0] || null;
}

export async function getRedeemCode(id) {
  const rows = await base44.entities.RedeemCode.filter({ id });
  return rows[0] || null;
}

/** Pause or resume. The reason is stored with the flag so a resume has context. */
export async function setRafflePaused(raffleId, { paused, reason = '', automatic = false, actor = 'admin' }) {
  return base44.entities.Raffle.update(raffleId, {
    paused,
    pauseReason: paused ? reason : '',
    pauseIsAutomatic: paused ? automatic : false,
    pausedAt: paused ? new Date().toISOString() : null,
    pausedBy: paused ? actor : '',
  });
}

export async function markRaffleStatus(raffleId, status, patch = {}) {
  return base44.entities.Raffle.update(raffleId, { status, ...patch });
}

/**
 * A fresh look at everything the draw console needs. Deliberately uncached:
 * two admins on two devices must both see what is actually saved.
 */
export async function loadRaffleState(raffleId) {
  const [raffle, results] = await Promise.all([getRaffle(raffleId), listResults(raffleId)]);
  return { raffle, results };
}

/**
 * Student-facing read: published raffles plus this student's saved results.
 * Cached briefly and deduplicated, since every student opening the Rewards page
 * would otherwise trigger the same pair of reads.
 */
export async function loadStudentRaffles(profileId) {
  const raffles = await safeRead(
    'raffles:published',
    () =>
      base44.entities
        .Raffle.filter({ status: { $in: STATUS_VISIBLE_TO_STUDENTS } }, { sort: '-created_date', limit: 20 })
        .then(asArray),
    { ttl: 15000 }
  );
  const results = profileId
    ? await safeRead(
        `raffleResults:${profileId}`,
        () =>
          base44.entities.RaffleResult.filter(
            { profileId },
            { sort: '-created_date', limit: 100 }
          ).then(asArray),
        { ttl: 15000 }
      )
    : [];
  return { raffles, results };
}

export { DELIVERY };