import { PALETTE, images, drawBackground, drawRunner, drawObstacle, drawCollectible } from "../../static/js/sprites.js";
import { createRunner } from "../../static/js/physics.js";

function mockCtx() {
  const calls = [];
  const rec = (n) => (...a) => calls.push([n, ...a]);
  return { calls,
    fillRect: rec("fillRect"), drawImage: rec("drawImage"),
    fillStyle: "", strokeStyle: "", lineWidth: 1, imageSmoothingEnabled: true,
    beginPath: rec("beginPath"), moveTo: rec("moveTo"), lineTo: rec("lineTo"),
    stroke: rec("stroke"), fill: rec("fill"), save: rec("save"), restore: rec("restore"),
    arc: rec("arc"), rect: rec("rect"), translate: rec("translate"),
    createLinearGradient: () => ({ addColorStop() {} }) };
}
let failed = 0;
const ok = (c, m) => { if (c) console.log("PASS " + m); else { failed++; console.error("FAIL " + m); } };

const cam = { x: 0 };
let ctx = mockCtx();
drawBackground(ctx, cam, 640); ok(ctx.calls.length > 0, "background paints");
ctx = mockCtx(); drawRunner(ctx, createRunner(), 0); ok(ctx.calls.length > 0, "runner paints");
ctx = mockCtx(); drawObstacle(ctx, { x: 200, y: 274, w: 44, h: 26, type: "single", passed: false });
ok(ctx.calls.some(c => c[0] === "fillRect"), "single obstacle uses primitives");
ctx = mockCtx(); drawObstacle(ctx, { x: 200, y: 222, w: 52, h: 78, type: "umbrella", passed: false });
ok(ctx.calls.length > 0, "umbrella obstacle paints");

// PNG swap point: when a loaded image exists for a sprite, drawImage is used.
// Runner swap point is now keyed by character index (default charIndex=0 -> "char_0").
images["char_0"] = { __img: true };
ctx = mockCtx(); drawRunner(ctx, createRunner(), 0);
ok(ctx.calls.some(c => c[0] === "drawImage"), "swap point blits loaded PNG instead of primitives");
delete images["char_0"];

// Collectibles: procedural per-kind rendering.
ctx = mockCtx();
drawCollectible(ctx, { x: 200, y: 150, w: 24, h: 24, kind: 0, caught: false });
ok(ctx.calls.length > 0, "collectible (kind 0) paints");
ctx = mockCtx();
drawCollectible(ctx, { x: 200, y: 150, w: 24, h: 24, kind: 1, caught: false });
ok(ctx.calls.length > 0, "collectible (kind 1) paints");
ctx = mockCtx();
drawCollectible(ctx, { x: 200, y: 150, w: 24, h: 24, kind: 2, caught: false });
ok(ctx.calls.length > 0, "collectible (kind 2) paints");

// Character variants: 4 distinct procedural runners keyed by charIndex.
ctx = mockCtx(); drawRunner(ctx, createRunner(), 0, 2);
ok(ctx.calls.length > 0, "runner paints with charIndex=2");
ctx = mockCtx(); drawRunner(ctx, createRunner(), 0, 3);
ok(ctx.calls.length > 0, "runner paints with charIndex=3");
// Default charIndex still works for existing callers (no 4th arg passed).
ctx = mockCtx(); drawRunner(ctx, createRunner(), 0);
ok(ctx.calls.length > 0, "runner paints with default charIndex");

// PNG swap point: char_2.
images["char_2"] = { __img: true };
ctx = mockCtx(); drawRunner(ctx, createRunner(), 0, 2);
ok(ctx.calls.some(c => c[0] === "drawImage"), "swap point blits loaded char_2 PNG instead of primitives");
delete images["char_2"];

// PNG swap point: item_0.
images["item_0"] = { __img: true };
ctx = mockCtx();
drawCollectible(ctx, { x: 200, y: 150, w: 24, h: 24, kind: 0, caught: false });
ok(ctx.calls.some(c => c[0] === "drawImage"), "swap point blits loaded item_0 PNG instead of primitives");
delete images["item_0"];

// Procedural fallback still hit after swap-point cleanup.
ctx = mockCtx(); drawRunner(ctx, createRunner(), 0, 2);
ok(ctx.calls.some(c => c[0] === "fillRect" || c[0] === "arc" || c[0] === "fill"), "runner (charIndex=2) uses primitives after cleanup");
ctx = mockCtx();
drawCollectible(ctx, { x: 200, y: 150, w: 24, h: 24, kind: 0, caught: false });
ok(ctx.calls.some(c => c[0] === "fillRect" || c[0] === "arc" || c[0] === "fill"), "collectible (kind 0) uses primitives after cleanup");

ok(typeof PALETTE === "object" && Object.keys(PALETTE).length > 0, "PALETTE exported");
if (failed) { console.error(`SPRITES SMOKE: ${failed} FAILED`); process.exit(1); }
console.log("SPRITES SMOKE: ALL PASS");
