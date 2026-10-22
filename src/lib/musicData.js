import { base44 } from '@/api/base44Client';
import { safeRead } from '@/lib/dataCache';

/**
 * The shared music catalog read (tracks + playlists).
 *
 * One cached read serves the Study Music page, the Home music widget and the
 * collectible catalogs, so the same library and the same playlist data back
 * every availability decision — and opening a second surface costs no request.
 * safeRead already dedupes in-flight calls and backs off a rate limit.
 *
 * Sort order matches what the Music page has always used (newest first).
 */
const TTL = 180_000;
const asArray = (value) => (Array.isArray(value) ? value : value?.items || []);

export function loadMusicCatalogs({ ttl = TTL } = {}) {
  return safeRead(
    'music:catalogs',
    async () => {
      const [tracks, playlists] = await Promise.all([
        base44.entities.MusicTrack.list('-created_date'),
        base44.entities.Playlist.list('-created_date'),
      ]);
      return { tracks: asArray(tracks), playlists: asArray(playlists) };
    },
    { ttl }
  );
}