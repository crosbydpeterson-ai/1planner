// Shared feature lock utilities — used by pages, admin panel, and LockedOverlay

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

// ─── Design option catalogs ───────────────────────────────

export const LAYOUT_OPTIONS = [
  { key: 'centered', label: 'Centered', emoji: '🎯' },
  { key: 'top', label: 'Top-aligned', emoji: '⬆️' },
  { key: 'left', label: 'Left card', emoji: '⬅️' },
  { key: 'split', label: 'Split screen', emoji: '↔️' },
];

export const CARD_STYLES = [
  { key: 'rounded', label: 'Rounded', desc: 'Soft rounded card' },
  { key: 'glass', label: 'Glassmorphism', desc: 'Frosted translucent' },
  { key: 'flat', label: 'Flat', desc: 'No shadow, minimal' },
  { key: 'bordered', label: 'Bordered', desc: 'Bold accent border' },
  { key: 'floating', label: 'Floating', desc: 'Large shadow, lifted' },
];

export const BUTTON_STYLES = [
  { key: 'rounded', label: 'Rounded' },
  { key: 'pill', label: 'Pill' },
  { key: 'square', label: 'Square' },
  { key: 'gradient', label: 'Gradient' },
  { key: 'outline', label: 'Outline' },
  { key: 'glow', label: 'Glow' },
];

export const ANIMATION_OPTIONS = [
  { key: 'fade', label: 'Fade In', emoji: '🌫️' },
  { key: 'slide', label: 'Slide Up', emoji: '📈' },
  { key: 'bounce', label: 'Bounce', emoji: '🏀' },
  { key: 'zoom', label: 'Zoom', emoji: '🔍' },
  { key: 'flip', label: 'Flip', emoji: '🔄' },
  { key: 'none', label: 'None', emoji: '⏸️' },
];

export const FONT_OPTIONS = [
  { key: 'system', label: 'System Default', stack: 'ui-sans-serif, system-ui, sans-serif' },
  { key: 'serif', label: 'Serif', stack: 'Georgia, "Times New Roman", serif' },
  { key: 'mono', label: 'Monospace', stack: 'ui-monospace, "Courier New", monospace' },
  { key: 'rounded', label: 'Rounded', stack: '"Nunito", "Quicksand", ui-sans-serif, sans-serif' },
  { key: 'display', label: 'Display Bold', stack: '"Arial Black", "Helvetica Neue", sans-serif' },
];

// ─── Theme Library ────────────────────────────────────────

