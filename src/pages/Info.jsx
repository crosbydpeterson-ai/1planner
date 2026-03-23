import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Info as InfoIcon } from 'lucide-react';
import SubmitFeedbackForms from '@/components/info/SubmitFeedbackForms';
import UpdatesWall from '@/components/info/UpdatesWall';

export default function Info() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const pid = localStorage.getItem('quest_profile_id');
    setProfileId(pid || '');

    const loadData = async () => {
      const promises = [
        base44.entities.Announcement.list('-created_date')
      ];
      if (pid) {
        promises.push(base44.entities.UserProfile.filter({ id: pid }));
      }
      const [allAnnouncements, profiles] = await Promise.all(promises);

      // Only show announcements visible on the info page
      const visible = allAnnouncements.filter(a => 
        a.isActive && (a.visibility === 'info_page' || a.visibility === 'both' || !a.visibility)
      );
      setAnnouncements(visible);

      if (profiles && profiles.length > 0) {
        setUsername(profiles[0].username || '');
      }
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="min-h-screen p-4 pb-24 pt-16">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg">
            <InfoIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Info</h1>
            <p className="text-xs text-slate-500">Updates, bugs, and ideas</p>
          </div>
        </div>

        {/* Feedback Forms */}
        <SubmitFeedbackForms profileId={profileId} username={username} />

        {/* Updates Wall */}
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-3">Latest Updates</h2>
          <UpdatesWall announcements={announcements} loading={loading} />
        </div>
      </div>
    </div>
  );
}