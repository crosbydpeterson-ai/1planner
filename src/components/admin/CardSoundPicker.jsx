import React from 'react';
import SoundChoiceRow from '@/components/admin/magicstudio/SoundChoiceRow';
import { SCAN_SOUNDS, REJECT_SOUNDS, playScanSound, playRejectSound } from '@/lib/scanSound';

// Per-card sounds: the chime that plays when this card is recognised, and the
// sound that plays when it is refused. Built-in chimes, or an uploaded file.
export default function CardSoundPicker({
  successSound, successSoundUrl, rejectSound, rejectSoundUrl, onChange,
}) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-3">
      <SoundChoiceRow
        label="Chime when scanned"
        hint="Tap a sound to hear it."
        sounds={SCAN_SOUNDS}
        value={successSound}
        url={successSoundUrl}
        onChange={({ sound, url }) => {
          onChange({ successSound: sound, successSoundUrl: url });
          playScanSound(sound, url);
        }}
      />
      <SoundChoiceRow
        label="Sound when rejected"
        hint="Plays when this card is disabled or its PIN is wrong."
        sounds={REJECT_SOUNDS}
        value={rejectSound}
        url={rejectSoundUrl}
        onChange={({ sound, url }) => {
          onChange({ rejectSound: sound, rejectSoundUrl: url });
          playRejectSound(sound, url);
        }}
      />
    </div>
  );
}