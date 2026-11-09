import React from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Info } from 'lucide-react';
import HelperCardFace, { HELPER_CARD_W, HELPER_CARD_H } from './HelperCardFace';
import { CARD_IN } from '@/lib/cardPrint';

const PREVIEW_W = 340;
const PREVIEW_SCALE = PREVIEW_W / HELPER_CARD_W;
// The artboard is 520 units wide and prints at CARD_IN.w inches, so the QR on
// paper is about an inch square — large enough to read from across a desk.
const PRINT_SCALE = (CARD_IN.w * 96) / HELPER_CARD_W;

export default function HelperCardPrintDialog({ open, card, onClose }) {
  if (!card) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Print helper card</DialogTitle>
            <DialogDescription className="text-slate-400">
              One card, one Letter page, printed at wallet size.
            </DialogDescription>
          </DialogHeader>

          <div
            className="mx-auto overflow-hidden rounded-2xl"
            style={{ width: PREVIEW_W, height: Math.round(HELPER_CARD_H * PREVIEW_SCALE) }}
          >
            <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }}>
              <HelperCardFace card={card} />
            </div>
          </div>

          <div className="flex gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 text-[11px] leading-relaxed text-indigo-100">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              Leave the print dialog at <strong>Scale 100%</strong> and turn on{' '}
              <strong>background graphics</strong>. The card carries no password and no PIN — only the card's own
              number in the QR code.
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Close
            </Button>
            <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {createPortal(
        <div className="magic-print-root" aria-hidden>
          <div className="magic-print-page">
            <div
              style={{
                position: 'absolute',
                left: '0.75in',
                top: '0.75in',
                width: `${CARD_IN.w}in`,
                height: `${CARD_IN.h}in`,
                overflow: 'hidden',
                outline: '1px dashed #94a3b8',
              }}
            >
              <div style={{ transform: `scale(${PRINT_SCALE})`, transformOrigin: 'top left' }}>
                <HelperCardFace card={card} />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}