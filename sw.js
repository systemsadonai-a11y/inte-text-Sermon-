// Service Worker para SermonWriter - Offline completo

const CACHE_NAME = 'sermonwriter-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Instalación: cachear recursos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cacheando recursos...');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación: limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones: servir desde cache o red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        // Si está en cache, devolverlo
        if (cached) {
          return cached;
        }

        // Si no, ir a la red
        return fetch(event.request)
          .then((response) => {
            // Guardar en cache para futuras visitas
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
            return response;
          })
          .catch(() => {
            // Si falla la red y no hay cache, mostrar página offline
            return caches.match('./index.html');
          });
      })
  );
});