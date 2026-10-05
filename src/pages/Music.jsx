import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Music2, Loader2, Plus, ListMusic } from 'lucide-react';
import MusicTrackCard from '@/components/music/MusicTrackCard';
import PlaylistCard from '@/components/music/PlaylistCard';
import PlaylistDialog from '@/components/music/PlaylistDialog';
import LockedOverlay from '@/components/common/LockedOverlay';
import SongRequestDialog from '@/components/music/SongRequestDialog';
import { isTrackVisibleForUser, isPlaylistVisibleForUser, getPlaylistTracks, getUnlockedTrackIds } from '@/lib/musicAccess';
import { checkFeatureLock } from '@/lib/featureLocks';

export default function Music() {
  const [profile, setProfile] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locks, setLocks] = useState(null);
  const [lockPageConfig, setLockPageConfig] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [openPlaylist, setOpenPlaylist] = useState(null);
  const [loadError, setLoadError] = useState(false);

  const loadAll = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) { setLoading(false); return; }
    setLoading(true);
    setLoadError(false);
    try {
      let profiles = null;
      let allTracks = null;
      let allPlaylists = null;
      let settings = null;
      // Retry the entire load up to 3 times — any of these calls can rate-limit
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          [profiles, allTracks, allPlaylists, settings] = await Promise.all([
            base44.entities.UserProfile.filter({ id: profileId }),
            base44.entities.MusicTrack.list('-created_date'),
            base44.entities.Playlist.list('-created_date'),
            base44.entities.AppSetting.list(),
          ]);
          break;
        } catch (rateErr) {
          if (attempt === 2) throw rateErr;
          await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
        }
      }
      const p = profiles?.[0];
      if (!p) { setLoadError(true); setLoading(false); return; }
      setProfile(p);
      setTracks(allTracks || []);
      setPlaylists(allPlaylists || []);
      const locksSetting = settings?.find((s) => s.key === 'feature_locks');
      setLocks(locksSetting?.value || null);
      const pageSetting = settings?.find((s) => s.key === 'lock_page_config');
      setLockPageConfig(pageSetting?.value || null);
    } catch (e) {
      console.error('Music load error', e);
      setLoadError(true);
    }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>);

  }

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <Music2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500 mb-4">Couldn't load music. This is usually a temporary connection issue.</p>
        <button
          onClick={loadAll}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  // Feature lock check
  const lockCheck = checkFeatureLock(locks, profile, 'music');
  if (lockCheck.locked) {
    return (
      <LockedOverlay
        featureLabel="Study Music"
        message={lockCheck.message || 'This feature has been locked by an admin.'}
        lockPageConfig={lockPageConfig}
        featureKey="music" />);


  }

  const unlockedTrackIds = getUnlockedTrackIds(profile, playlists);
  const visible = tracks.filter((t) => t.isActive !== false && isTrackVisibleForUser(t, profile, unlockedTrackIds));
  const visiblePlaylists = playlists.filter((p) => p.isActive !== false && isPlaylistVisibleForUser(p, profile));
  const openPlaylistTracks = openPlaylist
    ? getPlaylistTracks(openPlaylist, tracks).filter((t) => t.isActive !== false && isTrackVisibleForUser(t, profile, unlockedTrackIds))
    : [];

  return (
    <div className="min-h-screen pt-20 pb-28 px-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Music2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Study Music</h1>
          <p className="text-sm text-slate-400">Focus tracks curated by your Admin</p>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowRequest(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Request a song
        </button>
      </div>

      {visiblePlaylists.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ListMusic className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-slate-800">Playlists</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {visiblePlaylists.map((pl) => (
              <PlaylistCard
                key={pl.id}
                playlist={pl}
                trackCount={getPlaylistTracks(pl, tracks).filter((t) => t.isActive !== false && isTrackVisibleForUser(t, profile, unlockedTrackIds)).length}
                onClick={() => setOpenPlaylist(pl)}
              />
            ))}
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold text-slate-800 mb-3">All Songs</h2>
      {visible.length === 0 ?
      <div className="text-center py-20 text-slate-400">
          <Music2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No music available yet. Check back soon!</p>
        </div> :

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {visible.map((t) => <MusicTrackCard key={t.id} track={t} />)}
        </div>
      }

      <PlaylistDialog
        playlist={openPlaylist}
        tracks={openPlaylistTracks}
        open={!!openPlaylist}
        onOpenChange={(o) => { if (!o) setOpenPlaylist(null); }}
      />
      <SongRequestDialog open={showRequest} onOpenChange={setShowRequest} profile={profile} />
    </div>);

}