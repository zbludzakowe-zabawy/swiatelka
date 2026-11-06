import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUI } from '../src/ui.js';
import { Game } from '../src/game.js';
import { ALL } from '../src/board.js';
import { fakeDocument } from './fake-dom.js';
import { seeded, solve } from './helpers.js';

const IDS = ['board', 'msg', 'progress', 'undo', 'reset', 'next', 'restart', 'newgame', 'level', 'moves', 'lit'];

function setup(opts = {}) {
  const doc = fakeDocument(IDS);
  const game = new Game({ rng: seeded(4), ...opts });
  const ui = createUI(game, doc);
  return { doc, game, ui, $: id => doc.getElementById(id) };
}

test('buduje 25 kafelków i pasek postępu', () => {
  const { $, game } = setup();
  assert.equal($('board').children.length, 25);
  assert.equal($('progress').children.length, game.levels);
  assert.equal($('level').textContent, 'Plansza 1 / 10');
  assert.equal($('moves').textContent, 0);
  assert.ok($('undo').disabled);
  assert.ok($('next').hidden);
});

test('kafelki odzwierciedlają stan planszy', () => {
  const { ui, game } = setup();
  for (const n of ALL) assert.equal(ui.tiles[n].classList.contains('on'), game.state[n] === 1);
  const lit = ALL.find(n => game.state[n] === 1);
  assert.match(ui.tiles[lit].getAttribute('aria-label'), /zapalony$/);
});

test('kliknięcie kafelka wykonuje ruch i odświeża liczniki', () => {
  const { ui, $, game } = setup();
  ui.tiles[33].click();
  assert.equal(game.moves, 1);
  assert.equal($('moves').textContent, 1);
  assert.equal($('lit').textContent, game.lit);
  assert.equal($('undo').disabled, false);
  $('undo').click();
  assert.equal(game.moves, 0);
});

test('ustawia kolor lampek dla planszy', () => {
  const { doc } = setup();
  assert.equal(doc.documentElement.style.props['--lamp-on'], '#ffc94a');
});

test('wygrana plansza pokazuje przycisk „Następna plansza” i ustawia na nim fokus', () => {
  const { ui, $, game, doc } = setup();
  solve(game.state).forEach(n => ui.tiles[n].click());
  assert.ok(game.won);
  assert.equal($('next').hidden, false);
  assert.ok($('undo').hidden && $('reset').hidden);
  assert.equal(doc.activeElement, $('next'));
  assert.match($('msg').textContent, /^Plansza 1 zaliczona/);
  $('next').click();
  assert.equal($('level').textContent, 'Plansza 2 / 10');
  assert.equal(doc.documentElement.style.props['--lamp-on'], '#4ad8ff');
});

test('koniec gry pokazuje „Zagraj ponownie”', () => {
  const { ui, $, game, doc } = setup({ levels: 1 });
  solve(game.state).forEach(n => ui.tiles[n].click());
  assert.ok(game.finished);
  assert.equal($('restart').hidden, false);
  assert.ok($('next').hidden);
  assert.equal(doc.activeElement, $('restart'));
  $('restart').click();
  assert.equal(game.won, false);
});
