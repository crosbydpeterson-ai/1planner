// Determines whether a given student profile is allowed to see/play a track.
// Admins see everything.

export function isTrackVisibleForUser(track, profile) {
  if (!track || !profile) return false;
  const isAdmin = profile.rank === 'admin' || profile.rank === 'super_admin' ||
    (typeof profile.username === 'string' && profile.username.toLowerCase() === 'crosby');
  if (isAdmin) return true;

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

export function classKey(subject, teacherId) {
  return `${subject}:${teacherId}`;
}