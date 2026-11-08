import { CARD_IN, CARDS_PER_PAGE, chunkCards, slotPos } from '@/lib/cardPrint';

// The artwork is captured at 4x (roughly 615 dpi on the printed card), which
// keeps the barcode bars and the small print crisp on paper.
const CAPTURE_SCALE = 4;

const capture = (html2canvas, node) =>
  html2canvas(node, {
    backgroundColor: '#ffffff',
    scale: CAPTURE_SCALE,
    useCORS: true,
    imageTimeout: 20000,
    logging: false,
  }).then((canvas) => canvas.toDataURL('image/png'));

// Builds a Letter PDF for the cards: one page of fronts, then one page of the
// matching backs (mirrored), for every sheet of up to six cards, all at exact
// wallet-card size. `order` repeats a capture index when one card fills several
// slots. Works anywhere, including panels that block the browser's print dialog.
export async function buildCardPdf(nodes, order = null) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const plan = order?.length ? order : nodes.map((_, index) => index);
  const shots = new Map();

  const shotFor = async (index) => {
    if (shots.has(index)) return shots.get(index);
    const node = nodes[index];
    if (!node?.front || !node?.back) throw new Error('A card side is missing');
    const shot = {
      front: await capture(html2canvas, node.front),
      back: await capture(html2canvas, node.back),
    };
    shots.set(index, shot);
    return shot;
  };

  const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'portrait', compress: true });
  let started = false;
  const startPage = () => {
    if (started) pdf.addPage('letter', 'portrait');
    started = true;
  };

  for (const sheet of chunkCards(plan, CARDS_PER_PAGE)) {
    const sheetShots = await Promise.all(sheet.map(shotFor));
    for (const side of ['front', 'back']) {
      startPage();
      sheetShots.forEach((shot, index) => {
        const { left, top } = slotPos(index, side);
        pdf.addImage(shot[side], 'PNG', left, top, CARD_IN.w, CARD_IN.h);
      });
    }
  }

  return pdf;
}

export async function buildCardPdfUrl(nodes, order = null) {
  const pdf = await buildCardPdf(nodes, order);
  return String(pdf.output('bloburl'));
}

// Saves the PDF as a file and returns it, so the caller can also show it on
// screen. It goes through the PDF library's own save, which keeps the download
// link alive until the browser has taken the file.
export async function downloadCardPdf(nodes, filename, order = null) {
  const pdf = await buildCardPdf(nodes, order);
  pdf.save(filename);
  return pdf;
}