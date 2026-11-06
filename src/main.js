import { Game } from './game.js';
import { createUI } from './ui.js';

createUI(new Game());

// Gra w przeglądarce: zapamiętaj pliki, żeby działała też bez internetu.
// (Aplikacje na komputer i telefon mają pliki w sobie i tego nie potrzebują.)
const isApp = !location.protocol.startsWith('http') || globalThis.Capacitor?.isNativePlatform?.();
if ('serviceWorker' in navigator && !isApp) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
