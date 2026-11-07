// Magic Login cards.
// Cards live in the database so a card added on one device is recognised
// everywhere (login screen included). No backend function is involved, so the
// feature works without any plan-gated capability.
import { base44 } from '@/api/base44Client';

export const MAGIC_CARDS_UPDATED = 'magic-cards-updated';
const LEGACY_KEY = 'magic_cards_v1';

// Card numbers are text: never cast to a number, so leading zeros survive.
export const normalizeCardNumber = (value) => String(value ?? '').trim();

// Matching key: scanners and people space/dash numbers differently, so both
// forms of the same card must resolve to one key.
export const cardKey = (value) =>
  String(value ?? '').toLowerCase().replace(/[\s\-_.]/g, '');

export const hashCardPin = (pin) => btoa(String(pin).trim());

export const cardPinMatches = (card, pin) =>
  !!card?.pinHash && card.pinHash === hashCardPin(pin);

const notify = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MAGIC_CARDS_UPDATED));
  }
};

// Cards saved in this browser before cards moved to the database are imported
// once, so an existing card keeps working.
const migrateLegacyCards = async () => {
  let legacy = [];
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    legacy = Array.isArray(parsed) ? parsed : [];
  } catch {
    legacy = [];
  }
  if (legacy.length === 0) return [];
  const rows = legacy
    .filter((c) => c?.number && c?.profileId)
    .map((c) => ({
      number: normalizeCardNumber(c.number),
      numberKey: cardKey(c.number),
      nickname: (c.nickname || '').trim(),
      profileId: c.profileId,
      profileUsername: c.profileUsername || '',
      pinHash: c.pinHash || '',
      enabled: c.enabled !== false,
    }));
  localStorage.removeItem(LEGACY_KEY);
  if (rows.length === 0) return [];
  return await base44.entities.MagicCard.bulkCreate(rows);
};

export const listCards = async () => {
  const cards = await base44.entities.MagicCard.list('-created_date');
  if (cards.length > 0) return cards;
  const migrated = await migrateLegacyCards();
  return migrated.length > 0 ? await base44.entities.MagicCard.list('-created_date') : cards;
};

// Duplicates are rejected across every card, disabled ones included.
export const isDuplicateNumber = async (number, ignoreId = null) => {
  const key = cardKey(number);
  if (!key) return false;
  const cards = await base44.entities.MagicCard.filter({ numberKey: key });
  return cards.some((card) => card.id !== ignoreId);
};

export const addCard = async (data) => {
  const card = await base44.entities.MagicCard.create({
    number: normalizeCardNumber(data.number),
    numberKey: cardKey(data.number),
    nickname: (data.nickname || '').trim(),
    profileId: data.profileId,
    profileUsername: data.profileUsername || '',
    pinHash: data.pinHash || '',
    enabled: data.enabled !== false,
    successSound: data.successSound || '',
    successSoundUrl: data.successSoundUrl || '',
    rejectSound: data.rejectSound || '',
    rejectSoundUrl: data.rejectSoundUrl || '',
  });
  notify();
  return card;
};

// Editing the number replaces it outright, so the old number stops matching.
export const updateCard = async (id, patch) => {
  const next = { ...patch };
  if (patch.number !== undefined) {
    next.number = normalizeCardNumber(patch.number);
    next.numberKey = cardKey(patch.number);
  }
  const card = await base44.entities.MagicCard.update(id, next);
  notify();
  return card;
};

/**
 * Resolve a scanned/typed card value.
 * status: 'unknown' | 'disabled' | 'pin_required' | 'ok'
 */
export const resolveCard = async (value) => {
  const key = cardKey(value);
  if (!key) return { status: 'unknown' };
  const cards = await base44.entities.MagicCard.filter({ numberKey: key });
  const card = cards[0];
  if (!card) return { status: 'unknown' };
  if (!card.enabled) return { status: 'disabled', card };
  if (card.pinHash) return { status: 'pin_required', card };
  return { status: 'ok', card };
};