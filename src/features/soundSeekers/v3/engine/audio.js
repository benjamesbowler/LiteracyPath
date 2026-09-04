// Sound Seekers v3 — one audio player for the whole game.
//
// • only committed clips (phoneme bank, Leda word clips, recorded lines);
//   browser speech synthesis is never used
// • every play resolves with a delivery status:
//   "completed" | "failed" | "unavailable" | "muted" | "interrupted"
// • sound off never blocks play: the visible text carries the instruction and
//   the status is recorded on the evidence as audioSupport

export function createAudioPlayer({ enabled = true } = {}) {
  let element = null;
  let current = null; // { src, resolve }
  let isEnabled = enabled;
  let unlocked = false;

  function ensure() {
    if (element || typeof Audio === "undefined") return element;
    element = new Audio();
    element.preload = "auto";
    return element;
  }

  function settle(status) {
    if (!current) return;
    const { resolve } = current;
    current = null;
    resolve(status);
  }

  function play(src, { volume = 1 } = {}) {
    if (!src) return Promise.resolve("unavailable");
    if (!isEnabled) return new Promise(resolve => setTimeout(() => resolve("muted"), 250));
    const el = ensure();
    if (!el) return Promise.resolve("unavailable");
    settle("interrupted");
    return new Promise(resolve => {
      current = { src, resolve };
      const onEnd = () => { cleanup(); if (current?.src === src) settle("completed"); };
      const onErr = () => { cleanup(); if (current?.src === src) settle("failed"); };
      const cleanup = () => { el.removeEventListener("ended", onEnd); el.removeEventListener("error", onErr); };
      el.addEventListener("ended", onEnd);
      el.addEventListener("error", onErr);
      el.volume = volume;
      el.src = src;
      const p = el.play();
      if (p && typeof p.catch === "function") {
        p.then(() => { unlocked = true; }).catch(() => { cleanup(); if (current?.src === src) settle("failed"); });
      }
    });
  }

  async function sequence(srcs, { gapMs = 220 } = {}) {
    const results = [];
    for (const src of srcs.filter(Boolean)) {
      const r = await play(src);
      results.push(r);
      if (r === "interrupted") break;
      await new Promise(res => setTimeout(res, gapMs));
    }
    return results.every(r => r === "completed") ? "completed" : results.includes("interrupted") ? "interrupted" : results.includes("muted") ? "muted" : results.some(r => r === "completed") ? "partial" : results[0] || "unavailable";
  }

  function stop() {
    if (element) { try { element.pause(); } catch { /* ignore */ } }
    settle("interrupted");
  }

  return {
    play,
    sequence,
    stop,
    setEnabled(next) { isEnabled = Boolean(next); if (!isEnabled) stop(); },
    get enabled() { return isEnabled; },
    get unlocked() { return unlocked; }
  };
}

// Simple synthesized UI sounds (no clips needed): a short pop, a chime, a wobble.
export function createFx({ enabled = true } = {}) {
  let ctx = null;
  let isEnabled = enabled;
  const get = () => {
    if (ctx || typeof window === "undefined") return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  };
  function tone(freq, { type = "sine", duration = 0.12, gain = 0.08, slide = 0, delay = 0 } = {}) {
    const ac = get();
    if (!ac || !isEnabled) return;
    if (ac.state === "suspended") ac.resume().catch(() => {});
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + duration);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }
  return {
    setEnabled(v) { isEnabled = Boolean(v); },
    pop() { tone(520, { type: "triangle", duration: 0.09, gain: 0.06, slide: 180 }); },
    jump() { tone(300, { type: "square", duration: 0.12, gain: 0.03, slide: 260 }); },
    land() { tone(140, { type: "triangle", duration: 0.07, gain: 0.05, slide: -60 }); },
    wobble() { tone(220, { type: "sine", duration: 0.18, gain: 0.05, slide: -80 }); },
    chime() { tone(660, { duration: 0.16, gain: 0.06 }); tone(880, { duration: 0.18, gain: 0.05, delay: 0.09 }); tone(1320, { duration: 0.25, gain: 0.04, delay: 0.18 }); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, { type: "triangle", duration: 0.22, gain: 0.05, delay: i * 0.11 })); },
    tick() { tone(900, { type: "triangle", duration: 0.04, gain: 0.03 }); }
  };
}
