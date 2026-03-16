const CACHE_NAME = 'weather-for-soul-v1.1';
const urlsToCache = ['/', '/index.html', '/css/reset.css', '/css/style.css', '/css/media.css', '/js/app.js', '/js/api.js', '/js/ui.js', '/js/tips.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
