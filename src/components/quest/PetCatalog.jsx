// Pet catalog with XP unlock thresholds
export const PETS = [
  {
    id: "starter_slime",
    name: "Starter Slime",
    rarity: "common",
    xpRequired: 0,
    description: "A friendly blob that bounces by your side.",
    emoji: "🟢"
  },
  {
    id: "study_owl",
    name: "Study Owl",
    rarity: "common",
    xpRequired: 100,
    description: "Wise companion for late-night study sessions.",
    emoji: "🦉"
  },
  {
    id: "math_cat",
    name: "Math Cat",
    rarity: "uncommon",
    xpRequired: 250,
    description: "Always lands on its feet... and the right answer.",
    emoji: "🐱"
  },
  {
    id: "book_dragon",
    name: "Book Dragon",
    rarity: "uncommon",
    xpRequired: 500,
    description: "Hoards knowledge instead of gold.",
    emoji: "🐉"
  },
  {
    id: "phoenix_scholar",
    name: "Phoenix Scholar",
    rarity: "rare",
    xpRequired: 1000,
    description: "Rises from the ashes of failed tests.",
    emoji: "🔥"
  },
  {
    id: "cosmic_fox",
    name: "Cosmic Fox",
    rarity: "rare",
    xpRequired: 1500,
    description: "Navigates the stars of knowledge.",
    emoji: "🦊"
  },
  {
    id: "crystal_unicorn",
    name: "Crystal Unicorn",
    rarity: "epic",
    xpRequired: 2500,
    description: "Legendary steed of straight-A students.",
    emoji: "🦄"
  },
  {
    id: "void_wolf",
    name: "Void Wolf",
    rarity: "epic",
    xpRequired: 4000,
    description: "Guardian of the academic realm.",
    emoji: "🐺"
  },
  {
    id: "celestial_dragon",
    name: "Celestial Dragon",
    rarity: "legendary",
    xpRequired: 7500,
    description: "The ultimate companion. Master of all subjects.",
    emoji: "✨"
  },
  {
    id: "quantum_phoenix",
    name: "Quantum Phoenix",
    rarity: "legendary",
    xpRequired: 10000,
    description: "Exists in all timelines. Achieves all goals.",
    emoji: "⚡"
  }
];

export const RARITY_COLORS = {
  common: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  uncommon: { bg: "bg-green-100", text: "text-green-700", border: "border-green-400" },
  rare: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-400" },
  epic: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-400" },
  legendary: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-400" }
};

export const getUnlockedPets = (xp) => {
  return PETS.filter(pet => xp >= pet.xpRequired).map(pet => pet.id);
};

export default function PetCatalog() {
  return null;
}