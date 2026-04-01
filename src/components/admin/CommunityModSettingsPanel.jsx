import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Save, Shield, Bot, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_KEYWORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'damn',
  'kill', 'murder', 'suicide', 'gun', 'shoot',
  'drug', 'weed', 'cocaine', 'meth',
  'porn', 'sex', 'nude', 'naked', 'nsfw',
  'racist', 'slur', 'middle finger',
];

export default function CommunityModSettingsPanel() {
  const [keywords, setKeywords] = useState([]);
  const [aiModEnabled, setAiModEnabled] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [settingId, setSettingId] = useState(null);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const settings = await base44.entities.AppSetting.list();
      const mod = settings.find(s => s.key === 'community_moderation');
      if (mod) {
        setKeywords(mod.value.keywords || DEFAULT_KEYWORDS);
        setAiModEnabled(!!mod.value.aiModEnabled);
        setSettingId(mod.id);
      } else {
        setKeywords([...DEFAULT_KEYWORDS]);
      }
    } catch (e) {
      console.error('Failed to load mod settings', e);
      setKeywords([...DEFAULT_KEYWORDS]);
    }
    setLoading(false);
  };

  const addKeyword = () => {
    const word = newKeyword.trim().toLowerCase();
    if (!word || keywords.includes(word)) return;
    setKeywords([...keywords, word]);
    setNewKeyword('');
  };

  const removeKeyword = (word) => {
    setKeywords(keywords.filter(k => k !== word));
  };

  const saveSettings = async () => {
    const value = { keywords, aiModEnabled };
    try {
      if (settingId) {
        await base44.entities.AppSetting.update(settingId, { value });
      } else {
        const created = await base44.entities.AppSetting.create({ key: 'community_moderation', value });
        setSettingId(created.id);
      }
      toast.success('Moderation settings saved!');
    } catch (e) {
      toast.error('Failed to save settings');
    }
  };

  if (loading) return <div className="text-slate-400 text-sm py-4">Loading settings...</div>;

  return (
    <div className="space-y-6">
      {/* AI Moderation Toggle */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-400" />
            <div>
              <h4 className="text-white font-semibold text-sm">AI Moderation Bot</h4>
              <p className="text-[10px] text-slate-400">AI checks every post/comment for inappropriate content before it goes live</p>
            </div>
          </div>
          <Switch checked={aiModEnabled} onCheckedChange={setAiModEnabled} />
        </div>
        {aiModEnabled && (
          <div className="mt-3 flex items-center gap-2 bg-blue-500/10 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-[10px] text-slate-300">AI mod uses integration credits per message. Posts may take a moment to process.</p>
          </div>
        )}
      </div>

      {/* Keyword Blocklist */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-red-400" />
          <h4 className="text-white font-semibold text-sm">Blocked Keywords ({keywords.length})</h4>
        </div>
        <div className="flex gap-2 mb-3">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            placeholder="Add a blocked word..."
            className="bg-slate-700 border-slate-600 text-white flex-1 h-8 text-sm"
          />
          <Button size="sm" onClick={addKeyword} className="bg-red-600 h-8">
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-800/50 rounded-lg">
          {keywords.map((word) => (
            <span key={word} className="inline-flex items-center gap-1 bg-red-500/10 text-red-300 px-2 py-1 rounded text-xs">
              {word}
              <button onClick={() => removeKeyword(word)} className="hover:text-red-100">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {keywords.length === 0 && <p className="text-slate-500 text-xs">No blocked keywords</p>}
        </div>
      </div>

      {/* Save */}
      <Button onClick={saveSettings} className="w-full bg-emerald-600">
        <Save className="w-4 h-4 mr-2" /> Save Moderation Settings
      </Button>
    </div>
  );
}