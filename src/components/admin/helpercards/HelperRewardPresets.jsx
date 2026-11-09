import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import { customPetStorageId } from '@/lib/redeemReward';
import { loadGiftableTracks } from '@/lib/songGift';

const TYPES = [
  { value: 'xp', label: '✨ XP' },
  { value: 'coins', label: '🪙 Quest Coins' },
  { value: 'pet', label: '🐾 Pet' },
  { value: 'theme', label: '🎨 Theme' },
  { value: 'song', label: '🎵 Song' },
  { value: 'title', label: '🏷️ Title' },
  { value: 'onepassplus', label: '⭐ 1Pass Plus' },
];

const newId = () => `preset_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// The short list of gifts a helper card is allowed to hand out. Every gift type
// the app can give is offered here, so a card is never limited to XP and coins.
export default function HelperRewardPresets({ presets = [], onChange }) {
  const [customPets, setCustomPets] = useState([]);
  const [customThemes, setCustomThemes] = useState([]);
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    base44.entities.CustomPet.list('-created_date', 200).then((rows) => setCustomPets(rows || [])).catch(() => {});
    base44.entities.CustomTheme.list('-created_date', 200).then((rows) => setCustomThemes(rows || [])).catch(() => {});
    loadGiftableTracks().then((rows) => setTracks(rows || [])).catch(() => {});
  }, []);

  const options = {
    pet: [
      ...PETS.map((pet) => ({ value: pet.id, label: `${pet.emoji || '🐾'} ${pet.name}` })),
      ...customPets.map((pet) => ({ value: customPetStorageId(pet.id), label: `${pet.emoji || '🐾'} ${pet.name}` })),
    ],
    theme: [
      ...THEMES.map((theme) => ({ value: theme.id, label: theme.name })),
      ...customThemes.map((theme) => ({ value: `custom_${theme.id}`, label: theme.name })),
    ],
    song: (tracks || []).map((track) => ({ value: track.id, label: track.title })),
  };

  const defaultsFor = (type) => {
    if (type === 'xp' || type === 'coins') {
      return { amount: 25, value: '', label: type === 'xp' ? '+25 XP' : '+25 Quest Coins' };
    }
    if (type === 'title') return { amount: 0, value: '', label: 'Title' };
    if (type === 'onepassplus') return { amount: 0, value: '', label: '⭐ 1Pass Plus' };
    const first = options[type]?.[0];
    return { amount: 0, value: first?.value || '', label: first?.label || type };
  };

  const update = (index, patch) =>
    onChange(presets.map((preset, i) => (i === index ? { ...preset, ...patch } : preset)));

  const changeType = (index, type) => update(index, { type, ...defaultsFor(type) });

  const add = () => onChange([...presets, { id: newId(), type: 'xp', ...defaultsFor('xp') }]);

  const remove = (index) => onChange(presets.filter((_, i) => i !== index));

  const setAmount = (index, raw) => {
    const amount = Math.trunc(Number(raw) || 0);
    const isCoins = presets[index]?.type === 'coins';
    update(index, { amount, label: isCoins ? `+${amount} Quest Coins` : `+${amount} XP` });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label className="text-slate-300">Rewards this card may grant</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={add}
          className="h-7 text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <Plus className="w-3.5 h-3.5 mr-1" /> Add
        </Button>
      </div>

      <div className="mt-1 space-y-2">
        {presets.length === 0 && (
          <p className="text-[10px] text-slate-500">With no rewards listed, this card can't grant any.</p>
        )}

        {presets.map((preset, index) => (
          <div key={preset.id || index} className="space-y-1.5 rounded-xl border border-slate-700 bg-slate-800 p-2">
            <div className="flex items-center gap-1.5">
              <Select value={preset.type || 'xp'} onValueChange={(value) => changeType(index, value)}>
                <SelectTrigger className="h-8 flex-1 bg-slate-900 border-slate-600 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-slate-900"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            {(preset.type === 'xp' || preset.type === 'coins') && (
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={preset.amount ?? 25}
                  onChange={(e) => setAmount(index, e.target.value)}
                  className="w-24 h-8 bg-slate-900 border-slate-600 text-white"
                />
                <span className="text-[10px] text-slate-400">
                  {preset.type === 'coins' ? 'Quest Coins' : 'XP'}
                </span>
              </div>
            )}

            {preset.type === 'title' && (
              <Input
                value={preset.value || ''}
                onChange={(e) => update(index, { value: e.target.value, label: e.target.value || 'Title' })}
                placeholder="Title text, e.g. Card Collector"
                className="h-8 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            )}

            {['pet', 'theme', 'song'].includes(preset.type) && (
              options[preset.type]?.length ? (
                <Select
                  value={preset.value || ''}
                  onValueChange={(value) => {
                    const picked = options[preset.type].find((option) => option.value === value);
                    update(index, { value, label: picked?.label || value });
                  }}
                >
                  <SelectTrigger className="h-8 bg-slate-900 border-slate-600 text-white text-xs">
                    <SelectValue placeholder="Choose one" />
                  </SelectTrigger>
                  <SelectContent>
                    {options[preset.type].map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-[10px] text-amber-300">Nothing to choose from yet.</p>
              )
            )}

            {preset.type === 'onepassplus' && (
              <p className="text-[10px] text-slate-400">Gives 1Pass Plus with no expiry.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}