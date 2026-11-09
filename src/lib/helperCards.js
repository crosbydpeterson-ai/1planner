// Helper Cards: one physical admin card that unlocks a single Quick Help action
// at a time on a student's device.
//
// This app has no backend function available, so every rule below is enforced
// in the browser: the card's admin must still be an admin, the card must be
// enabled at scan time AND again at confirmation, only the actions the card
// allows can be confirmed, and one scan can be spent exactly once. Each rule is
// ordered so the same sequence can move behind a backend function unchanged;
// the HelperAction row is the audit trail either way.
import { base44 } from '@/api/base44Client';
import { onProfileSwitch } from '@/lib/dataCache';
import { normalizeDesign } from '@/lib/cardDesigns';

export const HELPER_CARDS_UPDATED = 'helper-cards-updated';

// The Admin panel's own gate accepts this app-wide password or the profile's
// adminPanelPassword. Quick Help accepts exactly the same pair, so an admin who
// can open the panel can use their card, and nobody else can.
const APP_ADMIN_PASSWORD = 'Crosby110!';

export const helperError = (message) => Object.assign(new Error(message), { userFacing: true });

export const normalizeHelperNumber = (value) => String(value ?? '').trim();

export const helperKey = (value) => String(value ?? '').toLowerCase().replace(/[\s\-_.]/g, '');

// Long and random, so a helper card cannot be guessed the way a short code could.
export const generateHelperNumber = () => {
  const digits = Array.from(crypto.getRandomValues(new Uint8Array(10)))
    .map((n) => n % 10)
    .join('');
  return `H${digits}`;
};

export const maskHelperNumber = (number) => {
  const value = normalizeHelperNumber(number);
  return value.length <= 5 ? value : `${value.slice(0, 2)}••••${value.slice(-3)}`;
};

const notify = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(HELPER_CARDS_UPDATED));
};

export const listHelperCards = () => base44.entities.HelperCard.list('-created_date');

export const listHelperActions = async (cardId, limit = 50) => {
  const page = await base44.entities.HelperAction.filter(
    cardId ? { cardId } : {},
    { sort: '-created_date', limit }
  );
  return page.items || [];
};

export const isAdminProfile = (profile) =>
  profile?.rank === 'admin' ||
  profile?.rank === 'super_admin' ||
  String(profile?.username || '').toLowerCase() === 'crosby';

export const ACTION_LABELS = {
  fix_xp: 'Fix Missing XP',
  grant_reward: 'Granted Reward',
  reset_passcode: 'Reset Passcode',
  switch_account: 'Switched Account',
};

// Only the fields a helper card prints, so a saved look never carries the magic
// card's wallet-only settings.
const helperDesign = (design) => {
  const d = normalizeDesign(design);
  return {
    templateId: d.templateId,
    themeId: d.themeId || '',
    themeName: d.themeName || '',
    colors: { ...d.colors },
    textColor: d.textColor || '',
    backgroundUri: d.backgroundUri || '',
    sticker: d.sticker || '',
    displayName: d.displayName || '',
  };
};

const toPayload = (data) => ({
  number: normalizeHelperNumber(data.number),
  design: helperDesign(data.design),
  reward: data.reward?.type
    ? {
        type: data.reward.type,
        petId: data.reward.petId || '',
        amount: Number(data.reward.amount) || 0,
        title: data.reward.title || '',
        label: data.reward.label || '',
      }
    : {},
  numberKey: helperKey(data.number),
  nickname: (data.nickname || '').trim(),
  adminProfileId: data.adminProfileId || '',
  adminUsername: data.adminUsername || '',
  actions: {
    fixXp: !!data.actions?.fixXp,
    grantReward: !!data.actions?.grantReward,
    resetPasscode: !!data.actions?.resetPasscode,
    switchAccount: !!data.actions?.switchAccount,
  },
  rewardPresets: (data.rewardPresets || [])
    .filter((preset) => preset?.label && Math.trunc(Number(preset.amount)) !== 0)
    .map((preset) => ({
      id: preset.id || `${preset.type}_${Math.trunc(Number(preset.amount))}_${Math.random().toString(36).slice(2, 6)}`,
      label: preset.label,
      type: preset.type === 'coins' ? 'coins' : 'xp',
      amount: Math.trunc(Number(preset.amount)),
    })),
  enabled: data.enabled !== false,
  note: (data.note || '').trim(),
});

