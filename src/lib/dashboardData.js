import { base44 } from '@/api/base44Client';
import { safeRead, getAppSettings } from '@/lib/dataCache';
import { isSeasonVisibleToStudents } from '@/lib/seasonStudio';
import { selectOnePassSeason } from '@/lib/seasonUtils';
import { resolveActiveWheel } from '@/lib/wheelLibrary';
import { getChicagoWeekRange } from '@/lib/weekWrapped';

/**
 * Shared reads for the optional Home widgets.
 *
 * Every loader goes through `safeRead`, which is the app's existing
 * rate-limit-aware layer: identical calls made by several widgets at the same
 * time join one request, results are cached briefly, and a 429 is waited out
 * with bounded backoff instead of a retry storm. So a widget can load its own
 * data on mount without the dashboard fetching the same table once per widget,
 * and no widget needs a polling timer.
 *
 * Loaders only run when the widget that needs them is actually on the page.
 */
const asArray = (value) => (Array.isArray(value) ? value : value?.items || []);

const TTL = {
  short: 30_000,
  medium: 60_000,
  long: 180_000,
};

/** Every season students can see, newest first (published only). */
export function loadPublishedSeasons() {
  return safeRead(
    'seasons:published',
    async () => {
      const page = await base44.entities.Season.filter({}, { sort: '-startDate', limit: 24 });
      return asArray(page).filter(isSeasonVisibleToStudents);
    },
    { ttl: TTL.medium }
  );
}

/** All seasons, published or not — used only to read a linked wheel's dates. */
function loadAllSeasons() {
  return safeRead(
    'seasons:all',
    async () => {
      const page = await base44.entities.Season.filter({}, { sort: '-startDate', limit: 24 });
      return asArray(page);
    },
    { ttl: TTL.medium }
  );
}

/** The season 1Pass is currently showing a student (current, else next up). */
export async function loadActiveSeason() {
  const seasons = await loadPublishedSeasons();
  return selectOnePassSeason(seasons, new Date()) || null;
}

/** Active announcements, newest first (bounded). */
export function loadAnnouncements() {
  return safeRead(
    'announcements:active',
    async () => {
      const page = await base44.entities.Announcement.filter(
        { isActive: true },
        { sort: '-created_date', limit: 8 }
      );
      return asArray(page);
    },
    { ttl: TTL.short }
  );
}

/**
 * Events a student may be shown: only switched-on ones (a draft event has
 * isActive false and is never returned), bounded to a handful.
 */
export function loadRelevantEvents() {
  return safeRead(
    'events:relevant',
    async () => {
      const [adminPage, globalPage] = await Promise.all([
        base44.entities.AdminEvent.filter({ isActive: true }, { limit: 8 }).catch(() => []),
        base44.entities.GlobalEvent.filter({ isActive: true }, { limit: 4 }).catch(() => []),
      ]);
      return {
        adminEvents: asArray(adminPage),
        globalEvents: asArray(globalPage),
      };
    },
    { ttl: TTL.short }
  );
}

/** The daily-rewards configuration (shared AppSetting). */
export function loadDailyConfig() {
  return safeRead(
    'dailyRewardsConfig',
    async () => {
      const settings = await getAppSettings();
      const record = (settings || []).find((s) => s.key === 'daily_rewards_config');
      return record ? record.value : null;
    },
    { ttl: TTL.medium }
  );
}

/**
 * The wheels actually available to this student right now, using the existing
 * wheel-library rules (schedule, season dates, fallback, destination), plus
 * their own progress record and the daily config.
 */
export function loadWheelWindow(profileId) {
  return safeRead(
    `wheelWindow:${profileId}`,
    async () => {
      const seasons = await loadAllSeasons().catch(async () => loadPublishedSeasons().catch(() => []));
      const [daily, bonus, config, progressRaw] = await Promise.all([
        resolveActiveWheel('daily', seasons).catch(() => null),
        resolveActiveWheel('bonus', seasons).catch(() => null),
        loadDailyConfig().catch(() => null),
        base44.entities.DailyRewardProgress.filter({ userProfileId: profileId }).catch(() => []),
      ]);
      return {
        daily,
        bonus,
        config,
        progress: asArray(progressRaw)[0] || null,
        seasons,
      };
    },
    { ttl: TTL.short }
  );
}

/**
 * Recently earned collectibles, from recorded outcomes only. Empty means no
 * recorded history — callers must fall back to an honest "spotlight" rather
 * than treating the inventory order as a timeline.
 */
export function loadRecentAcquisitions(profileId) {
  return safeRead(
    `acquisitions:${profileId}`,
    async () => {
      const page = await base44.entities.AnalyticsAction.filter(
        {
          profileId,
          rewardType: { $in: ['pet', 'theme', 'title', 'song', 'playlist'] },
        },
        { sort: '-timestamp', limit: 6 }
      );
      return asArray(page);
    },
    { ttl: TTL.short }
  );
}

/** This profile's recorded outcomes since the start of the current Chicago week. */
export function loadWeekHistory(profileId, now = new Date()) {
  const range = getChicagoWeekRange(now);
  return safeRead(
    `weekHistory:${profileId}:${range.startKey}`,
    async () => {
      const page = await base44.entities.AnalyticsAction.filter(
        { profileId, timestamp: { $gte: range.startUtc.toISOString() } },
        { sort: '-timestamp', limit: 200 }
      );
      return asArray(page);
    },
    { ttl: TTL.short }
  );
}

/**
 * Collectible catalogs used to put names and artwork on saved references.
 * Shared by the reward goal, collection and wishlist widgets so the tables are
 * read once, not once per widget.
 */
export function loadAssetCatalogs() {
  return safeRead(
    'assetCatalogs',
    async () => {
      const [pets, themes, tracks, playlists] = await Promise.all([
        base44.entities.CustomPet.list().catch(() => []),
        base44.entities.CustomTheme.list().catch(() => []),
        base44.entities.MusicTrack.list().catch(() => []),
        base44.entities.Playlist.list().catch(() => []),
      ]);
      return {
        pets: asArray(pets),
        themes: asArray(themes),
        tracks: asArray(tracks),
        playlists: asArray(playlists),
      };
    },
    { ttl: TTL.long }
  );
}

/** One custom pet by id (the equipped custom pet's name/artwork). */
export function loadPetById(customPetId) {
  if (!customPetId) return Promise.resolve(null);
  return safeRead(
    `customPet:${customPetId}`,
    async () => {
      const rows = await base44.entities.CustomPet.filter({ id: customPetId });
      return asArray(rows)[0] || null;
    },
    { ttl: TTL.long }
  );
}