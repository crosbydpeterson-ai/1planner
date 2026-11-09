import React, { useState } from 'react';
import QuickHelpButton from '@/components/helper/QuickHelpButton';
import QuickHelpDialog from '@/components/helper/QuickHelpDialog';

// Just the button and its dialog — Layout places the button in the app's
// floating top-right cluster, next to messages, so neither covers page controls.
export default function QuickHelpLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <QuickHelpButton onClick={() => setOpen(true)} />
      <QuickHelpDialog open={open} onOpenChange={setOpen} />
    </>
  );
}