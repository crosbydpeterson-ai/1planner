/**
 * Raffle rules, kept pure so they can be exercised on their own.
 *
 * Nothing in this file reads or writes the database: eligibility, the frozen
 * draw order, progress, consistency checks and the student's view of a raffle
 * are all plain functions over data that was already loaded.
 *
 * Two ideas hold the feature together:
 *  - The entry list is frozen when an admin locks the raffle (`participants`).
 *  - The draw order is built once from a stored `seed` (`plan`). Draws always
 *    continue from the first unsaved position, so refreshing, retrying or
 *    clicking twice can never reroll or replace a saved winner.
 */

export const RAFFLE_STATUS = {
  DRAFT: 'draft',
  READY: 'ready',
  DRAWING: 'drawing',
  COMPLETED: 'completed',
};

/** Plan entry kinds. */
export const KIND = {
  PRIZE: 'prize', // won from the configured prize pool
  EVERYONE: 'everyone', // the base reward every eligible student receives
};

export const DELIVERY = {
  PENDING: 'pending',
  DELIVERING: 'delivering',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  NEEDS_REVIEW: 'needs_review',
};

export const PRIZE_MODES = [
  {
    key: 'limited',
    label: 'Limited winners',
    description: 'Only the drawn students receive a prize.',
  },
  {
    key: 'everyone',
    label: 'Everyone wins',
    description: 'Every eligible student receives a prize — the base reward covers anyone the prize pool cannot.',
  },
  {
    key: 'everyone_plus',
    label: 'Base reward + drawn prizes',
    description: 'Everyone receives the base reward, then the extra prizes are drawn on top.',
  },
];

export const FEATURES = [
  { key: 'games', label: '🎮 Games' },
  { key: 'shop', label: '🛍️ Shop' },
  { key: 'market', label: '💰 Marketplace' },
  { key: 'pets', label: '🐾 Pets & Rewards' },
  { key: 'battlePass', label: '✨ 1Pass' },
  { key: 'kitchen', label: '🍳 Kitchen' },
];

/**
 * The prize types a raffle can give out. These are exactly the reward types the
 * existing code redemption understands, so delivery reuses that path instead of
 * inventing a second way to grant rewards.
 */
export const PRIZE_TYPES = [
  { key: 'xp', label: 'XP', emoji: '⚡' },
  { key: 'coins', label: 'Quest Coins', emoji: '🪙' },
  { key: 'pet', label: 'Pet', emoji: '🐾' },
  { key: 'title', label: 'Title', emoji: '🏷️' },
  { key: 'feature_unlock', label: 'Feature unlock', emoji: '🔓' },
  { key: 'food_item', label: 'Food item', emoji: '🍎' },
  { key: 'onepassplus', label: '1Pass Plus', emoji: '⭐', superAdminOnly: true },
];

export const prizeEmoji = (rewardType) =>
  PRIZE_TYPES.find((t) => t.key === rewardType)?.emoji || '🎁';

export const prizeTypeLabel = (rewardType) =>
  PRIZE_TYPES.find((t) => t.key === rewardType)?.label || 'Prize';

export const isSuperAdminOnlyPrize = (rewardType) =>
  !!PRIZE_TYPES.find((t) => t.key === rewardType)?.superAdminOnly;

const toList = (value) => (Array.isArray(value) ? value : []);

/** `math:<teacherId>` style class keys, matching the rest of the app. */
export const classKeyOf = (subject, teacherId) => `${subject}:${teacherId || ''}`;

/** The teacher a student is assigned to for a subject, using existing profile fields. */
export function teacherIdForSubject(profile, subject) {
  if (!profile) return '';
  if (subject === 'math') return profile.mathTeacher || '';
  if (subject === 'reading') return profile.readingTeacher || '';
  return (profile.subjectAssignments || {})[subject] || '';
}

/** Every class key a profile belongs to. */
export function classKeysForProfile(profile) {
  const keys = [];
  if (profile?.mathTeacher) keys.push(classKeyOf('math', profile.mathTeacher));
  if (profile?.readingTeacher) keys.push(classKeyOf('reading', profile.readingTeacher));
  Object.entries(profile?.subjectAssignments || {}).forEach(([slug, teacherId]) => {
    if (teacherId) keys.push(classKeyOf(slug, teacherId));
  });
  return keys;
}