export const THEME_LIBRARY = [
  // ── Dark ──
  { name: 'Dark Fantasy', category: 'Dark', bg: '#1e1b4b', card: '#ffffff', text: '#1e293b', accent: '#ef4444', btn: '#6366f1', btnText: '#ffffff', emoji: '🔒', bgImage: '' },
  { name: 'Midnight', category: 'Dark', bg: '#0f172a', card: '#1e293b', text: '#f1f5f9', accent: '#f59e0b', btn: '#8b5cf6', btnText: '#ffffff', emoji: '🌙', bgImage: '' },
  { name: 'Pure Black', category: 'Dark', bg: '#000000', card: '#111827', text: '#f9fafb', accent: '#ef4444', btn: '#ef4444', btnText: '#ffffff', emoji: '⚫', bgImage: '' },
  { name: 'Deep Space', category: 'Dark', bg: '#020617', card: '#0f172a', text: '#e2e8f0', accent: '#6366f1', btn: '#4f46e5', btnText: '#ffffff', emoji: '🚀', bgImage: '' },
  { name: 'Carbon', category: 'Dark', bg: '#18181b', card: '#27272a', text: '#fafafa', accent: '#a78bfa', btn: '#71717a', btnText: '#ffffff', emoji: '⚙️', bgImage: '' },
  { name: 'Obsidian', category: 'Dark', bg: '#1c1917', card: '#292524', text: '#fafaf9', accent: '#f97316', btn: '#f97316', btnText: '#ffffff', emoji: '🪨', bgImage: '' },

  // ── Light ──
  { name: 'Clean White', category: 'Light', bg: '#f8fafc', card: '#ffffff', text: '#1e293b', accent: '#3b82f6', btn: '#3b82f6', btnText: '#ffffff', emoji: '✨', bgImage: '' },
  { name: 'Cloud', category: 'Light', bg: '#f0f9ff', card: '#ffffff', text: '#0c4a6e', accent: '#0ea5e9', btn: '#0284c7', btnText: '#ffffff', emoji: '☁️', bgImage: '' },
  { name: 'Pearl', category: 'Light', bg: '#fdf4ff', card: '#ffffff', text: '#581c87', accent: '#d946ef', btn: '#c026d3', btnText: '#ffffff', emoji: '🤍', bgImage: '' },
  { name: 'Mint', category: 'Light', bg: '#f0fdf4', card: '#ffffff', text: '#14532d', accent: '#22c55e', btn: '#16a34a', btnText: '#ffffff', emoji: '🌿', bgImage: '' },
  { name: 'Cream', category: 'Light', bg: '#fefce8', card: '#ffffff', text: '#713f12', accent: '#eab308', btn: '#ca8a04', btnText: '#ffffff', emoji: '🧈', bgImage: '' },

  // ── Vibrant ──
  { name: 'Sunset', category: 'Vibrant', bg: '#7c2d12', card: '#fff7ed', text: '#7c2d12', accent: '#f97316', btn: '#ea580c', btnText: '#ffffff', emoji: '🌅', bgImage: '' },
  { name: 'Royal', category: 'Vibrant', bg: '#581c87', card: '#faf5ff', text: '#581c87', accent: '#a855f7', btn: '#7c3aed', btnText: '#ffffff', emoji: '👑', bgImage: '' },
  { name: 'Neon', category: 'Vibrant', bg: '#0a0a0a', card: '#1a1a2e', text: '#00ff9f', accent: '#ff00ff', btn: '#00ff9f', btnText: '#0a0a0a', emoji: '💡', bgImage: '' },
  { name: 'Cyberpunk', category: 'Vibrant', bg: '#0d0221', card: '#190b28', text: '#ff2079', accent: '#00f0ff', btn: '#ff2079', btnText: '#ffffff', emoji: '🤖', bgImage: '' },
  { name: 'Tropical', category: 'Vibrant', bg: '#064e3b', card: '#ecfdf5', text: '#064e3b', accent: '#10b981', btn: '#059669', btnText: '#ffffff', emoji: '🌴', bgImage: '' },
  { name: 'Cotton Candy', category: 'Vibrant', bg: '#fdf2f8', card: '#ffffff', text: '#831843', accent: '#ec4899', btn: '#f472b6', btnText: '#ffffff', emoji: '🍭', bgImage: '' },

  // ── Gaming ──
  { name: 'Retro Arcade', category: 'Gaming', bg: '#1a0033', card: '#2d004d', text: '#00ff41', accent: '#ff00ff', btn: '#00ff41', btnText: '#1a0033', emoji: '👾', bgImage: '' },
  { name: 'Console', category: 'Gaming', bg: '#0f172a', card: '#1e293b', text: '#38bdf8', accent: '#38bdf8', btn: '#0ea5e9', btnText: '#ffffff', emoji: '🎮', bgImage: '' },
  { name: 'Speedrun', category: 'Gaming', bg: '#0c0a09', card: '#1c1917', text: '#fbbf24', accent: '#fbbf24', btn: '#f59e0b', btnText: '#0c0a09', emoji: '🏁', bgImage: '' },

  // ── Minimal ──
  { name: 'Mono Dark', category: 'Minimal', bg: '#18181b', card: '#27272a', text: '#e4e4e7', accent: '#a1a1aa', btn: '#52525b', btnText: '#ffffff', emoji: '◾', bgImage: '' },
  { name: 'Slate', category: 'Minimal', bg: '#f1f5f9', card: '#ffffff', text: '#334155', accent: '#64748b', btn: '#475569', btnText: '#ffffff', emoji: '⬜', bgImage: '' },
  { name: 'Stone', category: 'Minimal', bg: '#fafaf9', card: '#ffffff', text: '#44403c', accent: '#78716c', btn: '#57534e', btnText: '#ffffff', emoji: '🪨', bgImage: '' },

  // ── Nature ──
  { name: 'Ocean', category: 'Nature', bg: '#0c4a6e', card: '#ffffff', text: '#0c4a6e', accent: '#06b6d4', btn: '#0891b2', btnText: '#ffffff', emoji: '🌊', bgImage: '' },
  { name: 'Forest', category: 'Nature', bg: '#14532d', card: '#f0fdf4', text: '#14532d', accent: '#22c55e', btn: '#16a34a', btnText: '#ffffff', emoji: '🌲', bgImage: '' },
  { name: 'Volcano', category: 'Nature', bg: '#450a0a', card: '#fef2f2', text: '#450a0a', accent: '#ef4444', btn: '#dc2626', btnText: '#ffffff', emoji: '🌋', bgImage: '' },
  { name: 'Autumn', category: 'Nature', bg: '#422006', card: '#fffbeb', text: '#422006', accent: '#d97706', btn: '#b45309', btnText: '#ffffff', emoji: '🍂', bgImage: '' },
  { name: 'Aurora', category: 'Nature', bg: '#020617', card: '#0f172a', text: '#67e8f9', accent: '#34d399', btn: '#06b6d4', btnText: '#ffffff', emoji: '🌌', bgImage: '' },
];

