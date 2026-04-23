import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MessageWidget({ currentProfile }) {
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();

  const isAdmin = currentProfile?.rank === 'admin' || currentProfile?.rank === 'super_admin' ||
    currentProfile?.username?.toLowerCase() === 'crosby';

  useEffect(() => {
    if (!currentProfile?.id) return;
    const load = async () => {
      if (isAdmin) {
        const all = await base44.entities.DMThread.list('-lastMessageAt', 200);
        const mine = all.filter(t => t.contactUsername?.toLowerCase() === currentProfile.username?.toLowerCase());
        setUnread(mine.filter(t => t.hasUnreadAdmin).length);
      } else {
        const all = await base44.entities.DMThread.filter({ studentProfileId: currentProfile.id });
        setUnread(all.filter(t => t.hasUnreadStudent).length);
      }
    };
    load();
    const unsub = base44.entities.DMThread.subscribe(() => load());
    return unsub;
  }, [currentProfile?.id, isAdmin]);

  if (!currentProfile) return null;

  return (
    <button
      onClick={() => navigate('/messages')}
      className="fixed top-3 right-3 z-50 relative bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-white transition-colors"
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