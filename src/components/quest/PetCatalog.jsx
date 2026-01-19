// Pet catalog - each pet has its own exclusive theme!
export const PETS = [
  {
    id: "starter_slime",
    name: "Starter Slime",
    rarity: "common",
    description: "A friendly blob that bounces by your side.",
    emoji: "🟢",
    theme: { primary: "#22c55e", secondary: "#86efac", accent: "#4ade80", bg: "#f0fdf4" }
  },
  {
    id: "study_owl",
    name: "Study Owl",
    rarity: "common",
    description: "Wise companion for late-night study sessions.",
    emoji: "🦉",
    theme: { primary: "#78716c", secondary: "#a8a29e", accent: "#fbbf24", bg: "#fafaf9" }
  },
  {
    id: "math_cat",
    name: "Math Cat",
    rarity: "uncommon",
    description: "Always lands on its feet... and the right answer.",
    emoji: "🐱",
    theme: { primary: "#f97316", secondary: "#fdba74", accent: "#fbbf24", bg: "#fff7ed" }
  },
  {
    id: "book_dragon",
    name: "Book Dragon",
    rarity: "uncommon",
    description: "Hoards knowledge instead of gold.",
    emoji: "🐉",
    theme: { primary: "#dc2626", secondary: "#f87171", accent: "#fbbf24", bg: "#fef2f2" }
  },
  {
    id: "phoenix_scholar",
    name: "Phoenix Scholar",
    rarity: "rare",
    description: "Rises from the ashes of failed tests.",
    emoji: "🔥",
    theme: { primary: "#ea580c", secondary: "#fb923c", accent: "#fcd34d", bg: "#431407" }
  },
  {
    id: "cosmic_fox",
    name: "Cosmic Fox",
    rarity: "rare",
    description: "Navigates the stars of knowledge.",
    emoji: "🦊",
    theme: { primary: "#8b5cf6", secondary: "#c4b5fd", accent: "#f472b6", bg: "#1e1b4b" }
  },
  {
    id: "crystal_unicorn",
    name: "Crystal Unicorn",
    rarity: "epic",
    description: "Legendary steed of straight-A students.",
    emoji: "🦄",
    theme: { primary: "#ec4899", secondary: "#f9a8d4", accent: "#a855f7", bg: "#fdf2f8" }
  },
  {
    id: "void_wolf",
    name: "Void Wolf",
    rarity: "epic",
    description: "Guardian of the academic realm.",
    emoji: "🐺",
    theme: { primary: "#1e293b", secondary: "#475569", accent: "#6366f1", bg: "#0f172a" }
  },
  {
    id: "celestial_dragon",
    name: "Celestial Dragon",
    rarity: "legendary",
    description: "The ultimate companion. Master of all subjects.",
    emoji: "✨",
    theme: { primary: "#fbbf24", secondary: "#fcd34d", accent: "#f472b6", bg: "#1a1a2e" }
  },
  {
    id: "quantum_phoenix",
    name: "Quantum Phoenix",
    rarity: "legendary",
    description: "Exists in all timelines. Achieves all goals.",
    emoji: "⚡",
    theme: { primary: "#3b82f6", secondary: "#60a5fa", accent: "#f59e0b", bg: "#0c0a3e" }
  }
];

export const RARITY_COLORS = {
  common: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  uncommon: { bg: "bg-green-100", text: "text-green-700", border: "border-green-400" },
  rare: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-400" },
  epic: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-400" },
  legendary: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-400" }
};

// Get a random pet from the pool (for assignment rewards)
export const getRandomPet = (ownedPetIds = []) => {
  // Filter out already owned pets
  const availablePets = PETS.filter(p => !ownedPetIds.includes(p.id));
  if (availablePets.length === 0) {
    // All pets owned, return random one anyway
    return PETS[Math.floor(Math.random() * PETS.length)];
  }
  return availablePets[Math.floor(Math.random() * availablePets.length)];
};

// Get pet's theme colors
export const getPetTheme = (petId) => {
  const pet = PETS.find(p => p.id === petId);
  return pet?.theme || PETS[0].theme;
};

export default function PetCatalog() {
  return null;
}