/**
 * Who gets one automatic entry. Banned profiles are left out, and a student
 * with no class for the chosen subject simply is not eligible.
 */
export function resolveEligibleProfiles(profiles, eligibility = {}) {
  const all = toList(profiles).filter((p) => p && p.id);
  const usable = all.filter((p) => !p.isBanned);
  const scope = eligibility.scope || 'everyone';

  if (scope === 'class') {
    const subject = eligibility.subject || 'math';
    const teacherId = eligibility.teacherId || '';
    const eligible = usable.filter((p) => teacherIdForSubject(p, subject) === teacherId);
    return { eligible, scope, subject, teacherId, excludedBanned: all.length - usable.length };
  }

  if (scope === 'profiles') {
    const ids = new Set(toList(eligibility.profileIds));
    return {
      eligible: usable.filter((p) => ids.has(p.id)),
      scope,
      excludedBanned: all.length - usable.length,
    };
  }

  return { eligible: usable, scope: 'everyone', excludedBanned: all.length - usable.length };
}

/** One entry per student, ordered by username so the frozen list is stable. */
export function buildEntries(profiles) {
  const seen = new Set();
  const entries = [];
  toList(profiles)
    .filter((p) => p && p.id)
    .slice()
    .sort((a, b) => String(a.username || '').localeCompare(String(b.username || '')))
    .forEach((p) => {
      if (seen.has(p.id)) return; // a student can only be entered once
      seen.add(p.id);
      entries.push({ profileId: p.id, username: p.username || 'Student' });
    });
  return entries;
}

// ── random ──────────────────────────────────────────────────

