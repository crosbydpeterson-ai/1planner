import { base44 } from '@/api/base44Client';

// Single source of truth for equip status, ownership, and equip actions.
// Shared by the Collection page (Rewards.jsx) and the Season Book Quick Equip
// so both pages always agree on what is equipped.

// --- Equipped-status checks ---

export function isPetEquipped(profile, petId) {
  return !!profile && !!petId && profile.equippedPetId === petId;
}

// A standalone theme is only visually active when no pet is equipped; a pet
// theme takes precedence. This mirrors the Collection page's check.
export function isThemeEquipped(profile, themeId) {
  return !!profile && !!themeId && !!profile.equippedThemeId && profile.equippedThemeId === themeId && !profile.equippedPetId;
}

export function isTitleEquipped(profile, title) {
  return !!profile && !!title && profile.equippedTitle === title;
}

// --- Ownership checks ---

export function isPetOwned(profile, petId) {
  return !!profile && (profile.unlockedPets || []).includes(petId);
}
export function isThemeOwned(profile, themeId) {
  return !!profile && (profile.unlockedThemes || []).includes(themeId);
}
export function isTitleOwned(profile, title) {
  return !!profile && !!title && (profile.unlockedTitles || []).includes(title);
}

async function reloadProfile(profileId) {
  const profiles = await base44.entities.UserProfile.filter({ id: profileId });
  return profiles[0] || null;
}

// --- Equip actions ---
// Each reloads the current profile, re-validates ownership against the live
// inventory, then saves only the equip fields. Returns:
//   { ok: true, profile } | { ok: false, error, profile? }
// error is one of: 'no_longer_owned' | 'update_failed' | 'invalid'
// On 'no_longer_owned' the fresh profile is returned so callers can refresh.

export async function equipPet(profile, petId) {
  if (!profile || !petId) return { ok: false, error: 'invalid' };
  try {
    const fresh = await reloadProfile(profile.id);
    if (!fresh || !isPetOwned(fresh, petId)) {
      return { ok: false, error: 'no_longer_owned', profile: fresh };
    }
    await base44.entities.UserProfile.update(profile.id, { equippedPetId: petId });
    return { ok: true, profile: { ...fresh, equippedPetId: petId } };
  } catch (e) {
    console.error('equipPet failed', e);
    return { ok: false, error: 'update_failed' };
  }
}

export async function equipTheme(profile, themeId) {
  if (!profile || !themeId) return { ok: false, error: 'invalid' };
  try {
    const fresh = await reloadProfile(profile.id);
    if (!fresh || !isThemeOwned(fresh, themeId)) {
      return { ok: false, error: 'no_longer_owned', profile: fresh };
    }
    // Standalone theme clears the equipped pet, matching the Collection page.
    await base44.entities.UserProfile.update(profile.id, { equippedThemeId: themeId, equippedPetId: null });
    return { ok: true, profile: { ...fresh, equippedThemeId: themeId, equippedPetId: null } };
  } catch (e) {
    console.error('equipTheme failed', e);
    return { ok: false, error: 'update_failed' };
  }
}

export async function equipTitle(profile, title) {
  if (!profile || !title) return { ok: false, error: 'invalid' };
  try {
    const fresh = await reloadProfile(profile.id);
    if (!fresh || !isTitleOwned(fresh, title)) {
      return { ok: false, error: 'no_longer_owned', profile: fresh };
    }
    // Toggle off if already equipped, matching the Collection page.
    const newTitle = fresh.equippedTitle === title ? '' : title;
    await base44.entities.UserProfile.update(profile.id, { equippedTitle: newTitle });
    return { ok: true, profile: { ...fresh, equippedTitle: newTitle } };
  } catch (e) {
    console.error('equipTitle failed', e);
    return { ok: false, error: 'update_failed' };
  }
}