import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ruchy, statusMessage } from '../src/messages.js';

const fake = o => ({ levels: 10, level: 1, moves: 0, won: false, finished: false, ...o });

test('odmiana słowa ruch', () => {
  assert.equal(ruchy(1), 'ruchu');
  assert.equal(ruchy(2), 'ruchach');
  assert.equal(ruchy(5), 'ruchach');
});

test('komunikaty dla każdego stanu gry', () => {
  assert.equal(statusMessage(fake()), 'Zgaś wszystkie światła.');
  assert.equal(statusMessage(fake({ won: true, level: 3, moves: 1 })), 'Plansza 3 zaliczona w 1 ruchu.');
  assert.equal(statusMessage(fake({ won: true, level: 3, moves: 4 })), 'Plansza 3 zaliczona w 4 ruchach.');
  assert.equal(statusMessage(fake({ won: true, finished: true, level: 10 })),
    'Wygrałeś grę! Przeszedłeś wszystkie 10 plansz.');
});
