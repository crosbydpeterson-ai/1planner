import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import GlobalEventWidget from '@/components/events/GlobalEventWidget';
import { Loader2 } from 'lucide-react';

export default function Events() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen -mx-4 -mt-4 pb-20">
      <GlobalEventWidget profile={profile} fullScreen />
      {!profile && (
        <p className="text-center text-white/40 text-sm py-8">Log in to participate in events.</p>
      )}
    </div>
  );
}