import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Smile, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { base44 } from '@/api/base44Client';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '🎉', '💀', '👀'];

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

if (typeof window !== 'undefined') {
  window.__petmoji_sub = window.__petmoji_sub || base44.entities.PetMoji.subscribe(() => {
    cachedPetMojis = null;
    cachePromise = null;
  });
}

export default function ReactionBar({ reactions, currentProfileId, onReact, userPets, profilesCache }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('emoji');
  const [allPetMojis, setAllPetMojis] = useState([]);
  const reactionMap = reactions || {};

  useEffect(() => {
    loadPetMojis().then(setAllPetMojis);
  }, []);

  const petMojis = allPetMojis.filter(m => {
    if (!m.isExclusive) return true;
    return (m.exclusiveOwnerIds || []).includes(currentProfileId);
  });

  const findMoji = (id) => allPetMojis.find(m => m.id === id);

  const petEmojis = (userPets || []).filter(p => p.emoji).map(p => p.emoji);
  const allEmojis = [...QUICK_EMOJIS, ...petEmojis.filter(e => !QUICK_EMOJIS.includes(e))];

  const handleReact = (key) => {
    onReact(key);
    setOpen(false);
  };

  const renderReactionContent = (key) => {
    if (key.startsWith('petmoji:')) {
      const id = key.replace('petmoji:', '');
      const moji = findMoji(id);
      if (moji) return <img src={moji.imageUrl} alt={moji.name} className="w-5 h-5 rounded object-cover inline-block" />;
      return <span className="text-xs">?</span>;
    }
    return <span className="text-sm leading-none">{key}</span>;
  };

  const getReactorNames = (userIds) => {
    if (!profilesCache || !userIds) return [];
    return userIds.map(id => profilesCache[id]?.username || 'Someone').slice(0, 10);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1.5 flex-wrap">
        {Object.entries(reactionMap).map(([key, userIds]) => {
          if (!userIds || userIds.length === 0) return null;
          const hasReacted = userIds.includes(currentProfileId);
          const names = getReactorNames(userIds);
          const tooltipText = names.length > 0
            ? names.join(', ') + (userIds.length > 10 ? ` +${userIds.length - 10} more` : '')
            : `${userIds.length} reaction${userIds.length !== 1 ? 's' : ''}`;

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onReact(key)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all border",
                    hasReacted
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                      : "bg-slate-50 border-slate-200 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/50"
                  )}
                >
                  {renderReactionContent(key)}
                  <span className="font-medium">{userIds.length}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs max-w-[200px]">
                {tooltipText}
              </TooltipContent>
            </Tooltip>
          );
        })}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-0.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 px-2 py-1 rounded-full transition-all text-xs border border-transparent hover:border-indigo-200">
              <Smile className="w-3.5 h-3.5" />
              <Plus className="w-2.5 h-2.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white border-slate-200 shadow-lg" side="top" align="start">
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setTab('emoji')}
                className={cn("flex-1 text-xs py-2 px-3 transition-colors font-medium", tab === 'emoji' ? "text-indigo-600 border-b-2 border-indigo-500" : "text-slate-400 hover:text-slate-600")}
              >
                😀 Emoji
              </button>
              {petMojis.length > 0 && (
                <button
                  onClick={() => setTab('petmoji')}
                  className={cn("flex-1 text-xs py-2 px-3 transition-colors font-medium", tab === 'petmoji' ? "text-indigo-600 border-b-2 border-indigo-500" : "text-slate-400 hover:text-slate-600")}
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
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              {tab === 'petmoji' && (
                <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto">
                  {petMojis.map((moji) => (
                    <button
                      key={moji.id}
                      onClick={() => handleReact(`petmoji:${moji.id}`)}
                      className="w-14 h-14 flex flex-col items-center justify-center hover:bg-indigo-50 rounded-lg transition-colors p-1 relative"
                      title={moji.name}
                    >
                      <img src={moji.imageUrl} alt={moji.name} className="w-10 h-10 rounded-lg object-cover" />
                      {moji.isExclusive && <span className="absolute top-0 right-0 text-[8px]">✨</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
}