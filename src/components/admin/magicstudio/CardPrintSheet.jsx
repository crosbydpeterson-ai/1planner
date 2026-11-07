import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Info, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PrintCardSlot from '@/components/admin/magicstudio/PrintCardSlot';
import PrintPagePreview from '@/components/admin/magicstudio/PrintPagePreview';
import CardFront from '@/components/admin/magicstudio/CardFront';
import CardBack from '@/components/admin/magicstudio/CardBack';
import { CARD_W, CARD_H } from '@/lib/brandAssets';
import { buildCardPdfUrl } from '@/lib/cardPdf';

// Prints one card on two Letter pages: the front on page 1, the back on page 2
// at the mirrored position, so a two-sided print (flip on long edge) lines the
// halves up on the same spot. Only the hidden sheet below reaches the printer.
export default function CardPrintSheet({ open, onClose, card, design, name }) {
  const sheetRef = useRef(null);
  const captureRef = useRef({});
  const [pdfUrl, setPdfUrl] = useState(null);
  const [building, setBuilding] = useState(false);

  if (!open || !card) return null;

  const print = () => {
    // Some embedded panels block the browser's print dialog and give no error,
    // so watch for the printer event and fall back to a ready-to-print PDF.
    let opened = false;
    const mark = () => {
      opened = true;
    };
    window.addEventListener('beforeprint', mark);
    try {
      window.print();
    } catch (e) {
      console.error('Print dialog unavailable', e);
    }
    setTimeout(() => {
      window.removeEventListener('beforeprint', mark);
      if (!opened) makePdf();
    }, 900);
  };

  const makePdf = async () => {
    setBuilding(true);
    try {
      setPdfUrl(await buildCardPdfUrl(captureRef.current));
    } catch (e) {
      console.error('Could not build the card PDF', e);
    } finally {
      setBuilding(false);
    }
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

            {pdfUrl && (
              <div className="mt-4 rounded-lg border border-slate-300 bg-slate-50 p-3">
                <p className="mb-2 text-[11px] leading-relaxed text-slate-700">
                  This window does not allow the print dialog. Your card is ready as a PDF below — print it from the
                  PDF viewer or download it, then send it to your printer.
                </p>
                <iframe title="Magic Card PDF" src={pdfUrl} className="h-[360px] w-full rounded border bg-white" />
              </div>
            )}

            <div className="mt-4 flex gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-[11px] leading-relaxed text-indigo-900">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                In the print dialog choose <strong>two-sided</strong> with <strong>“Flip on long edge”</strong> so the back
                lands behind the front. Keep margins on <strong>Default</strong> and turn on{' '}
                <strong>“Background graphics”</strong> for the full colors. Cut along the dashed guides.
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {pdfUrl && (
                <Button variant="outline" asChild>
                  <a href={pdfUrl} download={`magic-card-${card?.number || 'card'}.pdf`}>
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </a>
                </Button>
              )}
              <Button onClick={print} disabled={building} className="bg-indigo-600 hover:bg-indigo-700">
                <Printer className="w-4 h-4 mr-2" /> {building ? 'Preparing…' : 'Print'}
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

      {/* Full-size render kept off-screen so the PDF fallback can capture the
          exact card artwork without depending on the printer. */}
      {createPortal(
        <div
          aria-hidden
          style={{ position: 'fixed', left: '-10000px', top: 0, width: CARD_W, pointerEvents: 'none' }}
        >
          <div ref={(el) => (captureRef.current.front = el)} style={{ width: CARD_W, height: CARD_H }}>
            <CardFront name={name} design={design} />
          </div>
          <div ref={(el) => (captureRef.current.back = el)} style={{ width: CARD_W, height: CARD_H }}>
            <CardBack number={card.number || ''} design={design} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}