import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Send, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  buildSupportTranscript,
  draftSummary,
  newHandoffOperationId,
  submitSupportHandoff,
  supportStatusOf,
} from '@/lib/byteSupport';

/**
 * Student-side handoff preview.
 *
 * Nothing is sent until the student taps "Send to admin", and the confirmation
 * appears only after the save succeeded — a failure keeps the draft and offers
 * Retry with the same operation id, so a retry can never open a second request.
 */
export default function ByteSupportHandoffDialog({ open, thread, byteMessages, supportAdminCount, onClose, onSubmitted }) {
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [phase, setPhase] = useState('edit'); // edit | saving | sent | failed
  const [error, setError] = useState('');
  const opRef = useRef(null);

  const transcript = useMemo(() => buildSupportTranscript(byteMessages), [byteMessages]);
  const existingStatus = supportStatusOf(thread);

  useEffect(() => {
    if (!open) return;
    setSummary(existingStatus ? thread.escalationSummary || draftSummary(byteMessages) : draftSummary(byteMessages));
    setDetails(thread?.supportDetails || '');
    setPhase('edit');
    setError('');
    opRef.current = newHandoffOperationId();
  }, [open, thread?.id]);

  const send = async () => {
    if (!summary.trim() || phase === 'saving') return;
    setPhase('saving');
    setError('');
    try {
      const result = await submitSupportHandoff({
        thread,
        summary: summary.trim(),
        details: details.trim(),
        transcript,
        operationId: opRef.current,
      });
      setPhase('sent');
      onSubmitted?.({ ...result, reused: result.reused || !!existingStatus });
    } catch (err) {
      console.error('Support request was not saved', err);
      setError('That request was not saved. Your summary is still here — tap Retry.');
      setPhase('failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && phase !== 'saving') onClose(); }}>
      <DialogContent className="sm:max-w-lg bg-white/90 backdrop-blur-xl border-white/40 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <ShieldCheck className="w-5 h-5 text-blue-600" /> Talk to an admin
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            {phase === 'sent'
              ? 'Your request is with the support team.'
              : existingStatus
              ? 'This adds your update to the request that is already open.'
              : 'A support admin reads this and replies in this same conversation.'}
          </DialogDescription>
        </DialogHeader>

        {phase === 'sent' ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-800">
                Your request has been sent to an admin. You can keep messaging here, and we’ll notify you when they reply.
              </p>
            </div>
            <p className="text-[11px] text-slate-500">
              Replies can take time — you don’t need to send the request again.
            </p>
            <DialogFooter>
              <Button onClick={onClose} className="w-full">Back to the conversation</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700">What do you need help with?</label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Describe the problem in your own words…"
                rows={3}
                className="mt-1.5 bg-white/70 border-white/60 text-slate-700 text-sm"
                disabled={phase === 'saving'}
              />
              <p className="text-[11px] text-slate-500 mt-1">You can edit this before sending.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Anything else the admin should know? (optional)</label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Optional extra details…"
                rows={2}
                className="mt-1.5 bg-white/70 border-white/60 text-slate-700 text-sm"
                disabled={phase === 'saving'}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1.5">
                Shared from this Byte conversation ({transcript.length} message{transcript.length === 1 ? '' : 's'})
              </p>
              <div className="max-h-40 overflow-y-auto rounded-xl bg-white/50 border border-white/60 px-3 py-2 space-y-1.5">
                {transcript.length === 0 && <p className="text-[11px] text-slate-400">Nothing sent to Byte yet.</p>}
                {transcript.map((m, i) => (
                  <p key={i} className="text-[11px] text-slate-600">
                    <span className={cn('font-semibold', m.role === 'byte' ? 'text-indigo-600' : 'text-slate-800')}>
                      {m.role === 'byte' ? 'Byte' : 'You'}:
                    </span>{' '}
                    {m.text}
                  </p>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Only this conversation, your summary and your extra details are shared — and only with the app’s support admins.
                Other chats and account details stay private.
              </p>
            </div>

            {supportAdminCount === 0 && (
              <p className="text-[11px] bg-amber-500/15 border border-amber-500/30 text-amber-800 rounded-xl px-3 py-2">
                No support admins are set up yet. Your request is saved and reaches the support team as soon as an admin is added.
              </p>
            )}

            {error && (
              <p className="text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded-xl px-3 py-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </p>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={onClose} disabled={phase === 'saving'} className="sm:flex-1">
                Cancel
              </Button>
              <Button onClick={send} disabled={phase === 'saving' || !summary.trim()} className="sm:flex-1">
                {phase === 'saving' ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                {phase === 'failed' ? 'Retry' : 'Send to admin'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}