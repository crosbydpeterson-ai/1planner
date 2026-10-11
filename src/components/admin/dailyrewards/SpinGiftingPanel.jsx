import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Gift, Users, Loader2, Disc3 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Spin Gifting Panel — grant bonus wheel spins to users.
 * Supports single-user search, custom count, and bulk grant to all.
 */
export default function SpinGiftingPanel() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [grantCount, setGrantCount] = useState(1);
  const [grantingId, setGrantingId] = useState(null);
  const [bulkGranting, setBulkGranting] = useState(false);
  const [holders, setHolders] = useState([]);
  const [loadingHolders, setLoadingHolders] = useState(true);

  // Load users who currently hold bonus spins
  const loadHolders = async () => {
    setLoadingHolders(true);
    try {
      const rows = await base44.entities.DailyRewardProgress.filter(
        { bonusWheelTokens: { $gt: 0 } },
        { sort: '-bonusWheelTokens', limit: 50 }
      );
      const items = rows.items || rows;
      // Enrich with username
      const enriched = await Promise.all((items || []).map(async (r) => {
        if (r.username) return r;
        try {
          const p = await base44.entities.UserProfile.filter({ id: r.userProfileId });
          return { ...r, _username: p[0]?.username || 'Unknown' };
        } catch {
          return r;
        }
      }));
      setHolders(enriched);
    } catch (e) {
      console.error('Failed to load spin holders', e);
    }
    setLoadingHolders(false);
  };

  useEffect(() => { loadHolders(); }, []);

  // Debounced search
  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const q = search.trim();
        let users = await base44.entities.UserProfile.filter({ username: { $regex: q, $options: 'i' } }, { limit: 20 });
        let items = users.items || users;
        if (!items.length) {
          users = await base44.entities.UserProfile.filter({ userId: { $regex: q, $options: 'i' } }, { limit: 20 });
          items = users.items || users;
        }
        setResults(items);
      } catch (e) {
        setResults([]);
      }
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const grantSpins = async (profileId, username, count) => {
    setGrantingId(profileId);
    try {
      const rows = await base44.entities.DailyRewardProgress.filter({ userProfileId: profileId });
      let rec = rows[0];
      if (!rec) {
        rec = await base44.entities.DailyRewardProgress.create({
          userProfileId: profileId, streakCount: 0, currentIndex: 0, eligible: false,
        });
      }
      const tokens = (rec.bonusWheelTokens || 0) + count;
      await base44.entities.DailyRewardProgress.update(rec.id, { bonusWheelTokens: tokens });
      toast.success(`Granted ${count} spin${count !== 1 ? 's' : ''} to ${username}`);
      loadHolders();
    } catch (e) {
      toast.error('Failed to grant spins');
    }
    setGrantingId(null);
  };

  const bulkGrant = async () => {
    setBulkGranting(true);
    try {
      // Fetch all user profiles (paginated)
      let allProfiles = [];
      let cursor;
      do {
        const page = await base44.entities.UserProfile.filter({}, { limit: 500, cursor });
        allProfiles = allProfiles.concat(page.items || []);
        cursor = page.next_cursor;
      } while (cursor);

      // Fetch or create progress records, then bulk update
      const profileIds = allProfiles.map(p => p.id);
      const existing = await base44.entities.DailyRewardProgress.filter({ userProfileId: { $in: profileIds } });
      const existingMap = {};
      (existing.items || existing).forEach(r => { existingMap[r.userProfileId] = r; });

      // Create missing records
      const missing = profileIds.filter(id => !existingMap[id]);
      if (missing.length) {
        await base44.entities.DailyRewardProgress.bulkCreate(
          missing.map(id => ({ userProfileId: id, streakCount: 0, currentIndex: 0, eligible: false, bonusWheelTokens: grantCount }))
        );
      }

      // Update existing ones
      const toUpdate = Object.values(existingMap).map(r => ({
        id: r.id,
        bonusWheelTokens: (r.bonusWheelTokens || 0) + grantCount,
      }));
      if (toUpdate.length) {
        await base44.entities.DailyRewardProgress.bulkUpdate(toUpdate);
      }

      toast.success(`Granted ${grantCount} spin${grantCount !== 1 ? 's' : ''} to all ${allProfiles.length} users`);
      loadHolders();
    } catch (e) {
      toast.error('Bulk grant failed');
    }
    setBulkGranting(false);
  };

  return (
    <div className="space-y-4">
      {/* Single user grant */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-purple-400" />
          <Label className="text-slate-200">Grant Spins to a User</Label>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or email…"
              className="pl-9 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={grantCount}
              onChange={(e) => setGrantCount(Math.max(1, parseInt(e.target.value) || 1))}
              className="bg-slate-800 border-slate-700 text-white w-20 text-center"
              min={1}
            />
            <span className="text-xs text-slate-400 whitespace-nowrap">spins</span>
          </div>
        </div>

        {searching && <p className="text-xs text-slate-400">Searching…</p>}
        {!searching && search.trim() && results.length === 0 && (
          <p className="text-xs text-slate-400">No users found.</p>
        )}
        {results.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {results.map(u => (
              <div key={u.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{u.username || u.userId}</p>
                  <p className="text-xs text-slate-400 truncate">{u.userId}</p>
                </div>
                <Button
                  size="sm"
                  disabled={grantingId === u.id}
                  onClick={() => grantSpins(u.id, u.username || u.userId, grantCount)}
                  className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
                >
                  {grantingId === u.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Disc3 className="w-3 h-3 mr-1" />}
                  Grant {grantCount}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk grant */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <Label className="text-slate-200">Grant to All Users</Label>
        </div>
        <p className="text-xs text-slate-400">
          Gives {grantCount} bonus spin{grantCount !== 1 ? 's' : ''} to every user in the system. Use sparingly.
        </p>
        <Button
          disabled={bulkGranting}
          onClick={bulkGrant}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {bulkGranting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Granting…</> : <><Users className="w-4 h-4 mr-2" />Grant {grantCount} to All</>}
        </Button>
      </div>

      {/* Current holders */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-slate-200">Users with Bonus Spins</Label>
          <Button size="sm" variant="ghost" className="text-slate-400" onClick={loadHolders} disabled={loadingHolders}>
            Refresh
          </Button>
        </div>
        {loadingHolders ? (
          <p className="text-xs text-slate-400">Loading…</p>
        ) : holders.length === 0 ? (
          <p className="text-xs text-slate-400">No users currently hold bonus spins.</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {holders.map(h => (
              <div key={h.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2 border border-slate-700">
                <span className="text-sm text-white truncate">{h._username || h.username || 'Unknown'}</span>
                <span className="text-sm text-purple-300 font-medium flex-shrink-0">
                  {h.bonusWheelTokens} spin{h.bonusWheelTokens !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}