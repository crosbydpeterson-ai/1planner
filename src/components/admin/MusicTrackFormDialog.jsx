import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, Link2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function MusicTrackFormDialog({ open, onOpenChange, track, adminProfile, onSaved }) {
  const [form, setForm] = useState({ title: '', description: '', sourceType: 'upload', youtubeUrl: '', isActive: true });
  const [audioUri, setAudioUri] = useState('');
  const [coverUri, setCoverUri] = useState('');
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        title: track?.title || '',
        description: track?.description || '',
        sourceType: track?.sourceType || 'upload',
        youtubeUrl: track?.youtubeUrl || '',
        isActive: track?.isActive !== false,
      });
      setAudioUri(track?.audioFileUri || '');
      setCoverUri(track?.coverImageUri || '');
    }
  }, [open, track]);

  const handleAudio = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setAudioUri(file_uri);
      toast.success('Audio uploaded');
    } catch (err) { toast.error('Audio upload failed'); }
    setUploadingAudio(false);
    e.target.value = '';
  };

  const handleCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setCoverUri(file_uri);
      toast.success('Cover uploaded');
    } catch (err) { toast.error('Cover upload failed'); }
    setUploadingCover(false);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Please enter a title'); return; }
    if (form.sourceType === 'upload' && !audioUri) { toast.error('Please upload an audio file'); return; }
    if (form.sourceType === 'youtube' && !form.youtubeUrl.trim()) { toast.error('Please paste a YouTube URL'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        sourceType: form.sourceType,
        audioFileUri: form.sourceType === 'upload' ? audioUri : null,
        youtubeUrl: form.sourceType === 'youtube' ? form.youtubeUrl.trim() : null,
        coverImageUri: coverUri || null,
        isActive: form.isActive,
        createdBy: adminProfile?.username || 'admin',
      };
      let saved;
      if (track) {
        saved = await base44.entities.MusicTrack.update(track.id, payload);
      } else {
        saved = await base44.entities.MusicTrack.create({ ...payload, assignedProfileIds: [], lockedProfileIds: [], lockedClassKeys: [] });
      }
      onSaved(saved);
      toast.success(track ? 'Track updated' : 'Track created');
      onOpenChange(false);
    } catch (e) {
      toast.error('Save failed');
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{track ? 'Edit Track' : 'New Study Track'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lo-fi Focus Beat" />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={form.sourceType === 'upload' ? 'default' : 'outline'} onClick={() => setForm({ ...form, sourceType: 'upload' })} className={form.sourceType === 'upload' ? 'bg-indigo-600' : ''}>
                <Upload className="w-4 h-4 mr-1" />Upload audio
              </Button>
              <Button size="sm" variant={form.sourceType === 'youtube' ? 'default' : 'outline'} onClick={() => setForm({ ...form, sourceType: 'youtube' })} className={form.sourceType === 'youtube' ? 'bg-red-600' : ''}>
                <Link2 className="w-4 h-4 mr-1" />YouTube link
              </Button>
            </div>
          </div>
          {form.sourceType === 'upload' ? (
            <div className="space-y-2">
              <Label>Audio file (mp3, wav, m4a…)</Label>
              <input type="file" accept="audio/*" onChange={handleAudio} className="text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700" />
              {uploadingAudio && <p className="text-xs text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Uploading…</p>}
              {audioUri && !uploadingAudio && <p className="text-xs text-emerald-600">Audio ready ✓</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" />
            </div>
          )}
          <div className="space-y-2">
            <Label>Cover image (square)</Label>
            <input type="file" accept="image/*" onChange={handleCover} className="text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700" />
            {uploadingCover && <p className="text-xs text-slate-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Uploading…</p>}
            {coverUri && !uploadingCover && <p className="text-xs text-emerald-600 flex items-center gap-1"><ImageIcon className="w-3 h-3" />Cover ready</p>}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
            <span className="text-sm text-slate-600">Active (visible to students)</span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || uploadingAudio || uploadingCover}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            {track ? 'Save changes' : 'Create track'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}