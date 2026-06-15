/**
 * ui.js
 * HUD updates, screen transitions, result screen population.
 */

const UI = (() => {

  let flashTimer = null;

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  function updateHUD(p1, p2, secondsLeft) {
    // Scores
    document.getElementById('score-p1').textContent = p1.score;
    document.getElementById('score-p2').textContent = p2.score;

    // Trays
    renderTray('tray-p1', p1.tray);
    renderTray('tray-p2', p2.tray);

    // Power-up indicators
    updatePowerupLabel('pu-p1', p1);
    updatePowerupLabel('pu-p2', p2);

    // Timer
    const timerEl = document.getElementById('timer');
    const m = Math.floor(secondsLeft / 60);
    const s = String(secondsLeft % 60).padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
    timerEl.classList.toggle('urgent', secondsLeft <= 20);
  }

  function renderTray(elId, tray) {
    const el = document.getElementById(elId);
    el.innerHTML = '';
    for (const ch of tray) {
      const span = document.createElement('span');
      span.className = 'tray-letter' + (LetterModule.isRare(ch) ? ' rare' : '');
      span.textContent = ch;
      el.appendChild(span);
    }
  }

  function updatePowerupLabel(elId, player) {
    const el = document.getElementById(elId);
    const now = performance.now();
    if (player.activePowerupLabel && now < player.activePowerupUntil) {
      el.textContent = player.activePowerupLabel;
    } else if (player.frozen && now < player.frozenUntil) {
      const remaining = Math.ceil((player.frozenUntil - now) / 1000);
      el.textContent = `❄ Frozen ${remaining}s`;
    } else if (now < player.speedUntil) {
      const remaining = Math.ceil((player.speedUntil - now) / 1000);
      el.textContent = `⚡ Speed ${remaining}s`;
    } else {
      el.textContent = '';
    }
  }

  function flash(msg, durationMs = 2000) {
    const el = document.getElementById('flash-msg');
    el.textContent = msg;
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { el.textContent = ''; }, durationMs);
  }

  function showResult(p1, p2) {
    const winner = p1.score > p2.score ? 'Player 1 Wins! 🎉' :
                   p2.score > p1.score ? 'Player 2 Wins! 🎉' : "It's a Tie! 🤝";
    const winnerEl = document.getElementById('result-winner');
    winnerEl.textContent = winner;
    winnerEl.style.color = p1.score > p2.score ? '#3b82f6' :
                           p2.score > p1.score ? '#ef4444' : '#facc15';

    document.getElementById('result-score-p1').textContent = p1.score;
    document.getElementById('result-score-p2').textContent = p2.score;

    document.getElementById('result-words-p1').innerHTML = formatWords(p1.wordsFormed);
    document.getElementById('result-words-p2').innerHTML = formatWords(p2.wordsFormed);

    showScreen('screen-result');
  }

  function formatWords(wordsFormed) {
    if (!wordsFormed.length) return '<em style="color:#475569">No words formed</em>';
    return wordsFormed.map(({ word, pts }) =>
      `<span class="word-entry">${word}</span> <span class="word-pts">+${pts}</span>`
    ).join('<br>');
  }

  return { showScreen, updateHUD, flash, showResult };
})();
