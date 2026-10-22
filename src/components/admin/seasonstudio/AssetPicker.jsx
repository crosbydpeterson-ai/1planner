import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, Eye, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Searchable picker for a real asset. Options are the assets that exist right
 * now, so a season can never store an invented ID. Gift-only pets are left out
 * of the suggestions unless the admin asks for them.
 */
export default function AssetPicker({ kind, value, onChange, assets, placeholder = 'Choose an asset' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showGiftOnly, setShowGiftOnly] = useState(false);

  const all = assets?.[kind] || [];
  const giftOnlyCount = useMemo(() => all.filter((item) => item.giftOnly).length, [all]);
  const selected = all.find((item) => item.id === value);

  const options = useMemo(() => {
    const search = query.trim().toLowerCase();
    return all
      .filter((item) => showGiftOnly || !item.giftOnly)
      .filter((item) => !search || `${item.name} ${item.subtitle || ''}`.toLowerCase().includes(search))
      .slice(0, 50);
  }, [all, query, showGiftOnly]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-between border-slate-600 bg-slate-800 text-left text-xs font-medium text-slate-200 hover:bg-slate-700"
        >
          <span className="flex min-w-0 items-center gap-2">
            {selected ? (
              <>
                {selected.image ? (
                  <img src={selected.image} alt="" className="h-6 w-6 rounded object-cover" />
                ) : (
                  <span className="text-base leading-none">{selected.emoji || '🎁'}</span>
                )}
                <span className="truncate">{selected.name}</span>
              </>
            ) : (
              <span className="truncate text-slate-400">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 border-slate-700 bg-slate-900 p-2 text-slate-200">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
            className="h-9 border-slate-700 bg-slate-800 pl-7 text-xs"
          />
        </div>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {options.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-slate-800',
                item.id === value && 'bg-purple-600/25'
              )}
            >
              {item.image ? (
                <img src={item.image} alt="" className="h-7 w-7 rounded object-cover" />
              ) : (
                <span className="text-lg leading-none">{item.emoji || '🎁'}</span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-white">{item.name}</span>
                {item.subtitle && <span className="block truncate text-[10px] uppercase tracking-wide text-slate-400">{item.subtitle}</span>}
              </span>
              {item.id === value && <Check className="h-3.5 w-3.5 text-purple-300" />}
            </button>
          ))}
          {options.length === 0 && <p className="px-2 py-4 text-center text-xs text-slate-500">Nothing matches that search.</p>}
        </div>
        {giftOnlyCount > 0 && (
          <button
            type="button"
            onClick={() => setShowGiftOnly((v) => !v)}
            className="mt-2 flex w-full items-center gap-2 rounded-lg border border-slate-700 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 hover:bg-slate-800"
          >
            <Eye className="h-3.5 w-3.5" />
            {showGiftOnly ? 'Hide' : 'Show'} {giftOnlyCount} gift-only
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}