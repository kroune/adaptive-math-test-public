import { jsPDF } from 'jspdf';
import { GRAY, PAGE_WIDTH, PAGE_HEIGHT, MR } from './colors';

export function addFooter(doc: jsPDF, dateStr: string) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(
      `Адаптивное тестирование по математике  •  ${dateStr}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - 8,
      { align: 'center' },
    );
    doc.text(`${i} / ${pageCount}`, PAGE_WIDTH - MR, PAGE_HEIGHT - 8, { align: 'right' });
  }
}
