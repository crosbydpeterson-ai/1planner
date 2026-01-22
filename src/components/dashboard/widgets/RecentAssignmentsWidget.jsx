import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, ClipboardList } from 'lucide-react';

export default function RecentAssignmentsWidget({ assignments, completedIds, ...props }) {
  if (!assignments || assignments.length === 0) return null;

  return (
    <motion.div
      {...props}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-5 overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">Recent Quests</h2>
          <Link 
            to={createPageUrl('Assignments')}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {assignments.slice(0, 3).map((assignment) => {
            const isCompleted = completedIds?.includes(assignment.id);
            return (
              <div 
                key={assignment.id}
                className={`p-3 rounded-xl backdrop-blur-sm border ${
                  isCompleted 
                    ? 'bg-emerald-500/20 border-emerald-300/20' 
                    : 'bg-white/20 border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${isCompleted ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>
                    {assignment.title}
                  </span>
                  {assignment.xpReward && (
                    <span className="text-xs font-semibold text-amber-600">+{assignment.xpReward} XP</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}