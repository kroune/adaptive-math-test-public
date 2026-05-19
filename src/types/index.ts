export interface Topic {
  id: string;
  name: string;
  order_index: number;
  icon_url: string | null;
}

/** A single answer option — can have text, an image, or both. */
export interface AnswerOption {
  text?: string;
  image_url?: string;
}

/**
 * What the child submitted as their answer.
 * - choice: picked one of the multiple-choice options
 * - text: typed a free-text response
 */
export type AnswerPayload =
  | { kind: 'choice'; index: number }
  | { kind: 'text'; text: string };

export interface Item {
  id: string;
  topic_id: string;
  image_url: string | null;
  text: string | null;
  description: string | null; // кастомное описание для админа (не видно ребёнку)
  /**
   * How the child answers this item.
   * 'choice'     — multiple-choice buttons (each option is an AnswerOption)
   * 'text_input' — the child types their answer; checked against correct_text
   */
  answer_type: 'choice' | 'text_input';
  options: AnswerOption[];     // used when answer_type === 'choice'
  correct_option: number | null; // index into options; null when answer_type === 'text_input'
  correct_text: string | null;   // used when answer_type === 'text_input'
  b: number;              // сложность в логитах (IRT)
  se: number;             // ошибка измерения (IRT)
  grade_min: number;      // минимальный класс (1-11)
  grade_max: number;      // максимальный класс (1-11)
}

export type MotivationTiming = 'before_test' | 'before_topic' | 'after_topic' | 'after_test';

export interface MotivationQuestion {
  id: string;
  text: string;
  options: string[];
  image_url: string | null;
  timing: MotivationTiming;
  topic_id: string | null;
  order_index: number;
}

export interface Session {
  id: string;
  name: string;
  surname: string;
  school: string;
  grade: string;
  mode: 'adaptive' | 'nonadaptive';
  started_at: string;
  finished_at: string | null;
  is_early_exit: boolean;
  is_force_terminated: boolean;
}

export interface ItemAnswer {
  id: string;
  session_id: string;
  item_id: string;
  topic_id: string;
  answer_given: number | null;       // index for 'choice'; null for 'text_input'
  text_answer_given: string | null;  // the typed text for 'text_input'; null for 'choice'
  is_correct: boolean;
  time_spent_ms: number;
  shown_at: string | null;
  answered_at: string | null;
}

export interface MotivationAnswer {
  id: string;
  session_id: string;
  question_id: string;
  answer_given: number;
  asked_before_topic_id: string | null;
  timing: string | null;
  shown_at: string | null;
  answered_at: string | null;
}

export interface LinearTestConfig {
  id: string;
  topic_id: string;
  item_id: string;
  topic_order: number;
  item_order: number;
}

/** Used by the MST algorithm */
export interface PreviousAnswer {
  itemId: string;
  b: number;
  se: number;
  isCorrect: boolean;
}

/** Session state persisted in localStorage */
export interface SessionState {
  sessionId: string;
  name: string;
  surname: string;
  school: string;
  grade: string;
  mode: 'adaptive' | 'nonadaptive';
  /** Topics the child has already completed (by id) */
  completedTopicIds: string[];
  /** Current topic being worked on */
  currentTopicId: string | null;
  /** Order of topics for nonadaptive mode */
  topicOrder: string[];
  /** Answers given in the current topic */
  currentTopicAnswers: PreviousAnswer[];
  /** Items already shown in the current topic (ids) */
  shownItemIds: string[];
  /** All answers across all topics (for results) */
  allAnswers: Array<ItemAnswer>;
  /** ISO timestamp when session started (for timer) */
  startedAt?: string;
  /** Timer duration in minutes (persisted so it survives page refresh) */
  testDurationMinutes?: number;
  /** Set to true when the admin force-terminates all active sessions */
  isForceTerminated?: boolean;
}
