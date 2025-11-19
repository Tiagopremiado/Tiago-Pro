const CACHE_NAME = 'tiago-aviator-pro-v1';
const DINAMIC_CACHE = 'tiago-aviator-dynamic-v1';

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json'
      ]);
    })
  );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DINAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptação de requisições (Estratégia: Network First, Fallback to Cache)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // Se a resposta for válida, clona e guarda no cache dinâmico
        if (res && res.status === 200 && res.type === 'basic') { // Basic type check to avoid caching opaque responses blindly if not needed
             // Opcional: Cachear recursos externos se necessário
        }
        return res;
      })
      .catch(() => {
        // Se falhar (offline), tenta pegar do cache
        return caches.match(event.request);
      })
  );
});