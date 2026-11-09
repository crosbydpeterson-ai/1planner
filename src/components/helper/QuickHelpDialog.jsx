import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LifeBuoy, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import MagicCardScanner from '@/components/auth/MagicCardScanner';
import { base44 } from '@/api/base44Client';
import {
  resolveHelperCard,
  claimHelperAction,
  performHelperAction,
  maskHelperNumber,
  ACTION_LABELS,
} from '@/lib/helperCards';
import QuickHelpVerify from './QuickHelpVerify';
import QuickHelpMenu from './QuickHelpMenu';
import QuickHelpTarget from './QuickHelpTarget';
import QuickHelpActionForm from './QuickHelpActionForm';
import QuickHelpResult from './QuickHelpResult';
import { grantHelperCardReward } from '@/lib/magicCardReward';

const STEP_COPY = {
  scan: ['Scan helper card', 'Hold the card in the frame — the QR code reads fastest.'],
  verify: ['Verify admin', 'Only the admin this card belongs to can continue.'],
  menu: ['Pick an action', 'Choose one thing to do with this card.'],
  target: ['Who are you helping?', 'Pick the student on this device.'],
  action: ['Confirm the change', 'Check it, then confirm once.'],
  done: ['Done', 'One action per scan.'],
};

// Quick Help: an admin scans their own card on a student's device, proves who
// they are, and makes exactly one change.
//
// The scan is spent on the first confirmation: the audit row is written before
// anything is applied, so a double click or a retry cannot grant twice, and the
// card's enabled state is re-read at that moment so a card disabled while this
// window was open changes nothing.
export default function QuickHelpDialog({ open, onOpenChange }) {
  const [step, setStep] = useState('scan');
  const [card, setCard] = useState(null);
  const [scanId, setScanId] = useState('');
  const [admin, setAdmin] = useState(null);
  const [target, setTarget] = useState(null);
  const [actionType, setActionType] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  const reset = () => {
    setStep('scan');
    setCard(null);
    setScanId('');
    setAdmin(null);
    setTarget(null);
    setActionType('');
    setResult(null);
    setError('');
    setManual('');
    setBusy(false);
    setScanKey((k) => k + 1);
  };

  useEffect(() => {
    if (open) reset();
  }, [open]);

  const finishClose = () => {
    const reload = !!result?.switched;
    onOpenChange(false);
    if (reload) window.location.reload();
  };

  const handleScan = async (value) => {
    if (busy || !value) return;
    setBusy(true);
    setError('');
    try {
      const found = await resolveHelperCard(value);
      if (found.status === 'unknown') {
        setError('That card is not a helper card.');
        setScanKey((k) => k + 1);
        return;
      }
      if (found.status === 'disabled') {
        setError('That helper card is disabled.');
        setScanKey((k) => k + 1);
        return;
      }
      // A fresh id per scan is what makes a second confirm impossible.
      setCard(found.card);
      setScanId(crypto.randomUUID());
      setStep('verify');
    } catch (e) {
      console.error('Helper card lookup failed:', e);
      setError('Could not read the card. Try again.');
      setScanKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (detail) => {
    if (busy || !card || !admin || !target) return;
    setBusy(true);
    setError('');
    let row = null;
    try {
      row = await claimHelperAction({
        cardId: card.id,
        cardNickname: card.nickname || '',
        cardNumberMasked: maskHelperNumber(card.number),
        scanId,
        actionType,
        adminProfileId: admin.id,
        adminUsername: admin.username || '',
        targetProfileId: target.id,
        targetUsername: target.username || '',
      });
      const outcome = await performHelperAction({ actionType, target, detail });
      await base44.entities.HelperAction.update(row.id, {
        status: 'applied',
        summary: outcome.summary,
        changes: outcome.changes || {},
        appliedAt: new Date().toISOString(),
      });
      // The card's own bonus lands on the student it just helped, once per student.
      const bonus = await grantHelperCardReward(card, target);
      setResult({
        ...outcome,
        switched: !!outcome.switched,
        actionLabel: ACTION_LABELS[actionType],
        appliedAt: new Date().toISOString(),
        bonusLabel: bonus?.message || '',
      });
      setStep('done');
    } catch (e) {
      const message = e?.userFacing ? e.message : 'That did not go through. Nothing was changed.';
      if (row?.id) {
        try {
          await base44.entities.HelperAction.update(row.id, { status: 'blocked', blockedReason: message });
        } catch (updateError) {
          console.error('Failed to close the helper action:', updateError);
        }
      }
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const [title, hint] = STEP_COPY[step] || STEP_COPY.scan;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          if (busy) return;
          finishClose();
          return;
        }
        onOpenChange(true);
      }}
    >
      <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <LifeBuoy className="w-5 h-5 text-indigo-400" /> Quick Help
          </DialogTitle>
          <DialogDescription className="text-slate-400">{title} · {hint}</DialogDescription>
        </DialogHeader>

        {step === 'scan' && (
          <div className="space-y-3">
            <MagicCardScanner
              key={scanKey}
              format="code128"
              onDetected={handleScan}
              onUnavailable={(message) => setError(message)}
            />
            <div className="flex gap-2">
              <Input
                value={manual}
                onChange={(e) => { setManual(e.target.value); setError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && manual.trim() && handleScan(manual)}
                placeholder="Or type the card number"
                className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 font-mono"
              />
              <Button
                onClick={() => handleScan(manual)}
                disabled={busy || !manual.trim()}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              Each scan allows one change. Nothing happens until you confirm it.
            </p>
          </div>
        )}

        {step === 'verify' && card && (
          <QuickHelpVerify
            card={card}
            onVerified={(verifiedAdmin) => {
              setAdmin(verifiedAdmin);
              setStep('menu');
            }}
            onBack={reset}
          />
        )}

        {step === 'menu' && card && (
          <QuickHelpMenu
            card={card}
            onPick={(chosenAction) => {
              setActionType(chosenAction);
              setError('');
              setStep('target');
            }}
            onBack={() => setStep('verify')}
          />
        )}

        {step === 'target' && card && (
          <QuickHelpTarget
            card={card}
            actionType={actionType}
            onContinue={(chosen) => {
              setTarget(chosen);
              setError('');
              setStep('action');
            }}
            onBack={() => {
              setError('');
              setStep('menu');
            }}
          />
        )}

        {step === 'action' && card && target && (
          <QuickHelpActionForm
            card={card}
            actionType={actionType}
            target={target}
            busy={busy}
            onConfirm={runAction}
            onBack={() => { setError(''); setStep('target'); }}
          />
        )}

        {step === 'done' && (
          <QuickHelpResult result={result} card={card} admin={admin} onClose={finishClose} />
        )}

        {error && step !== 'done' && (
          <p className="flex items-start gap-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}