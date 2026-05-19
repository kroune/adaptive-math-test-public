import type { IncomingMessage, ServerResponse } from 'node:http';

interface LogEntry {
  level?: string;
  message?: string;
  context?: Record<string, unknown>;
  timestamp?: string;
  url?: string;
}

export default function handler(
  req: IncomingMessage & { body?: LogEntry },
  res: ServerResponse,
) {
  if (req.method !== 'POST') {
    res.writeHead(405).end();
    return;
  }

  const {
    level = 'error',
    message = '(no message)',
    context,
    timestamp,
    url,
  } = req.body ?? {};

  const parts = [
    `[CLIENT:${level.toUpperCase()}]`,
    timestamp ?? new Date().toISOString(),
    message,
  ];
  if (url) parts.push(`@ ${url}`);
  if (context) parts.push(JSON.stringify(context));

  const line = parts.join(' | ');

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);

  res.writeHead(200, { 'Content-Type': 'application/json' }).end(
    JSON.stringify({ ok: true }),
  );
}
