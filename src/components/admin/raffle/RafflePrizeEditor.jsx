import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { PETS } from '@/components/quest/PetCatalog';
import { FEATURES, PRIZE_TYPES, normalizedRewardData, prizeEmoji } from '@/lib/raffleLogic';

/** Stable prize ids: a saved result points at one, so it must never be a list index. */
export const makePrizeId = () => `pz_${Date.now().toString(36)}${Math.floor(Math.random() * 46656).toString(36)}`;

export const newPrize = () => ({
  id: makePrizeId(),
  rewardType: 'xp',
  rewardData: { amount: 250 },
  label: '',
  quantity: 1,
});

export const newBaseReward = () => ({
  id: 'base',
  rewardType: 'xp',
  rewardData: { amount: 50 },
  label: '',
});

const defaultDataFor = (rewardType) => {
  switch (rewardType) {
    case 'xp':
    case 'coins':
      return { amount: 250 };
    case 'pet':
      return { petId: '' };
    case 'title':
      return { title: '' };
    case 'feature_unlock':
      return { feature: 'games' };
    case 'food_item':
      return { itemId: '', quantity: 1 };
    default:
      return {};
  }
};

/** The reward payload fields for one prize type — the same payload RedeemCode stores. */
function RewardFields({ prize, onChange, canUsePlus, customPets }) {
  const data = normalizedRewardData(prize);
  const set = (patch) => onChange({ ...prize, rewardData: { ...(prize.rewardData || {}), ...patch } });
  const inputClass = 'bg-slate-700 border-slate-600 text-white';

  switch (prize.rewardType) {
    case 'xp':
      return (
        <Input
          type="number"
          min="1"
          value={data.amount || ''}
          onChange={(e) => set({ amount: Number(e.target.value) })}
          className={inputClass}
          placeholder="XP amount"
        />
      );
    case 'coins':
      return (
        <Input
          type="number"
          min="1"
          value={data.amount || ''}
          onChange={(e) => set({ amount: Number(e.target.value) })}
          className={inputClass}
          placeholder="Coin amount"
        />
      );
    case 'pet':
      return (
        <Select value={data.petId || ''} onValueChange={(v) => set({ petId: v })}>
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder="Choose a pet" />
          </SelectTrigger>
          <SelectContent>
            {PETS.map((pet) => (
              <SelectItem key={pet.id} value={pet.id}>
                {pet.emoji} {pet.name}
              </SelectItem>
            ))}
            {customPets.map((pet) => (
              <SelectItem key={pet.id} value={`custom_${pet.id}`}>
                {pet.emoji || '🐾'} {pet.name} (custom)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'title':
      return (
        <Input
          value={data.title || ''}
          onChange={(e) => set({ title: e.target.value })}
          className={inputClass}
          placeholder="Title text"
        />
      );
    case 'feature_unlock':
      return (
        <Select value={data.feature || ''} onValueChange={(v) => set({ feature: v })}>
          <SelectTrigger className={inputClass}>
            <SelectValue placeholder="Feature" />
          </SelectTrigger>
          <SelectContent>
            {FEATURES.map((f) => (
              <SelectItem key={f.key} value={f.key}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'food_item':
      return (
        <div className="flex gap-2">
          <Input
            value={data.itemId || ''}
            onChange={(e) => set({ itemId: e.target.value })}
            className={inputClass}
            placeholder="Food item id"
          />
          <Input
            type="number"
            min="1"
            value={data.quantity || 1}
            onChange={(e) => set({ quantity: Number(e.target.value) })}
            className={`${inputClass} w-24`}
          />
        </div>
      );
    case 'onepassplus':
      return (
        <Input
          type="number"
          min="0"
          value={data.seasons ?? 0}
          onChange={(e) => set({ seasons: Number(e.target.value) })}
          className={inputClass}
          placeholder="Seasons (0 = permanent)"
        />
      );
    default:
      return null;
  }
}

const TypeSelect = ({ prize, onChange, canUsePlus }) => (
  <Select
    value={prize.rewardType}
    onValueChange={(v) => {
      if (v === 'onepassplus' && !canUsePlus) return;
      onChange({ ...prize, rewardType: v, rewardData: defaultDataFor(v) });
    }}
  >
    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {PRIZE_TYPES.filter((t) => canUsePlus || !t.superAdminOnly).map((t) => (
        <SelectItem key={t.key} value={t.key}>
          {t.emoji} {t.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default function RafflePrizeEditor({
  prizes = [],
  onChange,
  baseReward,
  onBaseChange,
  canUsePlus = false,
  customPets = [],
}) {
  const update = (id, next) => onChange(prizes.map((p) => (p.id === id ? next : p)));
  const remove = (id) => onChange(prizes.filter((p) => p.id !== id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-slate-300">Prizes</Label>
        <Button
          size="sm"
          variant="ghost"
          className="text-indigo-300 hover:text-white"
          onClick={() => onChange([...prizes, newPrize()])}
        >
          <Plus className="w-4 h-4 mr-1" /> Add prize
        </Button>
      </div>

      {prizes.length === 0 && (
        <p className="text-sm text-slate-400">
          No prizes yet. Add at least one, or set a base reward below for a raffle where everyone wins.
        </p>
      )}

      {prizes.map((prize, index) => (
        <div key={prize.id} className="bg-slate-900/60 rounded-xl p-3 border border-slate-700 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-xs w-16">Prize {index + 1}</span>
            <div className="flex-1">
              <TypeSelect prize={prize} onChange={(next) => update(prize.id, next)} canUsePlus={canUsePlus} />
            </div>
            <Input
              type="number"
              min="1"
              value={prize.quantity}
              onChange={(e) => update(prize.id, { ...prize, quantity: Number(e.target.value) })}
              className="bg-slate-700 border-slate-600 text-white w-20"
              title="How many of this prize"
            />
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300"
              onClick={() => remove(prize.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <RewardFields
              prize={prize}
              onChange={(next) => update(prize.id, next)}
              canUsePlus={canUsePlus}
              customPets={customPets}
            />
            <Input
              value={prize.label || ''}
              onChange={(e) => update(prize.id, { ...prize, label: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder={`Name shown to students (default: ${prizeEmoji(prize.rewardType)} ${prize.rewardType})`}
            />
          </div>
        </div>
      ))}

      {(prizes.length > 0 || baseReward) && (
        <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700 space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-slate-300 text-sm flex-1">Base reward everyone receives</Label>
            {baseReward ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                onClick={() => onBaseChange(null)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-indigo-300 hover:text-white"
                onClick={() => onBaseChange(newBaseReward())}
              >
                <Plus className="w-4 h-4 mr-1" /> Set base reward
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Used by “Everyone wins” once the prize pool runs out, and by “Base reward + drawn prizes” for
            everybody. XP or coins are the safest choice.
          </p>
          {baseReward && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <TypeSelect prize={baseReward} onChange={onBaseChange} canUsePlus={canUsePlus} />
              <RewardFields
                prize={baseReward}
                onChange={onBaseChange}
                canUsePlus={canUsePlus}
                customPets={customPets}
              />
              <Input
                value={baseReward.label || ''}
                onChange={(e) => onBaseChange({ ...baseReward, label: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Name shown to students"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}