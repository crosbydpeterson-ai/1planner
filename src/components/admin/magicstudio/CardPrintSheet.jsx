import React, { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, Info, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import PrintSheetPage from '@/components/admin/magicstudio/PrintSheetPage';
import PrintPagePreview from '@/components/admin/magicstudio/PrintPagePreview';
import CardCapture from '@/components/admin/magicstudio/CardCapture';
import { buildCardPdfUrl, downloadCardPdf } from '@/lib/cardPdf';
import { CARDS_PER_PAGE, chunkCards } from '@/lib/cardPrint';

// Prints cards on Letter paper, two across and three down: the front of each
// card on one page, its back mirrored on the next, so a sheet holds up to six
// cards and a two-sided print (flip on the long edge) lines the halves up.
//
// This is a dialog of its own, opened on top of the studio. A hand-rolled
// overlay is not part of the studio's modal layer, so every click in it counts
// as a click outside the studio and the studio closes before the button fires.
export default function CardPrintSheet({ open, onClose, items = [] }) {
  const captureRef = useRef([]);
  const [copies, setCopies] = useState(1);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [building, setBuilding] = useState(false);
  const [pdfError, setPdfError] = useState('');

  // Each card keeps its capture index, so repeats of one card and many different
  // cards both point back at the right off-screen artwork.
  const entries = useMemo(() => {
    const base = items.map((item, index) => ({ ...item, captureIndex: index }));
    if (base.length === 1) return Array.from({ length: Math.max(1, copies) }, () => base[0]);
    return base;
  }, [items, copies]);

  const sheets = useMemo(() => chunkCards(entries, CARDS_PER_PAGE), [entries]);
  const order = useMemo(() => entries.map((entry) => entry.captureIndex), [entries]);

  if (!open || items.length === 0) return null;

  const filename = `magic-${items.length === 1 ? `card-${items[0].card?.number || 'card'}` : `cards-${entries.length}`}.pdf`;

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
    setPdfError('');
    try {
      const url = await buildCardPdfUrl(captureRef.current, order);
      setPdfUrl(url);
      return url;
    } catch (e) {
      console.error('Could not build the card PDF', e);
      setPdfError('The PDF could not be built. Close this window and try again.');
      return null;
    } finally {
      setBuilding(false);
    }
  };

  const download = async () => {
    setBuilding(true);
    setPdfError('');
    try {
      const pdf = await downloadCardPdf(captureRef.current, filename, order);
      // Same file shown on screen, in case the browser blocks the download.
      setPdfUrl(String(pdf.output('bloburl')));
    } catch (e) {
      console.error('Card PDF download failed:', e);
      setPdfError('The PDF could not be built. Close this window and try again.');
    } finally {
      setBuilding(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{entries.length === 1 ? 'Print Card' : `Print ${entries.length} Cards`}</DialogTitle>
            <DialogDescription>
              Letter paper · 3.375 × 2.125 in wallet card (85.6 × 54 mm) · {CARDS_PER_PAGE} cards per sheet
            </DialogDescription>
          </DialogHeader>

          {items.length === 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Copies</span>
              <div className="inline-flex items-center rounded-lg border border-slate-300">
                <button
                  type="button"
                  className="px-2.5 py-1 text-slate-600 disabled:opacity-40"
                  disabled={copies <= 1}
                  onClick={() => setCopies((c) => Math.max(1, c - 1))}
                >
                  −
                </button>
                <span className="px-3 text-sm font-semibold text-slate-800">{copies}</span>
                <button
                  type="button"
                  className="px-2.5 py-1 text-slate-600 disabled:opacity-40"
                  disabled={copies >= CARDS_PER_PAGE}
                  onClick={() => setCopies((c) => Math.min(CARDS_PER_PAGE, c + 1))}
                >
                  +
                </button>
              </div>
              <span className="text-[11px] text-slate-500">
                of {CARDS_PER_PAGE} per sheet · {sheets.length} sheet{sheets.length === 1 ? '' : 's'}
              </span>
            </div>
          )}

          <div className="space-y-4">
            {sheets.map((sheet, pageIndex) => (
              <div key={pageIndex}>
                {sheets.length > 1 && (
                  <p className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Sheet {pageIndex + 1}
                  </p>
                )}
                <div className="flex flex-wrap justify-center gap-4">
                  <PrintPagePreview side="front" label={`Page ${pageIndex * 2 + 1} · Front`} entries={sheet} />
                  <PrintPagePreview side="back" label={`Page ${pageIndex * 2 + 2} · Back (mirrored)`} entries={sheet} />
                </div>
              </div>
            ))}
          </div>

          {pdfUrl && (
            <div className="mt-4 rounded-lg border border-slate-300 bg-slate-50 p-3">
              <p className="mb-2 text-[11px] leading-relaxed text-slate-700">
                Every page is in the letter PDF below, already at wallet-card size. Print it from the PDF viewer, or
                download it and send it straight to your printer.
              </p>
              <iframe title="Magic Card PDF" src={pdfUrl} className="h-[360px] w-full rounded border bg-white" />
              <a
                href={pdfUrl}
                download={filename}
                className="mt-2 inline-block text-[11px] font-semibold text-indigo-700 underline"
              >
                Open the PDF in a new tab
              </a>
            </div>
          )}

          <div className="mt-4 flex gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-[11px] leading-relaxed text-indigo-900">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              In the print dialog leave <strong>Scale at 100%</strong> (not “Fit to page”) and choose{' '}
              <strong>two-sided · “Flip on long edge”</strong> so each back lands behind its front. Turn on{' '}
              <strong>“Background graphics”</strong> for the full colors, then cut along the dashed lines.
            </div>
          </div>

          {pdfError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">{pdfError}</p>
          )}

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="outline" onClick={download} disabled={building}>
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
            <React.Fragment key={pageIndex}>
              <PrintSheetPage side="front" entries={sheet} />
              <PrintSheetPage side="back" entries={sheet} />
            </React.Fragment>
          ))}
        </div>,
        document.body
      )}

      {/* Full-size artwork kept off-screen so the PDF can capture the exact card */}
      {createPortal(<CardCapture refs={captureRef} items={items} />, document.body)}
    </>
  );
}