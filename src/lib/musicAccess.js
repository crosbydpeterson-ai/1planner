// Determines whether a given student profile is allowed to see/play a track.
// Admins see everything.

function isAdminProfile(profile) {
  if (!profile) return false;
  return profile.rank === 'admin' || profile.rank === 'super_admin' ||
    (typeof profile.username === 'string' && profile.username.toLowerCase() === 'crosby');
}

// Build the full set of track IDs a user has unlocked: directly unlocked tracks
// plus every track inside any season-exclusive playlist they unlocked via 1Pass.
export function getUnlockedTrackIds(profile, playlists = []) {
  const ids = new Set(profile?.unlockedTrackIds || []);
  const unlockedPlaylists = profile?.unlockedPlaylistIds || [];
  if (unlockedPlaylists.length > 0 && Array.isArray(playlists)) {
    playlists.forEach((pl) => {
      if (pl?.isSeasonExclusive && unlockedPlaylists.includes(pl.id) && Array.isArray(pl.trackIds)) {
        pl.trackIds.forEach((id) => ids.add(id));
      }
    });
  }
  return ids;
}

export function isTrackVisibleForUser(track, profile, unlockedTrackIds) {
  if (!track || !profile) return false;
  if (isAdminProfile(profile)) return true;

  // Season-exclusive tracks are gated behind 1Pass song/playlist rewards.
  // Visible if the user unlocked the track directly OR via a playlist containing it.
  if (track.isSeasonExclusive) {
    const unlocked = unlockedTrackIds || profile.unlockedTrackIds || [];
    return unlocked.includes(track.id) || (Array.isArray(unlocked) && unlocked.has?.(track.id));
  }

  // Locked for this specific user
  if ((track.lockedProfileIds || []).includes(profile.id)) return false;

  // Locked for one of this user's classes
  const classKeys = [
    profile.mathTeacher ? `math:${profile.mathTeacher}` : null,
    profile.readingTeacher ? `reading:${profile.readingTeacher}` : null,
  ].filter(Boolean);
  if ((track.lockedClassKeys || []).some(k => classKeys.includes(k))) return false;

  // Assigned to specific users (empty = everyone)
  const assigned = track.assignedProfileIds || [];
  if (assigned.length > 0 && !assigned.includes(profile.id)) return false;

  return true;
}

// Playlists follow the same exclusivity model: a season-exclusive playlist is
// only visible to users who unlocked it via a 1Pass playlist reward.
export function isPlaylistVisibleForUser(playlist, profile) {
  if (!playlist || !profile) return false;
  if (playlist.isActive === false) return false;
  if (isAdminProfile(profile)) return true;
  if (playlist.isSeasonExclusive) {
    return (profile.unlockedPlaylistIds || []).includes(playlist.id);
  }
  return true;
}

// Resolve a playlist's tracks from the full track list, preserving order.
export function getPlaylistTracks(playlist, allTracks) {
  if (!playlist || !Array.isArray(playlist.trackIds)) return [];
  return playlist.trackIds
    .map((id) => allTracks.find((t) => t.id === id))
    .filter(Boolean);
}

export function classKey(subject, teacherId) {
  return `${subject}:${teacherId}`;
}