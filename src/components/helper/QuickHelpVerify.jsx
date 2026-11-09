import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { verifyHelperAdmin, maskHelperNumber } from '@/lib/helperCards';

// Step 2: prove the person holding the card is the admin it belongs to.
// The check runs on this device, so it is a speed bump, not a wall — every
// confirmed action still lands in the card's history.
export default function QuickHelpVerify({ card, onVerified, onBack }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy || !password.trim()) return;
    setBusy(true);
    setError('');
    try {
      const check = await verifyHelperAdmin(card, password);
      if (!check.ok) {
        setError(check.reason);
        return;
      }
      onVerified(check.admin);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-slate-800 border border-slate-700 p-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-indigo-300" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{card.nickname || 'Helper card'}</p>
          <p className="text-[11px] text-slate-400 font-mono">{maskHelperNumber(card.number)}</p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
          Admin on this card
        </p>
        <div className="flex items-center gap-3 rounded-xl bg-slate-800 border border-slate-700 p-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {(card.adminUsername || '?').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{card.adminUsername || 'Unknown admin'}</p>
            <p className="text-[11px] text-slate-400">Confirm with this admin's password</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Your password</p>
        <Input
          type="password"
          value={password}
          autoFocus
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Admin password"
          className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
        />
      </div>

      {error && (
        <p className="flex items-start gap-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={onBack} className="border-slate-600 text-slate-300 hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button
          onClick={submit}
          disabled={busy || !password.trim()}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
          Verify admin
        </Button>
      </div>
    </div>
  );
}