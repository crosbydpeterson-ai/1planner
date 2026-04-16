import React from 'react';
import { motion } from 'framer-motion';

export default function EggCard({ egg, count, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative bg-white/40 backdrop-blur-xl border border-white/40 rounded-2xl p-5 flex flex-col items-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
    >
      {/* Count badge */}
      {count > 0 && (
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-md">
          {count}
        </div>
      )}
      
      {/* Egg glow */}
      <div 
        className="w-20 h-24 rounded-full flex items-center justify-center text-4xl relative overflow-hidden"
        style={{ 
          background: egg.imageUrl ? 'transparent' : `radial-gradient(ellipse at 30% 30%, ${egg.color || '#6366f1'}55, ${egg.color || '#6366f1'}22)`,
          boxShadow: `0 0 20px ${egg.color || '#6366f1'}33`
        }}
      >
        {egg.imageUrl ? (
          <img src={egg.imageUrl} alt={egg.name} className="w-full h-full object-contain" />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-full" />
            <span className="relative">{egg.emoji || '🥚'}</span>
          </>
        )}
      </div>
      
      <div className="text-center">
        <h3 className="font-bold text-slate-800 text-sm">{egg.name}</h3>
        {egg.description && <p className="text-xs text-slate-500 mt-0.5">{egg.description}</p>}
      </div>

      <div className="text-xs font-medium text-indigo-600">
        {count} egg{count !== 1 ? 's' : ''} available
      </div>
    </motion.button>
  );
}