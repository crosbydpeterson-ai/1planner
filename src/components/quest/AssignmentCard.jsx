import React from 'react';
import { Check, Clock, BookOpen, Calculator, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const SUBJECT_ICONS = {
  math: Calculator,
  reading: BookOpen,
  everyone: Users
};

const SUBJECT_COLORS = {
  math: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  reading: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  everyone: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" }
};

export default function AssignmentCard({ assignment, isCompleted, onComplete }) {
  const Icon = SUBJECT_ICONS[assignment.subject] || Users;
  const colors = SUBJECT_COLORS[assignment.subject] || SUBJECT_COLORS.everyone;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border-2 p-5 transition-all",
        colors.border,
        isCompleted && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors.bg)}>
              <Icon className={cn("w-4 h-4", colors.text)} />
            </div>
            <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", colors.bg, colors.text)}>
              {assignment.subject === "everyone" ? "All Students" : assignment.subject.charAt(0).toUpperCase() + assignment.subject.slice(1)}
              {assignment.target !== "everyone" && ` • ${assignment.target}`}
            </span>
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
            {assignment.xpReward && (
              <div className="text-xs font-semibold text-amber-600">
                +{assignment.xpReward} XP
              </div>
            )}
          </div>
        </div>
        
        <div>
          {isCompleted ? (
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => onComplete && onComplete(assignment)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              Complete
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}