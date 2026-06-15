/**
 * game.js
 * Central game loop – canvas rendering, input handling, game state machine.
 */

const Game = (() => {

  // ─── Canvas & rendering ───────────────────────────────────────────────────
  const COLORS = {
    bg:     '#0f172a',
    wall:   '#334155',
    path:   '#1e293b',
    tile:   '#f1f5f9',
    tileText:'#0f172a',
    p1:     '#3b82f6',
    p2:     '#ef4444',
    puSpeed:'#fb923c',
    puFreeze:'#67e8f9',
    puBonus:'#facc15',
    rare:   '#facc15',
  };

  const PU_COLORS = {
    speed:  COLORS.puSpeed,
    freeze: COLORS.puFreeze,
    bonus:  COLORS.puBonus,
  };

  let canvas, ctx;
  let letters, powerups, p1, p2;
  let gameRunning = false;
  let secondsLeft = 120;
  let timerInterval = null;
  let animFrameId = null;
  let offsetX = 0, offsetY = 0;
  let tileSize = MapModule.TILE;

  // ─── Input ────────────────────────────────────────────────────────────────
  const keysDown = new Set();

  function onKeyDown(e) {
    if (!gameRunning) return;
    keysDown.add(e.key);

    // P1 action keys
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      handleConfirm(p1);
    }
    if (e.key === 'g' || e.key === 'G') {
      e.preventDefault();
      handleKick(p1);
    }
    // P2 action keys
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm(p2);
    }
    if (e.key === 'Backspace') {
      e.preventDefault();
      handleKick(p2);
    }

    // Prevent page scroll for arrow keys / space
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
      e.preventDefault();
    }
  }

  function onKeyUp(e) { keysDown.delete(e.key); }

  function processDirectionalInput(now) {
    // P1: WASD
    if      (keysDown.has('w') || keysDown.has('W')) PlayerModule.queueMove(p1, -1,  0);
    else if (keysDown.has('s') || keysDown.has('S')) PlayerModule.queueMove(p1,  1,  0);
    else if (keysDown.has('a') || keysDown.has('A')) PlayerModule.queueMove(p1,  0, -1);
    else if (keysDown.has('d') || keysDown.has('D')) PlayerModule.queueMove(p1,  0,  1);
    else p1.pendingDir = null;

    // P2: Arrow keys
    if      (keysDown.has('ArrowUp'))    PlayerModule.queueMove(p2, -1,  0);
    else if (keysDown.has('ArrowDown'))  PlayerModule.queueMove(p2,  1,  0);
    else if (keysDown.has('ArrowLeft'))  PlayerModule.queueMove(p2,  0, -1);
    else if (keysDown.has('ArrowRight')) PlayerModule.queueMove(p2,  0,  1);
    else p2.pendingDir = null;
  }

  // ─── Word actions ─────────────────────────────────────────────────────────
  function handleConfirm(player) {
    const result = PlayerModule.confirmWord(player, letters, [p1, p2]);
    if (result) {
      UI.flash(`P${player.id}: "${result.word}" +${result.pts} pts 🎉`);
    } else if (player.tray.length < 3) {
      UI.flash(`P${player.id}: Need at least 3 letters`);
    } else {
      UI.flash(`P${player.id}: "${player.tray.join('')}" not a valid word`);
    }
  }

  function handleKick(player) {
    const dropped = PlayerModule.kickLastLetter(player, letters, [p1, p2]);
    if (dropped) {
      UI.flash(`P${player.id}: dropped '${dropped}'`);
    }
  }

  // ─── Power-up callback ────────────────────────────────────────────────────
  function onCollectPowerup(player, pu, opponent, now) {
    PlayerModule.applyPowerup(player, pu, opponent, now);
    if (pu.type === 'bonus') dropBonusLetters(5);
    UI.flash(`P${player.id} got ${PowerupModule.ICONS[pu.type]} ${pu.type}!`);
  }

  function dropBonusLetters(count) {
    const pathTiles = MapModule.getPathTiles();
    const playerKeys = new Set([`${p1.r},${p1.c}`, `${p2.r},${p2.c}`]);
    const emptyTiles = pathTiles.filter(({ r, c }) => {
      const k = `${r},${c}`;
      return !letters.has(k) && !playerKeys.has(k);
    });
    // shuffle
    for (let i = emptyTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [emptyTiles[i], emptyTiles[j]] = [emptyTiles[j], emptyTiles[i]];
    }
    for (let i = 0; i < Math.min(count, emptyTiles.length); i++) {
      const { r, c } = emptyTiles[i];
      letters.set(`${r},${c}`, { r, c, letter: LetterModule.randomLetter() });
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // P1 spawns top-left area, P2 bottom-right area
    p1 = PlayerModule.create(1, 1, 1, {}, COLORS.p1);
    p2 = PlayerModule.create(2, 19, 19, {}, COLORS.p2);

    // Power-ups (must be before letters so we can exclude their tiles)
    powerups = PowerupModule.initPowerups();

    // Letters on all path tiles except spawns and power-up positions
    const spawnZones = [
      { r:1, c:1 }, { r:1, c:2 }, { r:2, c:1 },
      { r:19, c:19 }, { r:19, c:18 }, { r:18, c:19 },
    ];
    letters = LetterModule.initLetters(spawnZones);

    // Remove letters from power-up positions
    for (const pu of powerups) {
      letters.delete(`${pu.r},${pu.c}`);
    }

    secondsLeft = 120;
    gameRunning = true;

    timerInterval = setInterval(() => {
      if (!gameRunning) return;
      secondsLeft = Math.max(0, secondsLeft - 1);
      if (secondsLeft === 0) endGame();
    }, 1000);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    requestAnimationFrame(loop);
  }

  function resizeCanvas() {
    const hud = document.getElementById('hud');
    const availH = window.innerHeight - hud.offsetHeight;
    const availW = window.innerWidth;

    // Choose tile size that fits the maze
    tileSize = Math.floor(Math.min(availW / MapModule.COLS, availH / MapModule.ROWS));
    tileSize = Math.max(16, Math.min(tileSize, 36));

    canvas.width  = MapModule.COLS * tileSize;
    canvas.height = MapModule.ROWS * tileSize;

    // Center canvas
    offsetX = Math.floor((availW - canvas.width) / 2);
    offsetY = 0;
    canvas.style.marginLeft = offsetX + 'px';
  }

  function destroy() {
    gameRunning = false;
    if (timerInterval) clearInterval(timerInterval);
    if (animFrameId)   cancelAnimationFrame(animFrameId);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('resize', resizeCanvas);
    keysDown.clear();
  }

  function endGame() {
    destroy();
    UI.showResult(p1, p2);
  }

  // ─── Game Loop ────────────────────────────────────────────────────────────
  function loop(now) {
    if (!gameRunning) return;
    animFrameId = requestAnimationFrame(loop);

    processDirectionalInput(now);

    const cbs = {
      onCollectLetter: (player, letter) => { /* tray updated in tryMove */ },
      onCollectPowerup,
    };

    PlayerModule.tryMove(p1, letters, powerups, p2, now, cbs);
    PlayerModule.tryMove(p2, letters, powerups, p1, now, cbs);

    PowerupModule.tick(powerups, now);

    render();
    UI.updateHUD(p1, p2, secondsLeft);
  }

  // ─── Rendering ────────────────────────────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const T = tileSize;

    // Tiles
    for (let r = 0; r < MapModule.ROWS; r++) {
      for (let c = 0; c < MapModule.COLS; c++) {
        const x = c * T, y = r * T;
        if (MapModule.TEMPLATE[r][c] === 0) {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(x, y, T, T);
          // Subtle inner shadow for walls
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.fillRect(x + T - 3, y, 3, T);
          ctx.fillRect(x, y + T - 3, T, 3);
        } else {
          ctx.fillStyle = COLORS.path;
          ctx.fillRect(x, y, T, T);
        }
      }
    }

    // Letters
    const fontSize = Math.max(9, Math.floor(T * 0.45));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [, tile] of letters) {
      const x = tile.c * T + T / 2;
      const y = tile.r * T + T / 2;
      const rare = LetterModule.isRare(tile.letter);
      const radius = T * 0.32;
      roundRect(ctx, tile.c * T + T / 2 - radius, tile.r * T + T / 2 - radius,
                radius * 2, radius * 2, 3,
                rare ? COLORS.rare : COLORS.tile);
      ctx.fillStyle = COLORS.tileText;
      ctx.font = `700 ${fontSize}px Poppins, sans-serif`;
      ctx.fillText(tile.letter, x, y + 0.5);
    }

    // Power-ups
    for (const pu of powerups) {
      if (!pu.active) continue;
      const x = pu.c * T + T / 2;
      const y = pu.r * T + T / 2;
      const radius = T * 0.4;
      // Pulsing glow
      ctx.save();
      ctx.shadowColor = PU_COLORS[pu.type];
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = PU_COLORS[pu.type];
      ctx.fill();
      ctx.restore();
      // Icon
      const iconFontSize = Math.max(8, Math.floor(T * 0.42));
      ctx.font = `${iconFontSize}px sans-serif`;
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(PowerupModule.ICONS[pu.type], x, y + 1);
    }

    // Players
    drawPlayer(p1);
    drawPlayer(p2);
  }

  function drawPlayer(player) {
    const T = tileSize;
    const x = player.c * T + T / 2;
    const y = player.r * T + T / 2;
    const radius = T * 0.38;

    ctx.save();
    if (player.frozen) {
      ctx.shadowColor = '#67e8f9';
      ctx.shadowBlur = 12;
    } else {
      ctx.shadowColor = player.color;
      ctx.shadowBlur = 8;
    }
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = player.frozen ? '#67e8f9' : player.color;
    ctx.fill();
    ctx.restore();

    // Player label
    ctx.font = `bold ${Math.max(8, Math.floor(T * 0.35))}px Poppins, sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`P${player.id}`, x, y + 0.5);
  }

  function roundRect(ctx, x, y, w, h, r, fillColor) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  return { init, destroy };
})();
