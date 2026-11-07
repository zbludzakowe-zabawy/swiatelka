// Publikowana strona (_site/): wszystkie pliki gry i wersja service workera zależna od zawartości.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSite, siteVersion, SITE_FILES } from '../scripts/build-site.js';

test('strona zawiera pliki gry, a sw.js — wersję ze skrótu zawartości', () => {
  const out = mkdtempSync(join(tmpdir(), 'swiatelka-site-'));
  try {
    const version = buildSite(out);
    assert.match(version, /^[0-9a-f]{12}$/);
    for (const f of SITE_FILES) assert.ok(existsSync(join(out, f)), f);
    const sw = readFileSync(join(out, 'sw.js'), 'utf8');
    assert.ok(sw.includes(`const VERSION = '${version}';`));
    assert.ok(!sw.includes("'dev'"));

    // Ta sama zawartość — ta sama wersja; zmiana dowolnego pliku — nowa.
    assert.equal(siteVersion(out), version);
    writeFileSync(join(out, 'css/style.css'), readFileSync(join(out, 'css/style.css'), 'utf8') + '\n/* zmiana */');
    assert.notEqual(siteVersion(out), version);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test('GitHub Pages publikuje stronę zbudowaną przez build-site.js', () => {
  const wf = readFileSync(new URL('../.github/workflows/pages.yml', import.meta.url), 'utf8');
  assert.match(wf, /node scripts\/build-site\.js _site/);
});
