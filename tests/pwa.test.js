import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installOffer, isApp, isIos, setupInstall, setupUpdates, watchForUpdates,
  DISMISS_KEY, SNOOZE_DAYS } from '../src/pwa.js';
import { fakeDocument } from './fake-dom.js';

const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
};
const DAY = 864e5;

// Prosty „EventTarget” do atrap okna, rejestracji i service workera.
class Target {
  constructor(props = {}) { Object.assign(this, props); this.l = {}; }
  addEventListener(t, f) { (this.l[t] ||= []).push(f); }
  emit(t, e = {}) { (this.l[t] || []).forEach(f => f(e)); }
}
const promptEvent = () => {
  const e = { prevented: false, prompted: false, userChoice: Promise.resolve({ outcome: 'accepted' }) };
  e.preventDefault = () => { e.prevented = true; };
  e.prompt = async () => { e.prompted = true; };
  return e;
};

test('przycisk „Zainstaluj”, gdy przeglądarka pozwala zainstalować grę (Android, komputer)', () => {
  assert.equal(installOffer({ ua: UA.android, hasPrompt: true }), 'prompt');
  assert.equal(installOffer({ ua: UA.windows, hasPrompt: true }), 'prompt');
  assert.equal(installOffer({ ua: UA.android }), null, 'bez zgody przeglądarki nie ma czego pokazać');
  assert.equal(installOffer({ ua: UA.windows }), null);
});

test('iPhone i iPad w Safari: instrukcja „Do ekranu początkowego”', () => {
  assert.equal(installOffer({ ua: UA.iphone }), 'ios');
  assert.equal(installOffer({ ua: UA.ipad, touchPoints: 5 }), 'ios');
  assert.equal(installOffer({ ua: UA.ipad, touchPoints: 0 }), null, 'Mac bez ekranu dotykowego');
  assert.equal(installOffer({ ua: UA.iphoneChrome }), null, 'Chrome na iPhonie nie doda do ekranu');
  assert.ok(isIos(UA.iphone) && isIos(UA.ipad, 5) && !isIos(UA.android));
});

test('w zainstalowanej aplikacji niczego nie proponuje', () => {
  assert.equal(installOffer({ ua: UA.android, app: true, hasPrompt: true }), null);
  assert.equal(installOffer({ ua: UA.iphone, app: true }), null);
});

test('po „Nie teraz” milczy przez tydzień', () => {
  const now = 100 * DAY;
  assert.equal(installOffer({ ua: UA.iphone, dismissedAt: now - DAY, now }), null);
  assert.equal(installOffer({ ua: UA.android, hasPrompt: true, dismissedAt: now - DAY, now }), null);
  assert.equal(installOffer({ ua: UA.iphone, dismissedAt: now - (SNOOZE_DAYS + 1) * DAY, now }), 'ios');
});

test('rozpoznaje aplikację: komputer, ikona na ekranie telefonu', () => {
  const web = { location: { protocol: 'https:' }, navigator: {}, matchMedia: () => ({ matches: false }) };
  assert.equal(isApp(web), false);
  assert.equal(isApp({ ...web, location: { protocol: 'app:' } }), true);
  assert.equal(isApp({ ...web, navigator: { standalone: true } }), true);
  assert.equal(isApp({ ...web, matchMedia: () => ({ matches: true }) }), true);
});

const IDS = ['install', 'install-get', 'install-desc', 'install-ios', 'install-close',
  'update', 'update-now', 'update-later'];

function setup(ua, stored = {}) {
  const doc = fakeDocument(IDS);
  for (const id of ['install', 'install-get', 'install-ios', 'update']) doc.ids[id].hidden = true;
  doc.body = doc.createElement('body');
  const storage = { getItem: k => stored[k] ?? null, setItem: (k, v) => (stored[k] = v) };
  const win = new Target({ location: { protocol: 'https:' }, navigator: { userAgent: ua, maxTouchPoints: 0 },
    matchMedia: () => ({ matches: false }), localStorage: storage });
  return { doc, win, stored, $: id => doc.getElementById(id) };
}

test('Android: pasek pojawia się, gdy przeglądarka pozwoli zainstalować, i otwiera jej okno', async () => {
  const { doc, win, $ } = setup(UA.android);
  const kind = setupInstall(doc, win);
  assert.equal(kind(), null);
  assert.equal($('install').hidden, true);

  const e = promptEvent();
  win.emit('beforeinstallprompt', e);
  assert.ok(e.prevented, 'zamiast ikonki przeglądarki — nasz pasek');
  assert.equal(kind(), 'prompt');
  assert.equal($('install').hidden, false);
  assert.equal($('install-get').hidden, false);
  assert.equal($('install-ios').hidden, true);
  assert.ok(doc.body.classList.contains('has-install'));

  await $('install-get').listeners.click[0]();
  assert.ok(e.prompted, 'okno instalacji przeglądarki');
  assert.equal($('install').hidden, true, 'okno można pokazać tylko raz');
  assert.ok(!doc.body.classList.contains('has-install'));
});

