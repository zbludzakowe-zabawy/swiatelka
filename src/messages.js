// Teksty komunikatów wyświetlanych pod planszą.

/** Odmiana słowa „ruch” po „w”: 1 ruchu, 2 ruchach… */
export const ruchy = n => (n === 1 ? 'ruchu' : 'ruchach');

export function statusMessage(game) {
  if (!game.won) return 'Zgaś wszystkie światła.';
  if (game.finished) return `Wygrałeś grę! Przeszedłeś wszystkie ${game.levels} plansz.`;
  return `Plansza ${game.level} zaliczona w ${game.moves} ${ruchy(game.moves)}.`;
}
