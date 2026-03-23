import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function json(data, status = 200) { return Response.json(data, { status }); }

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

    const { action, payload } = await req.json();
    if (!action) return json({ error: 'action is required' }, 400);

    switch (action) {
      case 'createEvent': {
        const { name, type = 'bubble_pop', config = { bubbleCount: 15, eggChance: 10 } } = payload || {};
        if (!name) return json({ error: 'name is required' }, 400);
        const data = await base44.entities.AdminEvent.create({
          name,
          type,
          isActive: true,
          config,
          startTime: new Date().toISOString()
        });
        return json({ success: true, event: data });
      }
      case 'toggleEvent': {
        const { eventId, isActive } = payload || {};
        if (!eventId || typeof isActive !== 'boolean') return json({ error: 'eventId and isActive are required' }, 400);
        const patch = isActive ? { isActive: true, startTime: new Date().toISOString() } : { isActive: false };
        const data = await base44.entities.AdminEvent.update(eventId, patch);
        return json({ success: true, event: data });
      }
      case 'createPet': {
        const required = ['name'];
        for (const k of required) if (!payload?.[k]) return json({ error: `${k} is required` }, 400);
        const data = await base44.entities.CustomPet.create(payload);
        return json({ success: true, pet: data });
      }
      case 'createTheme': {
        const required = ['name', 'primaryColor', 'secondaryColor', 'accentColor', 'bgColor'];
        for (const k of required) if (!payload?.[k]) return json({ error: `${k} is required` }, 400);
        const data = await base44.entities.CustomTheme.create(payload);
        return json({ success: true, theme: data });
      }
      case 'createShopItem': {
        const required = ['name', 'itemType', 'price'];
        for (const k of required) if (payload?.[k] === undefined || payload?.[k] === null) return json({ error: `${k} is required` }, 400);
        const data = await base44.entities.ShopItem.create(payload);
        return json({ success: true, item: data });
      }
      case 'createBundle': {
        const required = ['name', 'itemIds', 'bundlePrice'];
        for (const k of required) if (!payload?.[k] || (Array.isArray(payload[k]) && payload[k].length === 0)) return json({ error: `${k} is required` }, 400);
        const data = await base44.entities.Bundle.create(payload);
        return json({ success: true, bundle: data });
      }
      case 'gift': {
        const { username, profileId, giftType, value } = payload || {};
        // locate recipient
        let userRow;
        if (profileId) {
          const rows = await base44.entities.UserProfile.filter({ id: profileId });
          userRow = rows?.[0];
        } else if (username) {
          const rows = await base44.entities.UserProfile.filter({ username });
          userRow = rows?.[0];
        }
        if (!userRow) return json({ error: 'recipient not found' }, 404);

        if (giftType === 'coins') {
          const amount = parseInt(value || 0);
          if (!amount || amount <= 0) return json({ error: 'invalid amount' }, 400);
          const questCoins = (userRow.questCoins || 0) + amount;
          const updated = await base44.entities.UserProfile.update(userRow.id, { questCoins });
          return json({ success: true, recipient: updated });
        }
        if (giftType === 'pet') {
          const petId = value;
          if (!petId) return json({ error: 'petId required' }, 400);
          const unlockedPets = Array.from(new Set([...(userRow.unlockedPets || []), petId]));
          const updated = await base44.entities.UserProfile.update(userRow.id, { unlockedPets });
          return json({ success: true, recipient: updated });
        }
        if (giftType === 'theme') {
          const themeId = value;
          if (!themeId) return json({ error: 'themeId required' }, 400);
          const unlockedThemes = Array.from(new Set([...(userRow.unlockedThemes || []), themeId]));
          const updated = await base44.entities.UserProfile.update(userRow.id, { unlockedThemes });
          return json({ success: true, recipient: updated });
        }
        if (giftType === 'cosmetic') {
          const cosmeticId = value;
          if (!cosmeticId) return json({ error: 'cosmeticId required' }, 400);
          const unlockedCosmetics = Array.from(new Set([...(userRow.unlockedCosmetics || []), cosmeticId]));
          const updated = await base44.entities.UserProfile.update(userRow.id, { unlockedCosmetics });
          return json({ success: true, recipient: updated });
        }
        if (giftType === 'magic_egg') {
          if (!userRow.userId) return json({ error: 'recipient userId missing' }, 400);
          const egg = await base44.entities.MagicEgg.create({ userId: userRow.userId });
          return json({ success: true, egg });
        }
        return json({ error: 'unsupported giftType' }, 400);
      }
      default:
        return json({ error: `unknown action: ${action}` }, 400);
    }
  } catch (error) {
    return json({ error: error?.message || 'Unexpected error' }, 500);
  }
});