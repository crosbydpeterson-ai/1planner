import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import MagicJarVisual from './themes/MagicJarVisual';
import WorldTreeVisual from './themes/WorldTreeVisual';
import CommunityChestVisual from './themes/CommunityChestVisual';
import MonsterHunterVisual from './themes/MonsterHunterVisual';
import CrystalCavernVisual from './themes/CrystalCavernVisual';
import VolcanoForgeVisual from './themes/VolcanoForgeVisual';
import OceanDepthsVisual from './themes/OceanDepthsVisual';
import StarConstellationVisual from './themes/StarConstellationVisual';

const THEME_CONFIG = {
  world_tree: {
    label: 'Growth',
    bgGradient: 'from-emerald-950 via-green-900 to-emerald-950',
    progressColor: 'bg-emerald-400',
    barBg: 'bg-emerald-900/50',
    accentColor: 'text-emerald-400',
    tierBg: 'bg-emerald-900/40',
    tierActiveBg: 'bg-emerald-800/60',
    glowColor: '#22c55e',
    Visual: WorldTreeVisual,
  },
  community_chest: {
    label: 'Filled',
    bgGradient: 'from-amber-950 via-yellow-900 to-amber-950',
    progressColor: 'bg-amber-400',
    barBg: 'bg-amber-900/50',
    accentColor: 'text-amber-400',
    tierBg: 'bg-amber-900/40',
    tierActiveBg: 'bg-amber-800/60',
    glowColor: '#f59e0b',
    Visual: CommunityChestVisual,
  },
  monster_hunter: {
    label: 'Damage',
    bgGradient: 'from-red-950 via-orange-950 to-red-950',
    progressColor: 'bg-red-500',
    barBg: 'bg-red-900/50',
    accentColor: 'text-red-400',
    tierBg: 'bg-red-900/40',
    tierActiveBg: 'bg-red-800/60',
    glowColor: '#ef4444',
    Visual: MonsterHunterVisual,
  },
  magic_jar: {
    label: 'Filled',
    bgGradient: 'from-purple-950 via-indigo-950 to-violet-950',
    progressColor: 'bg-purple-500',
    barBg: 'bg-purple-900/50',
    accentColor: 'text-purple-400',
    tierBg: 'bg-purple-900/40',
    tierActiveBg: 'bg-purple-800/60',
    glowColor: '#a855f7',
    Visual: MagicJarVisual,
  },
  crystal_cavern: {
    label: 'Crystallized',
    bgGradient: 'from-slate-950 via-cyan-950 to-indigo-950',
    progressColor: 'bg-cyan-400',
    barBg: 'bg-cyan-900/50',
    accentColor: 'text-cyan-400',
    tierBg: 'bg-cyan-900/40',
    tierActiveBg: 'bg-cyan-800/60',
    glowColor: '#06b6d4',
    Visual: CrystalCavernVisual,
  },
  volcano_forge: {
    label: 'Forged',
    bgGradient: 'from-stone-950 via-orange-950 to-red-950',
    progressColor: 'bg-orange-500',
    barBg: 'bg-orange-900/50',
    accentColor: 'text-orange-400',
    tierBg: 'bg-orange-900/40',
    tierActiveBg: 'bg-orange-800/60',
    glowColor: '#f97316',
    Visual: VolcanoForgeVisual,
  },
  ocean_depths: {
    label: 'Discovered',
    bgGradient: 'from-slate-950 via-teal-950 to-cyan-950',
    progressColor: 'bg-teal-400',
    barBg: 'bg-teal-900/50',
    accentColor: 'text-teal-400',
    tierBg: 'bg-teal-900/40',
    tierActiveBg: 'bg-teal-800/60',
    glowColor: '#14b8a6',
    Visual: OceanDepthsVisual,
  },
  star_constellation: {
    label: 'Illuminated',
    bgGradient: 'from-slate-950 via-indigo-950 to-slate-950',
    progressColor: 'bg-amber-400',
    barBg: 'bg-indigo-900/50',
    accentColor: 'text-amber-400',
    tierBg: 'bg-indigo-900/40',
    tierActiveBg: 'bg-indigo-800/60',
    glowColor: '#fbbf24',
    Visual: StarConstellationVisual,
  },
};

const REWARD_ICONS = {
  xp: '⚡', coins: '🪙', pet: '🐾', theme: '🎨', title: '👑', magic_egg: '🥚',
};

