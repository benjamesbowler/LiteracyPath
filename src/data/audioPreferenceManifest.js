import { getKimiCleanAudio } from "./kimiCleanAudioManifest.js";
import { initialSoundWordBank } from "../content/initialSounds/initialSoundWordBank.js";
import { initialSoundAudioMediaIds } from "../content/initialSounds/initialSoundImportedMediaStatus.js";

function normalizeAudioPreferenceKey(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/-kimi\d(?:-\d)?$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function wordAudioPath(word) {
  return `/audio/child-mode/words/${word}.mp3`;
}

function phraseAudioPath(phrase) {
  return `/audio/child-mode/phrases/${phrase}.mp3`;
}

function cleanAudioPath(key, category, fallbackPath) {
  const cleanKey = String(key || "").replace(/^hfw:/, "");
  const clean = getKimiCleanAudio(cleanKey);
  if (!clean) return fallbackPath;
  if (category === "hfw" && clean.category !== "hfw") return fallbackPath;
  if (category === "phrases" && clean.category !== "phrases") return fallbackPath;
  if (category === "words" && clean.category !== "words") return fallbackPath;
  return clean.audio || fallbackPath;
}

function approvedPreference({ key, word = key, category, fallbackPath, source, notes, deprecatedAudioPaths = [], reviewNeededPaths = [] }) {
  const preferredAudioPath = cleanAudioPath(key, category, fallbackPath);
  const deprecated = [...deprecatedAudioPaths];

  if (preferredAudioPath !== fallbackPath && fallbackPath) {
    deprecated.unshift(fallbackPath);
  }

  return {
    key,
    word,
    textSpoken: word.replace(/-/g, " "),
    preferredAudioPath,
    deprecatedAudioPaths: [...new Set(deprecated)],
    reviewNeededPaths: [...new Set(reviewNeededPaths)],
    source: preferredAudioPath.includes("/clean-human/")
      ? "kimi_assets6_complete_audio"
      : source,
    status: "approved",
    notes: preferredAudioPath.includes("/clean-human/")
      ? "Approved Pack 6 clean-human audio is preferred; older local/Kimi variants are preserved but not used in Teacher Assessment."
      : notes
  };
}

function reviewNeededPreference({ key, word = key, fallbackPath, source, notes, reviewNeededPaths = [] }) {
  return {
    key,
    word,
    textSpoken: word.replace(/-/g, " "),
    preferredAudioPath: "",
    deprecatedAudioPaths: [],
    reviewNeededPaths: [...new Set([fallbackPath, ...reviewNeededPaths].filter(Boolean))],
    source,
    status: "review_needed",
    notes
  };
}

const approvedWordAudioKeys = [
  "ant", "apple", "axe", "bad", "bag", "ball", "bat", "bear", "bed", "bee",
  "bell", "bid", "big", "bin", "bird", "black", "blue", "boat", "book", "books",
  "box", "boxes", "brush", "brushes", "bud", "bug", "bun", "bus", "cake", "cap",
  "car", "cat", "cats", "chair", "chick", "chip", "clap", "coat", "corn", "cot",
  "crab", "cup", "cups", "cut", "deer", "desk", "dig", "dish", "dishes", "dog",
  "dogs", "dot", "drum", "duck", "dug", "egg", "elephant", "envelope", "fan", "farm",
  "feet", "fin", "fish", "flag", "fork", "fox", "frog", "gate", "girl", "goat",
  "gum", "ham", "hand", "hat", "hats", "hen", "hit", "home", "hook", "hop",
  "horse", "hot", "house", "hut", "igloo", "ink", "insect", "jam", "jet", "jug",
  "key", "kid", "king", "kite", "knife", "lamp", "leaf", "leg", "lid", "lion",
  "listen-icon", "lock", "log", "man", "map", "mat", "meat", "moon", "mop", "mud", "mug",
  "nap", "net", "nose", "nut", "octopus", "orange", "ox", "pan", "park", "pen",
  "phone", "pig", "pin", "pot", "pun", "queen", "quilt", "quiz", "rain", "ram",
  "rat", "red", "ring", "rock", "roof", "rope", "rug", "run", "sea", "seal",
  "seed", "shell", "ship", "shoe", "shop", "sit", "sled", "slide", "snake", "sock",
  "son", "spin", "star", "stop", "sun", "tap", "ten", "tent", "thin", "this",
  "thumb", "tiger", "top", "train", "tree", "tub", "umbrella", "uncle", "under",
  "unicorn", "up", "van", "vase", "vest", "vet", "web", "whale", "wheel", "white",
  "wig", "worm", "yak", "yarn", "yo-yo", "zebra", "zip", "zoo"
];

const approvedHfwAudioKeys = [
  "a", "all", "and", "at", "big", "but", "can", "for", "he", "his",
  "i", "in", "is", "it", "of", "on", "said", "she", "that", "the",
  "then", "they", "this", "to", "under", "was", "we", "with", "you"
];

const approvedPhraseAudioKeys = [
  "excellent-listening",
  "great-job",
  "listen-and-find",
  "listen-carefully",
  "tap-rumble",
  "try-again",
  "which-word-matches",
  "you-found-it"
];

const quarantinedWordAudio = {
  bad: ["bad-kimi3"],
  bat: ["bat-kimi3"],
  bed: ["bed-kimi3"],
  bell: ["bell-kimi4"],
  bid: ["bid-kimi3"],
  boat: ["boat-kimi3"],
  book: ["book-kimi3"],
  bud: ["bud-kimi3"],
  cake: ["cake-kimi4"],
  cap: ["cap-kimi3"],
  cat: ["cat-kimi3"],
  coat: ["coat-kimi3"],
  dig: ["dig-kimi3"],
  dog: ["dog-kimi3"],
  dug: ["dug-kimi3"],
  fish: ["fish-kimi3"],
  flag: ["flag-kimi3"],
  goat: ["goat-kimi3"],
  hat: ["hat-kimi3", "hat-kimi3-2"],
  leaf: ["leaf-kimi3"],
  man: ["man-kimi3"],
  map: ["map-kimi3", "map-kimi3-2"],
  nap: ["nap-kimi3"],
  net: ["net-kimi3"],
  nose: ["nose-kimi4"],
  pan: ["pan-kimi3"],
  pen: ["pen-kimi3"],
  pig: ["pig-kimi3"],
  pot: ["pot-kimi3"],
  shell: ["shell-kimi3"],
  ship: ["ship-kimi3"],
  sit: ["sit-kimi3"],
  snake: ["snake-kimi3", "snake-kimi4"],
  sock: ["sock-kimi3"],
  star: ["star-kimi3"],
  sun: ["sun-kimi3"],
  tree: ["tree-kimi3"],
  whale: ["whale-kimi3"],
  wig: ["wig-kimi3"]
};

const quarantinedPhraseAudio = {
  "excellent-listening": ["excellent-listening-kimi3"],
  "great-job": ["great-job-kimi3"],
  "try-again": ["try-again-kimi3"],
  "which-word-matches": ["which-word-matches-kimi3"],
  "you-found-it": ["you-found-it-kimi3"]
};

const blockedWordAudio = {
  zip: {
    fallbackPath: wordAudioPath("zip"),
    reviewNeededPaths: ["/audio/child-mode/clean-human/words/zip.mp3"],
    source: "live assessment audio review",
    notes: "Blocked from active Teacher Assessment after live testing showed the word audio was pronounced as separated letters instead of the natural word."
  }
};

const approvedFinalSoundsBWordAudio = {
  bib: "/media/final-sounds/audio/b/bib.mp3",
  blob: "/media/final-sounds/audio/b/blob.mp3",
  bulb: "/media/final-sounds/audio/b/bulb.mp3",
  cab: "/media/final-sounds/audio/b/cab.mp3",
  club: "/media/final-sounds/audio/b/club.mp3",
  cob: "/media/final-sounds/audio/b/cob.mp3",
  crib: "/media/final-sounds/audio/b/crib.mp3",
  cub: "/media/final-sounds/audio/b/cub.mp3",
  cube: "/media/final-sounds/audio/b/cube.mp3",
  curb: "/media/final-sounds/audio/b/curb.mp3",
  dab: "/media/final-sounds/audio/b/dab.mp3",
  grab: "/media/final-sounds/audio/b/grab.mp3",
  knob: "/media/final-sounds/audio/b/knob.mp3",
  lab: "/media/final-sounds/audio/b/lab.mp3",
  orb: "/media/final-sounds/audio/b/orb.mp3",
  robe: "/media/final-sounds/audio/b/robe.mp3",
  rub: "/media/final-sounds/audio/b/rub.mp3",
  sub: "/media/final-sounds/audio/b/sub.mp3",
  tube: "/media/final-sounds/audio/b/tube.mp3"
};

export const audioPreferenceManifest = Object.fromEntries([
  ...approvedWordAudioKeys.map(word => [
    word,
    approvedPreference({
      key: word,
      word,
      category: "words",
      fallbackPath: wordAudioPath(word),
      source: "child-mode words",
      notes: "Approved static word MP3 for active assessment playback."
    })
  ]),
  ...Object.entries(approvedFinalSoundsBWordAudio).map(([word, fallbackPath]) => [
    word,
    approvedPreference({
      key: word,
      word,
      category: "words",
      fallbackPath,
      source: "final sounds /b/ level 1 media pack",
      notes: "Approved exact-word MP3 from the imported final /b/ Level 1 media pack."
    })
  ]),
  ...approvedHfwAudioKeys.map(word => [
    `hfw:${word}`,
    approvedPreference({
      key: `hfw:${word}`,
      word,
      category: "hfw",
      fallbackPath: `/audio/child-mode/hfw/${word}.mp3`,
      source: "child-mode hfw",
      notes: "Approved static high-frequency-word MP3 for active assessment playback."
    })
  ]),
  ...approvedPhraseAudioKeys.map(phrase => [
    phrase,
    approvedPreference({
      key: phrase,
      word: phrase,
      category: "phrases",
      fallbackPath: phraseAudioPath(phrase),
      source: "child-mode phrases",
      notes: "Approved static phrase MP3. Teacher assessment uses phrases only when the format explicitly supplies a static audio path."
    })
  ]),
  ...Object.entries(quarantinedWordAudio).map(([word, variants]) => [
    word,
    approvedPreference({
      key: word,
      word,
      category: "words",
      fallbackPath: wordAudioPath(word),
      deprecatedAudioPaths: variants.map(variant => wordAudioPath(variant)),
      reviewNeededPaths: variants.map(variant => wordAudioPath(variant)),
      source: "child-mode words",
      notes: "Kimi alternate is quarantined until human review; stable local word audio remains preferred."
    })
  ]),
  ...Object.entries(quarantinedPhraseAudio).map(([phrase, variants]) => [
    phrase,
    approvedPreference({
      key: phrase,
      word: phrase,
      category: "phrases",
      fallbackPath: phraseAudioPath(phrase),
      deprecatedAudioPaths: variants.map(variant => phraseAudioPath(variant)),
      reviewNeededPaths: variants.map(variant => phraseAudioPath(variant)),
      source: "child-mode phrases",
      notes: "Kimi phrase alternate is quarantined until human review; stable local phrase audio remains preferred."
    })
  ]),
  ...Object.entries(blockedWordAudio).map(([word, config]) => [
    word,
    reviewNeededPreference({
      key: word,
      word,
      ...config
    })
  ])
]);

const pathToPreference = new Map();
const approvedInitialSoundAudioPaths = new Set(
  initialSoundWordBank
    .filter(item => initialSoundAudioMediaIds.has(item.id))
    .map(item => item.audioUrl)
);

for (const preference of Object.values(audioPreferenceManifest)) {
  for (const deprecatedPath of preference.deprecatedAudioPaths || []) {
    pathToPreference.set(deprecatedPath, preference);
  }
  for (const reviewPath of preference.reviewNeededPaths || []) {
    pathToPreference.set(reviewPath, preference);
  }
  if (preference.preferredAudioPath) {
    pathToPreference.set(preference.preferredAudioPath, preference);
  }
}

export function getAudioPreference(keyOrText) {
  const normalizedKey = normalizeAudioPreferenceKey(keyOrText);
  return audioPreferenceManifest[normalizedKey] ||
    audioPreferenceManifest[`hfw:${normalizedKey}`] ||
    null;
}

export function getAudioPreferenceForPath(audioPath) {
  return pathToPreference.get(audioPath) || null;
}

export function getPreferredAudioPath(keyOrText, fallbackPath = "") {
  const preference = getAudioPreferenceForPath(fallbackPath) || getAudioPreference(keyOrText);

  if (!preference) return fallbackPath || "";

  if (fallbackPath && preference.deprecatedAudioPaths?.includes(fallbackPath)) {
    return preference.preferredAudioPath || "";
  }

  if (preference.preferredAudioPath) return preference.preferredAudioPath;
  return fallbackPath || "";
}

export function getApprovedAudioPath(keyOrText, fallbackPath = "") {
  if (fallbackPath && approvedInitialSoundAudioPaths.has(fallbackPath)) return fallbackPath;

  const preference = getAudioPreferenceForPath(fallbackPath) || getAudioPreference(keyOrText);

  if (!preference || preference.status !== "approved") return "";
  return preference.preferredAudioPath || "";
}

export function isApprovedAudioPath(audioPath) {
  const preference = getAudioPreferenceForPath(audioPath);
  return Boolean(preference?.status === "approved" && preference.preferredAudioPath === audioPath);
}

export function getAudioPreferenceStatus(keyOrText, fallbackPath = "") {
  const preference = getAudioPreferenceForPath(fallbackPath) || getAudioPreference(keyOrText);
  return preference?.status || "missing";
}

export function isReviewNeededAudioPath(audioPath) {
  const preference = getAudioPreferenceForPath(audioPath);
  return Boolean(preference?.reviewNeededPaths?.includes(audioPath));
}

export function isDeprecatedAudioPath(audioPath) {
  const preference = getAudioPreferenceForPath(audioPath);
  return Boolean(preference?.deprecatedAudioPaths?.includes(audioPath));
}

export function getAudioReviewNote(audioPath) {
  const preference = getAudioPreferenceForPath(audioPath);
  return preference?.notes || "";
}

export { normalizeAudioPreferenceKey };
