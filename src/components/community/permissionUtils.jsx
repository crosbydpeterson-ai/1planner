// Check if a user profile has a given permission.
// Class-based permissions are keyed by Teacher entity ID: math_<id>, reading_<id>.
// For 'whitelist' mode, channel object must be passed as 4th arg.
export function hasPermission(permission, profile, isAdmin, channel) {
  if (isAdmin) return true;
  if (permission === 'everyone') return true;
  if (permission === 'admin_only') return false;
  if (permission === 'nobody') return false;

  if (!profile) return false;

  // Whitelist: only profiles in channel.whitelistedProfileIds
  if (permission === 'whitelist') {
    if (!channel) return false;
    return (channel.whitelistedProfileIds || []).includes(profile.id);
  }

  // Class-based: math_<teacherId> or reading_<teacherId>
  if (permission.startsWith('math_')) {
    const teacherId = permission.replace('math_', '');
    return (profile.mathTeacher || '') === teacherId;
  }
  if (permission.startsWith('reading_')) {
    const teacherId = permission.replace('reading_', '');
    return (profile.readingTeacher || '') === teacherId;
  }

  return false;
}

// Check if a profile is banned from a channel
export function isProfileBannedFromChannel(channel, profileId) {
  if (!channel || !profileId) return false;
  return (channel.bannedProfileIds || []).includes(profileId);
}

// Base (non-class) permission options
const BASE_PERMISSION_OPTIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'admin_only', label: 'Admin Only' },
  { value: 'whitelist', label: '🔒 Selected Users Only' },
];

// Build permission options dynamically from the live teacher list.
// Class options are keyed by teacher ID so renames never orphan them.
export function buildPermissionOptions(teachers) {
  const math = (teachers?.math || []).map((t) => ({ value: `math_${t.id}`, label: `Math — ${t.name}` }));
  const reading = (teachers?.reading || []).map((t) => ({ value: `reading_${t.id}`, label: `Reading — ${t.name}` }));
  return [...BASE_PERMISSION_OPTIONS, ...math, ...reading];
}

export function buildCommentPermissionOptions(teachers) {
  return [{ value: 'nobody', label: 'Nobody' }, ...buildPermissionOptions(teachers)];
}

// Backwards-compatible static exports (base options only, no class options).
// Use buildPermissionOptions(teachers) for the full list including classes.
export const PERMISSION_OPTIONS = BASE_PERMISSION_OPTIONS;
export const COMMENT_PERMISSION_OPTIONS = [{ value: 'nobody', label: 'Nobody' }, ...BASE_PERMISSION_OPTIONS];

export function getPermissionLabel(value, teachers) {
  if (value === 'nobody') return 'Nobody';
  const all = buildPermissionOptions(teachers);
  return all.find((o) => o.value === value)?.label || value;
}