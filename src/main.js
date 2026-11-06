import { Game } from './game.js';
import { createUI } from './ui.js';
import { isApp, setupInstall } from './install.js';

createUI(new Game());

if (!isApp()) {
  // Gra w przeglądarce: na telefonie zaproponuj aplikację…
  setupInstall();
  // …i zapamiętaj pliki, żeby działała też bez internetu.
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
