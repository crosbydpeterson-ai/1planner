// Check if a user profile has a given permission
// For 'whitelist' mode, channel object must be passed as 4th arg
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

  // Class-based: math_<teacher> or reading_<teacher>
  if (permission.startsWith('math_')) {
    const teacher = permission.replace('math_', '');
    return (profile.mathTeacher || '').toLowerCase() === teacher.toLowerCase();
  }
  if (permission.startsWith('reading_')) {
    const teacher = permission.replace('reading_', '');
    return (profile.readingTeacher || '').toLowerCase() === teacher.toLowerCase();
  }

  return false;
}

// Check if a profile is banned from a channel
export function isProfileBannedFromChannel(channel, profileId) {
  if (!channel || !profileId) return false;
  return (channel.bannedProfileIds || []).includes(profileId);
}

// All permission options for selects
export const PERMISSION_OPTIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'admin_only', label: 'Admin Only' },
  { value: 'whitelist', label: '🔒 Selected Users Only' },
  { value: 'math_best', label: 'Math — Best' },
  { value: 'math_libbey', label: 'Math — Libbey' },
  { value: 'math_hannan', label: 'Math — Hannan' },
  { value: 'math_paulson', label: 'Math — Paulson' },
  { value: 'reading_riener', label: 'Reading — Riener' },
  { value: 'reading_libbey', label: 'Reading — Libbey' },
  { value: 'reading_hannan', label: 'Reading — Hannan' },
  { value: 'reading_paulson', label: 'Reading — Paulson' },
];

export const COMMENT_PERMISSION_OPTIONS = [
  { value: 'nobody', label: 'Nobody' },
  ...PERMISSION_OPTIONS,
];

export function getPermissionLabel(value) {
  const all = [...PERMISSION_OPTIONS, { value: 'nobody', label: 'Nobody' }];
  return all.find(o => o.value === value)?.label || value;
}