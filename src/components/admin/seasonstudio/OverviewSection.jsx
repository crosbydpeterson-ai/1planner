import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSeasonWorkflow } from '@/lib/seasonStudio';

/** Overview: name, description, dates and artwork. */
export default function OverviewSection({ draft, onPatch, now }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const workflow = getSeasonWorkflow(draft, now);

  const uploadArtwork = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      onPatch({ artworkUrl: file_url });
      toast.success('Artwork uploaded');
    } catch (e) {
      console.error(e);
      toast.error('Could not upload that image');
    }
    setUploading(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-slate-300">Season name</Label>
          <Input
            value={draft.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            placeholder="Winter Festival"
            className="border-slate-600 bg-slate-800 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Status</Label>
          <div className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200">
            {workflow.label}
            <span className="ml-2 text-xs text-slate-400">
              {workflow.studentVisible ? 'students can see this season' : 'hidden from students'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Description</Label>
        <Textarea
          value={draft.description}
          onChange={(e) => onPatch({ description: e.target.value })}
          placeholder="What is this season about? Shown to the event manager."
          className="min-h-[80px] border-slate-600 bg-slate-800 text-white"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-slate-300">Start date</Label>
          <Input type="date" value={draft.startDate} onChange={(e) => onPatch({ startDate: e.target.value })} className="border-slate-600 bg-slate-800 text-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">End date</Label>
          <Input type="date" value={draft.endDate} onChange={(e) => onPatch({ endDate: e.target.value })} className="border-slate-600 bg-slate-800 text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Artwork</Label>
        <div className="flex flex-wrap items-center gap-3">
          {draft.artworkUrl ? (
            <img src={draft.artworkUrl} alt="Season artwork" className="h-20 w-32 rounded-xl border border-slate-600 object-cover" />
          ) : (
            <div className="flex h-20 w-32 items-center justify-center rounded-xl border border-dashed border-slate-600 text-slate-500">
              <ImageIcon className="h-6 w-6" />
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => uploadArtwork(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="border-slate-600 text-slate-200">
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
            {draft.artworkUrl ? 'Replace artwork' : 'Upload artwork'}
          </Button>
          {draft.artworkUrl && (
            <Button type="button" variant="ghost" onClick={() => onPatch({ artworkUrl: '' })} className="text-slate-400 hover:text-red-300">
              <Trash2 className="mr-2 h-4 w-4" /> Remove
            </Button>
          )}
        </div>
        <p className="text-[11px] text-slate-500">
          Optional banner for the student 1Pass page (stored publicly — anyone with the link can open it). Seasons without artwork keep the standard 1Pass backdrop.
        </p>
      </div>
    </div>
  );
}