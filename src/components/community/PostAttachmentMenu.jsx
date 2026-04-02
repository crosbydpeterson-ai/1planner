import React, { useState } from 'react';
import { Plus, Lightbulb, BarChart3 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function PostAttachmentMenu({ isAdmin, onPetConcept, onPoll }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-slate-100 hover:bg-indigo-100 text-slate-400 hover:text-indigo-500 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1 bg-white border-slate-200 shadow-lg" side="top" align="start">
        <button
          onClick={() => { setOpen(false); onPetConcept(); }}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
        >
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Pet Idea
        </button>
        {isAdmin && (
          <button
            onClick={() => { setOpen(false); onPoll(); }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Create Poll
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}