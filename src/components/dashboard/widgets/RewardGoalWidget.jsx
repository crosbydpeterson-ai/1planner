import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, ChevronRight, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { loadPublishedSeasons, loadWheelWindow, loadAssetCatalogs } from '@/lib/dashboardData';
import { getRewardLane, isRewardClaimed } from '@/lib/seasonStudio';
import { getSeasonStatus, selectOnePassSeason } from '@/lib/seasonUtils';
import { isPlusActive } from '@/lib/plusAccess';
import { PREF_KEYS, readWidgetPref, writeWidgetPref } from '@/lib/widgetPrefs';
import { REWARD_ICONS, REWARD_KIND_LABELS, describeAsset } from '@/lib/widgetAssets';
import { formatDayShort } from '@/lib/centralTime';
import WidgetShell from './WidgetShell';
import RewardGoalPickerDialog from './RewardGoalPickerDialog';

/**
 * Pick your next reward.
 *
 * A student follows exactly one real reward: a 1Pass season reward or a prize
 * on a wheel that is live for them. Progress is only shown where the
 * requirement is actually known — season XP against the reward's threshold —
 * while chance-based prizes show their source and the odds implied by the
 * wheel's own weights instead of a made-up progress bar.
 *
 * Choosing a goal stores a stable reference (season + reward id, or wheel +
 * prize key) and nothing else: it never reserves, grants or spends anything.
 */
const rewardKeyOf = (reward) =>
  reward?.id || `${reward?.type || 'reward'}:${reward?.value || reward?.name || ''}`;

const prizeKeyOf = (prize) => `${prize?.type || 'prize'}:${prize?.value || prize?.amount || ''}`;

