import React, { useMemo, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import PetAvatar from '@/components/quest/PetAvatar';
import { base44 } from '@/api/base44Client';
import { getPetName, collectCustomIds } from '@/components/quest/petUtils';

export default function TradeOfferDialog({ open, onOpenChange, listing, buyerProfile, onCreated }) {
  const [selectedPet, setSelectedPet] = useState('');
  const myPets = useMemo(() => Array.isArray(buyerProfile?.unlockedPets) ? buyerProfile.unlockedPets : [], [buyerProfile]);
  const [customMap, setCustomMap] = useState({});

  useEffect(() => {
    const load = async () => {
      const ids = collectCustomIds(myPets);
      if (ids.length === 0) { setCustomMap({}); return; }
      const results = await Promise.all(ids.map(id => base44.entities.CustomPet.filter({ id })));
      const map = {};
      results.forEach(arr => { if (arr?.[0]) map[arr[0].id] = arr[0]; });
      setCustomMap(map);
    };
    load();
  }, [myPets]);

  const submit = async () => {
    if (!selectedPet || !listing) return;
    await base44.entities.TradeOffer.create({
      listingId: listing.id,
      offererProfileId: buyerProfile.id,
      receiverProfileId: listing.sellerProfileId,
      offeredPetId: selectedPet,
      requestedPetId: listing.petId,
      status: 'pending'
    });
    onOpenChange(false);
    setSelectedPet('');
    onCreated && onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Offer a Trade</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 items-center">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">You Offer</div>
            {selectedPet ? <PetAvatar petId={selectedPet} size="md" /> : <div className="h-24 flex items-center justify-center text-slate-400">Select a pet</div>}
            <Select value={selectedPet} onValueChange={setSelectedPet}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Choose your pet" /></SelectTrigger>
              <SelectContent>
                {myPets.map(pid => (
                  <SelectItem key={pid} value={pid}>{getPetName(pid, customMap)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">You Want</div>
            <PetAvatar petId={listing?.petId} size="md" />
            <div className="mt-2 text-sm text-slate-600">From seller</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!selectedPet}>Send Offer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}