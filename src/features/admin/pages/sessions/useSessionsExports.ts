import { useState } from 'react';
import {
  fetchAllItemAnswersFull,
  fetchAllMotivationAnswers,
} from '../../../../data/remote/adminSessionsApi';
import { fetchTopics } from '../../../../data/repositories/topicsRepo';
import { fetchAllItems } from '../../../../data/repositories/itemsRepo';
import { fetchMotivationQuestions } from '../../../../data/repositories/motivationRepo';
import { fetchLinearTestConfig } from '../../../../data/remote/linearConfigApi';
import { buildLinearCsv, buildAdaptiveCsv, downloadCsv } from '../../utils/csvExport';
import { buildBulkReportZip } from '../../utils/bulkPdfExport';
import { buildItemConditionsMd, downloadMd } from '../../utils/itemConditionsMd';
import { logger } from '../../../../lib/logger';
import type { Session, ItemAnswer } from '../../../../types';

export interface BulkProgress {
  current: number;
  total: number;
}

export interface UseSessionsExportsResult {
  exportCsv: (filteredSessions: Session[]) => Promise<void>;
  exportBulkZip: (filteredSessions: Session[]) => Promise<void>;
  exportLinearConditionsMd: () => Promise<void>;
  bulkProgress: BulkProgress | null;
}

export function useSessionsExports(): UseSessionsExportsResult {
  const [bulkProgress, setBulkProgress] = useState<BulkProgress | null>(null);

  const exportCsv = async (filteredSessions: Session[]) => {
    logger.info('CSV export started');

    try {
      const [allAnswers, allMotivation, allTopics, allItems, allMq, linearConfig] =
        await Promise.all([
          fetchAllItemAnswersFull(),
          fetchAllMotivationAnswers(),
          fetchTopics(),
          fetchAllItems(),
          fetchMotivationQuestions(),
          fetchLinearTestConfig(),
        ]);

      const date = new Date().toISOString().slice(0, 10);
      const exportData = {
        sessions: filteredSessions,
        answers: allAnswers,
        items: allItems,
        topics: allTopics,
        linearConfig,
        motivationAnswers: allMotivation,
        motivationQuestions: allMq,
      };

      const linearCsv = buildLinearCsv(exportData);
      const adaptiveCsv = buildAdaptiveCsv(exportData);

      if (linearCsv) downloadCsv(linearCsv, `linear_results_${date}.csv`);
      if (adaptiveCsv) {
        if (linearCsv) {
          // Brief delay so the browser doesn't suppress the second download as
          // a popup.
          await new Promise((r) => setTimeout(r, 500));
        }
        downloadCsv(adaptiveCsv, `adaptive_results_${date}.csv`);
      }
      if (!linearCsv && !adaptiveCsv) logger.warn('No sessions to export');

      logger.info('CSV export complete', { sessions: filteredSessions.length });
    } catch {
      // Errors already logged by DAL
    }
  };

  const exportBulkZip = async (filteredSessions: Session[]) => {
    logger.info('Bulk ZIP export started');
    try {
      const [allAnswers, allTopics, allItems] = await Promise.all([
        fetchAllItemAnswersFull(),
        fetchTopics(),
        fetchAllItems(),
      ]);

      const answersBySession = new Map<string, ItemAnswer[]>();
      for (const a of allAnswers) {
        const arr = answersBySession.get(a.session_id) ?? [];
        arr.push(a);
        answersBySession.set(a.session_id, arr);
      }

      const itemMap = new Map(allItems.map((it) => [it.id, it]));
      const blob = await buildBulkReportZip(
        filteredSessions,
        answersBySession,
        itemMap,
        allTopics,
        (p) => setBulkProgress({ current: p.current, total: p.total }),
      );

      setBulkProgress(null);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports_${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      logger.info('Bulk ZIP export complete', { sessions: filteredSessions.length });
    } catch (err) {
      setBulkProgress(null);
      logger.error('Bulk ZIP export failed', err);
    }
  };

  const exportLinearConditionsMd = async () => {
    try {
      const [allItems, allTopics, linearConfig] = await Promise.all([
        fetchAllItems(),
        fetchTopics(),
        fetchLinearTestConfig(),
      ]);
      const md = buildItemConditionsMd({ items: allItems, topics: allTopics, linearConfig });
      downloadMd(md, `linear_conditions_${new Date().toISOString().slice(0, 10)}.md`);
    } catch (err) {
      logger.error('MD export failed', err);
    }
  };

  return {
    exportCsv,
    exportBulkZip,
    exportLinearConditionsMd,
    bulkProgress,
  };
}
