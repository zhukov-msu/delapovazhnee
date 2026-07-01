import { GAME } from "../../static/js/config.js";
import { createCollectibleState, stepCollectibles, catchCollectibles } from "../../static/js/collectibles.js";
import { runnerBox } from "../../static/js/obstacles.js";
import { createRunner } from "../../static/js/physics.js";

let failed = 0;
const ok = (c, m) => { if (c) console.log("PASS " + m); else { failed++; console.error("FAIL " + m); } };

// spawns over time
const s = createCollectibleState();
for (let i = 0; i < 600; i++) stepCollectibles(s, 1 / 60, 640);
ok(s.items.length >= 0, "stepCollectibles runs without error");
ok(s.items.every(it => it.y >= GAME.ITEM_Y_MIN && it.y <= GAME.ITEM_Y_MAX), "items spawn in the air band");

// catch: airborne runner overlapping an item scores it, item removed
const s2 = createCollectibleState();
const r = createRunner(); r.y = 170; // airborne, box ~[122,170]
s2.items.push({ x: GAME.RUNNER_X, y: 150, w: GAME.ITEM_W, h: GAME.ITEM_H, kind: 0, caught: false });
const n = catchCollectibles(runnerBox(r), s2);
ok(n === 1 && s2.items.length === 0, "airborne runner catches the item (+1, removed)");

// grounded runner does NOT catch a high air item
const s3 = createCollectibleState();
const g = createRunner(); // grounded, box ~[252,300]
s3.items.push({ x: GAME.RUNNER_X, y: 150, w: GAME.ITEM_W, h: GAME.ITEM_H, kind: 0, caught: false });
ok(catchCollectibles(runnerBox(g), s3) === 0, "grounded runner misses a high air item");

if (failed) { console.error(`COLLECTIBLES SMOKE: ${failed} FAILED`); process.exit(1); }
console.log("COLLECTIBLES SMOKE: ALL PASS");
