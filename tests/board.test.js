import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALL, SIZE, emptyBoard, neighbours, zrobKrzyzyk, allOff, countLit, generate } from '../src/board.js';
import { seeded, solve } from './helpers.js';

test('ALL zawiera 25 kafelków od 11 do 55', () => {
  assert.equal(SIZE, 5);
  assert.equal(ALL.length, 25);
  assert.equal(ALL[0], 11);
  assert.equal(ALL[24], 55);
  assert.ok(!ALL.includes(10) && !ALL.includes(16) && !ALL.includes(60));
});

test('emptyBoard jest zgaszona', () => {
  const s = emptyBoard();
  assert.equal(Object.keys(s).length, 25);
  assert.ok(allOff(s));
  assert.equal(countLit(s), 0);
});

test('neighbours: róg ma 3, krawędź 4, środek 5 kafelków', () => {
  assert.deepEqual(neighbours(11).sort(), [11, 12, 21]);
  assert.deepEqual(neighbours(55).sort(), [45, 54, 55]);
  assert.deepEqual(neighbours(13).sort(), [12, 13, 14, 23]);
  assert.deepEqual(neighbours(33).sort(), [23, 32, 33, 34, 43]);
});

test('neighbours zawsze mieści się w planszy', () => {
  for (const n of ALL) for (const k of neighbours(n)) assert.ok(ALL.includes(k));
});

test('zrobKrzyzyk przełącza krzyżyk i jest odwracalny', () => {
  const s = emptyBoard();
  zrobKrzyzyk(s, 33);
  assert.equal(countLit(s), 5);
  for (const n of [23, 32, 33, 34, 43]) assert.equal(s[n], 1);
  zrobKrzyzyk(s, 33);
  assert.ok(allOff(s));
});

test('zrobKrzyzyk jest przemienny', () => {
  const a = emptyBoard(), b = emptyBoard();
  zrobKrzyzyk(a, 22); zrobKrzyzyk(a, 23);
  zrobKrzyzyk(b, 23); zrobKrzyzyk(b, 22);
  assert.deepEqual(a, b);
});

test('generate nigdy nie zwraca zgaszonej planszy i zawiera tylko 0/1', () => {
  const rng = seeded(42);
  for (let k = 1; k <= 10; k++) {
    for (let i = 0; i < 50; i++) {
      const s = generate(k, rng);
      assert.ok(!allOff(s));
      for (const n of ALL) assert.ok(s[n] === 0 || s[n] === 1);
    }
  }
});

test('generate jest deterministyczny dla tego samego ziarna', () => {
  assert.deepEqual(generate(5, seeded(7)), generate(5, seeded(7)));
});

test('każda wygenerowana plansza jest rozwiązywalna', () => {
  const rng = seeded(3);
  for (let k = 1; k <= 10; k++) {
    for (let i = 0; i < 20; i++) {
      const s = generate(k, rng);
      const moves = solve(s);
      assert.ok(moves, `plansza ${k} nierozwiązywalna`);
      moves.forEach(n => zrobKrzyzyk(s, n));
      assert.ok(allOff(s));
    }
  }
});

test('plansza 1 (2 krzyżyki) ma od 2 do 10 zapalonych świateł', () => {
  const rng = seeded(11);
  for (let i = 0; i < 100; i++) {
    const lit = countLit(generate(1, rng));
    assert.ok(lit >= 2 && lit <= 10, `lit=${lit}`);
  }
});
