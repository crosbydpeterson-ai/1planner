// Shared feature lock utilities — used by pages and admin panel

export const LOCKABLE_FEATURES = [
  { key: 'games', label: 'Games', emoji: '🎮' },
  { key: 'shop', label: 'Shop', emoji: '🛒' },
  { key: 'market', label: 'Marketplace', emoji: '🏪' },
  { key: 'pets', label: 'Pets & Rewards', emoji: '🐾' },
  { key: 'battlePass', label: '1Pass / Season', emoji: '✨' },
  { key: 'kitchen', label: 'Kitchen', emoji: '👨‍🍳' },
  { key: 'eggs', label: 'Eggs', emoji: '🥚' },
  { key: 'community', label: 'Community', emoji: '💬' },
  { key: 'events', label: 'Events', emoji: '🎉' },
  { key: 'pawspell', label: 'Paw & Spell', emoji: '🦄' },
  { key: 'messages', label: 'Messages', emoji: '✉️' },
  { key: 'xpGain', label: 'XP Gain', emoji: '⚡' },
];

export const DEFAULT_LOCK_PAGE_CONFIG = {
  mode: 'custom', // 'custom' shows lock page, 'redirect' sends to URL
  redirectUrl: '',
  emoji: '🔒',
  title: 'Access Locked',
  message: 'This feature has been locked by an admin.',
  backgroundColor: '#1e1b4b',
  cardColor: '#ffffff',
  textColor: '#1e293b',
  accentColor: '#ef4444',
  buttonText: 'Back to Dashboard',
  buttonColor: '#6366f1',
  buttonTextColor: '#ffffff',
  showContact: true,
  contactText: 'Contact an admin for assistance.',
  backgroundImage: '',
};

/**
 * Check if a feature is locked for a given user profile.
 * Returns { locked: boolean, message: string }
 */
export function checkFeatureLock(locks, profile, featureKey) {
  if (!locks) return { locked: false, message: '' };

  const isAdmin = profile?.rank === 'admin' || profile?.rank === 'super_admin' ||
    (typeof profile?.username === 'string' && profile.username.toLowerCase() === 'crosby');
  if (isAdmin) return { locked: false, message: '' };

  const hasFeatureUnlock = (profile?.unlockedFeatures || []).includes(featureKey);
  if (hasFeatureUnlock) return { locked: false, message: '' };

  const userLock = locks.users?.[profile?.id]?.[featureKey];
  const globalLock = locks.global?.[featureKey];
  const mathLock = profile ? locks.classes?.math?.[profile.mathTeacher]?.[featureKey] : false;
  const readingLock = profile ? locks.classes?.reading?.[profile.readingTeacher]?.[featureKey] : false;

  const userLocked = typeof userLock === 'object' ? !!userLock.locked : !!userLock;
  const userMsg = typeof userLock === 'object' ? (userLock.message || '') : '';
  const isLocked = userLocked || !!globalLock || !!mathLock || !!readingLock;

  return { locked: isLocked, message: userMsg };
}

/**
 * Hook-style helper: returns lock config + lock page config from appSettings.
 */
export function parseLockSettings(appSettings) {
  const locksSetting = appSettings.find(s => s.key === 'feature_locks');
  const locks = locksSetting?.value || null;
  const pageSetting = appSettings.find(s => s.key === 'lock_page_config');
  const lockPageConfig = pageSetting?.value || DEFAULT_LOCK_PAGE_CONFIG;
  return { locks, lockPageConfig };
}