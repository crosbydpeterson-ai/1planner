import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const statusColors = {
  open: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  wont_fix: 'bg-slate-100 text-slate-500',
  submitted: 'bg-yellow-100 text-yellow-700',
  considering: 'bg-purple-100 text-purple-700',
  planned: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
};

export default function FeedbackCard({ item, type, isSuperAdmin, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [response, setResponse] = useState(item.adminResponse || '');
  const [saving, setSaving] = useState(false);

  const statusOptions = type === 'bug'
    ? ['open', 'in_progress', 'resolved', 'wont_fix']
    : ['submitted', 'considering', 'planned', 'completed', 'declined'];

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(item.id, { adminResponse: response });
    setSaving(false);
  };

  const handleStatusChange = async (val) => {
    await onUpdate(item.id, { status: val });
  };

  const emoji = type === 'bug' ? '🐛' : '💡';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{emoji}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{item.title}</p>
            <p className="text-xs text-slate-400">by {item.reporterUsername || 'Unknown'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={statusColors[item.status] + ' text-xs'}>{item.status?.replace('_', ' ')}</Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3">
          <p className="text-sm text-slate-600">{item.description}</p>

          {/* Show admin response to everyone if it exists */}
          {item.adminResponse && !isSuperAdmin && (
            <div className="bg-indigo-50 rounded-lg p-2.5">
              <p className="text-xs font-semibold text-indigo-600 mb-1">Admin Response</p>
              <p className="text-sm text-indigo-800">{item.adminResponse}</p>
            </div>
          )}

          {/* Super admin controls */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <Select value={item.status} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-8 text-xs w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{s.replace('_', ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Type a response..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="text-sm min-h-[60px]"
              />
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                <Send className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Send Response'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}