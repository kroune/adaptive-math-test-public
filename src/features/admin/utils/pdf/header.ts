import { jsPDF } from 'jspdf';
import type { Session } from '../../../../types';
import {
  CHARCOAL,
  CORAL,
  GRAY,
  WHITE,
  PAGE_WIDTH,
  ML,
  MR,
  CONTENT_W,
} from './colors';
import { scoreColor, scoreBgColor } from './stats';

/**
 * Render the page-1 header: coral banner, student metadata grid, separator,
 * and the overall-score badge. Returns the y position after the header.
 */
export function renderHeader(doc: jsPDF, session: Session, totalAnswered: number, correctCount: number): number {
  const dateStr = session.started_at
    ? new Date(session.started_at).toLocaleDateString('ru-RU')
    : '—';

  let y = 0;

  // ── Header banner ──
  const bannerH = 22;
  doc.setFillColor(...CORAL);
  doc.rect(0, 0, PAGE_WIDTH, bannerH, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text('Результаты тестирования', ML, bannerH / 2 + 1, { baseline: 'middle' });
  y = bannerH + 8;

  // ── Student info ──
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...CHARCOAL);
  doc.text(`${session.name} ${session.surname}`, ML, y);
  y += 8;

  const metaItems = [
    { label: 'Школа', value: session.school },
    { label: 'Класс', value: session.grade || '—' },
    { label: 'Режим', value: session.mode === 'adaptive' ? 'Адаптивный' : 'Линейный' },
    { label: 'Дата', value: dateStr },
  ];
  const colW = CONTENT_W / metaItems.length;
  doc.setFontSize(8);
  for (let i = 0; i < metaItems.length; i++) {
    const x = ML + i * colW;
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(metaItems[i].label, x, y);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(...CHARCOAL);
    doc.text(metaItems[i].value, x, y + 4);
  }
  y += 12;

  // Separator
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.3);
  doc.line(ML, y, PAGE_WIDTH - MR, y);
  y += 8;

  // ── Overall score ──
  const totalPct = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const sc = scoreColor(totalPct);
  const scBg = scoreBgColor(totalPct);

  // Score badge (rounded rectangle)
  const badgeW = 50;
  const badgeH = 18;
  const badgeX = (PAGE_WIDTH - badgeW) / 2;
  doc.setFillColor(...scBg);
  doc.roundedRect(badgeX, y, badgeW, badgeH, 4, 4, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...sc);
  doc.text(`${totalPct}%`, PAGE_WIDTH / 2, y + badgeH / 2 + 1, {
    align: 'center',
    baseline: 'middle',
  });
  y += badgeH + 3;

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text(`${correctCount} правильных из ${totalAnswered} заданий`, PAGE_WIDTH / 2, y, {
    align: 'center',
  });
  y += 10;

  return y;
}

/** Date string used by the footer; computed once and passed through. */
export function sessionDateStr(session: Session): string {
  return session.started_at
    ? new Date(session.started_at).toLocaleDateString('ru-RU')
    : '—';
}
