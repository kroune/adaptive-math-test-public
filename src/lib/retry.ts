import { logger } from './logger';

export interface RetryOptions {
  attempts?: number;
  delayMs?: number;
  label?: string;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const { attempts = 3, delayMs = 1000, label = 'request' } = opts;

  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        const wait = delayMs * 2 ** i;
        logger.warn(`${label}: attempt ${i + 1}/${attempts} failed, retrying in ${wait}ms`);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
  throw lastError;
}
