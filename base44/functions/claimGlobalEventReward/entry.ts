import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { eventId, tierIndex, userProfileId } = await req.json();

    if (!eventId || tierIndex === undefined || !userProfileId) {
      return Response.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Get event
    const events = await base44.asServiceRole.entities.GlobalEvent.filter({ id: eventId });
    if (events.length === 0) {
      return Response.json({ error: 'Event not found' }, { status: 404 });
    }
    const event = events[0];
    const tier = event.tiers?.[tierIndex];
    if (!tier) {
      return Response.json({ error: 'Tier not found' }, { status: 404 });
    }

    // Check tier is actually reached
    if ((event.currentGlobalXP || 0) < tier.xpThreshold) {
      return Response.json({ error: 'Tier not yet unlocked' }, { status: 400 });
    }

    // Check if already claimed
    const existingClaims = await base44.asServiceRole.entities.GlobalEventClaim.filter({
      eventId,
      userProfileId,
      tierIndex
    });
    if (existingClaims.length > 0) {
      return Response.json({ error: 'Already claimed' }, { status: 400 });
    }

    // Get user profile
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ id: userProfileId });
    if (profiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }
    const profile = profiles[0];

    // Distribute reward
    const updateData = {};
    let rewardDescription = '';

    switch (tier.rewardType) {
      case 'xp': {
        const amount = parseInt(tier.rewardValue) || 0;
        updateData.xp = (profile.xp || 0) + amount;
        rewardDescription = `${amount} XP`;
        break;
      }
      case 'coins': {
        const amount = parseInt(tier.rewardValue) || 0;
        updateData.questCoins = (profile.questCoins || 0) + amount;
        rewardDescription = `${amount} Quest Coins`;
        break;
      }
      case 'pet': {
        const petId = tier.rewardValue;
        const pets = [...(profile.unlockedPets || [])];
        if (!pets.includes(petId)) pets.push(petId);
        updateData.unlockedPets = pets;
        rewardDescription = `Pet: ${tier.rewardName}`;
        break;
      }
      case 'theme': {
        const themeId = tier.rewardValue;
        const themes = [...(profile.unlockedThemes || [])];
        if (!themes.includes(themeId)) themes.push(themeId);
        updateData.unlockedThemes = themes;
        rewardDescription = `Theme: ${tier.rewardName}`;
        break;
      }
      case 'title': {
        const titles = [...(profile.unlockedTitles || [])];
        if (!titles.includes(tier.rewardValue)) titles.push(tier.rewardValue);
        updateData.unlockedTitles = titles;
        rewardDescription = `Title: ${tier.rewardValue}`;
        break;
      }
      case 'magic_egg': {
        // Create a magic egg for the user
        await base44.asServiceRole.entities.MagicEgg.create({
          userId: profile.userId,
          isUsed: false,
          source: 'global_event'
        });
        rewardDescription = 'Magic Egg';
        break;
      }
    }

    // Update profile if needed
    if (Object.keys(updateData).length > 0) {
      await base44.asServiceRole.entities.UserProfile.update(userProfileId, updateData);
    }

    // Record the claim
    await base44.asServiceRole.entities.GlobalEventClaim.create({
      eventId,
      userProfileId,
      tierIndex
    });

    return Response.json({
      success: true,
      rewardDescription,
      tierIndex
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});