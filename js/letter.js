/**
 * letter.js
 * Manages letter tiles on the map – placement, collection, drop-back.
 */

const LetterModule = (() => {

  // Weighted letter frequency (relative weights, sum ≈ 100)
  const LETTER_WEIGHTS = {
    A:8, B:2, C:3, D:4, E:12, F:2, G:2, H:6, I:7, J:1, K:1, L:4,
    M:2, N:7, O:8, P:2, Q:1, R:6, S:6, T:9, U:3, V:1, W:2, X:1, Y:2, Z:1
  };

  const RARE_LETTERS = new Set(['Q','Z','X','J']);

  // Build cumulative distribution for O(1) weighted random pick
  const LETTERS = Object.keys(LETTER_WEIGHTS);
  const CUM_WEIGHTS = [];
  let total = 0;
  for (const l of LETTERS) {
    total += LETTER_WEIGHTS[l];
    CUM_WEIGHTS.push(total);
  }

  function randomLetter() {
    const r = Math.random() * total;
    for (let i = 0; i < CUM_WEIGHTS.length; i++) {
      if (r < CUM_WEIGHTS[i]) return LETTERS[i];
    }
    return LETTERS[LETTERS.length - 1];
  }

  function isRare(letter) { return RARE_LETTERS.has(letter.toUpperCase()); }

  /**
   * letters: Map<string, {r, c, letter}> keyed by "r,c"
   * Initialise letters on all path tiles, leaving spawn zones clear.
   */
  function initLetters(spawnZones) {
    const letters = new Map();
    const pathTiles = MapModule.getPathTiles();
    const spawnSet = new Set(spawnZones.map(({ r, c }) => `${r},${c}`));
    // Power-up positions are also excluded (handled in game.js after powerup init)
    for (const { r, c } of pathTiles) {
      if (spawnSet.has(`${r},${c}`)) continue;
      letters.set(`${r},${c}`, { r, c, letter: randomLetter() });
    }
    return letters;
  }

  /**
   * Drop a letter back to the nearest empty path tile relative to (fromR, fromC).
   * Returns the new {r,c} or null.
   */
  function dropLetter(fromR, fromC, letter, letters, players) {
    const occupiedByPlayer = new Set(players.map(p => `${p.r},${p.c}`));
    const pos = MapModule.bfsNearestEmpty(fromR, fromC, (r, c) => {
      const key = `${r},${c}`;
      return !letters.has(key) && !occupiedByPlayer.has(key);
    });
    if (pos) {
      letters.set(`${pos.r},${pos.c}`, { r: pos.r, c: pos.c, letter });
    }
    return pos;
  }

  return { randomLetter, isRare, initLetters, dropLetter };
})();
