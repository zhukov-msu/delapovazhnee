// Audio: background music (HTMLAudioElement, autoplay-gesture-gated) + short
// WebAudio SFX blips (no audio files for SFX — synthesized square-wave beeps).
//
// Nothing here runs at module top level; `createAudio()` builds everything on
// call, and `new Audio(...)`/AudioContext are only touched from inside methods
// so importing this module has no side effects (mirrors game.js's pattern).
export function createAudio() {
  let music = null;
  let muted = false;
  let ctx = null; // lazily-created WebAudio context, for SFX oscillators

  function getMusic() {
    if (!music) {
      music = new Audio("/static/assets/music.mp3");
      music.loop = true;
      music.volume = 0.5;
    }
    return music;
  }

  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
    }
    return ctx;
  }

  // Short square-wave blip. Guarded so a missing/blocked AudioContext never throws.
  function blip(freq, dur) {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(c.destination);
      const now = c.currentTime;
      osc.start(now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.stop(now + dur);
    } catch (_) { /* WebAudio unavailable — ignore */ }
  }

  return {
    // Call from a user-gesture handler (e.g. the "Играть" click). Autoplay
    // policies may still reject play() (e.g. no gesture, or the mp3 is
    // missing) — swallow so the game never crashes over audio.
    startMusic() {
      if (muted) return;
      const m = getMusic();
      try {
        const p = m.play();
        if (p && typeof p.then === "function") p.catch(() => {});
      } catch (_) { /* ignore */ }
    },
    // Toggles mute, applied to the music element immediately; returns the new
    // muted state so the caller (boot.js) can swap the mute-button icon.
    toggleMute() {
      muted = !muted;
      if (music) music.muted = muted;
      if (!muted) this.startMusic();
      return muted;
    },
    sfxJump() {
      blip(660, 0.08);
    },
    sfxGameOver() {
      blip(220, 0.25);
    },
  };
}
