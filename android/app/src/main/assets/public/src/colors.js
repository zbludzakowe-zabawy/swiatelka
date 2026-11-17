// Kolor zapalonych światełek dla każdej planszy: [kolor, środek, poświata]
export const COLORS = [
  ['#ffc94a', '#fff3c4', 'rgba(255,190,60,.55)'],
  ['#4ad8ff', '#d4f6ff', 'rgba(60,200,255,.55)'],
  ['#ff6fb5', '#ffd6ea', 'rgba(255,90,170,.55)'],
  ['#9be15d', '#e6ffd0', 'rgba(140,220,80,.55)'],
  ['#ff8a5c', '#ffe0d2', 'rgba(255,120,70,.55)'],
  ['#b18cff', '#ece2ff', 'rgba(170,130,255,.55)'],
  ['#3fe0c5', '#d2fff6', 'rgba(50,220,190,.55)'],
  ['#ff5c6c', '#ffd6da', 'rgba(255,80,100,.55)'],
  ['#f2f05a', '#fdfde0', 'rgba(240,235,80,.5)'],
  ['#ffffff', '#ffffff', 'rgba(220,235,255,.6)']
];

/** Paleta dla planszy k (numeracja od 1, cyklicznie). */
export function colorFor(k) {
  const [on, core, glow] = COLORS[(((k - 1) % COLORS.length) + COLORS.length) % COLORS.length];
  return { on, core, glow };
}
