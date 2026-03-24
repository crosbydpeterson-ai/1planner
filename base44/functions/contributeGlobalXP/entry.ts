import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const { xpAmount, userProfileId } = await req.json();

    if (!xpAmount || xpAmount <= 0) {
      return Response.json({ error: 'Invalid XP amount' }, { status: 400 });
    }

    // Find active global event
    const events = await base44.asServiceRole.entities.GlobalEvent.filter({ isActive: true });
    if (events.length === 0) {
      return Response.json({ success: true, message: 'No active global event' });
    }

    const event = events[0];
    const newXP = Math.min((event.currentGlobalXP || 0) + xpAmount, event.totalXPGoal);

    await base44.asServiceRole.entities.GlobalEvent.update(event.id, {
      currentGlobalXP: newXP
    });

    // Award Cogwheels if this is an Inventors' Fair event
    let cogwheelsAwarded = 0;
    if (event.theme === 'inventors_fair' && userProfileId) {
      // 1 Cogwheel per 5 XP contributed
      cogwheelsAwarded = Math.floor(xpAmount / 5);
      if (cogwheelsAwarded > 0) {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ id: userProfileId });
        if (profiles.length > 0) {
          const profile = profiles[0];
          await base44.asServiceRole.entities.UserProfile.update(profile.id, {
            cogwheels: (profile.cogwheels || 0) + cogwheelsAwarded
          });
        }
      }
    }

    // Check which tiers are now unlocked
    const unlockedTiers = (event.tiers || [])
      .map((tier, index) => ({ ...tier, index }))
      .filter(tier => newXP >= tier.xpThreshold);

    return Response.json({
      success: true,
      currentGlobalXP: newXP,
      totalXPGoal: event.totalXPGoal,
      unlockedTiersCount: unlockedTiers.length,
      cogwheelsAwarded
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});