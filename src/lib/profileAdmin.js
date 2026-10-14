/**
 * Check if a profile is an admin based on the `rank` field.
 * No extra API call needed — the profile already carries its rank.
 *
 * This replaces the old pattern of calling UserProfile.list('created_date', 1)
 * just to see if the current user was the first profile ever created.
 */
export function checkIsAdmin(profile) {
  if (!profile) return false;
  const nameIsCrosby =
    typeof profile.username === 'string' && profile.username.toLowerCase() === 'crosby';
  return profile.rank === 'super_admin' || profile.rank === 'admin' || nameIsCrosby;
}