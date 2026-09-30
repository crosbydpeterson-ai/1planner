import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Type, Mic, Youtube } from 'lucide-react';
import { toast } from 'sonner';
import { parseYouTubeId } from '@/lib/musicPlayerStore';

const TYPES = [
  { key: 'text', label: 'Text', icon: Type, hint: 'Just the song name' },
  { key: 'audio', label: 'Audio', icon: Mic, hint: 'Upload a recording' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, hint: 'Paste a link' },
];

export default function SongRequestDialog({ open, onOpenChange, profile }) {
  const [type, setType] = useState('text');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [note, setNote] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setType('text'); setTitle(''); setArtist(''); setNote(''); setYoutubeUrl(''); setFile(null);
  };

  const canSubmit = () => {
    if (!title.trim()) return false;
    if (type === 'audio' && !file) return false;
    if (type === 'youtube' && !parseYouTubeId(youtubeUrl)) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!profile || !canSubmit()) return;
    setSubmitting(true);
    try {
      let audioFileUri = '';
      if (type === 'audio' && file) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        audioFileUri = file_uri;
      }
      await base44.entities.SongRequest.create({
        requesterProfileId: profile.id,
        requesterUsername: profile.username,
        requestType: type,
        title: title.trim(),
        artist: artist.trim(),
        note: note.trim(),
        audioFileUri,
        youtubeUrl: type === 'youtube' ? youtubeUrl.trim() : '',
        status: 'pending',
        voterProfileIds: [profile.id],
      });
      toast.success('Song request submitted! Admins will review it.');
      reset();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error('Could not submit request. Try again.');
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a song 🎵</DialogTitle>
          <DialogDescription>
            Suggest a song for the study music library. Other students can vote on it in Community, and an admin will review it before it's added.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setType(t.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-all ${type === t.key ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <t.icon className="w-4 h-4" />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <Input placeholder="Song title *" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Artist (optional)" value={artist} onChange={(e) => setArtist(e.target.value)} />

            {type === 'audio' && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Audio recording *</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:font-medium"
                />
                {file && <p className="text-[11px] text-slate-400 mt-1">{file.name}</p>}
              </div>
            )}

            {type === 'youtube' && (
              <Input placeholder="https://youtube.com/watch?v=... *" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
            )}

            <Textarea placeholder="Note for the admin (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !canSubmit()}>
            {submitting ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Submitting...</> : 'Submit request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}