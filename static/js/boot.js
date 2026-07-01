// Page boot: wires the session/analytics (ab.js), the game controller
// (game.js), audio (audio.js), and the start/HUD/game-over overlays together.
import { readSession, markVisited, createEmitter, goPresaveUrl } from "./ab.js";
import { Game } from "./game.js";
import { createAudio } from "./audio.js";

function boot() {
  const root = document.documentElement;
  const session = readSession(root);
  const emit = createEmitter(session);

  if (markVisited(localStorage)) emit("visit", {});

  const hud = document.getElementById("hud");
  const scoreEl = document.getElementById("score");
  const finalScoreEl = document.getElementById("final-score");
  const startEl = document.getElementById("start");
  const overEl = document.getElementById("over");
  const playBtn = document.getElementById("play");
  const retryBtn = document.getElementById("retry");
  const muteBtn = document.getElementById("mute");

  const audio = createAudio();

  // --- CTA: build once from the <template>, mount by variant, and fire
  // cta_view exactly once when it actually becomes visible to the player. ---
  const ctaTpl = document.getElementById("cta-tpl");
  const ctaFrag = ctaTpl.content.cloneNode(true);
  const ctaRoot = ctaFrag.querySelector(".cta");
  const ctaImg = ctaFrag.querySelector(".qr");
  const ctaLink = ctaFrag.querySelector(".presave");
  ctaImg.src = "/qr?v=" + session.variant + "&sid=" + session.sid;
  ctaLink.href = goPresaveUrl(session.variant, session.sid, "button");
  // No client-side cta_click emit here: /go/presave (server) already logs
  // cta_click when the link is followed — emitting here would double-count.

  const isVariantA = session.variant === "A";
  const ctaHost = document.getElementById(isVariantA ? "start-cta" : "over-cta");
  ctaHost.appendChild(ctaRoot);

  let ctaViewFired = false;
  function fireCtaView() {
    if (ctaViewFired) return;
    ctaViewFired = true;
    emit("cta_view", {});
  }
  if (isVariantA) fireCtaView(); // visible immediately on the start overlay

  // --- Game wiring ---
  const game = new Game("game");

  game.onStart = () => {
    emit("game_start", {});
    audio.startMusic();
  };
  game.onScore = (s) => {
    scoreEl.textContent = String(s);
  };
  game.onGameOver = (s) => {
    emit("game_over", { score: s });
    audio.sfxGameOver();
    finalScoreEl.textContent = String(s);
    hud.classList.add("hidden");
    overEl.classList.remove("hidden");
    if (!isVariantA) fireCtaView(); // becomes visible only now, for variant B
  };

  function startPlay() {
    startEl.classList.add("hidden");
    overEl.classList.add("hidden");
    hud.classList.remove("hidden");
    scoreEl.textContent = "0";
    game.start();
  }

  playBtn.addEventListener("click", startPlay);
  retryBtn.addEventListener("click", startPlay);

  muteBtn.addEventListener("click", () => {
    const muted = audio.toggleMute();
    muteBtn.textContent = muted ? "🔇" : "🔊";
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}
