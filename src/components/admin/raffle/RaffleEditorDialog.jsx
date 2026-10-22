import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Copy, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PETS } from '@/components/quest/PetCatalog';
import { PRIZE_MODES, RAFFLE_STATUS, buildEntries, resolveEligibleProfiles, validateRaffle } from '@/lib/raffleLogic';
import { createRaffle, updateRaffle } from '@/lib/raffleData';
import RafflePrizeEditor from '@/components/admin/raffle/RafflePrizeEditor';
import RaffleEligibilityFields from '@/components/admin/raffle/RaffleEligibilityFields';

const emptyDraft = () => ({
  title: '',
  description: '',
  artworkUrl: '',
  prizeMode: 'limited',
  allowMultipleWins: false,
  prizes: [],
  fallbackReward: null,
  eligibility: { scope: 'everyone', profileIds: [] },
});

/**
 * Create or edit a raffle. Configuration is only editable while the raffle is a
 * draft — once entries are locked, the participants and draw order must not move,
 * so the dialog becomes a read-only summary with a duplicate action instead.
 */
export default function RaffleEditorDialog({
  open,
  onClose,
  raffle,
  profiles = [],
  customPets = [],
  teachers,
  subjects = [],
  canUsePlus = false,
  actor,
  onSaved,
}) {
  const [form, setForm] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const locked = !!raffle && raffle.status !== RAFFLE_STATUS.DRAFT;

  useEffect(() => {
    if (!open) return;
    if (raffle) {
      setForm({
        title: raffle.title || '',
        description: raffle.description || '',
        artworkUrl: raffle.artworkUrl || '',
        prizeMode: raffle.prizeMode || 'limited',
        allowMultipleWins: !!raffle.allowMultipleWins,
        prizes: raffle.prizes || [],
        fallbackReward: raffle.fallbackReward || null,
        eligibility: raffle.eligibility || { scope: 'everyone', profileIds: [] },
      });
    } else {
      setForm(emptyDraft());
    }
  }, [open, raffle?.id]);

  const knownPetIds = useMemo(
    () => [...PETS.map((p) => p.id), ...customPets.map((p) => `custom_${p.id}`)],
    [customPets]
  );

  const eligible = useMemo(
    () => buildEntries(resolveEligibleProfiles(profiles, form.eligibility)),
    [profiles, form.eligibility]
  );

  const { errors, warnings } = useMemo(
    () =>
      validateRaffle({
        prizes: form.prizes,
        prizeMode: form.prizeMode,
        allowMultipleWins: form.allowMultipleWins,
        participantCount: eligible.length,
        fallbackReward: form.fallbackReward,
        knownPetIds,
      }),
    [form, eligible.length, knownPetIds]
  );

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const uploadArtwork = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      set({ artworkUrl: res.file_url || '' });
      toast.success('Artwork uploaded');
    } catch (e) {
      console.error(e);
      toast.error('Could not upload that image');
    }
    setUploading(false);
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Give the raffle a title');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        artworkUrl: form.artworkUrl.trim(),
        prizeMode: form.prizeMode,
        allowMultipleWins: form.allowMultipleWins,
        prizes: form.prizes,
        fallbackReward: form.fallbackReward,
        eligibility: form.eligibility,
        createdBy: actor || raffle?.createdBy || 'admin',
      };
      const saved = raffle ? await updateRaffle(raffle.id, payload) : await createRaffle(payload);
      toast.success(raffle ? 'Raffle saved' : 'Raffle created as a draft');
      onSaved?.(saved);
      onClose?.();
    } catch (e) {
      console.error(e);
      toast.error('Could not save the raffle');
    }
    setSaving(false);
  };

  const duplicate = async () => {
    setSaving(true);
    try {
      const copy = await createRaffle({
        ...form,
        title: `${form.title} (copy)`,
        createdBy: actor || 'admin',
      });
      toast.success('Copied into a new draft');
      onSaved?.(copy);
      onClose?.();
    } catch (e) {
      console.error(e);
      toast.error('Could not copy the raffle');
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{raffle ? (locked ? 'Raffle (locked)' : 'Edit raffle') : 'New raffle'}</DialogTitle>
        </DialogHeader>

        {locked && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 text-sm text-amber-200">
            Entries for this raffle are frozen, so its prizes and eligibility cannot change — a saved winner must
            keep the prize they were drawn for. Use <strong>Copy to a new draft</strong> if you need a version with
            different prizes or students.
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
                disabled={locked}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Prize mode</Label>
              <Select value={form.prizeMode} onValueChange={(v) => set({ prizeMode: v })} disabled={locked}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIZE_MODES.map((m) => (
                    <SelectItem key={m.key} value={m.key}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            {PRIZE_MODES.find((m) => m.key === form.prizeMode)?.description}
          </p>

          <div className="space-y-2">
            <Label className="text-slate-300">Description (optional)</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              disabled={locked}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="What is this raffle for?"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Artwork (optional)</Label>
            <div className="flex gap-2">
              <Input
                value={form.artworkUrl}
                onChange={(e) => set({ artworkUrl: e.target.value })}
                disabled={locked}
                placeholder="Image link"
                className="bg-slate-700 border-slate-600 text-white"
              />
              <label className="shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => uploadArtwork(e.target.files?.[0])}
                  disabled={locked || uploading}
                />
                <Button asChild variant="outline" className="border-slate-600 text-slate-200" disabled={locked || uploading}>
                  <span>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-slate-400">
              Uploaded artwork is stored publicly (anyone with the link can open them) so every student can see it
              without signing in.
            </p>
          </div>

          <div className="flex items-center justify-between bg-slate-800 rounded-xl p-3 border border-slate-700">
            <div>
              <Label className="text-slate-200">A student can win more than once</Label>
              <p className="text-xs text-slate-400">
                Off by default: the draw gives each student at most one drawn prize.
              </p>
            </div>
            <Switch
              checked={form.allowMultipleWins}
              onCheckedChange={(v) => set({ allowMultipleWins: v })}
              disabled={locked}
            />
          </div>

          <RaffleEligibilityFields
            eligibility={form.eligibility}
            onChange={(eligibility) => set({ eligibility })}
            profiles={profiles}
            teachers={teachers}
            subjects={subjects}
          />

          <RafflePrizeEditor
            prizes={form.prizes}
            onChange={(prizes) => set({ prizes })}
            baseReward={form.fallbackReward}
            onBaseChange={(fallbackReward) => set({ fallbackReward })}
            canUsePlus={canUsePlus}
            customPets={customPets}
          />

          {(errors.length > 0 || warnings.length > 0) && (
            <div className="space-y-2">
              {errors.map((e) => (
                <div key={e} className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{e}</span>
                </div>
              ))}
              {warnings.map((w) => (
                <div key={w} className="text-sm text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                  {w}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" className="text-slate-300" onClick={onClose}>
            Close
          </Button>
          {locked ? (
            <Button onClick={duplicate} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              <Copy className="w-4 h-4 mr-1" /> Copy to a new draft
            </Button>
          ) : (
            <Button onClick={save} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : raffle ? 'Save changes' : 'Create draft'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}