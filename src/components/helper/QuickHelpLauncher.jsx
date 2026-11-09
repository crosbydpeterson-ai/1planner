import React, { useState } from 'react';
import QuickHelpButton from '@/components/helper/QuickHelpButton';
import QuickHelpDialog from '@/components/helper/QuickHelpDialog';

// Mounted at the app root rather than inside the page layout, so the same
// labelled button is in the same corner of every screen in the app.
export default function QuickHelpLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed top-3 right-3 z-[60]">
        <QuickHelpButton onClick={() => setOpen(true)} />
      </div>
      <QuickHelpDialog open={open} onOpenChange={setOpen} />
    </>
  );
}