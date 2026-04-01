import React, { useState } from 'react';
import { Plus, Lightbulb, BarChart3 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function PostAttachmentMenu({ isAdmin, onPetConcept, onPoll }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-[#4e5058] hover:bg-[#6d6f78] text-[#b5bac1] hover:text-white transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1 bg-[#2b2d31] border-[#1e1f22]" side="top" align="start">
        <button
          onClick={() => { setOpen(false); onPetConcept(); }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-[#dbdee1] hover:bg-[#5865f2] hover:text-white transition-colors"
        >
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Pet Idea
        </button>
        {isAdmin && (
          <button
            onClick={() => { setOpen(false); onPoll(); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded text-sm text-[#dbdee1] hover:bg-[#5865f2] hover:text-white transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Create Poll
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}