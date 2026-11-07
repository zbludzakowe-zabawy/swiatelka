// Przygotowuje stronę do publikacji (GitHub Pages) w katalogu _site/:
// kopiuje pliki gry i wpisuje do sw.js wersję — skrót zawartości wszystkich plików.
// Dzięki temu każda zmiana gry to nowy service worker, a gracze widzą „Dostępna nowa wersja”.
// Użycie: npm run build   (katalog wyjściowy można podać: node scripts/build-site.js inny/)
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

export const SITE_FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'src', 'icons', 'fonts'];

const listFiles = dir => readdirSync(dir, { withFileTypes: true })
  .flatMap(e => (e.isDirectory() ? listFiles(join(dir, e.name)) : [join(dir, e.name)]));

/** Skrót zawartości plików strony (bez sw.js) — wersja gry. */
export function siteVersion(dir) {
  const hash = createHash('sha256');
  for (const f of listFiles(dir).filter(f => relative(dir, f) !== 'sw.js').sort()) {
    hash.update(relative(dir, f).split('\\').join('/')).update(readFileSync(f));
  }
  return hash.digest('hex').slice(0, 12);
}

export function buildSite(out = '_site') {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const f of SITE_FILES) cpSync(join(ROOT, f), join(out, f), { recursive: true });
  const version = siteVersion(out);
  const sw = readFileSync(join(out, 'sw.js'), 'utf8');
  if (!sw.includes("const VERSION = 'dev';")) throw new Error("sw.js: brak linii const VERSION = 'dev';");
  writeFileSync(join(out, 'sw.js'), sw.replace("const VERSION = 'dev';", `const VERSION = '${version}';`));
  return version;
}

if (process.argv[1]?.endsWith('build-site.js')) {
  const out = process.argv[2] || '_site';
  console.log(`${out}/: wersja ${buildSite(out)}`);
}
