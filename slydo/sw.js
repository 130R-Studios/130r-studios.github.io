const CACHE_VERSION = 'slydo-v1';

const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== 'GET') {
    return; 
  }

  const isApi =
    url.hostname.endsWith('supabase.co') ||
    url.hostname.endsWith('supabase.in');

  if (isApi) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  if (/\.(png|ico|svg|webp)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      }))
    );
    return;
  }

  event.respondWith(
    fetch(req).then((res) => {
    
      if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req))
  );
});