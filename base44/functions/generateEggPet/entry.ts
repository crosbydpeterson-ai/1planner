import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify the caller is authenticated without hitting the User entity
    const isAuthed = await base44.auth.isAuthenticated();
    if (!isAuthed) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, petIdea, eggId, petData, profileId } = await req.json();

    if (action === 'generate') {
      // Step 1: Generate concept + image on server
      const concept = await base44.asServiceRole.integrations.Core.InvokeLLM({
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

      // Generate image
      let imageUrl = '';
      try {
        const img = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: `Cute cartoon pet character for a CHILDREN'S educational game: ${concept.name}. ${concept.description}. 
Style: adorable, friendly, colorful digital art, game mascot style, simple clean design, kid-friendly, Pixar-style cuteness.
MUST BE: Safe for children, no scary elements, bright and cheerful.
Color scheme: primary ${concept.theme?.primary}, secondary ${concept.theme?.secondary}, accent ${concept.theme?.accent}.
White or transparent background, centered, high quality illustration.`
        });
        imageUrl = img.url;
      } catch (e) {
        console.error('Image generation failed:', e);
        // Continue without image - emoji fallback
      }

      return Response.json({ concept, imageUrl });

    } else if (action === 'hatch') {
      // Step 2: Save pet, theme, update user profile
      if (!petData || !eggId || !profileId) {
        return Response.json({ error: 'Missing petData, eggId, or profileId' }, { status: 400 });
      }

      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) {
        return Response.json({ error: 'Profile not found' }, { status: 404 });
      }
      const profile = profiles[0];

      // Create pet
      const newPet = await base44.asServiceRole.entities.CustomPet.create({
        name: petData.name,
        description: petData.description,
        emoji: petData.emoji,
        imageUrl: petData.imageUrl || '',
        rarity: petData.rarity,
        xpRequired: 999999,
        isGiftOnly: true,
        theme: petData.theme,
        createdBy: profile.userId,
        createdByProfileId: profile.id,
        createdSourceTab: 'pet_creator',
        imageSource: petData.imageUrl ? 'ai_generated' : 'emoji_only'
      });

      // Mark egg as used
      await base44.asServiceRole.entities.MagicEgg.update(eggId, {
        isUsed: true,
        createdPetId: newPet.id,
        hatchedByProfileId: profile.id,
        hatchedByUsername: profile.username
      });

      // Create matching theme
      const newTheme = await base44.asServiceRole.entities.CustomTheme.create({
        name: petData.name,
        rarity: petData.rarity,
        xpRequired: 0,
        description: `Theme from ${petData.name}`,
        primaryColor: petData.theme?.primary || '#6366f1',
        secondaryColor: petData.theme?.secondary || '#a5b4fc',
        accentColor: petData.theme?.accent || '#f59e0b',
        bgColor: petData.theme?.bg || '#f0f9ff'
      });

      // Unlock pet and theme for user
      const newPetId = `custom_${newPet.id}`;
      const newThemeId = `custom_${newTheme.id}`;
      const unlockedPets = [...(profile.unlockedPets || []), newPetId];
      const unlockedThemes = [...(profile.unlockedThemes || []), newThemeId];
      await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        unlockedPets,
        unlockedThemes,
        equippedPetId: newPetId
      });

      return Response.json({
        success: true,
        pet: newPet,
        petId: newPetId,
        theme: newTheme,
        themeId: newThemeId
      });

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('generateEggPet error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});