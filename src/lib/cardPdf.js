import { CARD_IN, PAGE_IN, cardLeftIn } from '@/lib/cardPrint';

// Builds a print-ready Letter PDF of the Magic Card: page 1 holds the front,
// page 2 the back at the mirrored spot, both at exact wallet-card size. Used
// when the app is running somewhere the browser refuses to open its own print
// dialog (for example inside an embedded preview panel).
export async function buildCardPdfUrl(nodes) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const shots = {};
  for (const side of ['front', 'back']) {
    if (!nodes[side]) continue;
    const canvas = await html2canvas(nodes[side], {
      backgroundColor: '#ffffff',
      scale: 3,
      useCORS: true,
      logging: false,
    });
    shots[side] = canvas.toDataURL('image/png');
  }

  const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait' });
  pdf.addImage(shots.front, 'PNG', cardLeftIn('front'), PAGE_IN.margin, CARD_IN.w, CARD_IN.h);
  pdf.addPage('letter', 'portrait');
  pdf.addImage(shots.back, 'PNG', cardLeftIn('back'), PAGE_IN.margin, CARD_IN.w, CARD_IN.h);

  return String(pdf.output('bloburl'));
}