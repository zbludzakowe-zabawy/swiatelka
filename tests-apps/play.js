// Wspólny scenariusz testu aplikacji (komputer i telefon): gra się wczytuje,
// czcionki są lokalne, ruch i cofanie działają, plansza 1 daje się rozwiązać.
import assert from 'node:assert/strict';

export async function playFirstLevel(win) {
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
  await win.evaluate(() => {
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
}