export default function RewardGoalWidget({ profile }) {
  const profileId = profile?.id;
  const [saved, setSaved] = useState(() => readWidgetPref(profileId, PREF_KEYS.rewardGoal, null));
  const [seasons, setSeasons] = useState([]);
  const [wheelData, setWheelData] = useState(null);
  const [catalogs, setCatalogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError('');
    try {
      const [published, wheels] = await Promise.all([
        loadPublishedSeasons().catch(() => []),
        loadWheelWindow(profileId).catch(() => null),
      ]);
      setSeasons(published);
      setWheelData(wheels);
    } catch (e) {
      console.error('Reward goal load failed:', e);
      setError("Couldn't load rewards.");
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    setSaved(readWidgetPref(profileId, PREF_KEYS.rewardGoal, null));
    setPickerOpen(false);
    load();
  }, [profileId, load]);

  const activeSeason = useMemo(() => selectOnePassSeason(seasons, new Date()) || null, [seasons]);

  const claimListFor = useCallback((seasonId) => {
    const bySeason = profile?.claimedSeasonRewardsBySeason || {};
    const scoped = bySeason[seasonId];
    if (Array.isArray(scoped)) return scoped;
    return Array.isArray(profile?.claimedSeasonRewards) ? profile.claimedSeasonRewards : [];
  }, [profile]);

  // Everything a student can pick from right now.
  const candidates = useMemo(() => {
    const seasonList = [];
    if (activeSeason) {
      const claims = claimListFor(activeSeason.id);
      (activeSeason.rewards || []).forEach((reward, index) => {
        if (!reward) return;
        seasonList.push({
          kind: 'season',
          seasonId: activeSeason.id,
          seasonName: activeSeason.name,
          seasonEnd: activeSeason.endDate,
          rewardId: rewardKeyOf(reward),
          lane: getRewardLane(reward, index),
          type: reward.type,
          value: reward.value || null,
          amount: null,
          label: reward.name || null,
          xpRequired: Number(reward.xpRequired) || 0,
          claimed: isRewardClaimed(claims, activeSeason.id, reward, index),
        });
      });
    }

    const wheelList = [];
    [['daily', wheelData?.daily], ['bonus', wheelData?.bonus]].forEach(([destination, resolved]) => {
      const wheel = resolved?.wheel;
      if (!wheel?.prizes?.length) return;
      const weights = wheel.prizes.filter((p) => (Number(p.weight) || 0) > 0);
      const total = weights.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
      weights.forEach((prize) => {
        wheelList.push({
          kind: 'wheel',
          wheelId: wheel.id,
          wheelName: wheel.name,
          destination,
          prizeKey: prizeKeyOf(prize),
          type: prize.type,
          value: prize.value || null,
          amount: Number(prize.amount) || null,
          label: prize.label || prize.name || null,
          chance: total > 0 ? Math.round(((Number(prize.weight) || 0) / total) * 100) : null,
          endIso: wheel.endDate || null,
        });
      });
    });

    return { season: seasonList, wheel: wheelList };
  }, [activeSeason, wheelData, claimListFor]);

  // Resolve the saved goal against what is live right now.
  const goal = useMemo(() => {
    if (!saved) return null;

    if (saved.kind === 'season') {
      const owner = seasons.find((s) => s.id === saved.seasonId) || null;
      if (!owner) return { ...saved, state: 'gone' };
      const index = (owner.rewards || []).findIndex((r) => rewardKeyOf(r) === saved.rewardId);
      if (index < 0) return { ...saved, state: 'removed', owner };
      const reward = owner.rewards[index];
      const claimed = isRewardClaimed(claimListFor(owner.id), owner.id, reward, index);
      const ended = getSeasonStatus(owner, new Date()) === 'ended';
      return {
        ...saved,
        state: claimed ? 'claimed' : ended ? 'ended' : 'active',
        owner,
        reward,
        index,
        lane: getRewardLane(reward, index),
        xpRequired: Number(reward.xpRequired) || 0,
        type: reward.type,
        value: reward.value || null,
        label: reward.name || saved.label || null,
      };
    }

    if (saved.kind === 'wheel') {
      const resolved = saved.destination === 'bonus' ? wheelData?.bonus : wheelData?.daily;
      const wheel = resolved?.wheel;
      if (!wheel || wheel.id !== saved.wheelId) return { ...saved, state: 'notRunning' };
      const prize = (wheel.prizes || []).find((p) => prizeKeyOf(p) === saved.prizeKey);
      if (!prize) return { ...saved, state: 'removed', wheel };
      const weights = (wheel.prizes || []).filter((p) => (Number(p.weight) || 0) > 0);
      const total = weights.reduce((sum, p) => sum + (Number(p.weight) || 0), 0);
      return {
        ...saved,
        state: 'active',
        wheel,
        prize,
        chance: total > 0 ? Math.round(((Number(prize.weight) || 0) / total) * 100) : null,
        label: prize.label || prize.name || saved.label || null,
      };
    }

    return null;
  }, [saved, seasons, wheelData, claimListFor]);

  const openPicker = async () => {
    setPickerOpen(true);
    if (Object.keys(catalogs).length === 0) {
      try {
        setCatalogs(await loadAssetCatalogs());
      } catch {
        setCatalogs({});
      }
    }
  };

  const handleSelect = (candidate) => {
    const payload = {
      kind: candidate.kind,
      seasonId: candidate.seasonId || null,
      rewardId: candidate.rewardId || null,
      wheelId: candidate.wheelId || null,
      destination: candidate.destination || null,
      prizeKey: candidate.prizeKey || null,
      type: candidate.type || null,
      value: candidate.value || null,
      amount: candidate.amount || null,
      label: candidate.label || null,
      savedAt: new Date().toISOString(),
    };
    const result = writeWidgetPref(profileId, PREF_KEYS.rewardGoal, payload);
    if (result.ok) {
      setSaved(payload);
      setPickerOpen(false);
    }
  };

  const asset = goal
    ? describeAsset(goal.type, goal.value, catalogs, {
        amount: goal.amount,
        label: goal.label || REWARD_KIND_LABELS[goal.type] || 'Reward',
      })
    : null;

  const xpNow = Number(profile?.xp) || 0;
  const pct = goal?.state === 'active' && goal.xpRequired > 0
    ? Math.min(100, Math.round((xpNow / goal.xpRequired) * 100))
    : 0;
  const remainingXp = goal?.state === 'active' ? Math.max(0, goal.xpRequired - xpNow) : 0;
  const readyToClaim = goal?.state === 'active' && goal.kind === 'season' && goal.xpRequired > 0 && xpNow >= goal.xpRequired;
  const plusRequired = goal?.kind === 'season' && goal.lane === 'plus';
  const hasPlus = isPlusActive(profile);
  const sourceLink = goal?.kind === 'wheel' ? '/Rewards?tab=daily' : '/Season';

  return (
    <WidgetShell
      icon={Target}
      title="Pick Your Next Reward"
      loading={loading}
      error={error}
      onRetry={load}
      empty={!loading && !error && !goal ? 'No reward chosen yet' : null}
      emptyHint={!loading && !error && !goal ? 'Follow one reward and track how close you are.' : null}
      emptyAction={
        !loading && !error && !goal ? (
          <button
            type="button"
            onClick={openPicker}
            className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            <Target className="w-4 h-4" aria-hidden="true" /> Choose a reward
          </button>
        ) : null
      }
    >
      {goal && asset ? (
        <>
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-white/60 border border-white/50 flex items-center justify-center text-xl shrink-0" aria-hidden="true">
              {asset.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800 truncate">{asset.label}</p>
              <p className="text-[11px] text-slate-500 truncate">
                {goal.kind === 'season'
                  ? `1Pass · ${goal.owner?.name || 'Season'}`
                  : `${goal.destination === 'bonus' ? 'Bonus spins' : 'Daily wheel'} · ${goal.wheel?.name || 'Wheel'}`}
              </p>
            </div>
            {goal.state === 'claimed' ? (
              <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 border border-emerald-200/70 rounded-full px-2 py-0.5">
                <CheckCircle2 className="w-3 h-3" aria-hidden="true" /> Collected
              </span>
            ) : null}
          </div>

          {goal.state === 'active' && goal.kind === 'season' ? (
            <div className="mt-3">
              <div className="h-2 rounded-full bg-white/40 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">
                {goal.xpRequired > 0
                  ? `${xpNow} / ${goal.xpRequired} XP${readyToClaim ? ' — ready to claim!' : ` · ${remainingXp} XP to go`}`
                  : 'No XP requirement set for this reward'}
              </p>
            </div>
          ) : null}

          {goal.state === 'active' && goal.kind === 'wheel' ? (
            <p className="text-[11px] text-slate-600 mt-2.5">
              Chance-based prize{typeof goal.chance === 'number' ? ` · ≈${goal.chance}% chance` : ''} — spin the wheel to try for it.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {plusRequired ? (
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 border ${
                hasPlus
                  ? 'text-purple-700 bg-purple-100/80 border-purple-200/70'
                  : 'text-slate-600 bg-white/70 border-white/70'
              }`}>
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                {hasPlus ? '1Pass Plus · active' : 'Requires 1Pass Plus'}
              </span>
            ) : null}
            {goal.kind === 'season' && goal.owner?.endDate ? (
              <span className="text-[10px] text-slate-500 bg-white/60 border border-white/60 rounded-full px-2 py-0.5">
                Season ends {formatDayShort(goal.owner.endDate)}
              </span>
            ) : null}
            {goal.kind === 'wheel' && goal.endIso ? (
              <span className="text-[10px] text-slate-500 bg-white/60 border border-white/60 rounded-full px-2 py-0.5">
                Ends {formatDayShort(goal.endIso.slice(0, 10))}
              </span>
            ) : null}
          </div>

          {(goal.state === 'gone' || goal.state === 'removed' || goal.state === 'notRunning' || goal.state === 'ended') ? (
            <p className="flex items-start gap-1.5 text-xs text-amber-700 mt-2.5">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
              {goal.state === 'gone'
                ? 'That season is no longer available.'
                : goal.state === 'removed'
                  ? 'That reward was removed from its source.'
                  : goal.state === 'notRunning'
                    ? "That wheel isn't running right now."
                    : 'That season has ended.'}
            </p>
          ) : null}

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={openPicker}
              className="flex-1 rounded-xl border border-indigo-200 bg-white/80 hover:bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-2"
            >
              Change goal
            </button>
            {(goal.state === 'active' || goal.state === 'claimed') ? (
              <Link
                to={sourceLink}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2"
              >
                View source <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </>
      ) : null}

      <RewardGoalPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        candidates={candidates}
        catalogs={catalogs}
        onSelect={handleSelect}
        savedGoal={saved}
      />
    </WidgetShell>
  );
}