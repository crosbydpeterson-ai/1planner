import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import StudentMessages from '@/components/messages/StudentMessages';
import RecipientInbox from '@/components/messages/RecipientInbox';
import { loadContacts } from '@/lib/dmRouting';
import { resolveMessagingAccess } from '@/lib/dmAccess';

/**
 * Messages page.
 *
 * A profile can be a student, a linked contact recipient, or both. A recipient
 * gets the inbox of conversations addressed to them; the student side stays
 * available as its own tab so neither replaces the other.
 */
export default function MessagesPage() {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('mine'); // 'inbox' | 'mine'

  useEffect(() => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) { setLoading(false); return; }
    (async () => {
      try {
        const profiles = await base44.entities.UserProfile.filter({ id: profileId });
        const profile = profiles[0] || null;
        setCurrentProfile(profile);
        if (profile) {
          const contacts = await loadContacts();
          const resolved = await resolveMessagingAccess(profile, contacts);
          setAccess(resolved);
          setTab(resolved.hasRecipientInbox ? 'inbox' : 'mine');
        }
      } catch (err) {
        console.error('Could not resolve messaging access', err);
        setError('Could not load your messages. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!currentProfile) {
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">No profile found</div>;
  }

  const showTabs = !!access?.hasRecipientInbox;
  const activeTab = showTabs ? tab : 'mine';

  return (
    <div className={cn('min-h-screen pt-16 pb-24 px-4', activeTab === 'inbox' ? 'bg-slate-900' : 'bg-slate-50')}>
      {showTabs && (
        <div className="max-w-md mx-auto mb-4 flex gap-2 px-1">
          <button
            onClick={() => setTab('inbox')}
            className={cn('flex-1 text-xs font-semibold py-2 rounded-full transition-colors', activeTab === 'inbox' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700')}
          >
            Inbox
          </button>
          <button
            onClick={() => setTab('mine')}
            className={cn('flex-1 text-xs font-semibold py-2 rounded-full transition-colors', activeTab === 'mine' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700')}
          >
            My messages
          </button>
        </div>
      )}

      {error && (
        <p className="max-w-md mx-auto mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {activeTab === 'inbox' ? (
        <RecipientInbox
          currentProfile={currentProfile}
          canManage={!!access?.canUseFullInbox}
          canGift={!!access?.canUseFullInbox}
        />
      ) : (
        <StudentMessages currentProfile={currentProfile} />
      )}
    </div>
  );
}