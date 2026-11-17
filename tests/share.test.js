import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { shareGame, setupShare, makeToast, SHARE, SHARE_URL } from '../src/share.js';
import { fakeDocument } from './fake-dom.js';

function recorder() {
  const msgs = [];
  return { msgs, toast: (m, ms) => msgs.push([m, ms]) };
}

test('udostępnia stały adres opublikowanej gry', () => {
  assert.equal(SHARE_URL, 'https://zbludzakowe-zabawy.github.io/swiatelka/');
  assert.equal(SHARE.url, SHARE_URL);
  assert.ok(SHARE.title && SHARE.text);
  // Ten sam adres jest w README.
  assert.ok(readFileSync(new URL('../README.md', import.meta.url), 'utf8').includes(SHARE_URL));
});

test('telefon: systemowe okno udostępniania z adresem gry', async () => {
  const calls = [];
  const { msgs, toast } = recorder();
  const res = await shareGame({ share: async d => calls.push(d) }, toast);
  assert.equal(res, 'shared');
  assert.deepEqual(calls, [SHARE]);
  assert.deepEqual(msgs, []);
});

test('zamknięcie okna udostępniania to nie błąd', async () => {
  const { msgs, toast } = recorder();
  const err = Object.assign(new Error('anulowano'), { name: 'AbortError' });
  const clip = [];
  const res = await shareGame({ share: async () => { throw err; }, clipboard: { writeText: async t => clip.push(t) } }, toast);
  assert.equal(res, 'cancelled');
  assert.deepEqual(clip, []);
  assert.deepEqual(msgs, []);
});

test('bez okna udostępniania (komputer) kopiuje link i mówi o tym', async () => {
  const clip = [];
  const { msgs, toast } = recorder();
  assert.equal(await shareGame({ clipboard: { writeText: async t => clip.push(t) } }, toast), 'copied');
  assert.deepEqual(clip, [SHARE_URL]);
  assert.match(msgs[0][0], /Skopiowano link/);
});

test('gdy udostępnianie się nie uda, też próbuje schowka', async () => {
  const clip = [];
  const { toast } = recorder();
  const nav = { share: async () => { throw Object.assign(new Error(), { name: 'NotAllowedError' }); },
    clipboard: { writeText: async t => clip.push(t) } };
  assert.equal(await shareGame(nav, toast), 'copied');
  assert.deepEqual(clip, [SHARE_URL]);
});

test('bez schowka pokazuje adres w komunikacie', async () => {
  const { msgs, toast } = recorder();
  assert.equal(await shareGame({}, toast), 'shown');
  assert.ok(msgs[0][0].includes(SHARE_URL));
  assert.ok(msgs[0][1] >= 5000, 'adres musi być widoczny dość długo, żeby go przepisać');
});

test('komunikat pojawia się i znika', async () => {
  const doc = fakeDocument(['toast']);
  doc.ids.toast.hidden = true;
  makeToast(doc)('Skopiowano link', 10);
  assert.equal(doc.ids.toast.hidden, false);
  assert.equal(doc.ids.toast.textContent, 'Skopiowano link');
  await new Promise(r => setTimeout(r, 30));
  assert.equal(doc.ids.toast.hidden, true);
});

test('podpina każdy przycisk z data-share', async () => {
  const doc = fakeDocument(['toast']);
  const a = doc.createElement('button'), b = doc.createElement('button');
  doc.querySelectorAll = sel => (sel === '[data-share]' ? [a, b] : []);
  const calls = [];
  assert.equal(setupShare(doc, { share: async d => calls.push(d) }), 2);
  a.click(); b.click();
  await new Promise(r => setTimeout(r, 0));
  assert.equal(calls.length, 2);
});
