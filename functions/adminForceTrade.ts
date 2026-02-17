import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify the caller is an admin via UserProfile.rank or username 'crosby'
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ userId: user.email });
    const me = profiles?.[0];
    const isAdmin = !!me && ((me.rank === 'admin' || me.rank === 'super_admin') || (me.username || '').toLowerCase() === 'crosby');
    if (!isAdmin) return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const body = await req.json();
    const { fromProfileId, toProfileId, itemType, itemId } = body || {};
    const allowed = ['pet','theme','title','cosmetic','boothskin'];
    if (!fromProfileId || !toProfileId || !itemType || !itemId || !allowed.includes(itemType)) {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const [fromArr] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.filter({ id: fromProfileId })
    ]);
    const toArr = await base44.asServiceRole.entities.UserProfile.filter({ id: toProfileId });

    if (!fromArr?.[0] || !toArr?.[0]) return Response.json({ error: 'User not found' }, { status: 404 });
    const from = fromArr[0];
    const to = toArr[0];

    const updates = { from: {}, to: {} };
    const moveItem = (field) => {
      const fromList = Array.isArray(from[field]) ? from[field] : [];
      const toList = Array.isArray(to[field]) ? to[field] : [];
      if (!fromList.includes(itemId)) return { ok: false, reason: 'Source does not own item' };
      updates.from[field] = fromList.filter((x) => x !== itemId);
      updates.to[field] = toList.includes(itemId) ? toList : [...toList, itemId];
      return { ok: true };
    };

    let result;
    if (itemType === 'pet') result = moveItem('unlockedPets');
    else if (itemType === 'theme') result = moveItem('unlockedThemes');
    else if (itemType === 'title') result = moveItem('unlockedTitles');
    else if (itemType === 'cosmetic') result = moveItem('unlockedCosmetics');
    else if (itemType === 'boothskin') result = moveItem('unlockedBoothSkins');

    if (!result?.ok) return Response.json({ error: result?.reason || 'Failed' }, { status: 400 });

    // Clear equipped if needed
    if (itemType === 'pet' && from.equippedPetId === itemId) updates.from.equippedPetId = null;
    if (itemType === 'theme' && from.equippedThemeId === itemId) updates.from.equippedThemeId = null;
    if (itemType === 'title' && from.equippedTitle === itemId) updates.from.equippedTitle = '';
    if (itemType === 'boothskin' && from.equippedBoothSkinId === itemId) updates.from.equippedBoothSkinId = null;

    await Promise.all([
      base44.asServiceRole.entities.UserProfile.update(from.id, updates.from),
      base44.asServiceRole.entities.UserProfile.update(to.id, updates.to)
    ]);

    return Response.json({ success: true, moved: { itemType, itemId, from: from.id, to: to.id } });
  } catch (error) {
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});