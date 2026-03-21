import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import GlobalEventWidget from '@/components/events/GlobalEventWidget';
import { Loader2, CalendarHeart } from 'lucide-react';

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-16 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <CalendarHeart className="w-6 h-6 text-indigo-500" />
        <h1 className="text-2xl font-bold text-slate-800">Events</h1>
      </div>

      <GlobalEventWidget profile={profile} />

      {!profile && (
        <p className="text-center text-slate-400 text-sm">Log in to participate in events.</p>
      )}
    </div>
  );
}