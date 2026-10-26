import { base44 } from '@/api/base44Client';

/**
 * Turns one approved AI reward idea into a real asset a season reward can hand
 * out.
 *
 * Titles and coin amounts need no asset at all. A pet is created for real — AI
 * artwork, name, rarity, description and the colour palette the claim flow uses
 * to unlock its matching theme — and a theme is created with a real palette, so
 * an approved suggestion is claimable straight away instead of sitting in the
 * season as an empty slot. Songs, playlists and food can only be picked by hand
 * from assets the school already has, so those come back empty on purpose.
 */

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const DEFAULT_COLORS = { primary: '#6366f1', secondary: '#a855f7', accent: '#f59e0b', bg: '#f8fafc' };

const isHex = (value) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value.trim());

const palette = (raw = {}) => ({
  primary: isHex(raw.primary) ? raw.primary.trim() : DEFAULT_COLORS.primary,
  secondary: isHex(raw.secondary) ? raw.secondary.trim() : DEFAULT_COLORS.secondary,
  accent: isHex(raw.accent) ? raw.accent.trim() : DEFAULT_COLORS.accent,
  bg: isHex(raw.bg) ? raw.bg.trim() : DEFAULT_COLORS.bg,
});

const rarityOf = (idea, lane) => (RARITIES.includes(idea?.rarity) ? idea.rarity : lane === 'plus' ? 'epic' : 'rare');

const nameOf = (idea, fallback) => String(idea?.name || idea?.label || fallback || '').trim();

const coinAmount = (idea) => {
  const amount = Number(idea?.amount);
  if (!Number.isFinite(amount) || amount <= 0) return 50;
  return Math.min(Math.round(amount), 500);
};

async function createPet(idea, lane, adminProfile) {
  const name = nameOf(idea, 'Season Pet') || 'Season Pet';
  const rarity = rarityOf(idea, lane);
  const theme = palette(idea?.colors);
  const description = String(idea?.description || '').trim() || `A season-exclusive pet: ${name}.`;
  const prompt =
    `Cute cartoon pet mascot for a kids school game, named "${name}". ${description} ` +
    `Adorable collectible-card art, bold clean outlines, friendly expression. ` +
    `Colour palette: ${theme.primary}, ${theme.secondary}, ${theme.accent}. ` +
    `Plain white background, centered, full body, no text.`;

  const art = await base44.integrations.Core.GenerateImage({ prompt });
  const imageUrl = art?.url || '';

  const pet = await base44.entities.CustomPet.create({
    name,
    rarity,
    xpRequired: 0,
    description,
    emoji: idea?.emoji || '🐾',
    imageUrl,
    isGiftOnly: false,
    theme,
    createdBy: adminProfile?.userId || 'season_ai',
    createdByProfileId: adminProfile?.id,
    createdSourceTab: 'admin_pets',
    imageSource: imageUrl ? 'ai_generated' : 'emoji_only',
  });

  return {
    value: `custom_${pet.id}`,
    name,
    registered: {
      pets: [
        {
          id: `custom_${pet.id}`,
          name,
          emoji: pet.emoji,
          image: imageUrl,
          subtitle: `${rarity} · new season reward`,
          giftOnly: false,
        },
      ],
    },
  };
}

async function createTheme(idea, lane) {
  const name = nameOf(idea, 'Season Theme') || 'Season Theme';
  const rarity = rarityOf(idea, lane);
  const colors = palette(idea?.colors);

  const theme = await base44.entities.CustomTheme.create({
    name,
    rarity,
    xpRequired: 0,
    description: String(idea?.description || '').trim() || `A season-exclusive theme: ${name}.`,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
    bgColor: colors.bg,
  });

  return {
    value: `custom_${theme.id}`,
    name,
    registered: {
      themes: [{ id: `custom_${theme.id}`, name, emoji: '🎨', subtitle: `${rarity} · new season reward` }],
    },
  };
}

/**
 * @returns {Promise<{value: string, name: string, registered?: object}>} the
 * value to store on the reward slot, its display name, and any asset the studio
 * should know about immediately.
 */
export async function createSeasonRewardAsset({ idea = {}, lane = 'free', adminProfile } = {}) {
  if (idea.type === 'title') {
    // A title reward stores the exact title text the student unlocks.
    const title = nameOf(idea, 'Season Champion') || 'Season Champion';
    return { value: title, name: title };
  }
  if (idea.type === 'coins') {
    return { value: String(coinAmount(idea)), name: '' };
  }
  if (idea.type === 'pet') return createPet(idea, lane, adminProfile);
  if (idea.type === 'theme') return createTheme(idea, lane);
  return { value: '', name: nameOf(idea, '') };
}