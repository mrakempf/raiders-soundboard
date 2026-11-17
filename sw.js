// Build: e9828aae27 (written by tools/build-raiders.js)
// Offline support. App files live in a cache named for the build version; clips and songs live in
// one media cache that the page fills (with a progress count) and that survives app updates.
importScripts('precache.js');
const SHELL_CACHE = 'raiders-shell-' + self.VERSION;
const MEDIA_CACHE = 'raiders-media';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(self.SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('raiders-shell-') && k !== SHELL_CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Cache first, so nothing waits on the gym wifi. Anything not cached falls through to the network.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const page = await caches.match('index.html');
      try { return await fetch(req); } catch { if (page) return page; throw new Error('offline'); }
    }
    return fetch(req);
  })());
});
