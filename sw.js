// Offline cache for Eve's Café. Pages + JSON: network-first (new builds show up). Other static assets: cache-first.
// CACHE gets a unique suffix per build (vite.config.ts stamps the build id) so old caches are dropped.
const CACHE = 'eve-cafe-mw9s02jq';
const CORE = ['./', './index.html', './manifest.webmanifest', './assets/eve/manifest.json', './assets/eve/barista.webp', './assets/eve/barista_face.webp', './icons/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const fresh = (req) => (req.mode === 'navigate' ? fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(req));
const networkFirst = (req) => fresh(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return r; })
  .catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
self.addEventListener('fetch', (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('/version.json')) return; // update check: always network
  if (req.headers.has('range')) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('.json')) { e.respondWith(networkFirst(req)); return; }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
    return r;
  })));
});
