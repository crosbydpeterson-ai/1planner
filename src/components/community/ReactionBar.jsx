import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Smile, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '🎉', '💀', '👀'];

export default function ReactionBar({ reactions, currentProfileId, onReact, userPets }) {
  const [open, setOpen] = useState(false);
  const reactionMap = reactions || {};

  // Merge user's pet emojis into the picker
  const petEmojis = (userPets || []).filter(p => p.emoji).map(p => p.emoji);
  const allEmojis = [...QUICK_EMOJIS, ...petEmojis.filter(e => !QUICK_EMOJIS.includes(e))];

  const handleReact = (emoji) => {
    onReact(emoji);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Existing reactions */}
      {Object.entries(reactionMap).map(([emoji, userIds]) => {
        if (!userIds || userIds.length === 0) return null;
        const hasReacted = userIds.includes(currentProfileId);
        return (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            className={cn(
              "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-all border",
              hasReacted
                ? "bg-[#5865f2]/20 border-[#5865f2]/50 text-[#dbdee1]"
                : "bg-[#2b2d31] border-[#3f4147] text-[#949ba4] hover:border-[#5865f2]/30"
            )}
          >
            <span className="text-sm">{emoji}</span>
            <span>{userIds.length}</span>
          </button>
        );
      })}

      {/* Add reaction button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-0.5 text-[#949ba4] hover:text-[#dbdee1] hover:bg-[#35373c] px-1.5 py-0.5 rounded transition-all text-xs border border-transparent hover:border-[#3f4147]">
            <Smile className="w-3.5 h-3.5" />
            <Plus className="w-2.5 h-2.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 bg-[#2b2d31] border-[#1e1f22]" side="top" align="start">
          <div className="grid grid-cols-6 gap-1">
            {allEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-[#35373c] rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}