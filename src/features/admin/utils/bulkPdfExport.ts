import JSZip from 'jszip';
import type { Session, ItemAnswer, Item, Topic } from '../../../types';
import { generatePdfBlob, sessionPdfFilename } from './pdfExport';

export interface BulkExportProgress {
  current: number;
  total: number;
  currentName: string;
}

// MessageChannel yields faster than setTimeout(0) (which is throttled to ~4ms)
const channel = typeof MessageChannel !== 'undefined' ? new MessageChannel() : null;
function yieldToMain(): Promise<void> {
  if (channel) {
    return new Promise((resolve) => {
      channel.port1.onmessage = () => resolve();
      channel.port2.postMessage(null);
    });
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function buildBulkReportZip(
  sessions: Session[],
  answersBySession: Map<string, ItemAnswer[]>,
  itemMap: Map<string, Item>,
  topics: Topic[],
  onProgress?: (progress: BulkExportProgress) => void,
): Promise<Blob> {
  const zip = new JSZip();

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i];
    const answers = answersBySession.get(session.id) ?? [];

    onProgress?.({
      current: i + 1,
      total: sessions.length,
      currentName: `${session.name} ${session.surname}`,
    });

    const pdfBlob = await generatePdfBlob(session, answers, itemMap, topics);
    zip.file(sessionPdfFilename(session), pdfBlob);

    // Yield every iteration so the UI stays responsive
    await yieldToMain();
  }

  return zip.generateAsync({ type: 'blob' });
}
