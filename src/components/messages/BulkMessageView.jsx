import React, { useState } from 'react';
import { AlertCircle, Check, ChevronLeft, Loader2, Send, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { newOperationId, storeMessage, touchThreadSummary } from '@/lib/dmMessages';
import { ensureThread } from '@/lib/dmRouting';

/**
 * Bulk message to many students.
 *
 * Every message is stored as its own record with an idempotent operation id per
 * (run, student), so retrying a partial run never posts a duplicate. A failed
 * run keeps the text and lists exactly who failed.
 */
export default function BulkMessageView({ currentProfile, myContact, allStudents, onBack }) {
  const [filter, setFilter] = useState('all'); // all | math | reading
  const [teacherFilter, setTeacherFilter] = useState('');
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [failures, setFailures] = useState([]);
  const [runId, setRunId] = useState(null);
  const [done, setDone] = useState(false);

  const teachers = [...new Set(allStudents.flatMap((s) => [s.mathTeacher, s.readingTeacher].filter(Boolean)))].sort();

  const getTargets = () => {
    if (filter === 'math') return allStudents.filter((s) => s.mathTeacher === teacherFilter);
    if (filter === 'reading') return allStudents.filter((s) => s.readingTeacher === teacherFilter);
    return allStudents;
  };

  const targets = getTargets();

  const sendTo = async (students, id, text) => {
    const failed = [];
    let count = 0;
    for (const student of students) {
      try {
        const thread = await ensureThread({ student, contact: myContact });
        const { message } = await storeMessage({
          threadId: thread.id,
          sender: 'admin',
          senderName: currentProfile.username,
          senderProfileId: currentProfile.id,
          text,
          operationId: `bulk:${id}:${student.id}`,
        });
        await touchThreadSummary(thread, { lastMessageAt: message.sentAt, hasUnreadStudent: true });
        count += 1;
        setSentCount(count);
      } catch (err) {
        console.error('Bulk message failed for a student', err);
        failed.push(student);
      }
    }
    return failed;
  };

  const run = async (students, id, text) => {
    if (sending || !text.trim() || !myContact) return;
    setSending(true);
    setDone(false);
    setSentCount(0);
    setFailures([]);
    try {
      const failed = await sendTo(students, id, text);
      setFailures(failed);
      setDone(failed.length === 0);
    } finally {
      setSending(false);
    }
  };

  const sendBulk = () => {
    if (!msgText.trim() || sending || targets.length === 0) return;
    const id = runId || newOperationId('bulk');
    setRunId(id);
    run(targets, id, msgText.trim());
  };

  const retryFailed = () => {
    if (!runId) return;
    run(failures, runId, msgText.trim());
  };

  return (
    <div className="max-w-md mx-auto">
      <button onClick={onBack} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-sm mb-4 px-1 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <div className="bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/20">
          <p className="text-slate-800 font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" /> Bulk Message
          </p>
          <p className="text-slate-500 text-xs mt-0.5">Send one message to many students at once</p>
        </div>
        <div className="p-4 space-y-3">
          {!myContact && (
            <p className="text-[11px] bg-red-500/10 backdrop-blur-sm border border-red-500/20 text-red-600 rounded-xl px-2 py-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Your sending contact isn't set up. Link a contact to your account in the Admin DM inbox first.
            </p>
          )}

          <div>
            <p className="text-slate-500 text-xs mb-1.5 font-semibold">Target</p>
            <div className="flex gap-2 mb-2">
              {[['all', 'All Students'], ['math', 'Math Class'], ['reading', 'Reading Class']].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => { setFilter(k); setTeacherFilter(''); }}
                  className={cn('text-xs px-3 py-1.5 rounded-full transition-colors', filter === k ? 'bg-blue-500/80 text-white border border-white/30 shadow-lg' : 'bg-white/20 backdrop-blur-xl border border-white/30 text-slate-600 hover:bg-white/30')}
                >
                  {l}
                </button>
              ))}
            </div>
            {(filter === 'math' || filter === 'reading') && (
              <select value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)} className="w-full bg-white/40 backdrop-blur-sm border border-white/40 text-slate-700 rounded-lg px-3 py-2 text-sm outline-none">
                <option value="">-- Pick a teacher --</option>
                {teachers.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>

          <div className="bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-xs text-slate-600">
            Sending to <span className="text-slate-900 font-bold">{targets.length}</span> student{targets.length !== 1 ? 's' : ''}
            {targets.length > 0 && targets.length <= 5 && <span className="text-slate-500"> ({targets.map((s) => s.username).join(', ')})</span>}
          </div>

          <textarea
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            placeholder="Type your message…"
            rows={3}
            className="w-full bg-white/40 backdrop-blur-sm border border-white/40 text-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-white/60 placeholder:text-slate-400 resize-none"
          />

          <button
            onClick={sendBulk}
            disabled={sending || !msgText.trim() || targets.length === 0 || !myContact || (filter !== 'all' && !teacherFilter)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 transition-colors"
          >
            {sending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending… ({sentCount}/{targets.length})</>
            ) : (
              <><Send className="w-4 h-4" /> Send to {targets.length} student{targets.length !== 1 ? 's' : ''}</>
            )}
          </button>

          {done && (
            <div className="flex items-center gap-2 bg-green-500/15 backdrop-blur-sm border border-green-500/30 rounded-xl px-3 py-2 text-green-700 text-sm">
              <Check className="w-4 h-4" /> Sent to {sentCount} students!
            </div>
          )}

          {failures.length > 0 && !sending && (
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl px-3 py-2 space-y-2">
              <p className="text-red-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Sent to {sentCount}. {failures.length} failed: {failures.map((s) => s.username).join(', ')}
              </p>
              <p className="text-red-600/80 text-[11px]">Your message text is kept, and retrying only re-sends the failures.</p>
              <button onClick={retryFailed} className="text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-700 rounded-lg px-3 py-1.5 font-semibold">
                Retry {failures.length} failed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}