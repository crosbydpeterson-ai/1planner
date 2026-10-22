import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { buildWishlistCatalogs, describeItemSource } from '@/lib/wishlistSources';

/**
 * Searchable wishlist picker.
 *
 * Offers only assets the app already publishes to this student — built-in and
 * custom pets and themes, titles that exist in published seasons or that the
 * student already owns, and songs that pass the Music page's own visibility
 * rules. Each row states where the item comes from, so a gift-only or Plus
 * reward is never shown as something you simply earn by playing.
 */
export default function WishlistPickerDialog({
  open,
  onOpenChange,
  catalogs,
  seasons,
  profile,
  wishlistItems = [],
  onPick,
  replacing = false,
}) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('pets');

  const grouped = useMemo(
    () => buildWishlistCatalogs({ catalogs, seasons, profile }),
    [catalogs, seasons, profile]
  );

  const alreadyOn = (item) => wishlistItems.some((w) => w.kind === item.kind && w.id === item.id);

  const filterRows = (rows) => {
    if (!query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((r) => (r.label || '').toLowerCase().includes(q));
  };

  const renderList = (rows, emptyText) => {
    const filtered = filterRows(rows);
    if (filtered.length === 0) {
      return <p className="text-xs text-slate-400 py-3">{rows.length === 0 ? emptyText : 'No items match that search.'}</p>;
    }
    return (
      <ul className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
        {filtered.map((item) => {
          const added = alreadyOn(item);
          const source = describeItemSource(item.kind, item.id, { seasons, catalogs, profile });
          return (
            <li key={`${item.kind}:${item.id}`} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5">
              <span className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-lg shrink-0" aria-hidden="true">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain rounded-lg" />
                  : item.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item.label}</p>
                <p className="text-[11px] text-slate-500 truncate">{source}</p>
              </div>
              <Button
                size="sm"
                variant={added ? 'outline' : 'default'}
                disabled={added}
                className={`h-8 rounded-xl shrink-0 ${added ? '' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                onClick={() => onPick(item)}
              >
                {added ? 'On list' : replacing ? 'Use' : 'Add'}
              </Button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{replacing ? 'Replace a wishlist item' : 'Add to your wishlist'}</DialogTitle>
          <DialogDescription>
            Pick something you are working toward. Adding an item here does not reserve or unlock it.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name"
            className="pl-9"
          />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mt-1">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="pets" className="text-xs">Pets</TabsTrigger>
            <TabsTrigger value="themes" className="text-xs">Themes</TabsTrigger>
            <TabsTrigger value="titles" className="text-xs">Titles</TabsTrigger>
            <TabsTrigger value="songs" className="text-xs">Songs</TabsTrigger>
          </TabsList>

          <TabsContent value="pets" className="mt-3">
            {renderList(grouped.pets, 'No pets available.')}
          </TabsContent>
          <TabsContent value="themes" className="mt-3">
            {renderList(grouped.themes, 'No themes available.')}
          </TabsContent>
          <TabsContent value="titles" className="mt-3">
            {renderList(grouped.titles, 'No titles are published yet.')}
          </TabsContent>
          <TabsContent value="songs" className="mt-3">
            {renderList(grouped.songs, 'No songs are available to you yet.')}
          </TabsContent>
        </Tabs>

        <Button variant="outline" className="mt-2" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}