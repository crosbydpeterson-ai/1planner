import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import RedeemCodeInput from '@/components/redeem/RedeemCodeInput';

/**
 * The single redemption dialog, shared by the dashboard's reward widget and the
 * permanent "Redeem Code" action. All redemption logic lives in RedeemCodeInput.
 */
export default function RedeemCodeDialog({ open, onOpenChange, profile, onRedeemed }) {
  const [saving, setSaving] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  // Closing is refused while a claim is saving, so the result cannot be hidden.
  const handleOpenChange = (next) => {
    if (saving && !next) return;
    if (next) {
      setSaving(false);
      setSucceeded(false);
    }
    onOpenChange(next);
  };

  const handleRedeemed = () => {
    setSucceeded(true);
    onRedeemed?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redeem your reward</DialogTitle>
          <DialogDescription>Enter the code from your card.</DialogDescription>
        </DialogHeader>

        <div className="py-1">
          <RedeemCodeInput
            profile={profile}
            variant="plain"
            autoFocus
            onBusyChange={setSaving}
            onRedeemed={handleRedeemed} />

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            {saving ? 'Saving...' : succeeded ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}