import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Smile, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { base44 } from '@/api/base44Client';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '🎉', '💀', '👀'];

// Cache petmojis globally so we don't refetch per component
let cachedPetMojis = null;
let cachePromise = null;

function loadPetMojis() {
  if (cachedPetMojis) return Promise.resolve(cachedPetMojis);
  if (cachePromise) return cachePromise;
  cachePromise = base44.entities.PetMoji.filter({ isActive: true }).then(mojis => {
    cachedPetMojis = mojis;
    return mojis;
  });
  return cachePromise;
}

// Listen for new petmojis and invalidate cache
if (typeof window !== 'undefined') {
  window.__petmoji_sub = window.__petmoji_sub || base44.entities.PetMoji.subscribe(() => {
    cachedPetMojis = null;
    cachePromise = null;
  });
}

export default function ReactionBar({ reactions, currentProfileId, onReact, userPets }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('emoji');
  const [petMojis, setPetMojis] = useState([]);
  const reactionMap = reactions || {};

  useEffect(() => {
    loadPetMojis().then(setPetMojis);
  }, []);

  // Merge user's pet emojis into the picker
  const petEmojis = (userPets || []).filter(p => p.emoji).map(p => p.emoji);
  const allEmojis = [...QUICK_EMOJIS, ...petEmojis.filter(e => !QUICK_EMOJIS.includes(e))];

  const handleReact = (key) => {
    onReact(key);
    setOpen(false);
  };

  // Resolve a reaction key to display content
  const renderReactionContent = (key) => {
    if (key.startsWith('petmoji:')) {
      const id = key.replace('petmoji:', '');
      const moji = petMojis.find(m => m.id === id);
      if (moji) return <img src={moji.imageUrl} alt={moji.name} className="w-4 h-4 rounded object-cover inline-block" />;
      return <span className="text-sm">?</span>;
    }
    return <span className="text-sm">{key}</span>;
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Existing reactions */}
      {Object.entries(reactionMap).map(([key, userIds]) => {
        if (!userIds || userIds.length === 0) return null;
        const hasReacted = userIds.includes(currentProfileId);
        return (
          <button
            key={key}
            onClick={() => onReact(key)}
            className={cn(
              "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-all border",
              hasReacted
                ? "bg-[#5865f2]/20 border-[#5865f2]/50 text-[#dbdee1]"
                : "bg-[#2b2d31] border-[#3f4147] text-[#949ba4] hover:border-[#5865f2]/30"
            )}
          >
            {renderReactionContent(key)}
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
        <PopoverContent className="w-auto p-0 bg-[#2b2d31] border-[#1e1f22]" side="top" align="start">
          {/* Tabs */}
          <div className="flex border-b border-[#1e1f22]">
            <button
              onClick={() => setTab('emoji')}
              className={cn("flex-1 text-xs py-1.5 px-3 transition-colors", tab === 'emoji' ? "text-white bg-[#35373c]" : "text-[#949ba4] hover:text-[#dbdee1]")}
            >
              😀 Emoji
            </button>
            {petMojis.length > 0 && (
              <button
                onClick={() => setTab('petmoji')}
                className={cn("flex-1 text-xs py-1.5 px-3 transition-colors", tab === 'petmoji' ? "text-white bg-[#35373c]" : "text-[#949ba4] hover:text-[#dbdee1]")}
              >
                🐾 Petmoji
              </button>
            )}
          </div>

          <div className="p-2">
            {tab === 'emoji' && (
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
            )}

            {tab === 'petmoji' && (
              <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
                {petMojis.map((moji) => (
                  <button
                    key={moji.id}
                    onClick={() => handleReact(`petmoji:${moji.id}`)}
                    className="w-12 h-12 flex flex-col items-center justify-center hover:bg-[#35373c] rounded transition-colors p-1"
                    title={moji.name}
                  >
                    <img src={moji.imageUrl} alt={moji.name} className="w-8 h-8 rounded object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}