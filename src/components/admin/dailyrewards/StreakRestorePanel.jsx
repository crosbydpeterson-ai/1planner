import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Flame, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getChicagoDateKey } from '@/lib/dailyRewardUtils';

/**
 * StreakRestorePanel — lets admins search for a user, view their daily reward
 * streak status, and restore or adjust their streak count and eligibility.
 */
export default function StreakRestorePanel() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [newStreak, setNewStreak] = useState(0);
  const [makeEligible, setMakeEligible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchError, setSearchError] = useState('');

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    setFoundUser(null);
    setProgress(null);
    try {
      let users = [];
      // Try by profile ID first
      if (q.length > 10 && !q.includes('@') && !q.includes(' ')) {
        try {
          const byId = await base44.entities.UserProfile.filter({ id: q });
          if (byId.length > 0) users = byId;
        } catch { /* ignore */ }
      }
      // Fallback: search by username (case-insensitive via regex)
      if (users.length === 0) {
        try {
          const byName = await base44.entities.UserProfile.filter({ username: { $regex: q, $options: 'i' } }, { limit: 10 });
          users = byName || [];
        } catch {
          users = [];
        }
      }

      if (users.length === 0) {
        setSearchError('No user found. Try their exact username or profile ID.');
        setSearching(false);
        return;
      }
      if (users.length > 1) {
        // Show first match, note there are more
        setSearchError(`${users.length} matches found — showing first. Refine your search if needed.`);
      }
      const user = users[0];
      setFoundUser(user);
      setNewStreak(user.streakCount || 0);

      // Load their daily reward progress
      const progRows = await base44.entities.DailyRewardProgress.filter({ userProfileId: user.id });
      const prog = progRows.length > 0 ? progRows[0] : null;
      setProgress(prog);
      if (prog) setNewStreak(prog.streakCount || 0);
    } catch (e) {
      console.error('Search failed', e);
      setSearchError('Search failed. Please try again.');
    }
    setSearching(false);
  }, [query]);

  const restore = async () => {
    if (!foundUser) return;
    setSaving(true);
    try {
      const today = getChicagoDateKey();
      const patch = {
        streakCount: Math.max(0, Math.floor(Number(newStreak) || 0)),
      };
      if (makeEligible) {
        // Set lastClaimDate to yesterday so they're eligible to claim today
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        patch.lastClaimDate = yesterday.toISOString().slice(0, 10);
        patch.eligible = true;
      }

      let updated;
      if (progress?.id) {
        updated = await base44.entities.DailyRewardProgress.update(progress.id, patch);
      } else {
        updated = await base44.entities.DailyRewardProgress.create({
          userProfileId: foundUser.id,
          ...patch,
        });
      }
      setProgress(updated);
      setMakeEligible(false);
      toast.success(`Streak restored to ${patch.streakCount} for ${foundUser.username}`);
    } catch (e) {
      console.error('Restore failed', e);
      toast.error('Failed to restore streak');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') search(); }}
          placeholder="Enter username or profile ID…"
          className="bg-slate-700 border-slate-600"
        />
        <Button onClick={search} disabled={searching || !query.trim()} className="bg-indigo-600 hover:bg-indigo-700">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
          {searching ? '' : 'Search'}
        </Button>
      </div>

      {searchError && (
        <div className="flex items-start gap-2 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {searchError}
        </div>
      )}

      {foundUser && (
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 space-y-4">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-lg">
              {foundUser.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-white font-medium">{foundUser.username}</p>
              <p className="text-xs text-slate-400">XP: {foundUser.xp || 0} • Coins: {foundUser.questCoins || 0}</p>
            </div>
          </div>

          {/* Current streak info */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800 rounded-lg p-2.5">
              <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white">{progress?.streakCount ?? 0}</p>
              <p className="text-xs text-slate-400">Current Streak</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-2.5">
              <p className="text-lg font-bold text-white">{progress?.currentIndex ?? 0}</p>
              <p className="text-xs text-slate-400">Track Index</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-2.5">
              <p className="text-sm font-bold text-white truncate">{progress?.lastClaimDate || 'Never'}</p>
              <p className="text-xs text-slate-400">Last Claim</p>
            </div>
          </div>

          {/* Restore controls */}
          <div className="space-y-3 pt-2 border-t border-slate-700">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-sm">New streak count</Label>
              <Input
                type="number"
                min="0"
                value={newStreak}
                onChange={(e) => setNewStreak(e.target.value)}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={makeEligible}
                onChange={(e) => setMakeEligible(e.target.checked)}
                className="rounded"
              />
              Make eligible to claim today (resets last claim to yesterday)
            </label>
            <Button
              onClick={restore}
              disabled={saving}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              {saving ? 'Restoring…' : 'Restore Streak'}
            </Button>
          </div>
        </div>
      )}

      {!foundUser && !searchError && !searching && (
        <div className="text-center py-6 text-slate-500 text-sm">
          <Flame className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Search for a user above to view and restore their daily reward streak.
        </div>
      )}
    </div>
  );
}