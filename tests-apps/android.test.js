// Test aplikacji na Androida: wymaga emulatora lub telefonu podłączonego przez adb
// z zainstalowaną aplikacją w wersji debug (npm run android, potem gradlew installDebug).
// Włącza tryb samolotowy i gra w planszę 1.
// Uruchomienie: npm run test:android   (SCREENSHOT=plik.png zapisze zrzut ekranu telefonu)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _android as android } from 'playwright';
import { playFirstLevel } from './play.js';

const PKG = 'io.github.zbludzakowe_zabawy.swiatelka';

test('gra działa w aplikacji na Androida bez internetu', async () => {
  const [device] = await android.devices({ omitDriverInstall: true });
  assert.ok(device, 'brak urządzenia z Androidem (adb devices)');
  const sh = async cmd => (await device.shell(cmd)).toString();

  // Aplikacja w ogóle nie prosi o dostęp do internetu.
  const perms = await sh(`dumpsys package ${PKG}`);
  assert.match(perms, /versionName=/, 'aplikacja nie jest zainstalowana');
  assert.doesNotMatch(perms, /android\.permission\.INTERNET/);

  // Tryb samolotowy: wyłącz Wi-Fi i dane komórkowe.
  await sh('cmd connectivity airplane-mode enable; svc wifi disable; svc data disable');
  try {
    assert.match(await sh('ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1 && echo SIEC || echo BRAK'), /BRAK/);

    await sh(`am force-stop ${PKG}`);
    await sh(`monkey -p ${PKG} -c android.intent.category.LAUNCHER 1`);
    const webview = await device.webView({ pkg: PKG }, { timeout: 60_000 });
    const page = await webview.page();

    await playFirstLevel(page);

    // Plansza mieści się na szerokość ekranu (bez przewijania w bok).
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    assert.ok(fits, 'strona szersza niż ekran telefonu');

    if (process.env.SCREENSHOT) await device.screenshot({ path: process.env.SCREENSHOT });
  } finally {
    await sh('cmd connectivity airplane-mode disable; svc wifi enable; svc data enable');
    await device.close();
  }
});
