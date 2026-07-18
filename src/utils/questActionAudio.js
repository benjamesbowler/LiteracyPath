export const QUEST_ACTION_SFX = Object.freeze({
  discover: Object.freeze({ key: "quest-action-discover", src: "/game-assets/quest-pixel/seedwake/audio/action-discover.wav" }),
  hop: Object.freeze({ key: "quest-action-hop", src: "/game-assets/quest-pixel/seedwake/audio/action-hop.wav" }),
  interact: Object.freeze({ key: "quest-action-interact", src: "/game-assets/quest-pixel/seedwake/audio/action-interact.wav" }),
  lift: Object.freeze({ key: "quest-action-lift", src: "/game-assets/quest-pixel/seedwake/audio/action-lift.wav" }),
  place: Object.freeze({ key: "quest-action-place", src: "/game-assets/quest-pixel/seedwake/audio/action-place.wav" }),
  build: Object.freeze({ key: "quest-action-build", src: "/game-assets/quest-pixel/seedwake/audio/action-build.wav" }),
  pulse: Object.freeze({ key: "quest-action-pulse", src: "/game-assets/quest-pixel/seedwake/audio/action-pulse.wav" }),
  wait: Object.freeze({ key: "quest-action-wait", src: "/game-assets/quest-pixel/seedwake/audio/action-wait.wav" })
});

export const QUEST_CHAPTER_MATERIAL_SFX = Object.freeze({
  "seedwake-meadow": Object.freeze({ key: "quest-material-meadow", src: "/game-assets/quest-pixel/seedwake/audio/material-meadow.wav" }),
  "river-gardens": Object.freeze({ key: "quest-material-river", src: "/game-assets/quest-pixel/seedwake/audio/material-river.wav" }),
  "fossil-canyon": Object.freeze({ key: "quest-material-fossil", src: "/game-assets/quest-pixel/seedwake/audio/material-fossil.wav" }),
  "forge-settlement": Object.freeze({ key: "quest-material-forge", src: "/game-assets/quest-pixel/seedwake/audio/material-forge.wav" }),
  "glass-marsh": Object.freeze({ key: "quest-material-glass", src: "/game-assets/quest-pixel/seedwake/audio/material-glass.wav" }),
  "storm-coast": Object.freeze({ key: "quest-material-storm", src: "/game-assets/quest-pixel/seedwake/audio/material-storm.wav" }),
  "lantern-forest": Object.freeze({ key: "quest-material-forest", src: "/game-assets/quest-pixel/seedwake/audio/material-forest.wav" }),
  "star-reach": Object.freeze({ key: "quest-material-star", src: "/game-assets/quest-pixel/seedwake/audio/material-star.wav" })
});

const PLACE_ACTION = /(deliver|dock|fit|place|lock|feed|restore|release|send|flash|tune|ring|strike|turn|wave|open)/;
const LIFT_ACTION = /(lift|load|board|carry|pick|net|catch|brush|dig)/;

export function questActionSfxId({ kind = "correct", verbPattern = "single", playerAction = "" } = {}) {
  if (kind === "wait") return "wait";
  if (kind !== "correct") return null;
  if (verbPattern === "rhythm") return "pulse";
  if (verbPattern === "pursuit") return "discover";
  if (verbPattern === "route") return "hop";
  if (verbPattern === "sort") return "place";
  if (verbPattern === "tool") return "interact";
  if (verbPattern === "turn") return "interact";
  if (verbPattern === "steer") return "place";
  if (verbPattern === "signal") return "pulse";
  if (verbPattern === "climb") return "hop";

  const action = String(playerAction || "").toLowerCase();
  if (PLACE_ACTION.test(action)) return verbPattern === "assembly" ? "build" : "place";
  if (LIFT_ACTION.test(action)) return "lift";
  if (verbPattern === "delivery") return "lift";
  if (verbPattern === "assembly") return "build";
  if (verbPattern === "jump" || action.includes("jump") || action.includes("step")) return "hop";
  if (verbPattern === "search" || /(search|find|sort|follow|guide|rescue|chase)/.test(action)) return "discover";
  return "interact";
}

export function questActionSfxEntry(options = {}) {
  const id = questActionSfxId(options);
  return id ? QUEST_ACTION_SFX[id] || null : null;
}

export function questChapterMaterialSfxEntry(chapterId) {
  return QUEST_CHAPTER_MATERIAL_SFX[chapterId] || null;
}

export function questCeremonySfxSequence(chapterId, { reducedMotion = false } = {}) {
  const material = questChapterMaterialSfxEntry(chapterId);
  const timing = reducedMotion
    ? { gather: 0, lift: 50, land: 150 }
    : { gather: 120, lift: 460, land: 850 };
  return Object.freeze([
    Object.freeze({ delay: 0, key: "seedwake-magic", volume: 0.15, role: "open" }),
    Object.freeze({ delay: timing.gather, key: QUEST_ACTION_SFX.discover.key, volume: 0.12, role: "gather" }),
    Object.freeze({ delay: timing.lift, key: QUEST_ACTION_SFX.pulse.key, volume: 0.18, role: "lift" }),
    ...(material
      ? [Object.freeze({ delay: timing.lift, key: material.key, volume: 0.16, role: "material" })]
      : []),
    Object.freeze({ delay: timing.land, key: "seedwake-success", volume: 0.27, role: "land" })
  ]);
}

const audioBases = new Map();
const activeAudio = new Set();
const INSTRUCTION_ACTION_SCALE = 0.12;
let instructionCueActive = false;

export function questActionSfxMixScale({ instructionActive = instructionCueActive } = {}) {
  return instructionActive ? INSTRUCTION_ACTION_SCALE : 1;
}

export function setQuestActionSfxInstructionActive(active = true) {
  instructionCueActive = Boolean(active);
  if (instructionCueActive) {
    const scale = questActionSfxMixScale();
    activeAudio.forEach(entry => {
      entry.sound.volume = Math.min(entry.sound.volume, entry.nominalVolume * scale);
    });
  }
  return instructionCueActive;
}

export function playQuestActionSfx({ enabled = true, volume = 0.42, ...options } = {}) {
  if (!enabled || typeof Audio === "undefined") return null;
  const entry = questActionSfxEntry(options);
  if (!entry) return null;
  const entries = [
    { ...entry, volume },
    ...(options.kind === "correct" && options.chapterId && questChapterMaterialSfxEntry(options.chapterId)
      ? [{ ...questChapterMaterialSfxEntry(options.chapterId), volume: Math.min(0.2, volume * 0.36) }]
      : [])
  ];
  try {
    return entries.map(soundEntry => {
      let base = audioBases.get(soundEntry.src);
      if (!base) {
        base = new Audio(soundEntry.src);
        base.preload = "auto";
        audioBases.set(soundEntry.src, base);
      }
      const sound = base.cloneNode();
      const nominalVolume = Math.max(0, Math.min(1, Number(soundEntry.volume) || 0));
      sound.volume = nominalVolume * questActionSfxMixScale();
      const activeEntry = { sound, nominalVolume };
      activeAudio.add(activeEntry);
      const release = () => activeAudio.delete(activeEntry);
      sound.addEventListener("ended", release, { once: true });
      sound.addEventListener("error", release, { once: true });
      const result = sound.play();
      if (result?.catch) result.catch(release);
      return sound;
    });
  } catch {
    return null;
  }
}

export function stopQuestActionSfx() {
  for (const { sound } of activeAudio) {
    try {
      sound.pause();
      sound.currentTime = 0;
    } catch {
      // Audio cleanup must never block leaving the trail.
    }
  }
  activeAudio.clear();
}
