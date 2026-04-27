import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const VALID_API_KEY = Deno.env.get("QUEST_PLANNER_API_KEY");

function validateApiKey(req) {
  const apiKey = req.headers.get("x-api-key");
  return apiKey && apiKey === VALID_API_KEY;
}

Deno.serve(async (req) => {
  if (!validateApiKey(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, profileId, xpAmount, coinsAmount } = body;

  if (!profileId) {
    return Response.json({ error: "profileId is required" }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  // Find the UserProfile by ID
  const profiles = await base44.asServiceRole.entities.UserProfile.filter({ id: profileId });
  if (!profiles || profiles.length === 0) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  const profile = profiles[0];

  // GET profile data
  if (action === "getProfile") {
    return Response.json({
      profileId: profile.id,
      username: profile.username,
      xp: profile.xp || 0,
      seasonXp: profile.seasonXp || 0,
      questCoins: profile.questCoins || 0,
      gems: profile.gems || 0,
      equippedPetId: profile.equippedPetId || null,
      unlockedPets: profile.unlockedPets || [],
      rank: profile.rank || "user",
      isBanned: profile.isBanned || false,
    });
  }

  // AWARD XP
  if (action === "awardXP") {
    if (!xpAmount || xpAmount <= 0) {
      return Response.json({ error: "xpAmount must be a positive number" }, { status: 400 });
    }
    const newXp = (profile.xp || 0) + xpAmount;
    const newSeasonXp = (profile.seasonXp || 0) + xpAmount;
    await base44.asServiceRole.entities.UserProfile.update(profile.id, {
      xp: newXp,
      seasonXp: newSeasonXp,
    });
    return Response.json({ success: true, newXp, newSeasonXp });
  }

  // AWARD COINS
  if (action === "awardCoins") {
    if (!coinsAmount || coinsAmount <= 0) {
      return Response.json({ error: "coinsAmount must be a positive number" }, { status: 400 });
    }
    const newCoins = (profile.questCoins || 0) + coinsAmount;
    await base44.asServiceRole.entities.UserProfile.update(profile.id, {
      questCoins: newCoins,
    });
    return Response.json({ success: true, newCoins });
  }

  return Response.json({ error: "Invalid action. Use: getProfile, awardXP, awardCoins" }, { status: 400 });
});