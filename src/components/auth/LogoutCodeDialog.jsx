import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, KeyRound } from 'lucide-react';
import { attemptLogoutWithCode, REASON_LABELS } from '@/lib/logoutRestriction';

/**
 * Student-facing logout-code prompt.
 * Cancel leaves the session untouched. A failed/unknown code does NOT log out.
 * Only a successfully validated + consumed code calls onAllowed (which logs out).
 */
export default function LogoutCodeDialog({ open, onOpenChange, profile, onAllowed }) {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setCode('');
    setError('');
    setValidating(false);
  };

  const handleCancel = () => {
    if (validating) return;
    reset();
    onOpenChange(false);
  };

  const handleConfirm = async () => {
    if (validating) return;
    if (!code.trim()) {
      setError('Please enter a code.');
      return;
    }
    setValidating(true);
    setError('');
    try {
      const result = await attemptLogoutWithCode(code, profile);
      if (result.success) {
        reset();
        onOpenChange(false);
        onAllowed();
      } else {
        setError(REASON_LABELS[result.reason] || 'That code could not be used.');
        setValidating(false);
      }
    } catch (e) {
      setError(REASON_LABELS.load_failed);
      setValidating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleCancel();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => { if (validating) e.preventDefault(); }}>
        <DialogHeader>
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-amber-100 flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center">Logout code required</DialogTitle>
          <DialogDescription className="text-center">
            Account switching is temporarily restricted. Enter a logout code provided by an admin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="logout-code">Logout code</Label>
            <Input
              id="logout-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !validating) handleConfirm();
              }}
              placeholder="Enter code"
              className="text-center text-lg tracking-widest font-mono"
              disabled={validating}
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
            <p className="font-semibold mb-1">Need a code?</p>
            <p>
              Ask your teacher or an admin for a logout code. If you are stuck, let an admin know so they
              can help or turn off the restriction.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={validating}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={validating}>
            {validating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking…
              </>
            ) : (
              'Confirm logout'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}