test('po zainstalowaniu pasek znika', () => {
  const { doc, win, $ } = setup(UA.android);
  setupInstall(doc, win);
  win.emit('beforeinstallprompt', promptEvent());
  win.emit('appinstalled');
  assert.equal($('install').hidden, true);
});

test('iPhone: pasek z instrukcją, bez przycisku', () => {
  const { doc, win, $ } = setup(UA.iphone);
  assert.equal(setupInstall(doc, win)(), 'ios');
  assert.equal($('install').hidden, false);
  assert.equal($('install-get').hidden, true);
  assert.equal($('install-ios').hidden, false);
});

test('„Nie teraz” chowa pasek i zapamiętuje wybór', () => {
  const { doc, win, stored, $ } = setup(UA.iphone);
  setupInstall(doc, win);
  $('install-close').click();
  assert.equal($('install').hidden, true);
  assert.ok(!doc.body.classList.contains('has-install'));
  assert.ok(Number(stored[DISMISS_KEY]) > 0);
  const again = setup(UA.android, stored);
  setupInstall(again.doc, again.win);
  again.win.emit('beforeinstallprompt', promptEvent());
  assert.equal(again.$('install').hidden, true);
});

test('działa, gdy przeglądarka blokuje pamięć (tryb prywatny)', () => {
  const { doc, win } = setup(UA.iphone);
  Object.defineProperty(win, 'localStorage', { get() { throw new Error('zablokowane'); } });
  assert.equal(setupInstall(doc, win)(), 'ios');
  doc.getElementById('install-close').click();
});

test('aktualizacja: tylko gdy nowa wersja czeka, a stroną steruje starsza', () => {
  const seen = [];
  const reg = new Target({ waiting: null, installing: null });
  watchForUpdates(reg, () => false, w => seen.push(w));
  const first = new Target({ state: 'installing' });
  reg.installing = first; reg.emit('updatefound');
  first.state = 'installed'; first.emit('statechange');
  assert.deepEqual(seen, [], 'pierwsza instalacja to nie aktualizacja');

  const reg2 = new Target({ waiting: null, installing: null });
  watchForUpdates(reg2, () => true, w => seen.push(w));
  const next = new Target({ state: 'installing' });
  reg2.installing = next; reg2.emit('updatefound');
  next.emit('statechange');
  assert.deepEqual(seen, []);
  next.state = 'installed'; next.emit('statechange');
  assert.deepEqual(seen, [next]);

  const waiting = new Target();
  watchForUpdates(new Target({ waiting }), () => true, w => seen.push(w));
  assert.equal(seen.at(-1), waiting, 'wersja czekająca już przy otwarciu strony');
});

test('pasek „Dostępna nowa wersja”: Odśwież włącza nową wersję i przeładowuje grę', async () => {
  const { doc, win, $ } = setup(UA.iphone);
  const msgs = [];
  const waiting = new Target({ postMessage: m => msgs.push(m) });
  const reg = new Target({ waiting, update: async () => {} });
  const sw = new Target({ controller: {}, register: async () => reg });
  let reloads = 0;
  win.navigator.serviceWorker = sw;
  win.location.reload = () => reloads++;
  setupInstall(doc, win);
  assert.equal($('install').hidden, false);

  await setupUpdates(doc, win);
  assert.equal($('update').hidden, false);
  assert.equal($('install').hidden, true, 'jeden pasek naraz');
  assert.ok(doc.body.classList.contains('has-install'));

  $('update-now').click();
  assert.deepEqual(msgs, [{ type: 'SKIP_WAITING' }]);
  assert.equal($('update').hidden, true);
  sw.emit('controllerchange');
  sw.emit('controllerchange');
  assert.equal(reloads, 1);
});

test('„Później” chowa pasek nowej wersji bez przeładowania', async () => {
  const { doc, win, $ } = setup(UA.windows);
  const reg = new Target({ waiting: new Target({ postMessage() {} }), update: async () => {} });
  win.navigator.serviceWorker = new Target({ controller: {}, register: async () => reg });
  await setupUpdates(doc, win);
  $('update-later').click();
  assert.equal($('update').hidden, true);
  assert.ok(!doc.body.classList.contains('has-install'));
});

test('bez service workera (stara przeglądarka) gra działa dalej', async () => {
  const { doc, win } = setup(UA.windows);
  assert.equal(await setupUpdates(doc, win), null);
  win.navigator.serviceWorker = new Target({ register: async () => { throw new Error('nie'); } });
  assert.equal(await setupUpdates(doc, win), null);
});
