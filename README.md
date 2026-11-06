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

## Wersja na telefon (bez internetu)

Wystarczy otworzyć <https://zbludzakowe-zabawy.github.io/swiatelka/> na telefonie — na dole
pojawi się propozycja instalacji (do ukrycia przyciskiem ×; wraca po tygodniu).

**Android:** stuknij **Pobierz** w propozycji na stronie gry (albo pobierz plik
`Swiatelka-android.apk` z zakładki [**Releases**](https://github.com/zbludzakowe-zabawy/swiatelka/releases))
i otwórz go na telefonie.
Telefon zapyta o zgodę na instalację aplikacji „z nieznanego źródła” — zezwól przeglądarce
lub menedżerowi plików. Aplikacja **nie ma nawet uprawnienia do internetu**.

**iPhone / iPad:** otwórz stronę gry w Safari i — jak podpowiada pasek na dole — stuknij
*Udostępnij* → *Do ekranu początkowego*. Gra dostanie własną ikonę, otworzy się na pełnym
ekranie i po pierwszym otwarciu będzie działać bez internetu.
(Ten sam sposób działa na Androidzie w Chrome: menu ⋮ → *Zainstaluj aplikację*.)

Aplikacji na iPhone’a nie da się rozdawać jako pliku — wymaga to konta Apple Developer
(płatnego) i publikacji w App Store, dlatego dla iPhone’a jest wersja z przeglądarki.

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

### Aplikacja na Androida ze źródeł

Projekt Androida (Capacitor) jest w katalogu `android/`. Potrzebne: Android Studio
(lub Android SDK) i Java 21.

```bash
npm install
npm run android         # kopiuje grę do www/ i aktualizuje projekt android/
npm run android:open    # otwiera projekt w Android Studio
```

albo bez Android Studio: `cd android && ./gradlew assembleDebug` — plik APK pojawi się w
`android/app/build/outputs/apk/debug/`. Ikony aplikacji generuje `npm run icons`.

APK budowany w GitHub Actions (`.github/workflows/android.yml`) jest podpisany kluczem
testowym, który zmienia się przy każdym budowaniu — przed instalacją nowszej wersji trzeba
odinstalować starą. Aby podpisywać stałym kluczem, utwórz go raz:

```bash
keytool -genkeypair -v -keystore swiatelka.jks -alias swiatelka -keyalg RSA -keysize 4096 -validity 10000
```

i dodaj w *Settings → Secrets and variables → Actions* sekrety: `ANDROID_KEYSTORE_BASE64`
(wynik `base64 -w0 swiatelka.jks`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`
(`swiatelka`) i `ANDROID_KEY_PASSWORD`. Pliku `.jks` nie dodawaj do repozytorium i nie zgub go
— bez niego nie da się wydać aktualizacji.

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
sprawdza propozycję instalacji aplikacji, przycisk „Nie teraz” i grę bez internetu.

Test na Androida (`npm run test:android`) wymaga emulatora lub telefonu podłączonego przez
`adb` z zainstalowaną wersją debug. Włącza tryb samolotowy, sprawdza, że aplikacja nie ma
uprawnienia do internetu, i przechodzi planszę 1. W GitHub Actions uruchamia się w emulatorze
przy każdej zmianie.

## Struktura projektu

```
index.html            strona gry
css/style.css         wygląd
src/board.js          logika planszy: sąsiedzi, zrob_krzyzyk, losowanie plansz
src/game.js           stan rozgrywki: poziomy, ruchy, cofanie, reset
src/colors.js         kolory światełek dla kolejnych plansz
src/messages.js       komunikaty dla gracza
src/ui.js             obsługa widoku (DOM)
src/install.js        propozycja instalacji aplikacji na telefonie
src/main.js           punkt startowy
tests/                testy (node:test)
sw.js                 service worker — gra w przeglądarce działa bez internetu
fonts/                czcionki dołączone lokalnie (SIL OFL 1.1)
desktop/main.cjs      aplikacja na komputer (Electron)
android/              aplikacja na Androida (Capacitor)
capacitor.config.json ustawienia aplikacji na Androida
scripts/build-web.js  kopiuje pliki gry do www/ (dla Androida)
tests-apps/           testy aplikacji: npm run test:desktop, npm run test:android
icons/                ikona gry (SVG + PNG)
scripts/make-icons.js generator ikon: npm run icons
```

Plansza nr *k* powstaje przez wykonanie `zrob_krzyzyk` na *k+1* losowych, różnych kafelkach
zgaszonej planszy, więc każda plansza na pewno ma rozwiązanie.

## Licencja

BSD 2-Clause — zobacz [LICENSE](LICENSE).
