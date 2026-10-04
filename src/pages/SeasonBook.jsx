import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Stamp, Calendar, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import StampCard, { isRewardOwned } from '@/components/seasonbook/StampCard';

export default function SeasonBook() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [customPets, setCustomPets] = useState([]);
  const [customThemes, setCustomThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    base44.analytics.track({ eventName: 'season_book_viewed' });
  }, []);

  const loadData = async () => {
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
      navigate(createPageUrl('Home'));
      setLoading(false);
      return;
    }

    try {
      const [allSeasons, dbCustomPets, dbCustomThemes] = await Promise.all([
        base44.entities.Season.list(),
        base44.entities.CustomPet.list(),
        base44.entities.CustomTheme.list(),
      ]);

      // Past seasons: endDate earlier than current time, regardless of isActive
      const now = new Date();
      const pastSeasons = allSeasons
        .filter(s => new Date(s.endDate) < now)
        .sort((a, b) => new Date(b.endDate) - new Date(a.endDate)); // newest ended first

      setSeasons(pastSeasons);
      setCustomPets(dbCustomPets);
      setCustomThemes(dbCustomThemes);

      if (pastSeasons.length > 0) {
        setSelectedSeasonId(pastSeasons[0].id);
      }
    } catch (e) {
      console.error('Error loading seasons:', e);
    }

    setLoading(false);
  };

  const petCache = useMemo(() => {
    const map = {};
    customPets.forEach(p => { map[p.id] = p; });
    return map;
  }, [customPets]);

  const themeCache = useMemo(() => {
    const map = {};
    customThemes.forEach(t => { map[t.id] = t; });
    return map;
  }, [customThemes]);

  const selectedSeason = useMemo(
    () => seasons.find(s => s.id === selectedSeasonId),
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#7c3aed_0%,_#581c87_35%,_#2e1065_100%)] px-4 py-5 md:px-6 md:py-6 pb-28">
      <div className="mx-auto max-w-[1500px] space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="rounded-2xl border-2 border-white/20 bg-black/20 text-white hover:bg-white/10 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="text-white/70 text-xs md:text-sm font-black uppercase tracking-[0.2em]">1planner</div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white">Season Book</h1>
            </div>
          </div>
          {selectedSeason && (
            <div className="rounded-2xl border-[3px] border-lime-300 bg-lime-400 px-4 py-2 text-slate-900 shadow-[0_8px_0_rgba(0,0,0,0.22)]">
              <div className="text-[10px] md:text-xs font-black uppercase">Collected</div>
              <div className="text-sm md:text-base font-black">{collectedCount}/{selectedSeason.rewards?.length || 0}</div>
            </div>
          )}
        </motion.div>

        {seasons.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border-[4px] border-violet-300 bg-white/10 p-12 text-center shadow-[0_12px_0_rgba(0,0,0,0.25)]">
            <BookOpen className="w-12 h-12 mx-auto text-yellow-300 mb-3" />
            <h3 className="text-2xl font-black uppercase text-white mb-2">Your Season Book starts here</h3>
            <p className="text-white/70 font-bold uppercase text-sm">Finished seasons will appear here.</p>
          </motion.div>
        ) : (
          <>
            {/* Season tabs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {seasons.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSeasonId(s.id)}
                    className={cn(
                      'flex items-center gap-2 rounded-2xl border-[3px] px-4 py-2.5 text-sm font-black uppercase whitespace-nowrap transition-all',
                      s.id === selectedSeasonId
                        ? 'border-yellow-300 bg-yellow-400 text-slate-900 shadow-[0_5px_0_rgba(0,0,0,0.18)]'
                        : 'border-violet-300/40 bg-white/10 text-white hover:bg-white/20'
                    )}
                  >
                    <Stamp className="w-4 h-4" />
                    {s.name}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Season banner */}
            {selectedSeason && (
              <motion.div
                key={selectedSeason.id + '-banner'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-[28px] border-[4px] border-amber-300 bg-gradient-to-r from-orange-400 via-yellow-300 to-amber-400 p-5 md:p-6 shadow-[0_12px_0_rgba(0,0,0,0.25)]"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wide text-slate-900/70">Past Season</div>
                    <h2 className="text-2xl md:text-4xl font-black uppercase text-slate-900">{selectedSeason.name}</h2>
                    <div className="mt-1 flex items-center gap-2 text-slate-900/80 text-xs md:text-sm font-bold uppercase">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(selectedSeason.startDate), 'MMM d')} - {format(new Date(selectedSeason.endDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border-[3px] border-slate-900/20 bg-slate-900/10 px-5 py-3 text-center">
                    <div className="text-xs font-black uppercase text-slate-900/70">Collected</div>
                    <div className="text-2xl font-black text-slate-900">{collectedCount} of {selectedSeason.rewards?.length || 0}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stamp grid */}
            {selectedSeason && (
              <motion.div
                key={selectedSeason.id + '-grid'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
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
                <p className="text-center text-white/50 text-xs font-bold uppercase mt-6">
                  Images reveal when you own the reward.
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}