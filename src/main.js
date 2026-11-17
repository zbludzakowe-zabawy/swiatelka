import { Game } from './game.js';
import { createUI } from './ui.js';
import { setupInstall, setupUpdates } from './pwa.js';
import { setupShare } from './share.js';

createUI(new Game());
setupShare();

// Gra z przeglądarki (także zainstalowana jako aplikacja, PWA): pliki w pamięci, żeby działała
// bez internetu, pasek „Dostępna nowa wersja” i — dopóki nie jest zainstalowana — propozycja
// instalacji. W aplikacji na komputer (app://) niczego z tego nie trzeba.
if (location.protocol.startsWith('http')) {
  setupUpdates();
  setupInstall();
}
