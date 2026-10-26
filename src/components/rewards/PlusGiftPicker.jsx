import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Crown, Loader2 } from 'lucide-react';
import { plusAnchorSeason, plusExpiryForSeasons } from '@/lib/plusAccess';

const SEASON_LENGTHS = [1, 2, 3, 4, 5, 6];

/**
 * Lets the gifting admin choose how long a gifted 1Pass Plus lasts, measured in
 * seasons, and shows the resulting end date before it is sent.
 */
export default function PlusGiftPicker({ sending, canGrantPermanent, onGift }) {
  const [seasons, setSeasons] = useState(null);
  const [length, setLength] = useState('1');

  useEffect(() => {
    base44.entities.Season.list('-startDate')
      .then(setSeasons)
      .catch((err) => {
        console.error('Could not load seasons', err);
        setSeasons([]);
      });
  }, []);

  const seasonCount = length === 'permanent' ? 0 : Number(length);
  const expiresAt = plusExpiryForSeasons(seasons || [], seasonCount);
  const timed = seasonCount > 0;
  // A timed grant needs a real end date — never let one fall back to permanent.
  const blocked = timed && !expiresAt;
  const noSeasons = Array.isArray(seasons) && seasons.length === 0;
  const anchor = seasons && seasons.length > 0 ? plusAnchorSeason(seasons) : null;

  if (seasons === null) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <select
        value={length}
        onChange={(e) => setLength(e.target.value)}
        className="w-full bg-white/40 backdrop-blur-sm border border-white/40 text-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none"
      >
        {SEASON_LENGTHS.map((n) => (
          <option key={n} value={String(n)}>{n} season{n > 1 ? 's' : ''}</option>
        ))}
        {canGrantPermanent && <option value="permanent">No expiry (permanent)</option>}
      </select>

      {blocked ? (
        <p className="text-[11px] bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg px-2 py-1.5">
          {noSeasons
            ? "No seasons are set up yet, so a season length can't be measured. Create a season first."
            : "Those seasons have no end date, so a season length can't be measured."}
        </p>
      ) : timed ? (
        <p className="text-[11px] text-slate-400">
          {anchor ? `Counted from ${anchor.name}: ` : ''}Plus runs through the end of that season — until{' '}
          <span className="text-yellow-300 font-semibold">{new Date(expiresAt).toLocaleDateString()}</span>.
        </p>
      ) : (
        <p className="text-[11px] text-slate-400">Plus stays on until an admin removes it.</p>
      )}

      <Button
        onClick={() => onGift({ seasonCount, expiresAt: timed ? expiresAt : null })}
        disabled={sending || blocked}
        className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 font-semibold"
      >
        <Crown className="w-4 h-4" /> Gift 1Pass Plus
      </Button>
    </div>
  );
}