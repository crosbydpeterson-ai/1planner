import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Lock, Save, Eye, Palette, Settings, Users, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import LockedOverlay from '@/components/common/LockedOverlay';
import {
  LOCKABLE_FEATURES,
  DEFAULT_LOCK_PAGE_CONFIG,
} from '@/lib/featureLocks';
import LockPageDesigner from './lockdesigner/LockPageDesigner';
import UserLockManager from './lockdesigner/UserLockManager';
import SecretCodeManager from './lockdesigner/SecretCodeManager';

export default function FeatureLockManager({ featureLocks, setFeatureLocks, appSettings, setAppSettings }) {
  const [lockPageConfig, setLockPageConfig] = useState(DEFAULT_LOCK_PAGE_CONFIG);
  const [activeTab, setActiveTab] = useState('features');
  const [previewKey, setPreviewKey] = useState(0);
  const [bgUploading, setBgUploading] = useState(false);
  const [savedThemes, setSavedThemes] = useState([]);

  useEffect(() => {
    const pageSetting = appSettings.find(s => s.key === 'lock_page_config');
    if (pageSetting?.value) setLockPageConfig({ ...DEFAULT_LOCK_PAGE_CONFIG, ...pageSetting.value });
    const themesSetting = appSettings.find(s => s.key === 'saved_lock_themes');
    if (themesSetting?.value) setSavedThemes(themesSetting.value);
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

  const toggleGlobalLock = (featureKey) => {
    setFeatureLocks(prev => ({
      ...prev,
      global: { ...(prev.global || {}), [featureKey]: !prev.global?.[featureKey] },
    }));
  };

  const saveFeatureLocks = async () => {
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

  const tabs = [
    { key: 'features', label: 'Feature Locks', icon: Lock },
    { key: 'users', label: 'Per-User', icon: Users },
    { key: 'codes', label: 'Secret Codes', icon: Ticket },
    { key: 'designer', label: 'Page Designer', icon: Palette },
    { key: 'preview', label: 'Live Preview', icon: Eye },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <Button key={tab.key} size="sm" variant={activeTab === tab.key ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}>
            <tab.icon className="w-4 h-4 mr-1" />{tab.label}
          </Button>
        ))}
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
              <Button onClick={saveFeatureLocks} className="bg-emerald-600">
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

          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
            <h3 className="text-white font-semibold mb-1">Class-Level Locks</h3>
            <p className="text-slate-400 text-sm mb-4">Lock features for specific teacher's class</p>
            <ClassLockEditor featureLocks={featureLocks} setFeatureLocks={setFeatureLocks} />
          </div>
        </div>
      )}

      {/* Tab: Per-User */}
      {activeTab === 'users' && (
        <UserLockManager featureLocks={featureLocks} setFeatureLocks={setFeatureLocks} />
      )}

      {/* Tab: Secret Codes */}
      {activeTab === 'codes' && (
        <SecretCodeManager featureLocks={featureLocks} setFeatureLocks={setFeatureLocks} />
      )}

      {/* Tab: Page Designer */}
      {activeTab === 'designer' && (
        <LockPageDesigner
          lockPageConfig={lockPageConfig}
          setLockPageConfig={setLockPageConfig}
          saveLockPageConfig={saveLockPageConfig}
          resetConfig={resetConfig}
          previewKey={previewKey}
          bgUploading={bgUploading}
          handleBgUpload={handleBgUpload}
          savedThemes={savedThemes}
        />
      )}

      {/* Tab: Full Preview */}
      {activeTab === 'preview' && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="h-[600px] overflow-y-auto">
            <LockedOverlay featureLabel="Game Studio" message="An admin has locked this feature." lockPageConfig={lockPageConfig} featureKey="games" />
          </div>
        </div>
      )}
    </div>
  );
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