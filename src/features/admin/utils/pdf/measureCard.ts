import { jsPDF } from 'jspdf';
import type { Item, ItemAnswer } from '../../../../types';
import { CONTENT_W } from './colors';
import { fitImage, type ImageData } from './imageLoader';

// Compute how tall a single question card will be, given the item and preloaded images.
export function measureCard(
  doc: jsPDF,
  item: Item | undefined,
  images: Map<string, ImageData>,
  answer?: ItemAnswer,
): number {
  const cardInnerW = CONTENT_W - 10; // 5mm padding each side
  let h = 10; // header strip
  h += 4; // top padding

  const mainImg = item?.image_url ? images.get(item.image_url) : undefined;
  if (mainImg) {
    const { h: imgH } = fitImage(mainImg, cardInnerW, 65);
    h += imgH + 4;
  }

  if (item?.text) {
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(item.text, cardInnerW).length;
    h += lines * 5 + 3;
  }

  if (item?.answer_type === 'text_input') {
    h += 6; // header "Ответ:"
    h += 8; // student row
    if (answer && !answer.is_correct) h += 8; // correct row (only when wrong)
  } else if (item?.options?.length) {
    h += 6; // header "Варианты ответа:"
    for (const opt of item.options) {
      const optImg = opt.image_url ? images.get(opt.image_url) : undefined;
      let rowH = 8;
      if (optImg) {
        const { h: ih } = fitImage(optImg, cardInnerW - 20, 30);
        rowH = Math.max(rowH, ih + 3);
      }
      if (opt.text) {
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(9.5);
        const lines = doc.splitTextToSize(opt.text, cardInnerW - 20).length;
        rowH = Math.max(rowH, lines * 4.5 + 3);
      }
      h += rowH + 1.5;
    }
  } else {
    // No options, no text input: fallback single-row summary
    h += 16;
  }

  h += 4; // bottom padding
  return h;
}
