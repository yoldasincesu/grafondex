// Network first for everything (always the newest app and scores); the last saved copy is used when offline.
const V = 'grafondex-v81';
const SHELL = ['./', 'index.html', 'i18n-tr.js', 'i18n-en.js', 'i18n-de.js', 'i18n-ru.js', 'i18n-ku.js', 'i18n-fr.js', 'i18n-es.js', 'i18n-pl.js', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'logo-g.png', 'logo.png', 'offline.html'];
// the sounds live in sounds/; one missing file must not stop the new version from installing
const SOUNDS = ['goal', 'whistle_start', 'whistle_ht', 'whistle_end', 'groan', 'red', 'var', 'ding'].map(n => 'sounds/' + n + '.mp3');

// club crests from our server: kept on the phone across app versions, shown at once, asked again only when missing
const IMG = 'grafondex-img';

self.addEventListener('install', e => {
  // 'reload' so a new version never installs files from the browser's HTTP cache
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))).then(() => Promise.all(SOUNDS.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {}))))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== V + '-api' && k !== IMG).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function networkFirst(req, cacheName, key = req, init) {
  return fetch(init ? req.url : req, init).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(cacheName).then(c => c.put(key, copy)); }
    return r;
  }).catch(() => caches.open(cacheName).then(c => c.match(key)).then(r => r || (req.mode === 'navigate' ? caches.match('offline.html') : undefined)));
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin === location.origin && url.pathname.includes('/logos/')) {
    // club crests inside the app: from the phone's store at once, asked for only the first time
    e.respondWith(caches.open(IMG).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (url.origin === location.origin) {
    // app files: always ask the server whether they changed (GitHub Pages would otherwise
    // serve a 10-minute-old copy from the browser cache); every page load is stored under one key
    e.respondWith(networkFirst(e.request, V, e.request.mode === 'navigate' ? './' : e.request, { cache: 'no-cache', credentials: 'same-origin' }));
  } else if (/\.workers\.dev$/.test(url.hostname) && url.pathname === '/logo') {
    e.respondWith(caches.open(IMG).then(c => c.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) { c.put(e.request, r.clone()); c.keys().then(ks => { if (ks.length > 1500) c.delete(ks[0]); }); } return r; }))));
  } else if (/^(site\.web\.api|site\.api|sports\.core\.api)\.espn\.com$/.test(url.hostname) || (/\.workers\.dev$/.test(url.hostname) && !e.request.headers.get('Authorization') && !/^\/api\/(dm|blocks|notifs|me)\b/.test(url.pathname))) {
    // scores, tables, squads and the server's public data: the last copy is kept for offline use
    e.respondWith(networkFirst(e.request, V + '-api'));
  }
});

// Web Push: the notification server (Cloudflare Worker) sends goals, cards, kick-off and full-time here
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch {}
  e.waitUntil(Promise.all([
    self.registration.showNotification(d.title || 'Grafondex', {
      // the club's crest as the picture; "open the match" and "mute this match" right on the notification
      body: d.body || '', icon: d.icon || 'icon-192.png', badge: 'icon-192.png', data: { url: d.url || './', mid: d.mid || '', w: d.w || '' },
      actions: d.acts && d.mid ? [{ action: 'open', title: d.acts[0] }, { action: 'mute', title: d.acts[1] }] : [],
      vibrate: ({ goal: [300, 100, 300, 100, 600], cancel: [600, 200, 200], miss: [600, 200, 200], red: [800, 150, 800], var: [100, 80, 100, 80, 100], start: [500], ht: [200, 150, 200], end: [200, 100, 200, 100, 700], remind: [150] })[d.kind] || [200, 100, 200], // each kind buzzes differently; the sound itself is the phone's own
      silent: false, renotify: true, tag: 'gx-' + (d.kind || '') + (d.title || '').slice(0, 20),
    }),
    // the app is open: tell it, so it can play its own ding / goal animation
    self.clients.matchAll({ type: 'window' }).then(cs => cs.forEach(c => c.postMessage({ type: 'push', kind: d.kind || '', title: d.title, body: d.body }))),
  ]));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const nd = e.notification.data || {};
  if (e.action === 'mute' && nd.mid && nd.w) { // no more notifications from this match on this phone
    e.waitUntil(self.registration.pushManager.getSubscription().then(sub => sub && fetch(nd.w + '/mute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint, mid: nd.mid }) })).catch(() => {}));
    return;
  }
  const url = nd.url || './';
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    const c = cs.find(w => 'focus' in w);
    if (!c) return clients.openWindow(url);
    return (url.includes('#') && c.navigate ? c.navigate(url).then(w => (w || c).focus()) : c.focus()).catch(() => c.focus()); // straight to the match
  }));
});