export default function GlobalEventWidget({ profile, fullScreen = false }) {
  const [event, setEvent] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

  useEffect(() => {
    loadEvent();
  }, [profile?.id]);

  useEffect(() => {
    if (!event?.id) return;
    const unsub = base44.entities.GlobalEvent.subscribe((evt) => {
      if (evt.type === 'update' && evt.id === event.id) {
        setEvent(prev => ({ ...prev, ...evt.data }));
      }
    });
    return unsub;
  }, [event?.id]);

  const loadEvent = async () => {
    try {
      const events = await base44.entities.GlobalEvent.filter({ isActive: true });
      if (events.length > 0) {
        setEvent(events[0]);
        if (profile?.id) {
          const userClaims = await base44.entities.GlobalEventClaim.filter({
            eventId: events[0].id,
            userProfileId: profile.id,
          });
          setClaims(userClaims);
        }
      }
    } catch (e) {
      console.error('Error loading global event:', e);
    }
    setLoading(false);
  };

  const handleClaim = async (tierIndex) => {
    if (!event || !profile) return;
    setClaiming(tierIndex);
    try {
      const { data } = await base44.functions.invoke('claimGlobalEventReward', {
        eventId: event.id,
        tierIndex,
        userProfileId: profile.id,
      });
      if (data.success) {
        setClaims(prev => [...prev, { eventId: event.id, userProfileId: profile.id, tierIndex }]);
        toast.success(`🎉 Claimed: ${data.rewardDescription}!`);
      }
    } catch (e) {
      const msg = e?.response?.data?.error || 'Failed to claim';
      toast.error(msg);
    }
    setClaiming(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-white/50" />
      </div>
    );
  }
  if (!event) return null;

  const themeConfig = THEME_CONFIG[event.theme] || THEME_CONFIG.magic_jar;
  const progress = Math.min((event.currentGlobalXP || 0) / event.totalXPGoal * 100, 100);
  const tiers = event.tiers || [];
  const claimedIndexes = claims.map(c => c.tierIndex);
  const ThemeVisual = themeConfig.Visual;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${fullScreen ? 'min-h-screen' : 'rounded-2xl'} bg-gradient-to-b ${themeConfig.bgGradient} p-5 pb-8 relative overflow-hidden z-0`}
    >
      {/* Ambient background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 text-center mb-4 pt-2">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-white/60" />
            <span className="text-xs uppercase tracking-widest text-white/50 font-medium">Community Event</span>
            <Sparkles className="w-4 h-4 text-white/60" />
          </div>
          <h2 className="text-2xl font-bold text-white">{event.name}</h2>
          {event.description && (
            <p className="text-sm text-white/50 mt-1 max-w-xs mx-auto">{event.description}</p>
          )}
        </motion.div>
      </div>

      {/* Theme Visual */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
        className="relative z-10 my-6"
      >
        <ThemeVisual progress={progress} />
      </motion.div>

      {/* XP Counter */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 text-center mb-5"
      >
        <p className={`text-3xl font-black ${themeConfig.accentColor}`}>
          {(event.currentGlobalXP || 0).toLocaleString()}
        </p>
        <p className="text-sm text-white/40">of {event.totalXPGoal.toLocaleString()} XP</p>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="relative z-10 mx-auto max-w-sm mb-6"
      >
        <div className={`h-3 rounded-full ${themeConfig.barBg} overflow-hidden shadow-inner`}>
          <motion.div
            className={`h-full rounded-full ${themeConfig.progressColor} shadow-lg`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.8 }}
          />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-white/40">{themeConfig.label}: {progress.toFixed(1)}%</span>
          <span className="text-xs text-white/40">
            {Math.max(0, event.totalXPGoal - (event.currentGlobalXP || 0)).toLocaleString()} XP remaining
          </span>
        </div>
      </motion.div>

      {/* Reward Tiers */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="relative z-10 max-w-sm mx-auto space-y-2"
      >
        <h3 className="text-xs uppercase tracking-wider text-white/40 font-medium mb-3 text-center">Rewards</h3>
        {tiers.map((tier, i) => {
          const unlocked = (event.currentGlobalXP || 0) >= tier.xpThreshold;
          const claimed = claimedIndexes.includes(i);
          const tierProgress = Math.min(((event.currentGlobalXP || 0) / tier.xpThreshold) * 100, 100);

          return (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
                claimed
                  ? `${themeConfig.tierBg} border-white/10 opacity-60`
                  : unlocked
                    ? `${themeConfig.tierActiveBg} border-white/20 shadow-lg`
                    : `${themeConfig.tierBg} border-white/5`
              }`}
            >
              <span className="text-2xl">{REWARD_ICONS[tier.rewardType] || '🎁'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${unlocked ? 'text-white' : 'text-white/40'}`}>
                  {tier.rewardName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${themeConfig.progressColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${tierProgress}%` }}
                      transition={{ duration: 1, delay: 1.2 + i * 0.1 }}
                    />
                  </div>
                  <span className="text-xs text-white/30 whitespace-nowrap">
                    {tier.xpThreshold.toLocaleString()}
                  </span>
                </div>
              </div>
              {claimed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : unlocked ? (
                <Button
                  size="sm"
                  onClick={() => handleClaim(i)}
                  disabled={claiming === i}
                  className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs h-8 px-3 shadow-lg backdrop-blur-sm"
                >
                  {claiming === i ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <><Gift className="w-3 h-3 mr-1" /> Claim</>
                  )}
                </Button>
              ) : (
                <Lock className="w-4 h-4 text-white/20 flex-shrink-0" />
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}