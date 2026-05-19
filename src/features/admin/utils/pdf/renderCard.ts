import { jsPDF } from 'jspdf';
import type { Item, ItemAnswer } from '../../../../types';
import {
  CHARCOAL,
  GRAY,
  LIGHT_GRAY,
  MINT,
  MINT_LIGHT,
  ROSE,
  ROSE_LIGHT,
} from './colors';
import { fitImage, type ImageData } from './imageLoader';
import { measureCard } from './measureCard';

function resolveStudentAnswer(a: ItemAnswer, item: Item | undefined): string {
  if (a.text_answer_given != null) return a.text_answer_given;
  if (a.answer_given != null && item?.options?.[a.answer_given]?.text)
    return item.options[a.answer_given].text!;
  if (a.answer_given != null) return String.fromCharCode(1040 + a.answer_given);
  return '—';
}

function resolveCorrectAnswer(item: Item | undefined): string {
  if (!item) return '—';
  if (item.correct_text != null) return item.correct_text;
  if (item.correct_option != null && item.options?.[item.correct_option]?.text)
    return item.options[item.correct_option].text!;
  if (item.correct_option != null) return String.fromCharCode(1040 + item.correct_option);
  return '—';
}

function optionLetter(i: number): string {
  return String.fromCharCode(1040 + i); // А, Б, В, Г, ...
}

