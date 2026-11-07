// Card looks for the Magic Card Studio. A design is purely visual: it never
// carries the number, PIN or linked account, so saving one cannot change how a
// card signs in.
export const CARD_TEMPLATES = [
  {
    id: 'neon_arcade',
    name: 'Neon Arcade',
    blurb: 'Glowing pixel edges',
    colors: { primary: '#22d3ee', secondary: '#a855f7', accent: '#f472b6', ink: '#0b0620' },
    text: '#e7fbff',
  },
  {
    id: 'pet_passport',
    name: 'Pet Passport',
    blurb: 'A pet companion',
    colors: { primary: '#f97316', secondary: '#fbbf24', accent: '#34d399', ink: '#3b2416' },
    text: '#3b2416',
  },
  {
    id: 'holo_collector',
    name: 'Holo Collector',
    blurb: 'Rainbow foil shimmer',
    colors: { primary: '#ec4899', secondary: '#38bdf8', accent: '#facc15', ink: '#141322' },
    text: '#141322',
  },
  {
    id: 'midnight_quest',
    name: 'Midnight Quest',
    blurb: 'Dark starry sky',
    colors: { primary: '#6366f1', secondary: '#38bdf8', accent: '#fbbf24', ink: '#070b23' },
    text: '#eaf2ff',
  },
];

export const STICKERS = ['🎮', '🕹️', '👾', '⭐', '🚀', '🔥', '💎', '🍀', '⚡', '🎲', '🌈', '🛸', '🦄', '🐲', '🧩', '🎯'];

export const getTemplate = (id) =>
  CARD_TEMPLATES.find((t) => t.id === id) || CARD_TEMPLATES[0];

export const DEFAULT_DESIGN = {
  templateId: CARD_TEMPLATES[0].id,
  colors: { ...CARD_TEMPLATES[0].colors },
  backgroundUri: '',
  sticker: '🎮',
  petId: '',
  petEmoji: '',
  petImageUrl: '',
  displayName: '',
};

export const normalizeDesign = (design) => {
  const template = getTemplate(design?.templateId);
  return {
    ...DEFAULT_DESIGN,
    ...(design || {}),
    templateId: template.id,
    colors: { ...template.colors, ...(design?.colors || {}) },
  };
};

export const blankDesign = () => normalizeDesign(null);

// #abc / #aabbcc -> rgba(a,b,c,alpha)
export const alpha = (hex, a) => {
  const clean = String(hex || '').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const num = parseInt(full || '000000', 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};