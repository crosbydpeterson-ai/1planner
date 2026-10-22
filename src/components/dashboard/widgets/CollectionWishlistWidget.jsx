import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Heart, Plus, Trash2, RefreshCw, ChevronRight, CheckCircle2, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { loadPublishedSeasons, loadAssetCatalogs } from '@/lib/dashboardData';
import { PREF_KEYS, STORAGE_BLOCKED_MESSAGE, readWidgetPref, writeWidgetPref } from '@/lib/widgetPrefs';
import { describeAsset, isAssetOwned } from '@/lib/widgetAssets';
import { describeItemSource } from '@/lib/wishlistSources';
import WidgetShell from './WidgetShell';
import WishlistPickerDialog from './WishlistPickerDialog';

const MAX_ITEMS = 3;

/**
 * Collection wishlist — up to three collectibles this student is working toward.
 *
 * Separate from the single reward goal, and stored as stable item references
 * (kind + id) per account, so a wishlist survives catalog edits and never
 * depends on list positions. Ownership is checked against the live inventory:
 * once something is owned the row says so and offers Remove or Replace, and
 * anything deleted or no longer available is labelled instead of breaking Home.
 */
export default function CollectionWishlistWidget({ profile }) {
  const profileId = profile?.id;
  const [items, setItems] = useState(() => readWidgetPref(profileId, PREF_KEYS.wishlist, []));
  const [catalogs, setCatalogs] = useState({});
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [replaceIndex, setReplaceIndex] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catalogData, seasonData] = await Promise.all([
        loadAssetCatalogs().catch(() => ({})),
        loadPublishedSeasons().catch(() => []),
      ]);
      setCatalogs(catalogData || {});
      setSeasons(seasonData || []);
    } catch (e) {
      console.error('Wishlist load failed:', e);
      setError("Couldn't load your wishlist.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setItems(readWidgetPref(profileId, PREF_KEYS.wishlist, []));
    setPickerOpen(false);
    setReplaceIndex(null);
    load();
  }, [profileId, load]);

  const persist = (next) => {
    const result = writeWidgetPref(profileId, PREF_KEYS.wishlist, next);
    if (!result.ok) {
      setStorageError(STORAGE_BLOCKED_MESSAGE);
      return false;
    }
    setStorageError('');
    setItems(next);
    return true;
  };

  const handlePick = (picked) => {
    const entry = { kind: picked.kind, id: picked.id, label: picked.label, addedAt: new Date().toISOString() };
    if (replaceIndex !== null && replaceIndex >= 0) {
      const next = items.map((item, i) => (i === replaceIndex ? entry : item));
      persist(next);
    } else if (items.length < MAX_ITEMS) {
      persist([...items, entry]);
    }
    setPickerOpen(false);
    setReplaceIndex(null);
  };

  const handleRemove = (index) => {
    persist(items.filter((_, i) => i !== index));
  };

  const resolved = useMemo(
    () =>
      items.map((item) => {
        const asset = describeAsset(item.kind, item.id, catalogs, { label: item.label });
        return {
          ...item,
          label: asset.label,
          emoji: asset.emoji,
          imageUrl: asset.imageUrl,
          missing: asset.missing,
          owned: isAssetOwned(profile, item.kind, item.id),
          source: describeItemSource(item.kind, item.id, { seasons, catalogs, profile }),
        };
      }),
    [items, catalogs, seasons, profile]
  );

  const hasGiftOnly = resolved.some((r) => r.source === 'Gift-only');

  const openPicker = (index = null) => {
    setReplaceIndex(index);
    setPickerOpen(true);
  };

  return (
    <WidgetShell
      icon={Heart}
      title="Collection Wishlist"
      loading={loading}
      error={error}
      onRetry={load}
      action={
        items.length < MAX_ITEMS ? (
          <button
            type="button"
            onClick={() => openPicker(null)}
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Add
          </button>
        ) : (
          <Link
            to="/Rewards"
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
          >
            Collection <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )
      }
      empty={!loading && !error && items.length === 0 ? 'Nothing on your wishlist' : null}
      emptyHint={!loading && !error && items.length === 0 ? 'Add up to three items you are working toward.' : null}
      emptyAction={
        !loading && !error && items.length === 0 ? (
          <button
            type="button"
            onClick={() => openPicker(null)}
            className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            <Plus className="w-4 h-4" aria-hidden="true" /> Add an item
          </button>
        ) : null
      }
    >
      {items.length > 0 ? (
        <ul className="space-y-2">
          {resolved.map((item, index) => (
            <li
              key={`${item.kind}:${item.id}`}
              className="flex items-center gap-2.5 rounded-xl bg-white/40 border border-white/40 p-2.5"
            >
              <span className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center text-lg shrink-0" aria-hidden="true">
                {item.imageUrl
                  ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain rounded-lg" />
                  : item.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item.label}</p>
                <p className={`text-[11px] truncate ${item.missing ? 'text-amber-600' : 'text-slate-500'}`}>
                  {item.missing ? 'No longer available' : item.source}
                </p>
              </div>

              {item.owned ? (
                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 border border-emerald-200/70 rounded-full px-2 py-0.5">
                  <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Collected
                </span>
              ) : null}

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openPicker(index)}
                  aria-label={`Replace ${item.label}`}
                  className="w-8 h-8 rounded-lg border border-white/60 bg-white/70 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 flex items-center justify-center"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  aria-label={`Remove ${item.label}`}
                  className="w-8 h-8 rounded-lg border border-white/60 bg-white/70 text-slate-600 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {hasGiftOnly ? (
        <p className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
          <Gift className="w-3 h-3" aria-hidden="true" />
          Gift-only items come from a gift, not from earning XP.
        </p>
      ) : null}

      {storageError ? <p className="text-[11px] text-amber-600 mt-2">{storageError}</p> : null}

      <WishlistPickerDialog
        open={pickerOpen}
        onOpenChange={(v) => { setPickerOpen(v); if (!v) setReplaceIndex(null); }}
        catalogs={catalogs}
        seasons={seasons}
        profile={profile}
        wishlistItems={items}
        onPick={handlePick}
        replacing={replaceIndex !== null}
      />
    </WidgetShell>
  );
}