// Render a single question card starting at (x, y). Returns the Y position below the card.
export function renderCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  index: number,
  total: number,
  item: Item | undefined,
  answer: ItemAnswer,
  images: Map<string, ImageData>,
): number {
  const cardH = measureCard(doc, item, images, answer);
  const isCorrect = answer.is_correct;
  const headerBg = isCorrect ? MINT_LIGHT : ROSE_LIGHT;
  const headerFg = isCorrect ? MINT : ROSE;

  // Card outer border
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, width, cardH, 2.5, 2.5, 'S');

  // Header strip
  const headerH = 10;
  doc.setFillColor(...headerBg);
  doc.roundedRect(x, y, width, headerH, 2.5, 2.5, 'F');
  // Square off bottom corners of header by overlaying a rect
  doc.rect(x, y + headerH - 3, width, 3, 'F');

  // Header text
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...CHARCOAL);
  doc.text(`Задание ${index} из ${total}`, x + 5, y + headerH / 2 + 0.5, { baseline: 'middle' });

  // Status badge + time on right
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...headerFg);
  const statusText = isCorrect ? 'Верно' : 'Неверно';
  const timeText = `${(answer.time_spent_ms / 1000).toFixed(1)}с`;
  const timeW = doc.getTextWidth(timeText);
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(timeText, x + width - 5, y + headerH / 2 + 0.5, {
    align: 'right',
    baseline: 'middle',
  });
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...headerFg);
  doc.text(statusText, x + width - 5 - timeW - 4, y + headerH / 2 + 0.5, {
    align: 'right',
    baseline: 'middle',
  });

  // Content area
  const contentX = x + 5;
  const cardInnerW = width - 10;
  let cy = y + headerH + 4;

  // Main image (centered)
  const mainImg = item?.image_url ? images.get(item.image_url) : undefined;
  if (mainImg) {
    const { w: iw, h: ih } = fitImage(mainImg, cardInnerW, 65);
    const ix = x + (width - iw) / 2;
    try {
      doc.addImage(mainImg.dataUrl, mainImg.format, ix, cy, iw, ih, undefined, 'FAST');
    } catch {
      // Ignore image render failures
    }
    cy += ih + 4;
  }

  // Question text
  if (item?.text) {
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...CHARCOAL);
    const lines = doc.splitTextToSize(item.text, cardInnerW);
    doc.text(lines, contentX, cy, { baseline: 'top' });
    cy += lines.length * 5 + 3;
  }

  // Answers block
  if (item?.answer_type === 'text_input') {
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text('Ответ ученика', contentX, cy);
    cy += 4;
    // Student answer row
    const studentBg = isCorrect ? MINT_LIGHT : ROSE_LIGHT;
    const studentFg = isCorrect ? MINT : ROSE;
    doc.setFillColor(...studentBg);
    doc.roundedRect(contentX, cy, cardInnerW, 7, 1.5, 1.5, 'F');
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...studentFg);
    doc.text(resolveStudentAnswer(answer, item), contentX + 3, cy + 4.5);
    cy += 8;
    // Correct answer row (only show if student was wrong)
    if (!isCorrect) {
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...GRAY);
      doc.text('Верный ответ', contentX, cy);
      cy += 4;
      doc.setFillColor(...MINT_LIGHT);
      doc.roundedRect(contentX, cy, cardInnerW, 7, 1.5, 1.5, 'F');
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...MINT);
      doc.text(resolveCorrectAnswer(item), contentX + 3, cy + 4.5);
      cy += 8;
    }
  } else if (item?.options?.length) {
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text('Варианты ответа', contentX, cy);
    cy += 4;

    const studentIdx = answer.answer_given;
    const correctIdx = item.correct_option;

    for (let i = 0; i < item.options.length; i++) {
      const opt = item.options[i];
      const optImg = opt.image_url ? images.get(opt.image_url) : undefined;
      const isStudent = studentIdx === i;
      const isCorrectOpt = correctIdx === i;

      // Compute row height
      let rowH = 8;
      if (optImg) {
        const { h: ih } = fitImage(optImg, cardInnerW - 20, 30);
        rowH = Math.max(rowH, ih + 3);
      }
      let optLines: string[] = [];
      if (opt.text) {
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(9.5);
        optLines = doc.splitTextToSize(opt.text, cardInnerW - 20);
        rowH = Math.max(rowH, optLines.length * 4.5 + 3);
      }

      // Row background + accent
      let bg: [number, number, number] | null = null;
      let fg: [number, number, number] = CHARCOAL;
      let badge: string | null = null;
      if (isStudent && isCorrectOpt) {
        bg = MINT_LIGHT;
        fg = MINT;
        badge = 'Ответ ученика · Верно';
      } else if (isStudent) {
        bg = ROSE_LIGHT;
        fg = ROSE;
        badge = 'Ответ ученика';
      } else if (isCorrectOpt) {
        bg = MINT_LIGHT;
        fg = MINT;
        badge = 'Верный ответ';
      }

      if (bg) {
        doc.setFillColor(...bg);
        doc.roundedRect(contentX, cy, cardInnerW, rowH, 1.5, 1.5, 'F');
      } else {
        doc.setDrawColor(235, 235, 235);
        doc.setLineWidth(0.2);
        doc.roundedRect(contentX, cy, cardInnerW, rowH, 1.5, 1.5, 'S');
      }

      // Option letter box
      const letter = optionLetter(i);
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...fg);
      doc.text(letter, contentX + 4, cy + rowH / 2 + 0.5, { baseline: 'middle' });

      // Option image
      let textX = contentX + 12;
      if (optImg) {
        const { w: iw, h: ih } = fitImage(optImg, 25, rowH - 3);
        try {
          doc.addImage(
            optImg.dataUrl,
            optImg.format,
            textX,
            cy + (rowH - ih) / 2,
            iw,
            ih,
            undefined,
            'FAST',
          );
        } catch {
          // Ignore
        }
        textX += iw + 3;
      }

      // Option text
      if (optLines.length) {
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(...fg);
        const textY = cy + rowH / 2 - ((optLines.length - 1) * 4.5) / 2;
        doc.text(optLines, textX, textY, { baseline: 'middle' });
      }

      // Badge on the right
      if (badge) {
        doc.setFont('Roboto', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...fg);
        doc.text(badge, contentX + cardInnerW - 3, cy + rowH / 2 + 0.5, {
          align: 'right',
          baseline: 'middle',
        });
      }

      cy += rowH + 1.5;
    }
  } else {
    // Fallback: no options known
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(
      `Ответ ученика: ${resolveStudentAnswer(answer, item)}`,
      contentX,
      cy + 4,
    );
    doc.text(
      `Верный ответ: ${resolveCorrectAnswer(item)}`,
      contentX,
      cy + 12,
    );
  }

  return y + cardH;
}
