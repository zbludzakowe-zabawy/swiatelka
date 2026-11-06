<p align="center"><img src="icons/icon.svg" width="128" alt="Ikona gry: plansza 5×5 z zapalonymi światełkami"></p>

# Gra w światełka

Gra w wygaszanie światełek na planszy 5×5. Przejdź 10 coraz trudniejszych plansz.

**Zagraj online:** <https://zbludzakowe-zabawy.github.io/swiatelka/>

## Wersja na komputer (bez internetu)

Grę można zainstalować na komputerze — działa wtedy **całkowicie bez internetu**
(wszystkie pliki, łącznie z czcionkami, są w aplikacji).

Pobierz plik dla swojego systemu z zakładki
[**Releases**](https://github.com/zbludzakowe-zabawy/swiatelka/releases):

| System | Plik | Jak zainstalować |
|---|---|---|
| **Windows** | `Swiatelka-…-instalator-windows.exe` | uruchom i przejdź przez instalator; skrót pojawi się na pulpicie i w menu Start |
| Windows (bez instalacji) | `Swiatelka-…-windows-bez-instalacji.exe` | po prostu uruchom — np. z pendrive’a |
| **macOS** | `Swiatelka-…-macos.dmg` | otwórz i przeciągnij grę do *Aplikacje* |
| **Linux** | `Swiatelka-…-linux-x86_64.AppImage` | nadaj prawo wykonania (`chmod +x`) i uruchom |
| Linux (Debian/Ubuntu) | `swiatelka_…_amd64.deb` | `sudo apt install ./swiatelka_…_amd64.deb` |

Aplikacja nie jest podpisana cyfrowo, więc przy pierwszym uruchomieniu system może ostrzec:
na Windows kliknij *Więcej informacji → Uruchom mimo to*, na macOS kliknij ikonę
prawym przyciskiem → *Otwórz*.

Instalatory budują się automatycznie (workflow `.github/workflows/desktop.yml`):
przy każdej zmianie są do pobrania w zakładce *Actions* (sekcja *Artifacts*),
a po wypchnięciu tagu, np. `git tag v1.0.0 && git push origin v1.0.0`,
trafiają do nowego wydania w *Releases*.

Gra otwarta w przeglądarce też działa bez internetu po pierwszym wczytaniu
(service worker `sw.js`), a w Chrome/Edge można ją zainstalować ikoną „Zainstaluj” w pasku adresu.

## Jak grać

1. Na planszy 5×5 część lampek świeci.
2. Kliknięcie lampki zmienia jej stan **oraz stan sąsiadów** z góry, z dołu, z lewej i z prawej
   (zapalona gaśnie, zgaszona się zapala) — powstaje „krzyżyk”.
3. Planszę przechodzisz, gdy **wszystkie lampki są zgaszone**. Kliknij wtedy *Następna plansza*.
4. Grę wygrywasz po przejściu **10 plansz**. Każda kolejna plansza jest trudniejsza
   i ma inny kolor światełek.

Przyciski:

| Przycisk | Działanie |
|---|---|
| **Cofnij ruch** | cofa ostatnie kliknięcie |
| **Od nowa tę planszę** | przywraca bieżącą planszę do stanu początkowego |
| **Następna plansza** | pojawia się po zgaszeniu wszystkich świateł |
| **Zagraj ponownie** / **Nowa gra** | zaczyna od planszy 1 |

**Wskazówka:** gaś światła wiersz po wierszu — jeśli w wierszu powyżej coś świeci,
kliknij lampkę bezpośrednio pod nią. Na końcu zostaną światła tylko w ostatnim wierszu.

## Uruchomienie

Gra to zwykła strona HTML z modułami JavaScript, bez instalowania zależności.
Moduły ES wymagają serwera (otwarcie pliku `index.html` z dysku nie zadziała):

```bash
npm start
```

i otwórz <http://localhost:8000> w przeglądarce. Zamiast `npm start` można użyć dowolnego
serwera plików statycznych.

Każda zmiana w gałęzi `main` jest automatycznie testowana i publikowana na GitHub Pages
(workflow `.github/workflows/pages.yml`).

### Aplikacja na komputer ze źródeł

```bash
npm install
npm run desktop      # uruchamia grę w oknie aplikacji
npm run dist         # buduje instalator dla bieżącego systemu (do katalogu dist/)
```

`npm run dist:win`, `dist:mac`, `dist:linux` budują dla konkretnego systemu
(Windows najłatwiej budować na Windows, macOS — na macOS).

## Testy

Wymagany Node.js 18+ (bez dodatkowych pakietów):

```bash
npm test
```

Test aplikacji na komputer uruchamia prawdziwe okno gry z zablokowanym internetem,
rozwiązuje planszę i sprawdza, że aplikacja nie łączy się z siecią
(na Linuksie bez ekranu: `xvfb-run -a npm run test:desktop`):

```bash
npm run test:desktop
```

## Struktura projektu

```
index.html            strona gry
css/style.css         wygląd
src/board.js          logika planszy: sąsiedzi, zrob_krzyzyk, losowanie plansz
src/game.js           stan rozgrywki: poziomy, ruchy, cofanie, reset
src/colors.js         kolory światełek dla kolejnych plansz
src/messages.js       komunikaty dla gracza
src/ui.js             obsługa widoku (DOM)
src/main.js           punkt startowy
tests/                testy (node:test)
sw.js                 service worker — gra w przeglądarce działa bez internetu
fonts/                czcionki dołączone lokalnie (SIL OFL 1.1)
desktop/main.cjs      aplikacja na komputer (Electron)
tests-desktop/        test aplikacji na komputer: npm run test:desktop
icons/                ikona gry (SVG + PNG)
scripts/make-icons.js generator ikon: npm run icons
```

Plansza nr *k* powstaje przez wykonanie `zrob_krzyzyk` na *k+1* losowych, różnych kafelkach
zgaszonej planszy, więc każda plansza na pewno ma rozwiązanie.

## Licencja

BSD 2-Clause — zobacz [LICENSE](LICENSE).
