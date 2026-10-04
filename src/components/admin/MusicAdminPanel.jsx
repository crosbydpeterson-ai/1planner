import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Lock, Music2, ListMusic, Loader2, Search, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import MusicTrackFormDialog from './MusicTrackFormDialog';
import MusicAccessDialog from './MusicAccessDialog';
import SongRequestReviewPanel from './SongRequestReviewPanel';
import PlaylistManagerPanel from './PlaylistManagerPanel';
import { useSignedUrl } from '@/hooks/useSignedUrl';

export default function MusicAdminPanel({ adminProfile, users }) {
  const [tab, setTab] = useState('tracks');
  const [tracks, setTracks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [accessTrack, setAccessTrack] = useState(null);
  const [logFilterUser, setLogFilterUser] = useState('all');
  const [logFilterTrack, setLogFilterTrack] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const [t, l] = await Promise.all([
        base44.entities.MusicTrack.list('-created_date'),
        base44.entities.MusicPlayLog.list('-timestamp', 200),
      ]);
      setTracks(t);
      setLogs(l);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (t) => {
    if (!confirm(`Delete "${t.title}"?`)) return;
    await base44.entities.MusicTrack.delete(t.id);
    setTracks(tracks.filter(x => x.id !== t.id));
    toast.success('Track deleted');
  };

  const filteredLogs = logs.filter(l =>
    (logFilterUser === 'all' || l.profileId === logFilterUser) &&
    (logFilterTrack === 'all' || l.trackId === logFilterTrack)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={tab === 'tracks' ? 'default' : 'outline'} onClick={() => setTab('tracks')} className={tab === 'tracks' ? 'bg-indigo-600' : ''}>
          <Music2 className="w-4 h-4 mr-1" />Tracks ({tracks.length})
        </Button>
        <Button size="sm" variant={tab === 'logs' ? 'default' : 'outline'} onClick={() => setTab('logs')} className={tab === 'logs' ? 'bg-indigo-600' : ''}>
          <ListMusic className="w-4 h-4 mr-1" />Play Logs ({logs.length})
        </Button>
        <Button size="sm" variant={tab === 'requests' ? 'default' : 'outline'} onClick={() => setTab('requests')} className={tab === 'requests' ? 'bg-indigo-600' : ''}>
          <Inbox className="w-4 h-4 mr-1" />Requests
        </Button>
        <Button size="sm" variant={tab === 'playlists' ? 'default' : 'outline'} onClick={() => setTab('playlists')} className={tab === 'playlists' ? 'bg-indigo-600' : ''}>
          <ListMusic className="w-4 h-4 mr-1" />Playlists
        </Button>
      </div>

      {tab === 'tracks' && (
        <div>
          <div className="flex justify-end mb-3">
            <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-indigo-600">
              <Plus className="w-4 h-4 mr-1" />New Track
            </Button>
          </div>
          {loading ? (
            <div className="text-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No tracks yet. Create your first study track!</div>
          ) : (
            <div className="space-y-2">
              {tracks.map(t => <TrackRow key={t.id} track={t} users={users} onEdit={() => { setEditing(t); setShowForm(true); }} onAccess={() => setAccessTrack(t)} onDelete={() => handleDelete(t)} />)}
            </div>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Select value={logFilterUser} onValueChange={setLogFilterUser}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter by student" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={logFilterTrack} onValueChange={setLogFilterTrack}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter by track" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tracks</SelectItem>
                {tracks.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Student</th>
                  <th className="text-left px-3 py-2 font-medium">Track</th>
                  <th className="text-left px-3 py-2 font-medium">Action</th>
                  <th className="text-left px-3 py-2 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-slate-400">No logs yet</td></tr>
                ) : filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{l.username}</td>
                    <td className="px-3 py-2 text-slate-600">{l.trackTitle}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${l.action === 'play' ? 'bg-emerald-100 text-emerald-700' : l.action === 'pause' ? 'bg-slate-100 text-slate-600' : 'bg-indigo-100 text-indigo-700'}`}>{l.action}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-400 text-xs">{l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'requests' && <SongRequestReviewPanel />}

      {tab === 'playlists' && <PlaylistManagerPanel adminProfile={adminProfile} />}

      <MusicTrackFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        track={editing}
        adminProfile={adminProfile}
        onSaved={(saved) => {
          setTracks(prev => {
            const exists = prev.find(x => x.id === saved.id);
            return exists ? prev.map(x => x.id === saved.id ? saved : x) : [saved, ...prev];
          });
        }}
      />
      <MusicAccessDialog
        open={!!accessTrack}
        onOpenChange={(o) => { if (!o) setAccessTrack(null); }}
        track={accessTrack}
        users={users}
        onSaved={(updated) => { setTracks(prev => prev.map(x => x.id === updated.id ? updated : x)); setAccessTrack(null); }}
      />
    </div>
  );
}

function TrackRow({ track, users, onEdit, onAccess, onDelete }) {
  const cover = useSignedUrl(track.coverImageUri);
  const assignedCount = (track.assignedProfileIds || []).length;
  const lockedCount = (track.lockedProfileIds || []).length + (track.lockedClassKeys || []).length;
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center gap-3">
      {cover ? (
        <img src={cover} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white"><Music2 className="w-5 h-5" /></div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-800 text-sm truncate">{track.title}</h3>
        <p className="text-xs text-slate-400">
          {track.sourceType === 'youtube' ? 'YouTube' : 'Upload'}
          {track.isActive === false && ' • Inactive'}
          {assignedCount > 0 && ` • Assigned: ${assignedCount}`}
          {lockedCount > 0 && ` • Locks: ${lockedCount}`}
        </p>
      </div>
      <Button size="sm" variant="ghost" onClick={onAccess} className="text-amber-600" title="Access"><Lock className="w-4 h-4" /></Button>
      <Button size="sm" variant="ghost" onClick={onEdit} className="text-slate-500" title="Edit"><Edit2 className="w-4 h-4" /></Button>
      <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></Button>
    </div>
  );
}