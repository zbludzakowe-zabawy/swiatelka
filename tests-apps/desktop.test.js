// Test aplikacji na komputer: uruchamia prawdziwe okno Electron, odcina sieć
// i sprawdza, że gra się wczytuje i da się w nią grać.
// Uruchomienie: npm run test:desktop
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { _electron as electron } from 'playwright';
import { playFirstLevel } from './play.js';

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
    await playFirstLevel(win);

    if (process.env.SCREENSHOT) await win.screenshot({ path: process.env.SCREENSHOT });
    assert.deepEqual(await app.evaluate(() => globalThis.__blocked), [],
      'aplikacja próbowała łączyć się z internetem');
  } finally {
    await app.close();
  }
});
