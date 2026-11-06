// Kopiuje pliki gry do katalogu www/ — z niego Capacitor buduje aplikację na telefon.
// Użycie: npm run build:web
import { cpSync, rmSync, mkdirSync } from 'node:fs';

const FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'src', 'icons', 'fonts'];
rmSync('www', { recursive: true, force: true });
mkdirSync('www');
for (const f of FILES) cpSync(f, `www/${f}`, { recursive: true });
console.log(`www/: ${FILES.join(', ')}`);
