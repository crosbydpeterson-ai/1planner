import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Copy, Ban, RefreshCw, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatChicagoDate, codeStatus, generateCodeValue } from '@/lib/logoutRestriction';
import LogoutCodeFormDialog from '@/components/admin/LogoutCodeFormDialog';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Not yet valid' },
  { value: 'expired', label: 'Expired' },
  { value: 'exhausted', label: 'Exhausted' },
  { value: 'revoked', label: 'Revoked' },
];

const STATUS_STYLES = {
  active: 'bg-emerald-500/20 text-emerald-400',
  pending: 'bg-blue-500/20 text-blue-400',
  expired: 'bg-slate-500/20 text-slate-400',
  exhausted: 'bg-amber-500/20 text-amber-400',
  revoked: 'bg-red-500/20 text-red-400',
};

export default function LogoutCodeManager({ users, teachers, adminUsername }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [replacementBase, setReplacementBase] = useState(null);
  const [revealed, setRevealed] = useState({});
  const [expanded, setExpanded] = useState({});

  const loadCodes = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.LogoutCode.list('-created_date');
      setCodes(list);
    } catch (e) {
      console.error('Failed to load logout codes', e);
      toast.error('Failed to load codes.');
    }
    setLoading(false);
  };

  useEffect(() => { loadCodes(); }, []);

  const filtered = useMemo(() => {
    return codes.filter((c) => filter === 'all' || codeStatus(c) === filter);
  }, [codes, filter]);

  const handleRevoke = async (code) => {
    try {
      await base44.entities.LogoutCode.update(code.id, { isActive: false, revokedAt: new Date().toISOString() });
      setCodes((prev) => prev.map((c) => (c.id === code.id ? { ...c, isActive: false, revokedAt: new Date().toISOString() } : c)));
      toast.success('Code revoked.');
    } catch (e) {
      toast.error('Failed to revoke code.');
    }
  };

  const handleReplacement = (code) => {
    setReplacementBase(code);
    setShowForm(true);
  };

  const handleCreated = (created) => {
    setCodes((prev) => [created, ...prev]);
    setReplacementBase(null);
  };

  const usernameFor = (profileId) => users.find((u) => u.id === profileId)?.username || profileId?.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="bg-slate-700 border-slate-600 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-400">{filtered.length} of {codes.length}</span>
        </div>
        <Button onClick={() => { setReplacementBase(null); setShowForm(true); }} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 mr-2" />New code
        </Button>
      </div>

      <div className="space-y-2">
        {loading && <p className="text-sm text-slate-400 text-center py-4">Loading…</p>}
        {!loading && filtered.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No codes.</p>}
        {filtered.map((code) => {
          const status = codeStatus(code);
          const remaining = code.maxUses ? Math.max(0, code.maxUses - (code.useCount || 0)) : '∞';
          const isRevealed = revealed[code.id];
          const isExpanded = expanded[code.id];
          return (
            <div key={code.id} className="bg-slate-800 rounded-xl border border-slate-700 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-white font-medium truncate">{code.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_STYLES[status]}`}>{status}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <code className="font-mono tracking-widest bg-slate-900/60 px-2 py-0.5 rounded">
                      {isRevealed ? code.code : '••••••••'}
                    </code>
                    <button onClick={() => setRevealed((r) => ({ ...r, [code.id]: !r[code.id] }))} className="text-slate-400 hover:text-white">
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(code.code); toast.success('Code copied'); }}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {code.validFrom ? `From ${formatChicagoDate(code.validFrom)} · ` : ''}Expires {formatChicagoDate(code.expiresAt)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Uses: {code.useCount || 0} / {code.maxUses || '∞'} ({remaining} remaining)
                    {code.maxUsesPerProfile ? ` · ${code.maxUsesPerProfile}/profile` : ''}
                    {' · Scope: '}{code.scope}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {code.isActive && (
                    <Button size="sm" variant="ghost" onClick={() => handleRevoke(code)} className="text-red-400 hover:text-red-300">
                      <Ban className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleReplacement(code)} className="text-amber-400 hover:text-amber-300" title="Replacement code">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <button
                onClick={() => setExpanded((e) => ({ ...e, [code.id]: !e[code.id] }))}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white mt-2"
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                Usage history ({(code.usageHistory || []).length})
              </button>
              {isExpanded && (
                <div className="mt-2 max-h-32 overflow-y-auto bg-slate-900/40 rounded-lg p-2 space-y-1">
                  {(code.usageHistory || []).length === 0 && <p className="text-xs text-slate-500">No uses yet.</p>}
                  {(code.usageHistory || []).map((u, i) => (
                    <div key={i} className="text-xs text-slate-400 flex justify-between">
                      <span>{usernameFor(u.profileId)}</span>
                      <span>{formatChicagoDate(u.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <LogoutCodeFormDialog
        open={showForm}
        onOpenChange={(o) => { setShowForm(o); if (!o) setReplacementBase(null); }}
        users={users}
        teachers={teachers}
        onSaved={handleCreated}
        existing={replacementBase}
        adminUsername={adminUsername}
      />
    </div>
  );
}