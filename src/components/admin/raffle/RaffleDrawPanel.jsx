import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, ArrowLeft, Dices, FlaskConical, Loader2, Lock, PackageCheck, Pause, Pencil, Play } from 'lucide-react';
import { toast } from 'sonner';
import { PETS } from '@/components/quest/PetCatalog';
import {
  KIND,
  RAFFLE_STATUS,
  buildDrawPlan,
  buildEntries,
  findInconsistencies,
  generateSeed,
  planProgress,
  resolveEligibleProfiles,
  summarizePlan,
  totalPrizeSlots,
  validateRaffle,
} from '@/lib/raffleLogic';
import {
  getRedeemCode,
  loadRaffleState,
  lockRaffle,
  markRaffleStatus,
  savePlannedResults,
  setRafflePaused,
} from '@/lib/raffleData';
import { confirmDelivered, deliverPending, deliverResult, settleStaleDeliveries } from '@/lib/raffleDelivery';
import RaffleResultsTable from '@/components/admin/raffle/RaffleResultsTable';
import RaffleTestDrawDialog from '@/components/admin/raffle/RaffleTestDrawDialog';

/** How many winners to save and deliver per round trip. */
const CHUNK = 25;

const Stat = ({ label, value, tone = 'text-white' }) => (
  <div className="bg-slate-900/60 rounded-xl border border-slate-700 px-3 py-2">
    <p className="text-xs text-slate-400">{label}</p>
    <p className={`text-lg font-semibold ${tone}`}>{value}</p>
  </div>
);

/**
 * The draw console. Everything it does starts from what is actually saved:
 * reloading the page, or another admin's browser, sees the same progress.
 */
