import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function AdminEmailBroadcast() {
  const [subject, setSubject] = useState('Announcements from Crosby');
  const [body, setBody] = useState('<p>Hi! This is a test announcement.</p>');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const send = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const res = await base44.functions.invoke('sendAdminBroadcast', { subject, body });
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-lg font-semibold">Email All Users</h3>
        <span className="text-xs text-slate-500">From: 1planner@factvsfalse.com (Gmail)</span>
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
              <span>Sent to {result.sent} users.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}