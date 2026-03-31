// Service worker for Session Deck PWA
// Network-first for everything — the server is on the LAN, always reachable.
// Cache exists only as offline fallback (e.g. brief server restart).
// Terminal content is live via WebSocket, so offline mode isn't meaningful.

const CACHE_NAME = 'session-deck-v2';

self.addEventListener('install', (event) => {
  // Take over immediately — don't wait for old tabs to close
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Claim all clients immediately so the new SW controls existing tabs/PWA windows
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean all old caches
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      ),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Never intercept WebSocket upgrades, API calls, or auth routes
  if (
    event.request.url.includes('/ws/') ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/auth/') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Network-first for everything. Cache the response for offline fallback.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for offline fallback
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — try cache, then show a minimal offline message for navigations
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return new Response(
              '<html><body style="background:#0b0e11;color:#c5cdd9;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2>Session Deck</h2><p>Server unreachable — waiting for reconnect...</p></div></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
          return new Response('', { status: 503 });
        });
      })
  );
});

// Listen for messages from the app to force update
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
