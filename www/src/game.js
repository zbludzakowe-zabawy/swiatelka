// Stan rozgrywki: poziom, plansza, historia ruchów — bez DOM.
import { ALL, allOff, countLit, generate, zrobKrzyzyk } from './board.js';

export const LEVELS = 10;

export class Game {
  /** @param {{levels?: number, rng?: () => number}} [opts] */
  constructor({ levels = LEVELS, rng = Math.random } = {}) {
    this.levels = levels;
    this.rng = rng;
    this.loadLevel(1);
  }

  loadLevel(k) {
    this.level = k;
    this.start = generate(k, this.rng); // stan początkowy bieżącej planszy
    this.state = { ...this.start };     // numer kafelka -> 0/1
    this.history = [];                  // naciśnięte kafelki na bieżącej planszy
  }

  get moves() { return this.history.length; }
  get lit() { return countLit(this.state); }
  /** Bieżąca plansza zgaszona. */
  get won() { return allOff(this.state); }
  /** Zgaszona ostatnia plansza — cała gra wygrana. */
  get finished() { return this.won && this.level === this.levels; }

  /** Naciśnięcie kafelka. Zwraca false, gdy ruch jest niedozwolony. */
  press(n) {
    if (this.won || !ALL.includes(n)) return false;
    zrobKrzyzyk(this.state, n);
    this.history.push(n);
    return true;
  }

  undo() {
    if (!this.history.length || this.won) return false;
    zrobKrzyzyk(this.state, this.history.pop());
    return true;
  }

  reset() {
    this.state = { ...this.start };
    this.history = [];
  }

  next() {
    if (!this.won || this.finished) return false;
    this.loadLevel(this.level + 1);
    return true;
  }

  newGame() { this.loadLevel(1); }
}
