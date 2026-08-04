import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import GlobalEventWidget from '@/components/events/GlobalEventWidget';
import EventManager from '@/components/events/EventManager';
import { Loader2 } from 'lucide-react';
import LockedOverlay from '@/components/common/LockedOverlay';
import { useFeatureLock } from '@/hooks/useFeatureLock';

export default function Events() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const lockState = useFeatureLock('events');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) { setLoading(false); return; }
    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length > 0) setProfile(profiles[0]);
    } catch (e) {
      console.error('Error loading profile:', e);
    }
    setLoading(false);
  };

  if (loading || lockState.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (lockState.isLocked) return <LockedOverlay featureLabel="Events" message={lockState.message} lockPageConfig={lockState.lockPageConfig} />;

  return (
    <div className="min-h-screen pb-20">
      <GlobalEventWidget profile={profile} fullScreen />
      {!profile && (
        <p className="text-center text-slate-400 text-sm py-8">Log in to participate in events.</p>
      )}
      {profile && <EventManager profile={profile} />}
    </div>
  );
}