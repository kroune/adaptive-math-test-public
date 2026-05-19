const SUPABASE_ORIGIN = 'https://lubmvwetwjtuphknzvnu.supabase.co';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(SUPABASE_ORIGIN)) return;

  const proxied = event.request.url.replace(
    SUPABASE_ORIGIN,
    self.location.origin + '/api/supabase',
  );

  event.respondWith(fetch(proxied, { headers: event.request.headers }));
});
