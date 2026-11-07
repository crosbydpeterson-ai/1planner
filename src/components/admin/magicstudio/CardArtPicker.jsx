import React from 'react';
import { STICKERS } from '@/lib/cardDesigns';
import { cn } from '@/lib/utils';

const chip = (active) =>
  cn(
    'h-9 w-9 rounded-lg border text-lg flex items-center justify-center transition overflow-hidden',
    active ? 'border-indigo-400 ring-2 ring-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
  );

export default function CardArtPicker({ design, pets = [], onChange }) {
  const pickSticker = (sticker) => onChange({ ...design, sticker, petId: '', petEmoji: '', petImageUrl: '' });
  const pickPet = (pet) =>
    onChange({ ...design, petId: pet.id, petEmoji: pet.emoji || '', petImageUrl: pet.imageUrl || '' });
  const clear = () => onChange({ ...design, sticker: '', petId: '', petEmoji: '', petImageUrl: '' });

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Sticker</p>
        <div className="flex flex-wrap gap-1.5">
          {STICKERS.map((sticker) => (
            <button
              key={sticker}
              type="button"
              onClick={() => pickSticker(sticker)}
              className={chip(!design.petId && design.sticker === sticker)}
            >
              {sticker}
            </button>
          ))}
          <button type="button" onClick={clear} className={cn(chip(false), 'text-[10px] text-slate-500')}>
            none
          </button>
        </div>
      </div>

      {pets.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Owned pets</p>
          <div className="flex flex-wrap gap-1.5">
            {pets.map((pet) => (
              <button
                key={pet.id}
                type="button"
                onClick={() => pickPet(pet)}
                title={pet.name}
                className={chip(design.petId === pet.id)}
              >
                {pet.imageUrl ? (
                  <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  pet.emoji || '🐾'
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}