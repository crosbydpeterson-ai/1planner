import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WIDGET_INFO = {
  xp: { name: 'XP Progress', description: 'Your experience progress bar' },
  pet: { name: 'Equipped Pet', description: 'Your current companion and theme' },
  stats: { name: 'Quick Stats', description: 'XP, pets, and completed quests' },
  leaderboard: { name: 'Mini Leaderboard', description: 'Top 3 students' },
  assignments: { name: 'Recent Quests', description: 'Your latest assignments' },
  season: { name: 'Season Progress', description: 'Current season status' },
  nav: { name: 'Quick Navigation', description: 'Navigation cards' },
};

export default function WidgetCustomizer({ 
  activeWidgets, 
  onToggleWidget, 
  onClose,
  onSave 
}) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Customize Widgets</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
            {Object.entries(WIDGET_INFO).map(([id, info]) => {
              const isActive = activeWidgets.includes(id);
              return (
                <div
                  key={id}
                  onClick={() => onToggleWidget(id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isActive 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800">{info.name}</h3>
                      <p className="text-sm text-slate-500">{info.description}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="p-4 border-t border-slate-200 flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onSave} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}