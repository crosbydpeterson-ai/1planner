import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight } from 'lucide-react';

export default function PetWidget({ pet, themeColors }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-4 overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{pet?.emoji || '🟢'}</div>
            <div>
              <p className="text-xs text-slate-400">Companion</p>
              <p className="font-semibold text-slate-800">{pet?.name || 'Starter Slime'}</p>
            </div>
          </div>
          <Link 
            to={createPageUrl('Rewards')}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            Change <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        {/* Theme preview */}
        <div className="mt-3 pt-3 border-t border-white/20">
          <p className="text-xs text-slate-400 mb-2">Active Theme</p>
          <div className="flex gap-1">
            <div 
              className="w-6 h-6 rounded-full shadow-lg ring-1 ring-white/30" 
              style={{ backgroundColor: themeColors?.primary || '#6366f1' }} 
            />
            <div 
              className="w-6 h-6 rounded-full shadow-lg ring-1 ring-white/30" 
              style={{ backgroundColor: themeColors?.secondary || '#a855f7' }} 
            />
            <div 
              className="w-6 h-6 rounded-full shadow-lg ring-1 ring-white/30" 
              style={{ backgroundColor: themeColors?.accent || '#f59e0b' }} 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}