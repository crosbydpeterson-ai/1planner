import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Rocket, Save, Sparkles } from 'lucide-react';
import OverviewSection from './OverviewSection';
import RewardBuilder from './RewardBuilder';
import ConnectionsSection from './ConnectionsSection';
import StudentPreview from './StudentPreview';
import PublishChecklist from './PublishChecklist';
import AiSuggestionsSection from './AiSuggestionsSection';

/**
 * Season editor: Overview · Rewards · Connections · Preview & publish, plus an
 * AI tab only for roles with the AI permission. Edits live in the caller's
 * draft, so a failed save keeps everything on screen.
 */
export default function SeasonEditorDialog({
  open, draft, onPatch, onClose, onSaveDraft, onPublish, onSetStatus,
  saving, issues, assets, permissions = {}, claimedCount, titleSuggestions = [], now,
  adminProfile, autoSaving, savedSnapshot, onFlushAutoSave,
}) {
  const [tab, setTab] = useState('overview');
  const [confirmClose, setConfirmClose] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');
  const baseline = useRef(null);

  useEffect(() => {
    if (!open) return;
    setTab('overview');
    setConfirmClose(false);
    setBlockedReason('');
  }, [open]);

  // The baseline is the last stored version, so the badge clears as soon as the
  // auto-save has written the edits.
  useEffect(() => {
    if (!open) return;
    baseline.current = savedSnapshot || JSON.stringify(draft);
  }, [open, savedSnapshot]);

  useEffect(() => {
    if (issues?.errors?.length) setTab('publish');
  }, [issues]);

  if (!open || !draft) return null;

  const dirty = baseline.current !== null && JSON.stringify(draft) !== baseline.current;
  const hasErrors = (issues?.errors?.length || 0) > 0;

  // Closing never loses work: anything still pending is written first, and the
  // admin is only asked when the draft cannot be stored at all.
  const attemptClose = async () => {
    if (saving) return;
    if (dirty) {
      const result = await onFlushAutoSave?.();
      if (result !== 'saved') {
        setBlockedReason(
          result === 'unavailable'
            ? 'Add a season name and dates before this can be saved.'
            : 'The last save did not go through — your edits are still here.'
        );
        setConfirmClose(true);
        return;
      }
    }
    setConfirmClose(false);
    onClose();
  };

  const runSaveDraft = async () => {
    if (await onSaveDraft()) onClose();
  };

  const runPublish = async () => {
    if (await onPublish()) onClose();
  };

  const runStatus = async (status) => {
    if (await onSetStatus(status)) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) attemptClose(); }}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border-slate-700 bg-slate-900 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            {draft.id ? 'Edit season' : 'New season'}
            {autoSaving ? (
              <span className="flex items-center gap-1 rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-sky-300">
                <Loader2 className="h-3 w-3 animate-spin" /> Auto-saving
              </span>
            ) : dirty ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300">Unsaved edits</span>
            ) : savedSnapshot ? (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-300">Auto-saved</span>
            ) : null}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {draft.name || 'Untitled season'} · everything stays hidden from students until you publish.
          </DialogDescription>
        </DialogHeader>

        {hasErrors && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {issues.errors.length} problem{issues.errors.length > 1 ? 's' : ''} to fix before this season can be published. Your edits are kept — see the
              'Preview & publish' tab.
            </span>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex w-full flex-wrap justify-start gap-1 bg-slate-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">Overview</TabsTrigger>
            <TabsTrigger value="rewards" className="data-[state=active]:bg-slate-700">Rewards</TabsTrigger>
            <TabsTrigger value="connections" className="data-[state=active]:bg-slate-700">Connections</TabsTrigger>
            <TabsTrigger value="publish" className="data-[state=active]:bg-slate-700">Preview & publish</TabsTrigger>
            {permissions.accessAI && (
              <TabsTrigger value="ai" className="data-[state=active]:bg-slate-700">
                <Sparkles className="mr-1 h-3 w-3" /> AI
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="pt-4">
            <OverviewSection draft={draft} onPatch={onPatch} now={now} />
          </TabsContent>

          <TabsContent value="rewards" className="pt-4">
            <RewardBuilder draft={draft} onPatch={onPatch} assets={assets} titleSuggestions={titleSuggestions} />
          </TabsContent>

          <TabsContent value="connections" className="pt-4">
            <ConnectionsSection draft={draft} onPatch={onPatch} permissions={permissions} claimedCount={claimedCount} />
          </TabsContent>

          <TabsContent value="publish" className="space-y-4 pt-4">
            <StudentPreview draft={draft} />
            <PublishChecklist
              draft={draft}
              issues={issues}
              status={draft.status}
              saving={saving}
              onSaveDraft={runSaveDraft}
              onPublish={runPublish}
              onSetStatus={runStatus}
              claimedCount={claimedCount}
              canSeeClaims={!!permissions.viewEventAnalytics}
              now={now}
            />
          </TabsContent>

          {permissions.accessAI && (
            <TabsContent value="ai" className="pt-4">
              <AiSuggestionsSection
                draft={draft}
                onPatch={onPatch}
                now={now}
                assets={assets}
                adminProfile={adminProfile}
              />
            </TabsContent>
          )}
        </Tabs>

        <div className="mt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-700 pt-3">
          {confirmClose ? (
            <>
              <span className="mr-auto text-xs text-amber-300">{blockedReason || 'You have unsaved edits.'}</span>
              <Button type="button" variant="ghost" onClick={() => setConfirmClose(false)} className="text-slate-300">
                Keep editing
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="border-red-500/50 text-red-300">
                Discard changes
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="ghost" onClick={attemptClose} disabled={saving} className="mr-auto text-slate-300">
                Close
              </Button>
              <Button type="button" variant="outline" onClick={runSaveDraft} disabled={saving} className="border-slate-600 text-slate-200">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {draft.status === 'live' || draft.status === 'scheduled' ? 'Save changes' : 'Save draft'}
              </Button>
              <Button type="button" onClick={runPublish} disabled={saving} className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
                <Rocket className="mr-2 h-4 w-4" /> Publish
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}