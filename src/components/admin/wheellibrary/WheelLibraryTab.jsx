import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Wand2, Edit2, Copy, Eye, Trash2, Archive, RotateCcw, Zap, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import WheelPreview from './WheelPreview';
import WheelEditorDialog from './WheelEditorDialog';
import WheelAIDialog from './WheelAIDialog';
import { getWheelTheme } from '@/components/wheellibrary/WheelThemeCatalog';
import {
  fetchAllWheelPresets,
  migrateExistingWheelConfig,
  getWheelStatusLabel,
  formatChicagoDateTime,
  detectConflicts,
} from '@/lib/wheelLibrary';

const DEST_LABELS = { daily: 'Daily', bonus: 'Bonus', both: 'Daily + Bonus' };

/**
 * Wheel Library Tab — admin container for managing saved spin wheels.
 * Shows Active, Scheduled, and Stored sections with full CRUD.
 */
export default function WheelLibraryTab({ adminUsername }) {
  const [presets, setPresets] = useState([]);
  const [allPets, setAllPets] = useState([]);
  const [allThemes, setAllThemes] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const [allPlaylists, setAllPlaylists] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [aiDraft, setAiDraft] = useState(null);
  const [previewPreset, setPreviewPreset] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [migrating, setMigrating] = useState(false);

  const loadPresets = useCallback(async () => {
    try {
      const rows = await fetchAllWheelPresets();
      setPresets(rows);
    } catch (e) {
      console.error('Failed to load presets', e);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [customPets, customThemes, allSeasons, settings, musicTracks, playlists] = await Promise.all([
          base44.entities.CustomPet.list('-created_date'),
          base44.entities.CustomTheme.list('-created_date'),
          base44.entities.Season.list('-created_date'),
          base44.entities.AppSetting.list(),
          base44.entities.MusicTrack.list('-created_date'),
          base44.entities.Playlist.list('-created_date'),
        ]);

        const builtInPets = PETS.map(p => ({ id: p.id, name: p.name, emoji: p.emoji }));
        const customPetList = customPets.map(p => ({ id: `custom_${p.id}`, name: p.name, emoji: p.emoji || '🐾' }));
        setAllPets([...builtInPets, ...customPetList]);

        const builtInThemes = THEMES.map(t => ({ id: t.id, name: t.name }));
        const customThemeList = customThemes.map(t => ({ id: `custom_${t.id}`, name: t.name }));
        setAllThemes([...builtInThemes, ...customThemeList]);

        setSeasons(allSeasons);

        setAllSongs(musicTracks.map(t => ({ id: t.id, title: t.title })));
        setAllPlaylists(playlists.map(p => ({ id: p.id, name: p.name })));

        // Migration: if no presets exist, migrate from existing wheel config
        const existingPresets = await fetchAllWheelPresets();
        if (existingPresets.length === 0) {
          const drSetting = settings.find(s => s.key === 'daily_rewards_config');
          const existingWheel = drSetting?.value?.wheel;
          if (existingWheel && existingWheel.prizes && existingWheel.prizes.length > 0) {
            setMigrating(true);
            try {
              await migrateExistingWheelConfig(existingWheel, adminUsername);
              toast.success('Migrated existing wheel to library');
            } catch (e) {
              console.error('Migration failed', e);
            }
            setMigrating(false);
          }
        }

        await loadPresets();
      } catch (e) {
        console.error('Failed to load wheel library', e);
      }
      setLoading(false);
    })();
  }, [adminUsername, loadPresets]);

  const refresh = async () => {
    await loadPresets();
  };

  const handleSaved = async (saved) => {
    await refresh();
    setEditingPreset(null);
    setAiDraft(null);
  };

  const openNew = () => {
    setEditingPreset(null);
    setAiDraft(null);
    setEditorOpen(true);
  };

  const openEdit = (preset) => {
    setEditingPreset(preset);
    setAiDraft(null);
    setEditorOpen(true);
  };

  const openAIDraft = (draft) => {
    setAiDraft(draft);
    setEditingPreset(null);
    setAiOpen(false);
    setEditorOpen(true);
  };

  const duplicate = async (preset) => {
    try {
      const copy = {
        ...preset,
        name: `${preset.name} (Copy)`,
        status: 'draft',
        isFallback: false,
        version: 1,
        startDate: null,
        endDate: null,
      };
      delete copy.id;
      delete copy.created_date;
      delete copy.updated_date;
      const created = await base44.entities.SpinWheelPreset.create(copy);
      toast.success('Wheel duplicated');
      await refresh();
    } catch (e) {
      toast.error('Failed to duplicate');
    }
  };

  const activateNow = async (preset) => {
    // Check conflicts before activating
    const conflicts = detectConflicts(presets, preset.destination, preset.id);
    if (conflicts.length > 0 && !preset.isFallback) {
      const names = conflicts.map(c => `"${c.a.name}" ↔ "${c.b.name}"`).join(', ');
      toast.error(`Conflict: ${names}. Store the other wheel first.`);
      return;
    }
    try {
      await base44.entities.SpinWheelPreset.update(preset.id, {
        status: 'active',
        version: (preset.version || 1) + 1,
        startDate: null,
        endDate: null,
      });
      toast.success('Wheel activated!');
      await refresh();
    } catch (e) {
      toast.error('Failed to activate');
    }
  };

  const storeWheel = async (preset) => {
    try {
      await base44.entities.SpinWheelPreset.update(preset.id, {
        status: 'stored',
        version: (preset.version || 1) + 1,
      });
      toast.success('Wheel stored (preserved, inactive)');
      await refresh();
    } catch (e) {
      toast.error('Failed to store wheel');
    }
  };

  const restoreFromStorage = async (preset) => {
    // Restoring from storage sets to draft — does NOT reactivate an expired schedule
    try {
      await base44.entities.SpinWheelPreset.update(preset.id, {
        status: 'draft',
        version: (preset.version || 1) + 1,
      });
      toast.success('Restored from storage — set to draft. Activate or schedule to use it.');
      await refresh();
    } catch (e) {
      toast.error('Failed to restore');
    }
  };

  const archiveWheel = async (preset) => {
    try {
      await base44.entities.SpinWheelPreset.update(preset.id, {
        status: 'archived',
        version: (preset.version || 1) + 1,
      });
      toast.success('Wheel archived');
      await refresh();
    } catch (e) {
      toast.error('Failed to archive');
    }
  };

  // Group presets by status
  const activeWheels = presets.filter(p => p.status === 'active' || (p.status === 'scheduled' && isScheduledLive(p)));
  const scheduledWheels = presets.filter(p => p.status === 'scheduled' && !isScheduledLive(p));
  const storedWheels = presets.filter(p => p.status === 'stored' || p.status === 'draft');

  // Detect conflicts for display
  const allConflicts = detectConflicts(presets, 'daily').concat(detectConflicts(presets, 'bonus'));

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading wheel library…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">🎡 Wheel Library</h3>
          <p className="text-sm text-slate-400 mt-0.5">Create, schedule, and store spin wheels for daily rewards and bonus spins.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openNew} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4 mr-1" /> Create Wheel</Button>
          <Button onClick={() => setAiOpen(true)} className="bg-purple-600 hover:bg-purple-700"><Wand2 className="w-4 h-4 mr-1" /> Create with AI</Button>
        </div>
      </div>

      {migrating && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Migrating existing wheel configuration to library…
        </div>
      )}

      {/* Conflicts banner */}
      {allConflicts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm text-amber-300">
          <div className="flex items-center gap-2 font-semibold mb-1"><AlertCircle className="w-4 h-4" /> Active conflicts detected:</div>
          <ul className="list-disc list-inside space-y-0.5">
            {allConflicts.map((c, i) => <li key={i}>"{c.a.name}" ↔ "{c.b.name}" — {c.reason}</li>)}
          </ul>
          <p className="text-xs mt-1">Resolve by storing or changing the destination of one wheel.</p>
        </div>
      )}

      {/* Active section */}
      <WheelSection
        title="Active"
        icon={Zap}
        iconColor="text-emerald-400"
        wheels={activeWheels}
        seasons={seasons}
        onEdit={openEdit}
        onDuplicate={duplicate}
        onPreview={setPreviewPreset}
        onStore={storeWheel}
        onArchive={archiveWheel}
        onActivate={activateNow}
        emptyMessage="No active wheels. Activate a wheel or set a fallback to show it to students."
      />

      {/* Scheduled section */}
      <WheelSection
        title="Scheduled"
        icon={CheckCircle2}
        iconColor="text-amber-400"
        wheels={scheduledWheels}
        seasons={seasons}
        onEdit={openEdit}
        onDuplicate={duplicate}
        onPreview={setPreviewPreset}
        onStore={storeWheel}
        onArchive={archiveWheel}
        onActivate={activateNow}
        emptyMessage="No scheduled wheels. Schedule a wheel with start/end dates to auto-activate."
      />

      {/* Stored section */}
      <WheelSection
        title="Stored & Drafts"
        icon={Archive}
        iconColor="text-slate-400"
        wheels={storedWheels}
        seasons={seasons}
        onEdit={openEdit}
        onDuplicate={duplicate}
        onPreview={setPreviewPreset}
        onStore={storeWheel}
        onArchive={archiveWheel}
        onActivate={activateNow}
        onRestore={restoreFromStorage}
        emptyMessage="No stored wheels. Stored wheels are inactive presets that keep all their settings."
      />

      {/* Editor Dialog */}
      <WheelEditorDialog
        open={editorOpen}
        onOpenChange={(open) => { setEditorOpen(open); if (!open) { setEditingPreset(null); setAiDraft(null); } }}
        preset={editingPreset}
        draft={aiDraft}
        allPets={allPets}
        allThemes={allThemes}
        allSeasons={seasons}
        allSongs={allSongs}
        allPlaylists={allPlaylists}
        allPresets={presets}
        adminUsername={adminUsername}
        onSaved={handleSaved}
      />

      {/* AI Dialog */}
      <WheelAIDialog
        open={aiOpen}
        onOpenChange={setAiOpen}
        allPets={allPets}
        allThemes={allThemes}
        allSongs={allSongs}
        allPlaylists={allPlaylists}
        onDraftReady={openAIDraft}
      />

      {/* Preview Dialog */}
      <Dialog open={!!previewPreset} onOpenChange={() => setPreviewPreset(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Preview: {previewPreset?.name}</DialogTitle>
          </DialogHeader>
          {previewPreset && (
            <div className="flex flex-col items-center py-4">
              <WheelPreview prizes={previewPreset.prizes || []} colors={previewPreset.colors} wheelTheme={previewPreset.wheelTheme} size={240} />
              <div className="mt-4 w-full space-y-1">
                <p className="text-sm text-slate-300"><strong>Destination:</strong> {DEST_LABELS[previewPreset.destination]}</p>
                {previewPreset.startDate && (
                  <p className="text-sm text-slate-300"><strong>Schedule:</strong> {formatChicagoDateTime(previewPreset.startDate)} → {formatChicagoDateTime(previewPreset.endDate)}</p>
                )}
                <p className="text-sm text-slate-300"><strong>Prizes:</strong> {previewPreset.prizes?.length || 0}</p>
                {previewPreset.isFallback && <p className="text-sm text-amber-400">⭐ Fallback wheel</p>}
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">Preview only — no rewards are awarded.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPreviewPreset(null)}>Close</Button>
            <Button onClick={() => { openEdit(previewPreset); setPreviewPreset(null); }} className="bg-slate-700"><Edit2 className="w-4 h-4 mr-1" /> Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-400" /> Archive Wheel?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-300 py-3">
            Are you sure you want to archive <strong>"{deleteTarget?.name}"</strong>? This removes it from active use but preserves the record. You can recreate it by duplicating from the archive.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => { archiveWheel(deleteTarget); setDeleteTarget(null); }}>Archive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper: check if a scheduled wheel is currently live
function isScheduledLive(preset) {
  if (preset.status !== 'scheduled') return false;
  if (!preset.startDate || !preset.endDate) return false;
  const now = new Date();
  return now >= new Date(preset.startDate) && now <= new Date(preset.endDate);
}

// ─── Wheel Section Component ───

function WheelSection({ title, icon: Icon, iconColor, wheels, seasons, onEdit, onDuplicate, onPreview, onStore, onArchive, onActivate, onRestore, emptyMessage }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h4 className="text-white font-medium text-sm uppercase tracking-wide">{title} ({wheels.length})</h4>
      </div>
      {wheels.length === 0 ? (
        <p className="text-sm text-slate-500 bg-slate-900 rounded-lg p-3 border border-slate-700">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {wheels.map(w => (
            <WheelCard
              key={w.id}
              wheel={w}
              seasons={seasons}
              onEdit={() => onEdit(w)}
              onDuplicate={() => onDuplicate(w)}
              onPreview={() => onPreview(w)}
              onStore={() => onStore(w)}
              onArchive={() => onArchive(w)}
              onActivate={() => onActivate(w)}
              onRestore={() => onRestore?.(w)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Wheel Card Component ───

function WheelCard({ wheel, seasons, onEdit, onDuplicate, onPreview, onStore, onArchive, onActivate, onRestore }) {
  const statusLabel = getWheelStatusLabel(wheel, seasons);
  const season = wheel.seasonId ? seasons.find(s => s.id === wheel.seasonId) : null;
  const isStored = wheel.status === 'stored';
  const isDraft = wheel.status === 'draft';

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h5 className="text-white font-medium truncate">{wheel.name}</h5>
          {wheel.description && <p className="text-xs text-slate-400 truncate">{wheel.description}</p>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${
          wheel.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
          wheel.status === 'scheduled' ? 'bg-amber-500/20 text-amber-400' :
          wheel.status === 'stored' ? 'bg-slate-500/20 text-slate-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>{statusLabel}</span>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>📍 {DEST_LABELS[wheel.destination]}</span>
        <span>🎁 {wheel.prizes?.length || 0} prizes</span>
        {(() => { const t = getWheelTheme(wheel.wheelTheme); return <span>{t.emoji} {t.name}</span>; })()}
        {wheel.isFallback && <span className="text-amber-400">⭐ Fallback</span>}
      </div>

      {season && (
        <p className="text-xs text-slate-400">📅 {season.name}{wheel.followSeasonDates ? ' (follows dates)' : ''}</p>
      )}

      {wheel.startDate && wheel.endDate && !wheel.followSeasonDates && (
        <p className="text-xs text-slate-400">🗓️ {formatChicagoDateTime(wheel.startDate)} → {formatChicagoDateTime(wheel.endDate)}</p>
      )}

      {/* Mini preview */}
      <div className="flex justify-center">
        <WheelPreview prizes={wheel.prizes || []} colors={wheel.colors} wheelTheme={wheel.wheelTheme} size={100} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-7 text-xs" onClick={onPreview}><Eye className="w-3 h-3 mr-1" /> Preview</Button>
        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-7 text-xs" onClick={onEdit}><Edit2 className="w-3 h-3 mr-1" /> Edit</Button>
        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-7 text-xs" onClick={onDuplicate}><Copy className="w-3 h-3 mr-1" /> Copy</Button>
        {(isStored || isDraft) && (
          <Button size="sm" variant="ghost" className="text-emerald-400 hover:text-emerald-300 h-7 text-xs" onClick={onActivate}><Zap className="w-3 h-3 mr-1" /> Activate</Button>
        )}
        {isStored && onRestore && (
          <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 h-7 text-xs" onClick={onRestore}><RotateCcw className="w-3 h-3 mr-1" /> Restore</Button>
        )}
        {(wheel.status === 'active' || wheel.status === 'scheduled') && (
          <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white h-7 text-xs" onClick={onStore}><Archive className="w-3 h-3 mr-1" /> Store</Button>
        )}
        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-7 text-xs" onClick={onArchive}><Trash2 className="w-3 h-3" /></Button>
      </div>
    </div>
  );
}