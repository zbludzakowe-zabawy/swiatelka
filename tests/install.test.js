import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installOffer, isApp, setupInstall, APK_URL, DISMISS_KEY, SNOOZE_DAYS } from '../src/install.js';
import { fakeDocument } from './fake-dom.js';

const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
};
const DAY = 864e5;

test('na Androidzie proponuje pobranie aplikacji, na iPhonie i iPadzie — ekran początkowy', () => {
  assert.equal(installOffer({ ua: UA.android }), 'android');
  assert.equal(installOffer({ ua: UA.iphone }), 'ios');
  assert.equal(installOffer({ ua: UA.ipad, touchPoints: 5 }), 'ios');
});

test('na komputerze niczego nie proponuje (także na Macu bez ekranu dotykowego)', () => {
  assert.equal(installOffer({ ua: UA.windows }), null);
  assert.equal(installOffer({ ua: UA.ipad, touchPoints: 0 }), null);
});

test('w zainstalowanej aplikacji niczego nie proponuje', () => {
  assert.equal(installOffer({ ua: UA.android, app: true }), null);
  assert.equal(installOffer({ ua: UA.iphone, app: true }), null);
});

test('po „Nie teraz” milczy przez tydzień', () => {
  const now = 100 * DAY;
  assert.equal(installOffer({ ua: UA.android, dismissedAt: now - DAY, now }), null);
  assert.equal(installOffer({ ua: UA.android, dismissedAt: now - (SNOOZE_DAYS + 1) * DAY, now }), 'android');
});

test('rozpoznaje aplikację: komputer, Android, ikona na ekranie', () => {
  const web = { location: { protocol: 'https:' }, navigator: {}, matchMedia: () => ({ matches: false }) };
  assert.equal(isApp(web), false);
  assert.equal(isApp({ ...web, location: { protocol: 'app:' } }), true);
  assert.equal(isApp({ ...web, Capacitor: { isNativePlatform: () => true } }), true);
  assert.equal(isApp({ ...web, navigator: { standalone: true } }), true);
  assert.equal(isApp({ ...web, matchMedia: () => ({ matches: true }) }), true);
});

function setup(ua, stored = {}) {
  const doc = fakeDocument(['install', 'install-get', 'install-desc', 'install-ios', 'install-close']);
  doc.ids.install.hidden = true;
  doc.ids['install-get'].hidden = true;
  doc.ids['install-ios'].hidden = true;
  doc.body = doc.createElement('body');
  const storage = { getItem: k => stored[k] ?? null, setItem: (k, v) => (stored[k] = v) };
  const win = { location: { protocol: 'https:' }, navigator: { userAgent: ua, maxTouchPoints: 0 },
    matchMedia: () => ({ matches: false }), localStorage: storage };
  return { doc, win, stored, $: id => doc.getElementById(id) };
}

test('Android: pasek z przyciskiem pobrania najnowszej aplikacji', () => {
  const { doc, win, $ } = setup(UA.android);
  assert.equal(setupInstall(doc, win), 'android');
  assert.equal($('install').hidden, false);
  assert.equal($('install-get').hidden, false);
  assert.equal($('install-get').getAttribute('href'), APK_URL);
  assert.equal($('install-ios').hidden, true);
  assert.ok(doc.body.classList.contains('has-install'));
  $('install-get').click();
  assert.match($('install-desc').textContent, /pozwól na instalację/);
});

test('iPhone: pasek z instrukcją, bez przycisku pobrania', () => {
  const { doc, win, $ } = setup(UA.iphone);
  assert.equal(setupInstall(doc, win), 'ios');
  assert.equal($('install').hidden, false);
  assert.equal($('install-get').hidden, true);
  assert.equal($('install-ios').hidden, false);
});

test('„Nie teraz” chowa pasek i zapamiętuje wybór', () => {
  const { doc, win, stored, $ } = setup(UA.android);
  setupInstall(doc, win);
  $('install-close').click();
  assert.equal($('install').hidden, true);
  assert.ok(!doc.body.classList.contains('has-install'));
  assert.ok(Number(stored[DISMISS_KEY]) > 0);
  const again = setup(UA.android, stored);
  assert.equal(setupInstall(again.doc, again.win), null);
  assert.equal(again.$('install').hidden, true);
});

test('działa, gdy przeglądarka blokuje pamięć (tryb prywatny)', () => {
  const { doc, win } = setup(UA.android);
  Object.defineProperty(win, 'localStorage', { get() { throw new Error('zablokowane'); } });
  assert.equal(setupInstall(doc, win), 'android');
  doc.getElementById('install-close').click();
});

test('adres APK zgadza się z nazwą pliku w wydaniu', async () => {
  const { readFileSync } = await import('node:fs');
  const wf = readFileSync(new URL('../.github/workflows/android.yml', import.meta.url), 'utf8');
  const name = APK_URL.split('/').pop();
  assert.match(wf, new RegExp(`out/${name.replace('.', '\\.')}`));
  assert.match(APK_URL, /\/releases\/latest\/download\//);
});
