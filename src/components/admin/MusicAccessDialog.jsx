import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Lock, GraduationCap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTeachers } from '@/hooks/useTeachers';
import { classKey } from '@/lib/musicAccess';
import { toast } from 'sonner';

export default function MusicAccessDialog({ open, onOpenChange, track, users, onSaved }) {
  const { teachers } = useTeachers();
  const [assigned, setAssigned] = useState([]);
  const [lockedUsers, setLockedUsers] = useState([]);
  const [lockedClasses, setLockedClasses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (track) {
      setAssigned(track.assignedProfileIds || []);
      setLockedUsers(track.lockedProfileIds || []);
      setLockedClasses(track.lockedClassKeys || []);
    }
  }, [track, open]);

  const toggle = (list, setList, id) => {
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  };

  const allClassKeys = [
    ...teachers.math.map(t => classKey('math', t.id)),
    ...teachers.reading.map(t => classKey('reading', t.id)),
  ];

  const className = (key) => {
    const [subj, tid] = key.split(':');
    const t = teachers[subj]?.find(x => x.id === tid);
    return `${subj === 'math' ? 'Math' : 'Reading'} — ${t?.name || tid}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await base44.entities.MusicTrack.update(track.id, {
        assignedProfileIds: assigned,
        lockedProfileIds: lockedUsers,
        lockedClassKeys: lockedClasses,
      });
      onSaved(updated);
      toast.success('Access updated');
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed to save access');
    }
    setSaving(false);
  };

  if (!track) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Access: {track.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* Assign */}
          <div>
            <Label className="flex items-center gap-1 mb-2"><Users className="w-4 h-4" /> Assign to specific students</Label>
            <p className="text-xs text-slate-400 mb-2">If empty, everyone can see this track. Pick students to make it theirs only.</p>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
              {users.map(u => (
                <label key={u.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={assigned.includes(u.id)} onChange={() => toggle(assigned, setAssigned, u.id)} className="w-4 h-4 accent-indigo-600" />
                  <span className="text-sm text-slate-700">{u.username}</span>
                </label>
              ))}
              {users.length === 0 && <p className="text-xs text-slate-400 p-3">No users</p>}
            </div>
          </div>

          {/* Lock users */}
          <div>
            <Label className="flex items-center gap-1 mb-2"><Lock className="w-4 h-4" /> Lock away from students</Label>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
              {users.map(u => (
                <label key={u.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" checked={lockedUsers.includes(u.id)} onChange={() => toggle(lockedUsers, setLockedUsers, u.id)} className="w-4 h-4 accent-red-500" />
                  <span className="text-sm text-slate-700">{u.username}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Lock classes */}
          <div>
            <Label className="flex items-center gap-1 mb-2"><GraduationCap className="w-4 h-4" /> Lock away from classes</Label>
            <div className="flex flex-wrap gap-2">
              {allClassKeys.map(k => (
                <button key={k} onClick={() => toggle(lockedClasses, setLockedClasses, k)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${lockedClasses.includes(k) ? 'bg-red-500/10 border-red-500/50 text-red-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                  {lockedClasses.includes(k) && <Check className="w-3 h-3 inline mr-1" />}{className(k)}
                </button>
              ))}
              {allClassKeys.length === 0 && <p className="text-xs text-slate-400">No classes yet.</p>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>Save access</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}