export default function RaffleDrawPanel({
  raffleId,
  profiles = [],
  customPets = [],
  canUsePlus = false,
  actor = 'admin',
  onBack,
  onChanged,
  onEdit,
}) {
  const [raffle, setRaffle] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('');
  const [confirmKind, setConfirmKind] = useState(null);
  const [testOpen, setTestOpen] = useState(false);
  const [codes, setCodes] = useState({});
  const [pauseReason, setPauseReason] = useState('');
  const aliveRef = useRef(true);

  const reload = useCallback(async () => {
    const state = await loadRaffleState(raffleId);
    if (aliveRef.current) {
      setRaffle(state.raffle);
      setResults(state.results || []);
    }
    return state;
  }, [raffleId]);

  useEffect(() => {
    aliveRef.current = true;
    (async () => {
      try {
        const state = await loadRaffleState(raffleId);
        // An attempt interrupted by a closed tab can only be classified, not repeated.
        const settled = await settleStaleDeliveries(state.results || []);
        const fresh = settled.length > 0 ? await loadRaffleState(raffleId) : state;
        if (!aliveRef.current) return;
        setRaffle(fresh.raffle);
        setResults(fresh.results || []);
        if (settled.length > 0) {
          toast.warning(`${settled.length} interrupted delivery(ies) marked for review.`);
        }
      } catch (e) {
        console.error(e);
        toast.error('Could not load this raffle');
      }
      if (aliveRef.current) setLoading(false);
    })();
    return () => {
      aliveRef.current = false;
    };
  }, [raffleId]);

  const issues = useMemo(() => (raffle ? findInconsistencies({ raffle, results }) : []), [raffle, results]);

  // A saved conflict stops everything until a human looks at it.
  useEffect(() => {
    if (!raffle || busy || raffle.paused || issues.length === 0) return;
    setRafflePaused(raffle.id, {
      paused: true,
      reason: issues[0].message,
      automatic: true,
      actor: 'auto',
    })
      .then(() => reload())
      .catch((e) => console.error('Could not auto-pause the raffle', e));
  }, [raffle, results.length, issues.length, busy, reload]);

  const eligible = useMemo(
    () => buildEntries(resolveEligibleProfiles(profiles, raffle?.eligibility || {})),
    [profiles, raffle?.eligibility]
  );

  const knownPetIds = useMemo(
    () => [...PETS.map((p) => p.id), ...customPets.map((p) => `custom_${p.id}`)],
    [customPets]
  );

  const validation = useMemo(
    () =>
      validateRaffle({
        prizes: raffle?.prizes || [],
        prizeMode: raffle?.prizeMode || 'limited',
        allowMultipleWins: !!raffle?.allowMultipleWins,
        participantCount: eligible.length,
        fallbackReward: raffle?.fallbackReward || null,
        knownPetIds,
      }),
    [raffle, eligible.length, knownPetIds]
  );

  const progress = useMemo(() => planProgress(raffle, results), [raffle, results]);
  const prizeRows = useMemo(() => summarizePlan(raffle?.plan || [], raffle), [raffle]);
  const isDraft = !raffle || raffle.status === RAFFLE_STATUS.DRAFT;
  const blocked = !!raffle?.paused || issues.length > 0 || busy;
  const undelivered = progress.counts.pending + progress.counts.failed;

  // ── actions ───────────────────────────────────────────────

  const lockEntries = async () => {
    setBusy(true);
    setBusyLabel('Locking entries…');
    try {
      const entries = eligible;
      const seed = generateSeed();
      const { plan, errors: planErrors } = buildDrawPlan({
        participants: entries,
        prizes: raffle.prizes,
        prizeMode: raffle.prizeMode,
        allowMultipleWins: raffle.allowMultipleWins,
        fallbackReward: raffle.fallbackReward,
        seed,
      });
      if (validation.errors.length > 0 || planErrors.length > 0) {
        toast.error(validation.errors[0] || planErrors[0]);
        return;
      }
      await lockRaffle({ raffle, participants: entries, plan, seed, actor });
      await reload();
      toast.success(`${entries.length} entries locked. The draw order is saved.`);
      onChanged?.();
    } catch (e) {
      console.error(e);
      toast.error('Could not lock this raffle');
    } finally {
      setBusy(false);
      setBusyLabel('');
    }
  };

  const runDraw = async (total) => {
    setBusy(true);
    let drawn = 0;
    try {
      for (;;) {
        if (total !== Infinity && drawn >= total) break;

        const state = await loadRaffleState(raffleId);
        if (state.raffle?.paused) {
          toast.error('This raffle is paused — resume it before drawing more.');
          break;
        }
        const found = findInconsistencies({ raffle: state.raffle, results: state.results });
        if (found.length > 0) {
          await setRafflePaused(raffleId, {
            paused: true,
            reason: found[0].message,
            automatic: true,
            actor: 'auto',
          });
          toast.error(found[0].message);
          break;
        }

        const wanted = total === Infinity ? CHUNK : Math.min(CHUNK, total - drawn);
        const chunk = (state.raffle?.plan || []).slice((state.results || []).length, (state.results || []).length + wanted);
        if (chunk.length === 0) break;

        setBusyLabel(`Saving ${chunk.length} winner${chunk.length === 1 ? '' : 's'}…`);
        let savedRows;
        try {
          savedRows = await savePlannedResults(state.raffle, chunk);
        } catch (e) {
          console.error(e);
          toast.error('The draw could not be saved. Nothing was replaced — try again in a moment.');
          break;
        }

        setBusyLabel(`Delivering ${savedRows.length} prize${savedRows.length === 1 ? '' : 's'}…`);
        const summary = await deliverPending(savedRows, state.raffle, {
          actor,
          onProgress: ({ summary: s }) =>
            setBusyLabel(
              `Delivering… ${s.delivered + s.failed + s.needsReview}/${savedRows.length} (${s.delivered} delivered)`
            ),
        });

        drawn += savedRows.length;
        await reload();

        if (summary.stopped) {
          toast.error('Delivery stopped early — check the flagged results before continuing.');
          break;
        }
      }

      const finalState = await loadRaffleState(raffleId);
      const p = planProgress(finalState.raffle, finalState.results);
      if (p.complete && finalState.raffle.status !== RAFFLE_STATUS.COMPLETED) {
        await markRaffleStatus(raffleId, RAFFLE_STATUS.COMPLETED, { completedAt: new Date().toISOString() });
      } else if (!p.complete && finalState.results.length > 0 && finalState.raffle.status === RAFFLE_STATUS.READY) {
        await markRaffleStatus(raffleId, RAFFLE_STATUS.DRAWING);
      }
      await reload();
      onChanged?.();
    } catch (e) {
      console.error(e);
      toast.error('The draw stopped unexpectedly. Nothing was replaced — reload to see what is saved.');
    } finally {
      setBusy(false);
      setBusyLabel('');
    }
  };

  const deliverUndelivered = async () => {
    setBusy(true);
    setBusyLabel('Delivering saved prizes…');
    try {
      const summary = await deliverPending(results, raffle, {
        actor,
        onProgress: ({ summary: s }) => setBusyLabel(`Delivering… ${s.delivered} delivered`),
      });
      await reload();
      if (summary.needsReview > 0) toast.warning(`${summary.needsReview} delivery(ies) need a review.`);
      else if (summary.delivered > 0) toast.success(`${summary.delivered} prize(s) delivered.`);
      onChanged?.();
    } catch (e) {
      console.error(e);
      toast.error('Delivery stopped — check the results table.');
    } finally {
      setBusy(false);
      setBusyLabel('');
    }
  };

  const togglePause = async () => {
    try {
      await setRafflePaused(raffleId, {
        paused: !raffle.paused,
        reason: !raffle.paused ? pauseReason.trim() || 'Paused by an admin.' : '',
        automatic: false,
        actor,
      });
      setPauseReason('');
      await reload();
      toast.success(raffle.paused ? 'Raffle resumed' : 'Raffle paused');
      onChanged?.();
    } catch (e) {
      console.error(e);
      toast.error('Could not change the pause state');
    }
  };

  const retryOne = async (result) => {
    setBusy(true);
    try {
      const out = await deliverResult(result, raffle, { actor });
      await reload();
      if (out.status === 'delivered') toast.success(`${result.username}: delivered.`);
      else toast.error(out.message || 'That prize still could not be delivered.');
    } catch (e) {
      console.error(e);
      toast.error('Could not retry that delivery');
    } finally {
      setBusy(false);
    }
  };

  const confirmOne = async (result) => {
    setBusy(true);
    try {
      await confirmDelivered(result, { actor });
      await reload();
      toast.success(`${result.username}: marked delivered.`);
    } catch (e) {
      console.error(e);
      toast.error('Could not update that result');
    } finally {
      setBusy(false);
    }
  };

  const revealCode = async (result) => {
    try {
      const code = await getRedeemCode(result.codeId);
      setCodes((m) => ({ ...m, [result.id]: code?.code || 'code record missing' }));
    } catch (e) {
      console.error(e);
      toast.error('Could not read that prize code');
    }
  };

  if (loading || !raffle) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading the raffle…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" className="text-slate-300 hover:text-white shrink-0" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <h3 className="text-white font-semibold truncate flex items-center gap-2">
              {raffle.title}
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                {raffle.status}
              </Badge>
              {raffle.paused && (
                <Badge variant="outline" className="bg-amber-500/15 text-amber-200 border-amber-500/40">
                  Paused
                </Badge>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              {isDraft
                ? 'Draft — students cannot see this yet.'
                : `Entries frozen ${raffle.frozenAt ? new Date(raffle.frozenAt).toLocaleString() : ''} by ${
                    raffle.frozenBy || 'admin'
                  }.`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="border-slate-600 text-slate-200" onClick={() => onEdit?.(raffle)}>
            <Pencil className="w-4 h-4 mr-1" /> {isDraft ? 'Edit' : 'View'}
          </Button>
          <Button
            variant="outline"
            className="border-slate-600 text-slate-200"
            onClick={() => setTestOpen(true)}
          >
            <FlaskConical className="w-4 h-4 mr-1" /> Test draw
          </Button>
        </div>
      </div>

      {busyLabel && (
        <div className="flex items-center gap-2 text-sm text-indigo-200 bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-3 py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> {busyLabel}
        </div>
      )}

      {(raffle.paused || issues.length > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 text-sm text-amber-100 space-y-2">
          <p className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4" />
            {raffle.paused ? 'Draws and delivery are paused' : 'A saved inconsistency was found'}
            {raffle.pauseIsAutomatic && ' (paused automatically)'}
          </p>
          {raffle.pauseReason && <p>{raffle.pauseReason}</p>}
          {issues.map((issue) => (
            <p key={issue.code}>• {issue.message}</p>
          ))}
          <p className="text-xs text-amber-200/80">
            Check the saved results below and reconcile them before resuming. Nothing is retried or replaced
            automatically — that is what keeps a prize from being handed out twice.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Eligible now" value={eligible.length} />
        <Stat label="Entries locked" value={(raffle.participants || []).length || '—'} />
        <Stat label="Remaining positions" value={isDraft ? '—' : progress.remainingParticipants} />
        <Stat label="Remaining prizes" value={isDraft ? '—' : progress.remainingPrizes} />
        <Stat label="Saved winners" value={progress.savedWinners} />
        <Stat label="Delivered" value={progress.counts.delivered} tone="text-emerald-300" />
        <Stat
          label="Needs review"
          value={progress.counts.needsReview}
          tone={progress.counts.needsReview > 0 ? 'text-amber-200' : 'text-white'}
        />
        <Stat
          label="Failed"
          value={progress.counts.failed}
          tone={progress.counts.failed > 0 ? 'text-red-300' : 'text-white'}
        />
      </div>

      {isDraft ? (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
          <h4 className="text-white font-semibold">1. Check, then lock the entries</h4>
          <p className="text-sm text-slate-400">
            {eligible.length} student{eligible.length === 1 ? '' : 's'} would get one entry each •{' '}
            {totalPrizeSlots(raffle.prizes)} prizes configured •{' '}
            {raffle.prizeMode === 'everyone' || raffle.prizeMode === 'everyone_plus'
              ? 'everyone wins'
              : 'limited winners'}
            {raffle.allowMultipleWins ? ' • a student may win more than once' : ''}.
          </p>
          {validation.errors.map((e) => (
            <p key={e} className="text-sm text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {e}
            </p>
          ))}
          {validation.warnings.map((w) => (
            <p key={w} className="text-sm text-amber-200">
              {w}
            </p>
          ))}
          <p className="text-xs text-slate-500">
            Locking freezes this list and saves the draw order. Students who register later are not added — they
            need their own raffle.
          </p>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            disabled={busy || validation.errors.length > 0}
            onClick={() => setConfirmKind('lock')}
          >
            <Lock className="w-4 h-4 mr-1" /> Lock entries &amp; save draw order
          </Button>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
          <h4 className="text-white font-semibold">2. Draw</h4>
          <p className="text-sm text-slate-400">
            {prizeRows.length > 0
              ? prizeRows
                  .map((row) => `${row.emoji} ${row.label} ×${row.planned}`)
                  .join(' • ')
              : 'Nothing to draw.'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={blocked || progress.complete}
              onClick={() => setConfirmKind('one')}
            >
              <Dices className="w-4 h-4 mr-1" /> Draw next prize
            </Button>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-200"
              disabled={blocked || progress.complete}
              onClick={() => setConfirmKind('all')}
            >
              <Play className="w-4 h-4 mr-1" /> Draw all remaining
            </Button>
            {undelivered > 0 && (
              <Button
                variant="outline"
                className="border-slate-600 text-slate-200"
                disabled={blocked}
                onClick={deliverUndelivered}
              >
                <PackageCheck className="w-4 h-4 mr-1" /> Deliver saved prizes ({undelivered})
              </Button>
            )}
            <Button
              variant="ghost"
              className={raffle.paused ? 'text-emerald-300 hover:text-white' : 'text-amber-200 hover:text-white'}
              disabled={busy}
              onClick={togglePause}
            >
              {raffle.paused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
              {raffle.paused ? 'Resume' : 'Pause'}
            </Button>
          </div>
          {!raffle.paused && (
            <div className="flex items-center gap-2">
              <Label className="text-slate-400 text-xs whitespace-nowrap">Pause reason (optional)</Label>
              <Input
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white h-8"
                placeholder="Why are you pausing?"
              />
            </div>
          )}
          <p className="text-xs text-slate-500 space-y-1">
            Each winner and prize is saved before delivery is attempted, and delivery runs one student at a time
            through the existing redeem-code path. A big “everyone wins” raffle therefore takes a few minutes.
          </p>
          <p className="text-xs text-slate-500">
            Two admins on two devices: both see the same saved results, and a repeated draw position is detected and
            pauses the raffle — but a browser-only screen cannot provide a true lock between devices, so a draw
            already in flight elsewhere may still finish.
          </p>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 space-y-3">
        <h4 className="text-white font-semibold">
          3. Saved winners &amp; delivery <span className="text-slate-400 font-normal">(selection and delivery are tracked separately)</span>
        </h4>
        <RaffleResultsTable
          results={results}
          busy={busy}
          revealedCodes={codes}
          onRetry={retryOne}
          onConfirm={confirmOne}
          onRevealCode={revealCode}
        />
      </div>

      <RaffleTestDrawDialog
        open={testOpen}
        onClose={() => setTestOpen(false)}
        raffle={raffle}
        participantCount={eligible.length}
      />

      <Dialog open={!!confirmKind} onOpenChange={(v) => !v && setConfirmKind(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {confirmKind === 'lock'
                ? 'Lock entries for this raffle?'
                : confirmKind === 'all'
                  ? 'Draw every remaining winner?'
                  : 'Draw the next winner?'}
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-slate-300 space-y-2">
            {confirmKind === 'lock' ? (
              <>
                <p>
                  {eligible.length} student{eligible.length === 1 ? '' : 's'} will be entered once each, and the
                  draw order will be saved.
                </p>
                <p className="text-slate-400">
                  After this, changes to student profiles will not change who is eligible.
                </p>
              </>
            ) : (
              <>
                <p>
                  {confirmKind === 'all'
                    ? `${progress.remainingParticipants} remaining position(s) will be saved${
                        progress.remainingPrizes > 0
                          ? ` (${progress.remainingPrizes} prize draw(s) and ${progress.remainingBase} base reward(s))`
                          : ''
                      }.`
                    : `Position ${(progress.nextEntry?.seq ?? 0) + 1}: ${
                        progress.nextEntry?.username || 'next student'
                      } — ${progress.nextEntry?.kind === KIND.EVERYONE ? 'base reward' : 'prize'}.`}
                </p>
                <p className="text-slate-400">
                  Each winner is saved first, then their prize is delivered. Students do not need to be online.
                </p>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="text-slate-300" onClick={() => setConfirmKind(null)}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                const kind = confirmKind;
                setConfirmKind(null);
                if (kind === 'lock') lockEntries();
                else if (kind === 'all') runDraw(Infinity);
                else runDraw(1);
              }}
            >
              {confirmKind === 'lock' ? 'Lock entries' : 'Draw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}