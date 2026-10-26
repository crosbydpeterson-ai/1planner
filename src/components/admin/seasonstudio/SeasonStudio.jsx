import React, { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { nowInTimezone } from '@/lib/seasonUtils';
import {
  draftToPayload,
  duplicateSeasonDraft,
  newSeasonDraft,
  seasonToDraft,
  statusForDates,
  validateBasics,
  validateForPublish,
} from '@/lib/seasonStudio';
import useSeasonAssets from './useSeasonAssets';
import SeasonLibrary from './SeasonLibrary';
import SeasonEditorDialog from './SeasonEditorDialog';
import StudentPreview from './StudentPreview';

/**
 * Season Studio — one place for the event manager to create, edit, duplicate,
 * preview and publish seasons, with Free + Plus reward building, XP planning
 * and claim-safe publishing.
 */
export default function SeasonStudio({
  seasons = [],
  onSeasonsChange,
  customPets = [],
  customThemes = [],
  adminProfile,
  isSuperAdmin,
  permissions = {},
  seasonClaimIndex = {},
}) {
  const now = useMemo(() => nowInTimezone(), []);
  const assets = useSeasonAssets({ customPets, customThemes });

  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [issues, setIssues] = useState({ errors: [], warnings: [] });
  const [previewSeason, setPreviewSeason] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const autoSaveTimer = useRef(null);
  const draftRef = useRef(null);
  const autoSaveArmed = useRef(false);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const claimCounts = useMemo(() => {
    const counts = {};
    seasons.forEach((season) => {
      const keys = seasonClaimIndex?.[season.id];
      if (keys) counts[season.id] = keys.size;
    });
    return counts;
  }, [seasons, seasonClaimIndex]);

  const titleSuggestions = useMemo(() => {
    const titles = new Set();
    seasons.forEach((season) =>
      (season.rewards || []).forEach((reward) => {
        if (reward.type === 'title' && reward.value) titles.add(String(reward.value));
      })
    );
    return [...titles];
  }, [seasons]);

  // Auto-save only starts once the manager actually changes something, so simply
  // opening a season — or a copy of one — never writes anything by itself.
  const patch = (changes) => {
    autoSaveArmed.current = true;
    setDraft((current) => (current ? { ...current, ...changes } : current));
  };
  const closeEditor = () => {
    autoSaveArmed.current = false;
    clearTimeout(autoSaveTimer.current);
    setDraft(null);
    setSavedSnapshot(null);
    setIssues({ errors: [], warnings: [] });
  };

  const store = async (seasonDraft, status) => {
    const payload = draftToPayload({ ...seasonDraft, status }, status);
    if (seasonDraft.id) {
      const updated = await base44.entities.Season.update(seasonDraft.id, payload);
      onSeasonsChange(seasons.map((season) => (season.id === updated.id ? { ...season, ...payload } : season)));
      return updated;
    }
    const created = await base44.entities.Season.create(payload);
    onSeasonsChange([created, ...seasons]);
    return created;
  };

  const draftStatus = (target) => (target?.status === 'live' || target?.status === 'scheduled' ? target.status : 'draft');

  /** One silent write of the draft, shared by the auto-save and the close-flush. */
  const autoSave = async () => {
    const current = draftRef.current;
    if (!current) return 'unavailable';
    if (validateBasics(current).errors.length) return 'unavailable';
    setAutoSaving(true);
    try {
      const stored = await store(current, draftStatus(current));
      // A new season becomes an editable draft, so the next auto-save updates it
      // instead of creating a second copy of the same season.
      const saved = { ...current, id: current.id || stored.id };
      setDraft((value) => (value ? { ...value, id: saved.id } : value));
      setSavedSnapshot(JSON.stringify(saved));
      return 'saved';
    } catch (e) {
      console.error('Could not auto-save the season', e);
      return 'failed';
    } finally {
      setAutoSaving(false);
    }
  };

  /** Drops the pending timer and writes now — used when the dialog is closing. */
  const flushAutoSave = () => {
    clearTimeout(autoSaveTimer.current);
    if (!autoSaveArmed.current) return Promise.resolve('saved');
    if (savedSnapshot && JSON.stringify(draftRef.current) === savedSnapshot) return Promise.resolve('saved');
    return autoSave();
  };

  useEffect(() => {
    if (!draft || !autoSaveArmed.current) return undefined;
    if (JSON.stringify(draft) === savedSnapshot) return undefined;
    // Nothing storable yet (no name or dates) — the editor keeps it on screen.
    if (validateBasics(draft).errors.length) return undefined;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      autoSave();
    }, 1200);
    return () => clearTimeout(autoSaveTimer.current);
  }, [draft, savedSnapshot]);

  const openCreate = () => {
    setIssues({ errors: [], warnings: [] });
    autoSaveArmed.current = false;
    setSavedSnapshot(null);
    setDraft(newSeasonDraft(now));
  };

  const openEdit = (season) => {
    const next = seasonToDraft(season);
    setIssues({ errors: [], warnings: [] });
    autoSaveArmed.current = false;
    setSavedSnapshot(JSON.stringify(next));
    setDraft(next);
  };

  const openDuplicate = (season) => {
    const next = duplicateSeasonDraft(season);
    setIssues({ errors: [], warnings: [] });
    autoSaveArmed.current = false;
    setSavedSnapshot(JSON.stringify(next));
    setDraft(next);
    toast.info('Copy created as a draft — students never see it until you publish.');
  };

  const saveDraft = async () => {
    const { errors } = validateBasics(draft);
    if (errors.length) {
      setIssues({ errors, warnings: [] });
      toast.error(errors[0]);
      return false;
    }
    // A published season keeps its published state: saving must never quietly
    // hide a live season from students. Unpublishing is an explicit action.
    const targetStatus = draft.status === 'live' || draft.status === 'scheduled' ? draft.status : 'draft';
    setSaving(true);
    try {
      await store(draft, targetStatus);
      toast.success(
        targetStatus === 'draft'
          ? draft.id ? 'Draft saved' : 'Draft created'
          : 'Changes saved — the season stays published'
      );
      setIssues({ errors: [], warnings: [] });
      return true;
    } catch (e) {
      console.error(e);
      setIssues({ errors: [`Could not save: ${e?.message || 'please try again'}. Your edits are still here.`], warnings: [] });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    const original = seasons.find((season) => season.id === draft.id);
    const check = validateForPublish(draft, {
      assets: assets.index,
      allSeasons: seasons,
      now,
      claimedKeys: seasonClaimIndex?.[draft.id] || new Set(),
      originalSeason: original,
    });
    setIssues({ errors: check.errors, warnings: check.warnings, selectionNote: check.selectionNote });
    if (check.errors.length) {
      toast.error(check.errors[0]);
      return false;
    }

    setSaving(true);
    try {
      const status = statusForDates(draft.startDate, now);
      await store(draft, status);
      toast.success(status === 'live' ? 'Season published — students can see it' : 'Season scheduled — it goes live on its start date');
      return true;
    } catch (e) {
      console.error(e);
      setIssues({ errors: [`Could not publish: ${e?.message || 'please try again'}. Your edits are still here.`], warnings: [] });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Status-only write: a season's rewards are never rewritten just to change state.
  const setStatus = async (status) => {
    if (!draft?.id) return false;
    setSaving(true);
    try {
      const isActive = status === 'live' || status === 'scheduled';
      await base44.entities.Season.update(draft.id, { status, isActive });
      onSeasonsChange(seasons.map((season) => (season.id === draft.id ? { ...season, status, isActive } : season)));
      // Keep the draft in step, so a later auto-save can never write the old state back.
      const next = { ...draftRef.current, status };
      setDraft((value) => (value ? { ...value, status } : value));
      setSavedSnapshot(JSON.stringify(next));
      toast.success(status === 'archived' ? 'Season archived' : status === 'draft' ? 'Season moved to draft' : 'Season published');
      return true;
    } catch (e) {
      console.error(e);
      setIssues({ errors: ['Could not change the season status. Please try again.'], warnings: [] });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const removeSeason = async (season) => {
    try {
      await base44.entities.Season.delete(season.id);
      onSeasonsChange(seasons.filter((item) => item.id !== season.id));
      toast.success('Season deleted');
    } catch (e) {
      console.error(e);
      toast.error('Could not delete that season');
    }
  };

  return (
    <div className="space-y-4">
      {adminProfile && assets.loading && <p className="text-xs text-slate-500">Loading rewards assets…</p>}

      <SeasonLibrary
        seasons={seasons}
        now={now}
        claimCounts={claimCounts}
        canDelete={isSuperAdmin || !!permissions.deleteAssets || !!permissions.manageSeasons}
        onCreate={openCreate}
        onEdit={openEdit}
        onDuplicate={openDuplicate}
        onPreview={setPreviewSeason}
        onDelete={removeSeason}
      />

      <SeasonEditorDialog
        open={!!draft}
        draft={draft}
        onPatch={patch}
        onClose={closeEditor}
        onSaveDraft={saveDraft}
        onPublish={publish}
        onSetStatus={setStatus}
        saving={saving}
        issues={issues}
        assets={assets}
        permissions={permissions}
        claimedCount={draft?.id ? claimCounts[draft.id] || 0 : 0}
        titleSuggestions={titleSuggestions}
        now={now}
        adminProfile={adminProfile}
        autoSaving={autoSaving}
        savedSnapshot={savedSnapshot}
        onFlushAutoSave={flushAutoSave}
      />

      <Dialog open={!!previewSeason} onOpenChange={(open) => { if (!open) setPreviewSeason(null); }}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-slate-700 bg-slate-900 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Preview: {previewSeason?.name}</DialogTitle>
          </DialogHeader>
          {previewSeason && <StudentPreview draft={seasonToDraft(previewSeason)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}