import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { isRewardOwned } from '@/components/seasonbook/StampCard';
import { equipPet, equipTheme, equipTitle } from '@/lib/equipHelpers';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import SeasonBookDecor from '@/components/seasonbook/SeasonBookDecor';
import SeasonBookHeader from '@/components/seasonbook/SeasonBookHeader';
import SeasonSelector from '@/components/seasonbook/SeasonSelector';
import SeasonPanel from '@/components/seasonbook/SeasonPanel';
import {
  nowInTimezone,
  selectOnePassSeason,
  getSeasonBookSeasons,
  selectDefaultSeasonId,
} from '@/lib/seasonUtils';

export default function SeasonBook() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [customPets, setCustomPets] = useState([]);
  const [customThemes, setCustomThemes] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [seasonsError, setSeasonsError] = useState(false);
  const [equipping, setEquipping] = useState(false);
  const [equippingKey, setEquippingKey] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setProfileError(false);
    setSeasonsError(false);

    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      navigate(createPageUrl('Home'));
      setLoading(false);
      return;
    }

    let me = null;
    try {
      // Retry the critical profile fetch a couple times to ride out transient
      // rate-limits instead of immediately showing the error screen.
      let profiles = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          profiles = await base44.entities.UserProfile.filter({ id: profileId });
          break;
        } catch (err) {
          if (attempt === 2) throw err;
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        }
      }
      if (profiles.length === 0) {
        navigate(createPageUrl('Home'));
        setLoading(false);
        return;
      }
      me = profiles[0];
      setProfile(me);
    } catch (e) {
      console.error('Error loading profile:', e);
      setProfileError(true);
      setLoading(false);
      return;
    }

    let allSeasons = [];
    let seasonLoadFailed = false;
    try {
      allSeasons = await base44.entities.Season.list();
    } catch (e) {
      console.error('Error loading seasons:', e);
      seasonLoadFailed = true;
    }

    let dbCustomPets = [];
    let dbCustomThemes = [];
    let dbTracks = [];
    let dbPlaylists = [];
    try {
      [dbCustomPets, dbCustomThemes, dbTracks, dbPlaylists] = await Promise.all([
        base44.entities.CustomPet.list(),
        base44.entities.CustomTheme.list(),
        base44.entities.MusicTrack.list(),
        base44.entities.Playlist.list(),
      ]);
    } catch (e) {
      console.error('Error loading custom artwork:', e);
    }

    setCustomPets(dbCustomPets);
    setCustomThemes(dbCustomThemes);
    setTracks(dbTracks);
    setPlaylists(dbPlaylists);

    if (seasonLoadFailed && allSeasons.length === 0) {
      setSeasonsError(true);
      setLoading(false);
      return;
    }

    const now = nowInTimezone();
    const activeSeasons = (allSeasons || []).filter((s) => s.isActive !== false);
    const onePassSeason = selectOnePassSeason(activeSeasons, now);
    const bookSeasons = getSeasonBookSeasons(allSeasons, onePassSeason, now);

    setSeasons(bookSeasons);
    setSelectedSeasonId(selectDefaultSeasonId(bookSeasons, now));
    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadData();
    base44.analytics.track({ eventName: 'season_book_viewed' });
  }, [loadData]);

  const petCache = useMemo(() => {
    const map = {};
    customPets.forEach((p) => { map[p.id] = p; });
    return map;
  }, [customPets]);

  const themeCache = useMemo(() => {
    const map = {};
    customThemes.forEach((t) => { map[t.id] = t; });
    return map;
  }, [customThemes]);

  const trackCache = useMemo(() => {
    const map = {};
    tracks.forEach((t) => { map[t.id] = t; });
    return map;
  }, [tracks]);

  const playlistCache = useMemo(() => {
    const map = {};
    playlists.forEach((p) => { map[p.id] = p; });
    return map;
  }, [playlists]);

  const now = useMemo(() => nowInTimezone(), []);

  const resolvePetLabel = (petId) => {
    const val = String(petId || '');
    if (val.startsWith('custom_')) {
      const pet = petCache[val.replace('custom_', '')];
      return pet ? { name: pet.name, emoji: pet.emoji } : { name: 'Pet', emoji: '🎁' };
    }
    const builtIn = PETS.find((p) => p.id === val);
    return builtIn ? { name: builtIn.name, emoji: builtIn.emoji } : { name: 'Pet', emoji: '🎁' };
  };

  const resolveThemeName = (themeId) => {
    const val = String(themeId || '');
    if (val.startsWith('custom_')) {
      const t = themeCache[val.replace('custom_', '')];
      return t?.name || 'Theme';
    }
    const b = THEMES.find((t) => t.id === val);
    return b?.name || 'Theme';
  };

  // Quick Equip: validate against the live inventory, save only equip fields,
  // then refresh local profile so every stamp's Equipped status updates.
  const handleQuickEquip = async (reward, rewardIndex) => {
    if (equipping || !profile) return;
    const key = `${reward.type}:${rewardIndex}`;
    setEquipping(true);
    setEquippingKey(key);
    try {
      let result;
      if (reward.type === 'pet') {
        const label = resolvePetLabel(reward.value);
        result = await equipPet(profile, reward.value);
        if (result.ok) {
          toast.success(`${label.emoji} ${label.name} equipped!`);
          window.dispatchEvent(new Event('themeUpdated'));
        }
      } else if (reward.type === 'theme') {
        const name = resolveThemeName(reward.value);
        result = await equipTheme(profile, reward.value);
        if (result.ok) {
          toast.success(`${name} theme equipped!`);
          window.dispatchEvent(new Event('themeUpdated'));
        }
      } else if (reward.type === 'title') {
        const title = (reward.value || reward.name || '').trim();
        result = await equipTitle(profile, title);
        if (result.ok) {
          toast.success(result.profile?.equippedTitle ? `Title "${title}" equipped!` : 'Title removed');
        }
      } else {
        return;
      }

      if (result?.ok) {
        setProfile(result.profile);
      } else if (result?.error === 'no_longer_owned') {
        if (result.profile) setProfile(result.profile);
        toast.error('This item is no longer in your collection.');
      } else {
        toast.error('Failed to equip. Please try again.');
      }
    } catch (e) {
      console.error('Quick equip failed', e);
      toast.error('Failed to equip. Please try again.');
    } finally {
      setEquipping(false);
      setEquippingKey(null);
    }
  };

  const selectedSeason = useMemo(
    () => seasons.find((s) => s.id === selectedSeasonId),
    [seasons, selectedSeasonId]
  );

  const claimedKeys = useMemo(() => {
    if (!profile || !selectedSeason) return [];
    const claimsBySeason = profile.claimedSeasonRewardsBySeason || {};
    return Array.isArray(claimsBySeason[selectedSeason.id]) ? claimsBySeason[selectedSeason.id] : [];
  }, [profile, selectedSeason]);

  const collectedCount = useMemo(() => {
    if (!profile || !selectedSeason) return 0;
    return (selectedSeason.rewards || []).filter((reward, index) =>
      isRewardOwned(reward, index, selectedSeason.id, profile, claimedKeys)
    ).length;
  }, [profile, selectedSeason, claimedKeys]);

  const bgClass =
    'relative min-h-screen bg-[radial-gradient(ellipse_at_top,_#8A5CF6_0%,_#6A3FE0_30%,_#4B25B8_65%,_#2E1480_100%)] px-4 py-5 md:px-8 md:py-6 pb-36';

  // --- Render ---

  if (loading) {
    return (
      <div className={bgClass + ' flex items-center justify-center'}>
        <div className="animate-spin w-8 h-8 border-4 border-purple-300 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className={bgClass}>
        <div className="mx-auto max-w-lg pt-20">
          <ErrorCard title="Couldn't load your profile" onRetry={loadData} />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  if (seasonsError) {
    return (
      <div className={bgClass}>
        <div className="mx-auto max-w-[1340px] space-y-5">
          <SeasonBookHeader />
          <ErrorCard title="Couldn't load seasons" onRetry={loadData} />
        </div>
      </div>
    );
  }

  return (
    <div className={bgClass}>
      <SeasonBookDecor />
      <div className="relative mx-auto max-w-[1340px] space-y-5">
        <SeasonBookHeader />

        {seasons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[28px] border-[4px] border-violet-300 bg-white/10 p-12 text-center shadow-[0_12px_0_rgba(0,0,0,0.25)]"
          >
            <BookOpen className="w-12 h-12 mx-auto text-yellow-300 mb-3" />
            <h3 className="text-2xl font-black uppercase text-white mb-2">Your Season Book starts here</h3>
            <p className="text-white/70 font-bold uppercase text-sm">
              Your current season and finished seasons will appear here.
            </p>
          </motion.div>
        ) : (
          <>
            <SeasonSelector seasons={seasons} selectedId={selectedSeasonId} onSelect={setSelectedSeasonId} />
            {selectedSeason && (
              <motion.div key={selectedSeason.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                <SeasonPanel
                  season={selectedSeason}
                  now={now}
                  profile={profile}
                  claimedKeys={claimedKeys}
                  collectedCount={collectedCount}
                  petCache={petCache}
                  themeCache={themeCache}
                  trackCache={trackCache}
                  playlistCache={playlistCache}
                  onEquip={handleQuickEquip}
                  equipping={equipping}
                  equippingKey={equippingKey}
                />
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ErrorCard({ title, onRetry }) {
  return (
    <div className="rounded-[28px] border-[4px] border-red-300/40 bg-white/10 p-10 text-center shadow-[0_12px_0_rgba(0,0,0,0.25)]">
      <AlertCircle className="w-12 h-12 mx-auto text-red-300 mb-3" />
      <h3 className="text-xl font-black uppercase text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm mb-5">Check your connection and try again.</p>
      <Button onClick={onRetry} className="bg-purple-600 hover:bg-purple-700 text-white">
        <RefreshCw className="w-4 h-4 mr-2" /> Retry
      </Button>
    </div>
  );
}