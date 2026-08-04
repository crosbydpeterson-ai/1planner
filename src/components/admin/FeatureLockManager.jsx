import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Lock, Save, Eye, RotateCcw, ExternalLink, Image as ImageIcon, Type, Palette, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import LockedOverlay from '@/components/common/LockedOverlay';
import { LOCKABLE_FEATURES, DEFAULT_LOCK_PAGE_CONFIG } from '@/lib/featureLocks';

const PRESET_THEMES = [
  { name: 'Dark Fantasy', bg: '#1e1b4b', card: '#ffffff', text: '#1e293b', accent: '#ef4444', btn: '#6366f1', btnText: '#ffffff' },
  { name: 'Midnight', bg: '#0f172a', card: '#1e293b', text: '#f1f5f9', accent: '#f59e0b', btn: '#8b5cf6', btnText: '#ffffff' },
  { name: 'Ocean', bg: '#0c4a6e', card: '#ffffff', text: '#0c4a6e', accent: '#06b6d4', btn: '#0891b2', btnText: '#ffffff' },
  { name: 'Sunset', bg: '#7c2d12', card: '#fff7ed', text: '#7c2d12', accent: '#f97316', btn: '#ea580c', btnText: '#ffffff' },
  { name: 'Forest', bg: '#14532d', card: '#f0fdf4', text: '#14532d', accent: '#22c55e', btn: '#16a34a', btnText: '#ffffff' },
  { name: 'Royal', bg: '#581c87', card: '#faf5ff', text: '#581c87', accent: '#a855f7', btn: '#7c3aed', btnText: '#ffffff' },
  { name: 'Clean White', bg: '#f8fafc', card: '#ffffff', text: '#1e293b', accent: '#3b82f6', btn: '#3b82f6', btnText: '#ffffff' },
  { name: 'Pure Black', bg: '#000000', card: '#111827', text: '#f9fafb', accent: '#ef4444', btn: '#ef4444', btnText: '#ffffff' },
];

