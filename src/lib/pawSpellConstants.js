// Paw & Spell - Game Constants

export const PET_TYPES = {
  // Pawns
  SPRITE: 'sprite',
  // Rooks
  GOLEM: 'golem',
  // Knights
  GRYPHON: 'gryphon',
  // Bishops
  WISP: 'wisp',
  // Queens
  DRAGON: 'dragon',
  // Kings
  UNICORN: 'unicorn',
};

export const PIECE_TO_PET = {
  p: PET_TYPES.SPRITE,
  r: PET_TYPES.GOLEM,
  n: PET_TYPES.GRYPHON,
  b: PET_TYPES.WISP,
  q: PET_TYPES.DRAGON,
  k: PET_TYPES.UNICORN,
};

export const PET_TO_CHESS_NAME = {
  [PET_TYPES.SPRITE]: 'Pawn',
  [PET_TYPES.GOLEM]: 'Rook',
  [PET_TYPES.GRYPHON]: 'Knight',
  [PET_TYPES.WISP]: 'Bishop',
  [PET_TYPES.DRAGON]: 'Queen',
  [PET_TYPES.UNICORN]: 'King (Unicorn)',
};

export const PET_EMOJIS = {
  [PET_TYPES.SPRITE]: '🧚',
  [PET_TYPES.GOLEM]: '🪨',
  [PET_TYPES.GRYPHON]: '🦅',
  [PET_TYPES.WISP]: '✨',
  [PET_TYPES.DRAGON]: '🐉',
  [PET_TYPES.UNICORN]: '🦄',
};

export const PET_DESCRIPTIONS = {
  [PET_TYPES.SPRITE]: 'Forest sprites that dart forward, striking diagonally.',
  [PET_TYPES.GOLEM]: 'Ancient stone guardians that sweep across rows and columns.',
  [PET_TYPES.GRYPHON]: 'Sky hunters that leap in an L-shape, ignoring obstacles.',
  [PET_TYPES.WISP]: 'Ethereal spirits gliding diagonally across the realm.',
  [PET_TYPES.DRAGON]: 'Apex predators commanding all directions.',
  [PET_TYPES.UNICORN]: 'Sacred protectors. If captured, the realm falls.',
};

export const INITIAL_BOARD = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR'],
];

export const GEM_COLORS = ['💎', '💜', '💚', '❤️'];

export const DARK_THEME = {
  boardLight: '#2d1b4e',
  boardDark: '#1a0f2e',
  boardBorder: '#6b21a8',
  bgGradient: 'from-slate-950 via-purple-950 to-slate-950',
  accent: 'purple',
};