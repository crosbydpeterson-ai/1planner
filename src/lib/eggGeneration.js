import { base44 } from '@/api/base44Client';

const VALID_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export function sanitizeRarity(r) {
  return VALID_RARITIES.includes(r) ? r : 'rare';
}

// Step 1: Generate a pet concept (name, description, emoji, rarity, theme) via LLM
export async function generatePetConcept(petIdea) {
  const concept = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a magical creature designer for a KIDS school gamification app called Quest Planner.

A student wants to create their own custom magical companion using a Magic Egg!

Their idea: "${petIdea}"

WHAT YOU CAN CREATE (be creative!):
- Traditional pets, magical creatures, living objects, food creatures, nature spirits, abstract concepts, robots, mythical beings

CONTENT RULES (VERY IMPORTANT - THIS IS FOR CHILDREN):
- The creature MUST be appropriate for elementary/middle school kids
- NO violence, weapons, scary monsters, demons, or horror themes
- NO inappropriate content of any kind
- If the user's idea is inappropriate, create a SAFE alternative

Generate a fun, school-appropriate magical companion. It should:
- Have a creative, catchy name (2-3 words max)
- Be cute, friendly, and have personality
- Have a fun description (1-2 sentences)
- Have a single emoji that fits
- Have a cohesive color theme with 4 HEX color codes or CSS gradients

Colors:
- primary: Main color (vibrant) - hex like #3b82f6 or CSS gradient
- secondary: Lighter/complementary - hex or gradient
- accent: Pop color for highlights - hex or gradient
- bg: Background - hex or gradient`,
    response_json_schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        emoji: { type: "string" },
        rarity: { type: "string", enum: ["uncommon", "rare", "epic"] },
        theme: {
          type: "object",
          properties: {
            primary: { type: "string" },
            secondary: { type: "string" },
            accent: { type: "string" },
            bg: { type: "string" }
          },
          required: ["primary", "secondary", "accent", "bg"]
        }
      },
      required: ["name", "description", "emoji", "rarity", "theme"]
    }
  });
  return concept;
}

// Step 2: Generate an image for a concept. Returns '' on failure (emoji fallback).
export async function generatePetImage(concept) {
  try {
    const img = await base44.integrations.Core.GenerateImage({
      prompt: `Cute cartoon pet character for a CHILDREN'S educational game: ${concept.name}. ${concept.description}.
Style: adorable, friendly, colorful digital art, game mascot style, simple clean design, kid-friendly, Pixar-style cuteness.
MUST BE: Safe for children, no scary elements, bright and cheerful.
Color scheme: primary ${concept.theme?.primary}, secondary ${concept.theme?.secondary}, accent ${concept.theme?.accent}.
White or transparent background, centered, high quality illustration.`
    });
    return img.url || '';
  } catch (e) {
    console.error('Image generation failed:', e);
    return '';
  }
}

// Step 3: Persist a CustomPet + CustomTheme from a concept.
// opts: { createdBy, createdByProfileId, sourceTab, abilityCategory }
export async function createPetAndTheme(concept, opts = {}) {
  const {
    createdBy,
    createdByProfileId,
    sourceTab = 'pet_creator',
    abilityCategory
  } = opts;

  const rarity = sanitizeRarity(concept.rarity);
  const imageUrl = concept.imageUrl || '';

  const petPayload = {
    name: String(concept.name || 'Unnamed').slice(0, 80),
    description: String(concept.description || '').slice(0, 500),
    emoji: concept.emoji || '✨',
    imageUrl,
    rarity,
    xpRequired: 999999,
    isGiftOnly: true,
    theme: concept.theme,
    createdBy: createdBy || 'admin',
    createdByProfileId,
    createdSourceTab: sourceTab,
    imageSource: imageUrl ? 'ai_generated' : 'emoji_only'
  };
  if (abilityCategory) petPayload.abilityCategory = abilityCategory;

  const pet = await base44.entities.CustomPet.create(petPayload);

  const theme = await base44.entities.CustomTheme.create({
    name: concept.name,
    rarity,
    xpRequired: 0,
    description: `Theme from ${concept.name}`,
    primaryColor: concept.theme?.primary || '#6366f1',
    secondaryColor: concept.theme?.secondary || '#a5b4fc',
    accentColor: concept.theme?.accent || '#f59e0b',
    bgColor: concept.theme?.bg || '#f0f9ff'
  });

  return {
    pet,
    theme,
    petId: `custom_${pet.id}`,
    themeId: `custom_${theme.id}`
  };
}