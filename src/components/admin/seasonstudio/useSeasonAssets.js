import { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import { buildAssetIndex } from '@/lib/seasonStudio';

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

  return useMemo(() => {
    const pets = [
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
    ];
    const themes = [
      ...THEMES.map((theme) => ({ id: theme.id, name: theme.name, subtitle: 'built-in theme' })),
      ...(customThemes || []).map((theme) => ({ id: `custom_${theme.id}`, name: theme.name, subtitle: 'custom theme' })),
    ];
    const trackOptions = (tracks || [])
      .filter((track) => track.isActive !== false)
      .map((track) => ({ id: track.id, name: track.title, emoji: '🎵', subtitle: track.isSeasonExclusive ? 'season exclusive song' : 'song' }));
    const playlistOptions = (playlists || [])
      .filter((playlist) => playlist.isActive !== false)
      .map((playlist) => ({ id: playlist.id, name: playlist.name, emoji: '🎶', subtitle: 'playlist' }));
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
    };
  }, [customPets, customThemes, tracks, playlists, foods, loading]);
}