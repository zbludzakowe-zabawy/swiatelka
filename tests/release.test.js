// Spójność wydań: numer wersji, pliki publikowane w Releases i workflowy budujące.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const pkg = JSON.parse(read('package.json'));
const release = read('.github/workflows/release.yml');

test('wersja w package.json ma postać X.Y.Z (z niej powstaje versionCode Androida)', () => {
  const m = pkg.version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  assert.ok(m, pkg.version);
  assert.ok(Number(m[2]) < 100 && Number(m[3]) < 100, 'minor i patch muszą być < 100');
  assert.match(read('android/app/build.gradle'), /versionName appVersion/);
});

test('wydanie zawiera pliki wszystkich systemów', () => {
  const b = pkg.build;
  const targets = [[b.nsis, 'exe'], [b.portable, 'exe'], [b.dmg, 'dmg'], [b.appImage, 'AppImage'], [b.deb, 'deb']];
  for (const [cfg, ext] of targets) {
    assert.match(cfg.artifactName, /\.\$\{ext\}$/);
    assert.ok(release.includes(`dist/*.${ext}`), `brak dist/*.${ext} w release.yml`);
  }
  assert.ok(release.includes('dist/*.apk'));
  assert.match(read('.github/workflows/android.yml'), /out\/Swiatelka-android\.apk/);
});

test('wydanie buduje aplikacje przez workflowy komputera i Androida', () => {
  assert.match(release, /uses: \.\/\.github\/workflows\/desktop\.yml/);
  assert.match(release, /uses: \.\/\.github\/workflows\/android\.yml/);
  for (const f of ['desktop', 'android']) {
    const wf = read(`.github/workflows/${f}.yml`);
    assert.match(wf, /workflow_call:/, f);
    assert.match(wf, /branches-ignore: \[main\]/, `${f}: na main buduje „Wydanie”`);
  }
});