export const THEME_CATEGORIES = ['All', 'Dark', 'Light', 'Vibrant', 'Gaming', 'Minimal', 'Nature'];

// ─── Defaults ─────────────────────────────────────────────

export const DEFAULT_LOCK_PAGE_CONFIG = {
  mode: 'custom',           // 'custom' | 'redirect'
  redirectUrl: '',          // when mode=redirect
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
  buttonAction: 'dashboard',  // 'dashboard' | 'redirect'
  buttonRedirectUrl: '',      // where button takes you
  buttonStyle: 'rounded',    // rounded | pill | square | gradient | outline | glow
  cardStyle: 'rounded',      // rounded | glass | flat | bordered | floating
  layout: 'centered',        // centered | top | left | split
  animation: 'fade',         // fade | slide | bounce | zoom | flip | none
  fontFamily: 'system',      // system | serif | mono | rounded | display
  showContact: true,
  contactText: 'Contact an admin for assistance.',
  backgroundImage: '',
  showSecretCode: false,     // show secret code unlock input
  secretCodeHint: '',        // hint text shown above the code input
  blurBackground: false,     // blur the background image
  overlayOpacity: 0.1,       // dark overlay opacity on bg image (0-1)
};

// ─── Lock checking ─────────────────────────────────────────

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

// ─── Secret code validation ────────────────────────────────

/**
 * Validate a secret code against the codes stored in featureLocks.codes.
 * Returns { valid, code, featureKey, reason }
 */
export function validateSecretCode(codes, code, featureKey) {
  if (!codes || !Array.isArray(codes) || !code) return { valid: false, reason: 'No code entered' };

  const entry = codes.find(c => c.code.toLowerCase() === code.trim().toLowerCase());
  if (!entry) return { valid: false, reason: 'Invalid code' };
  if (!entry.active) return { valid: false, reason: 'This code is no longer active' };

  if (entry.feature && entry.feature !== 'all' && entry.feature !== featureKey) {
    return { valid: false, reason: 'This code is for a different feature' };
  }

  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    return { valid: false, reason: 'This code has expired' };
  }

  if (entry.maxUses && entry.uses >= entry.maxUses) {
    return { valid: false, reason: 'This code has reached its usage limit' };
  }

  return { valid: true, code: entry.code, featureKey: entry.feature || featureKey };
}

/**
 * Generate a random secret code string.
 */
export function generateCodeString(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}