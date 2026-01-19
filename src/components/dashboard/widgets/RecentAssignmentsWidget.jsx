import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight, ClipboardList } from 'lucide-react';

export default function RecentAssignmentsWidget({ assignments, completedIds }) {
  if (!assignments || assignments.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-md p-5 border border-slate-100"
    >
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
              className={`p-3 rounded-xl border ${isCompleted ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}
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
    </motion.div>
  );
}