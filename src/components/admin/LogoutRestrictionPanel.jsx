import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getAppSettings, invalidateAppSettings } from '@/lib/dataCache';
import { toDateTimeLocalValue, fromDateTimeLocalValue, formatChicagoDate } from '@/lib/logoutRestriction';
import LogoutCodeManager from '@/components/admin/LogoutCodeManager';

const SETTINGS_KEY = 'logout_restriction_settings';

const DEFAULT_SETTINGS = {
  enabled: false,
  autoEndDate: null,
  scope: 'all',
  targetProfileIds: [],
  targetClassKeys: [],
  exemptProfileIds: [],
};

export default function LogoutRestrictionPanel({ users, teachers, appSettings, setAppSettings, adminUsername }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await getAppSettings();
        const existing = all.find((s) => s.key === SETTINGS_KEY)?.value;
        if (mounted && existing) setSettings({ ...DEFAULT_SETTINGS, ...existing });
      } catch (e) {
        console.error('Failed to load logout restriction settings', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const classKeyOptions = [];
  (teachers?.math || []).forEach((t) => classKeyOptions.push({ key: `math:${t.id}`, label: `Math: ${t.name}` }));
  (teachers?.reading || []).forEach((t) => classKeyOptions.push({ key: `reading:${t.id}`, label: `Reading: ${t.name}` }));

  const toggleProfile = (list, id) => {
    setSettings((s) => ({
      ...s,
      [list]: s[list].includes(id) ? s[list].filter((x) => x !== id) : [...s[list], id],
    }));
  };

  const toggleClass = (key) => {
    setSettings((s) => ({
      ...s,
      targetClassKeys: s.targetClassKeys.includes(key)
        ? s.targetClassKeys.filter((x) => x !== key)
        : [...s.targetClassKeys, key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        autoEndDate: settings.autoEndDate ? fromDateTimeLocalValue(settings.autoEndDate) : null,
      };
      const existing = appSettings.find((s) => s.key === SETTINGS_KEY);
      if (existing) {
        await base44.entities.AppSetting.update(existing.id, { value: payload });
        setAppSettings(appSettings.map((s) => (s.key === SETTINGS_KEY ? { ...s, value: payload } : s)));
      } else {
        const created = await base44.entities.AppSetting.create({ key: SETTINGS_KEY, value: payload });
        setAppSettings([...appSettings, created]);
      }
      invalidateAppSettings();
      setSettings({ ...DEFAULT_SETTINGS, ...payload });
      toast.success('Logout restriction settings saved.');
    } catch (e) {
      console.error('Failed to save logout restriction', e);
      toast.error('Failed to save settings.');
    }
    setSaving(false);
  };

  const filteredUsers = users.filter((u) => !search || (u.username || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Limitations warning */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200">
            <p className="font-semibold mb-1">Best-effort UI restriction — not secure authentication</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-200/80">
              <li>This only adds friction to the logout button. It does not secure data or prevent a determined user from switching accounts.</li>
              <li>Code values and counters live in the database and are checked in the browser. On the current plan there is no server-side enforcement.</li>
              <li>Max-use counters are not guaranteed against simultaneous requests.</li>
              <li>Admins always bypass the restriction and can turn it off at any time.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-1">Temporary Logout Restrictions</h3>
        <p className="text-slate-400 text-sm mb-4">All dates shown in America/Chicago time.</p>

        <div className="space-y-4">
          <label className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="w-5 h-5 rounded"
            />
            <div>
              <span className="text-white font-medium">Enable logout restriction</span>
              <p className="text-xs text-slate-400">When ON, covered students must enter a code to logout. Currently {settings.enabled ? 'ON' : 'OFF'}.</p>
            </div>
          </label>

          <div className="space-y-2">
            <Label className="text-slate-300">Automatic end date (Chicago)</Label>
            <Input
              type="datetime-local"
              value={toDateTimeLocalValue(settings.autoEndDate)}
              onChange={(e) => setSettings({ ...settings, autoEndDate: e.target.value })}
              className="bg-slate-700 border-slate-600 text-white"
            />
            <p className="text-xs text-slate-500">The restriction auto-disables after this time. Leave blank for no auto-end.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Scope</Label>
            <Select value={settings.scope} onValueChange={(v) => setSettings({ ...settings, scope: v })}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                <SelectItem value="profiles">Selected profiles</SelectItem>
                <SelectItem value="classes">Selected classes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.scope === 'profiles' && (
            <div className="space-y-2">
              <Label className="text-slate-300">Target profiles ({settings.targetProfileIds.length} selected)</Label>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students…"
                className="bg-slate-700 border-slate-600 text-white"
              />
              <div className="max-h-48 overflow-y-auto bg-slate-900/50 rounded-lg p-2 space-y-1">
                {filteredUsers.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm text-white cursor-pointer p-1 rounded hover:bg-slate-700/50">
                    <input
                      type="checkbox"
                      checked={settings.targetProfileIds.includes(u.id)}
                      onChange={() => toggleProfile('targetProfileIds', u.id)}
                      className="rounded"
                    />
                    <span>{u.username}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {settings.scope === 'classes' && (
            <div className="space-y-2">
              <Label className="text-slate-300">Target classes ({settings.targetClassKeys.length} selected)</Label>
              <div className="max-h-48 overflow-y-auto bg-slate-900/50 rounded-lg p-2 space-y-1">
                {classKeyOptions.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 text-sm text-white cursor-pointer p-1 rounded hover:bg-slate-700/50">
                    <input
                      type="checkbox"
                      checked={settings.targetClassKeys.includes(c.key)}
                      onChange={() => toggleClass(c.key)}
                      className="rounded"
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300">Exempt profiles (never restricted)</Label>
            <div className="max-h-40 overflow-y-auto bg-slate-900/50 rounded-lg p-2 space-y-1">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm text-white cursor-pointer p-1 rounded hover:bg-slate-700/50">
                  <input
                    type="checkbox"
                    checked={settings.exemptProfileIds.includes(u.id)}
                    onChange={() => toggleProfile('exemptProfileIds', u.id)}
                    className="rounded"
                  />
                  <span>{u.username}{(u.rank === 'admin' || u.rank === 'super_admin' || (u.username || '').toLowerCase() === 'crosby') && ' (admin — always bypasses)'}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving…' : 'Save restriction settings'}
          </Button>
        </div>
      </div>

      {/* Code management */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-1">Logout Codes</h3>
        <p className="text-slate-400 text-sm mb-4">Generate and manage codes students can use to logout. New codes default to 1 use and a short expiration.</p>
        <LogoutCodeManager users={users} teachers={teachers} adminUsername={adminUsername} />
      </div>
    </div>
  );
}