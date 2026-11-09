import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Gift, Music, KeyRound, LogIn, ArrowLeft } from 'lucide-react';
import { helperAllows } from '@/lib/helperCards';

export const HELPER_ACTIONS = [
  { type: 'fix_xp', key: 'fixXp', label: 'Fix Missing XP', hint: 'Add XP with a reason', icon: Sparkles },
  { type: 'grant_reward', key: 'grantReward', label: 'Grant Reward', hint: 'Send an allowed reward', icon: Gift },
  { type: 'gift_song', key: 'giftSong', label: 'Gift a Song', hint: 'Add a song to their library', icon: Music },
  { type: 'reset_passcode', key: 'resetPasscode', label: 'Reset Passcode', hint: 'Let them set a new PIN', icon: KeyRound },
  { type: 'switch_account', key: 'switchAccount', label: 'Switch Account', hint: 'Change who is signed in', icon: LogIn },
];

// The menu a scan opens: only what this card is allowed to do is listed.
export default function QuickHelpMenu({ card, onPick, onBack }) {
  const allowed = HELPER_ACTIONS.filter((action) => helperAllows(card, action.type));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-300">Menu</p>
        <p className="text-xs text-white mt-0.5">
          {card?.nickname || 'Helper card'} — choose what to do, then pick the student.
        </p>
      </div>

      <div className="space-y-2">
        {allowed.map((action) => (
          <button
            key={action.type}
            type="button"
            onClick={() => onPick(action.type)}
            className="w-full flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-left transition-colors hover:border-indigo-400 hover:bg-slate-700/60"
          >
            <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <action.icon className="w-4 h-4 text-indigo-300" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-white leading-tight">{action.label}</span>
              <span className="block text-[10px] text-slate-400 leading-tight mt-0.5">{action.hint}</span>
            </span>
          </button>
        ))}
        {allowed.length === 0 && (
          <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
            This card has no allowed actions. Ask an admin to set them under Helper Cards.
          </p>
        )}
      </div>

      <Button
        variant="outline"
        onClick={onBack}
        className="border-slate-600 text-slate-300 hover:bg-slate-800"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>
    </div>
  );
}