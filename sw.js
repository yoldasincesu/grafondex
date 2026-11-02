// Network first for everything (always the newest app and scores); the last saved copy is used when offline.
const V = 'grafondex-v9';
const SHELL = ['./', 'index.html', 'i18n.js', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'logo-g.png', 'logo.png'];

self.addEventListener('install', e => {
  // 'reload' so a new version never installs files from the browser's HTTP cache
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== V + '-api').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function networkFirst(req, cacheName, key = req, init) {
  return fetch(init ? req.url : req, init).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(cacheName).then(c => c.put(key, copy)); }
    return r;
  }).catch(() => caches.open(cacheName).then(c => c.match(key)));
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin === location.origin) {
    // app files: always ask the server whether they changed (GitHub Pages would otherwise
    // serve a 10-minute-old copy from the browser cache); every page load is stored under one key
    e.respondWith(networkFirst(e.request, V, e.request.mode === 'navigate' ? './' : e.request, { cache: 'no-cache', credentials: 'same-origin' }));
  } else if (url.hostname === 'site.web.api.espn.com' || url.hostname === 'sports.core.api.espn.com') {
    e.respondWith(networkFirst(e.request, V + '-api'));
  }
});
