import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Info, Download } from 'lucide-react';
import HelperCardFace, { HELPER_CARD_W } from './HelperCardFace';
import { CARD_IN, CARDS_PER_PAGE, PAGE_IN, chunkCards, slotPos } from '@/lib/cardPrint';
import { buildHelperCardPdfUrl, downloadHelperCardPdf } from '@/lib/helperCardPrint';

// The face is drawn 520 units wide and prints at CARD_IN.w inches.
const PRINT_SCALE = (CARD_IN.w * 96) / HELPER_CARD_W;

// Preview of one printed Letter page, in CSS pixels at 96dpi.
const PAGE_PREVIEW_W = 300;
const PAGE_PX = PAGE_PREVIEW_W / (PAGE_IN.w * 96);
const SLOT_PX_W = CARD_IN.w * 96 * PAGE_PX;
const SLOT_PX_H = CARD_IN.h * 96 * PAGE_PX;
const SLOT_SCALE = SLOT_PX_W / HELPER_CARD_W;

const previewSlot = (index) => {
  const { left, top } = slotPos(index, 'front');
  return { left: left * 96 * PAGE_PX, top: top * 96 * PAGE_PX };
};

// Prints a helper card the way a magic card prints: the same 2 × 3 Letter grid,
// so one sheet gives six cards to cut out, with a matching PDF when the browser
// will not open its print dialog.
export default function HelperCardPrintDialog({ open, card, onClose }) {
  const captureRef = useRef(null);
  const [copies, setCopies] = useState(1);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');

  if (!card) return null;

  const entries = Array.from({ length: copies });
  const sheets = chunkCards(entries, CARDS_PER_PAGE);
  const filename = `helper-card-${card.number || 'card'}.pdf`;

  const makePdf = async () => {
    setBuilding(true);
    setError('');
    try {
      const url = await buildHelperCardPdfUrl(captureRef.current, copies);
      setPdfUrl(url);
      return url;
    } catch (e) {
      console.error('Could not build the helper card PDF', e);
      setError('The PDF could not be built. Close this window and try again.');
      return null;
    } finally {
      setBuilding(false);
    }
  };

  const download = async () => {
    setBuilding(true);
    setError('');
    try {
      const pdf = await downloadHelperCardPdf(captureRef.current, filename, copies);
      setPdfUrl(String(pdf.output('bloburl')));
    } catch (e) {
      console.error('Helper card PDF download failed:', e);
      setError('The PDF could not be built. Close this window and try again.');
    } finally {
      setBuilding(false);
    }
  };

  const print = () => {
    // Some embedded panels block the print dialog without an error, so watch for
    // the printer event and fall back to a ready-to-print PDF.
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

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Print helper card</DialogTitle>
            <DialogDescription className="text-slate-400">
              Letter paper · 3.375 × 2.125 in wallet card · {CARDS_PER_PAGE} cards per sheet
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Copies</span>
            <div className="inline-flex items-center rounded-lg border border-slate-600">
              <button
                type="button"
                className="px-2.5 py-1 text-slate-300 disabled:opacity-40"
                disabled={copies <= 1}
                onClick={() => { setCopies((c) => Math.max(1, c - 1)); setPdfUrl(null); }}
              >
                −
              </button>
              <span className="px-3 text-sm font-semibold text-white">{copies}</span>
              <button
                type="button"
                className="px-2.5 py-1 text-slate-300 disabled:opacity-40"
                disabled={copies >= CARDS_PER_PAGE}
                onClick={() => { setCopies((c) => Math.min(CARDS_PER_PAGE, c + 1)); setPdfUrl(null); }}
              >
                +
              </button>
            </div>
            <span className="text-[11px] text-slate-500">of {CARDS_PER_PAGE} per sheet</span>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {sheets.map((sheet, pageIndex) => (
              <div key={pageIndex}>
                <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Sheet {pageIndex + 1}
                </p>
                <div
                  className="relative overflow-hidden rounded-md bg-white shadow-lg"
                  style={{ width: PAGE_PREVIEW_W, height: PAGE_PREVIEW_W * (PAGE_IN.h / PAGE_IN.w) }}
                >
                  {sheet.map((_, index) => {
                    const { left, top } = previewSlot(index);
                    return (
                      <div
                        key={index}
                        style={{
                          position: 'absolute',
                          left,
                          top,
                          width: SLOT_PX_W,
                          height: SLOT_PX_H,
                          overflow: 'hidden',
                          outline: '1px dashed #cbd5e1',
                        }}
                      >
                        <div style={{ transform: `scale(${SLOT_SCALE})`, transformOrigin: 'top left' }}>
                          <HelperCardFace card={card} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {pdfUrl && (
            <div className="mt-2 rounded-lg border border-slate-600 bg-slate-800 p-3">
              <p className="mb-2 text-[11px] leading-relaxed text-slate-300">
                Every sheet is in the letter PDF below, already at wallet-card size. Print it from the PDF viewer, or
                download it and send it straight to your printer.
              </p>
              <iframe title="Helper Card PDF" src={pdfUrl} className="h-[320px] w-full rounded border bg-white" />
              <a href={pdfUrl} download={filename} className="mt-2 inline-block text-[11px] font-semibold text-indigo-300 underline">
                Open the PDF in a new tab
              </a>
            </div>
          )}

          <div className="flex gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3 text-[11px] leading-relaxed text-indigo-100">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              Leave the print dialog at <strong>Scale 100%</strong> and turn on{' '}
              <strong>background graphics</strong>. The card carries no password and no PIN — only the card's own
              number in the QR code.
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-[11px] text-red-200">{error}</p>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Close
            </Button>
            <Button
              variant="outline"
              onClick={download}
              disabled={building}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <Download className="w-4 h-4 mr-2" /> {building ? 'Preparing…' : 'Download PDF'}
            </Button>
            <Button onClick={print} disabled={building} className="bg-indigo-600 hover:bg-indigo-700">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {createPortal(
        <div className="magic-print-root" aria-hidden>
          {sheets.map((sheet, pageIndex) => (
            <div className="magic-print-page" key={pageIndex}>
              {sheet.map((_, index) => {
                const { left, top } = slotPos(index, 'front');
                return (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${left}in`,
                      top: `${top}in`,
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
                );
              })}
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* Full-size artwork kept off-screen so the PDF captures the exact card */}
      {createPortal(
        <div style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }} aria-hidden>
          <div ref={captureRef}>
            <HelperCardFace card={card} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}