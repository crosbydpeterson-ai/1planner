import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { offerId, receiverProfileId } = body || {};
    if (!offerId || !receiverProfileId) {
      return Response.json({ error: 'Missing offerId or receiverProfileId' }, { status: 400 });
    }

    // Load offer
    const offers = await base44.asServiceRole.entities.TradeOffer.filter({ id: offerId });
    if (!offers?.length) return Response.json({ error: 'Offer not found' }, { status: 404 });
    const offer = offers[0];
    if (offer.status !== 'pending') return Response.json({ error: 'Offer is not pending' }, { status: 400 });

    // Load profiles
    const [offererArr, receiverArr] = await Promise.all([
      base44.asServiceRole.entities.UserProfile.filter({ id: offer.offererProfileId }),
      base44.asServiceRole.entities.UserProfile.filter({ id: offer.receiverProfileId })
    ]);
    if (!offererArr.length || !receiverArr.length) {
      return Response.json({ error: 'Profiles not found' }, { status: 404 });
    }
    const offerer = offererArr[0];
    const receiver = receiverArr[0];

    if (receiver.id !== receiverProfileId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify ownerships
    const offererPets = Array.isArray(offerer.unlockedPets) ? offerer.unlockedPets : [];
    const receiverPets = Array.isArray(receiver.unlockedPets) ? receiver.unlockedPets : [];

    if (!offererPets.includes(offer.offeredPetId)) {
      return Response.json({ error: 'Offerer no longer owns offered pet' }, { status: 409 });
    }
    if (!receiverPets.includes(offer.requestedPetId)) {
      return Response.json({ error: 'Receiver no longer owns requested pet' }, { status: 409 });
    }

    // Update offer first to prevent double-accepts
    await base44.asServiceRole.entities.TradeOffer.update(offer.id, { status: 'accepted' });

    // Swap pets
    const updatedOffererPets = offererPets.filter(p => p !== offer.offeredPetId);
    if (!updatedOffererPets.includes(offer.requestedPetId)) updatedOffererPets.push(offer.requestedPetId);

    const updatedReceiverPets = receiverPets.filter(p => p !== offer.requestedPetId);
    if (!updatedReceiverPets.includes(offer.offeredPetId)) updatedReceiverPets.push(offer.offeredPetId);

    await Promise.all([
      base44.asServiceRole.entities.UserProfile.update(offerer.id, { unlockedPets: updatedOffererPets }),
      base44.asServiceRole.entities.UserProfile.update(receiver.id, { unlockedPets: updatedReceiverPets })
    ]);

    // If linked to a listing, cancel it as the seller no longer owns original pet
    if (offer.listingId) {
      const listings = await base44.asServiceRole.entities.MarketplaceListing.filter({ id: offer.listingId });
      if (listings?.length) {
        await base44.asServiceRole.entities.MarketplaceListing.update(offer.listingId, { status: 'cancelled' });
      }
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message || 'Server error' }, { status: 500 });
  }
});