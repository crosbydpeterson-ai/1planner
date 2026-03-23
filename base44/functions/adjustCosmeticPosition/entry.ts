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
    const current = positions[cosmeticId] || { x: 50, y: 50 };

    let next;
    if (set && typeof set.x === 'number' && typeof set.y === 'number') {
      next = { x: set.x, y: set.y };
    } else {
      const ddx = typeof dx === 'number' ? dx : 0;
      const ddy = typeof dy === 'number' ? dy : 0;
      next = { x: current.x + ddx, y: current.y + ddy };
    }

    // Clamp to 0..100
    next.x = Math.max(0, Math.min(100, next.x));
    next.y = Math.max(0, Math.min(100, next.y));

    positions[cosmeticId] = next;
    const updated = await base44.asServiceRole.entities.UserProfile.update(target.id, { cosmeticPositions: positions });

    return json({ success: true, profileId: target.id, cosmeticId, position: next, cosmeticPositions: updated.cosmeticPositions });
  } catch (error) {
    return json({ error: error?.message || 'Unexpected error' }, 500);
  }
});