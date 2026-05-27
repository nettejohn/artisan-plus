// ───────────────────────────────────────────────────────────────
// Artisan+ — Service Worker
// Stratégie :
//   • Navigation (HTML)  → Network-first, cache en fallback
//   • Assets statiques   → Cache-first, mise à jour en arrière-plan
//   • API cross-origin   → Pass-through (Supabase, etc.)
// ───────────────────────────────────────────────────────────────

const CACHE_VERSION = 'v1';
const CACHE_NAME = `artisan-plus-${CACHE_VERSION}`;

// Ressources à précacher lors de l'installation
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/favicon.svg',
];

// ── INSTALL ──────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()) // Active immédiatement sans attendre la fermeture de l'ancienne version
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keyList) =>
        Promise.all(
          keyList.map((key) => {
            // Supprime les caches obsolètes des versions précédentes
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        )
      )
      .then(() => self.clients.claim()) // Prend le contrôle des onglets ouverts
  );
});

// ── FETCH ─────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore les requêtes non-GET
  if (request.method !== 'GET') return;

  // Ignore les requêtes cross-origin (Supabase, CDN, etc.)
  if (url.origin !== self.location.origin) return;

  // Ignore les URLs de développement Vite (HMR, etc.)
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/node_modules')) return;

  // ── Navigation (page HTML) : Network-first ──────────────────────
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Mettre à jour le cache avec la réponse fraîche
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() =>
          // Hors ligne : servir depuis le cache ou la racine en fallback
          caches
            .match(request)
            .then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // ── Assets statiques (JS, CSS, images, fonts) : Cache-first ─────
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        // Mise à jour en arrière-plan (stale-while-revalidate)
        const networkUpdate = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
        // Servir depuis le cache immédiatement, ou attendre le réseau
        return cached || networkUpdate;
      })
    );
    return;
  }
});

// ── MESSAGE : permet au client de forcer une mise à jour ──────────
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── BACKGROUND SYNC ───────────────────────────────────────────────
// Notifie les onglets ouverts quand la connexion est rétablie
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) =>
          client.postMessage({ type: 'SYNC_DATA' })
        );
      })
    );
  }
});
