import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FlaskConical, ShieldAlert } from 'lucide-react';
import {
  KIND,
  RAFFLE_STATUS,
  buildDrawPlan,
  findInconsistencies,
  resultRecordFor,
  summarizePlan,
} from '@/lib/raffleLogic';

const SAMPLE_NAMES = [
  'Ava', 'Ben', 'Chloe', 'Diego', 'Ella', 'Finn', 'Grace', 'Hugo',
  'Iris', 'Jonas', 'Kira', 'Leo', 'Mia', 'Nate', 'Omar', 'Priya',
];

/**
 * A dry run on made-up students and made-up results. It exercises the same
 * planner and the same consistency checks the real draw uses, but it only ever
 * builds objects in memory: nothing is written and no real student is touched.
 */
export default function RaffleTestDrawDialog({
  open,
  onClose,
  raffle,
  participantCount = 0,
}) {
  const prizes = raffle?.prizes || [];
  const participantTarget = Math.min(Math.max(participantCount || 12, 3), 16);

  const syntheticParticipants = useMemo(
    () =>
      Array.from({ length: participantTarget }, (_, i) => ({
        profileId: `test_${i}`,
        username: `${SAMPLE_NAMES[i % SAMPLE_NAMES.length]} ${i + 1}`,
      })),
    [participantTarget]
  );

  const syntheticRaffle = useMemo(() => {
    const seed = 20261022;
    const { plan, errors } = buildDrawPlan({
      participants: syntheticParticipants,
      prizes,
      prizeMode: raffle?.prizeMode || 'limited',
      allowMultipleWins: !!raffle?.allowMultipleWins,
      fallbackReward: raffle?.fallbackReward || null,
      seed,
    });
    return {
      raffle: {
        id: 'test-draw',
        title: `${raffle?.title || 'Raffle'} (test)`,
        status: RAFFLE_STATUS.READY,
        prizes,
        fallbackReward: raffle?.fallbackReward || null,
        allowMultipleWins: !!raffle?.allowMultipleWins,
        participants: syntheticParticipants,
        plan,
      },
      errors,
    };
  }, [syntheticParticipants, prizes, raffle?.prizeMode, raffle?.allowMultipleWins, raffle?.fallbackReward, raffle?.title]);

  const { raffle: testRaffle, errors } = syntheticRaffle;
  const prizeRows = summarizePlan(testRaffle.plan, testRaffle);

  // Three clean results must pass the checks...
  const cleanResults = useMemo(
    () =>
      testRaffle.plan
        .slice(0, 3)
        .map((entry) => ({ ...resultRecordFor(testRaffle, entry), id: `clean_${entry.seq}` })),
    [testRaffle]
  );
  const cleanIssues = findInconsistencies({ raffle: testRaffle, results: cleanResults });

  // ...while a tampered copy (a repeated position plus a prize that is not on the plan)
  // must be caught.
  const brokenIssues = useMemo(() => {
    if (cleanResults.length < 2) return [];
    const tampered = [
      cleanResults[0],
      { ...cleanResults[0], id: 'tampered_dup' },
      { ...cleanResults[1], id: 'tampered_prize', prizeId: 'not-a-configured-prize' },
    ];
    return findInconsistencies({ raffle: testRaffle, results: tampered });
  }, [cleanResults, testRaffle]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-300" /> Test draw
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 text-indigo-100">
            This is a rehearsal on {syntheticParticipants.length} invented students. Nothing here is saved, and no
            real student or prize is changed.
          </div>

          <div>
            <p className="text-slate-300 font-medium mb-1">Entry list used</p>
            <p className="text-slate-400">
              One entry per invented student ({syntheticParticipants.length} entries). Real profile changes never
              alter a locked raffle, because its list is frozen at that moment.
            </p>
          </div>

          <div>
            <p className="text-slate-300 font-medium mb-1">Prize plan</p>
            {prizeRows.length === 0 ? (
              <p className="text-slate-400">No prizes would be given out with the current settings.</p>
            ) : (
              <div className="space-y-1">
                {prizeRows.map((row) => (
                  <div key={row.prizeId} className="flex items-center gap-2 text-slate-200">
                    <Badge variant="outline" className="border-slate-600 text-slate-200">
                      {row.kind === KIND.EVERYONE ? 'base' : 'prize'}
                    </Badge>
                    <span>
                      {row.emoji} {row.label}
                    </span>
                    <span className="text-slate-400">×{row.planned}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-slate-300 font-medium mb-1">First winners in the frozen order</p>
            {testRaffle.plan.length === 0 ? (
              <p className="text-slate-400">Nothing to draw with these settings.</p>
            ) : (
              <ol className="text-slate-200 space-y-1">
                {testRaffle.plan.slice(0, 6).map((entry) => (
                  <li key={entry.seq}>
                    {entry.seq + 1}. {entry.username} — {entry.kind === KIND.EVERYONE ? 'base reward' : 'prize'}
                  </li>
                ))}
                {testRaffle.plan.length > 6 && (
                  <li className="text-slate-400">…and {testRaffle.plan.length - 6} more entries</li>
                )}
              </ol>
            )}
          </div>

          <div>
            <p className="text-slate-300 font-medium mb-1">Checks</p>
            <div className="space-y-1">
              <div className="flex items-start gap-2 text-emerald-300">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Clean results pass: {cleanIssues.length} problem{cleanIssues.length === 1 ? '' : 's'} found.
                </span>
              </div>
              <div className="flex items-start gap-2 text-amber-200">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Tampered results are caught ({brokenIssues.length}): {brokenIssues.map((i) => i.message).join(' ')}
                </span>
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-slate-300 font-medium">Set-up problems this rehearsal ran into</p>
              {errors.map((e) => (
                <p key={e} className="text-red-300">
                  {e}
                </p>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" className="text-slate-300" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}