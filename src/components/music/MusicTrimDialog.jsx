import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import MusicTrimFields from '@/components/admin/music/MusicTrimFields';
import { parseTimeInput, formatClock } from '@/lib/musicTrim';
import { musicPlayer } from '@/lib/musicPlayerStore';
import { toast } from 'sonner';

/**
 * Trim the song that is playing right now.
 *
 * The admin can take the start time from the spot they are listening to, add
 * parts to skip (a new part starts at the current spot too), and save without
 * leaving the music bar. Saving updates the track record and applies the cuts
 * to the running song immediately, without restarting it.
 */
export default function MusicTrimDialog({ open, onOpenChange, track, onSaved }) {
  const [startInput, setStartInput] = useState('');
  const [segments, setSegments] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !track) return;
    setStartInput(track.startAtSeconds > 0 ? formatClock(track.startAtSeconds) : '');
    setSegments(
      (track.skipSegments || []).map((seg, i) => ({
        id: `seg_${i}`,
        start: formatClock(seg.start),
        end: formatClock(seg.end),
      }))
    );
  }, [open, track?.id]);

  const save = async () => {
    const startAtSeconds = parseTimeInput(startInput) ?? 0;
    if (startInput.trim() && parseTimeInput(startInput) === null) {
      toast.error('Start time should look like 1:23');
      return;
    }
    const skipSegments = [];
    for (const seg of segments) {
      if (!seg.start.trim() && !seg.end.trim()) continue;
      const from = parseTimeInput(seg.start);
      const to = parseTimeInput(seg.end);
      if (from === null || to === null || to <= from) {
        toast.error('Each skipped part needs a start and a later end, like 0:35 → 1:10');
        return;
      }
      skipSegments.push({ start: from, end: to });
    }

    setSaving(true);
    try {
      await base44.entities.MusicTrack.update(track.id, { startAtSeconds, skipSegments });
      musicPlayer.updateTrack({ startAtSeconds, skipSegments });
      toast.success('Trim saved — the song follows it right away');
      onSaved?.({ startAtSeconds, skipSegments });
      onOpenChange(false);
    } catch (e) {
      toast.error('Could not save the trim');
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trim “{track?.title || 'this song'}”</DialogTitle>
          <DialogDescription>
            Play the song, pause where you want it to start, then use the current spot.
          </DialogDescription>
        </DialogHeader>
        <MusicTrimFields
          start={startInput}
          onStartChange={setStartInput}
          segments={segments}
          onSegmentsChange={setSegments}
          getCurrentTime={() => musicPlayer.getState().currentTime}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            Save trim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}