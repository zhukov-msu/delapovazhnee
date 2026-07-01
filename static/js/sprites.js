// Procedural sunset-pixel art + parallax background renderer.
// No game-loop/input/DOM-query logic here — pure rendering from GAME + shapes.
// Swap point: each draw* checks images[name] first; when a real PNG is loaded
// there, it is blitted via drawImage and the primitive fallback is skipped.
import { GAME } from "./config.js";

// Summer Sunset Pixel (PS1/Sega) — authoritative palette, reused across game + admin.
export const PALETTE = {
  night: "#241539",
  grape: "#6D2E8B",
  flare: "#FF5D73",
  sun: "#FFD35C",
  sand: "#F2C078",
  foam: "#FFF4E2",
  arcade: "#2FE6D6",
  ink: "#2A1533",
};

// name -> HTMLImageElement. Empty until loadSprites() populates it.
export const images = {};

// Populate images from a manifest: { name: url, ... }. Returns a Promise that
// resolves once every image has attempted to load (errors are swallowed so a
// missing PNG just leaves the procedural fallback in place).
export function loadSprites(manifest) {
  const entries = Object.entries(manifest || {});
  return Promise.all(
    entries.map(([name, src]) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          images[name] = img;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = src;
      })
    )
  );
}

// Sea sits just above the sand; sun disc sits just above the sea line.
const SEA_Y = GAME.GROUND_Y + 4;
const SEA_H = 22;
const SAND_H = GAME.WORLD_H - (SEA_Y + SEA_H);

function px(n) {
  return Math.round(n);
}

function drawDitherBand(ctx, x, y, w, h, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  // Ordered dither: alternate-column pixel stipple, 2px chunky pixels.
  for (let py = 0; py < h; py += 2) {
    for (let pxi = 0; pxi < w; pxi += 2) {
      if (((pxi >> 1) + (py >> 1)) % 2 === 0) {
        ctx.fillRect(px(x + pxi), px(y + py), 2, 2);
      }
    }
  }
  ctx.restore();
}

function drawSky(ctx, w, h) {
  if (images.sky) {
    ctx.drawImage(images.sky, 0, 0, w, h);
    return;
  }
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, PALETTE.night);
  grad.addColorStop(0.45, PALETTE.grape);
  grad.addColorStop(0.75, PALETTE.flare);
  grad.addColorStop(1, PALETTE.sun);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  // Light ordered-dither banding over the lower sky for a PS1 sunset feel.
  drawDitherBand(ctx, 0, px(h * 0.55), w, px(h * 0.2), PALETTE.flare, 0.25);
}

function drawSun(ctx, cam, w) {
  const cx = px(w * 0.7 - cam.x * 0.1);
  const cy = px(SEA_Y - 46);
  const r = 40;
  if (images.sun) {
    ctx.drawImage(images.sun, cx - r, cy - r, r * 2, r * 2);
    return;
  }
  ctx.save();
  ctx.fillStyle = PALETTE.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Ordered-dither horizontal stripes across the lower half of the disc —
  // the "signature" dithered sunset look.
  ctx.save();
  ctx.fillStyle = PALETTE.flare;
  for (let dy = 0; dy < r; dy += 4) {
    const rowY = cy + dy;
    const half = Math.sqrt(Math.max(0, r * r - dy * dy));
    const rowW = px(half * 2);
    ctx.globalAlpha = 0.35;
    ctx.fillRect(px(cx - half), px(rowY), rowW, 2);
  }
  ctx.restore();
}

function drawSea(ctx, cam, w) {
  if (images.sea) {
    ctx.drawImage(images.sea, 0, SEA_Y, w, SEA_H);
    return;
  }
  const offset = ((cam.x * 0.4) % 40 + 40) % 40;
  ctx.fillStyle = PALETTE.grape;
  ctx.fillRect(0, px(SEA_Y), w, SEA_H);
  // Parallax "wave" ticks scrolling with a medium factor of cam.x.
  ctx.fillStyle = PALETTE.foam;
  for (let x = -offset; x < w; x += 40) {
    ctx.fillRect(px(x), px(SEA_Y + 6), 16, 2);
  }
}

