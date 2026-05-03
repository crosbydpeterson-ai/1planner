import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const VALID_CATEGORIES = ['fire','ice','storm','nature','shadow','light','ocean','chaos','time','crystal'];

const CATEGORY_HINTS = `Categories you can choose from:
- fire: aggressive, burning, dragons, lava, anger, destruction
- ice: cold, frozen, snow, calm, slow, defensive
- storm: lightning, wind, fast, electric, sky
- nature: plants, forest, healing, growth, earth, gentle
- shadow: dark, stealth, mystery, ghosts, undead, deceptive
- light: holy, angelic, healing, sun, pure, radiant
- ocean: water, sea, fish, fluid, deep, coral
- chaos: random, wild, unpredictable, weird, glitchy, magical
- time: clocks, ancient, slow/fast, rewind, eternal
- crystal: gems, mineral, hard, shimmer, geometric, treasure`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { profileId, mode, petIds } = body;

    if (!profileId) {
      return Response.json({ error: 'Missing profileId' }, { status: 400 });
    }
    // Trust the pin-based profileId — verify it exists.
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ id: profileId });
    if (!profiles.length) {
      return Response.json({ error: 'Invalid profileId' }, { status: 401 });
    }

    if (mode === 'bulk') {
      // Assign categories to ALL pets that don't have one yet (or all if forceAll)
      const allPets = await base44.asServiceRole.entities.CustomPet.list();
      const targets = body.forceAll ? allPets : allPets.filter(p => !p.abilityCategory);
      let updated = 0;
      for (const pet of targets) {
        try {
          const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Pick the SINGLE best ability category for this pet.\nName: ${pet.name}\nDescription: ${pet.description || ''}\nEmoji: ${pet.emoji || ''}\nRarity: ${pet.rarity}\n\n${CATEGORY_HINTS}\n\nReturn ONLY a JSON object with a "category" field set to one of: ${VALID_CATEGORIES.join(', ')}.`,
            response_json_schema: {
              type: 'object',
              properties: { category: { type: 'string', enum: VALID_CATEGORIES } },
              required: ['category']
            }
          });
          if (res?.category && VALID_CATEGORIES.includes(res.category)) {
            await base44.asServiceRole.entities.CustomPet.update(pet.id, { abilityCategory: res.category });
            updated++;
          }
        } catch (e) {
          console.error('Failed for pet', pet.name, e);
        }
      }
      return Response.json({ success: true, updated, total: targets.length });
    }

    // Single-pet suggest mode
    if (!petIds || !petIds.length) {
      return Response.json({ error: 'Missing petIds' }, { status: 400 });
    }
    const petId = petIds[0];
    const pets = await base44.asServiceRole.entities.CustomPet.filter({ id: petId });
    if (!pets.length) {
      return Response.json({ error: 'Pet not found' }, { status: 404 });
    }
    const pet = pets[0];
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Pick the SINGLE best ability category for this pet.\nName: ${pet.name}\nDescription: ${pet.description || ''}\nEmoji: ${pet.emoji || ''}\nRarity: ${pet.rarity}\n\n${CATEGORY_HINTS}\n\nReturn ONLY a JSON object with a "category" field set to one of: ${VALID_CATEGORIES.join(', ')}.`,
      response_json_schema: {
        type: 'object',
        properties: { category: { type: 'string', enum: VALID_CATEGORIES } },
        required: ['category']
      }
    });
    const category = (res?.category && VALID_CATEGORIES.includes(res.category)) ? res.category : null;
    if (!category) {
      return Response.json({ error: 'AI did not return a valid category' }, { status: 500 });
    }
    await base44.asServiceRole.entities.CustomPet.update(petId, { abilityCategory: category });
    return Response.json({ success: true, category, petId });

  } catch (error) {
    console.error('suggestPetAbilities error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});