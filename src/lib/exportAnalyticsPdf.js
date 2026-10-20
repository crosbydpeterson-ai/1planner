import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Render a DOM element to a multi-page PDF and download it.
 * Used by the analytics dashboards' "Export PDF" button.
 */
export async function exportElementToPdf(el, filename = 'analytics-report.pdf') {
  if (!el) return;
  const canvas = await html2canvas(el, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const imgData = canvas.toDataURL('image/png');

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
  heightLeft -= pageH;

  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
    heightLeft -= pageH;
  }

  pdf.save(filename);
}