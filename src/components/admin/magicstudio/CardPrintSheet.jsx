import React from 'react';
import { createPortal } from 'react-dom';
import { Printer, X, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CardFront from '@/components/admin/magicstudio/CardFront';
import CardBack from '@/components/admin/magicstudio/CardBack';

// Wallet-size, two-sided sheet: front and back side by side on one page with
// cut guides. Only this sheet is visible when the browser prints.
const PRINT_SCALE = 0.62; // 520px art -> ~3.37in (85.6mm) wide wallet card

function CutGuide({ label, children }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#667085', marginBottom: 6 }}>
        <Scissors size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
        {label}
      </div>
      <div style={{ border: '1px dashed #94a3b8', padding: 6, borderRadius: 6, display: 'inline-block' }}>{children}</div>
    </div>
  );
}

export default function CardPrintSheet({ open, onClose, card, design, name }) {
  if (!open || !card) return null;

  return createPortal(
    <div className="print-overlay fixed inset-0 z-[120] bg-slate-900/70 overflow-auto p-4">
      <div data-print-sheet style={{ background: '#ffffff', borderRadius: 12, maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#101828' }}>Print Card</h3>
            <p style={{ fontSize: 11, color: '#667085' }}>
              Wallet size (85.6 × 54 mm). Print on one sheet, cut along the dashes, then stick the halves back to back.
              In the print dialog, turn on “Background graphics”.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
          <CutGuide label="Front">
            <CardFront name={name} design={design} scale={PRINT_SCALE} />
          </CutGuide>
          <CutGuide label="Back">
            <CardBack number={card.number} design={design} scale={PRINT_SCALE} />
          </CutGuide>
        </div>

        <div className="no-print" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700">
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}