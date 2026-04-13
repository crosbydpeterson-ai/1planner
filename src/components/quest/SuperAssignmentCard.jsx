import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function SuperAssignmentCard({ assignment, profile, userResponse, onResponded }) {
  const [selected, setSelected] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const typeLabel = {
    poll: 'Poll',
    short_answer: 'Short Answer',
    suggestion_box: 'Suggestion Box'
  }[assignment.type] || 'Super Assignment';

  const responded = !!userResponse;

  const handleSubmit = async () => {
    if (responded) return;
    setSubmitting(true);
    try {
      const payload = {
        assignmentId: assignment.id,
        userProfileId: profile.id,
        userEmail: profile.userId,
        isAnonymous: assignment.type === 'suggestion_box',
      };
      if (assignment.type === 'poll') payload.selectedOption = selected;
      else payload.content = text.trim();

      const resp = await base44.entities.SuperAssignmentResponse.create(payload);
      onResponded?.(resp);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-slate-900 font-semibold">{assignment.title}</h3>
          {assignment.description && (
            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{assignment.description}</p>
          )}
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          {typeLabel}
        </span>
      </div>

      {responded && (
        <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
          You responded{userResponse.isAnonymous ? ' (anonymous)' : ''}.
        </div>
      )}

      {!responded && (
        <div className="mt-4 space-y-3">
          {assignment.type === 'poll' && (
            <div>
              <Label className="text-slate-700">Choose one</Label>
              <RadioGroup value={selected} onValueChange={setSelected} className="mt-2 space-y-2">
                {(assignment.options || []).map((opt) => (
                  <label key={opt} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`opt-${assignment.id}-${opt}`} />
                    <span>{opt}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>
          )}

          {(assignment.type === 'short_answer' || assignment.type === 'suggestion_box') && (
            <div>
              <Label className="text-slate-700">Your response</Label>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={assignment.type === 'suggestion_box' ? 'Share your suggestion (anonymous)' : 'Type your answer'}
                className="min-h-[90px]"
              />
            </div>
          )}

          <div className="text-right">
            <Button
              onClick={handleSubmit}
              disabled={submitting || (assignment.type === 'poll' ? !selected : !text.trim())}
              className="bg-emerald-600"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}