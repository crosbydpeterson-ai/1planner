import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Lock, Unlock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LOCKABLE_FEATURES } from '@/lib/featureLocks';
import { toast } from 'sonner';

export default function UserLockManager({ featureLocks, setFeatureLocks, profiles = [] }) {
  const [search, setSearch] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [customMsg, setCustomMsg] = useState('');
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [allProfiles, setAllProfiles] = useState(profiles);

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const result = await base44.entities.UserProfile.list('-created_date', 200);
      setAllProfiles(result);
    } catch (e) {
      console.error('Failed to load profiles:', e);
      toast.error('Failed to load users');
    }
    setLoadingProfiles(false);
  };

  React.useEffect(() => {
    if (allProfiles.length === 0) loadProfiles();
  }, []);

  const filtered = (allProfiles || []).filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (p.username || '').toLowerCase().includes(q) || (p.userId || '').toLowerCase().includes(q);
  });

  const getUserLock = (profileId, featureKey) => {
    const entry = featureLocks?.users?.[profileId]?.[featureKey];
    if (!entry) return { locked: false, message: '' };
    if (typeof entry === 'object') return { locked: !!entry.locked, message: entry.message || '' };
    return { locked: !!entry, message: '' };
  };

  const toggleUserLock = (profileId, featureKey) => {
    setFeatureLocks(prev => {
      const users = { ...(prev.users || {}) };
      users[profileId] = { ...(users[profileId] || {}) };
      const current = getUserLock(profileId, featureKey);
      if (current.locked) {
        delete users[profileId][featureKey];
      } else {
        users[profileId][featureKey] = current.message ? { locked: true, message: current.message } : true;
      }
      return { ...prev, users };
    });
  };

  const saveCustomMessage = (profileId, featureKey) => {
    setFeatureLocks(prev => {
      const users = { ...(prev.users || {}) };
      users[profileId] = { ...(users[profileId] || {}) };
      users[profileId][featureKey] = { locked: true, message: customMsg };
      return { ...prev, users };
    });
    setCustomMsg('');
    toast.success('Custom message saved — remember to save locks!');
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by username or email..."
            className="bg-slate-700 border-slate-600 text-white pl-10" />
        </div>
        <p className="text-slate-400 text-xs mt-2">{filtered.length} users found</p>
      </div>

      {/* User list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.slice(0, 50).map(profile => {
          const isSelected = selectedProfile?.id === profile.id;
          return (
            <div key={profile.id} className={`bg-slate-800 rounded-xl border p-4 transition-all ${isSelected ? 'border-purple-500' : 'border-slate-700'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">
                    {(profile.username || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{profile.username}</p>
                    <p className="text-slate-500 text-xs">{profile.userId}</p>
                  </div>
                </div>
                <Button size="sm" variant={isSelected ? 'default' : 'outline'}
                  onClick={() => setSelectedProfile(isSelected ? null : profile)}
                  className={isSelected ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}>
                  {isSelected ? 'Editing' : 'Manage'}
                </Button>
              </div>

              {isSelected && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {LOCKABLE_FEATURES.map(f => {
                      const lock = getUserLock(profile.id, f.key);
                      return (
                        <button key={f.key} onClick={() => toggleUserLock(profile.id, f.key)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${lock.locked ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                          {f.emoji} {f.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom message editor for locked features */}
                  <div className="pt-2 space-y-2">
                    <Label className="text-slate-400 text-xs">Custom lock message (optional):</Label>
                    <div className="flex gap-2">
                      <Textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)}
                        placeholder="e.g. You need to finish assignments first!"
                        className="bg-slate-700 border-slate-600 text-white text-xs min-h-[40px] flex-1" />
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {LOCKABLE_FEATURES.filter(f => getUserLock(profile.id, f.key).locked).map(f => (
                        <Button key={f.key} size="sm" variant="ghost"
                          onClick={() => { setCustomMsg(getUserLock(profile.id, f.key).message); }}
                          className="text-xs text-slate-400 h-7 px-2">
                          <MessageSquare className="w-3 h-3 mr-1" />{f.label}
                        </Button>
                      ))}
                    </div>
                    {customMsg && (
                      <Button size="sm" onClick={() => saveCustomMessage(profile.id, LOCKABLE_FEATURES.find(f => getUserLock(profile.id, f.key).locked)?.key)}
                        className="bg-emerald-600 h-7 text-xs">
                        Save message
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {!isSelected && (
                <div className="flex flex-wrap gap-1">
                  {LOCKABLE_FEATURES.filter(f => getUserLock(profile.id, f.key).locked).map(f => (
                    <span key={f.key} className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">{f.emoji} {f.label}</span>
                  ))}
                  {!LOCKABLE_FEATURES.some(f => getUserLock(profile.id, f.key).locked) && (
                    <span className="text-slate-500 text-xs">No locks</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          {loadingProfiles ? 'Loading users...' : 'No users found'}
        </div>
      )}
    </div>
  );
}