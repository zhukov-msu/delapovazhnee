// In-browser assertion harness (no Node runtime is available in this project).
// Open the game with ?selftest=1 to run. Results print to console + on-page banner.
import { GAME } from "./config.js";
import { createRunner, jump, stepRunner } from "./physics.js";
import { createGameState, stepObstacles, collides, runnerBox } from "./obstacles.js";

export function run(assert) {
  // Single jump leaves the ground.
  const r = createRunner();
  assert(r.onGround === true, "runner starts on ground");
  jump(r);
  stepRunner(r, 1 / 60);
  assert(r.onGround === false, "single jump leaves ground");
  assert(r.jumps === 1, "one jump consumed");

  // Double jump goes higher than single jump apex.
  const single = createRunner(); jump(single);
  let apexSingle = single.y;
  for (let i = 0; i < 200; i++) { stepRunner(single, 1 / 60); apexSingle = Math.min(apexSingle, single.y); }

  const dbl = createRunner(); jump(dbl);
  stepRunner(dbl, 1 / 60);
  jump(dbl); // second jump mid-air
  let apexDbl = dbl.y;
  for (let i = 0; i < 200; i++) { stepRunner(dbl, 1 / 60); apexDbl = Math.min(apexDbl, dbl.y); }
  assert(apexDbl < apexSingle, "double jump reaches higher apex");

  // No triple jump.
  const t = createRunner(); jump(t); jump(t); jump(t);
  assert(t.jumps <= 2, "cannot jump more than twice");

  // Returns to ground eventually.
  const g = createRunner(); jump(g);
  for (let i = 0; i < 600; i++) stepRunner(g, 1 / 60);
  assert(g.onGround === true && Math.abs(g.y - GAME.GROUND_Y) < 0.5, "lands back on ground");

  // AABB overlap detection.
  assert(collides({x:0,y:0,w:10,h:10}, {x:5,y:5,w:10,h:10}) === true, "AABB overlap true");
  assert(collides({x:0,y:0,w:10,h:10}, {x:20,y:0,w:10,h:10}) === false, "AABB apart false");

  // Obstacles spawn over time and scroll left.
  const gs = createGameState();
  for (let i = 0; i < 300; i++) stepObstacles(gs, 1 / 60);
  assert(gs.obstacles.length > 0, "obstacles spawn over time");
  assert(gs.speed >= GAME.RUN_SPEED, "speed does not drop below start");
  assert(gs.speed <= GAME.MAX_SPEED, "speed capped");

  // Score increments as obstacles pass the runner.
  const gs2 = createGameState();
  let ticks = 0;
  while (gs2.score === 0 && ticks < 3000) { stepObstacles(gs2, 1 / 60); ticks++; }
  assert(gs2.score >= 1, "score increments when an obstacle passes");

  // A grounded runner collides with an obstacle occupying its x-lane.
  const grounded = createRunner();
  const spawnedNear = { x: GAME.RUNNER_X, y: GAME.GROUND_Y - 26, w: 44, h: 26, type: "single", passed: false };
  assert(collides(runnerBox(grounded), spawnedNear) === true, "grounded runner hits ground obstacle in its lane");

  // A runner high in the air clears a short ground obstacle in the same x-lane.
  const airborne = createRunner();
  airborne.y = 120; // feet high above the ground
  assert(collides(runnerBox(airborne), spawnedNear) === false, "airborne runner clears short obstacle");
}

// Browser bootstrap.
export function bootstrap() {
  const results = [];
  const assert = (cond, msg) => results.push({ ok: !!cond, msg });
  try { run(assert); } catch (e) { results.push({ ok: false, msg: "threw: " + e.message }); }
  const failed = results.filter((r) => !r.ok);
  results.forEach((r) => console[r.ok ? "log" : "error"]((r.ok ? "PASS " : "FAIL ") + r.msg));
  const banner = document.createElement("div");
  banner.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:9999;padding:8px;font:14px monospace;" +
    "color:#fff;background:" + (failed.length ? "#a00" : "#070");
  banner.textContent = failed.length ? `SELFTEST: ${failed.length} FAILED` : "SELFTEST: ALL PASS";
  document.body.appendChild(banner);
}

if (typeof location !== "undefined" && location.search.includes("selftest=1")) {
  window.addEventListener("DOMContentLoaded", bootstrap);
}
