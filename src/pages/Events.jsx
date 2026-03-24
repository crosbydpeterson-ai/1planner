import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import GlobalEventWidget from '@/components/events/GlobalEventWidget';
import { Loader2, Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const [activeEvent, setActiveEvent] = useState(null);

  useEffect(() => {
    base44.entities.GlobalEvent.filter({ isActive: true }).then(events => {
      if (events.length > 0) setActiveEvent(events[0]);
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen -mx-4 -mt-4 pb-20">
      <GlobalEventWidget profile={profile} fullScreen />
      {activeEvent?.theme === 'inventors_fair' && profile && (
        <div className="flex justify-center mt-4 px-4">
          <Link to="/InnovationBazaar">
            <Button className="bg-amber-600 hover:bg-amber-700 gap-2">
              <Cog className="w-4 h-4" /> Visit Innovation Bazaar
            </Button>
          </Link>
        </div>
      )}
      {!profile && (
        <p className="text-center text-white/40 text-sm py-8">Log in to participate in events.</p>
      )}
    </div>
  );
}