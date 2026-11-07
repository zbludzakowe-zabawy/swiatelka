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
(service worker `sw.js`), a w Chrome/Edge można ją zainstalować przyciskiem **Zainstaluj**
(jak na telefonie, patrz niżej).

## Wersja na telefon (aplikacja z przeglądarki, bez internetu)

Na telefon gra instaluje się prosto ze strony jako aplikacja (PWA) — bez pobierania plików,
bez zgody na „nieznane źródła” i bez sklepu. Otwórz <https://zbludzakowe-zabawy.github.io/swiatelka/>:

**Android (Chrome, Edge, Samsung Internet):** na dole pojawi się pasek *Zagraj w aplikacji* —
stuknij **Zainstaluj** i potwierdź. (Jeśli paska nie ma: menu ⋮ → *Zainstaluj aplikację*
lub *Dodaj do ekranu głównego*.)

**iPhone / iPad (Safari):** jak podpowiada pasek na dole, stuknij *Udostępnij* →
*Do ekranu początkowego*.

Gra dostaje własną ikonę, otwiera się na pełnym ekranie i po pierwszym otwarciu działa
**bez internetu**. Pasek propozycji można ukryć przyciskiem × (wraca po tygodniu).

**Aktualizacje:** po opublikowaniu nowej wersji zainstalowana gra pokaże pasek
*Dostępna nowa wersja* — **Odśwież** włącza ją od razu, **Później** zostawia obecną
(nowa włączy się sama przy następnym uruchomieniu gry).

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

i otwórz <http://localhost:8000> w przeglądarce. `npm start` buduje stronę do katalogu `_site/`
(`npm run build`, czyli `scripts/build-site.js`) i ją serwuje — po zmianie plików uruchom go ponownie.

Każda zmiana w gałęzi `main` jest automatycznie testowana i publikowana na GitHub Pages
(workflow `.github/workflows/pages.yml`). Przy publikacji `scripts/build-site.js` wpisuje do
`sw.js` wersję — skrót zawartości wszystkich plików — więc każda zmiana gry to nowa wersja,
którą gracze dostają przez pasek *Dostępna nowa wersja*.

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

Testy aplikacji (`tests-apps/`). Test na komputer uruchamia prawdziwe okno gry z zablokowanym internetem,
rozwiązuje planszę i sprawdza, że aplikacja nie łączy się z siecią
(na Linuksie bez ekranu: `xvfb-run -a npm run test:desktop`):

```bash
npm run test:desktop
```

Test strony w przeglądarce (`npm run test:web`) emuluje Androida, iPhone’a i komputer:
sprawdza propozycję instalacji (przycisk *Zainstaluj*, podpowiedź dla iPhone’a, „Nie teraz”),
grę bez internetu i pasek *Dostępna nowa wersja*.

## Struktura projektu

```
index.html            strona gry
css/style.css         wygląd
src/board.js          logika planszy: sąsiedzi, zrob_krzyzyk, losowanie plansz
src/game.js           stan rozgrywki: poziomy, ruchy, cofanie, reset
src/colors.js         kolory światełek dla kolejnych plansz
src/messages.js       komunikaty dla gracza
src/ui.js             obsługa widoku (DOM)
src/pwa.js            instalacja gry ze strony (PWA) i pasek „Dostępna nowa wersja”
src/main.js           punkt startowy
tests/                testy (node:test)
sw.js                 service worker — gra w przeglądarce działa bez internetu
fonts/                czcionki dołączone lokalnie (SIL OFL 1.1)
desktop/main.cjs      aplikacja na komputer (Electron)
scripts/build-site.js strona do publikacji w _site/ (z wersją w sw.js)
manifest.webmanifest  opis aplikacji (nazwa, ikony) do instalacji ze strony
tests-apps/           testy aplikacji: npm run test:desktop, npm run test:web
icons/                ikona gry (SVG + PNG)
scripts/make-icons.js generator ikon: npm run icons
```

Plansza nr *k* powstaje przez wykonanie `zrob_krzyzyk` na *k+1* losowych, różnych kafelkach
zgaszonej planszy, więc każda plansza na pewno ma rozwiązanie.

## Licencja

BSD 2-Clause — zobacz [LICENSE](LICENSE).