export const isDuplicateHelperNumber = async (number, ignoreId = null) => {
  const key = helperKey(number);
  if (!key) return false;
  const rows = await base44.entities.HelperCard.filter({ numberKey: key });
  return rows.some((row) => row.id !== ignoreId);
};

export const saveHelperCard = async (data, id = null) => {
  const body = toPayload(data);
  // Only carried when the caller reset the bonus, so an ordinary edit keeps the
  // list of students who already received it.
  if (Array.isArray(data.rewardGrantedProfileIds)) body.rewardGrantedProfileIds = data.rewardGrantedProfileIds;
  if (!body.number) throw helperError('A helper card needs a number.');
  if (!body.adminProfileId) throw helperError('Choose the admin this card belongs to.');
  if (await isDuplicateHelperNumber(body.number, id)) throw helperError('That card number is already in use.');
  const card = id
    ? await base44.entities.HelperCard.update(id, body)
    : await base44.entities.HelperCard.create(body);
  notify();
  return card;
};

export const disableHelperCard = async (card, byUsername) => {
  const row = await base44.entities.HelperCard.update(card.id, {
    enabled: false,
    disabledAt: new Date().toISOString(),
    disabledBy: byUsername || '',
  });
  notify();
  return row;
};

// A lost card is retired, never re-used: the old number dies and the new card
// carries the same admin and the same allowed actions.
export const replaceHelperCard = async (card, byUsername) => {
  const created = await saveHelperCard({ ...card, number: generateHelperNumber(), enabled: true });
  await base44.entities.HelperCard.update(card.id, {
    enabled: false,
    disabledAt: new Date().toISOString(),
    disabledBy: byUsername || '',
    replacedByCardId: created.id,
  });
  notify();
  return created;
};

export const resolveHelperCard = async (value) => {
  const key = helperKey(value);
  if (!key) return { status: 'unknown' };
  const rows = await base44.entities.HelperCard.filter({ numberKey: key });
  const card = rows[0];
  if (!card) return { status: 'unknown' };
  if (!card.enabled) return { status: 'disabled', card };
  return { status: 'ok', card };
};

export const verifyHelperAdmin = async (card, password) => {
  const rows = await base44.entities.UserProfile.filter({ id: card.adminProfileId });
  const admin = rows[0];
  if (!admin) return { ok: false, reason: 'The admin on this card no longer exists.' };
  if (!isAdminProfile(admin)) return { ok: false, reason: 'The account on this card is no longer an admin.' };
  const typed = String(password || '').trim();
  const matches =
    !!typed && (typed === APP_ADMIN_PASSWORD || (!!admin.adminPanelPassword && typed === admin.adminPanelPassword));
  return matches ? { ok: true, admin } : { ok: false, reason: 'That admin password is not correct.' };
};

const ACTION_FIELDS = {
  fix_xp: 'fixXp',
  grant_reward: 'grantReward',
  reset_passcode: 'resetPasscode',
  switch_account: 'switchAccount',
};

export const helperAllows = (card, actionType) => !!card?.actions?.[ACTION_FIELDS[actionType]];

/**
 * Claims the one action a scan is allowed to make.
 * The audit row is written first: if a row already exists for this scan, or the
 * card was disabled after it was scanned, nothing is applied.
 */
