import { base44 } from '@/api/base44Client';
import { PETS } from '@/components/quest/PetCatalog';
import {
  CUSTOM_PET_PREFIX,
  customPetStorageId,
  isCustomPetId,
  planRedemption,
  redeemError,
} from '@/lib/redeemReward';

/**
 * The one place a redeem code is actually consumed.
 *
 * Both the manual redeem box and the raffle's hidden delivery run through this
 * function, so a raffle prize cannot bypass any restriction the manual flow
 * enforces (code active, not expired, uses left, not already used by this
 * student, valid reward payload).
 *
 * The outcome says how far it got, which is what lets a caller decide between
 * retrying and flagging the delivery for review:
 *  - REDEEMED            reward applied and the code marked used
 *  - NOT_APPLIED         nothing changed — safe to try again
 *  - APPLIED_UNCONFIRMED reward applied but the code could not be marked used
 *  - PARTLY_APPLIED      only part of the reward landed
 */

export const OUTCOME = {
  REDEEMED: 'redeemed',
  NOT_APPLIED: 'not_applied',
  APPLIED_UNCONFIRMED: 'applied_unconfirmed',
  PARTLY_APPLIED: 'partly_applied',
};

const NOT_APPLIED_MESSAGE =
  'That code could not be redeemed just now. It has not been used — please try again.';

/** Neutral wording for admin-facing logs, where "you" is not the student. */
export const DETAIL = {
  [OUTCOME.REDEEMED]: 'Delivered.',
  [OUTCOME.NOT_APPLIED]: 'Nothing was applied — safe to try again.',
  [OUTCOME.APPLIED_UNCONFIRMED]:
    'The reward was applied but the code could not be marked as used — check before retrying.',
  [OUTCOME.PARTLY_APPLIED]: 'Part of the reward landed — check before retrying.',
};

/** Built-in pets come from the catalog; custom pets live in the database. */
async function resolvePet(rewardType, rewardData) {
  if (rewardType !== 'pet') return null;
  const petId = typeof rewardData?.petId === 'string' ? rewardData.petId : '';
  if (!petId) return null;

  if (isCustomPetId(petId)) {
    const customId = petId.slice(CUSTOM_PET_PREFIX.length);
    const found = await base44.entities.CustomPet.filter({ id: customId });
    const pet = found[0];
    return pet ? { id: customPetStorageId(customId), name: pet.name, emoji: pet.emoji } : null;
  }

  const pet = PETS.find((p) => p.id === petId);
  return pet ? { id: pet.id, name: pet.name, emoji: pet.emoji } : null;
}

/** Every reason a code must not be consumed. Throws a user-facing error. */
function checkRedeemable(entry, me) {
  if (!entry || !entry.isActive) throw redeemError('Code not found or no longer active.');
  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) throw redeemError('This code has expired.');

  const usedBy = entry.usedBy || [];
  if (entry.maxUses != null && usedBy.length >= entry.maxUses) {
    throw redeemError('This code has reached its maximum uses.');
  }
  if (usedBy.includes(me.id)) throw redeemError('You have already redeemed this code.');
}

/**
 * Consume a code for one profile. `code` is the code string, `profileId` the
 * student receiving the reward (not necessarily the signed-in profile — an
 * admin runs raffle delivery from their own browser).
 */
export async function redeemCodeForProfile({ code, profileId, fallbackProfile = null }) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized || !profileId) {
    return { outcome: OUTCOME.NOT_APPLIED, message: NOT_APPLIED_MESSAGE, detail: DETAIL[OUTCOME.NOT_APPLIED] };
  }

  // Read the code and the student's profile together, so both sides of the
  // later checks come from the same fresh read.
  const readFresh = async () => {
    const [codes, profiles] = await Promise.all([
      base44.entities.RedeemCode.filter({ code: normalized }),
      base44.entities.UserProfile.filter({ id: profileId }),
    ]);
    return { entry: codes[0], me: profiles[0] || fallbackProfile };
  };

  let rewardApplied = false;
  let partlyApplied = false;

  try {
    // Fail fast on a dead code before doing anything at all.
    const first = await readFresh();
    checkRedeemable(first.entry, first.me);

    // Then reload both rows and re-check, so what we act on is what is stored
    // right now — not what was on screen when this started.
    const { entry, me } = await readFresh();
    const freshProfile = me || fallbackProfile;
    checkRedeemable(entry, freshProfile);

    const needsSeasons = entry.rewardType === 'onepassplus' && Number(entry.rewardData?.seasons) > 0;
    const seasons = needsSeasons ? await base44.entities.Season.list('-created_date') : [];

    const resolvedPet = await resolvePet(entry.rewardType, entry.rewardData);
    const plan = planRedemption({
      rewardType: entry.rewardType,
      rewardData: entry.rewardData,
      profile: freshProfile,
      seasons,
      resolvedPet,
    });

    if (plan.foodItem) {
      const existing = await base44.entities.FoodInventory.filter({
        userProfileId: freshProfile.id,
        itemId: plan.foodItem.itemId,
      });
      if (existing.length > 0) {
        await base44.entities.FoodInventory.update(existing[0].id, {
          quantity: (existing[0].quantity || 0) + plan.foodItem.quantity,
        });
      } else {
        await base44.entities.FoodInventory.create({
          userProfileId: freshProfile.id,
          itemId: plan.foodItem.itemId,
          quantity: plan.foodItem.quantity,
        });
      }
      partlyApplied = true; // the item has landed even if a later step fails
    }

    if (Object.keys(plan.updateData).length > 0) {
      await base44.entities.UserProfile.update(freshProfile.id, plan.updateData);
    }
    rewardApplied = true;
    partlyApplied = false;

    // Mark the code used, from the freshly read list.
    const usedBy = entry.usedBy || [];
    if (usedBy.includes(freshProfile.id)) throw redeemError('You have already redeemed this code.');
    await base44.entities.RedeemCode.update(entry.id, { usedBy: [...usedBy, freshProfile.id] });

    return {
      outcome: OUTCOME.REDEEMED,
      message: plan.message,
      detail: DETAIL[OUTCOME.REDEEMED],
      pet: entry.rewardType === 'pet' ? resolvedPet : null,
    };
  } catch (err) {
    console.error('Redeem failed', err);
    if (err?.userFacing) {
      return { outcome: OUTCOME.NOT_APPLIED, message: err.message, detail: err.message };
    }
    if (rewardApplied) {
      return {
        outcome: OUTCOME.APPLIED_UNCONFIRMED,
        message:
          'Your reward was applied, but the code could not be marked as used. Please tell an admin so they can check it.',
        detail: DETAIL[OUTCOME.APPLIED_UNCONFIRMED],
      };
    }
    if (partlyApplied) {
      return {
        outcome: OUTCOME.PARTLY_APPLIED,
        message:
          'Part of this reward may have been applied. Please tell an admin before trying this code again.',
        detail: DETAIL[OUTCOME.PARTLY_APPLIED],
      };
    }
    return { outcome: OUTCOME.NOT_APPLIED, message: NOT_APPLIED_MESSAGE, detail: DETAIL[OUTCOME.NOT_APPLIED] };
  }
}