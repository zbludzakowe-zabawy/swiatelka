// Warstwa widoku: budowa i odświeżanie DOM na podstawie obiektu Game.
import { ALL } from './board.js';
import { colorFor } from './colors.js';
import { statusMessage } from './messages.js';

export function createUI(game, doc = document) {
  const $ = id => doc.getElementById(id);
  const boardEl = $('board'), msgEl = $('msg'), progressEl = $('progress');
  const undoBtn = $('undo'), resetBtn = $('reset'), nextBtn = $('next'),
        restartBtn = $('restart'), newGameBtn = $('newgame');
  const tiles = {}, bars = [];

  function applyColor(k) {
    const { on, core, glow } = colorFor(k), st = doc.documentElement.style;
    st.setProperty('--lamp-on', on);
    st.setProperty('--lamp-core', core);
    st.setProperty('--lamp-glow', glow);
  }

  function render() {
    applyColor(game.level);
    ALL.forEach(n => {
      const on = game.state[n] === 1;
      tiles[n].classList.toggle('on', on);
      tiles[n].setAttribute('aria-label',
        `Wiersz ${Math.floor(n / 10)}, kolumna ${n % 10}, ${on ? 'zapalony' : 'zgaszony'}`);
    });
    const w = game.won, last = game.finished;
    bars.forEach((e, i) => {
      e.classList.toggle('done', i + 1 < game.level || (i + 1 === game.level && w));
      e.classList.toggle('current', i + 1 === game.level && !w);
    });
    $('level').textContent = `Plansza ${game.level} / ${game.levels}`;
    $('moves').textContent = game.moves;
    $('lit').textContent = game.lit;
    boardEl.classList.toggle('won', w);
    msgEl.classList.toggle('win', w);
    msgEl.textContent = statusMessage(game);
    undoBtn.hidden = resetBtn.hidden = w;
    undoBtn.disabled = game.moves === 0;
    nextBtn.hidden = !(w && !last);
    restartBtn.hidden = !last;
  }

  ALL.forEach(n => {
    const b = doc.createElement('button');
    b.type = 'button'; b.className = 'tile'; b.id = 't' + n;
    b.addEventListener('click', () => {
      if (!game.press(n)) return;
      render();
      if (game.won) (game.finished ? restartBtn : nextBtn).focus();
    });
    tiles[n] = b; boardEl.appendChild(b);
  });
  for (let i = 0; i < game.levels; i++) {
    const e = doc.createElement('i'); bars.push(e); progressEl.appendChild(e);
  }

  undoBtn.addEventListener('click', () => { game.undo(); render(); });
  resetBtn.addEventListener('click', () => { game.reset(); render(); });
  nextBtn.addEventListener('click', () => { game.next(); render(); });
  restartBtn.addEventListener('click', () => { game.newGame(); render(); });
  newGameBtn.addEventListener('click', () => { game.newGame(); render(); });

  render();
  return { render, tiles };
}
