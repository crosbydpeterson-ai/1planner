import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getTeacherName } from '@/lib/teachers';
import { buildEntries, resolveEligibleProfiles } from '@/lib/raffleLogic';

/**
 * Eligibility picker. Uses the same class fields the rest of the app uses:
 * profile.mathTeacher / readingTeacher and the subjectAssignments map.
 */
export default function RaffleEligibilityFields({ eligibility, onChange, profiles = [], teachers, subjects = [] }) {
  const [search, setSearch] = useState('');
  const scope = eligibility.scope || 'everyone';
  const subject = eligibility.subject || 'math';

  const classTeachers = useMemo(
    () => (teachers?.all || []).filter((t) => t.subject === subject && t.isActive !== false),
    [teachers, subject]
  );

  const subjectOptions = useMemo(() => {
    const builtins = [
      { slug: 'math', name: 'Math' },
      { slug: 'reading', name: 'Reading' },
    ];
    const custom = subjects
      .filter((s) => !s.isBuiltin && s.isActive !== false)
      .map((s) => ({ slug: s.slug, name: s.name }));
    return [...builtins, ...custom];
  }, [subjects]);

  const preview = useMemo(() => {
    const { eligible } = resolveEligibleProfiles(profiles, eligibility);
    return buildEntries(eligible);
  }, [profiles, eligibility]);

  const selectedIds = new Set(eligibility.profileIds || []);
  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return profiles
      .filter((p) => (p.username || '').toLowerCase().includes(term))
      .slice(0, 8);
  }, [profiles, search]);

  const toggleProfile = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ ...eligibility, profileIds: [...next] });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-slate-300">Who gets one automatic entry?</Label>
        <Select
          value={scope}
          onValueChange={(v) =>
            onChange({
              ...eligibility,
              scope: v,
              subject: v === 'class' ? subject : undefined,
              teacherId: v === 'class' ? eligibility.teacherId || '' : undefined,
              profileIds: v === 'profiles' ? eligibility.profileIds || [] : [],
            })
          }
        >
          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="everyone">Everyone with an account</SelectItem>
            <SelectItem value="class">A class (subject + teacher)</SelectItem>
            <SelectItem value="profiles">Specific students</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {scope === 'class' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Select
            value={subject}
            onValueChange={(v) => onChange({ ...eligibility, subject: v, teacherId: '' })}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {subjectOptions.map((s) => (
                <SelectItem key={s.slug} value={s.slug}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={eligibility.teacherId || ''}
            onValueChange={(v) => onChange({ ...eligibility, teacherId: v })}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Teacher" />
            </SelectTrigger>
            <SelectContent>
              {classTeachers.length === 0 && (
                <SelectItem value="none" disabled>
                  No teachers for this subject yet
                </SelectItem>
              )}
              {classTeachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {getTeacherName(teachers, t.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {scope === 'profiles' && (
        <div className="space-y-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students by username"
            className="bg-slate-700 border-slate-600 text-white"
          />
          {searchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto bg-slate-900/60 rounded-lg border border-slate-700 divide-y divide-slate-700">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProfile(p.id)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>{p.username}</span>
                  <span className="text-xs text-slate-400">
                    {selectedIds.has(p.id) ? 'Selected ✓' : 'Add'}
                  </span>
                </button>
              ))}
            </div>
          )}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap gap-1">
              {[...selectedIds].map((id) => {
                const p = profiles.find((x) => x.id === id);
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="cursor-pointer bg-slate-700 text-slate-100"
                    onClick={() => toggleProfile(id)}
                  >
                    {p?.username || 'Unknown'} ✕
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400">
        {preview.length} student{preview.length === 1 ? '' : 's'} enter, one entry each. Banned accounts are
        left out. The list is frozen when you lock the raffle: students who join later are not added, so they
        need a new raffle.
        {preview.length > 0 && ` Entering: ${preview.slice(0, 6).map((e) => e.username).join(', ')}${
          preview.length > 6 ? ` +${preview.length - 6} more` : ''
        }.`}
      </p>
    </div>
  );
}