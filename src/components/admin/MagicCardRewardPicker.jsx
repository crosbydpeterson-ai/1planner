import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PETS } from '@/components/quest/PetCatalog';
import { CUSTOM_PET_PREFIX, customPetStorageId } from '@/lib/redeemReward';

// One optional reward on a magic card: what the linked account receives the
// first time the card is scanned. Kept out of the sign-in fields, so changing
// the reward never changes how a card logs in.
export default function MagicCardRewardPicker({ reward, onChange, label = 'Card reward (optional)', note }) {
  const [customPets, setCustomPets] = useState([]);
  const type = reward?.type || 'none';

  useEffect(() => {
    let cancelled = false;
    base44.entities.CustomPet.list('-created_date')
      .then((rows) => { if (!cancelled) setCustomPets(rows || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const petOptions = [
    ...PETS.map((pet) => ({ id: pet.id, label: `${pet.emoji} ${pet.name}` })),
    ...customPets.map((pet) => ({
      id: customPetStorageId(pet.id),
      label: `${pet.emoji || '🐾'} ${pet.name}`,
    })),
  ];

  const switchType = (next) => {
    if (next === 'none') return onChange(null);
    if (next === 'pet') {
      const first = petOptions[0];
      return onChange({ type: 'pet', petId: first?.id || '', label: first?.label || '' });
    }
    if (next === 'xp' || next === 'coins') {
      const amount = Number(reward?.amount) || 25;
      return onChange({
        type: next,
        amount,
        label: next === 'xp' ? `+${amount} XP` : `+${amount} Quest Coins`,
      });
    }
    if (next === 'title') return onChange({ type: 'title', title: '', label: 'Title' });
    return onChange({ type: 'onepassplus', label: '⭐ 1Pass Plus' });
  };

  const setPet = (petId) => {
    const pet = petOptions.find((p) => p.id === petId);
    onChange({ type: 'pet', petId, label: pet?.label || 'Pet' });
  };

  const setAmount = (raw) => {
    const amount = Math.trunc(Number(raw) || 0);
    onChange({
      ...reward,
      type: reward?.type === 'coins' ? 'coins' : 'xp',
      amount,
      label: reward?.type === 'coins' ? `+${amount} Quest Coins` : `+${amount} XP`,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-slate-700">{label}</Label>
        {type !== 'none' && (
          <button type="button" onClick={() => onChange(null)} className="text-xs font-semibold text-red-600">
            Remove
          </button>
        )}
      </div>

      <Select value={type} onValueChange={switchType}>
        <SelectTrigger className="h-11 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No reward</SelectItem>
          <SelectItem value="pet">🐾 A pet</SelectItem>
          <SelectItem value="onepassplus">⭐ 1Pass Plus</SelectItem>
          <SelectItem value="xp">✨ XP</SelectItem>
          <SelectItem value="coins">🪙 Quest Coins</SelectItem>
          <SelectItem value="title">🏷️ A title</SelectItem>
        </SelectContent>
      </Select>

      {type === 'pet' && (
        <Select value={reward?.petId || ''} onValueChange={setPet}>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Choose a pet" />
          </SelectTrigger>
          <SelectContent>
            {petOptions.map((pet) => (
              <SelectItem key={pet.id} value={pet.id}>{pet.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {(type === 'xp' || type === 'coins') && (
        <Input
          type="number"
          min={1}
          value={reward?.amount ?? 25}
          onChange={(e) => setAmount(e.target.value)}
          className="h-11 rounded-xl"
        />
      )}

      {type === 'title' && (
        <Input
          value={reward?.title || ''}
          onChange={(e) => onChange({ type: 'title', title: e.target.value, label: e.target.value || 'Title' })}
          placeholder="Title text, e.g. Card Collector"
          className="h-11 rounded-xl"
        />
      )}

      <p className="text-[11px] text-slate-500">
        {note ||
          (type === 'none'
            ? 'This card only opens its account.'
            : 'Given to the linked account the first time this card is scanned — once per account.')}
      </p>
    </div>
  );
}