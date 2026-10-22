import React, { useMemo, useState } from 'react';
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

  const patch = (changes) => setDraft((current) => (current ? { ...current, ...changes } : current));
  const closeEditor = () => {
    setDraft(null);
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

  const openCreate = () => {
    setIssues({ errors: [], warnings: [] });
    setDraft(newSeasonDraft(now));
  };

  const openEdit = (season) => {
    setIssues({ errors: [], warnings: [] });
    setDraft(seasonToDraft(season));
  };

  const openDuplicate = (season) => {
    setIssues({ errors: [], warnings: [] });
    setDraft(duplicateSeasonDraft(season));
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