/**
 * main.js
 * Entry point – wires up screen transitions and starts the game.
 */

(async () => {
  // Pre-load the dictionary while the user is on the start screen
  await WordValidator.load();

  const btnStart = document.getElementById('btn-start');
  const btnAgain = document.getElementById('btn-again');

  btnStart.addEventListener('click', startGame);
  btnAgain.addEventListener('click', () => {
    UI.showScreen('screen-game');
    startGame();
  });

  function startGame() {
    UI.showScreen('screen-game');
    // Small delay to allow screen transition / layout to settle
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        Game.init();
      });
    });
  }
})();
