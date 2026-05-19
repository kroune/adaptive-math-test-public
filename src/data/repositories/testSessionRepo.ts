// Composes remote session API + local session storage
// Single import point for test-flow hooks

export {
  createSession,
  finishSession,
  abandonSession,
  insertItemAnswer,
  insertMotivationAnswer,
} from '../remote/sessionsApi';
export type { CreateSessionPayload, InsertMotivationAnswerPayload } from '../remote/sessionsApi';

export {
  loadSession,
  saveSession,
  clearSession,
  loadPreSession,
  savePreSession,
  clearPreSession,
} from '../local/sessionStorage';
export type { PreSessionData } from '../local/sessionStorage';
