// Gra ma działać bez internetu: żadnych zewnętrznych zasobów, a wszystkie pliki
// są w pamięci service workera (przeglądarka) i w paczce aplikacji na komputer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = f => readFileSync(join(root, f), 'utf8');
const list = dir => readdirSync(join(root, dir)).map(f => `${dir}/${f}`);

const pageFiles = ['index.html', 'manifest.webmanifest', ...list('css'), ...list('src')];
const swFiles = [...read('sw.js').matchAll(/^\s*'([^']+)',$/gm)].map(m => m[1]);

test('strona nie wczytuje niczego z internetu', () => {
  for (const f of pageFiles) {
    assert.doesNotMatch(read(f), /(https?:)?\/\/[a-z0-9.-]+\.[a-z]{2,}\//i, f);
  }
});

test('wszystkie pliki, do których odwołuje się strona, istnieją', () => {
  const refs = [
    ...[...read('index.html').matchAll(/(?:href|src)="([^"]+)"/g)].map(m => m[1]),
    ...[...read('css/fonts.css').matchAll(/url\(\.\.\/([^)]+)\)/g)].map(m => m[1]),
    ...JSON.parse(read('manifest.webmanifest')).icons.map(i => i.src),
  ];
  assert.ok(refs.length > 10);
  for (const r of refs) assert.ok(existsSync(join(root, r)), r);
});

test('service worker zapisuje wszystkie pliki gry', () => {
  const needed = [...pageFiles, ...list('fonts').filter(f => f.endsWith('.woff2')),
    ...list('icons').filter(f => /\.(png|svg)$/.test(f))];
  for (const f of needed) assert.ok(swFiles.includes(f), `brak w sw.js: ${f}`);
  for (const f of swFiles) if (f !== './') assert.ok(existsSync(join(root, f)), `nie istnieje: ${f}`);
});

test('aplikacja na komputer zawiera wszystkie pliki gry', () => {
  const pkg = JSON.parse(read('package.json'));
  const files = pkg.build.files;
  for (const entry of ['index.html', 'css/**', 'src/**', 'fonts/**', 'icons/**', 'desktop/**']) {
    assert.ok(files.includes(entry), `brak w build.files: ${entry}`);
  }
  assert.equal(pkg.main, 'desktop/main.cjs');
});

test('aplikacja na Androida nie prosi o dostęp do internetu', () => {
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  assert.doesNotMatch(manifest, /android\.permission\.INTERNET/);
  const cap = JSON.parse(read('capacitor.config.json'));
  assert.equal(cap.webDir, 'www');
  assert.equal(cap.server, undefined, 'aplikacja ma wczytywać grę z plików, nie z serwera');
});
