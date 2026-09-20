// Bei Änderungen an App-Dateien diese Version erhöhen.
const CACHE_PREFIX = `silbenapp:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}v15`;
const APP_FILES = [
    './index.html', './style.css', './app.js', './manifest.webmanifest',
    './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];
const appURL = new URL('./index.html', self.registration.scope).href;
const assetURLs = new Set(APP_FILES.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
    // Nicht versehentlich alte Dateien aus dem HTTP-Cache in den neuen Cache kopieren.
    const requests = APP_FILES.map(path => new Request(
        new URL(path, self.registration.scope), { cache: 'reload' }
    ));
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(requests)));
    // Kein skipWaiting: laufende Runden behalten ihre bisherige App-Version.
});

self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(
        keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map(key => caches.delete(key))
    )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== self.location.origin) return;
    const isAppPage = request.mode === 'navigate' &&
        (url.pathname === new URL(appURL).pathname ||
         url.pathname === new URL(self.registration.scope).pathname);
    if (!isAppPage && !assetURLs.has(url.href)) return;

    event.respondWith(caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(isAppPage ? appURL : request);
        return cached || fetch(request);
    }));
});

// Nur nach ausdrücklichem Antippen des Update-Buttons aktivieren.
self.addEventListener('message', event => {
    if (event.data?.type === 'ACTIVATE_UPDATE') {
        event.waitUntil(self.skipWaiting());
    }
});
