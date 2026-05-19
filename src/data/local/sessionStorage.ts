import { logger } from '../../lib/logger';
import type { SessionState } from '../../types';
import { SESSION_STORAGE_KEY } from '../../config';

const PRE_SESSION_KEY = 'math-test-pre-session';

// --- Session state (test in progress) ---

export function loadSession(): SessionState | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as SessionState;
    logger.debug('Session restored from localStorage', {
      sessionId: state.sessionId,
      mode: state.mode,
      completedTopics: state.completedTopicIds.length,
    });
    return state;
  } catch (err) {
    logger.warn('Failed to restore session from localStorage', { error: String(err) });
    return null;
  }
}

export function saveSession(state: SessionState): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    logger.warn('Failed to persist session to localStorage', { error: String(err) });
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (err) {
    logger.warn('Failed to clear session from localStorage', { error: String(err) });
  }
}

// --- Pre-session data (collected before mode selection) ---

export interface PreSessionData {
  name: string;
  surname: string;
  school: string;
  grade: string;
}

export function loadPreSession(): PreSessionData | null {
  try {
    const raw = localStorage.getItem(PRE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as PreSessionData) : null;
  } catch {
    return null;
  }
}

export function savePreSession(data: PreSessionData): void {
  try {
    localStorage.setItem(PRE_SESSION_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function clearPreSession(): void {
  try {
    localStorage.removeItem(PRE_SESSION_KEY);
  } catch { /* ignore */ }
}
