import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import { buildAssetIndex } from '@/lib/seasonStudio';

/** How the picker describes a song or playlist, including one switched off. */
function mediaStateLabel(kind, item) {
  if (item?.isSeasonExclusive) return `season exclusive ${kind}`;
  if (item?.isActive === false) return `${kind} · hidden until awarded`;
  return kind;
}

/**
 * Every asset a season reward can reference, in the exact ID format rewards
 * store. Pets and themes come from the built-in catalogs plus the custom
 * entities; gift-only pets are flagged so pickers can leave them out of the
 * default suggestions (they are handed out deliberately, not offered).
 */
export default function useSeasonAssets({ customPets = [], customThemes = [] } = {}) {
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  // Assets created on the spot — an approved AI suggestion that just made a pet
  // or a theme — so the reward pointing at them validates before any reload.
  const [createdAssets, setCreatedAssets] = useState({ pets: [], themes: [] });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [trackList, playlistList, foodList] = await Promise.all([
          base44.entities.MusicTrack.list('-created_date'),
          base44.entities.Playlist.list('-created_date'),
          base44.entities.FoodItem.list('-created_date'),
        ]);
        if (!alive) return;
        setTracks(trackList);
        setPlaylists(playlistList);
        setFoods(foodList);
      } catch (e) {
        console.error('Season Studio could not load assets', e);
      }
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const registerAssets = (created = {}) =>
    setCreatedAssets((prev) => ({
      pets: [...prev.pets, ...(created.pets || [])],
      themes: [...prev.themes, ...(created.themes || [])],
    }));

  return useMemo(() => {
    // Newly created assets are listed alongside the loaded ones, without ever
    // showing the same asset twice.
    const merge = (base, extra) => {
      const seen = new Set(base.map((item) => item.id));
      return [...base, ...extra.filter((item) => !seen.has(item.id))];
    };
    const pets = merge([
      ...PETS.map((pet) => ({
        id: pet.id,
        name: pet.name,
        emoji: pet.emoji,
        subtitle: `${pet.rarity || 'common'} · built-in`,
        giftOnly: false,
      })),
      ...(customPets || []).map((pet) => ({
        id: `custom_${pet.id}`,
        name: pet.name,
        emoji: pet.emoji,
        image: pet.imageUrl,
        subtitle: `${pet.rarity || 'common'} · custom${pet.isGiftOnly ? ' · gift only' : ''}`,
        giftOnly: !!pet.isGiftOnly,
      })),
    ], createdAssets.pets);
    const themes = merge([
      ...THEMES.map((theme) => ({ id: theme.id, name: theme.name, subtitle: 'built-in theme' })),
      ...(customThemes || []).map((theme) => ({ id: `custom_${theme.id}`, name: theme.name, subtitle: 'custom theme' })),
    ], createdAssets.themes);
    // Songs and playlists are listed even when their Active switch is off: a
    // season-exclusive song is deliberately kept off so it stays out of the public
    // library, and a 1Pass song reward is exactly how it reaches a student — an
    // awarded song plays even while it is switched off (see isPlayableTrack).
    const trackOptions = (tracks || []).map((track) => ({
      id: track.id,
      name: track.title,
      emoji: '🎵',
      subtitle: mediaStateLabel('song', track),
    }));
    const playlistOptions = (playlists || []).map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      emoji: '🎶',
      subtitle: mediaStateLabel('playlist', playlist),
    }));
    const foodOptions = (foods || []).map((food) => ({
      id: food.id,
      name: food.name,
      emoji: food.emoji || '🍽️',
      image: food.imageUrl,
      subtitle: food.rarity || 'food',
    }));

    return {
      loading,
      pets,
      themes,
      tracks: trackOptions,
      playlists: playlistOptions,
      foods: foodOptions,
      index: buildAssetIndex({ pets, themes, tracks: trackOptions, playlists: playlistOptions, foods: foodOptions }),
      registerAssets,
    };
  }, [customPets, customThemes, tracks, playlists, foods, loading, createdAssets]);
}