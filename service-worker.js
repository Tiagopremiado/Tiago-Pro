const CACHE_NAME = 'tiago-aviator-pro-v2';
const DINAMIC_CACHE = 'tiago-aviator-dynamic-v2';

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  // Força o SW a assumir o controle imediatamente
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usa caminhos absolutos para garantir que funcione na raiz
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
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
  // Reivindica o controle dos clientes imediatamente
  self.clients.claim();
});

// Interceptação de requisições
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Estratégia de Fallback para Navegação (SPA)
  // Se for uma navegação (abrir o app) e falhar ou der 404, retorna o index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Para outros recursos (imagens, scripts), tenta cache primeiro, depois rede
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request).then((response) => {
        // Opcional: Cache dinâmico aqui se necessário
        return response;
      });
    })
  );
});