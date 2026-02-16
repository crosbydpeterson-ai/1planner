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
import { Coins, PlusCircle } from 'lucide-react';

export default function Marketplace() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activeListings, setActiveListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [creating, setCreating] = useState(false);
  const [petToSell, setPetToSell] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(true);

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

      const allActive = await base44.entities.MarketplaceListing.filter({ status: 'active' }, '-created_date', 100);
      setActiveListings(allActive);

      const mine = await base44.entities.MarketplaceListing.filter({ sellerProfileId: p.id, status: 'active' }, '-created_date', 100);
      setMyListings(mine);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const myPets = Array.isArray(profile?.unlockedPets) ? profile.unlockedPets : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Player Marketplace</h1>
          <div className="flex items-center gap-3 text-slate-600">
            <Coins className="w-5 h-5" />
            <span className="font-semibold">{profile?.questCoins || 0}</span>
            <span className="text-sm">coins</span>
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
                      <SelectItem key={pid} value={pid}>{pid}</SelectItem>
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

        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Active Listings</h2>
          {activeListings.length === 0 ? (
            <div className="text-slate-500 text-sm">No listings yet. Be the first to list a pet!</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeListings.map((l) => {
                const isMine = l.sellerProfileId === profile.id;
                const canAfford = (profile?.questCoins || 0) >= Number(l.priceCoins || 0);
                return (
                  <Card key={l.id} className="overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Pet for Sale</span>
                        <Badge className="gap-1" variant="outline"><Coins className="w-3 h-3" /> {l.priceCoins}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-2">
                        <PetAvatar petId={l.petId} size="md" />
                      </div>
                    </CardContent>
                    <CardFooter className="justify-end">
                      {isMine ? (
                        <Button variant="outline" onClick={() => handleCancel(l)}>Cancel</Button>
                      ) : (
                        <Button onClick={() => handleBuy(l)} disabled={!canAfford}>Buy</Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}