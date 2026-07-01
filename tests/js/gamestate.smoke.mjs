import { GAME } from "../../static/js/config.js";
import { createGame, startGame, stepGame } from "../../static/js/gamestate.js";

let failed = 0;
const ok = (c, m) => { if (c) console.log("PASS " + m); else { failed++; console.error("FAIL " + m); } };

// Not running -> no-op.
const g0 = createGame();
const r0 = stepGame(g0, 1 / 60, 640);
ok(r0.over === false && g0.state === "menu", "stepGame is a no-op before start");

// Collision -> over.
const g1 = createGame(); startGame(g1);
g1.obs.obstacles.push({ x: GAME.RUNNER_X, y: GAME.GROUND_Y - 26, w: 44, h: 26, type: "single", passed: false });
const r1 = stepGame(g1, 1 / 60, 640);
ok(r1.over === true && g1.state === "over", "collision ends the run");

// Score increments when an obstacle passes the runner. Place it LEFT of the runner's
// x-lane (right edge < RUNNER_X) so it scores this tick WITHOUT colliding — a standing
// runner's box overlaps any obstacle in its own lane, so we must avoid the lane here.
const g2 = createGame(); startGame(g2);
g2.obs.obstacles.push({ x: 40, y: GAME.GROUND_Y - 26, w: 44, h: 26, type: "single", passed: false });
const r2 = stepGame(g2, 1 / 60, 640);
ok(r2.scoreDelta >= 1 && g2.score >= 1 && r2.over === false, "score increments when an obstacle passes");

if (failed) { console.error(`GAMESTATE SMOKE: ${failed} FAILED`); process.exit(1); }
console.log("GAMESTATE SMOKE: ALL PASS");
