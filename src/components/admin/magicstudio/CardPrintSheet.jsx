import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PrintCardSlot from '@/components/admin/magicstudio/PrintCardSlot';
import PrintPagePreview from '@/components/admin/magicstudio/PrintPagePreview';

// Prints one card on two Letter pages: the front on page 1, the back on page 2
// at the mirrored position, so a two-sided print (flip on long edge) lines the
// halves up on the same spot. Only the hidden sheet below reaches the printer.
export default function CardPrintSheet({ open, onClose, card, design, name }) {
  const sheetRef = useRef(null);
  if (!open || !card) return null;

  const print = async () => {
    // Wait for any art still loading, so the card never prints with a blank logo.
    const images = Array.from(sheetRef.current?.querySelectorAll('img') || []);
    await Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            })
      )
    );
    window.print();
  };

  return (
    <>
      {/* The studio dialog switches pointer events off for the whole page while
          it is open, so this window turns them back on for itself. */}
      {createPortal(
        <div
          className="print-overlay fixed inset-0 z-[120] overflow-auto p-4"
          style={{ pointerEvents: 'auto', background: 'rgba(15, 23, 42, 0.7)' }}
        >
          <div className="mx-auto max-w-3xl rounded-xl bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Print Card</h3>
                <p className="text-[11px] text-slate-500">
                  Letter paper · 3.375 × 2.125 in wallet card (85.6 × 54 mm) · 0.5 in margins
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              <PrintPagePreview side="front" label="Page 1 · Front" card={card} design={design} name={name} />
              <PrintPagePreview side="back" label="Page 2 · Back" card={card} design={design} name={name} />
            </div>

            <div className="mt-4 flex gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-[11px] leading-relaxed text-indigo-900">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                In the print dialog choose <strong>two-sided</strong> with <strong>“Flip on long edge”</strong> so the back
                lands behind the front. Keep margins on <strong>Default</strong> and turn on{' '}
                <strong>“Background graphics”</strong> for the full colors. Cut along the dashed guides.
              </div>
            </div>

            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={print} className="bg-indigo-600 hover:bg-indigo-700">
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {createPortal(
        <div className="magic-print-root" ref={sheetRef} aria-hidden>
          {['front', 'back'].map((side) => (
            <div className="magic-print-page" key={side}>
              <PrintCardSlot side={side} card={card} design={design} name={name} />
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}