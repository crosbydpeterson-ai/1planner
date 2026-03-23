import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function json(data, status = 200) {
  return Response.json(data, { status });
}

async function isAdmin(base44) {
  const user = await base44.auth.me();
  if (!user) return { ok: false };
  if (user.role === 'admin') return { ok: true, user };
  try {
    const profiles = await base44.entities.UserProfile.filter({ userId: user.email });
    const meProfile = profiles?.[0];
    const rank = meProfile?.rank || 'user';
    const username = (meProfile?.username || '').toLowerCase();
    const ok = rank === 'admin' || rank === 'super_admin' || username === 'crosby';
    return { ok, user };
  } catch (_) {
    return { ok: false, user };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await isAdmin(base44);
    if (!admin.ok) return json({ error: 'Forbidden: Admin access required' }, 403);

    const body = await req.json();
    const { profileId, username, cosmeticId, set, dx, dy } = body || {};
    if (!cosmeticId) return json({ error: 'cosmeticId is required' }, 400);

    // Locate target user profile
    let target;
    if (profileId) {
      const rows = await base44.entities.UserProfile.filter({ id: profileId });
      target = rows?.[0];
    } else if (username) {
      const rows = await base44.entities.UserProfile.filter({ username });
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
    const updated = await base44.entities.UserProfile.update(target.id, { cosmeticPositions: positions });

    return json({ success: true, profileId: target.id, cosmeticId, position: next, cosmeticPositions: updated.cosmeticPositions });
  } catch (error) {
    return json({ error: error?.message || 'Unexpected error' }, 500);
  }
});