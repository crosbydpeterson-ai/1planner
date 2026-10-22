import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Archive, CheckCircle2, Loader2, RefreshCw, Rocket, Save, XCircle } from 'lucide-react';
import { getSeasonWorkflow, PUBLISHED_STATES } from '@/lib/seasonStudio';

const LANE_LABEL = { free: 'Free', plus: '1Pass Plus' };

function ChangeList({ title, tone, items, icon: Icon }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`rounded-2xl border p-3 ${tone === 'error' ? 'border-red-500/40 bg-red-500/10' : 'border-amber-500/40 bg-amber-500/10'}`}>
      <p className={`mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wide ${tone === 'error' ? 'text-red-200' : 'text-amber-200'}`}>
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={index} className={`text-xs ${tone === 'error' ? 'text-red-100' : 'text-amber-100'}`}>
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Publish checks, overlap warnings, and the status actions for a season. */
export default function PublishChecklist({ draft, issues, status, saving, onSaveDraft, onPublish, onSetStatus, claimedCount, canSeeClaims, now }) {
  const workflow = getSeasonWorkflow({ ...draft, status, isActive: PUBLISHED_STATES.includes(status) }, now);
  const errors = issues?.errors || [];
  const warnings = issues?.warnings || [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
        <h4 className="text-sm font-black uppercase tracking-wide text-white">Before students see it</h4>
        <p className="mt-1 text-[11px] text-slate-400">
          Currently <span className="font-bold text-white">{workflow.label}</span>
          {workflow.studentVisible ? ' — students can see it.' : ' — students cannot see it yet.'}
        </p>
        {canSeeClaims && (
          <p className="mt-1 text-[11px] text-slate-400">
            {claimedCount || 0} reward{claimedCount === 1 ? '' : 's'} already claimed in this season.
          </p>
        )}
        {issues?.selectionNote && <p className="mt-2 text-[11px] text-purple-200">{issues.selectionNote}</p>}
      </div>

      <ChangeList title="Must fix before publishing" tone="error" icon={XCircle} items={errors} />
      <ChangeList title="Worth knowing" tone="warning" icon={AlertTriangle} items={warnings} />

      {errors.length === 0 && warnings.length === 0 && (
        <p className="flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4" /> Everything checks out.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onSaveDraft} disabled={saving} className="border-slate-600 text-slate-200">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save draft
        </Button>
        <Button type="button" onClick={onPublish} disabled={saving} className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
          <Rocket className="mr-2 h-4 w-4" /> {status === 'draft' ? 'Publish season' : 'Save and keep published'}
        </Button>
        {status !== 'draft' && status !== 'archived' && (
          <Button type="button" variant="outline" onClick={() => onSetStatus('draft')} disabled={saving} className="border-slate-600 text-slate-300">
            <XCircle className="mr-2 h-4 w-4" /> Unpublish to draft
          </Button>
        )}
        {status !== 'archived' ? (
          <Button type="button" variant="outline" onClick={() => onSetStatus('archived')} disabled={saving} className="border-slate-600 text-slate-300">
            <Archive className="mr-2 h-4 w-4" /> Archive
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={() => onSetStatus('draft')} disabled={saving} className="border-slate-600 text-slate-300">
            <RefreshCw className="mr-2 h-4 w-4" /> Restore to draft
          </Button>
        )}
      </div>

      <p className="text-[11px] text-slate-500">
        Publishing never switches on linked events or wheels — they keep their own dates and go live from their own tools.
      </p>
      {draft.tiers?.some((tier) => (tier.plus || []).length > 0) && (
        <p className="text-[11px] text-slate-500">
          {LANE_LABEL.plus} rewards stay locked for students without Plus and show as an admin gift on their screen.
        </p>
      )}
    </div>
  );
}