// Service worker: zapisuje pliki gry w pamięci przeglądarki, żeby gra z przeglądarki
// (także zainstalowana jako aplikacja) działała bez internetu.
// VERSION podmienia przy publikacji scripts/build-site.js (skrót zawartości wszystkich plików),
// więc każda zmiana gry to nowa wersja. Nowa wersja czeka, aż gracz stuknie „Odśwież”
// w pasku „Dostępna nowa wersja” albo uruchomi grę ponownie.
const VERSION = 'dev';
const CACHE = `swiatelka-${VERSION}`;
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'css/fonts.css',
  'src/main.js',
  'src/ui.js',
  'src/game.js',
  'src/board.js',
  'src/colors.js',
  'src/messages.js',
  'src/pwa.js',
  'icons/icon.svg',
  'icons/favicon-32.png',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'fonts/chakra-petch-latin-500-normal.woff2',
  'fonts/chakra-petch-latin-700-normal.woff2',
  'fonts/chakra-petch-latin-ext-500-normal.woff2',
  'fonts/chakra-petch-latin-ext-700-normal.woff2',
  'fonts/ibm-plex-sans-latin-400-normal.woff2',
  'fonts/ibm-plex-sans-latin-500-normal.woff2',
  'fonts/ibm-plex-sans-latin-ext-400-normal.woff2',
  'fonts/ibm-plex-sans-latin-ext-500-normal.woff2',
  'fonts/ibm-plex-mono-latin-500-normal.woff2',
  'fonts/ibm-plex-mono-latin-ext-500-normal.woff2',
];

self.addEventListener('install', event => {
  // cache: 'reload' omija pamięć HTTP, żeby nowa wersja nie zapisała starych plików.
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('swiatelka-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION') event.ports[0]?.postMessage(VERSION);
});

// Pliki tej wersji z pamięci (działa bez internetu); otwarcie strony pod innym adresem
// w zakresie gry dostaje zapamiętaną stronę główną.
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async cache => {
      const hit = await cache.match(request, { ignoreSearch: true });
      if (hit) return hit;
      if (request.mode === 'navigate') {
        const shell = await cache.match('./');
        if (shell) return shell;
      }
      return fetch(request);
    }),
  );
});
