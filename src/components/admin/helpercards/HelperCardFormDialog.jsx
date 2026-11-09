import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, RefreshCw, Loader2, AlertTriangle, Save, ScanLine, X } from 'lucide-react';
import { toast } from 'sonner';
import { saveHelperCard, generateHelperNumber, isAdminProfile } from '@/lib/helperCards';
import MagicCardScanner from '@/components/auth/MagicCardScanner';
import { primeScanAudio, playScanSound } from '@/lib/scanSound';

const ACTION_ROWS = [
  { key: 'fixXp', label: 'Fix Missing XP', hint: 'Add XP with a required reason' },
  { key: 'grantReward', label: 'Grant Reward', hint: 'Send one of the rewards below' },
  { key: 'resetPasscode', label: 'Reset Passcode', hint: 'Student sets a new 4-digit PIN' },
  { key: 'switchAccount', label: 'Switch Account', hint: 'Off by default — changes who is signed in' },
];

const emptyForm = (admin) => ({
  number: generateHelperNumber(),
  nickname: '',
  adminProfileId: admin?.id || '',
  adminUsername: admin?.username || '',
  actions: { fixXp: true, grantReward: true, resetPasscode: true, switchAccount: false },
  rewardPresets: [{ id: 'preset_xp_25', label: '+25 XP', type: 'xp', amount: 25 }],
  note: '',
});

export default function HelperCardFormDialog({ open, onClose, card, users = [], currentAdmin, onSaved }) {
  const [form, setForm] = useState(emptyForm(currentAdmin));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const admins = users.filter(isAdminProfile);

  useEffect(() => {
    if (!open) return;
    setError('');
    setBusy(false);
    setScanning(false);
    setForm(
      card
        ? {
            ...card,
            actions: { ...(card.actions || {}) },
            rewardPresets: (card.rewardPresets || []).map((preset) => ({ ...preset })),
          }
        : emptyForm(currentAdmin)
    );
  }, [open, card, currentAdmin]);

  const setPreset = (index, patch) =>
    setForm((prev) => ({
      ...prev,
      rewardPresets: prev.rewardPresets.map((preset, i) => (i === index ? { ...preset, ...patch } : preset)),
    }));

  const addPreset = () =>
    setForm((prev) => ({
      ...prev,
      rewardPresets: [
        ...prev.rewardPresets,
        { id: `preset_${Date.now()}`, label: '+25 XP', type: 'xp', amount: 25 },
      ],
    }));

  const removePreset = (index) =>
    setForm((prev) => ({ ...prev, rewardPresets: prev.rewardPresets.filter((_, i) => i !== index) }));

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const admin = admins.find((row) => row.id === form.adminProfileId);
      const saved = await saveHelperCard(
        { ...form, adminUsername: admin?.username || form.adminUsername },
        card?.id || null
      );
      toast.success(card ? 'Helper card updated' : 'Helper card created');
      onSaved?.(saved);
    } catch (e) {
      console.error('Failed to save helper card:', e);
      setError(e?.userFacing ? e.message : 'Could not save the card.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{card ? 'Edit helper card' : 'New helper card'}</DialogTitle>
          <DialogDescription className="text-slate-400">
            A helper card lets one admin make one action at a time on a student's device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-slate-300">Card name</Label>
            <Input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              placeholder="Front desk card"
              className="mt-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <Label className="text-slate-300">Belongs to</Label>
            <Select
              value={form.adminProfileId}
              onValueChange={(value) => {
                const admin = admins.find((row) => row.id === value);
                setForm({ ...form, adminProfileId: value, adminUsername: admin?.username || '' });
              }}
            >
              <SelectTrigger className="mt-1 bg-slate-800 border-slate-600 text-white">
                <SelectValue placeholder="Choose an admin" />
              </SelectTrigger>
              <SelectContent>
                {admins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.username || admin.userId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-slate-500 mt-1">Only this admin's password can confirm the card.</p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Card number</Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    primeScanAudio();
                    setScanning((v) => !v);
                  }}
                  className="h-7 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <ScanLine className="w-3.5 h-3.5 mr-1" /> {scanning ? 'Stop' : 'Scan card'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm({ ...form, number: generateHelperNumber() })}
                  className="h-7 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> New number
                </Button>
              </div>
            </div>

            {scanning && (
              <div className="mt-2 space-y-2">
                <MagicCardScanner
                  onDetected={(value) => {
                    playScanSound();
                    setScanning(false);
                    setForm((prev) => ({ ...prev, number: String(value).trim() }));
                    setError('');
                  }}
                  onUnavailable={(message) => {
                    setScanning(false);
                    setError(message);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setScanning(false)}
                  className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4 mr-1" /> Stop camera
                </Button>
              </div>
            )}

            <Input
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              className="mt-2 bg-slate-800 border-slate-600 text-white font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Scan a printed helper card to reuse its number, or type one.
            </p>
          </div>

          <div>
            <Label className="text-slate-300">Allowed actions</Label>
            <div className="mt-1 space-y-1.5">
              {ACTION_ROWS.map((row) => (
                <div
                  key={row.key}
                  className="flex items-center gap-3 rounded-xl bg-slate-800 border border-slate-700 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white">{row.label}</p>
                    <p className="text-[10px] text-slate-400">{row.hint}</p>
                  </div>
                  <Switch
                    checked={!!form.actions?.[row.key]}
                    onCheckedChange={(value) =>
                      setForm({ ...form, actions: { ...form.actions, [row.key]: value } })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Rewards this card may grant</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addPreset}
                className="h-7 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
            <div className="mt-1 space-y-1.5">
              {form.rewardPresets.length === 0 && (
                <p className="text-[10px] text-slate-500">
                  With no rewards listed, this card can't grant any.
                </p>
              )}
              {form.rewardPresets.map((preset, index) => (
                <div key={preset.id || index} className="flex items-center gap-1.5">
                  <Input
                    value={preset.label}
                    onChange={(e) => setPreset(index, { label: e.target.value })}
                    placeholder="+25 XP"
                    className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  <Select value={preset.type} onValueChange={(value) => setPreset(index, { type: value })}>
                    <SelectTrigger className="w-24 bg-slate-800 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xp">XP</SelectItem>
                      <SelectItem value="coins">Coins</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={preset.amount}
                    onChange={(e) => setPreset(index, { amount: e.target.value })}
                    className="w-20 bg-slate-800 border-slate-600 text-white"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePreset(index)}
                    className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-slate-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="flex items-start gap-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={busy} className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Cancel
            </Button>
            <Button onClick={save} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700">
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save card
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}