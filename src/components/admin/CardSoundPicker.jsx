import React from 'react';
import { Volume2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  SCAN_SOUNDS, REJECT_SOUNDS, DEFAULT_SCAN_SOUND, DEFAULT_REJECT_SOUND,
} from '@/lib/scanSound';

function Pills({ sounds, value, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {sounds.map((sound) => {
        const active = sound.id === value;
        return (
          <button
            key={sound.id}
            type="button"
            onClick={() => onSelect(sound.id)}
            className={cn(
              'flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
              active
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            {active && <Volume2 className="w-3 h-3" />}
            {sound.label}
          </button>
        );
      })}
    </div>
  );
}

// Per-card sounds: the chime that plays when this card is recognised, and the
// sound that plays when it is refused. Tapping a pill plays it as a preview.
export default function CardSoundPicker({ successSound, rejectSound, onSuccess, onReject }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-3">
      <div className="space-y-1.5">
        <Label className="text-slate-700">Chime when scanned</Label>
        <Pills sounds={SCAN_SOUNDS} value={successSound || DEFAULT_SCAN_SOUND} onSelect={onSuccess} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-slate-700">Sound when rejected</Label>
        <Pills sounds={REJECT_SOUNDS} value={rejectSound || DEFAULT_REJECT_SOUND} onSelect={onReject} />
        <p className="text-[11px] text-slate-500">Plays when this card is disabled or its PIN is wrong.</p>
      </div>
    </div>
  );
}