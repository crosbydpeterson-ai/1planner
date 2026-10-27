// Determines whether a given student profile is allowed to see/play a track.
//
// Precedence for a track (first match wins):
//   1. Admins (rank admin/super_admin, or the owner account "Crosby") see everything.
//   2. Season-exclusive tracks need a 1Pass unlock — either the track id itself
//      or a season-exclusive playlist containing it (getUnlockedTrackIds). An
//      explicit award therefore outranks a lock, which is the long-standing
//      behaviour on the Music page.
//   3. A per-user lock (lockedProfileIds) removes the track for that student.
//   4. A per-class lock (lockedClassKeys, keyed "math:<teacherId>") removes it
//      for every student in that class.
//   5. A track assigned to specific students (assignedProfileIds) is only for
//      them; an empty list means everyone.
// Ahead of all of the above, a track the student already owns — won from a wheel,
// a 1Pass reward or a redeem code — is always offered, even when it is switched
// off for the general library. See isPlayableTrack, which packages these rules so
// every surface offers exactly the same songs.

function isAdminProfile(profile) {
  if (!profile) return false;
  return profile.rank === 'admin' || profile.rank === 'super_admin' ||
    (typeof profile.username === 'string' && profile.username.toLowerCase() === 'crosby');
}

// Membership that works whether the caller holds an array (entity data) or a
// Set (what getUnlockedTrackIds returns).
function hasId(collection, id) {
  if (!collection || !id) return false;
  if (collection instanceof Set) return collection.has(id);
  if (Array.isArray(collection)) return collection.includes(id);
  return false;
}

function toIdList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (value instanceof Set) return Array.from(value);
  return [];
}

// Build the full set of track IDs a user has unlocked: directly unlocked tracks
// plus every track inside any season-exclusive playlist they unlocked via 1Pass.
// Returns a Set — callers may pass it (or a plain array) straight back into the
// visibility helpers.
export function getUnlockedTrackIds(profile, playlists = []) {
  const ids = new Set(toIdList(profile?.unlockedTrackIds));
  const unlockedPlaylists = toIdList(profile?.unlockedPlaylistIds);
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

  // Season-exclusive tracks are gated behind 1Pass song/playlist rewards:
  // visible when the user unlocked the track directly or via a playlist.
  if (track.isSeasonExclusive) {
    const unlocked = unlockedTrackIds || profile.unlockedTrackIds || [];
    return hasId(unlocked, track.id);
  }

  // Locked for this specific user
  if (toIdList(track.lockedProfileIds).includes(profile.id)) return false;

  // Locked for one of this user's classes
  const classKeys = [
    profile.mathTeacher ? `math:${profile.mathTeacher}` : null,
    profile.readingTeacher ? `reading:${profile.readingTeacher}` : null,
  ].filter(Boolean);
  if (toIdList(track.lockedClassKeys).some((k) => classKeys.includes(k))) return false;

  // Assigned to specific users (empty = everyone)
  const assigned = toIdList(track.assignedProfileIds);
  if (assigned.length > 0 && !assigned.includes(profile.id)) return false;

  return true;
}

/**
 * The one rule for "this student may actually play this track": the track is
 * still switched on and passes the visibility rules above. Used by the Music
 * page, the Home music widget and the collectible widgets so a song can never
 * be offered in one place and refused in another.
 */
export function isPlayableTrack(track, profile, unlockedTrackIds) {
  if (!track || !profile) return false;

  // A song the student owns — won from a wheel, a 1Pass reward or a redeem code —
  // is always playable. The Active switch and the locks below decide who may be
  // offered a song they have not earned; they must never take back one that was
  // already awarded, since admins keep season-exclusive songs switched off so they
  // stay out of the public library.
  if (hasId(unlockedTrackIds || profile.unlockedTrackIds || [], track.id)) return true;

  if (track.isActive === false) return false;
  return isTrackVisibleForUser(track, profile, unlockedTrackIds);
}

// Playlists follow the same exclusivity model: a season-exclusive playlist is
// only visible to users who unlocked it via a 1Pass playlist reward.
export function isPlaylistVisibleForUser(playlist, profile) {
  if (!playlist || !profile) return false;
  if (playlist.isActive === false) return false;
  if (isAdminProfile(profile)) return true;
  // A student's own playlist is theirs alone; the shared Playlists row stays the
  // library an admin curated (sharing posts a snapshot to the community).
  if (playlist.ownerProfileId) return playlist.ownerProfileId === profile.id;
  if (playlist.isSeasonExclusive) {
    return toIdList(profile.unlockedPlaylistIds).includes(playlist.id);
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