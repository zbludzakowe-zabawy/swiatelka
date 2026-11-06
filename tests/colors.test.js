import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLORS, colorFor } from '../src/colors.js';

test('jest 10 palet, każda z kolorem, środkiem i poświatą', () => {
  assert.equal(COLORS.length, 10);
  for (const [on, core, glow] of COLORS) {
    assert.match(on, /^#[0-9a-f]{6}$/i);
    assert.match(core, /^#[0-9a-f]{6}$/i);
    assert.match(glow, /^rgba\(/);
  }
});

test('colorFor numeruje od 1 i działa cyklicznie', () => {
  assert.equal(colorFor(1).on, '#ffc94a');
  assert.equal(colorFor(10).on, '#ffffff');
  assert.deepEqual(colorFor(11), colorFor(1));
});

test('każda plansza 1–10 ma inny kolor', () => {
  const set = new Set(Array.from({ length: 10 }, (_, i) => colorFor(i + 1).on));
  assert.equal(set.size, 10);
});
