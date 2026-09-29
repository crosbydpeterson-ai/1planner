import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Music2, Lock, Loader2 } from 'lucide-react';
import MusicTrackCard from '@/components/music/MusicTrackCard';
import LockedOverlay from '@/components/common/LockedOverlay';
import { isTrackVisibleForUser } from '@/lib/musicAccess';
import { checkFeatureLock } from '@/lib/featureLocks';

export default function Music() {
  const [profile, setProfile] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locks, setLocks] = useState(null);
  const [lockPageConfig, setLockPageConfig] = useState(null);

  useEffect(() => {
    (async () => {
      const profileId = localStorage.getItem('quest_profile_id');
      if (!profileId) {setLoading(false);return;}
      try {
        const [profiles, allTracks, settings] = await Promise.all([
        base44.entities.UserProfile.filter({ id: profileId }),
        base44.entities.MusicTrack.list('-created_date'),
        base44.entities.AppSetting.list()]
        );
        const p = profiles[0];
        setProfile(p);
        setTracks(allTracks);
        const locksSetting = settings.find((s) => s.key === 'feature_locks');
        setLocks(locksSetting?.value || null);
        const pageSetting = settings.find((s) => s.key === 'lock_page_config');
        setLockPageConfig(pageSetting?.value || null);
      } catch (e) {
        console.error('Music load error', e);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>);

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

  const visible = tracks.filter((t) => t.isActive !== false && isTrackVisibleForUser(t, profile));

  return (
    <div className="min-h-screen pt-20 pb-28 px-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
          <Music2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Study Music</h1>
          <p className="text-sm text-slate-400">Focus tracks curated by your Admin </p>
        </div>
      </div>

      {visible.length === 0 ?
      <div className="text-center py-20 text-slate-400">
          <Music2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>No music available yet. Check back soon!</p>
        </div> :

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {visible.map((t) => <MusicTrackCard key={t.id} track={t} />)}
        </div>
      }
    </div>);

}