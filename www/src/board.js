// Logika planszy 5×5 — czyste funkcje, bez DOM.
// Kafelki numerowane są jako wiersz*10 + kolumna (11 … 55).

export const SIZE = 5;

/** Wszystkie numery kafelków w kolejności wierszami. */
export const ALL = [];
for (let r = 1; r <= SIZE; r++) for (let c = 1; c <= SIZE; c++) ALL.push(r * 10 + c);

/** Pusta (zgaszona) plansza. */
export function emptyBoard() {
  const s = {};
  ALL.forEach(n => (s[n] = 0));
  return s;
}

/** Kafelek oraz jego sąsiedzi: z góry, z dołu, z lewej i z prawej (w granicach planszy). */
export function neighbours(n) {
  const r = Math.floor(n / 10), c = n % 10;
  return [[r, c], [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
    .filter(([a, b]) => a >= 1 && a <= SIZE && b >= 1 && b <= SIZE)
    .map(([a, b]) => a * 10 + b);
}

/** zrob_krzyzyk: zmienia (w miejscu) stan kafelka i jego sąsiadów. */
export function zrobKrzyzyk(s, n) {
  neighbours(n).forEach(k => (s[k] = 1 - s[k]));
  return s;
}

/** Czy wszystkie światła są zgaszone. */
export const allOff = s => ALL.every(n => s[n] === 0);

/** Liczba zapalonych świateł. */
export const countLit = s => ALL.reduce((sum, n) => sum + (s[n] === 1 ? 1 : 0), 0);

/**
 * Plansza nr k: zrob_krzyzyk dla k+1 różnych, losowo wybranych kafelków.
 * Nigdy nie zwraca planszy, która już jest zgaszona.
 * @param {number} k numer planszy (1…)
 * @param {() => number} rng generator liczb z [0, 1)
 */
export function generate(k, rng = Math.random) {
  const count = Math.min(k + 1, ALL.length);
  let s;
  do {
    s = emptyBoard();
    const pool = ALL.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    pool.slice(0, count).forEach(n => zrobKrzyzyk(s, n));
  } while (allOff(s));
  return s;
}
