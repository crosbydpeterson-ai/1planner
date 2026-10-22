import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import { getRewardLane } from '@/lib/seasonStudio';
import { findPet, findTheme, findTrack } from '@/lib/widgetAssets';
import { getUnlockedTrackIds, isTrackVisibleForUser, isPlayableTrack } from '@/lib/musicAccess';

/**
 * Wishlist sources.
 *
 * Builds the list of things a student may put on their wishlist — from the
 * catalogs the app already publishes, never from hidden or unreleased assets —
 * and labels where each one actually comes from, so a gift-only pet is never
 * presented as something you simply earn.
 */

/** Canonical ids match existing inventory conventions: custom pets/themes are "custom_<id>". */
export const customId = (id) => `custom_${id}`;

function seasonRewardFor(seasons, kind, id) {
  for (const season of seasons || []) {
    const rewards = season?.rewards || [];
    for (let i = 0; i < rewards.length; i++) {
      const reward = rewards[i];
      if (reward?.type !== kind) continue;
      if ((reward.value || reward.name) === id) {
        return { season, lane: getRewardLane(reward, i) };
      }
    }
  }
  return null;
}

/** A short, accurate origin label for one wishlist item. */
export function describeItemSource(kind, id, { seasons = [], catalogs = {}, profile } = {}) {
  if (kind === 'pet' || kind === 'theme') {
    const record = kind === 'pet' ? findPet(id, catalogs) : findTheme(id, catalogs);
    const fromSeason = seasonRewardFor(seasons, kind, id);
    if (fromSeason) {
      return `${fromSeason.season.name}${fromSeason.lane === 'plus' ? ' · Plus reward' : ' reward'}`;
    }
    if (record?.isGiftOnly) return 'Gift-only';
    const xpRequired = Number(record?.xpRequired) || 0;
    if (xpRequired > 0) return `Unlocks at ${xpRequired} XP`;
    return kind === 'pet' ? 'Collection pet' : 'Collection theme';
  }

  if (kind === 'title') {
    const fromSeason = seasonRewardFor(seasons, 'title', id);
    if (fromSeason) {
      return `${fromSeason.season.name}${fromSeason.lane === 'plus' ? ' · Plus reward' : ' title'}`;
    }
    return 'Special title';
  }

  if (kind === 'song') {
    const track = findTrack(id, catalogs);
    if (!track) return 'No longer available';
    if (track.isActive === false) return 'Not available';
    if (track.isSeasonExclusive) {
      const unlocked = getUnlockedTrackIds(profile, catalogs?.playlists || []);
      return isTrackVisibleForUser(track, profile, unlocked) ? '1Pass reward · unlocked' : '1Pass reward';
    }
    const unlocked = getUnlockedTrackIds(profile, catalogs?.playlists || []);
    if (!isPlayableTrack(track, profile, unlocked)) return 'Not available to your class';
    return 'Music library';
  }

  return '';
}

/**
 * Everything selectable right now, grouped by kind.
 * Songs are filtered with the same visibility rules as the Music page, so a
 * locked or class-restricted track is never offered.
 */
export function buildWishlistCatalogs({ catalogs = {}, seasons = [], profile }) {
  const pets = [
    ...PETS.map((p) => ({ kind: 'pet', id: p.id, label: p.name, emoji: p.emoji || '🐾', imageUrl: null })),
    ...(catalogs.pets || []).map((p) => ({
      kind: 'pet',
      id: customId(p.id),
      label: p.name || 'Custom pet',
      emoji: p.emoji || '🐾',
      imageUrl: p.imageUrl || null,
    })),
  ];

  const themes = [
    ...THEMES.map((t) => ({ kind: 'theme', id: t.id, label: t.name, emoji: '🎨' })),
    ...(catalogs.themes || []).map((t) => ({
      kind: 'theme',
      id: customId(t.id),
      label: t.name || 'Custom theme',
      emoji: '🎨',
    })),
  ];

  const titleSet = new Map();
  (seasons || []).forEach((season) => {
    (season?.rewards || []).forEach((reward) => {
      if (reward?.type === 'title' && reward.value) titleSet.set(reward.value, reward.value);
    });
  });
  (profile?.unlockedTitles || []).forEach((title) => {
    if (title) titleSet.set(title, title);
  });
  const titles = Array.from(titleSet.values()).map((title) => ({
    kind: 'title',
    id: title,
    label: title,
    emoji: '🏷️',
  }));

  const unlocked = getUnlockedTrackIds(profile, catalogs.playlists || []);
  const songs = (catalogs.tracks || [])
    .filter((t) => isPlayableTrack(t, profile, unlocked))
    .map((t) => ({ kind: 'song', id: t.id, label: t.title || 'Song', emoji: '🎵' }));

  return { pets, themes, titles, songs };
}