import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ItemAnswer, Topic } from '../../../../types';
import {
  CHARCOAL,
  CORAL,
  CORAL_LIGHT,
  MINT,
  MINT_LIGHT,
  ROSE,
  ROSE_LIGHT,
  SUNSHINE,
  SUNSHINE_LIGHT,
  ML,
  MR,
  CONTENT_W,
} from './colors';

export interface TopicStat {
  name: string;
  correct: number;
  total: number;
  pct: number;
  avgTimeSec: number;
}

export function buildTopicStats(answers: ItemAnswer[], topics: Topic[]): TopicStat[] {
  return topics
    .map((topic) => {
      const ta = answers.filter((a) => a.topic_id === topic.id);
      const correct = ta.filter((a) => a.is_correct).length;
      const total = ta.length;
      const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
      const avgTimeSec =
        total > 0 ? ta.reduce((s, a) => s + a.time_spent_ms, 0) / total / 1000 : 0;
      return { name: topic.name, correct, total, pct, avgTimeSec };
    })
    .filter((s) => s.total > 0);
}

export function scoreColor(pct: number): [number, number, number] {
  if (pct >= 70) return MINT;
  if (pct >= 40) return SUNSHINE;
  return ROSE;
}

export function scoreBgColor(pct: number): [number, number, number] {
  if (pct >= 70) return MINT_LIGHT;
  if (pct >= 40) return SUNSHINE_LIGHT;
  return ROSE_LIGHT;
}

/** Render the topic-summary table at the given y; returns y after the table. */
export function renderTopicTable(
  doc: jsPDF,
  y: number,
  topicStats: TopicStat[],
): number {
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...CHARCOAL);
  doc.text('Сводка по темам', ML, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [['Тема', 'Результат', '%', 'Ср. время', 'Прогресс']],
    body: topicStats.map((s) => [
      s.name,
      `${s.correct} / ${s.total}`,
      `${s.pct}%`,
      `${s.avgTimeSec.toFixed(1)}с`,
      '',
    ]),
    styles: {
      font: 'Roboto',
      fontSize: 9,
      cellPadding: 3.5,
      textColor: CHARCOAL,
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: CORAL_LIGHT,
      textColor: CORAL,
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [252, 250, 247] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'center', cellWidth: 25 },
      4: { cellWidth: CONTENT_W - 50 - 25 - 18 - 25 },
    },
    margin: { left: ML, right: MR },
    didDrawCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 4) return;
      const stat = topicStats[data.row.index];
      if (!stat) return;
      const cell = data.cell;
      const barX = cell.x + 2;
      const barY = cell.y + cell.height / 2 - 2.5;
      const barW = cell.width - 4;
      const barH = 5;
      // Background track
      doc.setFillColor(235, 235, 235);
      doc.roundedRect(barX, barY, barW, barH, 1.5, 1.5, 'F');
      // Filled portion
      const fillW = (barW * stat.pct) / 100;
      if (fillW > 0) {
        doc.setFillColor(...scoreColor(stat.pct));
        doc.roundedRect(barX, barY, Math.max(fillW, 3), barH, 1.5, 1.5, 'F');
      }
    },
  });

  return doc.lastAutoTable.finalY;
}
