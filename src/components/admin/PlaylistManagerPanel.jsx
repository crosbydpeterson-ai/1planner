import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, ListMusic, Loader2, Lock, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useSignedUrl } from '@/hooks/useSignedUrl';

export default function PlaylistManagerPanel({ adminProfile }) {
  const [playlists, setPlaylists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, 'new' or playlist object
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pls, trs] = await Promise.all([
        base44.entities.Playlist.list('-created_date'),
        base44.entities.MusicTrack.list('-created_date'),
      ]);
      setPlaylists(pls);
      setTracks(trs);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (pl) => {
    if (!confirm(`Delete playlist "${pl.name}"? The songs inside are not deleted.`)) return;
    await base44.entities.Playlist.delete(pl.id);
    setPlaylists(playlists.filter((x) => x.id !== pl.id));
    toast.success('Playlist deleted');
  };

  return (
    <div>
      <div className="flex justify-end mb-3">
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-indigo-600">
          <Plus className="w-4 h-4 mr-1" />New Playlist
        </Button>
      </div>
      {loading ? (
        <div className="text-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
      ) : playlists.length === 0 ? (
        <div className="text-center py-8 text-slate-400">No playlists yet. Group songs into a playlist students can unlock via 1Pass.</div>
      ) : (
        <div className="space-y-2">
          {playlists.map((pl) => (
            <PlaylistRow key={pl.id} playlist={pl} tracks={tracks} onEdit={() => { setEditing(pl); setShowForm(true); }} onDelete={() => handleDelete(pl)} />
          ))}
        </div>
      )}

      <PlaylistFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        playlist={editing}
        tracks={tracks}
        adminProfile={adminProfile}
        onSaved={(saved) => {
          setPlaylists((prev) => {
            const exists = prev.find((x) => x.id === saved.id);
            return exists ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev];
          });
        }}
      />
    </div>
  );
}

function PlaylistRow({ playlist, tracks, onEdit, onDelete }) {
  const cover = useSignedUrl(playlist.coverImageUri);
  const trackCount = (playlist.trackIds || []).length;
  const trackNames = (playlist.trackIds || [])
    .map((id) => tracks.find((t) => t.id === id)?.title)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
      {cover ? (
        <img src={cover} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white"><ListMusic className="w-5 h-5" /></div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-800 text-sm truncate flex items-center gap-1.5">
          {playlist.name}
          {playlist.isSeasonExclusive && <Lock className="w-3 h-3 text-amber-500" />}
        </h3>
        <p className="text-xs text-slate-400">
          {trackCount} {trackCount === 1 ? 'song' : 'songs'}
          {playlist.isActive === false && ' • Inactive'}
          {trackNames && ` • ${trackNames}${(playlist.trackIds || []).length > 3 ? '…' : ''}`}
        </p>
      </div>
      <Button size="sm" variant="ghost" onClick={onEdit} className="text-slate-500" title="Edit"><Edit2 className="w-4 h-4" /></Button>
      <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></Button>
    </div>
  );
}

function PlaylistFormDialog({ open, onOpenChange, playlist, tracks, adminProfile, onSaved }) {
  const [form, setForm] = useState({ name: '', description: '', isActive: true, isSeasonExclusive: false });
  const [selectedTrackIds, setSelectedTrackIds] = useState([]);
  const [coverUri, setCoverUri] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: playlist?.name || '',
        description: playlist?.description || '',
        isActive: playlist?.isActive !== false,
        isSeasonExclusive: !!playlist?.isSeasonExclusive,
      });
      setSelectedTrackIds(playlist?.trackIds || []);
      setCoverUri(playlist?.coverImageUri || '');
    }
  }, [open, playlist]);

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

  const toggleTrack = (id) => {
    setSelectedTrackIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Please enter a name'); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        trackIds: selectedTrackIds,
        coverImageUri: coverUri || null,
        isActive: form.isActive,
        isSeasonExclusive: form.isSeasonExclusive,
        createdBy: adminProfile?.username || 'admin',
      };
      let saved;
      if (playlist) {
        saved = await base44.entities.Playlist.update(playlist.id, payload);
      } else {
        saved = await base44.entities.Playlist.create(payload);
      }
      onSaved(saved);
      toast.success(playlist ? 'Playlist updated' : 'Playlist created');
      onOpenChange(false);
    } catch (e) {
      toast.error('Save failed');
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{playlist ? 'Edit Playlist' : 'New Playlist'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Focus Beats" />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
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
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={form.isSeasonExclusive} onCheckedChange={(v) => setForm({ ...form, isSeasonExclusive: v })} />
            <span className="text-sm text-slate-600">1Pass exclusive (only unlocked via a 1Pass playlist reward)</span>
          </label>
          <div className="space-y-2">
            <Label>Songs ({selectedTrackIds.length} selected)</Label>
            {tracks.length === 0 ? (
              <p className="text-xs text-slate-400">No tracks exist yet. Create tracks first.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {tracks.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTrackIds.includes(t.id)}
                      onChange={() => toggleTrack(t.id)}
                      className="rounded"
                    />
                    <span className="text-sm text-slate-700 truncate flex-1">{t.title}</span>
                    {t.isSeasonExclusive && <Lock className="w-3 h-3 text-amber-500" />}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || uploadingCover}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            {playlist ? 'Save changes' : 'Create playlist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}