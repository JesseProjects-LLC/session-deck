// Service worker for Session Deck PWA
// Minimal — enables install prompt without aggressive caching.
// Terminal content is live via WebSocket, so offline mode isn't meaningful.

const CACHE_NAME = 'session-deck-shell-v1';

// Cache only the app shell (HTML, CSS, JS, icons) — not API or WS traffic
const SHELL_URLS = [
  '/',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean old caches
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept WebSocket upgrades, API calls, or auth routes
  if (
    event.request.url.includes('/ws/') ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/auth/') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Network-first for HTML (always get fresh app), cache fallback for assets
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
      return cached || fetched;
    })
  );
});
