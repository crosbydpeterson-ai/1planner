import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function DailyRewardsSettings() {
  const [settingId, setSettingId] = useState(null);
  const [config, setConfig] = useState({
    scheduleType: 'streak7',
    rewards: Array.from({ length: 7 }, () => ({ type: 'xp', amount: 25 })),
    wheel: { enabled: false, prizes: [] },
    claimMode: 'manual',
    requireAssignment: true,
  });
  const [grantUsername, setGrantUsername] = useState('');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const settings = await base44.entities.AppSetting.list();
        const dr = settings.find(s => s.key === 'daily_rewards_config');
        if (dr) {
          setSettingId(dr.id);
          setConfig({
            scheduleType: dr.value?.scheduleType || 'streak7',
            rewards: Array.isArray(dr.value?.rewards) && dr.value.rewards.length > 0 ? dr.value.rewards : Array.from({ length: 7 }, () => ({ type: 'xp', amount: 25 })),
            wheel: dr.value?.wheel || { enabled: false, prizes: [] },
            claimMode: dr.value?.claimMode || 'manual',
            requireAssignment: dr.value?.requireAssignment !== false,
          });
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const period = config.scheduleType === 'streak14' ? 14 : (config.scheduleType === 'monthly' ? 31 : 7);
  const rewards = (config.rewards || []).slice(0, period).concat(Array.from({ length: Math.max(0, period - (config.rewards?.length || 0)) }, () => ({ type: 'xp', amount: 25 })));

  const setRewardAt = (idx, value) => {
    const next = [...rewards];
    next[idx] = { ...next[idx], ...value };
    setConfig({ ...config, rewards: next });
  };

  const save = async () => {
    try {
      if (settingId) {
        await base44.entities.AppSetting.update(settingId, { value: config });
      } else {
        const s = await base44.entities.AppSetting.create({ key: 'daily_rewards_config', value: config });
        setSettingId(s.id);
      }
      toast.success('Daily rewards saved');
    } catch (e) {
      toast.error('Failed to save');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label className="text-slate-200">Schedule Type</Label>
          <Select value={config.scheduleType} onValueChange={(v) => setConfig({ ...config, scheduleType: v })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="streak7">7-day Streak</SelectItem>
              <SelectItem value="streak14">14-day Streak</SelectItem>
              <SelectItem value="monthly">Monthly (by date)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Claim Mode</Label>
          <Select value={config.claimMode} onValueChange={(v) => setConfig({ ...config, claimMode: v })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual (button)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Require Assignment Completion</Label>
          <Select value={config.requireAssignment ? 'yes' : 'no'} onValueChange={(v) => setConfig({ ...config, requireAssignment: v === 'yes' })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-slate-200">Rewards ({period} slots)</Label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rewards.map((r, idx) => (
            <div key={idx} className="bg-slate-900 rounded-lg p-3 border border-slate-700 space-y-2">
              <div className="text-xs text-slate-400">{config.scheduleType === 'monthly' ? `Day ${idx + 1}` : `Day ${idx + 1} of streak`}</div>
              <Select value={r.type} onValueChange={(v) => setRewardAt(idx, { type: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xp">XP</SelectItem>
                  <SelectItem value="coins">Coins</SelectItem>
                  <SelectItem value="pet">Pet</SelectItem>
                  <SelectItem value="theme">Theme</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="wheel">Spin Wheel</SelectItem>
                </SelectContent>
              </Select>
              {(r.type === 'xp' || r.type === 'coins') && (
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Amount</Label>
                  <Input value={r.amount || ''} onChange={(e) => setRewardAt(idx, { amount: parseInt(e.target.value) || 0 })} className="bg-slate-800 border-slate-700 text-white h-8" />
                </div>
              )}
              {(r.type === 'pet' || r.type === 'theme' || r.type === 'title') && (
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Value (ID or Text)</Label>
                  <Input value={r.value || ''} onChange={(e) => setRewardAt(idx, { value: e.target.value })} placeholder={r.type === 'title' ? 'Title text' : 'e.g. starter_slime or custom_abc'} className="bg-slate-800 border-slate-700 text-white h-8" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-slate-200">Spin the Wheel</Label>
          <Select value={config.wheel?.enabled ? 'on' : 'off'} onValueChange={(v) => setConfig({ ...config, wheel: { ...config.wheel, enabled: v === 'on' } })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Disabled</SelectItem>
              <SelectItem value="on">Enabled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {config.wheel?.enabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-slate-300 text-sm">Prizes</div>
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => setConfig({ ...config, wheel: { ...config.wheel, prizes: [...(config.wheel.prizes || []), { label: '100 XP', type: 'xp', amount: 100, weight: 1 }] } })}>
                <Plus className="w-3 h-3 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-2">
              {(config.wheel.prizes || []).map((p, i) => (
                <div key={i} className="grid grid-cols-6 gap-2 items-center bg-slate-900 rounded-lg p-2 border border-slate-700">
                  <Input className="col-span-2 bg-slate-800 border-slate-700 text-white h-8" value={p.label || ''} onChange={(e) => {
                    const next = [...config.wheel.prizes]; next[i] = { ...next[i], label: e.target.value }; setConfig({ ...config, wheel: { ...config.wheel, prizes: next } });
                  }} placeholder="Label" />
                  <Select value={p.type} onValueChange={(v) => { const next = [...config.wheel.prizes]; next[i] = { ...next[i], type: v }; setConfig({ ...config, wheel: { ...config.wheel, prizes: next } }); }}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xp">XP</SelectItem>
                      <SelectItem value="coins">Coins</SelectItem>
                      <SelectItem value="pet">Pet</SelectItem>
                      <SelectItem value="theme">Theme</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="bg-slate-800 border-slate-700 text-white h-8" value={p.value || ''} onChange={(e) => { const next = [...config.wheel.prizes]; next[i] = { ...next[i], value: e.target.value }; setConfig({ ...config, wheel: { ...config.wheel, prizes: next } }); }} placeholder="Value/ID or text" />
                  <Input className="bg-slate-800 border-slate-700 text-white h-8" type="number" value={p.amount || ''} onChange={(e) => { const next = [...config.wheel.prizes]; next[i] = { ...next[i], amount: parseInt(e.target.value) || 0 }; setConfig({ ...config, wheel: { ...config.wheel, prizes: next } }); }} placeholder="Amount" />
                  <div className="flex items-center gap-2">
                    <Input className="bg-slate-800 border-slate-700 text-white h-8 w-20" type="number" value={p.weight || 0} onChange={(e) => { const next = [...config.wheel.prizes]; next[i] = { ...next[i], weight: parseFloat(e.target.value) || 0 }; setConfig({ ...config, wheel: { ...config.wheel, prizes: next } }); }} placeholder="Weight" />
                    <Button size="icon" variant="ghost" className="text-red-400" onClick={() => { const next = [...config.wheel.prizes]; next.splice(i,1); setConfig({ ...config, wheel: { ...config.wheel, prizes: next } }); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(config.wheel.prizes || []).length === 0 && (
                <div className="text-slate-400 text-sm">No prizes yet</div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-slate-200">Grant Bonus Spin (by username or email)</Label>
        </div>
        <div className="flex gap-2">
          <Input value={grantUsername} onChange={(e) => setGrantUsername(e.target.value)} placeholder="e.g. Alex or alex@mail.com" className="bg-slate-800 border-slate-700 text-white" />
          <Button disabled={granting || !grantUsername.trim()} onClick={async () => {
            setGranting(true);
            try {
              const name = grantUsername.trim();
              let users = await base44.entities.UserProfile.filter({ username: name });
              if (!users.length) {
                users = await base44.entities.UserProfile.filter({ userId: name });
              }
              const user = users[0];
              if (!user) { toast.error('User not found'); setGranting(false); return; }
              const rows = await base44.entities.DailyRewardProgress.filter({ userProfileId: user.id });
              let rec = rows[0];
              if (!rec) {
                rec = await base44.entities.DailyRewardProgress.create({ userProfileId: user.id, streakCount: 0, currentIndex: 0, eligible: false });
              }
              const tokens = (rec.bonusWheelTokens || 0) + 1;
              await base44.entities.DailyRewardProgress.update(rec.id, { bonusWheelTokens: tokens });
              toast.success(`Granted 1 spin to ${user.username || user.userId}`);
            } catch (e) {
              toast.error('Failed to grant spin');
            }
            setGranting(false);
          }} className="bg-purple-600 hover:bg-purple-700">{granting ? 'Granting...' : 'Grant Spin'}</Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} className="bg-emerald-600 hover:bg-emerald-700"><Save className="w-4 h-4 mr-2" /> Save Settings</Button>
      </div>
    </div>
  );
}