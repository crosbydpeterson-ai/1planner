import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Plus, Minus, RefreshCw } from 'lucide-react';

export default function GameBuilderTokenPanel() {
  const [settings, setSettings] = useState({ monthlyTokens: 3, tokenCost: 1 });
  const [settingId, setSettingId] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [giftAmounts, setGiftAmounts] = useState({});
  const [monthlyOverrides, setMonthlyOverrides] = useState({});

  const periodKey = (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  })();

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [settingsRecs, tokens] = await Promise.all([
      base44.entities.AppSetting.filter({ key: 'game_builder_settings' }),
      base44.entities.GameBuilderToken.filter({ periodKey }),
    ]);
    if (settingsRecs[0]) {
      setSettingId(settingsRecs[0].id);
      setSettings(settingsRecs[0].value || { monthlyTokens: 3, tokenCost: 1 });
    }
    setUsers(tokens.sort((a, b) => (a.username || '').localeCompare(b.username || '')));
    setLoading(false);
  };

  const saveGlobalSettings = async () => {
    setSaving(true);
    if (settingId) {
      await base44.entities.AppSetting.update(settingId, { value: settings });
    } else {
      const rec = await base44.entities.AppSetting.create({ key: 'game_builder_settings', value: settings });
      setSettingId(rec.id);
    }
    toast.success('Settings saved!');
    setSaving(false);
  };

  const giftTokens = async (user, amount) => {
    const n = Number(amount);
    if (!n) return;
    const newGranted = (user.tokensGranted || 0) + n;
    await base44.entities.GameBuilderToken.update(user.id, { tokensGranted: Math.max(0, newGranted) });
    toast.success(`${n > 0 ? '+' : ''}${n} tokens for ${user.username}`);
    setGiftAmounts(prev => ({ ...prev, [user.id]: '' }));
    loadAll();
  };

  const setMonthlyOverride = async (user, amount) => {
    const n = Number(amount);
    if (isNaN(n) || n < 0) return;
    await base44.entities.GameBuilderToken.update(user.id, { monthlyLimit: n });
    toast.success(`Monthly limit for ${user.username} set to ${n}`);
    setMonthlyOverrides(prev => ({ ...prev, [user.id]: '' }));
    loadAll();
  };

  const resetTokens = async (user) => {
    await base44.entities.GameBuilderToken.update(user.id, { tokensUsed: 0, tokensGranted: 0 });
    toast.success(`Reset tokens for ${user.username}`);
    loadAll();
  };

  if (loading) return <div className="text-slate-400 text-sm text-center py-6">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-white/10">
        <h4 className="text-white font-bold mb-4 flex items-center gap-2">🎮 Game Builder Token Settings</h4>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Monthly tokens (default)</Label>
            <Input
              type="number" min={1}
              value={settings.monthlyTokens}
              onChange={e => setSettings(s => ({ ...s, monthlyTokens: Number(e.target.value) }))}
              className="bg-slate-700 border-white/10 text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Token cost per message</Label>
            <Input
              type="number" min={1}
              value={settings.tokenCost}
              onChange={e => setSettings(s => ({ ...s, tokenCost: Number(e.target.value) }))}
              className="bg-slate-700 border-white/10 text-white"
            />
          </div>
        </div>
        <Button onClick={saveGlobalSettings} disabled={saving} className="bg-indigo-500 hover:bg-indigo-600 gap-2">
          <Save className="w-4 h-4" /> Save Settings
        </Button>
      </div>

      {/* Per-User Management */}
      <div className="bg-slate-800/50 rounded-2xl p-5 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-white font-bold">👤 User Token Usage ({periodKey})</h4>
          <button onClick={loadAll} className="text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        {users.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-4">No users have used the game builder this month.</p>
        )}
        <div className="space-y-3">
          {users.map(user => {
            const limit = user.monthlyLimit ?? settings.monthlyTokens;
            const total = limit + (user.tokensGranted || 0);
            const used = user.tokensUsed || 0;
            const left = Math.max(0, total - used);
            const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
            return (
              <div key={user.id} className="bg-slate-700/60 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium text-sm">{user.username}</span>
                  <span className={`text-xs font-bold ${left === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {left} / {total} left
                  </span>
                </div>
                {/* Usage bar */}
                <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Gift/take tokens */}
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      type="number"
                      placeholder="±tokens"
                      value={giftAmounts[user.id] || ''}
                      onChange={e => setGiftAmounts(prev => ({ ...prev, [user.id]: e.target.value }))}
                      className="h-7 text-xs bg-slate-600 border-white/10 text-white w-20"
                    />
                    <Button size="sm" onClick={() => giftTokens(user, giftAmounts[user.id])} className="h-7 text-xs bg-green-600 hover:bg-green-700 px-2 gap-1">
                      <Plus className="w-3 h-3" /> Gift
                    </Button>
                  </div>
                  {/* Monthly override */}
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="monthly"
                      value={monthlyOverrides[user.id] ?? ''}
                      onChange={e => setMonthlyOverrides(prev => ({ ...prev, [user.id]: e.target.value }))}
                      className="h-7 text-xs bg-slate-600 border-white/10 text-white w-20"
                    />
                    <Button size="sm" onClick={() => setMonthlyOverride(user, monthlyOverrides[user.id])} className="h-7 text-xs bg-blue-600 hover:bg-blue-700 px-2">
                      Set
                    </Button>
                  </div>
                  {/* Reset */}
                  <Button size="sm" variant="ghost" onClick={() => resetTokens(user)} className="h-7 text-xs text-slate-400 hover:text-red-400 px-2">
                    Reset
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}