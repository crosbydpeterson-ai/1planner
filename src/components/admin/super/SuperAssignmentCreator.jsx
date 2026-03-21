import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MATH_TEACHERS, READING_TEACHERS } from '@/components/quest/TeacherConfig';
import { toast } from 'sonner';

export default function SuperAssignmentCreator() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('poll');
  const [optionsInput, setOptionsInput] = useState('Yes\nNo');
  const [recipientsScope, setRecipientsScope] = useState('everyone');
  const [subject, setSubject] = useState('everyone');
  const [targetTeacher, setTargetTeacher] = useState('');
  const [specificUserProfileIds, setSpecificUserProfileIds] = useState([]);
  const [userList, setUserList] = useState([]);
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [enablePetGenerator, setEnablePetGenerator] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const users = await base44.entities.UserProfile.list('-created_date');
        setUserList(users);
      } catch (_) {}
    })();
  }, []);

  const options = useMemo(() => optionsInput.split('\n').map(s => s.trim()).filter(Boolean), [optionsInput]);

  const reset = () => {
    setTitle(''); setDescription(''); setType('poll'); setOptionsInput('Yes\nNo');
    setRecipientsScope('everyone'); setSubject('everyone'); setTargetTeacher('');
    setSpecificUserProfileIds([]); setAllowAnonymous(false); setEnablePetGenerator(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Enter a title'); return; }
    if (type === 'poll' && options.length < 2) { toast.error('Add at least 2 options'); return; }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      type,
      recipientsScope,
      subject,
      targetTeacher: targetTeacher || undefined,
      specificUserProfileIds: recipientsScope === 'users' ? specificUserProfileIds : [],
      allowAnonymous,
      enablePetGenerator: type === 'suggestion_box' ? enablePetGenerator : false,
      isActive: true,
    };
    if (type === 'poll') payload.options = options;

    setSaving(true);
    try {
      await base44.entities.SuperAssignment.create(payload);
      toast.success('Super assignment created');
      reset();
    } catch (e) {
      toast.error('Failed to create');
    }
    setSaving(false);
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-3">Create Super Assignment</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-slate-300">Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-slate-300">Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="poll">Poll (single choice)</SelectItem>
              <SelectItem value="short_answer">Short answer</SelectItem>
              <SelectItem value="suggestion_box">Suggestion box</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label className="text-slate-300">Description (optional)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
        </div>
        {type === 'poll' && (
          <div className="md:col-span-2 space-y-2">
            <Label className="text-slate-300">Poll options (one per line)</Label>
            <Textarea value={optionsInput} onChange={(e) => setOptionsInput(e.target.value)} className="bg-slate-700 border-slate-600 text-white min-h-[90px]" />
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-slate-300">Recipients</Label>
          <Select value={recipientsScope} onValueChange={(v) => { setRecipientsScope(v); if (v !== 'class') { setSubject('everyone'); setTargetTeacher(''); } }}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="everyone">Everyone</SelectItem>
              <SelectItem value="class">By class/teacher</SelectItem>
              <SelectItem value="users">Specific users</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {recipientsScope === 'class' && (
          <>
            <div className="space-y-2">
              <Label className="text-slate-300">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">Math</SelectItem>
                  <SelectItem value="reading">Reading</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Teacher</Label>
              <Select value={targetTeacher} onValueChange={setTargetTeacher}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>
                  {(subject === 'math' ? MATH_TEACHERS : READING_TEACHERS).map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        {recipientsScope === 'users' && (
          <div className="md:col-span-2 space-y-2">
            <Label className="text-slate-300">Select Users</Label>
            <div className="bg-slate-700 rounded p-3 max-h-40 overflow-y-auto border border-slate-600">
              {userList.map(u => (
                <label key={u.id} className="flex items-center gap-2 py-1 text-slate-200">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={specificUserProfileIds.includes(u.id)}
                    onChange={(e) => {
                      setSpecificUserProfileIds(prev => e.target.checked ? [...prev, u.id] : prev.filter(id => id !== u.id));
                    }}
                  />
                  <span>{u.username} <span className="text-slate-400 text-xs">({u.mathTeacher}/{u.readingTeacher})</span></span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Switch checked={allowAnonymous} onCheckedChange={setAllowAnonymous} />
          <Label className="text-slate-300">Allow anonymous responses</Label>
        </div>
        {type === 'suggestion_box' && (
          <div className="flex items-center gap-2">
            <Switch checked={enablePetGenerator} onCheckedChange={setEnablePetGenerator} />
            <Label className="text-slate-300">Enable pet generator from responses</Label>
          </div>
        )}
      </div>
      <div className="text-right mt-4">
        <Button onClick={handleCreate} disabled={saving || !title.trim()} className="bg-indigo-600 hover:bg-indigo-700">
          {saving ? 'Creating…' : 'Create'}
        </Button>
      </div>
    </div>
  );
}