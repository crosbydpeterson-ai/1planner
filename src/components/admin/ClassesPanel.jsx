import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Users, ArrowRight, RefreshCw, Check, X } from 'lucide-react';
import { useTeachers } from '@/hooks/useTeachers';
import TeacherRosterDialog from '@/components/admin/TeacherRosterDialog';
import StartNewYearDialog from '@/components/admin/StartNewYearDialog';

export default function ClassesPanel() {
  const { teachers, loading, reload } = useTeachers();
  const [users, setUsers] = useState([]);
  const [newName, setNewName] = useState({ math: '', reading: '' });
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [rosterTeacher, setRosterTeacher] = useState(null);
  const [showNewYear, setShowNewYear] = useState(false);
  const [bulk, setBulk] = useState({ math: { from: '', to: '' }, reading: { from: '', to: '' } });

  useEffect(() => {
    (async () => {
      try {
        const all = await base44.entities.UserProfile.list();
        setUsers(all);
      } catch (e) {
        console.error('Failed to load users', e);
      }
    })();
  }, []);

  const countFor = (teacherId, subject) => {
    const field = subject === 'math' ? 'mathTeacher' : 'readingTeacher';
    return users.filter((u) => u[field] === teacherId).length;
  };

  const addTeacher = async (subject) => {
    const name = newName[subject].trim();
    if (!name) {
      toast.error('Enter a teacher name');
      return;
    }
    try {
      const sortOrder = (teachers[subject].length || 0);
      await base44.entities.Teacher.create({ name, subject, isActive: true, sortOrder });
      setNewName({ ...newName, [subject]: '' });
      reload();
      toast.success(`${name} added to ${subject}`);
    } catch (e) {
      toast.error('Failed to add teacher');
    }
  };

  const startRename = (t) => {
    setEditingId(t.id);
    setEditName(t.name);
  };

  const saveRename = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      await base44.entities.Teacher.update(editingId, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
      reload();
      toast.success('Teacher renamed');
    } catch (e) {
      toast.error('Failed to rename');
    }
  };

  const removeTeacher = async (t) => {
    const count = countFor(t.id, t.subject);
    const msg = count > 0
      ? `${count} students are assigned to ${t.name}. They will need to re-pick their teacher on next login. Remove anyway?`
      : `Remove ${t.name}?`;
    if (!window.confirm(msg)) return;
    try {
      // Clear the teacher field on affected students so they re-pick
      if (count > 0) {
        const field = t.subject === 'math' ? 'mathTeacher' : 'readingTeacher';
        await base44.entities.UserProfile.updateMany(
          { [field]: t.id },
          { $set: { [field]: '' } }
        );
      }
      await base44.entities.Teacher.delete(t.id);
      reload();
      toast.success('Teacher removed');
    } catch (e) {
      toast.error('Failed to remove teacher');
    }
  };

  const bulkReassign = async (subject) => {
    const { from, to } = bulk[subject];
    if (!from || !to || from === to) {
      toast.error('Select a source and target teacher');
      return;
    }
    const field = subject === 'math' ? 'mathTeacher' : 'readingTeacher';
    const count = countFor(from, subject);
    if (count === 0) {
      toast.info('No students in that class');
      return;
    }
    if (!window.confirm(`Move ${count} students to the new teacher?`)) return;
    try {
      await base44.entities.UserProfile.updateMany(
        { [field]: from },
        { $set: { [field]: to } }
      );
      // refresh users
      const all = await base44.entities.UserProfile.list();
      setUsers(all);
      setBulk({ ...bulk, [subject]: { from: '', to: '' } });
      toast.success(`${count} students moved`);
    } catch (e) {
      toast.error('Bulk reassign failed');
    }
  };

  const onReassigned = async () => {
    const all = await base44.entities.UserProfile.list();
    setUsers(all);
  };

  if (loading) return <div className="text-slate-400 text-sm py-4">Loading classes...</div>;

  const renderSubject = (subject, label, icon) => {
    const list = teachers[subject];
    return (
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">{icon}</span>
          <h3 className="text-white font-semibold">{label} Teachers</h3>
          <span className="text-xs text-slate-500 ml-auto">{list.length} teachers</span>
        </div>

        {/* Add new */}
        <div className="flex gap-2 mb-4">
          <Input
            value={newName[subject]}
            onChange={(e) => setNewName({ ...newName, [subject]: e.target.value })}
            placeholder="Add teacher name..."
            className="bg-slate-700 border-slate-600 text-white"
            onKeyDown={(e) => e.key === 'Enter' && addTeacher(subject)}
          />
          <Button size="sm" onClick={() => addTeacher(subject)} className="bg-indigo-600">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Teacher list */}
        <div className="space-y-2">
          {list.map((t) => (
            <div key={t.id} className="bg-slate-700/40 rounded-xl p-3 flex items-center justify-between gap-2">
              {editingId === t.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                    className="bg-slate-700 border-slate-600 text-white h-8"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={saveRename} className="text-emerald-400 h-8 w-8 p-0"><Check className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-slate-400 h-8 w-8 p-0"><X className="w-4 h-4" /></Button>
                  </div>
                </>
              ) : (
                <>
                  <button onClick={() => setRosterTeacher(t)} className="flex items-center gap-2 min-w-0 text-left flex-1">
                    <span className="text-sm text-white font-medium truncate">{t.name}</span>
                    <span className="text-xs bg-slate-600 text-slate-300 px-1.5 py-0.5 rounded">{countFor(t.id, subject)} students</span>
                  </button>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => startRename(t)} className="text-slate-400 hover:text-white h-8 w-8 p-0"><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => removeTeacher(t)} className="text-red-400 hover:text-red-300 h-8 w-8 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </>
              )}
            </div>
          ))}
          {list.length === 0 && <p className="text-xs text-slate-500 text-center py-2">No teachers yet</p>}
        </div>

        {/* Bulk reassign */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1"><ArrowRight className="w-3 h-3" /> Move all students</p>
          <div className="flex items-center gap-1.5">
            <Select value={bulk[subject].from} onValueChange={(v) => setBulk({ ...bulk, [subject]: { ...bulk[subject], from: v } })}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs h-8 flex-1"><SelectValue placeholder="From" /></SelectTrigger>
              <SelectContent>{list.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <Select value={bulk[subject].to} onValueChange={(v) => setBulk({ ...bulk, [subject]: { ...bulk[subject], to: v } })}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs h-8 flex-1"><SelectValue placeholder="To" /></SelectTrigger>
              <SelectContent>{list.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" onClick={() => bulkReassign(subject)} className="bg-amber-600 h-8">Move</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* New School Year */}
      <div className="bg-gradient-to-r from-red-500/10 to-amber-500/10 rounded-2xl p-5 border border-red-500/20 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2"><RefreshCw className="w-5 h-5 text-red-400" /> New School Year</h3>
          <p className="text-slate-400 text-sm mt-1">Wipe all XP and force students to re-pick their teachers. Pets, coins, gems, and cosmetics are kept.</p>
        </div>
        <Button onClick={() => setShowNewYear(true)} className="bg-red-600 flex-shrink-0">
          <RefreshCw className="w-4 h-4 mr-1" /> Start New Year
        </Button>
      </div>

      {/* Subject columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSubject('math', 'Math', '🧮')}
        {renderSubject('reading', 'Reading', '📚')}
      </div>

      <TeacherRosterDialog
        teacher={rosterTeacher}
        users={users}
        teachers={teachers}
        open={!!rosterTeacher}
        onOpenChange={(o) => !o && setRosterTeacher(null)}
        onReassigned={onReassigned}
      />
      <StartNewYearDialog open={showNewYear} onOpenChange={setShowNewYear} onComplete={onReassigned} />
    </div>
  );
}