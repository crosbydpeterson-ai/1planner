import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save } from 'lucide-react';
import { getActiveSubjects } from '@/lib/subjects';
import { loadAndSeedTeachers } from '@/lib/teachers';

/**
 * Lets a student pick a teacher for each custom subject.
 * Built-in math/reading are managed separately (mathTeacher/readingTeacher fields).
 */
export default function SubjectAssignmentSelector({ profile, onUpdated }) {
  const [subjects, setSubjects] = useState([]);
  const [teachersBySubject, setTeachersBySubject] = useState({});
  const [assignments, setAssignments] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const active = await getActiveSubjects();
        const custom = active.filter((s) => !s.isBuiltin);
        setSubjects(custom);

        // Load teachers grouped by custom subject slug
        const allTeachers = await loadAndSeedTeachers();
        const grouped = {};
        custom.forEach((s) => {
          grouped[s.slug] = allTeachers.filter((t) => t.subject === s.slug && t.isActive !== false);
        });
        setTeachersBySubject(grouped);

        // Initialize from profile
        const sa = profile.subjectAssignments || {};
        const init = {};
        custom.forEach((s) => {
          init[s.slug] = sa[s.slug] || '';
        });
        setAssignments(init);
      } catch (e) {
        console.error('Failed to load subjects', e);
      }
    })();
  }, [profile.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const current = profile.subjectAssignments || {};
      const updated = { ...current };
      subjects.forEach((s) => {
        if (assignments[s.slug]) {
          updated[s.slug] = assignments[s.slug];
        } else {
          delete updated[s.slug];
        }
      });
      await base44.entities.UserProfile.update(profile.id, { subjectAssignments: updated });
      toast.success('Subject teachers saved!');
      if (onUpdated) onUpdated({ ...profile, subjectAssignments: updated });
    } catch (e) {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  if (subjects.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 mb-6">
      <h2 className="text-xl font-semibold mb-2 text-slate-700">📚 Your Subject Teachers</h2>
      <p className="text-slate-600 mb-4 text-sm">Pick a teacher for each additional subject your admin has set up.</p>
      <div className="space-y-4">
        {subjects.map((s) => (
          <div key={s.slug} className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span>{s.emoji || '📘'}</span>
              {s.name} Teacher
            </label>
            <Select
              value={assignments[s.slug] || ''}
              onValueChange={(v) => setAssignments({ ...assignments, [s.slug]: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Select your ${s.name} teacher`} />
              </SelectTrigger>
              <SelectContent>
                {(teachersBySubject[s.slug] || []).length === 0 ? (
                  <SelectItem value="_none" disabled>No teachers assigned yet</SelectItem>
                ) : (
                  teachersBySubject[s.slug].map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        ))}
        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save Subject Teachers</>}
        </Button>
      </div>
    </div>
  );
}