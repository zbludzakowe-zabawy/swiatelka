// Deterministyczny generator liczb losowych (mulberry32) do testów.
export function seeded(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Rozwiązuje planszę metodą „gonienia świateł” + przeszukania pierwszego wiersza. */
import { ALL, allOff, zrobKrzyzyk } from '../src/board.js';
export function solve(start) {
  for (let mask = 0; mask < 32; mask++) {
    const s = { ...start }, moves = [];
    for (let c = 1; c <= 5; c++) if (mask & (1 << (c - 1))) { zrobKrzyzyk(s, 10 + c); moves.push(10 + c); }
    for (let r = 2; r <= 5; r++)
      for (let c = 1; c <= 5; c++)
        if (s[(r - 1) * 10 + c] === 1) { zrobKrzyzyk(s, r * 10 + c); moves.push(r * 10 + c); }
    if (allOff(s)) return moves;
  }
  return null;
}
export { ALL };
