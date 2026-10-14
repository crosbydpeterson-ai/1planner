import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { generateCodeValue, formatChicagoDate, toDateTimeLocalValue, fromDateTimeLocalValue } from '@/lib/logoutRestriction';

const DEFAULT_FORM = {
  name: '',
  code: '',
  validFrom: '',
  expiresAt: '',
  maxUses: 1,
  maxUsesPerProfile: '',
  scope: 'everyone',
  allowedProfileIds: [],
  allowedClassKeys: [],
};

function buildForm(existing) {
  if (!existing) return { ...DEFAULT_FORM, code: generateCodeValue() };
  return {
    name: existing.name || '',
    code: existing.code || generateCodeValue(),
    validFrom: toDateTimeLocalValue(existing.validFrom),
    expiresAt: toDateTimeLocalValue(existing.expiresAt),
    maxUses: existing.maxUses ?? 1,
    maxUsesPerProfile: existing.maxUsesPerProfile ?? '',
    scope: existing.scope || 'everyone',
    allowedProfileIds: existing.allowedProfileIds || [],
    allowedClassKeys: existing.allowedClassKeys || [],
  };
}

export default function LogoutCodeFormDialog({ open, onOpenChange, users, teachers, onSaved, existing, adminUsername }) {
  const isReplacement = !!existing;
  const [form, setForm] = useState(() => buildForm(existing));

  useEffect(() => {
    if (open) setForm(buildForm(existing));
  }, [open, existing]);

  const classKeyOptions = [];
  (teachers?.math || []).forEach((t) => classKeyOptions.push({ key: `math:${t.id}`, label: `Math: ${t.name}` }));
  (teachers?.reading || []).forEach((t) => classKeyOptions.push({ key: `reading:${t.id}`, label: `Reading: ${t.name}` }));

  const toggleProfile = (id) => {
    setForm((f) => ({
      ...f,
      allowedProfileIds: f.allowedProfileIds.includes(id)
        ? f.allowedProfileIds.filter((x) => x !== id)
        : [...f.allowedProfileIds, id],
    }));
  };

  const toggleClass = (key) => {
    setForm((f) => ({
      ...f,
      allowedClassKeys: f.allowedClassKeys.includes(key)
        ? f.allowedClassKeys.filter((x) => x !== key)
        : [...f.allowedClassKeys, key],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Please enter a name/note.'); return; }
    if (!form.code.trim()) { toast.error('Please generate a code.'); return; }
    if (!form.expiresAt) { toast.error('Please set an expiration time.'); return; }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      validFrom: fromDateTimeLocalValue(form.validFrom) || null,
      expiresAt: fromDateTimeLocalValue(form.expiresAt),
      maxUses: parseInt(form.maxUses) || 1,
      maxUsesPerProfile: form.maxUsesPerProfile ? parseInt(form.maxUsesPerProfile) : null,
      scope: form.scope,
      allowedProfileIds: form.scope === 'profiles' ? form.allowedProfileIds : [],
      allowedClassKeys: form.scope === 'classes' ? form.allowedClassKeys : [],
      isActive: true,
      useCount: 0,
      usageHistory: [],
      createdBy: adminUsername || 'admin',
    };

    try {
      const created = await base44.entities.LogoutCode.create(payload);
      toast.success('Logout code created.');
      onSaved(created);
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to create logout code', e);
      toast.error('Failed to create code.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isReplacement ? 'Replacement logout code' : 'Create logout code'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name / internal note</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. End-of-period switch for Mrs. Best's class"
              className="bg-slate-700 border-slate-600"
            />
          </div>

          <div className="space-y-2">
            <Label>Code</Label>
            <div className="flex gap-2">
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="bg-slate-700 border-slate-600 font-mono tracking-widest"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setForm({ ...form, code: generateCodeValue() })}
                className="border-slate-600 text-slate-200"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { navigator.clipboard.writeText(form.code); toast.success('Code copied'); }}
                className="border-slate-600 text-slate-200"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-400">Copy this now and share it with the student(s). All times are shown in America/Chicago.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Valid from (Chicago)</Label>
              <Input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label>Expires at (Chicago) *</Label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="bg-slate-700 border-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Max total uses</Label>
              <Input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                className="bg-slate-700 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label>Max uses per profile (optional)</Label>
              <Input
                type="number"
                min="1"
                value={form.maxUsesPerProfile}
                onChange={(e) => setForm({ ...form, maxUsesPerProfile: e.target.value })}
                placeholder="No limit"
                className="bg-slate-700 border-slate-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Allowed students</Label>
            <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v })}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone covered by the restriction</SelectItem>
                <SelectItem value="profiles">Selected profiles</SelectItem>
                <SelectItem value="classes">Selected classes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.scope === 'profiles' && (
            <div className="space-y-2">
              <Label>Select profiles ({form.allowedProfileIds.length} selected)</Label>
              <div className="max-h-40 overflow-y-auto bg-slate-900/50 rounded-lg p-2 space-y-1">
                {users.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer p-1 rounded hover:bg-slate-700/50">
                    <input
                      type="checkbox"
                      checked={form.allowedProfileIds.includes(u.id)}
                      onChange={() => toggleProfile(u.id)}
                      className="rounded"
                    />
                    <span>{u.username}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {form.scope === 'classes' && (
            <div className="space-y-2">
              <Label>Select classes ({form.allowedClassKeys.length} selected)</Label>
              <div className="max-h-40 overflow-y-auto bg-slate-900/50 rounded-lg p-2 space-y-1">
                {classKeyOptions.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer p-1 rounded hover:bg-slate-700/50">
                    <input
                      type="checkbox"
                      checked={form.allowedClassKeys.includes(c.key)}
                      onChange={() => toggleClass(c.key)}
                      className="rounded"
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
                {classKeyOptions.length === 0 && <p className="text-xs text-slate-500 p-1">No teachers configured.</p>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-amber-600 hover:bg-amber-700">Create code</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}