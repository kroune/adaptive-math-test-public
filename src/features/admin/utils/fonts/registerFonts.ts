import { jsPDF } from 'jspdf';
import { robotoRegularBase64 } from './roboto-regular';
import { robotoBoldBase64 } from './roboto-bold';

export function registerFonts(doc: jsPDF): void {
  doc.addFileToVFS('Roboto-Regular.ttf', robotoRegularBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', robotoBoldBase64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto', 'normal');
}
