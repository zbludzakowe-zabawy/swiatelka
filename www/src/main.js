import { Game } from './game.js';
import { createUI } from './ui.js';

createUI(new Game());

// Gra w przeglądarce: zapamiętaj pliki, żeby działała też bez internetu.
// (Wersja na komputer wczytuje pliki z dysku i tego nie potrzebuje.)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
