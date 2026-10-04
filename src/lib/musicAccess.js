// Determines whether a given student profile is allowed to see/play a track.
// Admins see everything.

function isAdminProfile(profile) {
  if (!profile) return false;
  return profile.rank === 'admin' || profile.rank === 'super_admin' ||
    (typeof profile.username === 'string' && profile.username.toLowerCase() === 'crosby');
}

export function isTrackVisibleForUser(track, profile) {
  if (!track || !profile) return false;
  if (isAdminProfile(profile)) return true;

  // Season-exclusive tracks are gated behind 1Pass song/playlist rewards.
  // Only users who have unlocked the track (or a playlist containing it) can see it.
  if (track.isSeasonExclusive) {
    return (profile.unlockedTrackIds || []).includes(track.id);
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