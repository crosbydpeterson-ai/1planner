import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * "Start New School Year" confirmation + action.
 * Wipes XP and season XP for all students, clears their teacher assignments,
 * and sets the `teacher_reselect_required` flag so students re-pick teachers
 * on next login. Preserves pets, themes, cosmetics, coins, gems, titles,
 * and unlocked features.
 *
 * Props: open, onOpenChange, onComplete
 */
export default function StartNewYearDialog({ open, onOpenChange, onComplete }) {
  const [confirmText, setConfirmText] = useState('');
  const [running, setRunning] = useState(false);

  const runReset = async () => {
    if (confirmText.trim().toUpperCase() !== 'NEW YEAR') {
      toast.error('Type "NEW YEAR" to confirm');
      return;
    }
    setRunning(true);
    try {
      // 1. Fetch all users
      const allUsers = await base44.entities.UserProfile.list();

      // 2. Bulk-wipe XP + clear teachers in batches of 500
      for (let i = 0; i < allUsers.length; i += 500) {
        const batch = allUsers.slice(i, i + 500).map((u) => ({
          id: u.id,
          xp: 0,
          seasonXp: 0,
          mathTeacher: '',
          readingTeacher: '',
        }));
        if (batch.length > 0) {
          await base44.entities.UserProfile.bulkUpdate(batch);
        }
      }

      // 3. Set the reselect flag
      const settings = await base44.entities.AppSetting.list();
      const existing = settings.find((s) => s.key === 'teacher_reselect_required');
      if (existing) {
        await base44.entities.AppSetting.update(existing.id, { value: { required: true } });
      } else {
        await base44.entities.AppSetting.create({ key: 'teacher_reselect_required', value: { required: true } });
      }

      toast.success(`New school year started! ${allUsers.length} students reset.`);
      setConfirmText('');
      onComplete?.();
      onOpenChange?.(false);
    } catch (e) {
      console.error('New year reset failed', e);
      toast.error('Failed to start new school year');
    }
    setRunning(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!running) onOpenChange?.(o); }}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" /> Start New School Year
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            This resets every student for the new school year. Students will re-pick their teachers on next login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 space-y-1.5">
            <p className="text-xs font-bold text-red-300 uppercase">Will be wiped</p>
            <div className="flex items-center gap-2 text-sm text-red-200"><X className="w-4 h-4" /> All XP</div>
            <div className="flex items-center gap-2 text-sm text-red-200"><X className="w-4 h-4" /> Season (1Pass) XP</div>
            <div className="flex items-center gap-2 text-sm text-red-200"><X className="w-4 h-4" /> Teacher assignments</div>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-1.5">
            <p className="text-xs font-bold text-emerald-300 uppercase">Will be kept</p>
            <div className="flex items-center gap-2 text-sm text-emerald-200"><Check className="w-4 h-4" /> Pets & themes</div>
            <div className="flex items-center gap-2 text-sm text-emerald-200"><Check className="w-4 h-4" /> Cosmetics & titles</div>
            <div className="flex items-center gap-2 text-sm text-emerald-200"><Check className="w-4 h-4" /> Quest Coins & gems</div>
            <div className="flex items-center gap-2 text-sm text-emerald-200"><Check className="w-4 h-4" /> Unlocked features</div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-slate-400">Type <span className="font-mono font-bold text-white">NEW YEAR</span> to confirm:</p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="NEW YEAR"
              className="bg-slate-700 border-slate-600"
              disabled={running}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange?.(false)} disabled={running}>Cancel</Button>
          <Button onClick={runReset} disabled={running} className="bg-red-600">
            {running ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Resetting...</> : 'Start New Year'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}