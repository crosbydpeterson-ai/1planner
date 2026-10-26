import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Loader2, ShieldCheck, UserPlus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { loadSupportAdmins, saveSupportAdmins } from '@/lib/byteSupport';

/**
 * Named support admins.
 *
 * Only the profiles listed here can open the "Escalated from Byte" inbox, so a
 * role that manages events never gains access to student support conversations.
 */
export default function SupportAdminManager() {
  const [profiles, setProfiles] = useState([]);
  const [setting, setSetting] = useState(null);
  const [profileIds, setProfileIds] = useState([]);
  const [usernames, setUsernames] = useState({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [admins, all] = await Promise.all([
          loadSupportAdmins(),
          base44.entities.UserProfile.list('-created_date', 500),
        ]);
        setSetting(admins.setting);
        setProfileIds(admins.profileIds);
        setUsernames(admins.usernames);
        setProfiles(all);
      } catch (err) {
        console.error('Could not load support admins', err);
        setError('Could not load the support admin list.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (ids, names) => {
    setSaving(true);
    setError('');
    try {
      const saved = await saveSupportAdmins(setting, ids, names);
      setSetting(saved);
      setProfileIds(ids);
      setUsernames(names);
    } catch (err) {
      console.error('Could not save support admins', err);
      setError('That change was not saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const add = (profile) => {
    if (profileIds.includes(String(profile.id))) return;
    const ids = [...profileIds, String(profile.id)];
    persist(ids, { ...usernames, [profile.id]: profile.username });
    setSearch('');
  };

  const remove = (id) => {
    const ids = profileIds.filter((x) => x !== id);
    const names = { ...usernames };
    delete names[id];
    persist(ids, names);
  };

  const results = search.trim()
    ? profiles.filter((p) => p.username?.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 6)
    : [];
  const named = profileIds.map((id) => ({ id, username: usernames[id] || profiles.find((p) => p.id === id)?.username || 'Unknown' }));

  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <h3 className="text-white font-semibold text-sm">Byte support admins</h3>
      </div>
      <p className="text-slate-400 text-xs mb-3">
        Only these people can read and answer requests students send from Byte. Nobody else — including roles that manage
        events — gets access.
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {named.length === 0 && !loading && (
          <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1.5">
            No support admins yet. Add at least one so escalated requests reach a person.
          </p>
        )}
        {named.map((p) => (
          <span key={p.id} className="flex items-center gap-1.5 bg-slate-700 text-white text-xs rounded-full px-3 py-1.5">
            {p.username}
            <button onClick={() => remove(p.id)} disabled={saving} className="text-slate-400 hover:text-white disabled:opacity-50">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>

      <div className="relative">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a profile to add…"
          className="bg-slate-700 border-slate-600 text-white text-sm"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-slate-700 border border-slate-600 rounded-lg overflow-hidden shadow-xl">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p)}
                disabled={saving || profileIds.includes(String(p.id))}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-white hover:bg-slate-600 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {p.username}
                {profileIds.includes(String(p.id)) && <span className="ml-auto text-slate-400">already added</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1.5 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
      {saving && <p className="mt-2 text-[11px] text-slate-400">Saving…</p>}
      {!saving && !error && named.length > 0 && (
        <p className="mt-2 text-[11px] text-slate-500">Requests appear for them under Messages → Escalated from Byte.</p>
      )}
    </div>
  );
}