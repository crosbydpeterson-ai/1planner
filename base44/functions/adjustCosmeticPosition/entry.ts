import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

function json(data, status = 200) {
  return Response.json(data, { status });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { profileId, username, cosmeticId, set, dx, dy } = body || {};
    if (!cosmeticId) return json({ error: 'cosmeticId is required' }, 400);

    // Locate target user profile
    let target;
    if (profileId) {
      const rows = await base44.asServiceRole.entities.UserProfile.filter({ id: profileId });
      target = rows?.[0];
    } else if (username) {
      const rows = await base44.asServiceRole.entities.UserProfile.filter({ username });
      target = rows?.[0];
    }
    if (!target) return json({ error: 'Target user not found' }, 404);

    const positions = { ...(target.cosmeticPositions || {}) };
...
    positions[cosmeticId] = next;
    const updated = await base44.asServiceRole.entities.UserProfile.update(target.id, { cosmeticPositions: positions });

    return json({ success: true, profileId: target.id, cosmeticId, position: next, cosmeticPositions: updated.cosmeticPositions });
  } catch (error) {
    return json({ error: error?.message || 'Unexpected error' }, 500);
  }
});