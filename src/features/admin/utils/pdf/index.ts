import { jsPDF } from 'jspdf';
import { registerFonts } from '../fonts/registerFonts';
import type { Session, ItemAnswer, Item, Topic } from '../../../../types';
import { CHARCOAL, CORAL, ML, MT, PAGE_BOTTOM_Y, CONTENT_W } from './colors';
import { collectImageUrls, loadAllImages } from './imageLoader';
import { buildTopicStats, renderTopicTable } from './stats';
import { renderHeader, sessionDateStr } from './header';
import { renderCard } from './renderCard';
import { measureCard } from './measureCard';
import { addFooter } from './footer';

export async function generateSessionPdf(
  session: Session,
  answers: ItemAnswer[],
  itemMap: Map<string, Item>,
  topics: Topic[],
): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  registerFonts(doc);

  // Pre-load all images used in the detailed results section
  const imageUrls = collectImageUrls(answers, itemMap);
  const images = await loadAllImages(imageUrls);

  const correctCount = answers.filter((a) => a.is_correct).length;
  let y = renderHeader(doc, session, answers.length, correctCount);

  // ── Topic summary table ──
  const topicStats = buildTopicStats(answers, topics);
  y = renderTopicTable(doc, y, topicStats) + 10;

  // ── Detailed results (question cards) ──
  if (y > PAGE_BOTTOM_Y - 40) {
    doc.addPage();
    y = MT;
  }

  doc.setFillColor(...CORAL);
  doc.rect(ML, y - 1, 2.5, 7, 'F');
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...CHARCOAL);
  doc.text('Задания и ответы', ML + 6, y + 4);
  y += 12;

  for (const topic of topics) {
    const topicAnswers = answers.filter((a) => a.topic_id === topic.id);
    if (topicAnswers.length === 0) continue;

    // Topic sub-header (reserve a bit of space so it doesn't land alone at the bottom)
    if (y > PAGE_BOTTOM_Y - 50) {
      doc.addPage();
      y = MT;
    }

    doc.setFont('Roboto', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...CORAL);
    doc.text(topic.name, ML, y);
    y += 1;
    doc.setDrawColor(...CORAL);
    doc.setLineWidth(0.4);
    doc.line(ML, y, ML + doc.getTextWidth(topic.name), y);
    y += 5;

    for (let i = 0; i < topicAnswers.length; i++) {
      const answer = topicAnswers[i];
      const item = itemMap.get(answer.item_id);
      const cardH = measureCard(doc, item, images, answer);

      // Page-break if the card won't fit
      if (y + cardH > PAGE_BOTTOM_Y) {
        doc.addPage();
        y = MT;
      }

      y = renderCard(
        doc,
        ML,
        y,
        CONTENT_W,
        i + 1,
        topicAnswers.length,
        item,
        answer,
        images,
      );
      y += 5;
    }

    y += 3;
  }

  // ── Footer on all pages ──
  addFooter(doc, sessionDateStr(session));

  return doc;
}
