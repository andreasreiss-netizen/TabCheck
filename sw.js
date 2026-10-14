// Service Worker: macht die App offlinefähig.
// Bei Änderungen an der App die Versionsnummer erhöhen (v1 -> v2 ...).
const CACHE = 'bestellcheck-v1';
const ASSETS = ['./', 'index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst Netz (max. 3 s, damit immer die neueste Version geladen wird), sonst Zwischenspeicher
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    Promise.race([
      fetch(req),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000))
    ]).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() =>
      caches.match(req).then(r => r || caches.match('index.html'))
    )
  );
});
