/**
 * Pure prefs module: localStorage-backed best score and character selection.
 * All functions take a `store` (localStorage-shaped) by injection for testability.
 */

const KEYS = {
  BEST: "dp_best",
  CHAR: "dp_char"
};

/**
 * Get the stored best score.
 * @param {Object} store - localStorage-shaped object with getItem/setItem.
 * @returns {number} The best score, or 0 if unset or invalid.
 */
export function getBest(store) {
  const val = store.getItem(KEYS.BEST);
  const num = val === null ? 0 : parseInt(val, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Update the best score with the max of the stored and given score.
 * @param {Object} store - localStorage-shaped object with getItem/setItem.
 * @param {number} score - The new score to consider.
 * @returns {number} The new best score (max of stored and score).
 */
export function updateBest(store, score) {
  const current = getBest(store);
  const next = Math.max(current, score);
  store.setItem(KEYS.BEST, String(next));
  return next;
}

/**
 * Get the selected character index (0-3).
 * @param {Object} store - localStorage-shaped object with getItem/setItem.
 * @returns {number} Character index 0-3, defaults to 0 if unset or invalid.
 */
export function getChar(store) {
  const val = store.getItem(KEYS.CHAR);
  const num = val === null ? 0 : parseInt(val, 10);
  if (isNaN(num) || num < 0 || num > 3) return 0;
  return num;
}

/**
 * Set the selected character index, clamped to 0-3.
 * @param {Object} store - localStorage-shaped object with getItem/setItem.
 * @param {number} i - Character index to set (will be clamped to 0-3).
 */
export function setChar(store, i) {
  const clamped = Math.max(0, Math.min(3, i));
  store.setItem(KEYS.CHAR, String(clamped));
}
