import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PETS } from '@/components/quest/PetCatalog';

/**
 * Daily Rewards Builder — configure the reward schedule.
 * Props: config, setConfig, allPets
 */
export default function DailyRewardsBuilder({ config, setConfig, allPets }) {
  const period = config.scheduleType === 'streak14' ? 14 : (config.scheduleType === 'monthly' ? 31 : 7);
  const rewards = (config.rewards || [])
    .slice(0, period)
    .concat(Array.from({ length: Math.max(0, period - (config.rewards?.length || 0)) }, () => ({ type: 'xp', amount: 25 })));

  const setRewardAt = (idx, value) => {
    const next = [...rewards];
    next[idx] = { ...next[idx], ...value };
    setConfig({ ...config, rewards: next });
  };

  return (
    <div className="space-y-4">
      {/* Schedule settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label className="text-slate-200">Schedule Type</Label>
          <Select value={config.scheduleType} onValueChange={(v) => setConfig({ ...config, scheduleType: v })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="streak7">7-day Streak</SelectItem>
              <SelectItem value="streak14">14-day Streak</SelectItem>
              <SelectItem value="monthly">Monthly (by date)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Claim Mode</Label>
          <Select value={config.claimMode || 'manual'} onValueChange={(v) => setConfig({ ...config, claimMode: v })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual (button)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-slate-200">Require Assignment</Label>
          <Select
            value={config.requireAssignment !== false ? 'yes' : 'no'}
            onValueChange={(v) => setConfig({ ...config, requireAssignment: v === 'yes' })}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes — complete a quest first</SelectItem>
              <SelectItem value="no">No — claim freely</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reward slots */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-slate-200">Reward Slots ({period})</Label>
          <span className="text-xs text-slate-400">
            {config.scheduleType === 'monthly' ? 'Day of month' : 'Streak day'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {rewards.map((r, idx) => (
            <div key={idx} className="bg-slate-800 rounded-lg p-3 border border-slate-700 space-y-2">
              <div className="text-xs font-medium text-slate-400">
                {config.scheduleType === 'monthly' ? `Day ${idx + 1}` : `Day ${idx + 1}`}
              </div>
              <Select value={r.type} onValueChange={(v) => setRewardAt(idx, { type: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="xp">⭐ XP</SelectItem>
                  <SelectItem value="coins">🪙 Coins</SelectItem>
                  <SelectItem value="pet">🐾 Pet</SelectItem>
                  <SelectItem value="theme">🎨 Theme</SelectItem>
                  <SelectItem value="title">🏷️ Title</SelectItem>
                  <SelectItem value="wheel">🎡 Spin Wheel</SelectItem>
                </SelectContent>
              </Select>
              {(r.type === 'xp' || r.type === 'coins') && (
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Amount</Label>
                  <Input
                    value={r.amount || ''}
                    onChange={(e) => setRewardAt(idx, { amount: parseInt(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-700 text-white h-8"
                    type="number"
                  />
                </div>
              )}
              {r.type === 'pet' && (
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">Pet</Label>
                  <Select value={r.value || ''} onValueChange={(v) => setRewardAt(idx, { value: v })}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8"><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      {allPets.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.emoji} {p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(r.type === 'theme' || r.type === 'title') && (
                <div className="space-y-1">
                  <Label className="text-slate-300 text-xs">{r.type === 'title' ? 'Title text' : 'Theme ID'}</Label>
                  <Input
                    value={r.value || ''}
                    onChange={(e) => setRewardAt(idx, { value: e.target.value })}
                    className="bg-slate-800 border-slate-700 text-white h-8"
                  />
                </div>
              )}
              {r.type === 'wheel' && (
                <p className="text-xs text-purple-300 bg-purple-500/10 rounded px-2 py-1">
                  Spins the bonus wheel for a random prize
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}