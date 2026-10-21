import { isPlusActive, plusExpiryForSeasons } from '@/lib/plusAccess';

/**
 * Redemption rules for redeem codes, kept away from the UI so they can be
 * exercised on their own.
 *
 * `planRedemption` is pure: it reads nothing and writes nothing. It returns the
 * profile fields to change, or throws an error marked `userFacing` when the
 * code must not be consumed at all (bad reward data, unknown type, reward the
 * student already has).
 */
export function redeemError(message) {
  return Object.assign(new Error(message), { userFacing: true });
}

/** Custom pets are stored on a profile as `custom_<CustomPet id>`. */
export const CUSTOM_PET_PREFIX = 'custom_';

export const isCustomPetId = (petId) =>
  typeof petId === 'string' && petId.startsWith(CUSTOM_PET_PREFIX);

export const customPetStorageId = (customPetDbId) => `${CUSTOM_PET_PREFIX}${customPetDbId}`;

const FEATURE_LABELS = {
  games: '🎮 Games',
  shop: '🛍️ Shop',
  market: '💰 Market',
  pets: '🐾 Pets',
  battlePass: '✨ 1Pass',
  kitchen: '🍳 Kitchen',
};

const petLabel = (pet) => `${pet.emoji || '🐾'} ${pet.name}`;

export function planRedemption({
  rewardType,
  rewardData = {},
  profile,
  seasons = [],
  resolvedPet = null,
  now = new Date(),
}) {
  const rd = rewardData || {};
  const updateData = {};

  if (rewardType === 'pet') {
    if (!resolvedPet) throw redeemError('This pet reward is not set up correctly — ask an admin.');
    const owned = profile.unlockedPets || [];
    if (owned.includes(resolvedPet.id)) throw redeemError(`You already own ${petLabel(resolvedPet)}!`);
    updateData.unlockedPets = [...owned, resolvedPet.id];
    return { updateData, message: `You unlocked ${petLabel(resolvedPet)}!` };
  }

  if (rewardType === 'title') {
    const title = typeof rd.title === 'string' ? rd.title.trim() : '';
    if (!title) throw redeemError('This title reward is missing its title — ask an admin.');
    const titles = profile.unlockedTitles || [];
    if (titles.includes(title)) throw redeemError(`You already have the title "${title}".`);
    updateData.unlockedTitles = [...titles, title];
    return { updateData, message: `You unlocked the title "${title}"!` };
  }

  if (rewardType === 'feature_unlock') {
    const feature = rd.feature;
    if (!feature) throw redeemError('This feature reward is not set up correctly — ask an admin.');
    const owned = profile.unlockedFeatures || [];
    if (owned.includes(feature)) throw redeemError('You already have access to that feature.');
    updateData.unlockedFeatures = [...owned, feature];
    return { updateData, message: `You unlocked ${FEATURE_LABELS[feature] || feature}!` };
  }

  if (rewardType === 'xp') {
    const amount = Number(rd.amount) || 0;
    if (amount <= 0) throw redeemError('This XP reward has no amount — ask an admin.');
    updateData.xp = (profile.xp || 0) + amount;
    return { updateData, message: `You earned +${amount} XP!` };
  }

  if (rewardType === 'coins') {
    const amount = Number(rd.amount) || 0;
    if (amount <= 0) throw redeemError('This coin reward has no amount — ask an admin.');
    updateData.questCoins = (profile.questCoins || 0) + amount;
    return { updateData, message: `You earned +${amount} Quest Coins!` };
  }

  if (rewardType === 'food_item') {
    if (!rd.itemId) throw redeemError('This food reward is not set up correctly — ask an admin.');
    return {
      updateData,
      foodItem: { itemId: rd.itemId, quantity: Number(rd.quantity) || 1 },
      message: 'You received a food item! 🍎',
    };
  }

  if (rewardType === 'onepassplus') {
    const seasonCount = Number(rd.seasons) || 0;

    // No season length on the code keeps the long-standing permanent grant.
    if (seasonCount <= 0) {
      updateData.has1PassPlus = true;
      return { updateData, message: 'You unlocked 1Pass Plus! ⭐' };
    }

    // Timed grants reuse the same fields admin gifts use: has1PassPlus,
    // plusSeasonsGranted and plusExpiresAt. If the length cannot be measured we
    // refuse rather than let a season-only code turn into permanent Plus.
    const expiry = plusExpiryForSeasons(seasons, seasonCount);
    if (!expiry || new Date(expiry).getTime() <= now.getTime()) {
      throw redeemError('This 1Pass Plus reward has no current season to run in — ask an admin.');
    }

    const currentExpiry = profile.plusExpiresAt ? new Date(profile.plusExpiresAt) : null;
    const lastsAtLeastAsLong =
      isPlusActive(profile, now) && (!currentExpiry || currentExpiry.getTime() >= new Date(expiry).getTime());
    if (lastsAtLeastAsLong) {
      throw redeemError('You already have 1Pass Plus that lasts at least this long — save this code for someone else.');
    }

    updateData.has1PassPlus = true;
    updateData.plusSeasonsGranted = seasonCount;
    updateData.plusExpiresAt = expiry;
    return {
      updateData,
      message:
        seasonCount === 1
          ? 'You unlocked 1Pass Plus for this season! ⭐'
          : `You unlocked 1Pass Plus for ${seasonCount} seasons! ⭐`,
    };
  }

  throw redeemError('This code has a reward we do not recognize yet — ask an admin.');
}