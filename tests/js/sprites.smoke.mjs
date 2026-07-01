import { PALETTE, images, drawBackground, drawRunner, drawObstacle } from "../../static/js/sprites.js";
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
images.runner = { __img: true };
ctx = mockCtx(); drawRunner(ctx, createRunner(), 0);
ok(ctx.calls.some(c => c[0] === "drawImage"), "swap point blits loaded PNG instead of primitives");
delete images.runner;

ok(typeof PALETTE === "object" && Object.keys(PALETTE).length > 0, "PALETTE exported");
if (failed) { console.error(`SPRITES SMOKE: ${failed} FAILED`); process.exit(1); }
console.log("SPRITES SMOKE: ALL PASS");
