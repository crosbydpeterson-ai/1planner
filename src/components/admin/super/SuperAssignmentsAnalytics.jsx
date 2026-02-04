import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SuperAssignmentsAnalytics() {
  const [assignments, setAssignments] = useState([]);
  const [responses, setResponses] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [a, r] = await Promise.all([
          base44.entities.SuperAssignment.list('-created_date'),
          base44.entities.SuperAssignmentResponse.list('-created_date')
        ]);
        setAssignments(a);
        setResponses(r);
        if (a.length && !selectedId) setSelectedId(a[0].id);
      } catch (_) {}
    })();
  }, []);

  const current = useMemo(() => assignments.find(a => a.id === selectedId), [assignments, selectedId]);
  const currentResponses = useMemo(() => responses.filter(r => r.assignmentId === selectedId), [responses, selectedId]);

  const pollBreakdown = useMemo(() => {
    if (!current || current.type !== 'poll') return null;
    const counts = Object.fromEntries((current.options || []).map(o => [o, 0]));
    for (const r of currentResponses) {
      if (r.selectedOption && counts.hasOwnProperty(r.selectedOption)) counts[r.selectedOption] += 1;
    }
    return counts;
  }, [current, currentResponses]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Super Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Select assignment" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.title} • {a.type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-slate-500 text-sm">Total responses: {currentResponses.length}</div>
          </div>

          {current && (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-slate-600">Target: {current.recipientsScope === 'everyone' ? 'Everyone' : current.recipientsScope === 'class' ? `${current.subject}: ${current.targetTeacher}` : `${current.specificUserProfileIds?.length || 0} users`}</div>
              {current.type === 'poll' && pollBreakdown && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(pollBreakdown).map(([opt, count]) => (
                    <div key={opt} className="p-3 rounded-lg border bg-white text-slate-700 flex items-center justify-between">
                      <span>{opt}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              )}
              {current.type !== 'poll' && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {currentResponses.length === 0 ? (
                    <p className="text-slate-500 text-sm">No responses yet</p>
                  ) : (
                    currentResponses.map((r) => (
                      <div key={r.id} className="p-3 rounded-lg border bg-white text-slate-700">
                        <div className="text-xs text-slate-400 mb-1">{r.isAnonymous ? 'Anonymous' : r.userEmail || r.userProfileId}</div>
                        <div className="text-sm whitespace-pre-wrap">{r.content || r.selectedOption}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}