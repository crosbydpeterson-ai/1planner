import { base44 } from '@/api/base44Client';
import { PETS } from '@/components/quest/PetCatalog';
import {
  planRedemption,
  CUSTOM_PET_PREFIX,
  customPetStorageId,
  isCustomPetId,
} from '@/lib/redeemReward';

/**
 * A magic card can hand its linked account one reward the first time it is
 * scanned — a pet, 1Pass Plus, XP, coins or a title.
 *
 * It reuses the redeem code's own rules (`planRedemption`), so a card can never
 * grant something a code could not.
 */

export const REWARD_TYPES = ['pet', 'onepassplus', 'xp', 'coins', 'title'];

export const REWARD_TYPE_LABELS = {
  pet: 'Pet',
  onepassplus: '1Pass Plus',
  xp: 'XP',
  coins: 'Quest Coins',
  title: 'Title',
};

/** Built-in pets come from the catalog; custom pets live in the database. */
async function resolvePet(petId) {
  if (!petId) return null;
  if (isCustomPetId(petId)) {
    const found = await base44.entities.CustomPet.filter({
      id: petId.slice(CUSTOM_PET_PREFIX.length),
    });
    const pet = found[0];
    return pet ? { id: customPetStorageId(pet.id), name: pet.name, emoji: pet.emoji } : null;
  }
  const pet = PETS.find((p) => p.id === petId);
  return pet ? { id: pet.id, name: pet.name, emoji: pet.emoji } : null;
}

/** What the admin list and the login screen show for a card's reward. */
export const cardRewardLabel = (reward) => {
  if (!reward?.type) return '';
  if (reward.label) return reward.label;
  if (reward.type === 'pet') {
    const pet = PETS.find((p) => p.id === reward.petId);
    return pet ? `${pet.emoji} ${pet.name}` : 'Pet';
  }
  if (reward.type === 'onepassplus') return '⭐ 1Pass Plus';
  if (reward.type === 'xp') return `+${Number(reward.amount) || 0} XP`;
  if (reward.type === 'coins') return `+${Number(reward.amount) || 0} Quest Coins`;
  if (reward.type === 'title') return `Title: ${reward.title || ''}`.trim();
  return '';
};

/**
 * Grant a card's reward to one profile, at most once ever.
 * Returns { message, updated } when something was granted, otherwise null —
 * a card with no reward, an already-claimed reward, or a reward this student
 * already owns never blocks the login.
 */
export async function grantMagicCardReward(card, profile) {
  const reward = card?.reward;
  if (!reward?.type || !profile?.id) return null;

  const already = card.rewardGrantedProfileIds || [];
  if (already.includes(profile.id)) return null;

  // Claim first so a second scan in the same moment cannot grant twice.
  try {
    await base44.entities.MagicCard.update(card.id, {
      rewardGrantedProfileIds: [...already, profile.id],
    });
  } catch (e) {
    console.error('Could not claim the magic card reward:', e);
    return null;
  }

  try {
    const resolvedPet = reward.type === 'pet' ? await resolvePet(reward.petId) : null;
    const plan = planRedemption({
      rewardType: reward.type,
      rewardData: {
        petId: reward.petId,
        title: reward.title,
        amount: Number(reward.amount) || 0,
        // A card's Plus is permanent, the same as a Plus code with no seasons.
        seasons: 0,
      },
      profile,
      resolvedPet,
    });

    if (Object.keys(plan.updateData).length > 0) {
      await base44.entities.UserProfile.update(profile.id, plan.updateData);
    }
    return { message: plan.message, updated: { ...profile, ...plan.updateData } };
  } catch (e) {
    console.error('Magic card reward could not be applied:', e);
    // Nothing landed, so release the claim and let the student scan again.
    try {
      await base44.entities.MagicCard.update(card.id, {
        rewardGrantedProfileIds: already,
      });
    } catch {}
    return null;
  }
}