import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Start time + the parts of a song playback should jump over. Times are "m:ss". */
export default function MusicTrimFields({ start, onStartChange, segments, onSegmentsChange }) {
  const update = (id, key, value) =>
    onSegmentsChange(segments.map((seg) => (seg.id === id ? { ...seg, [key]: value } : seg)));
  const add = () => onSegmentsChange([...segments, { id: `seg_${Date.now()}`, start: '', end: '' }]);
  const remove = (id) => onSegmentsChange(segments.filter((seg) => seg.id !== id));

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div>
        <p className="text-sm font-medium text-slate-700">Trim the song</p>
        <p className="text-xs text-slate-500">Start later, and jump over any part you don't want heard.</p>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-slate-600">Start at (m:ss)</Label>
        <Input
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          placeholder="0:00"
          className="h-8 w-28"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-slate-600">Parts to skip</Label>
        {segments.length === 0 && <p className="text-xs text-slate-400">Nothing skipped.</p>}
        {segments.map((seg, i) => (
          <div key={seg.id} className="flex items-center gap-2">
            <Input
              value={seg.start}
              onChange={(e) => update(seg.id, 'start', e.target.value)}
              placeholder="from 0:35"
              className="h-8"
            />
            <span className="text-xs text-slate-400">→</span>
            <Input
              value={seg.end}
              onChange={(e) => update(seg.id, 'end', e.target.value)}
              placeholder="to 1:10"
              className="h-8"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-slate-400 hover:text-red-600"
              onClick={() => remove(seg.id)}
              aria-label={`Remove skipped part ${i + 1}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={add} className="gap-1">
          <Plus className="w-3.5 h-3.5" /> Add a part to skip
        </Button>
      </div>
    </div>
  );
}