import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PetAvatar from '@/components/quest/PetAvatar';
import TradeOfferDialog from '@/components/marketplace/TradeOfferDialog';
import PetPreviewDialog from '@/components/marketplace/PetPreviewDialog';
import InventoriesDialog from '@/components/marketplace/InventoriesDialog';
import { getPetName, collectCustomIds } from '@/components/quest/petUtils';
import { Coins, PlusCircle, Eye, Handshake } from 'lucide-react';

export default function Marketplace() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activeListings, setActiveListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [incomingOffers, setIncomingOffers] = useState([]);
  const [sellersMap, setSellersMap] = useState({});
  const [skinsMap, setSkinsMap] = useState({});
  const [creating, setCreating] = useState(false);
  const [petToSell, setPetToSell] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [showOffer, setShowOffer] = useState(false);
  const [offerListing, setOfferListing] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPetId, setPreviewPetId] = useState('');
  const [showInventories, setShowInventories] = useState(false);
  const [customNameMap, setCustomNameMap] = useState({});

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      navigate(createPageUrl('Home'));
      return;
    }
    try {
      const profs = await base44.entities.UserProfile.filter({ id: profileId });
      if (!profs || profs.length === 0) {
        navigate(createPageUrl('Home'));
        return;
      }
      const p = profs[0];
      setProfile(p);

      // Build custom pet name map for this user's pets
      const customIds = collectCustomIds(Array.isArray(p.unlockedPets) ? p.unlockedPets : []);
      if (customIds.length > 0) {
        const results = await Promise.all(customIds.map(id => base44.entities.CustomPet.filter({ id })));
        const map = {};
        results.forEach(arr => { if (arr?.[0]) map[arr[0].id] = arr[0]; });
        setCustomNameMap(map);
      } else {
        setCustomNameMap({});
      }

      const allActive = await base44.entities.MarketplaceListing.filter({ status: 'active' }, '-created_date', 100);

      // Load seller profiles and their equipped booth skins
      const sellerIds = Array.from(new Set(allActive.map(l => l.sellerProfileId)));
      const sellers = await Promise.all(sellerIds.map(id => base44.entities.UserProfile.filter({ id })));
      const sMap = {};
      const skinIds = new Set();
      sellers.forEach(arr => {
        if (arr?.[0]) {
          sMap[arr[0].id] = arr[0];
          if (arr[0].equippedBoothSkinId) skinIds.add(arr[0].equippedBoothSkinId);
        }
      });
      setSellersMap(sMap);
      let kMap = {};
      if (skinIds.size > 0) {
        const skins = await Promise.all(Array.from(skinIds).map(id => base44.entities.BoothSkin.filter({ id })));
        skins.forEach(arr => { if (arr?.[0]) kMap[arr[0].id] = arr[0]; });
      }
      setSkinsMap(kMap);
      setActiveListings(allActive);

      const mine = await base44.entities.MarketplaceListing.filter({ sellerProfileId: p.id, status: 'active' }, '-created_date', 100);
      setMyListings(mine);

      const incoming = await base44.entities.TradeOffer.filter({ receiverProfileId: p.id, status: 'pending' }, '-created_date', 50);
      setIncomingOffers(incoming);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async () => {
    if (!petToSell || !price) return;
    if (!profile) return;
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) return;

    await base44.entities.MarketplaceListing.create({
      sellerProfileId: profile.id,
      sellerUserId: profile.userId,
      petId: petToSell,
      priceCoins: priceNum,
      status: 'active'
    });
    setCreating(false);
    setPetToSell('');
    setPrice('');
    await loadAll();
  };

  const handleBuy = async (listing) => {
    if (!profile) return;
    const { data } = await base44.functions.invoke('buyMarketplaceListing', {
      listingId: listing.id,
      buyerProfileId: profile.id
    });
    if (data?.success) {
      await loadAll();
    }
  };

  const handleCancel = async (listing) => {
    await base44.entities.MarketplaceListing.update(listing.id, { status: 'cancelled' });
    await loadAll();
  };

  const handleAcceptOffer = async (offer) => {
    const { data } = await base44.functions.invoke('acceptTradeOffer', { offerId: offer.id, receiverProfileId: profile.id });
    if (data?.success) await loadAll();
  };

  const handleRejectOffer = async (offer) => {
    await base44.entities.TradeOffer.update(offer.id, { status: 'rejected' });
    await loadAll();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const myPets = Array.isArray(profile?.unlockedPets) ? profile.unlockedPets : [];
  const groupedBySeller = activeListings.reduce((acc, l) => { (acc[l.sellerProfileId] = acc[l.sellerProfileId] || []).push(l); return acc; }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Player Marketplace</h1>
          <div className="flex items-center gap-3 text-slate-600">
            <Coins className="w-5 h-5" />
            <span className="font-semibold">{profile?.questCoins || 0}</span>
            <span className="text-sm">coins</span>
            <Button variant="outline" size="sm" className="ml-3" onClick={() => setShowInventories(true)}>
              Check Inventories
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Create Listing</CardTitle>
            {!creating && (
              <Button onClick={() => setCreating(true)} className="gap-2">
                <PlusCircle className="w-4 h-4" /> New Listing
              </Button>
            )}
          </CardHeader>
          {creating && (
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <Select value={petToSell} onValueChange={setPetToSell}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {myPets.map((pid) => (
                      <SelectItem key={pid} value={pid}>{getPetName(pid, customNameMap)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {petToSell && (
                  <div className="mt-3">
                    <PetAvatar petId={petToSell} size="md" />
                  </div>
                )}
              </div>
              <div className="md:col-span-1">
                <label className="text-sm text-slate-600">Price (coins)</label>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 250"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-1 flex items-end gap-2">
                <Button onClick={handleCreateListing} disabled={!petToSell || !price} className="w-full">
                  List for Sale
                </Button>
                <Button variant="outline" onClick={() => { setCreating(false); setPetToSell(''); setPrice(''); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {myListings.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">My Active Listings</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myListings.map((l) => (
                <Card key={l.id} className="overflow-hidden">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <PetAvatar petId={l.petId} size="md" />
                      <Badge variant="secondary" className="gap-1"><Coins className="w-3 h-3" /> {l.priceCoins}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end gap-2">
                    <Button variant="outline" onClick={() => handleCancel(l)}>Cancel</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {incomingOffers.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">Incoming Offers</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {incomingOffers.map((o) => (
                <Card key={o.id}>
                  <CardHeader>
                    <CardTitle className="text-base">Trade Offer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-around">
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">You Give</div>
                        <PetAvatar petId={o.requestedPetId} size="md" />
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-500 mb-1">You Get</div>
                        <PetAvatar petId={o.offeredPetId} size="md" />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end gap-2">
                    <Button variant="outline" onClick={() => handleRejectOffer(o)}>Reject</Button>
                    <Button onClick={() => handleAcceptOffer(o)}>Accept</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Active Listings</h2>
          {activeListings.length === 0 ? (
            <div className="text-slate-500 text-sm">No listings yet. Be the first to list a pet!</div>
          ) : (
            Object.entries(
              activeListings.reduce((acc, l) => {
                (acc[l.sellerProfileId] = acc[l.sellerProfileId] || []).push(l);
                return acc;
              }, {})
            ).map(([sellerId, listings]) => {
              const seller = sellersMap[sellerId] || {};
              const banner = skinsMap[seller.equippedBoothSkinId];
              return (
                <div key={sellerId} className="mb-6 rounded-2xl overflow-hidden border border-slate-200">
                  <div className="relative h-32 sm:h-40 w-full">
                    {banner ? (
                      <img src={banner.imageUrl} alt={banner.name} className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100" />
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white">
                      <div className="text-lg font-semibold">{seller.username || 'Seller'}</div>
                      {banner && <div className="text-xs bg-white/20 rounded px-2 py-0.5">{banner.name}</div>}
                    </div>
                  </div>

                  <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white">
                    {listings.map((l) => {
                      const isMine = l.sellerProfileId === profile.id;
                      const canAfford = (profile?.questCoins || 0) >= Number(l.priceCoins || 0);
                      return (
                        <Card key={l.id} className="overflow-hidden">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <PetAvatar petId={l.petId} size="md" />
                              <Badge variant="secondary" className="gap-1"><Coins className="w-3 h-3" /> {l.priceCoins}</Badge>
                            </div>
                          </CardContent>
                          <CardFooter className="justify-between">
                            <Button variant="ghost" className="gap-1" onClick={() => { setPreviewPetId(l.petId); setShowPreview(true); }}>
                              <Eye className="w-4 h-4" /> Preview
                            </Button>
                            {isMine ? (
                              <Button variant="outline" onClick={() => handleCancel(l)}>Cancel</Button>
                            ) : (
                              <div className="flex gap-2">
                                <Button variant="outline" className="gap-1" onClick={() => { setOfferListing(l); setShowOffer(true); }}>
                                  <Handshake className="w-4 h-4" /> Offer Trade
                                </Button>
                                <Button onClick={() => handleBuy(l)} disabled={!canAfford}>Buy</Button>
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Dialogs */}
      <TradeOfferDialog
        open={showOffer}
        onOpenChange={setShowOffer}
        listing={offerListing}
        buyerProfile={profile}
        onCreated={loadAll}
      />
      <PetPreviewDialog petId={previewPetId} open={showPreview} onOpenChange={setShowPreview} />
      <InventoriesDialog open={showInventories} onOpenChange={setShowInventories} currentProfileId={profile?.id} />
    </div>
  );
}