/** Количество заданий в каждой теме */
export const ITEMS_PER_TOPIC = 6;

/** Общее количество тем */
export const TOTAL_TOPICS = 5;

/** Длительность теста в минутах (фоллбэк если не удалось загрузить из БД). 0 = без ограничений */
export const DEFAULT_TEST_DURATION_MINUTES = 45;

/** Ключ для хранения сессии в localStorage */
export const SESSION_STORAGE_KEY = 'math-test-session';