export const claimHelperAction = async (payload) => {
  // A refused attempt is written down too, so a card being used after it was
  // disabled is visible in the history rather than silent.
  const block = async (message) => {
    await base44.entities.HelperAction.create({ ...payload, status: 'blocked', blockedReason: message });
    throw helperError(message);
  };

  const used = await base44.entities.HelperAction.filter({ scanId: payload.scanId });
  if (used.length > 0) throw helperError('That scan was already used. Scan the card again.');

  const rows = await base44.entities.HelperCard.filter({ id: payload.cardId });
  const card = rows[0];
  if (!card) throw helperError('This helper card no longer exists.');
  if (!card.enabled) {
    return block('This helper card was disabled — nothing was changed.');
  }
  if (!helperAllows(card, payload.actionType)) {
    return block('This card is not allowed to make that change.');
  }

  const claimed = await base44.entities.HelperAction.create({ ...payload, status: 'pending' });

  // Two confirmations landing together both create a row; whoever sees two
  // backs off, so one scan can never apply the same change twice.
  const again = await base44.entities.HelperAction.filter({ scanId: payload.scanId });
  if (again.length > 1) {
    await base44.entities.HelperAction.update(claimed.id, {
      status: 'blocked',
      blockedReason: 'Two confirmations arrived for one scan.',
    });
    throw helperError('Two confirmations arrived at once — nothing was changed. Scan the card again.');
  }

  return claimed;
};

const addXp = async (profile, amount) => {
  const before = Number(profile.xp) || 0;
  const after = before + Math.trunc(amount);
  await base44.entities.UserProfile.update(profile.id, { xp: after });
  return { before, after };
};

const addCoins = async (profile, amount) => {
  const before = Number(profile.questCoins) || 0;
  const after = before + Math.trunc(amount);
  await base44.entities.UserProfile.update(profile.id, { questCoins: after });
  return { before, after };
};

// The student passcode is the 4-digit PIN this device remembers for the profile
// (pin_<userId>), the same one the Admin panel resets. A reset clears it and
// writes the passcode the student chooses, so the old one stops working.
export const setStoredPasscode = (profile, pin) => {
  const value = String(pin || '');
  if (!/^\d{4}$/.test(value)) throw helperError('Choose a 4-digit passcode.');
  if (!profile?.userId) throw helperError('This account has no sign-in id, so its passcode cannot be reset.');
  localStorage.removeItem(`pin_${profile.userId}`);
  localStorage.setItem(`pin_${profile.userId}`, btoa(value));
};

export const switchDeviceAccount = (profile) => {
  localStorage.setItem('quest_user_id', profile.userId);
  localStorage.setItem('quest_profile_id', profile.id);
  localStorage.setItem('quest_username', profile.username);
  onProfileSwitch();
};

/** Applies a claimed action. Throws a userFacing error when nothing may change. */
export const performHelperAction = async ({ actionType, target, detail }) => {
  if (actionType === 'fix_xp') {
    const amount = Math.trunc(Number(detail?.amount) || 0);
    if (!amount) throw helperError('Enter the XP amount to add.');
    if (Math.abs(amount) > 5000) throw helperError('That is more XP than one card may add.');
    const reason = String(detail?.reason || '').trim();
    if (!reason) throw helperError('A reason is required for an XP fix.');
    const { before, after } = await addXp(target, amount);
    return {
      summary: `${amount > 0 ? '+' : ''}${amount} XP — ${reason}`,
      changes: { xp: { before, after } },
    };
  }

  if (actionType === 'grant_reward') {
    const preset = detail?.preset;
    if (!preset) throw helperError('Choose a reward.');
    const amount = Math.trunc(Number(preset.amount) || 0);
    if (!amount) throw helperError('That reward has no amount.');
    const applied = preset.type === 'coins' ? await addCoins(target, amount) : await addXp(target, amount);
    const field = preset.type === 'coins' ? 'questCoins' : 'xp';
    return {
      summary: `${preset.label} (${amount > 0 ? '+' : ''}${amount})`,
      changes: { [field]: applied },
    };
  }

  if (actionType === 'reset_passcode') {
    setStoredPasscode(target, detail?.pin);
    return {
      summary: 'Sign-in passcode reset on this device',
      changes: { passcode: { before: 'old passcode', after: 'new passcode' } },
    };
  }

  if (actionType === 'switch_account') {
    switchDeviceAccount(target);
    return {
      summary: 'This device now signs in as this student',
      changes: { account: { before: String(detail?.fromName || 'previous account'), after: target.username } },
      switched: true,
    };
  }

  throw helperError('That action is not available.');
};