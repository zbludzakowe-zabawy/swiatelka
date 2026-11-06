// Service worker: zapisuje pliki gry w pamięci przeglądarki, żeby wersja z przeglądarki
// (także „zainstalowana” jako aplikacja) działała bez internetu.
// Po zmianie któregoś pliku zwiększ numer wersji, by gracze dostali nowe pliki.
const CACHE = 'swiatelka-v3';
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
  'src/install.js',
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
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Najpierw sieć (świeże pliki), a bez internetu — kopia z pamięci.
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(request, copy)); }
        return res;
      })
      .catch(() => caches.match(request, { ignoreSearch: true })),
  );
});
