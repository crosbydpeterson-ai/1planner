import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';

// ─── Rarity Tiers ──────────────────────────────────────────────────────────
export const NOTEBOOK_RARITIES = {
  super_rare: {
    label: 'Super Rare',
    color: '#3b82f6',
    gradient: 'from-blue-400 via-blue-500 to-blue-600',
    glow: '#3b82f680',
    textColor: 'text-blue-200',
    dropChance: 0.35,     // 35% chance a notebook drops at all, then this is relative weight
    weight: 45,
    itemCount: 1,
    bgClass: 'bg-blue-950',
  },
  epic: {
    label: 'Epic',
    color: '#a855f7',
    gradient: 'from-purple-400 via-purple-500 to-pink-500',
    glow: '#a855f780',
    textColor: 'text-purple-200',
    weight: 30,
    itemCount: 2,
    bgClass: 'bg-purple-950',
  },
  legendary: {
    label: 'Legendary',
    color: '#f59e0b',
    gradient: 'from-yellow-400 via-amber-400 to-orange-500',
    glow: '#f59e0b80',
    textColor: 'text-amber-200',
    weight: 15,
    itemCount: 4,
    bgClass: 'bg-amber-950',
  },
  mythic: {
    label: 'Mythic',
    color: '#ec4899',
    gradient: 'from-pink-400 via-rose-500 to-red-500',
    glow: '#ec489980',
    textColor: 'text-pink-200',
    weight: 7,
    itemCount: 6,
    bgClass: 'bg-rose-950',
  },
  ultra: {
    label: 'Ultra',
    color: '#ffffff',
    gradient: 'from-white via-cyan-200 to-indigo-300',
    glow: '#ffffff80',
    textColor: 'text-white',
    weight: 3,
    itemCount: 8,
    bgClass: 'bg-slate-950',
  },
};

// ─── Loot pool per rarity ──────────────────────────────────────────────────
const XP_POOL = {
  super_rare: [{ type: 'xp', amount: 15, label: '+15 XP', emoji: '⚡' }, { type: 'xp', amount: 25, label: '+25 XP', emoji: '⚡' }],
  epic:       [{ type: 'xp', amount: 30, label: '+30 XP', emoji: '⚡' }, { type: 'xp', amount: 50, label: '+50 XP', emoji: '⚡' }],
  legendary:  [{ type: 'xp', amount: 75, label: '+75 XP', emoji: '⚡' }, { type: 'xp', amount: 100, label: '+100 XP', emoji: '⚡' }],
  mythic:     [{ type: 'xp', amount: 150, label: '+150 XP', emoji: '⚡' }, { type: 'xp', amount: 200, label: '+200 XP', emoji: '⚡' }],
  ultra:      [{ type: 'xp', amount: 300, label: '+300 XP', emoji: '⚡' }, { type: 'xp', amount: 500, label: '+500 XP', emoji: '⚡' }],
};

const COIN_POOL = {
  super_rare: [{ type: 'coins', amount: 5, label: '+5 Coins', emoji: '🪙' }],
  epic:       [{ type: 'coins', amount: 10, label: '+10 Coins', emoji: '🪙' }, { type: 'coins', amount: 15, label: '+15 Coins', emoji: '🪙' }],
  legendary:  [{ type: 'coins', amount: 25, label: '+25 Coins', emoji: '🪙' }, { type: 'coins', amount: 40, label: '+40 Coins', emoji: '🪙' }],
  mythic:     [{ type: 'coins', amount: 60, label: '+60 Coins', emoji: '🪙' }, { type: 'coins', amount: 80, label: '+80 Coins', emoji: '🪙' }],
  ultra:      [{ type: 'coins', amount: 100, label: '+100 Coins', emoji: '🪙' }, { type: 'coins', amount: 150, label: '+150 Coins', emoji: '🪙' }],
};

// Build pet loot items from the catalog
const petItems = (rarities) =>
  PETS.filter(p => rarities.includes(p.rarity)).map(p => ({
    type: 'pet',
    value: p.id,
    label: p.name,
    emoji: p.emoji,
    rarity: p.rarity,
  }));

// Build theme loot items
const themeItems = (rarities) =>
  THEMES.filter(t => rarities.includes(t.rarity)).map(t => ({
    type: 'theme',
    value: t.id,
    label: t.name,
    emoji: '🎨',
    rarity: t.rarity,
  }));