/** Small deterministic generator: the same seed always rebuilds the same plan. */
export function mulberry32(seed) {
  let a = Number(seed) >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSeed() {
  return Math.floor(Math.random() * 2147483647) + 1;
}

export function shuffle(list, rng) {
  const out = toList(list).slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function randomCode(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
  const bytes = cryptoObj?.getRandomValues ? cryptoObj.getRandomValues(new Uint8Array(length)) : null;
  for (let i = 0; i < length; i++) {
    const n = bytes ? bytes[i] : Math.floor(Math.random() * 256);
    out += chars[n % chars.length];
  }
  return `RF${out}`;
}

export const maskCode = (code) =>
  typeof code === 'string' && code.length > 4 ? `${code.slice(0, 2)}••••${code.slice(-3)}` : '••••';

// ── prizes ──────────────────────────────────────────────────

/** The payload shape RedeemCode stores, so a prize can become a redeem code. */
export function normalizedRewardData(prize) {
  const rd = prize?.rewardData || {};
  switch (prize?.rewardType) {
    case 'xp':
    case 'coins':
      return { amount: Number(rd.amount) || 0 };
    case 'pet':
      return { petId: rd.petId || '' };
    case 'title':
      return { title: typeof rd.title === 'string' ? rd.title.trim() : '' };
    case 'feature_unlock':
      return { feature: rd.feature || '' };
    case 'food_item':
      return { itemId: rd.itemId || '', quantity: Number(rd.quantity) || 1 };
    case 'onepassplus':
      return Number(rd.seasons) > 0 ? { seasons: Number(rd.seasons) } : {};
    default:
      return {};
  }
}

/** What the student sees, e.g. "⚡ +250 XP" or "🐾 Math Cat". */
export function describePrize(prize) {
  if (!prize) return 'Prize';
  if (prize.label && String(prize.label).trim()) return String(prize.label).trim();
  const rd = normalizedRewardData(prize);
  switch (prize.rewardType) {
    case 'xp':
      return `+${rd.amount} XP`;
    case 'coins':
      return `+${rd.amount} Quest Coins`;
    case 'food_item':
      return `Food item ×${rd.quantity}`;
    case 'title':
      return rd.title ? `Title: ${rd.title}` : 'Title';
    case 'feature_unlock':
      return `${FEATURES.find((f) => f.key === rd.feature)?.label || 'Feature'} unlock`;
    case 'onepassplus':
      return rd.seasons ? `1Pass Plus (${rd.seasons} season${rd.seasons > 1 ? 's' : ''})` : '1Pass Plus';
    case 'pet':
      return 'A pet';
    default:
      return 'Prize';
  }
}

/**
 * Structure check for one prize. `knownPetIds` lets the caller (which has the
 * pet catalog) catch a pet that no longer exists; when it is omitted only the
 * shape is checked.
 */
export function validatePrize(prize, { knownPetIds = null, label = 'This prize', requireQuantity = true } = {}) {
  if (!prize) return `${label} is empty.`;
  if (!prize.rewardType) return `${label} has no reward type.`;
  if (!PRIZE_TYPES.some((t) => t.key === prize.rewardType)) {
    return `${label} uses a reward type that no longer exists.`;
  }
  // A quantity only applies to the prize list; the base reward is defined once
  // and handed to each student.
  if (requireQuantity && !(Number(prize.quantity) >= 1)) return `${label} needs a quantity of at least 1.`;

  const rd = normalizedRewardData(prize);
  switch (prize.rewardType) {
    case 'xp':
    case 'coins':
      return rd.amount > 0 ? null : `${label} needs an amount above 0.`;
    case 'pet':
      if (!rd.petId) return `${label} needs a pet.`;
      if (knownPetIds && !knownPetIds.includes(rd.petId)) return `${label} points at a pet that no longer exists.`;
      return null;
    case 'title':
      return rd.title ? null : `${label} needs the title text.`;
    case 'feature_unlock':
      return rd.feature ? null : `${label} needs a feature to unlock.`;
    case 'food_item':
      return rd.itemId ? null : `${label} needs a food item.`;
    case 'onepassplus':
      return null; // an empty payload is the long-standing permanent grant
    default:
      return `${label} is not set up correctly.`;
  }
}

const prizeSlotsOf = (prizes) => {
  const slots = [];
  toList(prizes).forEach((prize) => {
    const qty = Math.max(0, Math.floor(Number(prize?.quantity) || 0));
    for (let i = 0; i < qty; i++) slots.push({ prizeId: prize.id, rewardType: prize.rewardType });
  });
  return slots;
};

export const totalPrizeSlots = (prizes) => prizeSlotsOf(prizes).length;

/**
 * What must be true before the raffle can be locked and drawn. Errors block the
 * draw; warnings are things an admin should read but that still work.
 */
export function validateRaffle({
  prizes = [],
  prizeMode = 'limited',
  allowMultipleWins = false,
  participantCount = 0,
  fallbackReward = null,
  knownPetIds = null,
} = {}) {
  const errors = [];
  const warnings = [];
  const slots = totalPrizeSlots(prizes);

  if (participantCount === 0) errors.push('No eligible students match the current eligibility settings.');

  const filled = toList(prizes).filter((p) => p && p.rewardType);
  filled.forEach((prize, i) => {
    const err = validatePrize(prize, { knownPetIds, label: `Prize ${i + 1} (${describePrize(prize)})` });
    if (err) errors.push(err);
  });

  if (prizeMode === 'limited') {
    if (slots === 0) errors.push('Limited winners needs at least one prize.');
    if (!allowMultipleWins && slots > participantCount) {
      errors.push(
        `You configured ${slots} prize${slots > 1 ? 's' : ''} but only ${participantCount} student${
          participantCount === 1 ? '' : 's'
        } are eligible. Lower the prize quantities, or turn on "a student can win more than once".`
      );
    }
    if (allowMultipleWins && participantCount > 0 && slots > participantCount) {
      warnings.push('Some students will win more than one prize because "win more than once" is on.');
    }
  }

  if (prizeMode === 'everyone' || prizeMode === 'everyone_plus') {
    const base = fallbackReward && fallbackReward.rewardType ? fallbackReward : null;
    const baseError = base
      ? validatePrize(base, { knownPetIds, label: 'The base reward', requireQuantity: false })
      : null;
    if (baseError) errors.push(baseError);
    if (base && ['pet', 'title', 'feature_unlock'].includes(base.rewardType)) {
      warnings.push(
        'A base reward such as a pet, title or feature can only be owned once, so it may not deliver to students who already have it. XP or coins always deliver.'
      );
    }

    if (prizeMode === 'everyone' && !base && slots < participantCount) {
      errors.push(
        `Everyone wins needs a prize for all ${participantCount} students, but only ${slots} ${
          slots === 1 ? 'is' : 'are'
        } configured. Raise the quantities or set the base reward everyone receives.`
      );
    }
    if (prizeMode === 'everyone' && base && slots < participantCount) {
      warnings.push(
        `${participantCount - slots} student${participantCount - slots === 1 ? '' : 's'} will receive the base reward (${describePrize(
          base
        )}) instead of a drawn prize.`
      );
    }
    if (prizeMode === 'everyone' && !base && slots > participantCount) {
      warnings.push('More prizes are configured than there are students; the extra prizes will not be given out.');
    }
    if (prizeMode === 'everyone_plus' && !base) {
      errors.push('This mode needs the base reward everyone receives.');
    }
    if (prizeMode === 'everyone_plus' && slots === 0) {
      warnings.push('No extra prizes are configured, so everyone will simply receive the base reward.');
    }
  }

  return { errors, warnings };
}

/** Configured prizes by id, plus the base reward under its own id. */
export function prizeIndex(raffle) {
  const map = {};
  toList(raffle?.prizes).forEach((p) => {
    if (p?.id) map[p.id] = p;
  });
  const base = raffle?.fallbackReward;
  if (base?.id) map[base.id] = base;
  return map;
}

export const prizeForEntry = (raffle, entry) => prizeIndex(raffle)[entry?.prizeId] || null;

/**
 * Build the frozen draw order. Deterministic for a given seed, so the same
 * inputs always produce the same winners.
 */
export function buildDrawPlan({
  participants = [],
  prizes = [],
  prizeMode = 'limited',
  allowMultipleWins = false,
  fallbackReward = null,
  seed = 1,
}) {
  const entries = toList(participants).filter((p) => p && p.profileId);
  const errors = [];
  const plan = [];
  const rng = mulberry32(seed);
  const base = fallbackReward && fallbackReward.rewardType ? fallbackReward : null;

  if (entries.length === 0) {
    return { plan, errors: ['There are no entries to draw from.'], seed };
  }

  const slots = prizeSlotsOf(prizes).filter((s) => s.prizeId);
  const shuffled = shuffle(entries, rng);

  // Drawn prizes: one entry per configured slot.
  slots.forEach((slot, i) => {
    const person = allowMultipleWins ? shuffled[i % shuffled.length] : shuffled[i];
    if (!person) return; // more prizes than students — reported by validateRaffle
    plan.push({
      seq: plan.length,
      profileId: person.profileId,
      username: person.username,
      prizeId: slot.prizeId,
      kind: KIND.PRIZE,
    });
  });

  if (prizeMode === 'limited') {
    if (plan.length === 0) errors.push('No prizes are configured, so there is nothing to draw.');
    return { plan, errors, seed };
  }

  if (prizeMode === 'everyone' && !base && plan.length < entries.length) {
    errors.push('Everyone wins needs either enough prizes for every student or a base reward.');
    return { plan, errors, seed };
  }
  if (prizeMode === 'everyone_plus' && !base) {
    errors.push('Base reward + drawn prizes needs the base reward everyone receives.');
    return { plan, errors, seed };
  }

  // In 'everyone' mode the students who did not get a drawn prize receive the base.
  const alreadyWon = new Set(prizeMode === 'everyone' ? plan.map((e) => e.profileId) : []);
  const baseTargets =
    prizeMode === 'everyone' ? shuffled.filter((p) => !alreadyWon.has(p.profileId)) : entries;
  if (base) {
    baseTargets.forEach((person) => {
      plan.push({
        seq: plan.length,
        profileId: person.profileId,
        username: person.username,
        prizeId: base.id || 'base',
        kind: KIND.EVERYONE,
      });
    });
  }

  return { plan, errors, seed };
}

/** Prize tally for the admin summary. */
export function summarizePlan(plan, raffle) {
  const index = prizeIndex(raffle);
  const rows = [];
  toList(plan).forEach((entry) => {
    const prize = index[entry.prizeId];
    const key = entry.prizeId;
    let row = rows.find((r) => r.prizeId === key);
    if (!row) {
      row = {
        prizeId: key,
        kind: entry.kind,
        label: describePrize(prize),
        emoji: prizeEmoji(prize?.rewardType),
        planned: 0,
      };
      rows.push(row);
    }
    row.planned += 1;
  });
  return rows;
}

/** The first position that has no saved result yet. */
export function nextPlanEntry(raffle, results) {
  const plan = toList(raffle?.plan);
  const saved = new Set(toList(results).map((r) => Number(r.seq)));
  return plan.find((entry) => !saved.has(Number(entry.seq))) || null;
}

/** Everything the draw console shows: what is left, and how delivery is going. */
export function planProgress(raffle, results) {
  const plan = toList(raffle?.plan);
  const saved = toList(results);
  const savedSeqs = new Set(saved.map((r) => Number(r.seq)));

  const remaining = plan.filter((entry) => !savedSeqs.has(Number(entry.seq)));
  const remainingPrizes = remaining.filter((e) => e.kind === KIND.PRIZE);
  const remainingBase = remaining.filter((e) => e.kind === KIND.EVERYONE);

  const counts = {
    saved: saved.length,
    delivered: 0,
    pending: 0,
    delivering: 0,
    failed: 0,
    needsReview: 0,
  };
  saved.forEach((r) => {
    const status = r.deliveryStatus || DELIVERY.PENDING;
    if (status === DELIVERY.DELIVERED) counts.delivered += 1;
    else if (status === DELIVERY.FAILED) counts.failed += 1;
    else if (status === DELIVERY.NEEDS_REVIEW) counts.needsReview += 1;
    else if (status === DELIVERY.DELIVERING) counts.delivering += 1;
    else counts.pending += 1;
  });

  return {
    planLength: plan.length,
    savedWinners: saved.length,
    remainingParticipants: remaining.length,
    remainingPrizes: remainingPrizes.length,
    remainingBase: remainingBase.length,
    nextEntry: remaining[0] || null,
    complete: plan.length > 0 && remaining.length === 0,
    counts,
  };
}

/**
 * The result record for one planned entry. The prize is snapshotted, so editing
 * a prize later can never change what a saved winner already received.
 */
export function resultRecordFor(raffle, entry) {
  const prize = prizeForEntry(raffle, entry);
  return {
    raffleId: raffle.id,
    raffleTitle: raffle.title || 'Raffle',
    seq: entry.seq,
    operationId: `${raffle.id}:${entry.seq}:${entry.profileId}`,
    profileId: entry.profileId,
    username: entry.username || '',
    kind: entry.kind,
    prizeId: entry.prizeId || '',
    rewardType: prize?.rewardType || '',
    rewardData: normalizedRewardData(prize),
    prizeLabel: describePrize(prize),
    prizeEmoji: prizeEmoji(prize?.rewardType),
    selectionSavedAt: new Date().toISOString(),
    deliveryStatus: DELIVERY.PENDING,
    deliveryAttempts: 0,
  };
}

/**
 * Problems that mean the saved results can no longer be trusted. Anything
 * reported here pauses draws and delivery until an admin looks at it.
 */
export function findInconsistencies({ raffle, results } = {}) {
  const found = [];
  const plan = toList(raffle?.plan);
  const saved = toList(results).filter((r) => r && r.raffleId === raffle?.id);
  if (!raffle) return found;

  const add = (code, message) => {
    if (!found.some((f) => f.code === code)) found.push({ code, message });
  };

  const participants = toList(raffle.participants).map((p) => p.profileId);
  const participantSet = new Set(participants);
  const planBySeq = new Map();
  plan.forEach((entry) => planBySeq.set(Number(entry.seq), entry));

  // Frozen list sanity
  if (raffle.status !== RAFFLE_STATUS.DRAFT) {
    if (participantSet.size !== participants.length) {
      add('duplicate_entries', 'The frozen entry list contains the same student twice.');
    }
    plan.forEach((entry) => {
      if (!participantSet.has(entry.profileId)) {
        add('plan_off_list', 'The saved draw order names a student who is not on the frozen entry list.');
      }
    });
  }

  // Saved results
  const seqs = new Set();
  const operations = new Set();
  const drawnByProfile = new Map();
  const prizeCounts = new Map();

  saved.forEach((r) => {
    const seq = Number(r.seq);
    if (seqs.has(seq)) add('duplicate_seq', 'Two saved results share the same draw position.');
    seqs.add(seq);

    if (r.operationId) {
      if (operations.has(r.operationId)) add('duplicate_operation', 'The same draw was saved twice.');
      operations.add(r.operationId);
    }

    if (seq < 0 || seq >= plan.length) {
      add('result_beyond_plan', 'A saved result refers to a draw position that is not in the saved draw order.');
      return;
    }

    const entry = planBySeq.get(seq);
    if (entry && (entry.profileId !== r.profileId || entry.prizeId !== r.prizeId)) {
      add('result_mismatch', 'A saved result does not match the locked draw order for that position.');
    }
    if (raffle.status !== RAFFLE_STATUS.DRAFT && !participantSet.has(r.profileId)) {
      add('winner_off_list', 'A saved winner is not on the frozen entry list.');
    }

    if (r.kind === KIND.PRIZE) {
      const count = (drawnByProfile.get(r.profileId) || 0) + 1;
      drawnByProfile.set(r.profileId, count);
      prizeCounts.set(r.prizeId, (prizeCounts.get(r.prizeId) || 0) + 1);
    }
  });

  if (!raffle.allowMultipleWins) {
    drawnByProfile.forEach((count, profileId) => {
      if (count > 1) {
        const name = saved.find((r) => r.profileId === profileId)?.username || 'A student';
        add('multiple_wins', `${name} has more than one drawn prize, but "win more than once" is off.`);
      }
    });
  }

  const index = prizeIndex(raffle);
  prizeCounts.forEach((count, prizeId) => {
    const prize = index[prizeId];
    const allowed = Math.floor(Number(prize?.quantity) || 0);
    if (!prize) add('unknown_prize', 'A saved result refers to a prize that is no longer configured.');
    else if (count > allowed) {
      add(
        'excess_prizes',
        `"${describePrize(prize)}" has ${count} saved winners but only ${allowed} configured.`
      );
    }
  });

  if (saved.length > plan.length) {
    add('more_results_than_plan', 'There are more saved results than positions in the saved draw order.');
  }

  return found;
}

/** Where a raffle stands for one student, used by the student card. */
export function studentRaffleState({ raffle, results, profileId }) {
  const mine = toList(results).filter((r) => r.profileId === profileId && r.raffleId === raffle?.id);
  const entered = toList(raffle?.participants).some((p) => p.profileId === profileId);

  // A drawn prize outranks the base reward when both exist.
  const prize = mine.find((r) => r.kind === KIND.PRIZE) || mine[0] || null;
  if (prize) return { state: 'prize', prize, entered, alsoBase: mine.length > 1 };

  if (raffle?.paused) return { state: 'paused', prize: null, entered };
  if (!entered) {
    return {
      state: raffle?.status === RAFFLE_STATUS.DRAFT ? 'hidden' : 'not_entered',
      prize: null,
      entered: false,
    };
  }
  if (raffle?.status === RAFFLE_STATUS.DRAFT) return { state: 'hidden', prize: null, entered };
  if (raffle?.status === RAFFLE_STATUS.COMPLETED) return { state: 'none', prize: null, entered };
  if (raffle?.status === RAFFLE_STATUS.DRAWING) return { state: 'waiting', prize: null, entered };
  return { state: 'entered', prize: null, entered };
}

/** Student-facing wording for delivery, so no code or internal state leaks. */
export function deliveryLabel(result) {
  const status = result?.deliveryStatus || DELIVERY.PENDING;
  if (status === DELIVERY.DELIVERED) return { tone: 'ready', text: 'Added to your account' };
  if (status === DELIVERY.NEEDS_REVIEW) {
    return { tone: 'attention', text: 'Saved for you — an admin is double-checking this one' };
  }
  if (status === DELIVERY.FAILED) {
    return { tone: 'attention', text: 'Saved for you — it has not been added yet' };
  }
  return { tone: 'waiting', text: 'Saved for you — being prepared' };
}