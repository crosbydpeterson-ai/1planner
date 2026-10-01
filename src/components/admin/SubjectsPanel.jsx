import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Check, X, BookOpen } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { BUILTIN_SUBJECTS } from '@/lib/subjects';

export default function SubjectsPanel() {
  const { subjects, loading, reload } = useSubjects();
  const [newSubject, setNewSubject] = useState({ name: '', emoji: '📘', color: '#6366f1' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', emoji: '', color: '' });

  const customSubjects = subjects.filter((s) => !s.isBuiltin);

  const slugify = (name) =>
    name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  const addSubject = async () => {
    const name = newSubject.name.trim();
    if (!name) {
      toast.error('Enter a subject name');
      return;
    }
    const slug = slugify(name);
    if (!slug) {
      toast.error('Subject name must contain letters or numbers');
      return;
    }
    // Check for duplicate slug
    if (subjects.some((s) => s.slug === slug)) {
      toast.error('A subject with that name already exists');
      return;
    }
    try {
      await base44.entities.Subject.create({
        name,
        slug,
        emoji: newSubject.emoji || '📘',
        color: newSubject.color || '#6366f1',
        isActive: true,
        sortOrder: customSubjects.length + 2,
      });
      setNewSubject({ name: '', emoji: '📘', color: '#6366f1' });
      reload();
      toast.success(`${name} subject added`);
    } catch (e) {
      toast.error('Failed to add subject');
    }
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditForm({ name: s.name, emoji: s.emoji || '📘', color: s.color || '#6366f1' });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      await base44.entities.Subject.update(editingId, {
        name: editForm.name.trim(),
        emoji: editForm.emoji || '📘',
        color: editForm.color || '#6366f1',
      });
      setEditingId(null);
      reload();
      toast.success('Subject updated');
    } catch (e) {
      toast.error('Failed to update subject');
    }
  };

  const toggleActive = async (s) => {
    try {
      await base44.entities.Subject.update(s.id, { isActive: !s.isActive });
      reload();
      toast.success(`${s.name} ${s.isActive ? 'hidden' : 'activated'}`);
    } catch (e) {
      toast.error('Failed to toggle subject');
    }
  };

  const removeSubject = async (s) => {
    if (!window.confirm(`Remove the "${s.name}" subject? Teachers assigned to it will need reassignment.`)) return;
    try {
      // Clear subjectAssignments for this slug on all users
      await base44.entities.UserProfile.list().then(async (allUsers) => {
        for (const u of allUsers) {
          const sa = u.subjectAssignments || {};
          if (sa[s.slug]) {
            const updated = { ...sa };
            delete updated[s.slug];
            await base44.entities.UserProfile.update(u.id, { subjectAssignments: updated });
          }
        }
      });
      // Delete teachers assigned to this subject
      const teachers = await base44.entities.Teacher.filter({ subject: s.slug });
      for (const t of teachers) {
        await base44.entities.Teacher.delete(t.id);
      }
      await base44.entities.Subject.delete(s.id);
      reload();
      toast.success('Subject removed');
    } catch (e) {
      toast.error('Failed to remove subject');
    }
  };

  if (loading) return <div className="text-slate-400 text-sm py-4">Loading subjects...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-5 h-5 text-indigo-400" />
        <h3 className="text-white font-semibold">Subject Categories</h3>
      </div>
      <p className="text-slate-400 text-sm">
        Add custom subjects beyond Math and Reading. Admins can assign teachers to these subjects,
        and students pick a teacher for each one. Only active subjects appear in student selection.
      </p>

      {/* Built-in subjects (read-only) */}
      <div className="space-y-2">
        {BUILTIN_SUBJECTS.map((s) => (
          <div key={s.slug} className="bg-slate-700/40 rounded-xl p-3 flex items-center gap-3 opacity-70">
            <span className="text-xl">{s.emoji}</span>
            <span className="text-sm text-white font-medium">{s.name}</span>
            <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded ml-1">Built-in</span>
          </div>
        ))}
      </div>

      {/* Custom subjects */}
      <div className="space-y-2">
        {customSubjects.map((s) => (
          <div key={s.id} className="bg-slate-700/40 rounded-xl p-3 flex items-center justify-between gap-2">
            {editingId === s.id ? (
              <>
                <Input
                  value={editForm.emoji}
                  onChange={(e) => setEditForm({ ...editForm, emoji: e.target.value.slice(0, 2) })}
                  className="w-12 bg-slate-700 border-slate-600 text-white text-center h-8"
                  maxLength={2}
                />
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  className="flex-1 bg-slate-700 border-slate-600 text-white h-8"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={saveEdit} className="text-emerald-400 h-8 w-8 p-0"><Check className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-slate-400 h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
                </div>
              </>
            ) : (
              <>
                <span className="text-xl">{s.emoji || '📘'}</span>
                <span className="text-sm text-white font-medium flex-1">{s.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${s.isActive !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-slate-400'}`}>
                  {s.isActive !== false ? 'Active' : 'Hidden'}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  <Switch checked={s.isActive !== false} onCheckedChange={() => toggleActive(s)} />
                  <Button size="sm" variant="ghost" onClick={() => startEdit(s)} className="text-slate-400 hover:text-white h-8 w-8 p-0"><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => removeSubject(s)} className="text-red-400 hover:text-red-300 h-8 w-8 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </>
            )}
          </div>
        ))}
        {customSubjects.length === 0 && <p className="text-xs text-slate-500 text-center py-2">No custom subjects yet</p>}
      </div>

      {/* Add new subject */}
      <div className="pt-4 border-t border-slate-700 space-y-3">
        <Label className="text-slate-300">Add New Subject</Label>
        <div className="flex gap-2">
          <Input
            value={newSubject.emoji}
            onChange={(e) => setNewSubject({ ...newSubject, emoji: e.target.value.slice(0, 2) })}
            placeholder="📘"
            className="w-14 bg-slate-700 border-slate-600 text-white text-center"
            maxLength={2}
          />
          <Input
            value={newSubject.name}
            onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
            placeholder="Subject name (e.g. Science, History)"
            className="flex-1 bg-slate-700 border-slate-600 text-white"
            onKeyDown={(e) => e.key === 'Enter' && addSubject()}
          />
          <Button onClick={addSubject} className="bg-indigo-600">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}