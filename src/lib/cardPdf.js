import { CARD_IN, PAGE_IN, cardLeftIn } from '@/lib/cardPrint';

// The artwork is captured at 4x (roughly 615 dpi on the printed card), which
// keeps the barcode bars and the small print crisp on paper.
const CAPTURE_SCALE = 4;

// Builds a Letter PDF with both sides of the card: page 1 holds the front,
// page 2 the back at the mirrored spot, both at exact wallet-card size with the
// page margins baked in. Works anywhere, including embedded panels where the
// browser refuses to open its own print dialog.
export async function buildCardPdf(nodes) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const shots = {};
  for (const side of ['front', 'back']) {
    const node = nodes?.[side];
    if (!node) throw new Error(`The ${side} of the card is missing`);
    const canvas = await html2canvas(node, {
      backgroundColor: '#ffffff',
      scale: CAPTURE_SCALE,
      useCORS: true,
      imageTimeout: 20000,
      logging: false,
    });
    shots[side] = canvas.toDataURL('image/png');
  }

  const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait', compress: true });
  pdf.addImage(shots.front, 'PNG', cardLeftIn('front'), PAGE_IN.margin, CARD_IN.w, CARD_IN.h);
  pdf.addPage('letter', 'portrait');
  pdf.addImage(shots.back, 'PNG', cardLeftIn('back'), PAGE_IN.margin, CARD_IN.w, CARD_IN.h);
  return pdf;
}

export async function buildCardPdfUrl(nodes) {
  const pdf = await buildCardPdf(nodes);
  return String(pdf.output('bloburl'));
}

// Saves the two-page PDF as a file and returns it, so the caller can also show
// it on screen. It goes through the PDF library's own save, which keeps the
// download link alive until the browser has taken the file.
export async function downloadCardPdf(nodes, filename) {
  const pdf = await buildCardPdf(nodes);
  pdf.save(filename);
  return pdf;
}