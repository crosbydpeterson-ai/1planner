import React from 'react';
import { cn } from '@/lib/utils';
import { Hash, Settings, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChannelList({ channels, activeChannelId, onSelect, isAdmin, onManage, collapsed, onToggleCollapse }) {
  return (
    <div className={cn(
      "bg-[#2b2d31] flex flex-col h-full transition-all duration-200",
      collapsed ? "w-0 overflow-hidden" : "w-56 min-w-[14rem]"
    )}>
      {/* Server header */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-[#1e1f22] shrink-0">
        <h2 className="text-white font-bold text-sm truncate">Community Wall</h2>
        <div className="flex items-center gap-0.5">
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#b5bac1] hover:text-white hover:bg-[#35373c]" onClick={onManage}>
              <Settings className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        <p className="text-[10px] font-bold text-[#949ba4] uppercase tracking-wider px-1.5 pb-1 pt-2">Channels</p>
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onSelect(ch.id)}
            className={cn(
              "w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm transition-all text-left group",
              activeChannelId === ch.id
                ? "bg-[#404249] text-white"
                : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"
            )}
          >
            <span className="text-base shrink-0">{ch.icon || ''}</span>
            <Hash className="w-4 h-4 shrink-0 text-[#6d6f78]" />
            <span className="truncate text-[13px]">{ch.name}</span>
            {!ch.isActive && <span className="text-[9px] text-[#6d6f78] ml-auto">hidden</span>}
          </button>
        ))}
        {channels.length === 0 && (
          <p className="text-xs text-[#6d6f78] text-center py-6">No channels</p>
        )}
      </div>
    </div>
  );
}