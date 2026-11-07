// Test strony w przeglądarce na emulowanych telefonach i komputerze: propozycja instalacji
// (PWA), „Nie teraz”, gra bez internetu i pasek „Dostępna nowa wersja”.
// Uruchomienie: npm run test:web   (wymaga Chromium dla Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';
import { playFirstLevel } from './play.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

// Wersja w sw.js — test zmienia ją, udając publikację nowej wersji gry.
let swVersion = 'test-1';

let server, base, browser;
before(async () => {
  server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = normalize(join(root, path.endsWith('/') ? path + 'index.html' : path));
    try {
      if (!file.startsWith(root + sep)) throw new Error();
      let body = await readFile(file);
      if (path === '/sw.js') body = String(body).replace("const VERSION = 'dev';", `const VERSION = '${swVersion}';`);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream',
        'cache-control': 'no-cache' }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
});
after(async () => { await browser?.close(); server?.close(); });

async function open(device) {
  const ctx = await browser.newContext({ ...devices[device], deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(base);
  await page.waitForSelector('#board .tile');
  return { ctx, page };
}

// Chrome zgłasza „można zainstalować” (beforeinstallprompt) tylko na prawdziwej stronie HTTPS
// po chwili grania — w teście wysyłamy to zdarzenie sami.
const offerInstall = page => page.evaluate(() => {
  const e = new Event('beforeinstallprompt', { cancelable: true });
  e.prompt = async () => { window.__prompted = true; };
  e.userChoice = Promise.resolve({ outcome: 'accepted' });
  window.dispatchEvent(e);
  return e.defaultPrevented;
});

test('Android: przycisk „Zainstaluj” otwiera okno instalacji przeglądarki', async () => {
  const { ctx, page } = await open('Pixel 7');
  await page.waitForTimeout(300);
  assert.ok(await page.isHidden('#install'), 'pasek dopiero, gdy przeglądarka pozwoli instalować');
  assert.equal(await offerInstall(page), true);
  await page.waitForSelector('#install', { state: 'visible' });
  assert.ok(await page.isVisible('#install-get'));
  assert.equal(await page.textContent('#install-get'), 'Zainstaluj');
  assert.ok(await page.isHidden('#install-ios'));
  if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/web-android.png` });

  // Pasek nie zasłania przycisków gry (strona przewija się nad nim).
  await page.locator('#newgame').scrollIntoViewIfNeeded();
  const bar = await page.locator('#install').boundingBox();
  const btn = await page.locator('#newgame').boundingBox();
  assert.ok(btn.y + btn.height <= bar.y, 'pasek zasłania przycisk „Nowa gra”');

  await page.click('#install-get');
  assert.equal(await page.evaluate(() => window.__prompted), true);
  assert.ok(await page.isHidden('#install'));
  await ctx.close();
});

test('Android: „Nie teraz” chowa pasek, także po ponownym otwarciu strony', async () => {
  const { ctx, page } = await open('Pixel 7');
  await offerInstall(page);
  await page.click('#install-close');
  assert.ok(await page.isHidden('#install'));
  await page.reload();
  await page.waitForSelector('#board .tile');
  await offerInstall(page);
  await page.waitForTimeout(200);
  assert.ok(await page.isHidden('#install'));
  await ctx.close();
});

test('iPhone: podpowiedź „Do ekranu początkowego”', async () => {
  const { ctx, page } = await open('iPhone 13');
  await page.waitForSelector('#install', { state: 'visible' });
  assert.ok(await page.isVisible('#install-ios'));
  assert.ok(await page.isHidden('#install-get'));
  assert.match(await page.textContent('#install-ios'), /Do ekranu początkowego/);
  if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/web-iphone.png` });
  await ctx.close();
});

test('komputer: bez propozycji, dopóki przeglądarka nie pozwoli instalować', async () => {
  const { ctx, page } = await open('Desktop Chrome');
  await page.waitForTimeout(300);
  assert.ok(await page.isHidden('#install'));
  await ctx.close();
});

test('strona spełnia wymagania instalacji (manifest, ikony, service worker)', async () => {
  const { ctx, page } = await open('Pixel 7');
  const manifest = await page.evaluate(async () =>
    (await fetch(document.querySelector('link[rel=manifest]').href)).json());
  assert.equal(manifest.display, 'standalone');
  assert.ok(manifest.icons.some(i => i.sizes === '192x192') && manifest.icons.some(i => i.sizes === '512x512'));
  assert.ok(manifest.icons.some(i => i.purpose === 'maskable'));
  assert.ok(await page.evaluate(() => navigator.serviceWorker.ready.then(r => Boolean(r.active))));
  await ctx.close();
});

test('telefon: gra działa bez internetu po pierwszym wczytaniu', async () => {
  const { ctx, page } = await open('Pixel 7');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();               // od teraz stronę obsługuje service worker
  await page.waitForSelector('#board .tile');
  await ctx.setOffline(true);
  await page.reload();
  await playFirstLevel(page, { inApp: false });
  await ctx.close();
});

test('nowa wersja: pasek „Dostępna nowa wersja”, Odśwież włącza ją od razu', async () => {
  swVersion = 'test-1';
  const { ctx, page } = await open('Pixel 7');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForSelector('#board .tile');
  const version = () => page.evaluate(() => new Promise(res => {
    const ch = new MessageChannel();
    ch.port1.onmessage = e => res(e.data);
    navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' }, [ch.port2]);
  }));
  assert.equal(await version(), 'test-1');
  assert.ok(await page.isHidden('#update'));

  swVersion = 'test-2';                // „publikacja” nowej wersji gry
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update()));
  await page.waitForSelector('#update', { state: 'visible' });
  assert.equal(await version(), 'test-1', 'nowa wersja czeka na zgodę gracza');
  if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/web-update.png` });

  await Promise.all([page.waitForEvent('load'), page.click('#update-now')]);
  await page.waitForSelector('#board .tile');
  assert.equal(await version(), 'test-2');
  assert.ok(await page.isHidden('#update'));
  await ctx.close();
});
