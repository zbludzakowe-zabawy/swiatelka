<p align="center"><img src="icons/icon.svg" width="128" alt="Ikona gry: plansza 5×5 z zapalonymi światełkami"></p>

# Gra w światełka

Gra w wygaszanie światełek na planszy 5×5. Przejdź 10 coraz trudniejszych plansz.

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
serwera plików statycznych, np. GitHub Pages.

## Testy

Wymagany Node.js 18+ (bez dodatkowych pakietów):

```bash
npm test
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
icons/                ikona gry (SVG + PNG)
scripts/make-icons.js generator ikon: npm run icons
```

Plansza nr *k* powstaje przez wykonanie `zrob_krzyzyk` na *k+1* losowych, różnych kafelkach
zgaszonej planszy, więc każda plansza na pewno ma rozwiązanie.

## Licencja

BSD 2-Clause — zobacz [LICENSE](LICENSE).
