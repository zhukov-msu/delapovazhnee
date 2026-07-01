// Pure game progression: composes physics + obstacles into one advance step.
// No DOM — node-testable.
import { createRunner, stepRunner } from "./physics.js";
import { createGameState, stepObstacles, collides, runnerBox } from "./obstacles.js";

export function createGame() {
  return { runner: createRunner(), obs: createGameState(), state: "menu", score: 0 };
}
export function startGame(g) {
  g.runner = createRunner(); g.obs = createGameState(); g.score = 0; g.state = "running";
}
// Advance one frame. Returns {over, scoreDelta}. No-op unless running.
export function stepGame(g, dt, worldW) {
  if (g.state !== "running") return { over: false, scoreDelta: 0 };
  stepRunner(g.runner, dt);
  const before = g.obs.score;
  stepObstacles(g.obs, dt, worldW);
  const scoreDelta = g.obs.score - before;
  g.score = g.obs.score;
  const box = runnerBox(g.runner);
  for (const o of g.obs.obstacles) {
    if (collides(box, o)) { g.state = "over"; return { over: true, scoreDelta }; }
  }
  return { over: false, scoreDelta };
}
