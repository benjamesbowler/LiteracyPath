// Sentence Express - synthesized SFX (Web Audio, no audio files).
// Every effect is generated at runtime, so nothing new ships to /public/audio
// and the gold-voice blocklist is untouched. All calls are safe no-ops when
// AudioContext is unavailable (tests, SSR, ancient browsers).

let ctx = null;

function ac() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try { ctx = new AC(); } catch { return null; }
  }
  if (ctx.state === "suspended") {
    try { ctx.resume(); } catch { /* fine - unlocks on next gesture */ }
  }
  return ctx;
}

function tone(c, { type = "sine", from = 440, to = null, dur = 0.2, at = 0, level = 0.18 }) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  const t0 = c.currentTime + at;
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  if (to && to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(level, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function hiss(c, { dur = 0.12, at = 0, level = 0.2, freq = 800, q = 1 }) {
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = c.createGain();
  gain.gain.value = level;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(c.currentTime + at);
}

export const sfx = {
  // Call from the first user gesture so the AudioContext unlocks.
  unlock() { ac(); },

  // Heavy iron coupling: low thump + metallic burst.
  clunk() {
    const c = ac(); if (!c) return;
    tone(c, { type: "triangle", from: 110, to: 45, dur: 0.18, level: 0.45 });
    hiss(c, { dur: 0.07, freq: 320, level: 0.28 });
  },

  // Wrong move: sad two-step buzz.
  buzz() {
    const c = ac(); if (!c) return;
    tone(c, { type: "square", from: 170, to: 120, dur: 0.16, level: 0.09 });
    tone(c, { type: "square", from: 130, to: 90, dur: 0.2, at: 0.14, level: 0.09 });
  },

  // Small success (shed / crate / engine / caboose fixed).
  ding() {
    const c = ac(); if (!c) return;
    tone(c, { from: 880, dur: 0.22, level: 0.13 });
    tone(c, { from: 1318, dur: 0.28, at: 0.06, level: 0.09 });
  },

  // Level fanfare: rising major arpeggio.
  chime() {
    const c = ac(); if (!c) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(c, { from: f, dur: 0.34, at: i * 0.09, level: 0.12 }));
  },

  // Steam whistle: two detuned partials gliding up + air noise.
  whistle() {
    const c = ac(); if (!c) return;
    tone(c, { type: "triangle", from: 585, to: 622, dur: 0.75, level: 0.11 });
    tone(c, { type: "triangle", from: 875, to: 932, dur: 0.75, level: 0.08 });
    hiss(c, { dur: 0.6, freq: 1900, level: 0.04, q: 0.5 });
  },

  // Rubber-stamp slam for the EXPRESS stamp.
  stamp() {
    const c = ac(); if (!c) return;
    tone(c, { type: "triangle", from: 75, to: 40, dur: 0.2, level: 0.45 });
    hiss(c, { dur: 0.05, freq: 1300, level: 0.18 });
  },

  // Level-crossing bell: ding-dong, twice.
  crossingBell() {
    const c = ac(); if (!c) return;
    [0, 0.38].forEach(at => {
      tone(c, { from: 988, dur: 0.26, at, level: 0.09 });
      tone(c, { from: 784, dur: 0.3, at: at + 0.17, level: 0.09 });
    });
  },

  // Gold Mail Run fanfare: rising run into a held chord.
  fanfare() {
    const c = ac(); if (!c) return;
    [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36], [784, 0.55], [1047, 0.7]]
      .forEach(([f, at]) => tone(c, { from: f, dur: 0.4, at, level: 0.12 }));
    [1319, 1568].forEach(f => tone(c, { from: f, dur: 0.85, at: 0.92, level: 0.07 }));
  },

  // Rolling chuff-chuff loop that accelerates like a departing train;
  // returns a stop function.
  startChuff() {
    const c = ac(); if (!c) return () => {};
    let gap = 430;
    let alive = true;
    let id = 0;
    const loop = () => {
      if (!alive) return;
      hiss(c, { dur: 0.1, freq: 520, level: 0.13, q: 0.9 });
      gap = Math.max(215, gap - 16);
      id = window.setTimeout(loop, gap);
    };
    loop();
    return () => { alive = false; window.clearTimeout(id); };
  }
};
