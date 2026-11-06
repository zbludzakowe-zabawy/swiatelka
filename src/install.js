// Propozycja instalacji aplikacji, gdy grę otwarto w przeglądarce na telefonie:
// Android — przycisk pobrania aplikacji (APK), iPhone/iPad — instrukcja „Do ekranu początkowego”
// (Safari nie pozwala instalować aplikacji z plików ani pokazać okna instalacji).

export const APK_URL =
  'https://github.com/zbludzakowe-zabawy/swiatelka/releases/latest/download/Swiatelka-android.apk';
export const DISMISS_KEY = 'swiatelka-install-dismissed';
export const SNOOZE_DAYS = 7;

/** Czy gra działa w zainstalowanej aplikacji (komputer, Android albo ikona na ekranie). */
export function isApp(win = globalThis) {
  const loc = win.location;
  if (loc && !String(loc.protocol).startsWith('http')) return true;          // Electron: app://
  if (win.Capacitor?.isNativePlatform?.()) return true;                       // aplikacja na Androida
  if (win.navigator?.standalone) return true;                                 // iPhone: z ekranu początkowego
  return Boolean(win.matchMedia?.('(display-mode: standalone)').matches);     // zainstalowana strona
}

/**
 * Co zaproponować: 'android', 'ios' albo null (nic).
 * @param {{ua: string, touchPoints?: number, app?: boolean, dismissedAt?: number|null, now?: number}} o
 */
export function installOffer({ ua, touchPoints = 0, app = false, dismissedAt = null, now = Date.now() }) {
  if (app) return null;
  if (dismissedAt && now - dismissedAt < SNOOZE_DAYS * 864e5) return null;
  if (/Android/i.test(ua)) return 'android';
  // iPadOS przedstawia się jak Mac, ale ma ekran dotykowy.
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)) return 'ios';
  return null;
}

function readDismissed(storage) {
  try { return Number(storage?.getItem(DISMISS_KEY)) || null; } catch { return null; }
}
function writeDismissed(storage, now) {
  try { storage?.setItem(DISMISS_KEY, String(now)); } catch { /* np. tryb prywatny */ }
}

/** Pokazuje pasek z propozycją (jeśli trzeba). Zwraca rodzaj propozycji albo null. */
export function setupInstall(doc = document, win = globalThis) {
  const $ = id => doc.getElementById(id);
  const bar = $('install');
  if (!bar) return null;
  let storage = null;
  try { storage = win.localStorage; } catch { /* brak dostępu */ }

  const kind = installOffer({
    ua: win.navigator?.userAgent || '',
    touchPoints: win.navigator?.maxTouchPoints || 0,
    app: isApp(win),
    dismissedAt: readDismissed(storage),
    now: Date.now(),
  });
  if (!kind) return null;

  const get = $('install-get'), desc = $('install-desc'), ios = $('install-ios');
  if (kind === 'android') {
    get.setAttribute('href', APK_URL);
    get.hidden = false;
    ios.hidden = true;
    get.addEventListener('click', () => {
      desc.textContent = 'Po pobraniu otwórz plik i pozwól na instalację.';
    });
  } else {
    get.hidden = true;
    ios.hidden = false;
  }
  bar.hidden = false;
  doc.body?.classList.add('has-install');

  $('install-close').addEventListener('click', () => {
    bar.hidden = true;
    doc.body?.classList.remove('has-install');
    writeDismissed(storage, Date.now());
  });
  return kind;
}
