// Przycisk „Udostępnij”: zaproszenie do gry dla znajomych.
// Zawsze stały adres opublikowanej gry — nie location.href, bo zainstalowana aplikacja,
// aplikacja na komputer (app://) i testy działają pod innymi adresami.
// Kolejno: systemowe okno udostępniania (telefon) → kopiowanie do schowka → komunikat z adresem.

export const SHARE_URL = 'https://zbludzakowe-zabawy.github.io/swiatelka/';
export const SHARE = {
  title: 'Gra w światełka',
  text: 'Zagraj ze mną w światełka — zgaś wszystkie lampki na 10 planszach!',
  url: SHARE_URL,
};

/**
 * Udostępnia grę. Zwraca, co się stało: 'shared', 'cancelled', 'copied' albo 'shown'.
 * @param {{share?: Function, clipboard?: {writeText: Function}}} nav
 * @param {(msg: string, ms: number) => void} toast
 */
export async function shareGame(nav, toast) {
  if (typeof nav?.share === 'function') {
    try {
      await nav.share(SHARE);
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled';   // gracz zamknął okno — to nie błąd
    }
  }
  try {
    await nav.clipboard.writeText(SHARE_URL);
    toast('Skopiowano link — wklej go w wiadomości', 3500);
    return 'copied';
  } catch {
    toast(`Adres gry: ${SHARE_URL}`, 6000);
    return 'shown';
  }
}

/** Krótki komunikat na dole ekranu (element #toast). */
export function makeToast(doc = document) {
  let timer;
  return (msg, ms = 3000) => {
    const el = doc.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { el.hidden = true; }, ms);
  };
}

/** Podpina wszystkie przyciski z atrybutem data-share. */
export function setupShare(doc = document, nav = globalThis.navigator) {
  const toast = makeToast(doc);
  const buttons = [...doc.querySelectorAll('[data-share]')];
  buttons.forEach(b => b.addEventListener('click', () => shareGame(nav, toast)));
  return buttons.length;
}
