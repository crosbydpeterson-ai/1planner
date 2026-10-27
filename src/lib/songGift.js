import { base44 } from '@/api/base44Client';

/**
 * Gifting a song to one student, shared by the Admin dashboard gift dialog and
 * the messaging gift panel so both offer the same songs and grant them the same
 * way (a song is owned outright — see isPlayableTrack in musicAccess).
 */

/**
 * Songs an admin can gift, newest first. Switched-off songs are included on
 * purpose: a season-exclusive song is kept out of the public library and handed
 * to a student exactly like this.
 */
export async function loadGiftableTracks() {
  return (await base44.entities.MusicTrack.list('-created_date', 200)) || [];
}

/** The profile fields that unlock one song — empty when it is already owned. */
export function songGrantPatch(profile, trackId) {
  const current = profile?.unlockedTrackIds || [];
  if (!trackId || current.includes(trackId)) return {};
  return { unlockedTrackIds: [...current, trackId] };
}

/** Short state label for a song in a picker. */
export function describeTrack(track) {
  if (track?.isSeasonExclusive) return '1Pass song';
  if (track?.isActive === false) return 'hidden until awarded';
  return 'song';
}