const LOOT_POOLS = {
  super_rare: [
    ...XP_POOL.super_rare,
    ...COIN_POOL.super_rare,
    ...petItems(['common']),
    ...themeItems(['common']),
  ],
  epic: [
    ...XP_POOL.epic,
    ...COIN_POOL.epic,
    ...petItems(['common', 'uncommon']),
    ...themeItems(['uncommon']),
  ],
  legendary: [
    ...XP_POOL.legendary,
    ...COIN_POOL.legendary,
    ...petItems(['uncommon', 'rare']),
    ...themeItems(['rare']),
    { type: 'magic_egg', label: 'Magic Egg', emoji: '🥚' },
  ],
  mythic: [
    ...XP_POOL.mythic,
    ...COIN_POOL.mythic,
    ...petItems(['rare', 'epic']),
    ...themeItems(['epic']),
    { type: 'magic_egg', label: 'Magic Egg', emoji: '🥚' },
    { type: 'title', value: 'Notebook Hunter', label: 'Notebook Hunter Title', emoji: '🏷️' },
  ],
  ultra: [
    ...XP_POOL.ultra,
    ...COIN_POOL.ultra,
    ...petItems(['epic', 'legendary']),
    ...themeItems(['legendary']),
    { type: 'magic_egg', label: 'Magic Egg', emoji: '🥚' },
    { type: 'title', value: 'Ultra Scholar', label: 'Ultra Scholar Title', emoji: '🏷️' },
    { type: 'title', value: 'The Unstoppable', label: 'The Unstoppable Title', emoji: '🏷️' },
  ],
};

// ─── Roll a notebook rarity ────────────────────────────────────────────────
export function rollNotebookRarity() {
  // 30% chance any drop happens at all
  if (Math.random() > 0.30) return null;

  const totalWeight = Object.values(NOTEBOOK_RARITIES).reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const [key, rarity] of Object.entries(NOTEBOOK_RARITIES)) {
    roll -= rarity.weight;
    if (roll <= 0) return key;
  }
  return 'super_rare';
}

// ─── Roll items for a given rarity ────────────────────────────────────────
export function rollNotebookItems(rarityKey, ownedPetIds = [], ownedThemeIds = []) {
  const rarity = NOTEBOOK_RARITIES[rarityKey];
  const pool = [...(LOOT_POOLS[rarityKey] || LOOT_POOLS.super_rare)];

  // Filter out already-owned pets & themes from pool
  const filtered = pool.filter(item => {
    if (item.type === 'pet' && ownedPetIds.includes(item.value)) return false;
    if (item.type === 'theme' && ownedThemeIds.includes(item.value)) return false;
    return true;
  });

  // Fallback to full pool if filtered too small
  const finalPool = filtered.length >= rarity.itemCount ? filtered : pool;
  const items = [];
  const used = new Set();

  for (let i = 0; i < rarity.itemCount && finalPool.length > 0; i++) {
    let attempts = 0;
    let pick;
    do {
      pick = finalPool[Math.floor(Math.random() * finalPool.length)];
      attempts++;
    } while (used.has(pick.label) && attempts < 20);
    used.add(pick.label);
    items.push(pick);
  }

  return items;
}

// ─── Apply drops to profile ────────────────────────────────────────────────
export async function applyNotebookDrops(profile, items, base44) {
  const updates = {};
  const summary = [];

  for (const item of items) {
    if (item.type === 'xp') {
      updates.xp = (updates.xp ?? profile.xp ?? 0) + item.amount;
      summary.push(`+${item.amount} XP`);
    } else if (item.type === 'coins') {
      updates.questCoins = (updates.questCoins ?? profile.questCoins ?? 0) + item.amount;
      summary.push(`+${item.amount} Coins`);
    } else if (item.type === 'pet') {
      const current = updates.unlockedPets ?? profile.unlockedPets ?? ['starter_slime'];
      if (!current.includes(item.value)) {
        updates.unlockedPets = [...current, item.value];
        summary.push(`Pet: ${item.label}`);
      }
    } else if (item.type === 'theme') {
      const current = updates.unlockedThemes ?? profile.unlockedThemes ?? [];
      if (!current.includes(item.value)) {
        updates.unlockedThemes = [...current, item.value];
        summary.push(`Theme: ${item.label}`);
      }
    } else if (item.type === 'title') {
      const current = updates.unlockedTitles ?? profile.unlockedTitles ?? [];
      if (!current.includes(item.value)) {
        updates.unlockedTitles = [...current, item.value];
        summary.push(`Title: ${item.label}`);
      }
    } else if (item.type === 'magic_egg') {
      // Create a magic egg for this user
      await base44.entities.MagicEgg.create({
        userId: profile.userId,
        isUsed: false,
        source: 'notebook_drop',
      });
      summary.push('Magic Egg 🥚');
    }
  }

  if (Object.keys(updates).length > 0) {
    await base44.entities.UserProfile.update(profile.id, updates);
  }

  return { updates, summary };
}