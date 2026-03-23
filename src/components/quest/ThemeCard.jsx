import React from 'react';
import { Lock, Check, Sparkles, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { RARITY_COLORS } from './ThemeCatalog';
import { cn } from '@/lib/utils';
import { isGradient, extractHex, colorStyle } from '@/components/theme/themeUtils';

export default function ThemeCard({ theme, isUnlocked, isEquipped, onEquip, userXp }) {
  const rarityStyle = RARITY_COLORS[theme.rarity];
  const xpNeeded = theme.xpRequired - userXp;
  const isLegendary = theme.rarity === 'legendary';
  const isEpic = theme.rarity === 'epic';
  const isRare = theme.rarity === 'rare';
  
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative rounded-2xl border-2 transition-all cursor-pointer overflow-hidden",
        isUnlocked ? rarityStyle.border : "border-slate-200",
        isEquipped && "ring-4 ring-offset-2 ring-amber-400",
        !isUnlocked && "opacity-50 grayscale",
        isLegendary && isUnlocked && "shadow-[0_0_30px_rgba(251,191,36,0.4)]",
        isEpic && isUnlocked && "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
        isRare && isUnlocked && "shadow-[0_0_15px_rgba(59,130,246,0.25)]"
      )}
      onClick={() => isUnlocked && onEquip && onEquip(theme.id)}
    >
      {/* Animated background for legendary/epic */}
      {isLegendary && isUnlocked && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400/20 via-yellow-300/20 to-amber-400/20 animate-pulse" />
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: '100%', 
                opacity: 0 
              }}
              animate={{ 
                y: '-10%', 
                opacity: [0, 1, 0],
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                repeat: Infinity, 
                delay: Math.random() * 2 
              }}
            />
          ))}
        </div>
      )}
      
      {isEpic && isUnlocked && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: `${15 + i * 18}%`, top: '10%' }}
              animate={{ 
                y: [0, -8, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
            </motion.div>
          ))}
        </div>
      )}

      {isEquipped && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg z-10"
        >
          <Check className="w-5 h-5 text-white" />
        </motion.div>
      )}
      
      {!isUnlocked && (
        <div className="absolute top-3 right-3 z-10 bg-slate-800/60 rounded-full p-1.5">
          <Lock className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Gorgeous color preview */}
      <div 
        className="h-24 -mx-0 -mt-0 mb-0 flex items-center justify-center relative overflow-hidden rounded-t-xl"
        style={{ 
          background: isGradient(theme.colors.primary) || isGradient(theme.colors.secondary)
            ? `${theme.colors.primary}`
            : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` 
        }}
      >
        {/* Animated waves */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute bottom-0 left-0 right-0 h-16 opacity-30"
            style={{
              background: `radial-gradient(ellipse at 50% 100%, ${extractHex(theme.colors.accent)} 0%, transparent 70%)`
            }}
          />
        </div>
        
        {/* Color orbs */}
        <div className="flex gap-3 relative z-10">
          <motion.div 
            whileHover={{ scale: 1.2, rotate: 10 }}
            className="w-10 h-10 rounded-xl shadow-lg backdrop-blur-sm border-2 border-white/30"
            style={colorStyle(theme.colors.primary)}
          />
          <motion.div 
            whileHover={{ scale: 1.2, rotate: -10 }}
            className="w-10 h-10 rounded-xl shadow-lg backdrop-blur-sm border-2 border-white/30"
            style={colorStyle(theme.colors.secondary)}
          />
          <motion.div 
            whileHover={{ scale: 1.2, rotate: 10 }}
            className="w-10 h-10 rounded-xl shadow-lg backdrop-blur-sm border-2 border-white/30"
            style={colorStyle(theme.colors.accent)}
          />
        </div>
        
        {/* Rarity indicator */}
        {(isLegendary || isEpic) && (
          <div className="absolute top-2 left-2">
            {isLegendary ? (
              <Star className="w-5 h-5 text-yellow-300 fill-yellow-300 drop-shadow-lg" />
            ) : (
              <Zap className="w-5 h-5 text-purple-300 fill-purple-300 drop-shadow-lg" />
            )}
          </div>
        )}
      </div>
      
      {/* Info section */}
      <div className="p-4 bg-white">
        <h3 className="font-bold text-slate-800 text-center text-sm">{theme.name}</h3>
        
        <div className={cn(
          "mt-2 text-xs font-bold px-3 py-1.5 rounded-full text-center uppercase tracking-wide",
          rarityStyle.bg, rarityStyle.text,
          isLegendary && "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700",
          isEpic && "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700"
        )}>
          {isLegendary && '★ '}{theme.rarity}{isLegendary && ' ★'}
        </div>
        
        <p className="text-xs text-slate-500 mt-2 text-center line-clamp-2 italic">{theme.description}</p>
        
        {!isUnlocked && (
          <div className="mt-3 text-center bg-slate-100 rounded-lg py-2">
            <span className="text-xs font-bold text-slate-600">
              🔒 {xpNeeded.toLocaleString()} XP to unlock
            </span>
          </div>
        )}
        
        {isUnlocked && !isEquipped && (
          <motion.div 
            className="mt-3 text-center bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg py-2"
            whileHover={{ scale: 1.02 }}
          >
            <span className="text-xs font-bold text-white">✨ Tap to Apply</span>
          </motion.div>
        )}
        
        {isEquipped && (
          <div className="mt-3 text-center bg-gradient-to-r from-amber-400 to-orange-400 rounded-lg py-2">
            <span className="text-xs font-bold text-white">🎨 Currently Active</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}