import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Gift, KeyRound, LogIn, Search, ArrowLeft, Check, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { helperAllows } from '@/lib/helperCards';

const ACTIONS = [
  { type: 'fix_xp', key: 'fixXp', label: 'Fix Missing XP', hint: 'Add XP with a reason', icon: Sparkles },
  { type: 'grant_reward', key: 'grantReward', label: 'Grant Reward', hint: 'Send an allowed reward', icon: Gift },
  { type: 'reset_passcode', key: 'resetPasscode', label: 'Reset Passcode', hint: 'Let them set a new PIN', icon: KeyRound },
  { type: 'switch_account', key: 'switchAccount', label: 'Switch Account', hint: 'Change who is signed in', icon: LogIn },
];

// Step 3: who is being helped, and with which of the card's allowed actions.
// A student already signed in on this device is preselected and shown first.
export default function QuickHelpTarget({ card, onContinue, onBack }) {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [targetId, setTargetId] = useState('');
  const [actionType, setActionType] = useState('');
  const signedInId = useMemo(() => localStorage.getItem('quest_profile_id'), []);

  useEffect(() => {
    (async () => {
      try {
        setProfiles(await base44.entities.UserProfile.list('-created_date'));
      } catch (e) {
        console.error('Failed to load profiles:', e);
      }
    })();
  }, []);

  // Preselect the signed-in student, but never the admin who owns the card.
  useEffect(() => {
    if (!signedInId || signedInId === card?.adminProfileId) return;
    if (profiles.some((p) => p.id === signedInId)) setTargetId((id) => id || signedInId);
  }, [profiles, signedInId, card]);

  const target = profiles.find((p) => p.id === targetId) || null;
  const allowed = ACTIONS.filter((action) => helperAllows(card, action.type));
  const filtered = profiles
    .filter((p) => !search.trim() || String(p.username || '').toLowerCase().includes(search.trim().toLowerCase()))
    .slice(0, 40);

  return (
    <div className="space-y-4">
      {target && (
        <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-300">You're about to help</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center text-white text-xs font-bold">
              {(target.username || '?').slice(0, 2).toUpperCase()}
            </div>
            <p className="text-sm font-bold text-white truncate">{target.username}</p>
            {target.id === signedInId && (
              <span className="text-[10px] text-indigo-200 bg-indigo-500/20 rounded-full px-2 py-0.5">
                signed in here
              </span>
            )}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Student</p>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search a username"
            className="pl-9 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
          />
        </div>
        <div className="mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-slate-700 divide-y divide-slate-700/70">
          {filtered.length === 0 ? (
            <p className="p-3 text-xs text-slate-500">No account matches that name.</p>
          ) : (
            filtered.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => setTargetId(profile.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                  targetId === profile.id ? 'bg-indigo-500/15' : 'hover:bg-slate-800'
                )}
              >
                <UserRound className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-sm text-white truncate flex-1">{profile.username || profile.userId}</span>
                {targetId === profile.id && <Check className="w-4 h-4 text-indigo-300" />}
              </button>
            ))
          )}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">What to do</p>
        <div className="grid grid-cols-2 gap-2">
          {allowed.map((action) => (
            <button
              key={action.type}
              type="button"
              onClick={() => setActionType(action.type)}
              className={cn(
                'rounded-xl border p-2.5 text-left transition-colors',
                actionType === action.type
                  ? 'border-indigo-400 bg-indigo-500/15'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              )}
            >
              <action.icon className="w-4 h-4 text-indigo-300 mb-1" />
              <p className="text-xs font-semibold text-white leading-tight">{action.label}</p>
              <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{action.hint}</p>
            </button>
          ))}
        </div>
        {allowed.length === 0 && (
          <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
            This card has no allowed actions. Ask an admin to set them under Helper Cards.
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onBack} className="border-slate-600 text-slate-300 hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button
          onClick={() => onContinue({ target, actionType })}
          disabled={!target || !actionType}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}