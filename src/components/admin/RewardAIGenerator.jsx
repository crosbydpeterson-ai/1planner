import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sparkles, Loader2, Save, Wand2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Admin-only panel that uses AI to generate Spin Wheel prize sets and
 * Daily Reward track configurations. Fully creative — invents new pets/themes
 * on the fly and saves them to CustomPet / CustomTheme.
 */
export default function RewardAIGenerator() {
  const [mode, setMode] = useState('spin');

  // Spin wheel state
  const [spinTheme, setSpinTheme] = useState('');
  const [spinCount, setSpinCount] = useState(8);
  const [spinPrizes, setSpinPrizes] = useState([]);
  const [spinGenerating, setSpinGenerating] = useState(false);
  const [spinSaving, setSpinSaving] = useState(false);

  // Daily track state
  const [dailyTheme, setDailyTheme] = useState('');
  const [dailySchedule, setDailySchedule] = useState('streak7');
  const [dailyRewards, setDailyRewards] = useState([]);
  const [dailyGenerating, setDailyGenerating] = useState(false);
  const [dailySaving, setDailySaving] = useState(false);

  // Current settings
  const [dailyConfigId, setDailyConfigId] = useState(null);
  const [currentDailyConfig, setCurrentDailyConfig] = useState(null);

  useEffect(() => {
    loadCurrentDailyConfig();
  }, []);

  const loadCurrentDailyConfig = async () => {
    try {
      const settings = await base44.entities.AppSetting.list();
      const dr = settings.find(s => s.key === 'daily_rewards_config');
      if (dr) {
        setDailyConfigId(dr.id);
        setCurrentDailyConfig(dr.value);
      }
    } catch (e) { /* ignore */ }
  };

  const generateSpin = async () => {
    if (!spinTheme.trim()) { toast.error('Enter a theme first'); return; }
    setSpinGenerating(true);
    try {
      const res = await base44.functions.invoke('generateRewardConfig', {
        action: 'spin_wheel',
        theme: spinTheme.trim(),
        count: spinCount,
        createAssets: true,
      });
      const prizes = res.data?.prizes || [];
      setSpinPrizes(prizes);
      toast.success(`Generated ${prizes.length} prizes!`);
    } catch (e) {
      toast.error('Generation failed: ' + (e.message || 'unknown'));
    }
    setSpinGenerating(false);
  };

  const saveSpinAsWheel = async () => {
    if (spinPrizes.length === 0) return;
    setSpinSaving(true);
    try {
      const settings = await base44.entities.AppSetting.list();
      const dr = settings.find(s => s.key === 'daily_rewards_config');
      const existing = dr?.value || {
        scheduleType: 'streak7',
        rewards: Array.from({ length: 7 }, () => ({ type: 'xp', amount: 25 })),
        wheel: { enabled: false, prizes: [] },
        claimMode: 'manual',
        requireAssignment: true,
      };
      const updated = {
        ...existing,
        wheel: { enabled: true, prizes: spinPrizes },
      };
      if (dr) {
        await base44.entities.AppSetting.update(dr.id, { value: updated });
      } else {
        await base44.entities.AppSetting.create({ key: 'daily_rewards_config', value: updated });
      }
      toast.success('Wheel saved & enabled!');
      loadCurrentDailyConfig();
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    }
    setSpinSaving(false);
  };

  const generateDaily = async () => {
    if (!dailyTheme.trim()) { toast.error('Enter a theme first'); return; }
    setDailyGenerating(true);
    try {
      const res = await base44.functions.invoke('generateRewardConfig', {
        action: 'daily_track',
        theme: dailyTheme.trim(),
        scheduleType: dailySchedule,
        createAssets: true,
      });
      const rewards = res.data?.rewards || [];
      setDailyRewards(rewards);
      toast.success(`Generated ${rewards.length} daily rewards!`);
    } catch (e) {
      toast.error('Generation failed: ' + (e.message || 'unknown'));
    }
    setDailyGenerating(false);
  };

  const saveDailyTrack = async () => {
    if (dailyRewards.length === 0) return;
    setDailySaving(true);
    try {
      const settings = await base44.entities.AppSetting.list();
      const dr = settings.find(s => s.key === 'daily_rewards_config');
      const existing = dr?.value || { wheel: { enabled: false, prizes: [] }, claimMode: 'manual', requireAssignment: true };
      const updated = {
        ...existing,
        scheduleType: dailySchedule,
        rewards: dailyRewards,
      };
      if (dr) {
        await base44.entities.AppSetting.update(dr.id, { value: updated });
      } else {
        await base44.entities.AppSetting.create({ key: 'daily_rewards_config', value: updated });
      }
      toast.success('Daily track saved & active!');
      loadCurrentDailyConfig();
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    }
    setDailySaving(false);
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/40 via-slate-800 to-indigo-900/40 rounded-2xl p-5 border border-purple-500/20 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Wand2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Reward AI Generator</h2>
          <p className="text-slate-400 text-sm">Generate Spin Wheel pools and Daily Reward tracks with fully AI-invented pets and themes.</p>
        </div>
      </div>

      <Tabs value={mode} onValueChange={setMode}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="spin">🎰 Spin Wheel</TabsTrigger>
          <TabsTrigger value="daily">📅 Daily Rewards</TabsTrigger>
        </TabsList>

        <TabsContent value="spin" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-slate-200">Theme / Vibe</Label>
              <Input
                value={spinTheme}
                onChange={e => setSpinTheme(e.target.value)}
                placeholder="e.g. Cosmic Space Adventure, Underwater Kingdom"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Number of Prizes</Label>
              <Select value={String(spinCount)} onValueChange={v => setSpinCount(parseInt(v))}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[6, 8, 10, 12].map(n => <SelectItem key={n} value={String(n)}>{n} segments</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateSpin}
            disabled={spinGenerating}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {spinGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Wheel</>}
          </Button>

          {spinPrizes.length > 0 && (
            <div className="bg-slate-900/60 rounded-xl border border-slate-700 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Preview ({spinPrizes.length} prizes)</h3>
                <Button size="sm" onClick={() => setSpinPrizes([])} variant="ghost" className="text-slate-400 hover:text-red-400">
                  <Trash2 className="w-3 h-3 mr-1" /> Clear
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {spinPrizes.map((p, i) => <PrizeRow key={i} prize={p} />)}
              </div>
              <Button onClick={saveSpinAsWheel} disabled={spinSaving} className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2">
                {spinSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save as Active Wheel
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="daily" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-slate-200">Theme / Vibe</Label>
              <Input
                value={dailyTheme}
                onChange={e => setDailyTheme(e.target.value)}
                placeholder="e.g. Mythical Beast Collection, Tech Gadget Week"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Schedule</Label>
              <Select value={dailySchedule} onValueChange={setDailySchedule}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="streak7">7-day streak</SelectItem>
                  <SelectItem value="streak14">14-day streak</SelectItem>
                  <SelectItem value="monthly">31-day monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateDaily}
            disabled={dailyGenerating}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            {dailyGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate Daily Track</>}
          </Button>

          {dailyRewards.length > 0 && (
            <div className="bg-slate-900/60 rounded-xl border border-slate-700 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold">Preview ({dailyRewards.length} days)</h3>
                <Button size="sm" onClick={() => setDailyRewards([])} variant="ghost" className="text-slate-400 hover:text-red-400">
                  <Trash2 className="w-3 h-3 mr-1" /> Clear
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {dailyRewards.map((r, i) => <PrizeRow key={i} prize={r} dayIndex={i} />)}
              </div>
              <Button onClick={saveDailyTrack} disabled={dailySaving} className="w-full bg-emerald-600 hover:bg-emerald-700 mt-2">
                {dailySaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save as Active Daily Track
              </Button>
            </div>
          )}

          {currentDailyConfig && (
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 text-xs text-slate-400">
              Current saved: {currentDailyConfig.scheduleType} • {currentDailyConfig.rewards?.length || 0} rewards • wheel {currentDailyConfig.wheel?.enabled ? 'on' : 'off'} ({currentDailyConfig.wheel?.prizes?.length || 0} prizes)
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PrizeRow({ prize, dayIndex }) {
  const icon = ({ xp: '⚡', coins: '🪙', gems: '💎', pet: '🐾', theme: '🎨', title: '🏷️', wheel: '🎰' })[prize.type] || '🎁';
  const label = prize.label || prize.name || prize.creativeName ||
    (prize.type === 'xp' ? `${prize.amount} XP` :
     prize.type === 'coins' ? `${prize.amount} Coins` :
     prize.type === 'gems' ? `${prize.amount} Gems` :
     prize.type);
  return (
    <div className="bg-slate-800 rounded-lg px-3 py-2 border border-slate-700 flex items-center gap-2">
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        {dayIndex !== undefined && <div className="text-[10px] text-indigo-400 font-semibold">DAY {dayIndex + 1}</div>}
        <div className="text-white text-sm font-medium truncate">{label}</div>
        <div className="text-[10px] text-slate-500 truncate">
          {prize.type}
          {prize.rarity && ` • ${prize.rarity}`}
          {prize.weight !== undefined && ` • w${prize.weight}`}
          {prize._error && ` • ⚠ ${prize._error}`}
        </div>
      </div>
    </div>
  );
}