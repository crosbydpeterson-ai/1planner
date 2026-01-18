import React from 'react';
import { Lock, Check, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import { RARITY_COLORS } from './ThemeCatalog';
import { cn } from '@/lib/utils';

export default function ThemeCard({ theme, isUnlocked, isEquipped, onEquip, userXp }) {
  const rarityStyle = RARITY_COLORS[theme.rarity];
  const xpNeeded = theme.xpRequired - userXp;
  
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative rounded-2xl border-2 p-4 transition-all cursor-pointer overflow-hidden",
        isUnlocked ? rarityStyle.border : "border-slate-200",
        isEquipped && "ring-2 ring-offset-2 ring-amber-400",
        !isUnlocked && "opacity-60"
      )}
      onClick={() => isUnlocked && onEquip && onEquip(theme.id)}
    >
      {isEquipped && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg z-10">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      
      {!isUnlocked && (
        <div className="absolute top-3 right-3 z-10">
          <Lock className="w-5 h-5 text-slate-400" />
        </div>
      )}
      
      {/* Color preview */}
      <div 
        className="h-16 -mx-4 -mt-4 mb-3 flex items-center justify-center"
        style={{ backgroundColor: theme.colors.bg }}
      >
        <div className="flex gap-2">
          <div 
            className="w-8 h-8 rounded-lg shadow-sm"
            style={{ backgroundColor: theme.colors.primary }}
          />
          <div 
            className="w-8 h-8 rounded-lg shadow-sm"
            style={{ backgroundColor: theme.colors.secondary }}
          />
          <div 
            className="w-8 h-8 rounded-lg shadow-sm"
            style={{ backgroundColor: theme.colors.accent }}
          />
        </div>
      </div>
      
      <h3 className="font-bold text-slate-800 text-center">{theme.name}</h3>
      
      <div className={cn("mt-2 text-xs font-semibold px-2 py-1 rounded-full text-center", rarityStyle.bg, rarityStyle.text)}>
        {theme.rarity.charAt(0).toUpperCase() + theme.rarity.slice(1)}
      </div>
      
      <p className="text-xs text-slate-500 mt-2 text-center line-clamp-2">{theme.description}</p>
      
      {!isUnlocked && (
        <div className="mt-3 text-center">
          <span className="text-xs font-medium text-slate-400">
            {xpNeeded.toLocaleString()} XP needed
          </span>
        </div>
      )}
      
      {isUnlocked && !isEquipped && (
        <div className="mt-3 text-center">
          <span className="text-xs font-medium text-emerald-600">Click to apply</span>
        </div>
      )}
    </motion.div>
  );
}