/**
 * wordValidator.js
 * Loads dictionary.json and exposes a validate(word) function.
 */
const WordValidator = (() => {
  let wordSet = null;
  let loadPromise = null;

  function load() {
    if (loadPromise) return loadPromise;
    loadPromise = fetch('assets/dictionary.json')
      .then(r => r.json())
      .then(arr => {
        wordSet = new Set(arr.map(w => w.toLowerCase()));
        console.log(`[WordValidator] Loaded ${wordSet.size} words`);
      })
      .catch(err => {
        console.error('[WordValidator] Failed to load dictionary', err);
        wordSet = new Set();
      });
    return loadPromise;
  }

  function isValid(word) {
    if (!wordSet) return false;
    return wordSet.has(word.toLowerCase());
  }

  function isReady() { return wordSet !== null; }

  return { load, isValid, isReady };
})();
