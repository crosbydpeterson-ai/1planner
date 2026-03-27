import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all custom pets
    const allPets = await base44.asServiceRole.entities.CustomPet.filter({});
    // Get all custom themes
    const allThemes = await base44.asServiceRole.entities.CustomTheme.filter({});

    // Build a set of theme names for quick lookup
    const existingThemeNames = new Set(allThemes.map(t => t.name?.toLowerCase?.()));

    // Find pets without a matching theme
    const missingPets = allPets.filter(pet => {
      if (!pet.name) return false;
      if (!pet.theme) return false;
      return !existingThemeNames.has(pet.name.toLowerCase());
    });

    if (missingPets.length === 0) {
      return Response.json({ success: true, message: 'All pets already have themes', created: 0 });
    }

    // Create themes for missing pets
    const themePayloads = missingPets.map(pet => ({
      name: pet.name,
      rarity: pet.rarity || 'common',
      xpRequired: 0,
      description: `Theme from ${pet.name}`,
      primaryColor: pet.theme.primary || '#22c55e',
      secondaryColor: pet.theme.secondary || '#86efac',
      accentColor: pet.theme.accent || '#4ade80',
      bgColor: pet.theme.bg || '#f0fdf4',
    }));

    const created = await base44.asServiceRole.entities.CustomTheme.bulkCreate(themePayloads);

    return Response.json({
      success: true,
      created: created.length,
      names: missingPets.map(p => p.name)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});