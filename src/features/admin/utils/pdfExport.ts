import type { Session, ItemAnswer, Item, Topic } from '../../../types';
import { generateSessionPdf } from './pdf';

function sanitize(s: string): string {
  return s.replace(/[<>:"/\\|?*]/g, '_');
}

export function sessionPdfFilename(session: Session): string {
  const idSuffix = session.id.slice(0, 6);
  return `${sanitize(session.surname)}_${sanitize(session.name)}_${sanitize(session.grade || 'x')}_${idSuffix}.pdf`;
}

export async function downloadPdfForSession(
  session: Session,
  answers: ItemAnswer[],
  itemMap: Map<string, Item>,
  topics: Topic[],
): Promise<void> {
  const doc = await generateSessionPdf(session, answers, itemMap, topics);
  doc.save(sessionPdfFilename(session));
}

export async function generatePdfBlob(
  session: Session,
  answers: ItemAnswer[],
  itemMap: Map<string, Item>,
  topics: Topic[],
): Promise<Blob> {
  const doc = await generateSessionPdf(session, answers, itemMap, topics);
  return doc.output('blob');
}
