import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PETS } from '@/components/quest/PetCatalog';
import DailyRewardsBuilder from './DailyRewardsBuilder';
import SpinWheelBuilder from './SpinWheelBuilder';
import SpinGiftingPanel from './SpinGiftingPanel';

const DEFAULT_CONFIG = {
  scheduleType: 'streak7',
  rewards: Array.from({ length: 7 }, () => ({ type: 'xp', amount: 25 })),
  wheel: { enabled: false, prizes: [] },
  claimMode: 'manual',
  requireAssignment: true,
};

/**
 * Daily Rewards Tab — admin container for the daily rewards builder,
 * spin wheel builder, and spin gifting panel.
 */
export default function DailyRewardsTab() {
  const [settingId, setSettingId] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [allPets, setAllPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const customPets = await base44.entities.CustomPet.list('-created_date');
        const builtIn = PETS.map(p => ({ id: p.id, name: p.name, emoji: p.emoji }));
        const custom = customPets.map(p => ({ id: `custom_${p.id}`, name: p.name, emoji: p.emoji || '🐾' }));
        setAllPets([...builtIn, ...custom]);

        const settings = await base44.entities.AppSetting.list();
        const dr = settings.find(s => s.key === 'daily_rewards_config');
        if (dr) {
          setSettingId(dr.id);
          setConfig({
            scheduleType: dr.value?.scheduleType || 'streak7',
            rewards: Array.isArray(dr.value?.rewards) && dr.value.rewards.length > 0
              ? dr.value.rewards
              : Array.from({ length: 7 }, () => ({ type: 'xp', amount: 25 })),
            wheel: dr.value?.wheel || { enabled: false, prizes: [] },
            claimMode: dr.value?.claimMode || 'manual',
            requireAssignment: dr.value?.requireAssignment !== false,
          });
        }
      } catch (e) {
        console.error('Failed to load daily rewards config', e);
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
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
    setSaving(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Daily Rewards Builder */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <h3 className="text-white font-semibold mb-1">📅 Daily Rewards Builder</h3>
        <p className="text-sm text-slate-400 mb-4">Configure the reward schedule students see each day.</p>
        <DailyRewardsBuilder config={config} setConfig={setConfig} allPets={allPets} />
      </div>

      {/* Spin Wheel Builder */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <h3 className="text-white font-semibold mb-1">🎡 Spin Wheel Builder</h3>
        <p className="text-sm text-slate-400 mb-4">Configure the prizes on the bonus spin wheel.</p>
        <SpinWheelBuilder
          wheel={config.wheel || { enabled: false, prizes: [] }}
          setWheel={(w) => setConfig({ ...config, wheel: w })}
          allPets={allPets}
        />
      </div>

      {/* Save button (saves builder + wheel config) */}
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Save className="w-4 h-4 mr-2" /> Save Reward & Wheel Config</>}
        </Button>
      </div>

      {/* Spin Gifting — operates independently, no save needed */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <h3 className="text-white font-semibold mb-1">🎁 Spin Gifting</h3>
        <p className="text-sm text-slate-400 mb-4">Grant bonus wheel spins to individual users or everyone at once.</p>
        <SpinGiftingPanel />
      </div>
    </div>
  );
}