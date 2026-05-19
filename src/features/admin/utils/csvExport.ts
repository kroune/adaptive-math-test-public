import type { Session, ItemAnswer, Item, Topic, LinearTestConfig, MotivationAnswer, MotivationQuestion } from '../../../types';

export interface CsvExportData {
  sessions: Session[];
  answers: ItemAnswer[];
  items: Item[];
  topics: Topic[];
  linearConfig: LinearTestConfig[];
  motivationAnswers: MotivationAnswer[];
  motivationQuestions: MotivationQuestion[];
}

export function csvEscape(val: string): string {
  let safe = val;
  if (/^[=+\-@\t\r]/.test(safe)) {
    safe = "'" + safe;
  }
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function itemLabel(item: Item): string {
  return item.description || item.id.slice(0, 8);
}

function groupAnswersBySession(answers: ItemAnswer[]): Map<string, ItemAnswer[]> {
  const map = new Map<string, ItemAnswer[]>();
  for (const a of answers) {
    const arr = map.get(a.session_id) ?? [];
    arr.push(a);
    map.set(a.session_id, arr);
  }
  return map;
}

function sessionMetaHeaders(): string[] {
  return [
    'session_id', 'name', 'surname', 'school', 'grade',
    'started_at', 'finished_at', 'is_early_exit', 'is_force_terminated',
  ];
}

function sessionMetaRow(s: Session): string[] {
  return [
    s.id,
    csvEscape(s.name),
    csvEscape(s.surname),
    csvEscape(s.school),
    s.grade ?? '',
    s.started_at ?? '',
    s.finished_at ?? '',
    s.is_early_exit ? '1' : '0',
    s.is_force_terminated ? '1' : '0',
  ];
}

function keyCells(item: Item | undefined): [string, string] {
  if (!item) return ['', ''];
  if (item.answer_type === 'text_input') {
    return [item.correct_text != null ? csvEscape(item.correct_text) : '', ''];
  }
  if (item.correct_option == null) return ['', ''];
  const optionText = item.options?.[item.correct_option]?.text;
  const keyText = optionText ? csvEscape(optionText) : String(item.correct_option);
  const keyIndex = String.fromCharCode(1040 + item.correct_option);
  return [keyText, keyIndex];
}

function answerCells(answer: ItemAnswer | undefined, item: Item | undefined): string[] {
  const [keyText, keyIndex] = keyCells(item);
  if (!answer) return ['', '', keyText, keyIndex, ''];
  const answerText = answer.text_answer_given != null
    ? csvEscape(answer.text_answer_given)
    : answer.answer_given != null
      ? (item?.options?.[answer.answer_given]?.text
          ? csvEscape(item.options[answer.answer_given].text!)
          : String(answer.answer_given))
      : '';
  return [
    answer.is_correct ? '1' : '0',
    answerText,
    keyText,
    keyIndex,
    String(answer.time_spent_ms ?? ''),
  ];
}

function itemHeaderCells(label: string): string[] {
  return [
    `${label}_correct`,
    `${label}_answer`,
    `${label}_key_text`,
    `${label}_key_index`,
    `${label}_time_ms`,
  ];
}

function groupMotivationBySession(answers: MotivationAnswer[]): Map<string, MotivationAnswer[]> {
  const map = new Map<string, MotivationAnswer[]>();
  for (const a of answers) {
    const arr = map.get(a.session_id) ?? [];
    arr.push(a);
    map.set(a.session_id, arr);
  }
  // Sort each session's answers by answered_at (fallback to shown_at)
  for (const arr of map.values()) {
    arr.sort((a, b) => {
      const ta = a.answered_at ?? a.shown_at ?? '';
      const tb = b.answered_at ?? b.shown_at ?? '';
      return ta.localeCompare(tb);
    });
  }
  return map;
}

function motivationHeaderCells(maxCount: number): string[] {
  const headers: string[] = [];
  for (let i = 1; i <= maxCount; i++) {
    headers.push(`psych_${i}_question`, `psych_${i}_answer`);
  }
  return headers;
}

function motivationCells(
  sessionId: string,
  motivationBySession: Map<string, MotivationAnswer[]>,
  mqMap: Map<string, MotivationQuestion>,
  maxCount: number,
): string[] {
  const cells: string[] = [];
  const ordered = motivationBySession.get(sessionId) ?? [];
  for (let i = 0; i < maxCount; i++) {
    const ma = ordered[i];
    if (!ma) {
      cells.push('', '');
      continue;
    }
    const q = mqMap.get(ma.question_id);
    const questionText = q?.text != null ? csvEscape(q.text) : '';
    const answerText = q?.options?.[ma.answer_given] != null
      ? csvEscape(q.options[ma.answer_given])
      : String(ma.answer_given);
    cells.push(questionText, answerText);
  }
  return cells;
}

export function buildLinearCsv(data: CsvExportData): string | null {
  const linearSessions = data.sessions.filter((s) => s.mode === 'nonadaptive');
  if (linearSessions.length === 0) return null;

  const itemMap = new Map(data.items.map((it) => [it.id, it]));
  const mqMap = new Map(data.motivationQuestions.map((q) => [q.id, q]));
  const answersBySession = groupAnswersBySession(data.answers);
  const motivationBySession = groupMotivationBySession(data.motivationAnswers);

  // Determine item columns from linear config order
  const orderedItemIds = data.linearConfig
    .sort((a, b) => a.topic_order - b.topic_order || a.item_order - b.item_order)
    .map((c) => c.item_id);

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const uniqueItemIds: string[] = [];
  for (const id of orderedItemIds) {
    if (!seen.has(id)) {
      seen.add(id);
      uniqueItemIds.push(id);
    }
  }

  // Max psych answers across this CSV's sessions (column count)
  let maxPsych = 0;
  for (const s of linearSessions) {
    const count = motivationBySession.get(s.id)?.length ?? 0;
    if (count > maxPsych) maxPsych = count;
  }

  // Build header
  const metaHeaders = sessionMetaHeaders();
  const itemHeaders: string[] = [];
  for (const id of uniqueItemIds) {
    const label = itemMap.has(id) ? itemLabel(itemMap.get(id)!) : id.slice(0, 8);
    itemHeaders.push(...itemHeaderCells(label));
  }
  const psychHeaders = motivationHeaderCells(maxPsych);
  const header = [...metaHeaders, ...itemHeaders, ...psychHeaders].join(',');

  // Build rows
  const rows: string[] = [];
  for (const s of linearSessions) {
    const sAnswers = answersBySession.get(s.id) ?? [];
    const answerByItem = new Map(sAnswers.map((a) => [a.item_id, a]));

    const meta = sessionMetaRow(s);
    const cells: string[] = [];
    for (const id of uniqueItemIds) {
      cells.push(...answerCells(answerByItem.get(id), itemMap.get(id)));
    }
    const psych = motivationCells(s.id, motivationBySession, mqMap, maxPsych);
    rows.push([...meta, ...cells, ...psych].join(','));
  }

  return [header, ...rows].join('\n');
}

export function buildAdaptiveCsv(data: CsvExportData): string | null {
  const adaptiveSessions = data.sessions.filter((s) => s.mode === 'adaptive');
  if (adaptiveSessions.length === 0) return null;

  const itemMap = new Map(data.items.map((it) => [it.id, it]));
  const topicMap = new Map(data.topics.map((t) => [t.id, t]));
  const mqMap = new Map(data.motivationQuestions.map((q) => [q.id, q]));
  const answersBySession = groupAnswersBySession(data.answers);
  const motivationBySession = groupMotivationBySession(data.motivationAnswers);

  // Gather all item IDs seen in adaptive sessions
  const adaptiveSessionIds = new Set(adaptiveSessions.map((s) => s.id));
  const adaptiveAnswers = data.answers.filter((a) => adaptiveSessionIds.has(a.session_id));
  const allItemIds = [...new Set(adaptiveAnswers.map((a) => a.item_id))];

  // Sort by topic order, then by item b-value for stable ordering
  allItemIds.sort((a, b) => {
    const itemA = itemMap.get(a);
    const itemB = itemMap.get(b);
    const topicA = itemA ? topicMap.get(itemA.topic_id) : undefined;
    const topicB = itemB ? topicMap.get(itemB.topic_id) : undefined;
    const orderA = topicA?.order_index ?? 999;
    const orderB = topicB?.order_index ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return (itemA?.b ?? 0) - (itemB?.b ?? 0);
  });

  // Max psych answers across this CSV's sessions (column count)
  let maxPsych = 0;
  for (const s of adaptiveSessions) {
    const count = motivationBySession.get(s.id)?.length ?? 0;
    if (count > maxPsych) maxPsych = count;
  }

  // Build header
  const metaHeaders = sessionMetaHeaders();
  const itemHeaders: string[] = [];
  for (const id of allItemIds) {
    const label = itemMap.has(id) ? itemLabel(itemMap.get(id)!) : id.slice(0, 8);
    itemHeaders.push(...itemHeaderCells(label));
  }
  const psychHeaders = motivationHeaderCells(maxPsych);
  const header = [...metaHeaders, ...itemHeaders, ...psychHeaders].join(',');

  // Build rows
  const rows: string[] = [];
  for (const s of adaptiveSessions) {
    const sAnswers = answersBySession.get(s.id) ?? [];
    const answerByItem = new Map(sAnswers.map((a) => [a.item_id, a]));

    const meta = sessionMetaRow(s);
    const cells: string[] = [];
    for (const id of allItemIds) {
      cells.push(...answerCells(answerByItem.get(id), itemMap.get(id)));
    }
    const psych = motivationCells(s.id, motivationBySession, mqMap, maxPsych);
    rows.push([...meta, ...cells, ...psych].join(','));
  }

  return [header, ...rows].join('\n');
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