function drawSand(ctx, cam, w, h) {
  if (images.sand) {
    ctx.drawImage(images.sand, 0, SEA_Y + SEA_H, w, SAND_H);
    return;
  }
  const y = SEA_Y + SEA_H;
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(0, px(y), w, px(h - y));
  // Fastest parallax layer: sand speckle scrolls at full cam.x rate.
  const offset = ((cam.x % 24) + 24) % 24;
  ctx.fillStyle = PALETTE.ink;
  ctx.save();
  ctx.globalAlpha = 0.15;
  for (let x = -offset; x < w; x += 24) {
    ctx.fillRect(px(x), px(y + 10), 4, 4);
  }
  ctx.restore();
}

// Layer order: sky gradient -> sun -> sea band -> sand (each with its own
// parallax factor driven by cam.x: sky+sun slowest, sea medium, sand fastest).
export function drawBackground(ctx, cam, worldW) {
  ctx.imageSmoothingEnabled = false;
  const h = GAME.WORLD_H;
  drawSky(ctx, worldW, h);
  drawSun(ctx, cam, worldW);
  drawSea(ctx, cam, worldW);
  drawSand(ctx, cam, worldW, h);
}

// Procedural pixel runner with a slight run bob driven by t.
export function drawRunner(ctx, runner, t) {
  ctx.imageSmoothingEnabled = false;
  const w = GAME.RUNNER_W;
  const h = GAME.RUNNER_H;
  const x = GAME.RUNNER_X;
  const y = runner.y - h;
  const bob = runner.onGround ? Math.round(Math.sin(t * 12) * 2) : 0;

  if (images.runner) {
    ctx.drawImage(images.runner, px(x), px(y + bob), w, h);
    return;
  }

  ctx.save();
  ctx.fillStyle = PALETTE.ink;
  // legs
  ctx.fillRect(px(x + 6), px(y + h - 12 + bob), 8, 12);
  ctx.fillRect(px(x + w - 14), px(y + h - 12 + bob), 8, 12);
  // torso
  ctx.fillStyle = PALETTE.flare;
  ctx.fillRect(px(x + 4), px(y + h * 0.35 + bob), w - 8, h * 0.4);
  // head
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(px(x + 8), px(y + bob), w - 16, h * 0.3);
  ctx.restore();
}

function drawSingleObstacle(ctx, o) {
  if (images.single) {
    ctx.drawImage(images.single, px(o.x), px(o.y), o.w, o.h);
    return;
  }
  ctx.save();
  // Mat
  ctx.fillStyle = PALETTE.arcade;
  ctx.fillRect(px(o.x), px(o.y + o.h - 8), o.w, 8);
  // Sunbather body lying on the mat
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(px(o.x + o.w * 0.15), px(o.y + o.h - 18), o.w * 0.7, 10);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(px(o.x + o.w * 0.08), px(o.y + o.h - 16), o.w * 0.14, 8);
  ctx.restore();
}

function drawUmbrellaObstacle(ctx, o) {
  if (images.umbrella) {
    ctx.drawImage(images.umbrella, px(o.x), px(o.y), o.w, o.h);
    return;
  }
  ctx.save();
  // Pole
  ctx.fillStyle = PALETTE.ink;
  ctx.fillRect(px(o.x + o.w / 2 - 2), px(o.y + 20), 4, o.h - 20);
  // Parasol canopy
  ctx.fillStyle = PALETTE.flare;
  ctx.fillRect(px(o.x), px(o.y), o.w, 14);
  ctx.fillStyle = PALETTE.sun;
  ctx.fillRect(px(o.x + 6), px(o.y + 4), o.w - 12, 6);
  // Sunbather sitting beneath
  ctx.fillStyle = PALETTE.sand;
  ctx.fillRect(px(o.x + o.w * 0.2), px(o.y + o.h - 20), o.w * 0.6, 16);
  ctx.restore();
}

// single = sunbather on a mat, umbrella = taller with parasol.
export function drawObstacle(ctx, o) {
  ctx.imageSmoothingEnabled = false;
  if (o.type === "umbrella") {
    drawUmbrellaObstacle(ctx, o);
  } else {
    drawSingleObstacle(ctx, o);
  }
}
