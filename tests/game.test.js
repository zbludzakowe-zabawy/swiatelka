import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, LEVELS } from '../src/game.js';
import { allOff } from '../src/board.js';
import { seeded, solve } from './helpers.js';

const newGame = (seed = 1) => new Game({ rng: seeded(seed) });
const solveCurrent = g => solve(g.state).forEach(n => g.press(n));

test('nowa gra zaczyna od planszy 1 z zapalonymi światłami', () => {
  const g = newGame();
  assert.equal(LEVELS, 10);
  assert.equal(g.level, 1);
  assert.equal(g.moves, 0);
  assert.ok(g.lit > 0);
  assert.equal(g.won, false);
  assert.equal(g.finished, false);
  assert.deepEqual(g.state, g.start);
  assert.notEqual(g.state, g.start, 'state to kopia, nie ten sam obiekt');
});

test('press zmienia stan i zapisuje ruch w historii', () => {
  const g = newGame();
  const before = { ...g.state };
  assert.equal(g.press(33), true);
  assert.equal(g.moves, 1);
  assert.deepEqual(g.history, [33]);
  for (const n of [23, 32, 33, 34, 43]) assert.equal(g.state[n], 1 - before[n]);
  assert.deepEqual(g.start, before, 'start się nie zmienia');
});

test('press odrzuca nieistniejące kafelki', () => {
  const g = newGame();
  assert.equal(g.press(0), false);
  assert.equal(g.press(16), false);
  assert.equal(g.moves, 0);
});

test('undo cofa ostatni ruch', () => {
  const g = newGame();
  const before = { ...g.state };
  g.press(12); g.press(44);
  assert.equal(g.undo(), true);
  assert.deepEqual(g.history, [12]);
  g.undo();
  assert.deepEqual(g.state, before);
  assert.equal(g.undo(), false, 'brak ruchów do cofnięcia');
});

test('reset przywraca stan początkowy planszy', () => {
  const g = newGame();
  const start = { ...g.start };
  g.press(11); g.press(25); g.press(53);
  g.reset();
  assert.deepEqual(g.state, start);
  assert.equal(g.moves, 0);
  assert.equal(g.level, 1);
});

test('po zgaszeniu planszy ruchy są zablokowane, a next przechodzi dalej', () => {
  const g = newGame(5);
  assert.equal(g.next(), false, 'nie można przejść dalej przed wygraną');
  solveCurrent(g);
  assert.ok(g.won);
  assert.ok(allOff(g.state));
  const moves = g.moves;
  assert.equal(g.press(33), false);
  assert.equal(g.undo(), false);
  assert.equal(g.moves, moves);
  assert.equal(g.next(), true);
  assert.equal(g.level, 2);
  assert.equal(g.moves, 0);
  assert.equal(g.won, false);
});

test('przejście wszystkich 10 plansz kończy grę', () => {
  const g = newGame(9);
  for (let k = 1; k <= LEVELS; k++) {
    assert.equal(g.level, k);
    solveCurrent(g);
    assert.ok(g.won);
    if (k < LEVELS) { assert.equal(g.finished, false); g.next(); }
  }
  assert.equal(g.finished, true);
  assert.equal(g.next(), false, 'nie ma planszy 11');
  g.newGame();
  assert.equal(g.level, 1);
  assert.equal(g.won, false);
});

test('liczba plansz jest konfigurowalna', () => {
  const g = new Game({ levels: 2, rng: seeded(2) });
  solveCurrent(g); g.next(); solveCurrent(g);
  assert.ok(g.finished);
});
