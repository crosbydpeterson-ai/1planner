import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * AI generator for Spin Wheel prize sets + Daily Reward tracks.
 * Can invent new pets and themes on the fly by calling GenerateImage
 * and persisting CustomPet / CustomTheme entities.
 *
 * Actions:
 *  - "spin_wheel" : generate N prizes (weighted) for a Spin Wheel
 *  - "daily_track": generate rewards array for a 7/14/31 day streak
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, theme, count, scheduleType, createAssets } = body;

    if (action === 'spin_wheel') {
      return await generateSpinWheel(base44, { theme, count: count || 8, createAssets: createAssets !== false });
    }
    if (action === 'daily_track') {
      const period = scheduleType === 'streak14' ? 14 : scheduleType === 'monthly' ? 31 : 7;
      return await generateDailyTrack(base44, { theme, period, createAssets: createAssets !== false });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('generateRewardConfig error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

async function generateSpinWheel(base44, { theme, count, createAssets }) {
  const prompt = `You are designing a Spin Wheel prize pool for an educational kids' app.
Theme: "${theme || 'magical fantasy'}"

Create exactly ${count} creative prize entries. Balance common prizes (high weight) with rare prizes (low weight).

For each prize, pick a type from: xp, coins, gems, pet, theme, title.
- xp/coins/gems must have an amount (xp 20-500, coins 10-200, gems 1-10).
- pet/theme entries will become NEW AI-generated creatures/themes — give them a creative name + vivid visual description that fits the overall theme.
- title entries are unlockable status titles (short and punchy).
- label must be a fun short label shown on the wheel (max 12 chars).
- weight should make commons ~8-15, rares ~1-3, legendaries ~0.5.

Return JSON only.`;

  const schema = {
    type: 'object',
    properties: {
      prizes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            type: { type: 'string', enum: ['xp', 'coins', 'gems', 'pet', 'theme', 'title'] },
            amount: { type: 'number' },
            weight: { type: 'number' },
            creativeName: { type: 'string' },
            creativeDescription: { type: 'string' },
            rarity: { type: 'string', enum: RARITIES },
            visualPrompt: { type: 'string' },
            colors: {
              type: 'object',
              properties: {
                primary: { type: 'string' },
                secondary: { type: 'string' },
                accent: { type: 'string' },
                bg: { type: 'string' }
              }
            }
          },
          required: ['label', 'type', 'weight']
        }
      }
    },
    required: ['prizes']
  };

  const res = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: schema
  });

  const prizes = await materializePrizes(base44, res?.prizes || [], createAssets);
  return Response.json({ prizes });
}

async function generateDailyTrack(base44, { theme, period, createAssets }) {
  const prompt = `You are designing a ${period}-day Daily Reward track for an educational kids' app.
Theme: "${theme || 'adventure collection'}"

Create exactly ${period} daily reward slots, day 1 through day ${period}. The track should escalate — early days are small (xp/coins), milestone days (day 3, 5, 7, and final day) should feature a special reward like a new pet, theme, title, or a Spin Wheel.

Valid types: xp, coins, gems, pet, theme, title, wheel.
- xp 25-400, coins 20-250, gems 1-8 (scale with day number)
- pet/theme entries will become NEW AI-generated assets — include a creative name + vivid visual description matching the theme.
- Use "wheel" on up to 2 special days.

Return JSON only.`;

  const schema = {
    type: 'object',
    properties: {
      rewards: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['xp', 'coins', 'gems', 'pet', 'theme', 'title', 'wheel'] },
            amount: { type: 'number' },
            creativeName: { type: 'string' },
            creativeDescription: { type: 'string' },
            rarity: { type: 'string', enum: RARITIES },
            visualPrompt: { type: 'string' },
            colors: {
              type: 'object',
              properties: {
                primary: { type: 'string' },
                secondary: { type: 'string' },
                accent: { type: 'string' },
                bg: { type: 'string' }
              }
            }
          },
          required: ['type']
        }
      }
    },
    required: ['rewards']
  };

  const res = await base44.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: schema
  });

  const rewards = await materializePrizes(base44, res?.rewards || [], createAssets);
  return Response.json({ rewards });
}

/**
 * For entries of type "pet" or "theme", actually create CustomPet / CustomTheme rows
 * using GenerateImage, and rewrite the entry with value = id + name.
 */
async function materializePrizes(base44, entries, createAssets) {
  const out = [];
  for (const entry of entries) {
    try {
      if (!createAssets) {
        out.push(entry);
        continue;
      }
      if (entry.type === 'pet') {
        const pet = await createPetAsset(base44, entry);
        out.push({
          ...entry,
          value: `custom_${pet.id}`,
          name: pet.name,
          label: entry.label || pet.name,
        });
      } else if (entry.type === 'theme') {
        const theme = await createThemeAsset(base44, entry);
        out.push({
          ...entry,
          value: `custom_${theme.id}`,
          name: theme.name,
          label: entry.label || theme.name,
        });
      } else {
        out.push(entry);
      }
    } catch (e) {
      console.error('materialize error for entry', entry, e);
      // Fall back: push entry unmodified so the caller still sees the config
      out.push({ ...entry, _error: e.message });
    }
  }
  return out;
}

async function createPetAsset(base44, entry) {
  const name = entry.creativeName || 'Mystery Pet';
  const description = entry.creativeDescription || '';
  const rarity = entry.rarity || 'rare';
  const visualPrompt = entry.visualPrompt ||
    `${name}, ${description}, cute mascot creature, chibi style, soft shading, centered on transparent white background, vibrant colors`;

  const img = await base44.integrations.Core.GenerateImage({
    prompt: `${visualPrompt}. Clean illustrated creature, no text, high quality mascot art.`
  });

  const theme = entry.colors && (entry.colors.primary || entry.colors.accent) ? {
    primary: entry.colors.primary || '#6366f1',
    secondary: entry.colors.secondary || '#a5b4fc',
    accent: entry.colors.accent || '#f59e0b',
    bg: entry.colors.bg || '#f0f9ff',
  } : null;

  const xpRequired = rarityToXp(rarity);

  const pet = await base44.asServiceRole.entities.CustomPet.create({
    name,
    description,
    rarity,
    xpRequired,
    emoji: '',
    imageUrl: img?.url || '',
    theme,
    isGiftOnly: true,
    createdSourceTab: 'unknown',
    imageSource: 'ai_generated',
  });
  return pet;
}

async function createThemeAsset(base44, entry) {
  const name = entry.creativeName || 'Mystery Theme';
  const description = entry.creativeDescription || '';
  const rarity = entry.rarity || 'rare';
  const colors = entry.colors || {};
  const theme = await base44.asServiceRole.entities.CustomTheme.create({
    name,
    description,
    rarity,
    xpRequired: rarityToXp(rarity),
    primaryColor: colors.primary || '#6366f1',
    secondaryColor: colors.secondary || '#a5b4fc',
    accentColor: colors.accent || '#f59e0b',
    bgColor: colors.bg || '#f0f9ff',
  });
  return theme;
}

function rarityToXp(r) {
  return ({ common: 0, uncommon: 100, rare: 250, epic: 500, legendary: 1000 })[r] ?? 100;
}