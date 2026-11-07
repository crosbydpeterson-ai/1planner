// Card looks for the Magic Card Studio. A design is purely visual: it never
// carries the number, PIN or linked account, so saving one cannot change how a
// card signs in.

// Every art style CardTemplateArt can draw. AI themes pick one of these, so a
// generated theme always renders with real artwork instead of a blank card.
export const CARD_ART_STYLES = [
  'grid', 'passport', 'holo', 'starry', 'aurora', 'synth',
  'ocean', 'dots', 'lava', 'swirl', 'ice', 'comic',
];

export const CARD_TEMPLATES = [
  {
    id: 'neon_arcade', name: 'Neon Arcade', blurb: 'Glowing pixel grid', art: 'grid',
    frame: 'strong', glow: true, stickerBg: 0.32,
    colors: { primary: '#22d3ee', secondary: '#a855f7', accent: '#f472b6', ink: '#0b0620' },
    text: '#e7fbff',
  },
  {
    id: 'pet_passport', name: 'Pet Passport', blurb: 'Stamp and paw prints', art: 'passport',
    frame: 'soft', glow: false, stickerBg: 0.06,
    colors: { primary: '#f97316', secondary: '#fbbf24', accent: '#34d399', ink: '#3b2416' },
    text: '#3b2416',
  },
  {
    id: 'holo_collector', name: 'Holo Collector', blurb: 'Rainbow foil shimmer', art: 'holo',
    frame: 'holo', glow: true, stickerBg: 0.18,
    colors: { primary: '#ec4899', secondary: '#38bdf8', accent: '#facc15', ink: '#141322' },
    text: '#141322',
  },
  {
    id: 'midnight_quest', name: 'Midnight Quest', blurb: 'Dark starry sky', art: 'starry',
    frame: 'strong', glow: true, stickerBg: 0.32,
    colors: { primary: '#6366f1', secondary: '#38bdf8', accent: '#fbbf24', ink: '#070b23' },
    text: '#eaf2ff',
  },
  {
    id: 'aurora_wave', name: 'Aurora Wave', blurb: 'Northern lights ribbons', art: 'aurora',
    frame: 'strong', glow: true, stickerBg: 0.3,
    colors: { primary: '#34d399', secondary: '#818cf8', accent: '#f472b6', ink: '#04121a' },
    text: '#eafff8',
  },
  {
    id: 'sunset_synth', name: 'Sunset Synth', blurb: 'Retro sun over a grid', art: 'synth',
    frame: 'strong', glow: true, stickerBg: 0.32,
    colors: { primary: '#f97316', secondary: '#db2777', accent: '#fde047', ink: '#1b0733' },
    text: '#ffeede',
  },
  {
    id: 'deep_sea', name: 'Deep Sea', blurb: 'Bubbles in blue light', art: 'ocean',
    frame: 'strong', glow: false, stickerBg: 0.3,
    colors: { primary: '#22d3ee', secondary: '#1d4ed8', accent: '#a7f3d0', ink: '#031b2e' },
    text: '#dff7ff',
  },
  {
    id: 'candy_pop', name: 'Candy Pop', blurb: 'Polka-dot sweetness', art: 'dots',
    frame: 'soft', glow: false, stickerBg: 0.05,
    colors: { primary: '#fb7185', secondary: '#fbcfe8', accent: '#38bdf8', ink: '#4a1d3f' },
    text: '#4a1d3f',
  },
  {
    id: 'dragon_forge', name: 'Dragon Forge', blurb: 'Embers and lava cracks', art: 'lava',
    frame: 'strong', glow: true, stickerBg: 0.34,
    colors: { primary: '#f97316', secondary: '#b91c1c', accent: '#facc15', ink: '#180502' },
    text: '#ffe8d6',
  },
  {
    id: 'galaxy_swirl', name: 'Galaxy Swirl', blurb: 'Spinning star spiral', art: 'swirl',
    frame: 'strong', glow: true, stickerBg: 0.3,
    colors: { primary: '#a855f7', secondary: '#38bdf8', accent: '#f9a8d4', ink: '#0a0620' },
    text: '#f4ecff',
  },
  {
    id: 'frost_crystal', name: 'Frost Crystal', blurb: 'Icy crystal facets', art: 'ice',
    frame: 'soft', glow: false, stickerBg: 0.08,
    colors: { primary: '#7dd3fc', secondary: '#e0f2fe', accent: '#6366f1', ink: '#0b2a3d' },
    text: '#0b2a3d',
  },
  {
    id: 'comic_hero', name: 'Comic Hero', blurb: 'Halftone pop-art burst', art: 'comic',
    frame: 'strong', glow: false, stickerBg: 0.06,
    colors: { primary: '#ef4444', secondary: '#fde047', accent: '#2563eb', ink: '#111827' },
    text: '#111827',
  },
];

export const CARD_TEMPLATE_IDS = CARD_TEMPLATES.map((t) => t.id);

export const STICKERS = [
  '🎮', '🕹️', '👾', '⭐', '🚀', '🔥', '💎', '🍀', '⚡', '🎲', '🌈', '🛸',
  '🦄', '🐲', '🧩', '🎯', '🐱', '🐶', '🦊', '🐼', '🐸', '🦖', '🐙', '🦋',
  '🍕', '🍩', '🍦', '🍓', '🥑', '🍿', '🎧', '🎸', '🏆', '🎁', '🌙', '☄️',
  '🔮', '🧿', '💫', '🎨',
];

export const getTemplate = (id) =>
  CARD_TEMPLATES.find((t) => t.id === id) || CARD_TEMPLATES[0];

// Turn a saved CardTheme into a design patch, so picking a theme fills in the
// artwork, palette and sticker while keeping the card's own name and pet.
export const themeToDesign = (theme) => ({
  templateId: getTemplate(theme.templateId).id,
  themeId: theme.id || '',
  themeName: theme.name || '',
  colors: { ...getTemplate(theme.templateId).colors, ...(theme.colors || {}) },
  textColor: theme.text || '',
  backgroundUri: theme.backgroundUri || '',
  sticker: theme.sticker || '',
});

export const DEFAULT_DESIGN = {
  templateId: CARD_TEMPLATES[0].id,
  themeId: '',
  themeName: '',
  colors: { ...CARD_TEMPLATES[0].colors },
  textColor: '',
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
    textColor: design?.textColor || '',
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