import { CARD_IN, CARDS_PER_PAGE, chunkCards, slotPos } from '@/lib/cardPrint';

// The artwork is captured at 4x (roughly 615 dpi on paper), which keeps the QR
// modules crisp enough for a phone camera to read from across a desk.
const CAPTURE_SCALE = 4;

/**
 * Builds a Letter PDF of one helper card, repeated across the same 2 × 3 grid
 * the magic card sheet uses, so a printed page gives six cards at exactly
 * wallet-card size wherever the browser blocks the print dialog.
 */
export async function buildHelperCardPdf(node, copies = 1) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  if (!node) throw new Error('The card artwork is not on screen');

  const canvas = await html2canvas(node, {
    backgroundColor: '#ffffff',
    scale: CAPTURE_SCALE,
    useCORS: true,
    imageTimeout: 20000,
    logging: false,
  });
  const shot = canvas.toDataURL('image/png');

  const count = Math.max(1, Math.min(Number(copies) || 1, CARDS_PER_PAGE));
  const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait', compress: true });

  let started = false;
  for (const sheet of chunkCards(Array.from({ length: count }), CARDS_PER_PAGE)) {
    if (started) pdf.addPage('letter', 'portrait');
    started = true;
    sheet.forEach((_, index) => {
      const { left, top } = slotPos(index, 'front');
      pdf.addImage(shot, 'PNG', left, top, CARD_IN.w, CARD_IN.h);
    });
  }

  return pdf;
}

export const buildHelperCardPdfUrl = async (node, copies) =>
  String((await buildHelperCardPdf(node, copies)).output('bloburl'));

export async function downloadHelperCardPdf(node, filename, copies) {
  const pdf = await buildHelperCardPdf(node, copies);
  pdf.save(filename);
  return pdf;
}