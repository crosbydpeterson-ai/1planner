// Season Studio shared logic — publication state, reward lanes, stable reward
// identity, XP planning and validation. Pure functions only (no React, no I/O)
// so the admin studio, the student pages and fixtures all agree on the rules.

import { getSeasonStatus, parseSeasonDate, selectOnePassSeason } from '@/lib/seasonUtils';

export const LANES = ['free', 'plus'];
export const PUBLISHED_STATES = ['scheduled', 'live'];
export const PUBLISH_STATUSES = ['draft', 'scheduled', 'live', 'archived'];

// Every reward type the app actually grants (Season.jsx understands all of them).
export const REWARD_TYPES = {
  pet: { label: 'Pet', icon: '🐾', asset: 'pets', needsValue: true },
  theme: { label: 'Theme', icon: '🎨', asset: 'themes', needsValue: true },
  title: { label: 'Title', icon: '🏆', asset: 'titles', needsValue: true },
  coins: { label: 'Quest Coins', icon: '🪙', asset: 'amount', needsValue: true },
  magic_egg: { label: 'Magic Egg', icon: '🥚', asset: 'none', needsValue: false },
  food: { label: 'Food', icon: '🍽️', asset: 'foods', needsValue: true },
  song: { label: 'Song', icon: '🎵', asset: 'tracks', needsValue: true },
  playlist: { label: 'Playlist', icon: '🎶', asset: 'playlists', needsValue: true },
};
export const REWARD_TYPE_LIST = Object.keys(REWARD_TYPES);

export const STATE_STYLES = {
  draft: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  scheduled: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  live: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  ended: 'bg-slate-600/30 text-slate-300 border-slate-500/30',
  archived: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
};

// --- publication state ----------------------------------------------------

/**
 * Publication state of a stored season. Seasons created before the Studio have
 * no `status`, so they fall back to the flag the student pages already use:
 * isActive true → published, false → draft.
 */
export function getPublishState(season) {
  const status = season?.status;
  if (PUBLISH_STATUSES.includes(status)) return status;
  return season?.isActive ? 'live' : 'draft';
}

export const isPublishedSeason = (season) => PUBLISHED_STATES.includes(getPublishState(season));

/** The single rule the student pages use to decide a season is selectable. */
export function isSeasonVisibleToStudents(season) {
  return isPublishedSeason(season) && season?.isActive !== false;
}

/** Status to store when publishing: live once the start date has arrived. */
export function statusForDates(startDate, now) {
  const start = parseSeasonDate(startDate);
  return start && now && start > now ? 'scheduled' : 'live';
}

/**
 * Display state: the stored status decides whether students can see the season
 * at all, the dates decide whether it reads Live, Scheduled or Ended.
 */
export function getSeasonWorkflow(season, now) {
  const stored = getPublishState(season);
  const dates = getSeasonStatus(season, now);
  const studentVisible = isSeasonVisibleToStudents(season);
  if (stored === 'archived') {
    return { state: 'archived', label: 'Archived', published: false, studentVisible: false, inSeasonBook: dates === 'ended' };
  }
  if (stored === 'draft') {
    return { state: 'draft', label: 'Draft', published: false, studentVisible: false, inSeasonBook: false };
  }
  if (dates === 'current') return { state: 'live', label: 'Live', published: true, studentVisible, inSeasonBook: true };
  if (dates === 'upcoming') return { state: 'scheduled', label: 'Scheduled', published: true, studentVisible, inSeasonBook: false };
  return { state: 'ended', label: 'Ended', published: true, studentVisible: false, inSeasonBook: true };
}

// --- reward lanes ---------------------------------------------------------

/**
 * Lane of one reward. Seasons written by the Studio carry an explicit `lane`;
 * older seasons alternate Free / Plus by array position, which is the rule the
 * student pages used before, so they keep rendering exactly as they did.
 */
export function getRewardLane(reward, index) {
  if (reward?.lane === 'free' || reward?.lane === 'plus') return reward.lane;
  return index % 2 === 1 ? 'plus' : 'free';
}

/** Split a season's rewards into lanes, keeping each reward's flat index. */
export function getSeasonRewardLanes(season) {
  const free = [];
  const plus = [];
  (season?.rewards || []).forEach((reward, index) => {
    const lane = getRewardLane(reward, index);
    (lane === 'plus' ? plus : free).push({ reward, index, lane });
  });
  return { free, plus };
}

// --- reward identity ------------------------------------------------------