export default function FeatureLockManager({ featureLocks, setFeatureLocks, appSettings, setAppSettings }) {
  const [lockPageConfig, setLockPageConfig] = useState(DEFAULT_LOCK_PAGE_CONFIG);
  const [activeTab, setActiveTab] = useState('features');
  const [previewKey, setPreviewKey] = useState(0);
  const [bgUploading, setBgUploading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const pageSetting = appSettings.find(s => s.key === 'lock_page_config');
    if (pageSetting?.value) setLockPageConfig({ ...DEFAULT_LOCK_PAGE_CONFIG, ...pageSetting.value });
  }, [appSettings]);

  const updateCfg = (field, value) => {
    setLockPageConfig(prev => ({ ...prev, [field]: value }));
    setPreviewKey(k => k + 1);
  };

  const saveLockPageConfig = async () => {
    const ex = appSettings.find(s => s.key === 'lock_page_config');
    if (ex) {
      await base44.entities.AppSetting.update(ex.id, { value: lockPageConfig });
      setAppSettings(appSettings.map(s => s.key === 'lock_page_config' ? { ...s, value: lockPageConfig } : s));
    } else {
      const ns = await base44.entities.AppSetting.create({ key: 'lock_page_config', value: lockPageConfig });
      setAppSettings([...appSettings, ns]);
    }
    toast.success('Lock page design saved!');
  };

  const resetConfig = () => {
    setLockPageConfig(DEFAULT_LOCK_PAGE_CONFIG);
    setPreviewKey(k => k + 1);
    toast.info('Reset to defaults — remember to save');
  };

  const toggleGlobalLock = (featureKey) => {
    setFeatureLocks(prev => ({
      ...prev,
      global: { ...(prev.global || {}), [featureKey]: !prev.global?.[featureKey] },
    }));
  };

  const toggleClassLock = (subject, teacher, featureKey) => {
    setFeatureLocks(prev => {
      const classes = { ...(prev.classes || {}), [subject]: { ...(prev.classes?.[subject] || {}) } };
      const teacherLocks = { ...(classes[subject][teacher] || {}) };
      teacherLocks[featureKey] = !teacherLocks[featureKey];
      classes[subject][teacher] = teacherLocks;
      return { ...prev, classes };
    });
  };

  const setUserLock = (profileId, featureKey, locked, message = '') => {
    setFeatureLocks(prev => {
      const users = { ...(prev.users || {}) };
      users[profileId] = { ...(users[profileId] || {}) };
      users[profileId][featureKey] = message ? { locked, message } : locked;
      return { ...prev, users };
    });
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBgUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateCfg('backgroundImage', file_url);
      toast.success('Background image uploaded!');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    }
    setBgUploading(false);
    e.target.value = '';
  };

  const applyPreset = (preset) => {
    setLockPageConfig(prev => ({
      ...prev,
      backgroundColor: preset.bg,
      cardColor: preset.card,
      textColor: preset.text,
      accentColor: preset.accent,
      buttonColor: preset.btn,
      buttonTextColor: preset.btnText,
    }));
    setPreviewKey(k => k + 1);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={activeTab === 'features' ? 'default' : 'outline'} onClick={() => setActiveTab('features')}
          className={activeTab === 'features' ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}>
          <Lock className="w-4 h-4 mr-1" />Feature Locks
        </Button>
        <Button size="sm" variant={activeTab === 'design' ? 'default' : 'outline'} onClick={() => setActiveTab('design')}
          className={activeTab === 'design' ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}>
          <Palette className="w-4 h-4 mr-1" />Lock Page Designer
        </Button>
        <Button size="sm" variant={activeTab === 'preview' ? 'default' : 'outline'} onClick={() => setActiveTab('preview')}
          className={activeTab === 'preview' ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}>
          <Eye className="w-4 h-4 mr-1" />Live Preview
        </Button>
      </div>

      {/* Tab: Feature Locks */}
      {activeTab === 'features' && (
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2"><Lock className="w-5 h-5 text-red-400" />Global Feature Locks</h3>
                <p className="text-slate-400 text-sm mt-1">Toggle features on/off for ALL users instantly</p>
              </div>
              <Button onClick={saveFeatureLocks(featureLocks, appSettings, setAppSettings)} className="bg-emerald-600">
                <Save className="w-4 h-4 mr-1" />Save Locks
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {LOCKABLE_FEATURES.map(f => (
                <label key={f.key} className={`flex items-center gap-2 rounded-xl px-4 py-3 cursor-pointer transition-all border ${featureLocks.global?.[f.key] ? 'bg-red-500/20 border-red-500/50' : 'bg-slate-700/60 border-slate-600 hover:border-slate-500'}`}>
                  <input type="checkbox" checked={!!featureLocks.global?.[f.key]} onChange={() => toggleGlobalLock(f.key)} className="w-4 h-4 accent-red-500" />
                  <span className="text-xl">{f.emoji}</span>
                  <span className="text-sm text-slate-200 font-medium">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Per-class locks */}
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h3 className="text-white font-semibold mb-1">Class-Level Locks</h3>
            <p className="text-slate-400 text-sm mb-4">Lock features for specific teacher's class</p>
            <ClassLockEditor featureLocks={featureLocks} setFeatureLocks={setFeatureLocks} />
          </div>
        </div>
      )}

      {/* Tab: Lock Page Designer (Canva vibe) */}
      {activeTab === 'design' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Controls */}
          <div className="space-y-4">
            {/* Mode */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Settings className="w-5 h-5 text-purple-400" />Behavior Mode</h3>
              <div className="flex gap-2">
                <button onClick={() => updateCfg('mode', 'custom')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${lockPageConfig.mode === 'custom' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700/60 border-slate-600 text-slate-300'}`}>
                  🎨 Custom Lock Page
                </button>
                <button onClick={() => updateCfg('mode', 'redirect')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium border transition-all ${lockPageConfig.mode === 'redirect' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-700/60 border-slate-600 text-slate-300'}`}>
                  🔗 Redirect to URL
                </button>
              </div>
              {lockPageConfig.mode === 'redirect' && (
                <div className="mt-3">
                  <Label className="text-slate-300 mb-1 block">Redirect URL</Label>
                  <Input value={lockPageConfig.redirectUrl} onChange={e => updateCfg('redirectUrl', e.target.value)}
                    placeholder="https://example.com" className="bg-slate-700 border-slate-600 text-white" />
                </div>
              )}
            </div>

            {/* Preset Themes */}
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2"><Palette className="w-5 h-5 text-pink-400" />Preset Themes</h3>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_THEMES.map(preset => (
                  <button key={preset.name} onClick={() => applyPreset(preset)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-600 hover:border-purple-500 transition-all bg-slate-700/40">
                    <div className="flex gap-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.bg }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.btn }} />
                    </div>
                    <span className="text-xs text-slate-300">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {lockPageConfig.mode === 'custom' && (
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-3">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><Type className="w-5 h-5 text-blue-400" />Content</h3>
                <div className="grid grid-cols-4 gap-2">
                  <Label className="text-slate-300 col-span-1">Emoji</Label>
                  <Input value={lockPageConfig.emoji} onChange={e => updateCfg('emoji', e.target.value)} className="bg-slate-700 border-slate-600 text-white col-span-3 text-center text-xl" maxLength={4} />
                </div>
                <div>
                  <Label className="text-slate-300 mb-1 block">Title</Label>
                  <Input value={lockPageConfig.title} onChange={e => updateCfg('title', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300 mb-1 block">Message</Label>
                  <Textarea value={lockPageConfig.message} onChange={e => updateCfg('message', e.target.value)} className="bg-slate-700 border-slate-600 text-white min-h-[60px]" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="showContact" checked={lockPageConfig.showContact} onChange={e => updateCfg('showContact', e.target.checked)} className="w-4 h-4 accent-purple-500" />
                  <Label htmlFor="showContact" className="text-slate-300 cursor-pointer">Show contact text</Label>
                </div>
                {lockPageConfig.showContact && (
                  <div>
                    <Label className="text-slate-300 mb-1 block">Contact Text</Label>
                    <Input value={lockPageConfig.contactText} onChange={e => updateCfg('contactText', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                )}
                <div>
                  <Label className="text-slate-300 mb-1 block">Button Text</Label>
                  <Input value={lockPageConfig.buttonText} onChange={e => updateCfg('buttonText', e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
            )}

            {/* Colors */}
            {lockPageConfig.mode === 'custom' && (
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-3">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><Palette className="w-5 h-5 text-amber-400" />Colors</h3>
                {[
                  { label: 'Background', field: 'backgroundColor' },
                  { label: 'Card', field: 'cardColor' },
                  { label: 'Text', field: 'textColor' },
                  { label: 'Accent', field: 'accentColor' },
                  { label: 'Button', field: 'buttonColor' },
                  { label: 'Button Text', field: 'buttonTextColor' },
                ].map(c => (
                  <div key={c.field} className="flex items-center gap-3">
                    <Label className="text-slate-300 w-28">{c.label}</Label>
                    <input type="color" value={lockPageConfig[c.field]} onChange={e => updateCfg(c.field, e.target.value)}
                      className="w-10 h-10 rounded-lg border border-slate-600 cursor-pointer bg-slate-700" />
                    <Input value={lockPageConfig[c.field]} onChange={e => updateCfg(c.field, e.target.value)} className="bg-slate-700 border-slate-600 text-white flex-1" />
                  </div>
                ))}
                <div className="pt-2">
                  <Label className="text-slate-300 mb-1 block flex items-center gap-2"><ImageIcon className="w-4 h-4" />Background Image (optional)</Label>
                  <div className="flex gap-2">
                    <Input value={lockPageConfig.backgroundImage} onChange={e => updateCfg('backgroundImage', e.target.value)} placeholder="Image URL or upload below" className="bg-slate-700 border-slate-600 text-white flex-1" />
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" disabled={bgUploading} />
                      <span className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-slate-300 hover:border-purple-500 text-sm">
                        {bgUploading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}Upload
                      </span>
                    </label>
                    {lockPageConfig.backgroundImage && (
                      <Button size="sm" variant="ghost" onClick={() => updateCfg('backgroundImage', '')} className="text-red-400">Clear</Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Save / Reset */}
            <div className="flex gap-2">
              <Button onClick={saveLockPageConfig} className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500">
                <Save className="w-4 h-4 mr-2" />Save Design
              </Button>
              <Button onClick={resetConfig} variant="outline" className="border-slate-600 text-slate-300">
                <RotateCcw className="w-4 h-4 mr-1" />Reset
              </Button>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:sticky lg:top-4 h-fit">
            <div className="bg-slate-800 rounded-2xl p-3 border border-slate-700">
              <div className="flex items-center gap-2 mb-2 px-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="text-slate-300 text-sm font-medium">Live Preview</span>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-700">
                <div key={previewKey} className="h-[500px] overflow-y-auto">
                  <LockedOverlay featureLabel="Game Studio" lockPageConfig={lockPageConfig} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Full Preview */}
      {activeTab === 'preview' && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="h-[600px] overflow-y-auto">
            <LockedOverlay featureLabel="Game Studio" message="An admin has locked this feature." lockPageConfig={lockPageConfig} />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to save feature locks (lifted from Admin.jsx pattern)
function saveFeatureLocks(featureLocks, appSettings, setAppSettings) {
  return async () => {
    const ex = appSettings.find(s => s.key === 'feature_locks');
    if (ex) {
      await base44.entities.AppSetting.update(ex.id, { value: featureLocks });
      setAppSettings(appSettings.map(s => s.key === 'feature_locks' ? { ...s, value: featureLocks } : s));
    } else {
      const ns = await base44.entities.AppSetting.create({ key: 'feature_locks', value: featureLocks });
      setAppSettings([...appSettings, ns]);
    }
    toast.success('Locks saved!');
  };
}

function ClassLockEditor({ featureLocks, setFeatureLocks }) {
  const subjects = [
    { key: 'math', label: 'Math', teachers: ['Best', 'Libbey', 'Hannan', 'Paulson'] },
    { key: 'reading', label: 'Reading', teachers: ['Riener', 'Libbey', 'Hannan', 'Paulson'] },
  ];

  const toggle = (subject, teacher, featureKey) => {
    setFeatureLocks(prev => {
      const classes = { ...(prev.classes || {}), [subject]: { ...(prev.classes?.[subject] || {}) } };
      const teacherLocks = { ...(classes[subject][teacher] || {}) };
      teacherLocks[featureKey] = !teacherLocks[featureKey];
      classes[subject][teacher] = teacherLocks;
      return { ...prev, classes };
    });
  };

  return (
    <div className="space-y-4">
      {subjects.map(subj => (
        <div key={subj.key}>
          <h4 className="text-slate-300 font-medium mb-2">{subj.label} Classes</h4>
          <div className="space-y-2">
            {subj.teachers.map(teacher => (
              <div key={teacher} className="bg-slate-700/40 rounded-xl p-3">
                <div className="text-sm text-slate-400 mb-2">{teacher}</div>
                <div className="flex flex-wrap gap-1.5">
                  {LOCKABLE_FEATURES.map(f => {
                    const isLocked = !!featureLocks.classes?.[subj.key]?.[teacher]?.[f.key];
                    return (
                      <button key={f.key} onClick={() => toggle(subj.key, teacher, f.key)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${isLocked ? 'bg-red-500/20 border-red-500/50 text-red-300' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                        {f.emoji} {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}