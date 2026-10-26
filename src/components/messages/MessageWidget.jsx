import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  loadContacts,
  loadRecipientThreads,
  loadStudentThreads,
  recipientContactIds,
  unlinkedNameMatchContactIds,
} from '@/lib/dmRouting';
import { resolveMessagingAccess } from '@/lib/dmAccess';
import { SUPPORT_RESOLVED, isSupportAdmin, loadSupportAdmins, loadSupportThreads, supportStatusOf } from '@/lib/byteSupport';

/**
 * Unread badge.
 *
 * Uses the exact same recipient routing as the inbox (stable ids, no name
 * matching), so the badge and the personal inbox always agree. Recipient and
 * student unread counts are both included because both have their own tab.
 */
export default function MessageWidget({ currentProfile }) {
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const refreshTimer = useRef(null);
  const accessRef = useRef(null);
  const myContactIdsRef = useRef([]);
  const supportAdminIdsRef = useRef([]);
  const supportLoadedRef = useRef(false);

  useEffect(() => {
    if (!currentProfile?.id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const contacts = await loadContacts();
        if (!accessRef.current) accessRef.current = await resolveMessagingAccess(currentProfile, contacts);
        const access = accessRef.current;

        let count = 0;
        if (access.hasRecipientInbox) {
          const verified = recipientContactIds(contacts, currentProfile.id);
          // The owner keeps seeing history on contacts that aren't linked yet.
          const fallback = access.canUseFullInbox ? unlinkedNameMatchContactIds(contacts, currentProfile.username) : [];
          myContactIdsRef.current = [...verified, ...fallback];
          const { threads } = await loadRecipientThreads({
            myProfileId: currentProfile.id,
            verifiedContactIds: verified,
            fallbackContactIds: fallback,
          });
          count += threads.filter((t) => t.hasUnreadAdmin).length;
        }

        const { threads: mine } = await loadStudentThreads(currentProfile.id);
        count += mine.filter((t) => t.hasUnreadStudent).length;

        // Named support admins also carry unread requests escalated from Byte.
        if (!supportLoadedRef.current) {
          const { profileIds } = await loadSupportAdmins();
          supportAdminIdsRef.current = profileIds;
          supportLoadedRef.current = true;
        }
        if (isSupportAdmin(currentProfile, supportAdminIdsRef.current)) {
          const { threads: escalated } = await loadSupportThreads(50);
          count += escalated.filter((t) => t.hasUnreadAdmin && supportStatusOf(t) !== SUPPORT_RESOLVED).length;
        }

        if (!cancelled) setUnread(count);
      } catch (err) {
        console.error('Unread badge could not load', err);
      }
    };

    load();
    const unsub = base44.entities.DMThread.subscribe((event) => {
      const data = event?.data;
      // Ignore changes to conversations that aren't this profile's.
      const relevant = !data
        || String(data.studentProfileId || '') === String(currentProfile.id)
        || String(data.recipientProfileId || '') === String(currentProfile.id)
        || (data.contactId && myContactIdsRef.current.includes(data.contactId))
        || (!!data.isEscalated && isSupportAdmin(currentProfile, supportAdminIdsRef.current));
      if (!relevant) return;
      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(load, 800);
    });

    return () => {
      cancelled = true;
      clearTimeout(refreshTimer.current);
      unsub?.();
    };
  }, [currentProfile?.id]);

  if (!currentProfile) return null;

  return (
    <button
      onClick={() => navigate('/messages')}
      className="fixed top-3 right-3 z-50 bg-white/25 backdrop-blur-xl border border-white/30 shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-white/40 transition-colors"
    >
      <MessageCircle className="w-5 h-5 text-indigo-600" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {unread}
        </span>
      )}
    </button>
  );
}