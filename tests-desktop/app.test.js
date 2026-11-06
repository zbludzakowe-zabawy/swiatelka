// Test aplikacji na komputer: uruchamia prawdziwe okno Electron, odcina sieć
// i sprawdza, że gra się wczytuje i da się w nią grać.
// Uruchomienie: npm run test:desktop  (wymaga Playwright: npm i -D playwright)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { _electron as electron } from 'playwright';

// path.resolve usuwa końcowy „\”, który na Windows psuje cudzysłowy w argumentach.
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const exe = process.env.SWIATELKA_EXE; // opcjonalnie: zbudowana aplikacja zamiast `electron .`

test('gra działa w aplikacji na komputer bez internetu', async () => {
  const app = await electron.launch(exe
    ? { executablePath: exe, args: ['--no-sandbox'] }
    : { args: [root, '--no-sandbox'], cwd: root });
  try {
    // Odetnij internet: każde żądanie poza lokalnymi plikami jest blokowane i zapisywane.
    const blocked = await app.evaluate(async ({ session }) => {
      globalThis.__blocked = [];
      session.defaultSession.webRequest.onBeforeRequest((d, cb) => {
        const ok = /^(app|file|devtools|data|blob):/.test(d.url);
        if (!ok) globalThis.__blocked.push(d.url);
        cb({ cancel: !ok });
      });
      return globalThis.__blocked;
    });
    assert.deepEqual(blocked, []);

    const win = await app.firstWindow();
    await win.reload();
    await win.waitForSelector('#board .tile');
    assert.equal(await win.title(), 'Gra w światełka');
    assert.equal(await win.locator('#board .tile').count(), 25);
    assert.equal(await win.textContent('#level'), 'Plansza 1 / 10');

    // Lokalne czcionki naprawdę się wczytały.
    await win.evaluate(() => document.fonts.ready);
    const fonts = await win.evaluate(() =>
      ['Chakra Petch', 'IBM Plex Sans', 'IBM Plex Mono'].map(f => document.fonts.check(`500 16px "${f}"`)));
    assert.deepEqual(fonts, [true, true, true]);

    // Kliknięcie lampki zmienia licznik ruchów; cofnięcie przywraca stan.
    const litBefore = await win.textContent('#lit');
    await win.click('#t11');
    assert.equal(await win.textContent('#moves'), '1');
    await win.click('#undo');
    assert.equal(await win.textContent('#moves'), '0');
    assert.equal(await win.textContent('#lit'), litBefore);

    // Rozwiąż planszę 1 (metoda „gaś wiersz po wierszu” + przeszukanie ostatniego wiersza).
    await win.evaluate(async () => {
      const on = () => [...document.querySelectorAll('#board .tile')].map(t => t.classList.contains('on'));
      const click = id => document.getElementById(id).click();
      const start = on();
      for (let mask = 0; mask < 32; mask++) {
        let s = start.slice(); const presses = [];
        const press = (r, c) => { presses.push((r + 1) * 10 + c + 1);
          for (const [dr, dc] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]) {
            const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 5 && cc >= 0 && cc < 5) s[rr*5+cc] = !s[rr*5+cc];
          } };
        for (let c = 0; c < 5; c++) if (mask >> c & 1) press(0, c);
        for (let r = 1; r < 5; r++) for (let c = 0; c < 5; c++) if (s[(r-1)*5+c]) press(r, c);
        if (s.every(x => !x)) { presses.forEach(n => click('t' + n)); return; }
      }
      throw new Error('brak rozwiązania');
    });
    assert.equal(await win.textContent('#lit'), '0');
    assert.ok(await win.isVisible('#next'));
    await win.click('#next');
    assert.equal(await win.textContent('#level'), 'Plansza 2 / 10');

    if (process.env.SCREENSHOT) await win.screenshot({ path: process.env.SCREENSHOT });
    assert.deepEqual(await app.evaluate(() => globalThis.__blocked), [],
      'aplikacja próbowała łączyć się z internetem');
  } finally {
    await app.close();
  }
});
