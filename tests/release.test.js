// Spójność wydań: numer wersji, pliki publikowane w Releases i workflowy budujące.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json'));
const release = read('.github/workflows/release.yml');

test('wersja w package.json ma postać X.Y.Z (z niej powstaje tag wydania vX.Y.Z)', () => {
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
});

test('wydanie zawiera pliki wszystkich systemów', () => {
  const b = pkg.build;
  const targets = [[b.nsis, 'exe'], [b.portable, 'exe'], [b.dmg, 'dmg'], [b.appImage, 'AppImage'], [b.deb, 'deb']];
  for (const [cfg, ext] of targets) {
    assert.match(cfg.artifactName, /\.\$\{ext\}$/);
    assert.ok(release.includes(`dist/*.${ext}`), `brak dist/*.${ext} w release.yml`);
  }
});

test('wydanie buduje aplikacje przez workflow komputera', () => {
  assert.match(release, /uses: \.\/\.github\/workflows\/desktop\.yml/);
  const wf = read('.github/workflows/desktop.yml');
  assert.match(wf, /workflow_call:/);
  assert.match(wf, /branches-ignore: \[main\]/, 'na main buduje „Wydanie”');
});

test('nie ma już aplikacji na Androida (APK) — telefon instaluje grę ze strony (PWA)', () => {
  assert.doesNotMatch(release, /\.apk|android\.yml/);
  assert.equal(pkg.devDependencies['@capacitor/core'], undefined);
});
