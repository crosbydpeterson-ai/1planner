// Experimental Magic Login.
// Arcade-style cards scanned at the login screen open a linked test profile.
// Cards and their PINs live in THIS browser only (localStorage) — no backend
// call is involved, so the feature works without any plan-gated capability.

export const MAGIC_CARDS_KEY = 'magic_cards_v1';
export const MAGIC_CARDS_UPDATED = 'magic-cards-updated';

// Card numbers are text: never cast to a number, so leading zeros survive.
export const normalizeCardNumber = (value) => String(value ?? '').trim();

export const hashCardPin = (pin) => btoa(String(pin).trim());

const readCards = () => {
  try {
    const raw = localStorage.getItem(MAGIC_CARDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCards = (cards) => {
  localStorage.setItem(MAGIC_CARDS_KEY, JSON.stringify(cards));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(MAGIC_CARDS_UPDATED));
  }
  return cards;
};

export const listCards = () => readCards();

// Duplicates are rejected across every card, disabled ones included.
export const isDuplicateNumber = (number, ignoreId = null) => {
  const key = normalizeCardNumber(number).toLowerCase();
  if (!key) return false;
  return readCards().some(
    (card) => card.id !== ignoreId && normalizeCardNumber(card.number).toLowerCase() === key
  );
};

const buildCard = (data) => ({
  id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  number: normalizeCardNumber(data.number),
  nickname: (data.nickname || '').trim(),
  profileId: data.profileId,
  profileUsername: data.profileUsername || '',
  pinHash: data.pinHash || '',
  enabled: data.enabled !== false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const addCard = (data) => {
  const cards = readCards();
  const card = buildCard(data);
  writeCards([...cards, card]);
  return card;
};

// Editing the number replaces it outright, so the old number stops matching.
export const updateCard = (id, patch) => {
  const cards = readCards();
  const next = cards.map((card) =>
    card.id === id ? { ...card, ...patch, updatedAt: new Date().toISOString() } : card
  );
  writeCards(next);
  return next.find((card) => card.id === id) || null;
};

export const findCardByNumber = (number) => {
  const key = normalizeCardNumber(number).toLowerCase();
  if (!key) return null;
  return readCards().find((card) => normalizeCardNumber(card.number).toLowerCase() === key) || null;
};

/**
 * Resolve a scanned/typed card value.
 * status: 'unknown' | 'disabled' | 'pin_required' | 'ok'
 */
export const resolveCard = (value) => {
  const card = findCardByNumber(value);
  if (!card) return { status: 'unknown' };
  if (!card.enabled) return { status: 'disabled', card };
  if (card.pinHash) return { status: 'pin_required', card };
  return { status: 'ok', card };
};

export const cardPinMatches = (card, pin) =>
  !!card?.pinHash && card.pinHash === hashCardPin(pin);