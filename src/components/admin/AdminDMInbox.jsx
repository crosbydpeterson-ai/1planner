import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, CheckCheck, Zap, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminDMInbox({ adminProfile }) {
  const [dms, setDms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [replyText, setReplyText] = useState({});
  const [replying, setReplying] = useState({});

  useEffect(() => {
    loadDMs();
  }, []);

  const loadDMs = async () => {
    setLoading(true);
    const all = await base44.entities.DirectMessage.list('-created_date');
    setDms(all);
    setLoading(false);
  };

  const markRead = async (dm) => {
    if (!dm.isRead) {
      await base44.entities.DirectMessage.update(dm.id, { isRead: true });
      setDms(prev => prev.map(d => d.id === dm.id ? { ...d, isRead: true } : d));
    }
  };

  const sendReply = async (dm) => {
    const text = replyText[dm.id]?.trim();
    if (!text) return;
    setReplying(r => ({ ...r, [dm.id]: true }));
    await base44.entities.DirectMessage.update(dm.id, {
      adminReply: text,
      repliedAt: new Date().toISOString(),
      repliedByUsername: adminProfile?.username || 'Admin',
      isRead: true,
    });
    setDms(prev => prev.map(d => d.id === dm.id ? { ...d, adminReply: text, isRead: true, repliedByUsername: adminProfile?.username || 'Admin' } : d));
    setReplyText(r => ({ ...r, [dm.id]: '' }));
    setReplying(r => ({ ...r, [dm.id]: false }));
  };

  const unread = dms.filter(d => !d.isRead).length;

  if (loading) return <div className="text-center py-8 text-slate-400">Loading messages...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-indigo-400" />
        <h3 className="text-white font-semibold">Student DMs</h3>
        {unread > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread} unread</span>
        )}
      </div>

      {dms.length === 0 && (
        <div className="text-center py-10 text-slate-400">No messages yet</div>
      )}

      {dms.map(dm => (
        <div
          key={dm.id}
          className={cn(
            'rounded-xl border overflow-hidden transition-colors',
            !dm.isRead ? 'border-indigo-500/50 bg-indigo-900/20' : 'border-slate-600 bg-slate-700/40'
          )}
        >
          <button
            className="w-full flex items-start gap-3 p-3 text-left"
            onClick={() => {
              setExpandedId(expandedId === dm.id ? null : dm.id);
              markRead(dm);
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-medium text-sm">{dm.fromUsername}</span>
                <span className="text-slate-400 text-xs">→ {dm.toAdminUsername}</span>
                {!dm.isRead && <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />}
                {dm.isEscalated && <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Escalated</span>}
                {dm.adminReply && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1"><CheckCheck className="w-2.5 h-2.5" />Replied</span>}
              </div>
              <p className="text-slate-300 text-sm mt-0.5 truncate">{dm.message}</p>
              <p className="text-slate-500 text-xs mt-0.5">{new Date(dm.created_date).toLocaleString()}</p>
            </div>
            {expandedId === dm.id ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1" />}
          </button>

          {expandedId === dm.id && (
            <div className="border-t border-slate-600 px-4 pb-4 pt-3 space-y-3 bg-slate-800/50">
              <div className="bg-slate-700 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Message from {dm.fromUsername}:</p>
                <p className="text-slate-200 text-sm whitespace-pre-wrap">{dm.message}</p>
              </div>

              {dm.isEscalated && dm.escalationContext && (
                <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-3">
                  <p className="text-xs text-red-400 mb-1 font-semibold">📋 Byte Conversation Context:</p>
                  <p className="text-slate-300 text-xs whitespace-pre-wrap max-h-32 overflow-y-auto">{dm.escalationContext}</p>
                </div>
              )}

              {dm.adminReply ? (
                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3">
                  <p className="text-xs text-emerald-400 mb-1">Your reply ({dm.repliedByUsername}):</p>
                  <p className="text-slate-200 text-sm">{dm.adminReply}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your reply…"
                    value={replyText[dm.id] || ''}
                    onChange={e => setReplyText(r => ({ ...r, [dm.id]: e.target.value }))}
                    rows={3}
                    className="bg-slate-700 border-slate-600 text-white text-sm resize-none"
                  />
                  <Button
                    onClick={() => sendReply(dm)}
                    disabled={replying[dm.id] || !replyText[dm.id]?.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 w-full"
                  >
                    {replying[dm.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : '💬 Send Reply'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}