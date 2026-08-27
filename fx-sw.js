// Service worker for the Currency Converter web app (fx.html).
// Scope is limited to /fx.html so the rest of the site is untouched.

const CACHE_NAME = 'fx-app-v1';
const APP_SHELL = [
    '/fx.html',
    '/fx.webmanifest',
    '/fx-icon-192.png',
    '/fx-icon-512.png',
    '/fx-apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Never interfere with the exchange rate API or any other cross-origin call.
    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
        return;
    }

    // Network first so a deployed update is picked up, cache as offline fallback.
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response && response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                }
                return response;
            })
            .catch(() => caches.match(request).then(cached => cached || caches.match('/fx.html')))
    );
});
