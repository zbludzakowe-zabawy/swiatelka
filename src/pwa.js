// Gra jako aplikacja z przeglądarki (PWA): propozycja instalacji i pasek „Dostępna nowa wersja”.
// Android / Chrome / Edge — przycisk „Zainstaluj” (okno instalacji przeglądarki),
// iPhone / iPad (Safari) — instrukcja „Udostępnij → Do ekranu początkowego”
// (Safari nie pozwala pokazać okna instalacji).
// Logika decyzji to czyste funkcje (testy w tests/pwa.test.js), setup* podpinają je do strony.

export const DISMISS_KEY = 'swiatelka-install-dismissed';
export const SNOOZE_DAYS = 7;
export const UPDATE_CHECK_MS = 60 * 60 * 1000;

/** Czy gra działa w zainstalowanej aplikacji (komputer albo ikona na ekranie telefonu). */
export function isApp(win = globalThis) {
  const loc = win.location;
  if (loc && !String(loc.protocol).startsWith('http')) return true;          // Electron: app://
  if (win.navigator?.standalone) return true;                                 // iPhone: z ekranu początkowego
  return Boolean(win.matchMedia?.('(display-mode: standalone)').matches);     // zainstalowana strona
}

/** iPhone / iPad. iPadOS przedstawia się jak Mac, ale ma ekran dotykowy. */
export function isIos(ua, touchPoints = 0) {
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1);
}

/**
 * Co zaproponować: 'prompt' (przycisk „Zainstaluj”), 'ios' (instrukcja) albo null (nic).
 * @param {{ua: string, touchPoints?: number, app?: boolean, hasPrompt?: boolean,
 *          dismissedAt?: number|null, now?: number}} o
 */
export function installOffer({ ua, touchPoints = 0, app = false, hasPrompt = false,
  dismissedAt = null, now = Date.now() }) {
  if (app) return null;
  if (dismissedAt && now - dismissedAt < SNOOZE_DAYS * 864e5) return null;
  if (hasPrompt) return 'prompt';
  // Inne przeglądarki na iPhonie (Chrome, Firefox, Edge) nie dodają pewnie do ekranu — tylko Safari.
  if (isIos(ua, touchPoints) && !/CriOS|FxiOS|EdgiOS/.test(ua)) return 'ios';
  return null;
}

/**
 * Wywołuje onUpdate(worker), gdy nowy service worker jest zainstalowany i czeka,
 * a stroną steruje starszy (czyli prawdziwa aktualizacja, nie pierwsza instalacja).
 */
export function watchForUpdates(reg, hasController, onUpdate) {
  if (reg.waiting && hasController()) onUpdate(reg.waiting);
  reg.addEventListener('updatefound', () => {
    const w = reg.installing;
    if (!w) return;
    w.addEventListener('statechange', () => {
      if (w.state === 'installed' && hasController()) onUpdate(w);
    });
  });
}

function readDismissed(storage) {
  try { return Number(storage?.getItem(DISMISS_KEY)) || null; } catch { return null; }
}
function writeDismissed(storage, now) {
  try { storage?.setItem(DISMISS_KEY, String(now)); } catch { /* np. tryb prywatny */ }
}

function showBar(doc, bar, show) {
  bar.hidden = !show;
  const any = ['install', 'update'].some(id => doc.getElementById(id)?.hidden === false);
  doc.body?.classList.toggle('has-install', any);
}

/**
 * Pasek z propozycją instalacji. Pokazuje się od razu na iPhonie, a w Chrome/Edge
 * dopiero, gdy przeglądarka zgłosi, że grę można zainstalować (beforeinstallprompt).
 * Zwraca funkcję podającą aktualny rodzaj propozycji ('prompt' | 'ios' | null).
 */
export function setupInstall(doc = document, win = globalThis) {
  const $ = id => doc.getElementById(id);
  const bar = $('install');
  if (!bar) return () => null;
  let storage = null;
  try { storage = win.localStorage; } catch { /* brak dostępu */ }
  let deferred = null;   // zdarzenie beforeinstallprompt — okno instalacji można pokazać raz
  let kind = null;

  const get = $('install-get'), ios = $('install-ios'), desc = $('install-desc');
  const refresh = () => {
    kind = installOffer({
      ua: win.navigator?.userAgent || '',
      touchPoints: win.navigator?.maxTouchPoints || 0,
      app: isApp(win),
      hasPrompt: Boolean(deferred),
      dismissedAt: readDismissed(storage),
      now: Date.now(),
    });
    get.hidden = kind !== 'prompt';
    ios.hidden = kind !== 'ios';
    desc.hidden = kind === 'ios';
    showBar(doc, bar, Boolean(kind) && $('update')?.hidden !== false);
  };

  win.addEventListener?.('beforeinstallprompt', e => {
    e.preventDefault();      // zamiast małej ikonki przeglądarki pokazujemy własny pasek
    deferred = e;
    refresh();
  });
  win.addEventListener?.('appinstalled', () => {
    deferred = null;
    showBar(doc, bar, false);
  });
  get.addEventListener('click', async () => {
    const e = deferred;
    if (!e) return;
    deferred = null;
    showBar(doc, bar, false);
    await e.prompt();
    await e.userChoice?.catch(() => undefined);
  });
  $('install-close').addEventListener('click', () => {
    writeDismissed(storage, Date.now());
    showBar(doc, bar, false);
  });
  refresh();
  return () => kind;
}

/**
 * Service worker: gra działa bez internetu. Nowa wersja czeka, aż gracz stuknie „Odśwież”
 * (żadnych niespodziewanych przeładowań w trakcie gry); bez tego włączy się sama
 * przy następnym uruchomieniu gry.
 */
export function setupUpdates(doc = document, win = globalThis) {
  const sw = win.navigator?.serviceWorker;
  if (!sw) return Promise.resolve(null);
  const $ = id => doc.getElementById(id);
  const bar = $('update');
  let waiting = null, reloading = false;

  sw.addEventListener('controllerchange', () => {
    if (waiting && !reloading) { reloading = true; win.location.reload(); }
  });
  $('update-now')?.addEventListener('click', () => {
    showBar(doc, bar, false);
    waiting?.postMessage({ type: 'SKIP_WAITING' });
  });
  $('update-later')?.addEventListener('click', () => showBar(doc, bar, false));

  return sw.register('sw.js').then(reg => {
    watchForUpdates(reg, () => Boolean(sw.controller), w => {
      waiting = w;
      if (!bar) return;
      const install = $('install');
      if (install) install.hidden = true;   // jeden pasek naraz
      showBar(doc, bar, true);
    });
    // Szukaj nowej wersji po powrocie do gry i co godzinę.
    const check = () => reg.update().catch(() => undefined);
    doc.addEventListener?.('visibilitychange', () => { if (doc.visibilityState === 'visible') check(); });
    win.setInterval?.(check, UPDATE_CHECK_MS);
    return reg;
  }).catch(() => null);
}
