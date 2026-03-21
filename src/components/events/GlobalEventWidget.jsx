import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';

const THEME_CONFIG = {
  world_tree: {
    icon: '🌳',
    gradient: 'from-emerald-500/20 via-green-500/20 to-lime-500/20',
    progressColor: 'bg-emerald-500',
    accentColor: 'text-emerald-400',
    barBg: 'bg-emerald-900/30',
    label: 'Growth',
  },
  community_chest: {
    icon: '📦',
    gradient: 'from-amber-500/20 via-yellow-500/20 to-orange-500/20',
    progressColor: 'bg-amber-500',
    accentColor: 'text-amber-400',
    barBg: 'bg-amber-900/30',
    label: 'Filled',
  },
  monster_hunter: {
    icon: '🐉',
    gradient: 'from-red-500/20 via-orange-500/20 to-yellow-500/20',
    progressColor: 'bg-red-500',
    accentColor: 'text-red-400',
    barBg: 'bg-red-900/30',
    label: 'Damage',
  },
  magic_jar: {
    icon: '🫙',
    gradient: 'from-purple-500/20 via-indigo-500/20 to-blue-500/20',
    progressColor: 'bg-purple-500',
    accentColor: 'text-purple-400',
    barBg: 'bg-purple-900/30',
    label: 'Filled',
  },
};

const REWARD_ICONS = {
  xp: '⚡',
  coins: '🪙',
  pet: '🐾',
  theme: '🎨',
  title: '👑',
  magic_egg: '🥚',
};

export default function GlobalEventWidget({ profile }) {
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
            userProfileId: profile.id
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
        userProfileId: profile.id
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

  if (loading || !event) return null;

  const themeConfig = THEME_CONFIG[event.theme] || THEME_CONFIG.magic_jar;
  const progress = Math.min((event.currentGlobalXP || 0) / event.totalXPGoal * 100, 100);
  const tiers = event.tiers || [];
  const claimedIndexes = claims.map(c => c.tierIndex);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${themeConfig.gradient} rounded-2xl p-5 border border-white/20 shadow-lg`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{themeConfig.icon}</span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800">{event.name}</h3>
          {event.description && (
            <p className="text-sm text-slate-500">{event.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold ${themeConfig.accentColor}`}>
            {(event.currentGlobalXP || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500">/ {event.totalXPGoal.toLocaleString()} XP</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-4">
        <div className={`h-4 rounded-full ${themeConfig.barBg} overflow-hidden`}>
          <motion.div
            className={`h-full rounded-full ${themeConfig.progressColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-500">{themeConfig.label}: {progress.toFixed(1)}%</span>
          <span className="text-xs text-slate-500">
            {(event.totalXPGoal - (event.currentGlobalXP || 0)).toLocaleString()} XP to go
          </span>
        </div>

        {/* Tier markers on the progress bar */}
        {tiers.map((tier, i) => {
          const pos = (tier.xpThreshold / event.totalXPGoal) * 100;
          const unlocked = (event.currentGlobalXP || 0) >= tier.xpThreshold;
          return (
            <div
              key={i}
              className="absolute top-0 w-4 h-4 -translate-x-1/2 rounded-full border-2 border-white shadow-sm"
              style={{ left: `${pos}%`, backgroundColor: unlocked ? '#10b981' : '#94a3b8' }}
              title={`${tier.rewardName} at ${tier.xpThreshold.toLocaleString()} XP`}
            />
          );
        })}
      </div>

      {/* Tiers */}
      <div className="space-y-2">
        {tiers.map((tier, i) => {
          const unlocked = (event.currentGlobalXP || 0) >= tier.xpThreshold;
          const claimed = claimedIndexes.includes(i);
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-all ${
                unlocked
                  ? claimed ? 'bg-white/30' : 'bg-white/50 shadow-sm'
                  : 'bg-white/10 opacity-60'
              }`}
            >
              <span className="text-xl">{REWARD_ICONS[tier.rewardType] || '🎁'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${unlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                  {tier.rewardName}
                </p>
                <p className="text-xs text-slate-500">
                  {tier.xpThreshold.toLocaleString()} XP
                </p>
              </div>
              {claimed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              ) : unlocked ? (
                <Button
                  size="sm"
                  onClick={() => handleClaim(i)}
                  disabled={claiming === i}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7 px-3"
                >
                  {claiming === i ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Gift className="w-3 h-3 mr-1" /> Claim
                    </>
                  )}
                </Button>
              ) : (
                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}