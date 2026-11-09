import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Loader2, AlertTriangle, Save, ScanLine, X } from 'lucide-react';
import { toast } from 'sonner';
import { saveHelperCard, generateHelperNumber, isAdminProfile } from '@/lib/helperCards';
import MagicCardScanner from '@/components/auth/MagicCardScanner';
import { primeScanAudio, playScanSound } from '@/lib/scanSound';
import HelperCardFace, { HELPER_CARD_W, HELPER_CARD_H } from './HelperCardFace';
import HelperCardDesignFields from './HelperCardDesignFields';
import MagicCardRewardPicker from '@/components/admin/MagicCardRewardPicker';
import HelperRewardPresets from './HelperRewardPresets';
import { blankDesign, normalizeDesign } from '@/lib/cardDesigns';

// The live preview is the real card face, shrunk to fit this dialog.
const PREVIEW_W = 330;
const PREVIEW_SCALE = PREVIEW_W / HELPER_CARD_W;

const ACTION_ROWS = [
  { key: 'fixXp', label: 'Fix Missing XP', hint: 'Add XP with a required reason' },
  { key: 'grantReward', label: 'Grant Reward', hint: 'Send one of the rewards below' },
  { key: 'giftSong', label: 'Gift a Song', hint: 'Add one song from the library' },
  { key: 'resetPasscode', label: 'Reset Passcode', hint: 'Student sets a new 4-digit PIN' },
  { key: 'switchAccount', label: 'Switch Account', hint: 'Off by default — changes who is signed in' },
];

const emptyForm = (admin) => ({
  number: generateHelperNumber(),
  nickname: '',
  adminProfileId: admin?.id || '',
  adminUsername: admin?.username || '',
  actions: { fixXp: true, grantReward: true, giftSong: true, resetPasscode: true, switchAccount: false },
  rewardPresets: [{ id: 'preset_xp_25', label: '+25 XP', type: 'xp', amount: 25, value: '' }],
  reward: null,
  rewardGrantedProfileIds: [],
  design: blankDesign(),
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
            reward: card.reward?.type ? { ...card.reward } : null,
            rewardGrantedProfileIds: card.rewardGrantedProfileIds || [],
            design: normalizeDesign(card.design),
          }
        : emptyForm(currentAdmin)
    );
  }, [open, card, currentAdmin]);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const admin = admins.find((row) => row.id === form.adminProfileId);
      // A different bonus is a fresh gift, so the "already given" list starts over.
      const rewardChanged = JSON.stringify(form.reward || null) !== JSON.stringify(card?.reward || null);
      const saved = await saveHelperCard(
        {
          ...form,
          adminUsername: admin?.username || form.adminUsername,
          rewardGrantedProfileIds: rewardChanged ? [] : form.rewardGrantedProfileIds,
        },
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

          <div className="flex justify-center rounded-2xl border border-slate-700 bg-slate-800 p-2">
            <div
              className="overflow-hidden rounded-xl"
              style={{ width: PREVIEW_W, height: Math.round(HELPER_CARD_H * PREVIEW_SCALE) }}
            >
              <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
                <HelperCardFace card={form} />
              </div>
            </div>
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

          <HelperRewardPresets
            presets={form.rewardPresets}
            onChange={(rewardPresets) => setForm({ ...form, rewardPresets })}
          />

          <div className="rounded-2xl bg-white p-3">
            <HelperCardDesignFields
              design={normalizeDesign(form.design)}
              onChange={(design) => setForm({ ...form, design })}
            />
          </div>

          <div className="rounded-2xl bg-white p-3">
            <MagicCardRewardPicker
              reward={form.reward}
              onChange={(reward) => setForm({ ...form, reward })}
              label="Bonus for the student (optional)"
              note={
                form.reward?.type
                  ? 'Given to the student the first time this card helps them — once per student.'
                  : 'With no bonus, this card only makes the change you confirm.'
              }
            />
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