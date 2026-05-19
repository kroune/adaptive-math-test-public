type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type Ctx = Record<string, unknown>;

const IS_DEV = import.meta.env.DEV;

const DEV_STYLES: Record<LogLevel, string> = {
  debug: 'color: #9ca3af; font-weight: bold',
  info:  'color: #3b82f6; font-weight: bold',
  warn:  'color: #f59e0b; font-weight: bold',
  error: 'color: #ef4444; font-weight: bold',
};

// Send info/warn/error to Vercel runtime logs in production (debug stays local only)
async function ship(level: LogLevel, message: string, ctx?: Ctx) {
  if (IS_DEV) return;
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        context: ctx,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }),
    });
  } catch {
    // Never let logging break the app
  }
}

function print(level: LogLevel, message: string, ctx?: Ctx) {
  const fn = level === 'debug' ? 'log' : level;
  if (IS_DEV) {
    if (ctx !== undefined) {
      console[fn](`%c[${level.toUpperCase()}] ${message}`, DEV_STYLES[level], ctx);
    } else {
      console[fn](`%c[${level.toUpperCase()}] ${message}`, DEV_STYLES[level]);
    }
  } else {
    const suffix = ctx !== undefined ? ` ${JSON.stringify(ctx)}` : '';
    console[fn](`[${level.toUpperCase()}] ${message}${suffix}`);
  }
}

export const logger = {
  debug(message: string, ctx?: Ctx) {
    print('debug', message, ctx);
  },

  info(message: string, ctx?: Ctx) {
    print('info', message, ctx);
    void ship('info', message, ctx);
  },

  warn(message: string, ctx?: Ctx) {
    print('warn', message, ctx);
    void ship('warn', message, ctx);
  },

  error(message: string, err?: unknown, ctx?: Ctx) {
    const merged: Ctx = { ...ctx };
    if (err instanceof Error) {
      merged.error = err.message;
      if (err.stack) merged.stack = err.stack;
    } else if (err !== null && typeof err === 'object') {
      try { merged.error = JSON.stringify(err); } catch { merged.error = String(err); }
    } else if (err !== undefined) {
      merged.error = String(err);
    }
    const finalCtx = Object.keys(merged).length > 0 ? merged : undefined;
    print('error', message, finalCtx);
    void ship('error', message, finalCtx);
  },
};
