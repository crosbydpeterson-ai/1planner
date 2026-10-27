import React from 'react';
import { AlertCircle, Loader2, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

/** One chat bubble, shared by the student view and the recipient inboxes. */
export default function MessageBubble({ msg, isMe, state, onRetry }) {
  const isGift = msg.giftData;
  const isSystem = msg.sender === 'system';

  const bubbleStyle = isGift
    ? { background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff', border: 'none', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }
    : isMe
    ? { background: 'rgba(59,130,246,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(147,197,253,0.3)', color: '#fff', boxShadow: '0 2px 8px rgba(59,130,246,0.25)' }
    : isSystem
    ? { background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)', color: '#92400e', fontStyle: 'italic' }
    : { background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.5)', color: '#1e293b', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };

  return (
    <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
      <div
        className={cn('max-w-[82%] px-3 py-2 text-sm leading-snug', state === 'failed' && 'opacity-90')}
        style={{ borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', ...bubbleStyle }}
      >
        {isGift && <div className="text-lg mb-1">🎁</div>}
        {msg.text || msg.content}
        {isGift && msg.giftData && (
          <div className="mt-1.5 bg-white/20 rounded-lg px-2 py-1 text-xs font-semibold">
            {msg.giftData.type === 'pet' && `🐾 Pet: ${msg.giftData.name}`}
            {msg.giftData.type === 'theme' && `🎨 Theme: ${msg.giftData.name}`}
            {msg.giftData.type === 'coins' && `🪙 ${msg.giftData.amount} Quest Coins`}
            {msg.giftData.type === 'xp' && `⚡ ${msg.giftData.amount} XP`}
            {msg.giftData.type === 'song' && `🎵 Song: ${msg.giftData.name}`}
          </div>
        )}
        <div style={{ fontSize: '10px', marginTop: '2px', opacity: 0.65, color: isMe || isGift ? '#fff' : isSystem ? '#92400e' : '#64748b' }}>
          {msg.senderName || msg.sender} · {new Date(msg.sentAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        {state === 'sending' && (
          <div className="flex items-center gap-1 text-[10px] mt-1 opacity-90">
            <Loader2 className="w-3 h-3 animate-spin" /> Sending…
          </div>
        )}
        {state === 'failed' && (
          <div className="flex items-center gap-2 text-[10px] mt-1 font-semibold">
            <AlertCircle className="w-3 h-3" /> Not sent
            <button onClick={onRetry} className="underline flex items-center gap-0.5">
              <RotateCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}