import React from 'react';
import { Lock, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { RARITY_COLORS } from './PetCatalog';
import { cn } from '@/lib/utils';

export default function PetCard({ pet, isUnlocked, isEquipped, onEquip, userXp }) {
  const rarityStyle = RARITY_COLORS[pet.rarity];
  const xpNeeded = pet.xpRequired - userXp;
  
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-2xl border-2 p-4 transition-all cursor-pointer",
        isUnlocked ? rarityStyle.border : "border-slate-200",
        isEquipped && "ring-2 ring-offset-2 ring-amber-400",
        !isUnlocked && "opacity-60 grayscale"
      )}
      onClick={() => isUnlocked && onEquip && onEquip(pet.id)}
    >
      {isEquipped && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      
      {!isUnlocked && (
        <div className="absolute top-3 right-3">
          <Lock className="w-5 h-5 text-slate-400" />
        </div>
      )}
      
      <div className="text-5xl text-center mb-3">{pet.emoji}</div>
      
      <h3 className="font-bold text-slate-800 text-center">{pet.name}</h3>
      
      <div className={cn("mt-2 text-xs font-semibold px-2 py-1 rounded-full text-center", rarityStyle.bg, rarityStyle.text)}>
        {pet.rarity.charAt(0).toUpperCase() + pet.rarity.slice(1)}
      </div>
      
      <p className="text-xs text-slate-500 mt-2 text-center line-clamp-2">{pet.description}</p>
      
      {!isUnlocked && (
        <div className="mt-3 text-center">
          <span className="text-xs font-medium text-slate-400">
            {xpNeeded.toLocaleString()} XP needed
          </span>
        </div>
      )}
      
      {isUnlocked && !isEquipped && (
        <div className="mt-3 text-center">
          <span className="text-xs font-medium text-emerald-600">Click to equip</span>
        </div>
      )}
    </motion.div>
  );
}