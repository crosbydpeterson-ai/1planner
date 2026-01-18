// Theme catalog with XP unlock thresholds
export const THEMES = [
  {
    id: "default",
    name: "Classic Quest",
    rarity: "common",
    xpRequired: 0,
    description: "The original Quest Planner look.",
    colors: {
      primary: "#6366f1",
      secondary: "#8b5cf6",
      accent: "#f59e0b",
      bg: "#f8fafc"
    }
  },
  {
    id: "forest",
    name: "Enchanted Forest",
    rarity: "common",
    xpRequired: 150,
    description: "Peaceful woodland vibes.",
    colors: {
      primary: "#059669",
      secondary: "#10b981",
      accent: "#84cc16",
      bg: "#ecfdf5"
    }
  },
  {
    id: "ocean",
    name: "Deep Ocean",
    rarity: "uncommon",
    xpRequired: 400,
    description: "Dive into the depths of knowledge.",
    colors: {
      primary: "#0891b2",
      secondary: "#06b6d4",
      accent: "#22d3ee",
      bg: "#ecfeff"
    }
  },
  {
    id: "sunset",
    name: "Sunset Kingdom",
    rarity: "uncommon",
    xpRequired: 750,
    description: "Warm hues for focused studying.",
    colors: {
      primary: "#ea580c",
      secondary: "#f97316",
      accent: "#fbbf24",
      bg: "#fff7ed"
    }
  },
  {
    id: "midnight",
    name: "Midnight Scholar",
    rarity: "rare",
    xpRequired: 1200,
    description: "For those who study under the stars.",
    colors: {
      primary: "#4f46e5",
      secondary: "#6366f1",
      accent: "#a78bfa",
      bg: "#eef2ff"
    }
  },
  {
    id: "cherry",
    name: "Cherry Blossom",
    rarity: "rare",
    xpRequired: 2000,
    description: "Serene Japanese garden aesthetic.",
    colors: {
      primary: "#db2777",
      secondary: "#ec4899",
      accent: "#f9a8d4",
      bg: "#fdf2f8"
    }
  },
  {
    id: "cosmic",
    name: "Cosmic Explorer",
    rarity: "epic",
    xpRequired: 3500,
    description: "Journey through the galaxy of learning.",
    colors: {
      primary: "#7c3aed",
      secondary: "#8b5cf6",
      accent: "#c4b5fd",
      bg: "#f5f3ff"
    }
  },
  {
    id: "dragon",
    name: "Dragon's Lair",
    rarity: "epic",
    xpRequired: 5000,
    description: "Fierce and powerful.",
    colors: {
      primary: "#dc2626",
      secondary: "#ef4444",
      accent: "#fca5a5",
      bg: "#fef2f2"
    }
  },
  {
    id: "ethereal",
    name: "Ethereal Realm",
    rarity: "legendary",
    xpRequired: 8000,
    description: "Transcend ordinary learning.",
    colors: {
      primary: "#0d9488",
      secondary: "#14b8a6",
      accent: "#5eead4",
      bg: "#f0fdfa"
    }
  },
  {
    id: "golden",
    name: "Golden Champion",
    rarity: "legendary",
    xpRequired: 12000,
    description: "The ultimate achievement. Pure gold.",
    colors: {
      primary: "#b45309",
      secondary: "#d97706",
      accent: "#fcd34d",
      bg: "#fffbeb"
    }
  }
];

export const RARITY_COLORS = {
  common: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  uncommon: { bg: "bg-green-100", text: "text-green-700", border: "border-green-400" },
  rare: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-400" },
  epic: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-400" },
  legendary: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-400" }
};

export const getUnlockedThemes = (xp) => {
  return THEMES.filter(theme => xp >= theme.xpRequired).map(theme => theme.id);
};

export default function ThemeCatalog() {
  return null;
}