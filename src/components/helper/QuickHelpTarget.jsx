import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowLeft, Check, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACTION_LABELS } from '@/lib/helperCards';

// Step 4: who is being helped, for the action already picked in the menu.
// A student already signed in on this device is preselected and shown first.
export default function QuickHelpTarget({ card, actionType, onContinue, onBack }) {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [targetId, setTargetId] = useState('');
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
  const filtered = profiles
    .filter((p) => !search.trim() || String(p.username || '').toLowerCase().includes(search.trim().toLowerCase()))
    .slice(0, 40);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Action</p>
        <p className="text-xs text-white mt-0.5">{ACTION_LABELS[actionType] || 'Quick Help'}</p>
      </div>

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
        <div className="mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-slate-700 divide-y divide-slate-700/70">
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

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onBack} className="border-slate-600 text-slate-300 hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button
          onClick={() => onContinue(target)}
          disabled={!target}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}