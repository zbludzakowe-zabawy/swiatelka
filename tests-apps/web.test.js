// Test strony w przeglądarce na emulowanych telefonach: propozycja aplikacji,
// „Nie teraz” i gra bez internetu po pierwszym wczytaniu.
// Uruchomienie: npm run test:web   (wymaga Chromium dla Playwright)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';
import { playFirstLevel } from './play.js';
import { APK_URL } from '../src/install.js';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

let server, base, browser;
before(async () => {
  server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = normalize(join(root, path.endsWith('/') ? path + 'index.html' : path));
    try {
      if (!file.startsWith(root + sep)) throw new Error();
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://localhost:${server.address().port}/`;
  browser = await chromium.launch();
});
after(async () => { await browser?.close(); server?.close(); });

async function open(device) {
  const ctx = await browser.newContext({ ...devices[device], deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(base);
  await page.waitForSelector('#board .tile');
  return { ctx, page };
}

test('Android: propozycja pobrania aplikacji', async () => {
  const { ctx, page } = await open('Pixel 7');
  await page.waitForSelector('#install', { state: 'visible' });
  assert.equal(await page.getAttribute('#install-get', 'href'), APK_URL);
  assert.ok(await page.isVisible('#install-get'));
  assert.ok(await page.isHidden('#install-ios'));
  if (process.env.SCREENSHOT_DIR) await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/web-android.png` });

  // Pasek nie zasłania przycisków gry (strona przewija się nad nim).
  await page.locator('#newgame').scrollIntoViewIfNeeded();
  const bar = await page.locator('#install').boundingBox();
  const btn = await page.locator('#newgame').boundingBox();
  assert.ok(btn.y + btn.height <= bar.y, 'pasek zasłania przycisk „Nowa gra”');

  // „Nie teraz” chowa pasek, także po ponownym otwarciu strony.
  await page.click('#install-close');
  assert.ok(await page.isHidden('#install'));
  await page.reload();
  await page.waitForSelector('#board .tile');
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

test('komputer: bez propozycji', async () => {
  const { ctx, page } = await open('Desktop Chrome');
  await page.waitForTimeout(300);
  assert.ok(await page.isHidden('#install'));
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
