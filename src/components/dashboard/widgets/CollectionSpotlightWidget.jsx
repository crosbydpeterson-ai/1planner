import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gem, Play, ChevronRight, Clock } from 'lucide-react';
import { loadRecentAcquisitions, loadAssetCatalogs } from '@/lib/dashboardData';
import { describeAsset, isAssetOwned } from '@/lib/widgetAssets';
import { equipPet, equipTitle } from '@/lib/equipHelpers';
import { getUnlockedTrackIds, isTrackVisibleForUser } from '@/lib/musicAccess';
import { musicPlayer } from '@/lib/musicPlayerStore';
import { formatCentralDateTime } from '@/lib/centralTime';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import { getPetName } from '@/components/quest/petUtils';
import WidgetShell from './WidgetShell';

/**
 * "New in your collection" — what was actually earned recently.
 *
 * "Recent" only means something when there is acquisition history, which this
 * app records on completed outcomes. Inventory order proves nothing, so when no
 * history exists the widget says it is a spotlight of owned items instead of
 * pretending those items are new. Viewing never equips anything and never
 * starts playback; the buttons do that, on purpose, when tapped.
 *
 * Songs respect the same availability rules as the Music page, and equipping
 * goes through the shared equip helpers, which re-check ownership first.
 */
export default function CollectionSpotlightWidget({ profile, onProfileChange }) {
  const [rows, setRows] = useState([]);
  const [catalogs, setCatalogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const history = await loadRecentAcquisitions(profile?.id);
      setRows(history);
      if (history.length > 0) {
        try {
          setCatalogs(await loadAssetCatalogs());
        } catch {
          setCatalogs({});
        }
      }
    } catch (e) {
      console.error('Collection spotlight load failed:', e);
      setError("Couldn't load your collection.");
    }
    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const entries = useMemo(() => {
    if (rows.length === 0) return [];
    return rows
      .map((row) => {
        const asset = describeAsset(row.rewardType, row.rewardId, catalogs, { amount: row.rewardAmount });
        return {
          ...asset,
          key: `${row.rewardType}:${row.rewardId}`,
          at: row.timestamp,
          owned: isAssetOwned(profile, row.rewardType, row.rewardId),
        };
      })
      .filter((entry) => !entry.missing)
      .slice(0, 3);
  }, [rows, catalogs, profile]);

  // Honest fallback: no recorded history, so show owned highlights and label it.
  const highlights = useMemo(() => {
    if (entries.length > 0) return [];
    const list = [];
    if (profile?.equippedPetId) {
      const pet = String(profile.equippedPetId).startsWith('custom_')
        ? { label: getPetName(profile.equippedPetId, {}), emoji: '🐾' }
        : { label: PETS.find((p) => p.id === profile.equippedPetId)?.name || 'Pet', emoji: PETS.find((p) => p.id === profile.equippedPetId)?.emoji || '🐾' };
      list.push({ key: 'equipped-pet', kind: 'pet', label: pet.label, emoji: pet.emoji, owned: true });
    }
    if (profile?.equippedTitle) {
      list.push({ key: 'equipped-title', kind: 'title', label: profile.equippedTitle, emoji: '🏷️', owned: true });
    }
    const themeId = profile?.equippedThemeId;
    if (themeId) {
      const theme = THEMES.find((t) => t.id === themeId);
      list.push({ key: 'equipped-theme', kind: 'theme', label: theme?.name || 'Theme', emoji: '🎨', owned: true });
    }
    return list.slice(0, 3);
  }, [entries.length, profile]);

  const handleEquip = async (entry) => {
    setBusyId(entry.key);
    setNotice('');
    const result = entry.kind === 'pet' ? await equipPet(profile, entry.id) : await equipTitle(profile, entry.id);
    if (result.ok) {
      if (onProfileChange) onProfileChange(result.profile);
      setNotice(entry.kind === 'pet' ? 'Pet equipped' : 'Title equipped');
    } else if (result.error === 'no_longer_owned') {
      if (onProfileChange && result.profile) onProfileChange(result.profile);
      setNotice('That item is no longer in your collection.');
    } else {
      setNotice("Couldn't equip that right now.");
    }
    setBusyId(null);
  };

  const handlePlay = (entry) => {
    const track = (catalogs.tracks || []).find((t) => t.id === entry.id);
    if (!track || track.isActive === false) {
      setNotice('That song is not available to play.');
      return;
    }
    const unlocked = getUnlockedTrackIds(profile);
    if (!isTrackVisibleForUser(track, profile, unlocked)) {
      setNotice('That song is not available to your class.');
      return;
    }
    musicPlayer.play(track);
    setNotice('Playing in the music bar');
  };

  const canEquip = (kind) => kind === 'pet' || kind === 'title';

  return (
    <WidgetShell
      icon={Gem}
      title={entries.length > 0 ? 'New in Your Collection' : 'Collection Spotlight'}
      loading={loading}
      error={error}
      onRetry={load}
      action={
        <Link
          to="/Rewards"
          className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
        >
          Collection <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      }
      empty={!loading && !error && entries.length === 0 && highlights.length === 0 ? 'Nothing here yet' : null}
      emptyHint={!loading && !error && entries.length === 0 && highlights.length === 0 ? 'Earn a pet, title or song and it shows up here.' : null}
    >
      {entries.length === 0 && highlights.length > 0 ? (
        <p className="text-[11px] text-slate-500 mb-2">
          We can&apos;t tell what&apos;s new yet — here are a few highlights you own.
        </p>
      ) : null}

      <ul className="space-y-2">
        {(entries.length > 0 ? entries : highlights).map((entry) => (
          <li key={entry.key} className="flex items-center gap-3 rounded-xl bg-white/40 border border-white/40 p-2.5">
            <span className="w-9 h-9 rounded-lg bg-white/70 flex items-center justify-center text-lg shrink-0" aria-hidden="true">
              {entry.imageUrl
                ? <img src={entry.imageUrl} alt="" className="w-full h-full object-contain rounded-lg" />
                : entry.emoji}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{entry.label}</p>
              <p className="text-[11px] text-slate-500">
                {entry.owned === false
                  ? 'Not in your collection'
                  : entry.at
                    ? formatCentralDateTime(entry.at)
                    : 'Owned'}
              </p>
            </div>

            {entries.length > 0 && entry.owned && entry.kind === 'song' ? (
              <button
                type="button"
                onClick={() => handlePlay(entry)}
                className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" /> Play
              </button>
            ) : null}

            {entries.length > 0 && entry.owned && canEquip(entry.kind) ? (
              <button
                type="button"
                disabled={busyId === entry.key}
                onClick={() => handleEquip(entry)}
                className="shrink-0 rounded-xl border border-indigo-200 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
              >
                {busyId === entry.key ? '…' : 'Equip'}
              </button>
            ) : null}

            {entries.length > 0 && !entry.owned ? (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] text-slate-500">
                <Clock className="w-3 h-3" aria-hidden="true" /> Unavailable
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {notice ? <p className="text-[11px] text-slate-600 mt-2">{notice}</p> : null}
    </WidgetShell>
  );
}