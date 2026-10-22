import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';

/**
 * Resolving reward/collectible references to something displayable.
 *
 * Reward types come from the existing systems: season and wheel rewards
 * (pet, theme, title, song, playlist, xp, coins) and 1Pass cosmetics. Ids use
 * the app's established conventions: built-in assets keep their catalog id,
 * custom ones are stored as "custom_<CustomPet/CustomTheme id>".
 */

export const REWARD_ICONS = {
  xp: '⚡',
  coins: '🪙',
  pet: '🐾',
  theme: '🎨',
  title: '🏷️',
  song: '🎵',
  playlist: '🎶',
  magic_egg: '🥚',
  food: '🍎',
  default: '🎁',
};

export const REWARD_KIND_LABELS = {
  xp: 'XP',
  coins: 'Coins',
  pet: 'Pet',
  theme: 'Theme',
  title: 'Title',
  song: 'Song',
  playlist: 'Playlist',
  magic_egg: 'Magic Egg',
  food: 'Food',
};

const asArray = (value) => (Array.isArray(value) ? value : value?.items || []);

export function findPet(petId, catalogs = {}) {
  if (!petId) return null;
  if (String(petId).startsWith('custom_')) {
    const id = String(petId).replace('custom_', '');
    return asArray(catalogs.pets).find((p) => p.id === id) || null;
  }
  return PETS.find((p) => p.id === petId) || null;
}

export function isCustomId(id) {
  return typeof id === 'string' && id.startsWith('custom_');
}

export function findTheme(themeId, catalogs = {}) {
  if (!themeId) return null;
  if (isCustomId(themeId)) {
    const id = String(themeId).replace('custom_', '');
    return asArray(catalogs.themes).find((t) => t.id === id) || null;
  }
  return THEMES.find((t) => t.id === themeId) || null;
}

export function findTrack(trackId, catalogs = {}) {
  if (!trackId) return null;
  return asArray(catalogs.tracks).find((t) => t.id === trackId) || null;
}

export function findPlaylist(playlistId, catalogs = {}) {
  if (!playlistId) return null;
  return asArray(catalogs.playlists).find((p) => p.id === playlistId) || null;
}

/**
 * Turn one reward reference into display data.
 * `missing: true` means the asset itself is gone — callers must show that
 * honestly instead of a blank slot.
 *
 * @returns {{ kind, id, label, emoji, imageUrl, color, missing, amount }}
 */
export function describeAsset(type, value, catalogs = {}, { amount = null, label = null } = {}) {
  const base = {
    kind: type,
    id: value || null,
    label: label || '',
    emoji: REWARD_ICONS[type] || REWARD_ICONS.default,
    imageUrl: null,
    color: null,
    missing: false,
    amount,
  };

  if (type === 'title') {
    return { ...base, label: label || value || 'Title', emoji: REWARD_ICONS.title };
  }

  if (type === 'xp' || type === 'coins') {
    const unit = type === 'coins' ? 'Coins' : 'XP';
    return { ...base, label: label || `${Number(amount) || 0} ${unit}`, amount: Number(amount) || 0 };
  }

  if (type === 'pet') {
    const pet = findPet(value, catalogs);
    if (!pet) return { ...base, label: label || 'Pet no longer available', missing: true };
    return {
      ...base,
      label: label || pet.name || 'Pet',
      emoji: pet.emoji || '🐾',
      imageUrl: pet.imageUrl || null,
      color: pet.theme?.primary || null,
    };
  }

  if (type === 'theme') {
    const theme = findTheme(value, catalogs);
    if (!theme) return { ...base, label: label || 'Theme no longer available', missing: true };
    return {
      ...base,
      label: label || theme.name || 'Theme',
      emoji: REWARD_ICONS.theme,
      color: theme.colors?.primary || theme.primaryColor || null,
    };
  }

  if (type === 'song') {
    const track = findTrack(value, catalogs);
    if (!track) return { ...base, label: label || 'Song no longer available', missing: true };
    return { ...base, label: label || track.title || 'Song', emoji: REWARD_ICONS.song };
  }

  if (type === 'playlist') {
    const playlist = findPlaylist(value, catalogs);
    if (!playlist) return { ...base, label: label || 'Playlist no longer available', missing: true };
    return { ...base, label: label || playlist.name || 'Playlist', emoji: REWARD_ICONS.playlist };
  }

  return { ...base, label: label || REWARD_KIND_LABELS[type] || 'Reward' };
}

/**
 * Whether the student already owns this asset, using the existing inventory
 * fields (never inferred from ordering).
 */
export function isAssetOwned(profile, type, value) {
  if (!profile || !value) return false;
  const lists = {
    pet: profile.unlockedPets,
    theme: profile.unlockedThemes,
    title: profile.unlockedTitles,
    song: profile.unlockedTrackIds,
    playlist: profile.unlockedPlaylistIds,
  };
  const list = lists[type];
  return Array.isArray(list) && list.includes(value);
}