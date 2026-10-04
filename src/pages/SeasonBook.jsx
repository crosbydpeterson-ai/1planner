import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Star,
  Ghost,
  Snowflake,
  Home,
  Flower2,
  Sun,
  Leaf,
  Gift,
  AlertCircle,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import StampCard, { isRewardOwned } from '@/components/seasonbook/StampCard';
import {
  nowInTimezone,
  parseSeasonDate,
  getSeasonStatus,
  getSeasonStatusLabel,
  selectOnePassSeason,
  getSeasonBookSeasons,
  selectDefaultSeasonId,
} from '@/lib/seasonUtils';

// Pick a seasonal icon based on the season name
function getSeasonIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('trick') || n.includes('treat') || n.includes('halloween') || n.includes('spook')) return Ghost;
  if (n.includes('winter') || n.includes('snow') || n.includes('frost') || n.includes('christmas')) return Snowflake;
  if (n.includes('cozy') || n.includes('cabin') || n.includes('home')) return Home;
  if (n.includes('spring') || n.includes('bloom') || n.includes('garden')) return Flower2;
  if (n.includes('summer') || n.includes('beach') || n.includes('sun')) return Sun;
  if (n.includes('fall') || n.includes('autumn') || n.includes('harvest')) return Leaf;
  if (n.includes('gift') || n.includes('present')) return Gift;
  return Sparkles;
}

export default function SeasonBook() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [customPets, setCustomPets] = useState([]);
  const [customThemes, setCustomThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const [seasonsError, setSeasonsError] = useState(false);

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
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
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
    try {
      [dbCustomPets, dbCustomThemes] = await Promise.all([
        base44.entities.CustomPet.list(),
        base44.entities.CustomTheme.list(),
      ]);
    } catch (e) {
      console.error('Error loading custom artwork:', e);
    }

    setCustomPets(dbCustomPets);
    setCustomThemes(dbCustomThemes);

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

  const now = useMemo(() => nowInTimezone(), []);

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
    'min-h-screen bg-[radial-gradient(circle_at_top,_#4D25A8_0%,_#3A1C94_50%,_#2e1065_100%)] px-4 py-5 md:px-6 md:py-6 pb-28';

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
        <div className="mx-auto max-w-[1500px] space-y-5">
          <Header />
          <ErrorCard title="Couldn't load seasons" onRetry={loadData} />
        </div>
      </div>
    );
  }

  return (
    <div className={bgClass}>
      <div className="mx-auto max-w-[1500px] space-y-5">
        <Header />

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
            {/* Season tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {seasons.map((s) => {
                  const status = getSeasonStatus(s, now);
                  const Icon = getSeasonIcon(s.name);
                  const isSelected = s.id === selectedSeasonId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSeasonId(s.id)}
                      className={cn(
                        'flex items-center gap-2 rounded-full border-[3px] px-5 py-2.5 text-sm font-black uppercase whitespace-nowrap transition-all',
                        isSelected
                          ? 'border-yellow-300 bg-gradient-to-r from-orange-400 to-yellow-400 text-slate-900 shadow-[0_5px_0_rgba(0,0,0,0.25)]'
                          : 'border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate max-w-[140px]">{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Season card — stamps live inside this rounded purple container */}
            {selectedSeason && (
              <motion.div
                key={selectedSeason.id + '-card'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-[32px] border-[4px] border-purple-400/25 bg-gradient-to-br from-purple-700/50 via-purple-800/40 to-violet-900/50 p-5 md:p-7 shadow-[0_14px_0_rgba(0,0,0,0.28)] backdrop-blur-sm"
              >
                {/* Card header: icon + title + count */}
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div className="flex items-center gap-3">
                    {(() => { const Icon = getSeasonIcon(selectedSeason.name); return <Icon className="w-8 h-8 md:w-10 md:h-10 text-yellow-300 shrink-0" />; })()}
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">
                        {selectedSeason.name}
                      </h2>
                      <p className="text-white/60 text-xs md:text-sm font-bold uppercase mt-1">
                        {format(parseSeasonDate(selectedSeason.startDate), 'MMMM')} •{' '}
                        {getSeasonStatusLabel(selectedSeason, now).replace(' Season', '').toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-purple-950/40 border-2 border-purple-300/20 px-4 py-2 text-center shrink-0">
                    <div className="text-[10px] font-black uppercase text-white/70">Collected</div>
                    <div className="text-lg font-black text-white">
                      {collectedCount} of {selectedSeason.rewards?.length || 0}
                    </div>
                  </div>
                </div>

                {/* Stamp grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mt-5">
                  {(selectedSeason.rewards || []).map((reward, index) => (
                    <StampCard
                      key={`${selectedSeason.id}-${index}-${reward.type}-${reward.value || reward.name}`}
                      reward={reward}
                      rewardIndex={index}
                      seasonId={selectedSeason.id}
                      isOwned={isRewardOwned(reward, index, selectedSeason.id, profile, claimedKeys)}
                      petCache={petCache}
                      themeCache={themeCache}
                    />
                  ))}
                </div>

                {/* Footer */}
                <p className="text-center text-white/50 text-xs md:text-sm font-medium mt-6">
                  Collected rewards stay yours after a season ends.
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="flex items-center justify-between w-full">
        {/* Spacer to balance the back button */}
        <div className="w-32 hidden md:block" />
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white flex items-center gap-3">
          <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
          Season Collection
          <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
        </h1>
        <div className="w-32 flex justify-end">
          <Link to={createPageUrl('Season')}>
            <Button
              variant="ghost"
              className="rounded-2xl border-2 border-purple-200/30 bg-purple-500/20 text-white hover:bg-purple-500/40 hover:text-white text-xs font-black uppercase h-auto py-2.5 px-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to 1Pass
            </Button>
          </Link>
        </div>
      </div>
      <p className="text-white/50 text-sm font-bold uppercase tracking-[0.15em]">
        Your seasons. Your collection.
      </p>
    </motion.div>
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