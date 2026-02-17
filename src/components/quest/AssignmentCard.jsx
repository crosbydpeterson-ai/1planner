import React from 'react';
import { Check, Clock, BookOpen, Calculator, Users, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const SUBJECT_ICONS = {
  math: Calculator,
  reading: BookOpen,
  everyone: Users
};

export default function AssignmentCard({ assignment, isCompleted, onComplete }) {
  const Icon = SUBJECT_ICONS[assignment.subject] || Users;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-2xl p-5 transition-all overflow-hidden",
        "bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg",
        isCompleted && "opacity-60",
        assignment.isFlagged && "border-amber-300/50"
      )}
    >
      {/* Glass gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20 backdrop-blur-sm border border-white/20">
              <Icon className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-slate-600">
              {assignment.subject === "everyone" ? "All Students" : assignment.subject.charAt(0).toUpperCase() + assignment.subject.slice(1)}
              {assignment.target !== "everyone" && ` • ${assignment.target}`}
            </span>
            {(assignment.isFlagged || (assignment.created_date && (() => {
              const c = new Date(assignment.created_date);
              const m = Math.floor((Date.now() - c.getTime()) / 60000);
              const toMin = (d) => d.getHours() * 60 + d.getMinutes();
              const start = 8 * 60 + 30;
              const end = 14 * 60 + 50;
              const now = new Date();
              const postedDuring = toMin(c) >= start && toMin(c) <= end;
              const nowDuring = toMin(now) >= start && toMin(now) <= end;
              return postedDuring && nowDuring && m <= 30;
            })()) ) && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100/80 text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Flagged
              </span>
            )}
          </div>
          
          <h3 className={cn("font-bold text-lg text-slate-800", isCompleted && "line-through")}>
            {assignment.title}
          </h3>
          
          {assignment.description && (
            <p className="text-slate-500 text-sm mt-1">{assignment.description}</p>
          )}
          
          <div className="flex items-center gap-4 mt-3">
            {assignment.dueDate && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                Due {format(new Date(assignment.dueDate), 'MMM d, yyyy')}
              </div>
            )}
            {assignment.xpReward && !assignment.isFlagged && (
              <div className="text-xs font-semibold text-amber-600">
                +{assignment.xpReward} XP
              </div>
            )}
            {assignment.isFlagged && (
              <div className="text-xs text-amber-600">
                XP pending review
              </div>
            )}
          </div>
        </div>
        
        <div>
          {isCompleted ? (
            <div className="w-10 h-10 rounded-full bg-emerald-500/30 backdrop-blur-sm flex items-center justify-center border border-emerald-300/20">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => onComplete && onComplete(assignment)}
              className="bg-white/20 backdrop-blur-sm border border-white/20 text-slate-700 hover:bg-white/40 shadow-lg"
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}