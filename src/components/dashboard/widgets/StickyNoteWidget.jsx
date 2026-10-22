import React, { useState } from 'react';
import { StickyNote, Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PREF_KEYS,
  STORAGE_BLOCKED_MESSAGE,
  clearWidgetPref,
  readWidgetPref,
  writeWidgetPref,
} from '@/lib/widgetPrefs';
import WidgetShell from './WidgetShell';

// A few subtle note accents — literal classes so Tailwind keeps them.
const NOTE_COLORS = [
  { id: 'amber', dot: 'bg-amber-400', card: 'bg-amber-100/80 border-amber-200/80' },
  { id: 'sky', dot: 'bg-sky-400', card: 'bg-sky-100/80 border-sky-200/80' },
  { id: 'pink', dot: 'bg-pink-400', card: 'bg-pink-100/80 border-pink-200/80' },
  { id: 'emerald', dot: 'bg-emerald-400', card: 'bg-emerald-100/80 border-emerald-200/80' },
];

const colorFor = (id) => NOTE_COLORS.find((c) => c.id === id) || NOTE_COLORS[0];
const MAX_LENGTH = 400;

/**
 * Sticky note — a small private note for this account.
 *
 * The note is stored per profile in this browser only (see the line inside the
 * editor). If the browser refuses to save, the text stays in the editor with an
 * explanation instead of being thrown away.
 */
export default function StickyNoteWidget({ profileId }) {
  const [note, setNote] = useState(() => readWidgetPref(profileId, PREF_KEYS.note, null));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [draftColor, setDraftColor] = useState('amber');
  const [saveError, setSaveError] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  const startEditing = () => {
    setDraft(note?.text || '');
    setDraftColor(note?.color || 'amber');
    setSaveError('');
    setEditing(true);
  };

  const handleSave = () => {
    const payload = {
      text: draft.trim(),
      color: draftColor,
      updatedAt: new Date().toISOString(),
    };
    if (!payload.text) {
      handleClear();
      return;
    }
    const result = writeWidgetPref(profileId, PREF_KEYS.note, payload);
    if (!result.ok) {
      // Keep what they typed on screen so nothing is lost.
      setSaveError(STORAGE_BLOCKED_MESSAGE);
      return;
    }
    setNote(payload);
    setEditing(false);
    setSaveError('');
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const handleClear = () => {
    clearWidgetPref(profileId, PREF_KEYS.note);
    setNote(null);
    setEditing(false);
    setDraft('');
    setSaveError('');
  };

  const action = editing ? null : (
    <button
      type="button"
      onClick={startEditing}
      className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
    >
      <Pencil className="w-4 h-4" aria-hidden="true" /> {note ? 'Edit' : 'Write'}
    </button>
  );

  return (
    <WidgetShell icon={StickyNote} title="Sticky Note" action={action}>
      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            maxLength={MAX_LENGTH}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            autoFocus
            placeholder="Remember to…"
            className={`w-full rounded-xl border p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none ${colorFor(draftColor).card}`}
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5" role="group" aria-label="Note colour">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`${c.id} note`}
                  aria-pressed={draftColor === c.id}
                  onClick={() => setDraftColor(c.id)}
                  className={`w-6 h-6 rounded-full ${c.dot} ${
                    draftColor === c.id ? 'ring-2 ring-slate-500 ring-offset-1' : 'opacity-70'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-400">
              {draft.length}/{MAX_LENGTH}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Saved on this browser only, for your account.
          </p>
          {saveError ? <p className="text-xs text-amber-600">{saveError}</p> : null}
          <div className="flex gap-2">
            <Button size="sm" className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
              <Check className="w-4 h-4 mr-1" aria-hidden="true" /> Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-xl"
              onClick={() => { setEditing(false); setSaveError(''); }}
            >
              <X className="w-4 h-4 mr-1" aria-hidden="true" /> Cancel
            </Button>
            {note ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-9 rounded-xl text-slate-500 ml-auto"
                onClick={handleClear}
              >
                <Trash2 className="w-4 h-4 mr-1" aria-hidden="true" /> Clear
              </Button>
            ) : null}
          </div>
        </div>
      ) : note?.text ? (
        <div className={`rounded-xl border p-3 ${colorFor(note.color).card}`}>
          <p className="text-sm text-slate-800 whitespace-pre-wrap break-words">{note.text}</p>
          <p className="text-[11px] text-slate-500 mt-2">
            {justSaved ? 'Saved ✓' : 'This browser only'}
          </p>
        </div>
      ) : (
        <div className="py-3 text-center text-slate-400 text-sm">
          <p>Nothing written yet</p>
          <p className="text-xs mt-1">Jot down a reminder — it stays private to you.</p>
        </div>
      )}
    </WidgetShell>
  );
}