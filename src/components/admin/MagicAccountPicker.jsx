import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, Shield, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const isAdminProfile = (p) => p?.rank === 'admin' || p?.rank === 'super_admin';

// Searchable account list. Every account (admins included) is offered, and the
// list is fetched fresh on open so an account created after the Admin page
// loaded still appears here.
export default function MagicAccountPicker({ profiles = [], value, onChange, fallbackLabel = '' }) {
  const [loaded, setLoaded] = useState(profiles);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(profiles.length === 0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await base44.entities.UserProfile.list('-created_date');
        if (cancelled) return;
        const byId = new Map();
        [...profiles, ...fresh].forEach((p) => {
          if (p?.id) byId.set(p.id, p);
        });
        setLoaded([...byId.values()]);
      } catch (e) {
        console.error('Failed to load accounts:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return loaded
      .filter((p) => !q || (p.username || '').toLowerCase().includes(q))
      .sort((a, b) => (a.username || '').localeCompare(b.username || ''));
  }, [loaded, query]);

  const selected = loaded.find((p) => p.id === value);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search accounts by username"
          className="h-11 rounded-xl pl-9"
          autoComplete="off"
        />
      </div>

      <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
        {loading ? (
          <div className="p-4 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading accounts…
          </div>
        ) : results.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No account matches “{query}”.</div>
        ) : (
          results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors',
                value === p.id && 'bg-indigo-50 hover:bg-indigo-50'
              )}
            >
              <span className="flex-1 truncate text-slate-800">{p.username || p.id}</span>
              {isAdminProfile(p) && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-1.5 py-0.5">
                  <Shield className="w-3 h-3" /> Admin
                </span>
              )}
              {value === p.id && <Check className="w-4 h-4 text-indigo-600" />}
            </button>
          ))
        )}
      </div>

      <p className="text-[11px] text-slate-500">
        {selected
          ? `Opens ${selected.username || selected.id}${isAdminProfile(selected) ? ' (admin)' : ''}`
          : value
            ? `Opens ${fallbackLabel || 'the linked account'}`
            : `${loaded.length} accounts — pick one`}
      </p>
    </div>
  );
}