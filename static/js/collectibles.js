// Pure collectible system: spawning, scrolling, catching. No rendering.
import { GAME } from "./config.js";
import { collides } from "./obstacles.js";

export function createCollectibleState() {
  return { items: [], timeToNext: 1.2, elapsed: 0 };
}

// Randomized gap (seconds) for spawning collectibles.
function nextGap() {
  return GAME.ITEM_MIN_GAP + Math.random() * (GAME.ITEM_MAX_GAP - GAME.ITEM_MIN_GAP);
}

function spawn(state, worldW) {
  const kind = Math.floor(Math.random() * GAME.ITEM_KINDS);
  const y = GAME.ITEM_Y_MIN + Math.random() * (GAME.ITEM_Y_MAX - GAME.ITEM_Y_MIN);
  state.items.push({
    x: worldW + 20,
    y: y,
    w: GAME.ITEM_W,
    h: GAME.ITEM_H,
    kind: kind,
    caught: false,
  });
}

// Advance collectibles: spawn over time, scroll left, drop off-screen.
// worldW defaults large so the pure self-test (no canvas) still spawns/moves sanely.
export function stepCollectibles(state, dt, worldW = 640, speed = GAME.RUN_SPEED) {
  state.elapsed += dt;

  state.timeToNext -= dt;
  if (state.timeToNext <= 0) {
    spawn(state, worldW);
    state.timeToNext = nextGap();
  }

  // Move items left at scroll speed.
  for (const item of state.items) {
    item.x -= speed * dt;
  }

  // Drop off-screen items.
  state.items = state.items.filter((item) => item.x + item.w > -40);
}

// Check runner box against all items. Mark caught, remove them, return count.
export function catchCollectibles(runnerBox, state) {
  let count = 0;
  const uncaught = [];
  for (const item of state.items) {
    if (collides(runnerBox, item)) {
      item.caught = true;
      count += 1;
    } else {
      uncaught.push(item);
    }
  }
  state.items = uncaught;
  return count;
}
