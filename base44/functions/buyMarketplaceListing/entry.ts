import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { listingId, buyerProfileId } = body || {};
    if (!listingId || !buyerProfileId) {
      return Response.json({ error: 'Missing listingId or buyerProfileId' }, { status: 400 });
    }

    // Load listing
    const listings = await base44.asServiceRole.entities.MarketplaceListing.filter({ id: listingId });
    if (!listings || listings.length === 0) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }
    const listing = listings[0];
    if (listing.status !== 'active') {
      return Response.json({ error: 'Listing is not active' }, { status: 400 });
    }

    // Load seller and buyer profiles
    const sellerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ id: listing.sellerProfileId });
    if (!sellerProfiles || sellerProfiles.length === 0) {
      return Response.json({ error: 'Seller profile not found' }, { status: 404 });
    }
    const seller = sellerProfiles[0];

    const buyerProfiles = await base44.asServiceRole.entities.UserProfile.filter({ id: buyerProfileId });
    if (!buyerProfiles || buyerProfiles.length === 0) {
      return Response.json({ error: 'Buyer profile not found' }, { status: 404 });
    }
    const buyer = buyerProfiles[0];

    const petId = listing.petId;

    // Verify seller owns the pet
    const sellerPets = Array.isArray(seller.unlockedPets) ? seller.unlockedPets : [];
    if (!sellerPets.includes(petId)) {
      return Response.json({ error: 'Seller no longer owns this pet' }, { status: 409 });
    }

    // Verify buyer has enough coins
    const price = Number(listing.priceCoins || 0);
    const buyerCoins = Number(buyer.questCoins || 0);
    if (buyerCoins < price) {
      return Response.json({ error: 'Insufficient coins' }, { status: 400 });
    }

    // Mark listing as sold (basic race protection)
    await base44.asServiceRole.entities.MarketplaceListing.update(listing.id, {
      status: 'sold',
      purchasedByProfileId: buyer.id
    });

    // Transfer pet: remove from seller, add to buyer (no duplicates)
    const updatedSellerPets = sellerPets.filter((p) => p !== petId);
    const buyerPets = Array.isArray(buyer.unlockedPets) ? buyer.unlockedPets : [];
    const updatedBuyerPets = buyerPets.includes(petId) ? buyerPets : [...buyerPets, petId];

    // Update coin balances
    const updatedSellerCoins = Number(seller.questCoins || 0) + price;
    const updatedBuyerCoins = buyerCoins - price;

    await Promise.all([
      base44.asServiceRole.entities.UserProfile.update(seller.id, {
        unlockedPets: updatedSellerPets,
        questCoins: updatedSellerCoins
      }),
      base44.asServiceRole.entities.UserProfile.update(buyer.id, {
        unlockedPets: updatedBuyerPets,
        questCoins: updatedBuyerCoins
      })
    ]);

    return Response.json({ success: true, listingId: listing.id });
  } catch (error) {
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});