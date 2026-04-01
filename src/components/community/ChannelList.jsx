import React from 'react';
import { cn } from '@/lib/utils';
import { Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChannelList({ channels, activeChannelId, onSelect, isAdmin, onManage }) {
  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-3 space-y-1">
      <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-100 mb-1">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Channels</h3>
        {isAdmin && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onManage}>
            <Settings className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
      {channels.map((ch) => (
        <button
          key={ch.id}
          onClick={() => onSelect(ch.id)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left",
            activeChannelId === ch.id
              ? "bg-indigo-100 text-indigo-700"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <span className="text-base">{ch.icon || '💬'}</span>
          <span className="truncate">{ch.name}</span>
        </button>
      ))}
      {channels.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-4">No channels yet</p>
      )}
    </div>
  );
}