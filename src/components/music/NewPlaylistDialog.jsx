import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, ListMusic, Loader2, Search } from 'lucide-react';

/**
 * Make a playlist out of songs the student can already play — the only songs a
 * playlist is allowed to hold. Sharing it to the community happens from the
 * playlist dialog afterwards.
 */
export default function NewPlaylistDialog({ open, onOpenChange, profile, tracks, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const shown = useMemo(
    () => tracks.filter((t) => !search || t.title?.toLowerCase().includes(search.toLowerCase())),
    [tracks, search]
  );

  const reset = () => { setName(''); setDescription(''); setSelected([]); setSearch(''); };
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const save = async () => {
    if (!profile || !name.trim() || selected.length === 0) return;
    setSaving(true);
    const created = await base44.entities.Playlist.create({
      name: name.trim(),
      description: description.trim(),
      trackIds: selected,
      ownerProfileId: profile.id,
      ownerUsername: profile.username,
      isActive: true,
      createdBy: profile.username,
    });
    setSaving(false);
    onCreated(created);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New playlist</DialogTitle>
          <DialogDescription>
            Pick from the songs in your collection — {tracks.length} available.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Playlist name" />
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" />

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your songs" className="pl-9" />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
            {shown.map((t) => {
              const on = selected.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${on ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                >
                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                    {on && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span className="text-sm text-slate-700 flex-1 truncate">{t.title}</span>
                </button>
              );
            })}
            {shown.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No songs match that search.</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim() || selected.length === 0}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListMusic className="w-4 h-4" />}
            Create ({selected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}