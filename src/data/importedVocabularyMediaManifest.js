const importedVocabularyMedia = {
  "a blanket fort": {
    audio: "/media/vocabulary/audio/a-blanket-fort.mp3",
    textSpoken: "a blanket fort"
  },
  bellshell: {
    audio: "/media/vocabulary/audio/bellshell.mp3",
    textSpoken: "bell, shell"
  },
  burn: {
    audio: "/media/vocabulary/audio/burn.mp3",
    textSpoken: "burn"
  },
  cute: {
    audio: "/media/vocabulary/audio/cute.mp3",
    textSpoken: "cute"
  },
  day: {
    audio: "/media/vocabulary/audio/day.mp3",
    textSpoken: "day"
  },
  dishfish: {
    audio: "/media/vocabulary/audio/dishfish.mp3",
    textSpoken: "dish, fish"
  },
  five: {
    audio: "/media/vocabulary/audio/five.mp3",
    textSpoken: "five"
  },
  fog: {
    image: "/media/vocabulary/images/fog.webp",
    audio: "/media/vocabulary/audio/fog.mp3",
    textSpoken: "fog"
  },
  game: {
    audio: "/media/vocabulary/audio/game.mp3",
    textSpoken: "game"
  },
  hear: {
    audio: "/media/vocabulary/audio/hear.mp3",
    textSpoken: "hear"
  },
  june: {
    audio: "/media/vocabulary/audio/june.mp3",
    textSpoken: "june"
  },
  kingring: {
    audio: "/media/vocabulary/audio/kingring.mp3",
    textSpoken: "king, ring"
  },
  loud: {
    audio: "/media/vocabulary/audio/loud.mp3",
    textSpoken: "loud"
  },
  name: {
    audio: "/media/vocabulary/audio/name.mp3",
    textSpoken: "name"
  },
  night: {
    image: "/media/vocabulary/images/night.webp"
  },
  pete: {
    audio: "/media/vocabulary/audio/pete.mp3",
    textSpoken: "Pete"
  },
  quietly: {
    audio: "/media/vocabulary/audio/quietly.mp3",
    textSpoken: "quietly"
  },
  shine: {
    audio: "/media/vocabulary/audio/shine.mp3",
    textSpoken: "shine"
  },
  silent: {
    audio: "/media/vocabulary/audio/silent.mp3",
    textSpoken: "silent"
  },
  teacher: {
    audio: "/media/vocabulary/audio/teacher.mp3",
    textSpoken: "teacher"
  },
  theme: {
    audio: "/media/vocabulary/audio/theme.mp3",
    textSpoken: "theme"
  },
  these: {
    audio: "/media/vocabulary/audio/these.mp3",
    textSpoken: "these"
  },
  tune: {
    audio: "/media/vocabulary/audio/tune.mp3",
    textSpoken: "tune"
  },
  turn: {
    audio: "/media/vocabulary/audio/turn.mp3",
    textSpoken: "turn"
  },
  will: {
    image: "/media/vocabulary/images/will.webp"
  },
  win: {
    audio: "/media/vocabulary/audio/win.mp3",
    textSpoken: "win"
  }
};

export const importedVocabularyMediaManifest = Object.fromEntries(
  Object.entries(importedVocabularyMedia).map(([key, value]) => [
    key.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    {
      key,
      source: "kimi_strict_missing_media_import_2026_05_27",
      status: "approved",
      ...value
    }
  ])
);

export function getImportedVocabularyMedia(keyOrText = "") {
  const key = String(keyOrText || "")
    .toLowerCase()
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return importedVocabularyMediaManifest[key] || null;
}
