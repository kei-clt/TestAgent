/**
 * player.js
 * Player state, movement, tray management, scoring.
 */

const PlayerModule = (() => {

  const MAX_TRAY = 10;
  const BASE_SPEED_MS = 160; // ms between moves at normal speed
  const SPEED_BOOST_MULT = 2;

  const RARE_LETTERS = new Set(['Q','Z','X','J']);

  const SCORE_TABLE = { 3:10, 4:20, 5:35, 6:55 };
  function calcScore(word) {
    const len = word.length;
    let pts = len >= 7 ? 80 + (len - 7) * 10 : (SCORE_TABLE[len] || 0);
    for (const ch of word.toUpperCase()) {
      if (RARE_LETTERS.has(ch)) pts += 5;
    }
    return pts;
  }

  /**
   * Create a player object.
   * id: 1 or 2
   * startR, startC: grid spawn position
   * controls: { up, down, left, right, confirm, kick } – key codes/keys
   * color: CSS color string
   */
  function create(id, startR, startC, controls, color) {
    return {
      id,
      r: startR,
      c: startC,
      color,
      controls,
      tray: [],          // array of letter chars, in order collected
      score: 0,
      wordsFormed: [],   // [{word, pts}]
      // movement
      lastMoveTime: 0,
      moveInterval: BASE_SPEED_MS,
      pendingDir: null,  // { dr, dc }
      // power-up state
      frozen: false,
      frozenUntil: 0,
      speedUntil: 0,
      activePowerupLabel: '',
      activePowerupUntil: 0,
    };
  }

  /**
   * Queue a directional move for a player.
   */
  function queueMove(player, dr, dc) {
    player.pendingDir = { dr, dc };
  }

  /**
   * Attempt to execute the pending move. Returns true if moved.
   * letters: Map<"r,c", {letter}> – to collect letters automatically
   * powerups: array from PowerupModule
   * otherPlayer: the opponent
   * now: timestamp
   * callbacks: { onCollectLetter, onCollectPowerup }
   */
  function tryMove(player, letters, powerups, otherPlayer, now, callbacks) {
    if (!player.pendingDir) return false;

    // Frozen?
    if (player.frozen && now < player.frozenUntil) {
      player.pendingDir = null;
      return false;
    } else if (player.frozen) {
      player.frozen = false;
    }

    // Speed boost
    const speedActive = now < player.speedUntil;
    const interval = speedActive ? BASE_SPEED_MS / SPEED_BOOST_MULT : BASE_SPEED_MS;
    if (now - player.lastMoveTime < interval) return false;

    const { dr, dc } = player.pendingDir;
    player.pendingDir = null;

    const nr = player.r + dr;
    const nc = player.c + dc;
    if (!MapModule.isPath(nr, nc)) return false;

    // Don't allow moving into opponent's tile (soft block)
    if (nr === otherPlayer.r && nc === otherPlayer.c) return false;

    player.r = nr;
    player.c = nc;
    player.lastMoveTime = now;

    // Collect letter
    const key = `${nr},${nc}`;
    if (letters.has(key)) {
      const tile = letters.get(key);
      if (player.tray.length < MAX_TRAY) {
        player.tray.push(tile.letter);
        letters.delete(key);
        callbacks.onCollectLetter(player, tile.letter);
      }
    }

    // Collect power-up
    const pu = PowerupModule.collect(powerups, nr, nc, now);
    if (pu) callbacks.onCollectPowerup(player, pu, otherPlayer, now);

    return true;
  }

  /**
   * Confirm the word in the tray.
   * Returns { word, pts } if valid, null otherwise.
   */
  function confirmWord(player, letters, players) {
    const word = player.tray.join('');
    if (word.length < 3) return null;
    if (!WordValidator.isValid(word)) return null;

    const pts = calcScore(word);
    player.score += pts;
    player.wordsFormed.push({ word, pts });
    player.tray = [];
    return { word, pts };
  }

  /**
   * Kick the last letter from the tray back to the map.
   * Returns the dropped letter char or null.
   */
  function kickLastLetter(player, letters, players) {
    if (player.tray.length === 0) return null;
    const letter = player.tray.pop();
    LetterModule.dropLetter(player.r, player.c, letter, letters, players);
    return letter;
  }

  /**
   * Apply a power-up effect to the collecting player and their opponent.
   */
  function applyPowerup(player, pu, opponent, now) {
    switch (pu.type) {
      case 'speed':
        player.speedUntil = now + 5000;
        player.activePowerupLabel = `⚡ Speed 5s`;
        player.activePowerupUntil = now + 5000;
        break;
      case 'freeze':
        opponent.frozen = true;
        opponent.frozenUntil = now + 3000;
        player.activePowerupLabel = `❄ Froze P${opponent.id}!`;
        player.activePowerupUntil = now + 1500;
        break;
      case 'bonus':
        player.activePowerupLabel = `★ Bonus Drop!`;
        player.activePowerupUntil = now + 1500;
        // Actual letter drop is handled by game.js
        break;
    }
  }

  return { create, queueMove, tryMove, confirmWord, kickLastLetter, applyPowerup, calcScore, MAX_TRAY };
})();
