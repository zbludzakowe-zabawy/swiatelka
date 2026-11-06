// Generuje icons/icon.svg oraz pliki PNG (favicon, apple-touch, 192, 512).
// Użycie: npm run icons   (PNG wymagają zainstalowanego pakietu playwright z Chromium)
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// Wzór zapalonych lamp na ikonie: krzyżyk w środku + pojedyncze światła.
const LIT = new Set([23, 32, 33, 34, 43, 11, 55, 15]);

function svg() {
  const size = 512, pad = 56, gap = 18;
  const cell = (size - 2 * pad - 4 * gap) / 5, r = cell / 2;
  let lamps = '';
  for (let row = 1; row <= 5; row++) {
    for (let col = 1; col <= 5; col++) {
      const cx = pad + (col - 1) * (cell + gap) + r, cy = pad + (row - 1) * (cell + gap) + r;
      const on = LIT.has(row * 10 + col);
      lamps += on
        ? `<circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="url(#glow)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#on)" stroke="#ffc94a" stroke-width="3"/>`
        : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#off)" stroke="#2c333e" stroke-width="3"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
<defs>
<radialGradient id="on" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff3c4"/><stop offset=".6" stop-color="#ffc94a"/><stop offset="1" stop-color="#f0a92a"/></radialGradient>
<radialGradient id="off" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#303846"/><stop offset=".7" stop-color="#252b35"/></radialGradient>
<radialGradient id="glow"><stop offset=".55" stop-color="#ffbe3c" stop-opacity=".6"/><stop offset="1" stop-color="#ffbe3c" stop-opacity="0"/></radialGradient>
</defs>
<rect width="512" height="512" rx="96" fill="#1b2028"/>
<rect x="8" y="8" width="496" height="496" rx="90" fill="none" stroke="#2c333e" stroke-width="4"/>
${lamps}
</svg>
`;
}

const source = svg();
writeFileSync('icons/icon.svg', source);
console.log('icons/icon.svg');

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { console.warn('Brak playwright — pominięto generowanie PNG.'); process.exit(0); }

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, px] of [['favicon-32.png', 32], ['icon-180.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  await page.setViewportSize({ width: px, height: px });
  await page.setContent(`<style>html,body{margin:0;background:transparent}</style>${source.replace('width="512" height="512"', `width="${px}" height="${px}"`)}`);
  await page.screenshot({ path: `icons/${name}`, omitBackground: true });
  console.log(`icons/${name}`);
}
await browser.close();
