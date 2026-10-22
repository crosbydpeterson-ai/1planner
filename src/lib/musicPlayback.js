import { safeRead, getAppSettings } from '@/lib/dataCache';
import { loadMusicCatalogs } from '@/lib/musicData';
import { getUnlockedTrackIds, isPlayableTrack } from '@/lib/musicAccess';
import { checkFeatureLock } from '@/lib/featureLocks';

/**
 * Shared playback authorization for music.
 *
 * This is the piece that keeps "can this student still play this song?" in one
 * place for every surface: the Study Music page, the Home music widget and the
 * collectible widgets all resolve the same catalogs, the same unlock set
 * (direct song awards plus playlist-derived ones) and the same feature lock.
 *
 * The catalogs and the feature locks are cached (reusing the app's safeRead
 * layer); the profile is never cached here, so an unlock claimed a second ago
 * is honoured immediately.
 */
const TTL = 30_000;

export function loadMusicAccessContext() {
  return safeRead(
    'music:accessContext',
    async () => {
      const [catalogs, settings] = await Promise.all([loadMusicCatalogs(), getAppSettings()]);
      const locks = (settings || []).find((s) => s.key === 'feature_locks')?.value || null;
      return { catalogs, locks };
    },
    { ttl: TTL }
  );
}

export function buildPlaybackAccess(profile, context) {
  const catalogs = context?.catalogs || { tracks: [], playlists: [] };
  const unlockedTrackIds = getUnlockedTrackIds(profile, catalogs.playlists);
  const lock = checkFeatureLock(context?.locks || null, profile, 'music');
  return {
    unlockedTrackIds,
    featureLocked: lock.locked,
    featureMessage: lock.message,
  };
}

/** May this student start this track right now? (feature lock + playable rule) */
export function canPlayTrack(track, profile, access) {
  if (!track || !profile || !access) return false;
  if (access.featureLocked) return false;
  return isPlayableTrack(track, profile, access.unlockedTrackIds);
}