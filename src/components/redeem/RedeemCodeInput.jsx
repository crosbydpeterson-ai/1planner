import React, { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import PetAvatar from '@/components/quest/PetAvatar';
import { OUTCOME, redeemCodeForProfile } from '@/lib/redeemExecution';

/**
 * The redemption form itself. `variant="plain"` drops the outer card so it can
 * sit inside a dialog without looking like a card nested in a card.
 */
export default function RedeemCodeInput({
  profile,
  onRedeemed,
  variant = 'card',
  autoFocus = false,
  onBusyChange,
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // {success, warning?, message}
  const inFlight = useRef(false);

  // The redemption itself lives in @/lib/redeemExecution so the raffle's hidden
  // delivery uses exactly this same path, restrictions included.
  const redeem = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized || !profile?.id || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    onBusyChange?.(true);
    setResult(null);

    try {
      const outcome = await redeemCodeForProfile({
        code: normalized,
        profileId: profile.id,
        fallbackProfile: profile,
      });

      if (outcome.outcome === OUTCOME.REDEEMED) {
        setResult({ success: true, message: outcome.message, pet: outcome.pet || null });
        setCode('');
        onRedeemed?.();
      } else if (outcome.outcome === OUTCOME.APPLIED_UNCONFIRMED || outcome.outcome === OUTCOME.PARTLY_APPLIED) {
        setResult({ success: false, warning: true, message: outcome.message });
      } else {
        setResult({ success: false, message: outcome.message });
      }
    } finally {
      inFlight.current = false;
      setLoading(false);
      onBusyChange?.(false);
    }
  };

  const tone = result?.warning
    ? 'bg-amber-50 text-amber-700'
    : result?.success
      ? 'bg-green-50 text-green-700'
      : 'bg-red-50 text-red-700';
  const Icon = result?.warning ? AlertTriangle : result?.success ? CheckCircle2 : AlertCircle;

  const isPlain = variant === 'plain';

  return (
    <div className={isPlain ? 'space-y-3' : 'bg-white rounded-2xl border border-slate-100 shadow-sm p-5'}>
      {!isPlain && (
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">Redeem a Code</h3>
        </div>
      )}
      {/* A plain text field: codes use letters, digits, underscores and hyphens. */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter code..."
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && redeem()}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          aria-label="Reward code"
          className="uppercase placeholder:normal-case rounded-xl font-mono tracking-wider"
        />
        <Button onClick={redeem} disabled={loading || !code.trim()} className="rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
        </Button>
      </div>

      {result && (
        <div className={`${isPlain ? '' : 'mt-3'} flex items-center gap-3 text-sm rounded-xl px-3 py-2 ${tone}`}>
          {result.pet ? (
            <PetAvatar petId={result.pet.id} size="lg" className="shrink-0" />
          ) : (
            <Icon className="w-4 h-4 shrink-0" />
          )}
          <span className="font-medium">{result.message}</span>
        </div>
      )}
    </div>
  );
}