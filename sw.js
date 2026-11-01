/* SplitBook service worker: makes the installed app open instantly and work offline.
   Expenses themselves sync through Firestore, which keeps its own offline copy. */
const CACHE = 'splitbook-v2';
const SHELL = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];
const CDN = [
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    await Promise.all(CDN.map((url) => cache.add(new Request(url, { mode: 'no-cors' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function cacheable(url) {
  return url.origin === self.location.origin ||
    url.hostname === 'cdnjs.cloudflare.com' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Opening the app: try the network for the newest version, fall back to the saved copy offline.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  if (!cacheable(url)) return; // Firestore and everything else go straight to the network.

  // Scripts, fonts and icons: answer from the cache at once, refresh it in the background.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreVary: true });
    const network = fetch(req).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});
