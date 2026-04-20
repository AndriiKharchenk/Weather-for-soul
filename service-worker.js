const CACHE_NAME = 'weather-for-soul-v2.4'; // повысил версию — старый кеш удалится
const STATIC_URLS = ['/', '/index.html', '/css/reset.css', '/css/style.css', '/css/media.css', '/js/app.js', '/js/api.js', '/js/ui.js', '/js/tips.js'];
// config.js убран — он больше не нужен

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_URLS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) return caches.delete(name);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API запросы — только сеть, кеш только если офлайн
  if (url.hostname.includes('open-meteo.com') || url.hostname.includes('openstreetmap.org') || url.hostname.includes('nominatim.openstreetmap.org')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  // Статика — сначала сеть, кеш как запасной
  // Так телефон всегда получает свежий код
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
