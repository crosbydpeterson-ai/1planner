import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Check, Loader2, AlertTriangle, Sparkles, Gift, Music, KeyRound, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadGiftableTracks } from '@/lib/songGift';

const TITLES = {
  fix_xp: { label: 'Fix Missing XP', icon: Sparkles },
  grant_reward: { label: 'Grant Reward', icon: Gift },
  gift_song: { label: 'Gift a Song', icon: Music },
  reset_passcode: { label: 'Reset Passcode', icon: KeyRound },
  switch_account: { label: 'Switch Account', icon: LogIn },
};

// Step 4: the detail for the one action this scan will make, shown with what
// will change before anything is written.
export default function QuickHelpActionForm({ card, actionType, target, onConfirm, onBack, busy }) {
  const presets = card.rewardPresets || [];
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [presetId, setPresetId] = useState(presets[0]?.id || '');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [ack, setAck] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [songId, setSongId] = useState('');
  const [songSearch, setSongSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (actionType !== 'gift_song') return;
    loadGiftableTracks()
      .then(setTracks)
      .catch((e) => console.error('Failed to load songs:', e));
  }, [actionType]);

  const songs = tracks.filter(
    (track) => !songSearch.trim() || String(track.title || '').toLowerCase().includes(songSearch.trim().toLowerCase())
  );

  const preset = presets.find((p) => p.id === presetId) || null;
  const xpNow = Number(target.xp) || 0;
  const coinsNow = Number(target.questCoins) || 0;
  const signedInName = localStorage.getItem('quest_username') || 'previous account';
  const title = TITLES[actionType] || TITLES.fix_xp;

  const confirm = () => {
    if (busy) return;
    setError('');
    if (actionType === 'fix_xp') {
      const value = Math.trunc(Number(amount));
      if (!value) return setError('Enter the XP amount to add.');
      if (!reason.trim()) return setError('A reason is required for an XP fix.');
      return onConfirm({ amount: value, reason: reason.trim() });
    }
    if (actionType === 'grant_reward') {
      if (!preset) return setError("Choose one of this card's rewards.");
      return onConfirm({ preset });
    }
    if (actionType === 'gift_song') {
      const song = tracks.find((track) => track.id === songId);
      if (!song) return setError('Pick the song to gift.');
      return onConfirm({ song: { id: song.id, title: song.title } });
    }
    if (actionType === 'reset_passcode') {
      if (!/^\d{4}$/.test(pin)) return setError('The new passcode must be 4 digits.');
      if (pin !== pin2) return setError('The two passcodes do not match.');
      return onConfirm({ pin });
    }
    if (!ack) return setError('Tick the box to confirm the account change.');
    return onConfirm({ fromName: signedInName });
  };

  const preview = () => {
    if (actionType === 'fix_xp') {
      const value = Math.trunc(Number(amount)) || 0;
      return value
        ? `${target.username}: ${xpNow} → ${xpNow + value} XP`
        : `Current XP: ${xpNow}`;
    }
    if (actionType === 'grant_reward') {
      if (!preset) return 'No reward chosen yet.';
      const now = preset.type === 'coins' ? coinsNow : xpNow;
      const unit = preset.type === 'coins' ? 'Quest Coins' : 'XP';
      return `${target.username}: ${now} → ${now + preset.amount} ${unit}`;
    }
    if (actionType === 'gift_song') {
      const song = tracks.find((track) => track.id === songId);
      return song ? `🎵 "${song.title}" → ${target.username}'s music` : 'No song picked yet.';
    }
    if (actionType === 'reset_passcode') {
      return `${target.username} picks a new 4-digit passcode on this device.`;
    }
    return `${signedInName} → ${target.username}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <title.icon className="w-4 h-4 text-indigo-300" />
        <p className="text-sm font-bold text-white">{title.label}</p>
        <span className="ml-auto text-[11px] text-slate-400 truncate">{target.username}</span>
      </div>

      {actionType === 'fix_xp' && (
        <>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">XP to add</p>
            <Input
              type="number"
              inputMode="numeric"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              placeholder="25"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Reason</p>
            <Textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder="Math retry was marked complete but never counted"
              rows={2}
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 resize-none"
            />
          </div>
        </>
      )}

      {actionType === 'grant_reward' && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            Rewards this card may send
          </p>
          {presets.length === 0 ? (
            <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
              This card has no rewards set up yet. Add them under Helper Cards.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {presets.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setPresetId(option.id)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-left transition-colors',
                    presetId === option.id
                      ? 'border-indigo-400 bg-indigo-500/15'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  )}
                >
                  <p className="text-xs font-semibold text-white leading-tight">{option.label}</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {option.type === 'coins' ? 'Quest Coins' : 'XP'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {actionType === 'gift_song' && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Song to gift</p>
          <Input
            value={songSearch}
            onChange={(e) => setSongSearch(e.target.value)}
            placeholder="Search songs"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
          />
          <div className="mt-1.5 max-h-44 overflow-y-auto rounded-xl border border-slate-700 divide-y divide-slate-700/70">
            {songs.length === 0 ? (
              <p className="p-3 text-xs text-slate-500">
                {tracks.length === 0 ? 'No songs in the library yet.' : 'No song matches that title.'}
              </p>
            ) : (
              songs.map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => { setSongId(track.id); setError(''); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                    songId === track.id ? 'bg-indigo-500/15' : 'hover:bg-slate-800'
                  )}
                >
                  <Music className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-white truncate flex-1">{track.title}</span>
                  {songId === track.id && <Check className="w-4 h-4 text-indigo-300" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {actionType === 'reset_passcode' && (
        <>
          <p className="text-[11px] text-slate-300 bg-slate-800 border border-slate-700 rounded-lg p-2">
            Hand the device to the student for this step — they choose the new passcode, and it replaces the old one
            on this device only.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
              placeholder="New passcode"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
            <Input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin2}
              onChange={(e) => { setPin2(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
              placeholder="Repeat it"
              className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
        </>
      )}

      {actionType === 'switch_account' && (
        <button
          type="button"
          onClick={() => { setAck(!ack); setError(''); }}
          className={cn(
            'w-full flex items-start gap-2 rounded-xl border p-3 text-left transition-colors',
            ack ? 'border-indigo-400 bg-indigo-500/15' : 'border-slate-700 bg-slate-800'
          )}
        >
          <span className={cn('mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
            ack ? 'bg-indigo-500 border-indigo-400' : 'border-slate-500')}>
            {ack && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </span>
          <span className="text-[11px] text-slate-200">
            This device will stop being signed in as <strong>{signedInName}</strong> and sign in as{' '}
            <strong>{target.username}</strong> on this device.
          </span>
        </button>
      )}

      <div className="rounded-lg bg-slate-800/60 border border-slate-700 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Before you confirm</p>
        <p className="text-xs text-white mt-0.5">{preview()}</p>
      </div>

      {error && (
        <p className="flex items-start gap-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onBack} disabled={busy} className="border-slate-600 text-slate-300 hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button onClick={confirm} disabled={busy} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
          {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
          Confirm
        </Button>
      </div>
      <p className="text-[10px] text-slate-500 text-center">
        One action per scan — after this, the card must be scanned again.
      </p>
    </div>
  );
}