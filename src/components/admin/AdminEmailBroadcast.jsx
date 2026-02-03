import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminEmailBroadcast() {
  const [subject, setSubject] = useState('Announcements from Crosby');
  const [body, setBody] = useState('<p>Hi! This is a test announcement.</p>');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [sendingAssign, setSendingAssign] = useState(false);

  const send = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendAdminBroadcast', { subject, body });
      setResult(res.data);
    } catch (e) {
      const apiError = e?.response?.data?.error;
      setResult({ error: apiError || e.message });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Assignment.list('-created_date');
        setAssignments(list);
      } catch (e) {
        // ignore loading errors here
      }
    })();
  }, []);

  const notifyAssignment = async () => {
    if (!selectedAssignmentId) return;
    setSendingAssign(true);
    try {
      const res = await base44.functions.invoke('sendAssignmentNotification', { assignmentId: selectedAssignmentId });
      setResult(res.data);
    } catch (e) {
      const apiError = e?.response?.data?.error;
      setResult({ error: apiError || e.message });
    } finally {
      setSendingAssign(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-lg font-semibold">Email All Users</h3>
        <span className="text-xs text-slate-500">From: 1planner@factvsfalse.com (No-Reply via Base44)</span>
      </div>
      <div className="space-y-3">
        <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Textarea className="min-h-40" placeholder="HTML body (allowed)" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex gap-2 justify-end">
          <Button onClick={send} disabled={sending || !subject.trim() || !body.trim()}>
            {sending ? 'Sending…' : 'Send to all'}
          </Button>
        </div>
        {result && (
          <div className="text-sm text-slate-600">
            {result.error ? (
              <span className="text-red-600">Error: {result.error}</span>
            ) : (
              <span>Sent to {result.sent} users{typeof result.failedCount === 'number' && result.failedCount > 0 ? `, ${result.failedCount} failed` : ''}.</span>
            )}
          </div>
        )}

        <div className="mt-8 border-t pt-4">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-lg font-semibold">Instant Assignment Notify</h3>
            <span className="text-xs text-slate-500">Send an assignment to the right students now</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select value={selectedAssignmentId} onValueChange={setSelectedAssignmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignment" />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title} • {a.subject === 'everyone' ? 'Everyone' : `${a.subject}: ${a.target}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={notifyAssignment} disabled={sendingAssign || !selectedAssignmentId}>
              {sendingAssign ? 'Notifying…' : 'Notify Now'}
            </Button>
          </div>
        </div>
        </div>
        </div>
  );
}