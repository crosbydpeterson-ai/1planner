import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import StudentMessages from '@/components/messages/StudentMessages';
import RecipientInbox from '@/components/messages/RecipientInbox';
import SupportInbox from '@/components/messages/SupportInbox';
import { loadContacts } from '@/lib/dmRouting';
import { resolveMessagingAccess } from '@/lib/dmAccess';
import { loadSupportAdmins } from '@/lib/byteSupport';

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
  const [tab, setTab] = useState('mine'); // 'inbox' | 'mine' | 'support'
  const [supportAdminIds, setSupportAdminIds] = useState([]);

  useEffect(() => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) { setLoading(false); return; }
    (async () => {
      try {
        const profiles = await base44.entities.UserProfile.filter({ id: profileId });
        const profile = profiles[0] || null;
        setCurrentProfile(profile);
        if (profile) {
          const [contacts, admins] = await Promise.all([loadContacts(), loadSupportAdmins()]);
          const resolved = await resolveMessagingAccess(profile, contacts);
          setAccess(resolved);
          setSupportAdminIds(admins.profileIds);
          // A support admin who is not a contact recipient opens straight into the
          // requests they are responsible for.
          setTab(
            resolved.hasRecipientInbox
              ? 'inbox'
              : admins.profileIds.includes(String(profile.id))
              ? 'support'
              : 'mine'
          );
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

  const isSupport = !!currentProfile && supportAdminIds.includes(String(currentProfile.id));
  const showTabs = !!access?.hasRecipientInbox || isSupport;
  const activeTab = showTabs ? tab : 'mine';

  // Frosted pill tabs, matching the glass treatment used across the rest of the app.
  const tabClass = (active) => cn(
    'flex-1 text-xs font-semibold py-2 rounded-full backdrop-blur-xl border transition-colors',
    active
      ? 'bg-blue-500/80 text-white border-white/30 shadow-lg'
      : 'bg-white/20 text-slate-600 border-white/30 hover:bg-white/30'
  );

  // Left transparent so the app's themed background shows through the glass panels.
  return (
    <div className="min-h-screen pt-16 pb-24 px-4">
      {showTabs && (
        <div className="max-w-md mx-auto mb-4 flex gap-2 p-1 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg">
          {access?.hasRecipientInbox && (
            <button onClick={() => setTab('inbox')} className={tabClass(activeTab === 'inbox')}>
              Inbox
            </button>
          )}
          <button onClick={() => setTab('mine')} className={tabClass(activeTab === 'mine')}>
            My messages
          </button>
          {isSupport && (
            <button onClick={() => setTab('support')} className={tabClass(activeTab === 'support')}>
              Escalated from Byte
            </button>
          )}
        </div>
      )}

      {error && (
        <p className="max-w-md mx-auto mb-3 text-xs text-red-600 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
      )}

      {activeTab === 'support' ? (
        <SupportInbox currentProfile={currentProfile} supportAdminIds={supportAdminIds} />
      ) : activeTab === 'inbox' ? (
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