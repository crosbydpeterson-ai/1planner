import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Shows all students assigned to a given teacher and lets the admin
 * reassign a student to a different teacher of the same subject.
 *
 * Props:
 *  - teacher: the Teacher record being viewed
 *  - users: all UserProfile records
 *  - teachers: { all, math, reading } from useTeachers
 *  - open, onOpenChange, onReassigned
 */
export default function TeacherRosterDialog({ teacher, users, teachers, open, onOpenChange, onReassigned }) {
  const [busyId, setBusyId] = useState(null);

  if (!teacher) return null;

  const field = teacher.subject === 'math' ? 'mathTeacher' : 'readingTeacher';
  const roster = users.filter((u) => u[field] === teacher.id);
  const sameSubject = (teachers?.[teacher.subject] || []).filter((t) => t.id !== teacher.id && t.isActive !== false);

  const reassign = async (user, newTeacherId) => {
    if (!newTeacherId) return;
    setBusyId(user.id);
    try {
      await base44.entities.UserProfile.update(user.id, { [field]: newTeacherId });
      toast.success(`${user.username} reassigned`);
      onReassigned?.();
    } catch (e) {
      toast.error('Failed to reassign');
    }
    setBusyId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            {teacher.name} — {teacher.subject === 'math' ? 'Math' : 'Reading'} ({roster.length} students)
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto space-y-2 py-2">
          {roster.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">No students assigned to this teacher.</p>
          )}
          {roster.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{u.username}</p>
                <p className="text-xs text-slate-400">{u.xp || 0} XP</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <Select value="" onValueChange={(v) => reassign(u, v)} disabled={busyId === u.id}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-xs h-8 w-36">
                    <span className="text-slate-400">Move to...</span>
                  </SelectTrigger>
                  <SelectContent>
                    {sameSubject.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}