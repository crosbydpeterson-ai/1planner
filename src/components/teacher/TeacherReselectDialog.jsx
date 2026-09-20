import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calculator, BookOpen, Check } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Forced teacher re-selection popup.
 * Shown when the admin has triggered a "new school year" reset and the
 * student has not yet picked their new teachers. Cannot be dismissed
 * without selecting both teachers.
 *
 * Props:
 *  - open: boolean
 *  - profile: current UserProfile
 *  - teachers: { all, math, reading } from useTeachers
 *  - onComplete: (updatedProfile) => void
 */
export default function TeacherReselectDialog({ open, profile, teachers, onComplete }) {
  const [mathId, setMathId] = useState('');
  const [readingId, setReadingId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && profile) {
      setMathId(profile.mathTeacher || '');
      setReadingId(profile.readingTeacher || '');
    }
  }, [open, profile]);

  const handleSave = async () => {
    if (!mathId) {
      toast.error('Please select your Math teacher');
      return;
    }
    if (!readingId) {
      toast.error('Please select your Reading teacher');
      return;
    }
    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, {
        mathTeacher: mathId,
        readingTeacher: readingId,
      });
      toast.success('Teachers updated — welcome to the new school year!');
      onComplete?.({ ...profile, mathTeacher: mathId, readingTeacher: readingId });
    } catch (e) {
      toast.error('Failed to save. Please try again.');
    }
    setSaving(false);
  };

  const mathTeachers = (teachers?.math || []).filter((t) => t.isActive !== false);
  const readingTeachers = (teachers?.reading || []).filter((t) => t.isActive !== false);

  return (
    <Dialog open={open} onOpenChange={() => { /* prevent dismiss */ }}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>New School Year — Pick Your Teachers</DialogTitle>
          <DialogDescription>
            Your admin has started a new school year. Please select your new Math and Reading
            teachers to continue. Your pets, coins, gems, and cosmetics are safe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Math */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium">
              <Calculator className="w-4 h-4" /> Math Teacher
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mathTeachers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMathId(t.id)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    mathId === t.id
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {t.name}
                  {mathId === t.id && <Check className="w-4 h-4" />}
                </button>
              ))}
              {mathTeachers.length === 0 && (
                <p className="text-xs text-slate-400 col-span-2">No math teachers available.</p>
              )}
            </div>
          </div>

          {/* Reading */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-700 font-medium">
              <BookOpen className="w-4 h-4" /> Reading Teacher
            </div>
            <div className="grid grid-cols-2 gap-2">
              {readingTeachers.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setReadingId(t.id)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                    readingId === t.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {t.name}
                  {readingId === t.id && <Check className="w-4 h-4" />}
                </button>
              ))}
              {readingTeachers.length === 0 && (
                <p className="text-xs text-slate-400 col-span-2">No reading teachers available.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600">
            {saving ? 'Saving...' : 'Confirm Teachers'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}