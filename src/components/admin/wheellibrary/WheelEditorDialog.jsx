import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import WheelPreview from './WheelPreview';
import { WHEEL_THEMES } from '@/components/wheellibrary/WheelThemeCatalog';
import {
  DEFAULT_COLORS,
  chicagoLocalToISO,
  isoToChicagoLocal,
  validateWheel,
  detectConflicts,
} from '@/lib/wheelLibrary';

const TYPE_ICONS = { xp: '⭐', coins: '🪙', pet: '🐾', theme: '🎨', title: '🏷️', song: '🎵', playlist: '🎶', default: '🎁' };

const DEFAULT_FORM = {
  name: '',
  description: '',
  seasonId: '',
  followSeasonDates: false,
  wheelTheme: 'classic',
  colors: [...DEFAULT_COLORS],
  prizes: [],
  startDate: '',
  endDate: '',
  status: 'draft',
  destination: 'both',
  isFallback: false,
  version: 1,
};

/**
 * Wheel Editor Dialog — create, edit, duplicate, or load an AI draft.
 */
export default function WheelEditorDialog({
  open, onOpenChange, preset, draft, allPets, allThemes, allSeasons, allSongs, allPlaylists, allPresets, adminUsername, onSaved,
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    if (!open) return;
    if (preset) {
      setForm({
        ...DEFAULT_FORM,
        ...preset,
        wheelTheme: preset.wheelTheme || 'classic',
        startDate: preset.startDate ? isoToChicagoLocal(preset.startDate) : '',
        endDate: preset.endDate ? isoToChicagoLocal(preset.endDate) : '',
        colors: preset.colors?.length ? preset.colors : [...DEFAULT_COLORS],
        prizes: (preset.prizes || []).map(p => ({ ...p })),
      });
    } else if (draft) {
      setForm({
        ...DEFAULT_FORM,
        ...draft,
        wheelTheme: draft.wheelTheme || 'classic',
        status: 'draft',
        prizes: (draft.prizes || []).map(p => ({
          ...p,
          color: p.color || '',
          weight: p.weight || 1,
        })),
      });
    } else {
      setForm({ ...DEFAULT_FORM, prizes: [{ type: 'xp', amount: 25, label: '25 XP', icon: '⭐', weight: 3 }] });
    }
    setErrors([]);
  }, [open, preset, draft]);

  const totalWeight = useMemo(
    () => form.prizes.reduce((s, p) => s + Math.max(0, Number(p.weight) || 0), 0),
    [form.prizes]
  );

  const allPetIds = useMemo(() => allPets.map(p => p.id), [allPets]);
  const allThemeIds = useMemo(() => allThemes.map(t => t.id), [allThemes]);
  const allSongIds = useMemo(() => (allSongs || []).map(s => s.id), [allSongs]);
  const allPlaylistIds = useMemo(() => (allPlaylists || []).map(p => p.id), [allPlaylists]);

  useEffect(() => {
    if (form.status === 'stored' || form.status === 'draft' || form.status === 'archived') {
      setConflicts([]);
      return;
    }
    const detected = detectConflicts(allPresets || [], form.destination, preset?.id);
    setConflicts(detected);
  }, [form.status, form.destination, form.startDate, form.endDate, allPresets, preset?.id]);

  const update = (patch) => setForm(f => ({ ...f, ...patch }));

  const updatePrize = (i, patch) => {
    const next = [...form.prizes];
    next[i] = { ...next[i], ...patch };
    if (patch.type && !next[i].label) {
      if (patch.type === 'xp') next[i].label = `+${next[i].amount || 25} XP`;
      else if (patch.type === 'coins') next[i].label = `+${next[i].amount || 50} Coins`;
    }
    if (patch.type === 'xp' || patch.type === 'coins' || patch.type === 'song' || patch.type === 'playlist') {
      next[i].icon = TYPE_ICONS[patch.type] || next[i].icon;
    }
    update({ prizes: next });
  };

  const addPrize = () => {
    update({ prizes: [...form.prizes, { type: 'xp', amount: 25, label: '25 XP', icon: '⭐', weight: 1 }] });
  };

  const removePrize = (i) => {
    update({ prizes: form.prizes.filter((_, j) => j !== i) });
  };

  const movePrize = (i, dir) => {
    const next = [...form.prizes];
    const target = i + dir;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    update({ prizes: next });
  };

  const equalizeWeights = () => {
    const w = form.prizes.length > 0 ? Math.max(1, Math.round(100 / form.prizes.length)) : 1;
    update({ prizes: form.prizes.map(p => ({ ...p, weight: w })) });
  };

  const addColor = () => update({ colors: [...form.colors, '#6366f1'] });
  const removeColor = (i) => update({ colors: form.colors.filter((_, j) => j !== i) });
  const updateColor = (i, val) => {
    const next = [...form.colors];
    next[i] = val;
    update({ colors: next });
  };

  const buildSavePayload = (status) => {
    const payload = {
      wheelTheme: form.wheelTheme || 'classic',
      name: form.name.trim(),
      description: form.description?.trim() || '',
      seasonId: form.seasonId || '',
      followSeasonDates: !!form.followSeasonDates,
      colors: form.colors,
      prizes: form.prizes.map(p => ({
        type: p.type,
        amount: Number(p.amount) || 0,
        value: p.value || '',
        label: p.label || '',
        icon: p.icon || '',
        color: p.color || '',
        weight: Math.max(0, Number(p.weight) || 0),
      })),
      status,
      destination: form.destination,
      isFallback: !!form.isFallback,
      createdBy: form.createdBy || adminUsername || 'admin',
    };

    if (status === 'scheduled' && !form.followSeasonDates) {
      payload.startDate = chicagoLocalToISO(form.startDate);
      payload.endDate = chicagoLocalToISO(form.endDate);
    } else {
      payload.startDate = null;
      payload.endDate = null;
    }

    return payload;
  };

  const save = async (targetStatus) => {
    const testForm = { ...form, status: targetStatus };
    const { valid, errors: validationErrors } = validateWheel(testForm, allPetIds, allThemeIds, allSongIds, allPlaylistIds);
    if (!valid) {
      setErrors(validationErrors);
      toast.error('Please fix the errors before saving');
      return;
    }

    if (targetStatus === 'active' || targetStatus === 'scheduled') {
      const detected = detectConflicts(allPresets || [], form.destination, preset?.id);
      if (detected.length > 0 && !form.isFallback) {
        const names = detected.map(c => `"${c.a.name}" ↔ "${c.b.name}"`).join(', ');
        toast.error(`Conflict detected: ${names}. Resolve before activating.`);
        setConflicts(detected);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = buildSavePayload(targetStatus);
      let saved;
      if (preset?.id) {
        payload.version = (preset.version || 1) + 1;
        saved = await base44.entities.SpinWheelPreset.update(preset.id, payload);
      } else {
        payload.version = 1;
        saved = await base44.entities.SpinWheelPreset.create(payload);
      }
      toast.success(`Wheel ${targetStatus === 'active' ? 'activated' : targetStatus === 'scheduled' ? 'scheduled' : targetStatus === 'stored' ? 'stored' : 'saved'}!`);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to save wheel', e);
      toast.error('Failed to save wheel');
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{preset ? 'Edit Wheel' : draft ? 'Edit AI Draft' : 'Create New Wheel'}</DialogTitle>
        </DialogHeader>

        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300">
            <div className="flex items-center gap-2 font-semibold mb-1"><AlertCircle className="w-4 h-4" /> Validation errors:</div>
            <ul className="list-disc list-inside space-y-0.5">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
            <div className="flex items-center gap-2 font-semibold mb-1"><AlertCircle className="w-4 h-4" /> Scheduling conflicts:</div>
            <ul className="list-disc list-inside space-y-0.5">{conflicts.map((c, i) => <li key={i}>"{c.a.name}" ↔ "{c.b.name}" — {c.reason}</li>)}</ul>
            <p className="text-xs mt-1">Resolve by changing the destination, dates, or storing the other wheel.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Name</Label>
              <Input value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Halloween Wheel" className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Textarea value={form.description} onChange={(e) => update({ description: e.target.value })} placeholder="Optional description" className="bg-slate-700 border-slate-600 min-h-[50px]" />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Wheel Theme</Label>
              <div className="flex flex-wrap gap-1.5">
                {WHEEL_THEMES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => update({ wheelTheme: t.id })}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm border transition-all ${
                      form.wheelTheme === t.id
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span>{t.emoji}</span>
                    <span className="text-xs">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-slate-300">Destination</Label>
                <Select value={form.destination} onValueChange={(v) => update({ destination: v })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">🎁 Daily + Bonus</SelectItem>
                    <SelectItem value="daily">📅 Daily Rewards</SelectItem>
                    <SelectItem value="bonus">🎡 Bonus Spins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Season (optional)</Label>
                <Select value={form.seasonId || 'none'} onValueChange={(v) => update({ seasonId: v === 'none' ? '' : v })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No season</SelectItem>
                    {allSeasons?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.seasonId && (
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={form.followSeasonDates} onChange={(e) => update({ followSeasonDates: e.target.checked })} />
                Follow season dates (uses the season's start/end instead of custom dates)
              </label>
            )}

            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.isFallback} onChange={(e) => update({ isFallback: e.target.checked })} />
              Use as fallback (shown when no other wheel is active)
            </label>

            {!form.followSeasonDates && (
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 space-y-2">
                <Label className="text-slate-300 text-sm">Schedule (America/Chicago)</Label>
                <p className="text-xs text-slate-500">Set dates to schedule this wheel. Leave empty for manual activation.</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-400">Start</Label>
                    <Input type="datetime-local" value={form.startDate} onChange={(e) => update({ startDate: e.target.value })} className="bg-slate-700 border-slate-600 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">End</Label>
                    <Input type="datetime-local" value={form.endDate} onChange={(e) => update({ endDate: e.target.value })} className="bg-slate-700 border-slate-600 text-sm" />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300 text-sm">Segment Colors</Label>
                <Button size="sm" variant="ghost" className="text-slate-400 h-7" onClick={addColor}><Plus className="w-3 h-3" /></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input type="color" value={c} onChange={(e) => updateColor(i, e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-slate-700 border border-slate-600" />
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => removeColor(i)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-300 text-sm">Prizes ({form.prizes.length})</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Weight = relative chance. Higher = more likely.</p>
                </div>
                <div className="flex gap-1.5">
                  {form.prizes.length > 0 && (
                    <Button size="sm" variant="ghost" className="text-slate-400 hover:text-slate-200 h-8" onClick={equalizeWeights}>⚖️ Equalize</Button>
                  )}
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 h-8" onClick={addPrize}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                </div>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {form.prizes.map((p, i) => {
                  const pct = totalWeight > 0 ? Math.round((Math.max(0, Number(p.weight) || 0) / totalWeight) * 100) : 0;
                  const segColor = p.color || (form.colors[i % form.colors.length] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]);
                  return (
                    <div key={i} className="bg-slate-900 rounded-lg p-2.5 border border-slate-700 space-y-2">
                      {p._flagged && (
                        <div className="text-xs text-amber-400 bg-amber-500/10 rounded px-2 py-1">⚠️ {p._flagged}</div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={segColor} onChange={(e) => updatePrize(i, { color: e.target.value })} className="w-6 h-6 rounded cursor-pointer bg-transparent border border-slate-600 flex-shrink-0" />
                        <Input className="bg-slate-700 border-slate-600 h-8 flex-1 text-sm" value={p.label || ''} onChange={(e) => updatePrize(i, { label: e.target.value })} placeholder="Prize label" />
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => movePrize(i, -1)} disabled={i === 0}><ChevronUp className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-slate-400" onClick={() => movePrize(i, 1)} disabled={i === form.prizes.length - 1}><ChevronDown className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={() => removePrize(i)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5">
                        <Select value={p.type} onValueChange={(v) => updatePrize(i, { type: v })}>
                          <SelectTrigger className="bg-slate-700 border-slate-600 h-8 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xp">⭐ XP</SelectItem>
                            <SelectItem value="coins">🪙 Coins</SelectItem>
                            <SelectItem value="pet">🐾 Pet</SelectItem>
                            <SelectItem value="theme">🎨 Theme</SelectItem>
                            <SelectItem value="title">🏷️ Title</SelectItem>
                            <SelectItem value="song">🎵 Song</SelectItem>
                            <SelectItem value="playlist">🎶 Playlist</SelectItem>
                          </SelectContent>
                        </Select>
                        {p.type === 'pet' ? (
                          <Select value={p.value || ''} onValueChange={(v) => updatePrize(i, { value: v })}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 h-8 text-sm"><SelectValue placeholder="Pick pet…" /></SelectTrigger>
                            <SelectContent>
                              {allPets?.map(pet => <SelectItem key={pet.id} value={pet.id}>{pet.emoji || '🐾'} {pet.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : p.type === 'theme' ? (
                          <Select value={p.value || ''} onValueChange={(v) => updatePrize(i, { value: v })}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 h-8 text-sm"><SelectValue placeholder="Pick theme…" /></SelectTrigger>
                            <SelectContent>
                              {allThemes?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : p.type === 'title' ? (
                          <Input className="bg-slate-700 border-slate-600 h-8 text-sm col-span-2" value={p.value || ''} onChange={(e) => updatePrize(i, { value: e.target.value })} placeholder="Title text" />
                        ) : p.type === 'song' ? (
                          <Select value={p.value || ''} onValueChange={(v) => updatePrize(i, { value: v })}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 h-8 text-sm"><SelectValue placeholder="Pick song…" /></SelectTrigger>
                            <SelectContent>
                              {allSongs?.map(s => <SelectItem key={s.id} value={s.id}>🎵 {s.title}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : p.type === 'playlist' ? (
                          <Select value={p.value || ''} onValueChange={(v) => updatePrize(i, { value: v })}>
                            <SelectTrigger className="bg-slate-700 border-slate-600 h-8 text-sm"><SelectValue placeholder="Pick playlist…" /></SelectTrigger>
                            <SelectContent>
                              {allPlaylists?.map(pl => <SelectItem key={pl.id} value={pl.id}>🎶 {pl.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input className="bg-slate-700 border-slate-600 h-8 text-sm" type="number" value={p.amount || ''} onChange={(e) => updatePrize(i, { amount: parseInt(e.target.value) || 0 })} placeholder="Amount" />
                        )}
                        <Input className="bg-slate-700 border-slate-600 h-8 text-sm" value={p.icon || ''} onChange={(e) => updatePrize(i, { icon: e.target.value })} placeholder="Emoji" maxLength={2} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-slate-400 whitespace-nowrap">Weight</Label>
                        <Input className="bg-slate-700 border-slate-600 h-8 w-20 text-sm" type="number" min="0" step="any" value={p.weight || 0} onChange={(e) => updatePrize(i, { weight: parseFloat(e.target.value) || 0 })} />
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full tabular-nums ${totalWeight > 0 ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500'}`}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
                {form.prizes.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No prizes yet. Add one to get started.</p>}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-start pt-4">
            <Label className="text-slate-300 text-sm mb-3">Live Preview</Label>
            <WheelPreview prizes={form.prizes} colors={form.colors} wheelTheme={form.wheelTheme} size={220} />
            {totalWeight > 0 && (
              <p className="text-xs text-slate-400 mt-3">Total weight: {totalWeight} • {form.prizes.length} prizes</p>
            )}
            <div className="mt-4 w-full bg-slate-900 rounded-lg p-3 border border-slate-700">
              <p className="text-xs font-semibold text-slate-400 mb-2">Prize Summary</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {form.prizes.map((p, i) => {
                  const pct = totalWeight > 0 ? Math.round((Math.max(0, Number(p.weight) || 0) / totalWeight) * 100) : 0;
                  const segColor = p.color || (form.colors[i % form.colors.length] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]);
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: segColor }} />
                      <span className="truncate text-slate-300">{p.icon || TYPE_ICONS[p.type] || '🎁'} {p.label || `${p.type}`}</span>
                      <span className="ml-auto font-bold text-slate-400 tabular-nums">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => save('stored')} disabled={saving}>📦 Store</Button>
          <Button variant="outline" className="border-slate-600 text-slate-300" onClick={() => save('draft')} disabled={saving}>Save Draft</Button>
          <Button variant="outline" className="border-amber-600 text-amber-400" onClick={() => save('scheduled')} disabled={saving}>🗓️ Schedule</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => save('active')} disabled={saving}>
            {saving ? 'Saving…' : '✅ Activate Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}