import { createClient } from '@supabase/supabase-js';

// In production, route all Supabase traffic through the Vercel proxy so school
// firewalls that block *.supabase.co don't affect the app.
const supabaseUrl: string = import.meta.env.PROD
  ? `${window.location.origin}/api/supabase`
  : (import.meta.env.VITE_SUPABASE_URL as string);

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}
if (!import.meta.env.PROD && !import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

let _sessionId: string | null = null;

export function setSupabaseSessionId(sessionId: string | null) {
  _sessionId = sessionId;
}

// Used by the fetch interceptor to turn absolute Supabase storage URLs
// (stored in the DB) into relative /storage/… paths that both the Vite
// dev-proxy and the Vercel rewrite can handle.
const RAW_SUPABASE_ORIGIN = (import.meta.env.VITE_SUPABASE_URL as string)?.replace(/\/$/, '') ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, init) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45_000);
      const headers = new Headers(init?.headers);
      if (_sessionId) {
        headers.set('x-session-id', _sessionId);
      }
      const response = await fetch(url, { ...init, signal: controller.signal, headers }).finally(
        () => clearTimeout(timeout),
      );
      const ct = response.headers.get('content-type');
      if (RAW_SUPABASE_ORIGIN && ct?.includes('application/json')) {
        const storagePrefix = `${RAW_SUPABASE_ORIGIN}/storage/`;
        const text = await response.clone().text();
        if (text.includes(storagePrefix)) {
          const rewritten = text.replaceAll(storagePrefix, '/storage/');
          return new Response(rewritten, { status: response.status, headers: response.headers });
        }
      }
      return response;
    },
  },
});