export function makeRewardId() {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Give ids only to rewards that have none — never regenerate existing ids. */
export function ensureRewardIds(rewards = []) {
  return (rewards || []).map((reward) => (reward?.id ? reward : { ...reward, id: makeRewardId() }));
}

const claimValue = (reward) => reward?.value || reward?.name || 'reward';

/** The pre-Studio key: season + array index + type + value. */
export function legacyClaimKey(seasonId, reward, index) {
  return `${seasonId}:${index}:${reward?.type}:${claimValue(reward)}`;
}

/** The key new claims are stored under: season + stable reward id. */
export function stableClaimKey(seasonId, reward) {
  return reward?.id ? `${seasonId}:r:${reward.id}` : null;
}

export function claimKeysForReward(seasonId, reward, index) {
  const stable = stableClaimKey(seasonId, reward);
  return stable ? [stable, legacyClaimKey(seasonId, reward, index)] : [legacyClaimKey(seasonId, reward, index)];
}

export function claimKeyForStorage(seasonId, reward, index) {
  return stableClaimKey(seasonId, reward) || legacyClaimKey(seasonId, reward, index);
}

/**
 * Has this reward already been claimed? Matches the stable key, the exact
 * legacy key, and — because a legacy key embeds the array index that reordering
 * changes — any legacy key for this season with the same type and value.
 */
export function isRewardClaimed(claimedKeys, seasonId, reward, index) {
  if (!reward) return false;
  const keys = claimKeysForReward(seasonId, reward, index);
  if (keys.some((key) => (claimedKeys || []).includes(key))) return true;
  const suffix = `${reward.type}:${claimValue(reward)}`;
  return (claimedKeys || []).some(
    (key) =>
      typeof key === 'string' &&
      key.startsWith(`${seasonId}:`) &&
      !key.includes(':r:') &&
      key.slice(seasonId.length + 1).replace(/^\d+:/, '') === suffix
  );
}

/** Which claimed rewards a draft would remove or change (blocks publishing). */
export function findClaimedChanges(season, tierList, claimedKeys) {
  const seasonId = season?.id;
  if (!seasonId) return [];
  const drafted = tiersToRewards(tierList || []);
  const changes = [];
  (season?.rewards || []).forEach((reward, index) => {
    if (!isRewardClaimed([...(claimedKeys || [])], seasonId, reward, index)) return;
    const match = drafted.find(
      (candidate) =>
        (reward.id && candidate.id === reward.id) ||
        (!reward.id && candidate.type === reward.type && String(candidate.value) === String(reward.value))
    );
    const label = reward.name || reward.value || reward.type;
    if (!match) changes.push({ label, reason: 'it was removed' });
    else if (match.type !== reward.type || String(match.value) !== String(reward.value)) {
      changes.push({ label, reason: 'the reward it hands out changed' });
    }
  });
  return changes;
}

/** Claim keys per season, across every profile — used to protect live rewards. */
export function buildSeasonClaimIndex(profiles = []) {
  const index = {};
  (profiles || []).forEach((profile) => {
    const bySeason = profile?.claimedSeasonRewardsBySeason || {};
    Object.keys(bySeason).forEach((seasonId) => {
      const list = Array.isArray(bySeason[seasonId]) ? bySeason[seasonId] : [];
      if (!index[seasonId]) index[seasonId] = new Set();
      list.forEach((key) => index[seasonId].add(key));
    });
  });
  return index;
}

// --- tiers ----------------------------------------------------------------

/** Group a season's rewards into tier rows: one XP threshold, Free + Plus slots. */
export function buildTiers(rewards = []) {
  const lanes = getSeasonRewardLanes({ rewards });
  const byThreshold = new Map();
  const tierFor = (xpRequired) => {
    if (!byThreshold.has(xpRequired)) byThreshold.set(xpRequired, { xpRequired, free: [], plus: [] });
    return byThreshold.get(xpRequired);
  };
  [...lanes.free, ...lanes.plus].forEach(({ reward, index, lane }) => {
    const threshold = Number(reward.xpRequired) || 0;
    tierFor(threshold)[lane].push({ ...reward, _index: index });
  });
  // Stable key per tier (taken from its own rewards) so editing a threshold never
  // re-mounts the row and steals focus from the field being typed in.
  return [...byThreshold.values()]
    .sort((a, b) => (Number(a.xpRequired) || 0) - (Number(b.xpRequired) || 0))
    .map((tier, index) => ({ ...tier, key: tier.free[0]?.id || tier.plus[0]?.id || `tier-${index}` }));
}

export function rewardsToTiers(rewards = []) {
  return buildTiers(ensureRewardIds(rewards));
}

/** Flatten tier rows back into the stored reward array. */
export function tiersToRewards(tiers = []) {
  const rewards = [];
  (tiers || []).forEach((tier) => {
    LANES.forEach((lane) => {
      (tier?.[lane] || []).forEach((slot) => {
        const { _index, ...reward } = slot;
        rewards.push({
          ...reward,
          id: reward.id || makeRewardId(),
          lane,
          xpRequired: Number(tier.xpRequired) || 0,
        });
      });
    });
  });
  return rewards;
}

export function countLaneSlots(tiers = []) {
  const counts = { free: 0, plus: 0 };
  (tiers || []).forEach((tier) => LANES.forEach((lane) => { counts[lane] += (tier?.[lane] || []).length; }));
  return counts;
}

// --- XP planning ----------------------------------------------------------

export function buildXpPlan(tiers = [], xpPerQuest = 25) {
  const perQuest = Number(xpPerQuest) > 0 ? Number(xpPerQuest) : 25;
  const invalid = [];
  const thresholds = [];
  const perLane = { free: {}, plus: {} };

  (tiers || []).forEach((tier) => {
    const xp = Number(tier?.xpRequired);
    if (!Number.isFinite(xp) || xp <= 0) {
      invalid.push(tier?.xpRequired);
    } else {
      thresholds.push(xp);
      LANES.forEach((lane) =>
        (tier?.[lane] || []).forEach(() => {
          perLane[lane][xp] = (perLane[lane][xp] || 0) + 1;
        })
      );
    }
  });

  const unique = [...new Set(thresholds)].sort((a, b) => a - b);
  let previous = 0;
  const rows = unique.map((xpRequired) => {
    const gap = xpRequired - previous;
    const row = {
      xpRequired,
      gap,
      quests: Math.ceil(gap / perQuest),
      cumulativeQuests: Math.ceil(xpRequired / perQuest),
    };
    previous = xpRequired;
    return row;
  });

  const duplicates = [];
  LANES.forEach((lane) =>
    Object.entries(perLane[lane]).forEach(([xp, count]) => {
      if (count > 1) duplicates.push({ lane, xpRequired: Number(xp), count });
    })
  );

  const finalXp = unique.length ? unique[unique.length - 1] : 0;
  return { finalXp, rows, invalid, duplicates, xpPerQuest: perQuest, totalQuests: Math.ceil(finalXp / perQuest) };
}

// --- assets and validation ------------------------------------------------

export function buildAssetIndex({ pets = [], themes = [], tracks = [], playlists = [], foods = [] } = {}) {
  return {
    pets: new Set(pets.map((item) => item.id)),
    themes: new Set(themes.map((item) => item.id)),
    tracks: new Set(tracks.map((item) => item.id)),
    playlists: new Set(playlists.map((item) => item.id)),
    foods: new Set(foods.map((item) => item.id)),
  };
}

export const isPendingValue = (reward) =>
  typeof reward?.value === 'string' && reward.value.startsWith('pending_');

const ASSET_KINDS = { pets: 'pet', themes: 'theme', tracks: 'song', playlists: 'playlist', foods: 'food' };

/** Name + dates only — what a draft needs before it can be stored at all. */
export function validateBasics(draft) {
  const errors = [];
  if (!String(draft?.name || '').trim()) errors.push('Give the season a name.');
  const start = parseSeasonDate(draft?.startDate);
  const end = parseSeasonDate(draft?.endDate);
  if (!start) errors.push('Pick a valid start date.');
  if (!end) errors.push('Pick a valid end date.');
  if (start && end && end < start) errors.push('The end date must be on or after the start date.');
  return { errors };
}

/** Full reward validation — thresholds, types, asset references, generation. */
export function validateSeasonDraft(draft, { assets } = {}) {
  const { errors } = validateBasics(draft);
  const warnings = [];
  const tiers = draft?.tiers || [];
  let slotCount = 0;

  if (tiers.length === 0) warnings.push('No rewards yet — students would see an empty 1Pass.');

  tiers.forEach((tier, tierIndex) => {
    const xp = Number(tier?.xpRequired);
    if (!Number.isFinite(xp) || xp <= 0) {
      errors.push(`Tier ${tierIndex + 1}: the XP threshold must be a number above 0.`);
    }
    LANES.forEach((lane) => {
      (tier?.[lane] || []).forEach((slot) => {
        slotCount += 1;
        const where = `Tier ${tierIndex + 1} ${lane === 'plus' ? '1Pass Plus' : 'Free'}`;
        const meta = REWARD_TYPES[slot?.type];
        if (!meta) {
          errors.push(`${where}: pick a reward type.`);
          return;
        }
        if (!meta.needsValue) return;
        const value = String(slot?.value ?? '').trim();
        if (slot?.type === 'coins') {
          const amount = parseInt(value, 10);
          if (!Number.isFinite(amount) || amount <= 0) errors.push(`${where}: coin rewards need an amount above 0.`);
          return;
        }
        if (!value) {
          errors.push(`${where}: choose the ${meta.label.toLowerCase()} this reward grants.`);
          return;
        }
        if (isPendingValue(slot)) {
          errors.push(`${where}: this reward is still being generated (${value}) — pick a finished asset.`);
          return;
        }
        if (assets && ASSET_KINDS[meta.asset]) {
          const pool = assets[meta.asset];
          if (pool && !pool.has(value)) {
            errors.push(`${where}: that ${meta.label.toLowerCase()} no longer exists — pick another.`);
          }
        }
      });
    });
  });

  if (slotCount === 0 && tiers.length > 0) warnings.push('No rewards placed yet — add a Free and a Plus reward per tier.');
  return { errors, warnings, slotCount };
}

export function findPublishedOverlaps(candidate, allSeasons = []) {
  const start = parseSeasonDate(candidate?.startDate);
  const end = parseSeasonDate(candidate?.endDate);
  if (!start || !end) return [];
  return (allSeasons || [])
    .filter((season) => season.id !== candidate.id && isPublishedSeason(season) && getPublishState(season) !== 'archived')
    .filter((season) => {
      const seasonStart = parseSeasonDate(season.startDate);
      const seasonEnd = parseSeasonDate(season.endDate);
      return seasonStart && seasonEnd && start <= seasonEnd && seasonStart <= end;
    });
}

/** How the app decides which season students see, in plain language. */
export function explainStudentSelection(allSeasons = [], now) {
  const published = (allSeasons || []).filter((season) => isSeasonVisibleToStudents(season));
  const shown = selectOnePassSeason(published, now);
  if (!shown) return 'No published season covers today, so students see no 1Pass until one is published.';
  return `Students currently see "${shown.name}": the first published season covering today, otherwise the next one to start.`;
}

/** Publish-time check: everything above, plus claims and overlapping seasons. */
export function validateForPublish(draft, { assets, allSeasons = [], now, claimedKeys, originalSeason } = {}) {
  const base = validateSeasonDraft(draft, { assets });
  const errors = [...base.errors];
  const warnings = [...base.warnings];

  const changes = originalSeason?.id ? findClaimedChanges(originalSeason, draft?.tiers, claimedKeys) : [];
  changes.forEach((change) => {
    errors.push(`"${change.label}" ${change.reason}, and students have already claimed it. Duplicate this season into a draft to make that change safely.`);
  });

  const overlaps = findPublishedOverlaps({ ...draft, id: originalSeason?.id }, allSeasons);
  if (overlaps.length) {
    warnings.push(
      `Published season dates overlap: ${overlaps.map((season) => season.name).join(', ')}. Keep published ranges apart so the choice is predictable.`
    );
  }

  return { ...base, errors, warnings, overlaps, selectionNote: explainStudentSelection(allSeasons, now) };
}

// --- drafts ---------------------------------------------------------------

export function seasonToDraft(season) {
  return {
    id: season?.id || null,
    name: season?.name || '',
    description: season?.description || '',
    startDate: season?.startDate || '',
    endDate: season?.endDate || '',
    artworkUrl: season?.artworkUrl || '',
    xpPerQuest: Number(season?.xpPerQuest) > 0 ? Number(season.xpPerQuest) : 25,
    status: getPublishState(season),
    linkedEventIds: season?.linkedEventIds || [],
    linkedWheelIds: season?.linkedWheelIds || [],
    tiers: rewardsToTiers(season?.rewards || []),
  };
}

export function newSeasonDraft(now) {
  const start = now ? new Date(now.getTime()) : new Date();
  const end = new Date(start.getTime());
  end.setDate(end.getDate() + 27);
  const iso = (date) => date.toISOString().slice(0, 10);
  return {
    id: null,
    name: '',
    description: '',
    startDate: iso(start),
    endDate: iso(end),
    artworkUrl: '',
    xpPerQuest: 25,
    status: 'draft',
    linkedEventIds: [],
    linkedWheelIds: [],
    tiers: [],
  };
}

/** A copy for editing without touching a season students are claiming from. */
export function duplicateSeasonDraft(season) {
  const fresh = (season?.rewards || []).map(({ id, ...rest }) => rest);
  return {
    ...seasonToDraft({ ...season, id: null, rewards: fresh }),
    id: null,
    name: `${season?.name || 'Season'} (Copy)`,
    status: 'draft',
  };
}

export function draftToPayload(draft, status) {
  return {
    name: String(draft?.name || '').trim(),
    description: draft?.description || '',
    startDate: draft?.startDate || '',
    endDate: draft?.endDate || '',
    artworkUrl: draft?.artworkUrl || '',
    xpPerQuest: Number(draft?.xpPerQuest) > 0 ? Number(draft.xpPerQuest) : 25,
    linkedEventIds: draft?.linkedEventIds || [],
    linkedWheelIds: draft?.linkedWheelIds || [],
    status,
    isActive: PUBLISHED_STATES.includes(status),
    rewards: tiersToRewards(draft?.tiers || []),
  };
}