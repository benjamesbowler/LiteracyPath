import { kimiAssets2WordAssets } from "./kimiAssets2Manifest.js";
import { kimiAssets3WordAssets } from "./kimiAssets3Manifest.js";
import { kimiAssets4WordAssets } from "./kimiAssets4Manifest.js";

function normalizeAssetKey(value) {
  return String(value || "").toLowerCase().trim();
}

function wordAsset({
  word,
  image = "",
  audio = "",
  fallbackImage = "",
  alt = ""
}) {
  return {
    word,
    image,
    audio,
    fallbackImage,
    alt: alt || `Picture for ${word}`
  };
}

function childModeWordAsset({ word, folder, audio = true, alt = "" }) {
  return wordAsset({
    word,
    image: `/images/child-mode/${folder}/${word}.png`,
    audio: audio ? `/audio/child-mode/words/${word}.mp3` : "",
    alt: alt || `Picture for ${word}`
  });
}

export const childWordAssets = {
  bad: wordAsset({
    word: "bad",
    image: "/images/child-mode/cvc/bad.png",
    audio: "/audio/child-mode/words/bad.mp3"
  }),
  bag: wordAsset({
    word: "bag",
    image: "/images/child-mode/cvc/bag.png",
    audio: "/audio/child-mode/words/bag.mp3",
    fallbackImage: "/images/child-mode/cvc/cap.png",
    alt: "A paper bag"
  }),
  bat: wordAsset({
    word: "bat",
    image: "/images/child-mode/cvc/bat.png",
    audio: "/audio/child-mode/words/bat.mp3",
    fallbackImage: "/images/cvc/bat.svg",
    alt: "A baseball bat"
  }),
  bed: wordAsset({
    word: "bed",
    image: "/images/child-mode/cvc/bed.png",
    audio: "/audio/child-mode/words/bed.mp3",
    fallbackImage: "/images/vowels/bed.svg",
    alt: "A bed"
  }),
  big: childModeWordAsset({
    word: "big",
    folder: "short-i"
  }),
  bid: wordAsset({
    word: "bid",
    image: "/images/child-mode/cvc/bid.png",
    audio: "/audio/child-mode/words/bid.mp3"
  }),
  black: childModeWordAsset({
    word: "black",
    folder: "blends"
  }),
  blue: childModeWordAsset({
    word: "blue",
    folder: "blends"
  }),
  boat: wordAsset({
    word: "boat",
    image: "/images/child-mode/vowels/boat.png",
    audio: "/audio/child-mode/words/boat.mp3",
    fallbackImage: "/images/vowels/boat.svg",
    alt: "A boat"
  }),
  book: wordAsset({
    word: "book",
    image: "/images/child-mode/cvc/book.png",
    audio: "/audio/child-mode/words/book.mp3",
    fallbackImage: "/images/objects/book.svg",
    alt: "A book"
  }),
  bud: wordAsset({
    word: "bud",
    image: "/images/child-mode/cvc/bud.png",
    audio: "/audio/child-mode/words/bud.mp3"
  }),
  bug: wordAsset({
    word: "bug",
    image: "/images/child-mode/cvc/bug.png",
    audio: "/audio/child-mode/words/bug.mp3",
    fallbackImage: "/images/child-mode/short-u/bug.png",
    alt: "A bug"
  }),
  bus: childModeWordAsset({
    word: "bus",
    folder: "short-u",
    audio: false
  }),
  cap: wordAsset({
    word: "cap",
    image: "/images/child-mode/cvc/cap.png",
    audio: "/audio/child-mode/words/cap.mp3",
    fallbackImage: "/images/cvc/cap.svg",
    alt: "A cap"
  }),
  cat: wordAsset({
    word: "cat",
    image: "/images/child-mode/cvc/cat.png",
    audio: "/audio/child-mode/words/cat.mp3",
    fallbackImage: "/images/cvc/cat.svg",
    alt: "A cat"
  }),
  chair: childModeWordAsset({
    word: "chair",
    folder: "digraphs"
  }),
  cloud: childModeWordAsset({
    word: "cloud",
    folder: "blends",
    audio: false
  }),
  coat: wordAsset({
    word: "coat",
    image: "/images/child-mode/vowels/coat.png",
    audio: "/audio/child-mode/words/coat.mp3",
    fallbackImage: "/images/vowels/coat.svg",
    alt: "A coat"
  }),
  cot: childModeWordAsset({
    word: "cot",
    folder: "minimal-pairs",
    audio: false
  }),
  cup: childModeWordAsset({
    word: "cup",
    folder: "short-u"
  }),
  cut: childModeWordAsset({
    word: "cut",
    folder: "minimal-pairs",
    audio: false
  }),
  dig: wordAsset({
    word: "dig",
    image: "/images/child-mode/cvc/dig.png",
    audio: "/audio/child-mode/words/dig.mp3"
  }),
  dog: wordAsset({
    word: "dog",
    image: "/images/child-mode/cvc/dog.png",
    audio: "/audio/child-mode/words/dog.mp3",
    fallbackImage: "/images/objects/dog.svg",
    alt: "A dog"
  }),
  drum: childModeWordAsset({
    word: "drum",
    folder: "blends"
  }),
  dot: wordAsset({
    word: "dot",
    image: "/images/child-mode/cvc/dot.png",
    audio: "/audio/child-mode/words/dot.mp3"
  }),
  dug: wordAsset({
    word: "dug",
    image: "/images/child-mode/cvc/dug.png",
    audio: "/audio/child-mode/words/dug.mp3"
  }),
  duck: childModeWordAsset({
    word: "duck",
    folder: "short-u",
    audio: false
  }),
  fin: childModeWordAsset({
    word: "fin",
    folder: "short-i"
  }),
  fish: wordAsset({
    word: "fish",
    image: "/images/child-mode/cvc/fish.png",
    audio: "/audio/child-mode/words/fish.mp3",
    fallbackImage: "/images/objects/fish.svg",
    alt: "A fish"
  }),
  flag: childModeWordAsset({
    word: "flag",
    folder: "blends"
  }),
  fox: childModeWordAsset({
    word: "fox",
    folder: "short-o",
    audio: false
  }),
  frog: childModeWordAsset({
    word: "frog",
    folder: "blends"
  }),
  goat: wordAsset({
    word: "goat",
    image: "/images/child-mode/vowels/goat.png",
    audio: "/audio/child-mode/words/goat.mp3",
    fallbackImage: "/images/vowels/goat.svg",
    alt: "A goat"
  }),
  ham: wordAsset({
    word: "ham",
    image: "/images/child-mode/short-a/ham.png",
    audio: "/audio/child-mode/words/ham.mp3",
    fallbackImage: "/images/child-mode/cvc/hat.png",
    alt: "Ham"
  }),
  hat: wordAsset({
    word: "hat",
    image: "/images/child-mode/cvc/hat.png",
    audio: "/audio/child-mode/words/hat.mp3",
    fallbackImage: "/images/cvc/hat.svg",
    alt: "A hat"
  }),
  jam: wordAsset({
    word: "jam",
    image: "/images/child-mode/short-a/jam.png",
    audio: "/audio/child-mode/words/jam.mp3",
    fallbackImage: "/images/child-mode/cvc/cap.png",
    alt: "A jar of jam"
  }),
  jet: childModeWordAsset({
    word: "jet",
    folder: "short-e",
    audio: false
  }),
  leg: childModeWordAsset({
    word: "leg",
    folder: "short-e"
  }),
  lid: childModeWordAsset({
    word: "lid",
    folder: "short-i"
  }),
  log: wordAsset({
    word: "log",
    image: "/images/child-mode/cvc/log.png",
    audio: "/audio/child-mode/words/log.mp3",
    fallbackImage: "/images/child-mode/short-o/log.png",
    alt: "A log"
  }),
  man: wordAsset({
    word: "man",
    image: "/images/child-mode/cvc/man.png",
    audio: "/audio/child-mode/words/man.mp3",
    fallbackImage: "/images/cvc/man.svg",
    alt: "A man"
  }),
  map: wordAsset({
    word: "map",
    image: "/images/child-mode/cvc/map.png",
    audio: "/audio/child-mode/words/map.mp3",
    fallbackImage: "/images/cvc/map.svg",
    alt: "A map"
  }),
  mop: childModeWordAsset({
    word: "mop",
    folder: "short-o"
  }),
  mud: childModeWordAsset({
    word: "mud",
    folder: "short-u"
  }),
  mug: wordAsset({
    word: "mug",
    image: "/images/child-mode/cvc/mug.png",
    audio: "/audio/child-mode/words/mug.mp3",
    fallbackImage: "/images/child-mode/short-u/mug.png",
    alt: "A mug"
  }),
  nap: wordAsset({
    word: "nap",
    image: "/images/child-mode/cvc/nap.png",
    audio: "/audio/child-mode/words/nap.mp3",
    fallbackImage: "/images/cvc/nap.svg",
    alt: "A nap"
  }),
  net: childModeWordAsset({
    word: "net",
    folder: "short-e"
  }),
  nut: childModeWordAsset({
    word: "nut",
    folder: "short-u"
  }),
  pan: wordAsset({
    word: "pan",
    image: "/images/child-mode/cvc/pan.png",
    audio: "/audio/child-mode/words/pan.mp3",
    fallbackImage: "/images/cvc/pan.svg",
    alt: "A pan"
  }),
  pen: childModeWordAsset({
    word: "pen",
    folder: "short-e"
  }),
  phone: childModeWordAsset({
    word: "phone",
    folder: "digraphs"
  }),
  pig: childModeWordAsset({
    word: "pig",
    folder: "short-i"
  }),
  pin: childModeWordAsset({
    word: "pin",
    folder: "minimal-pairs",
    audio: false
  }),
  pot: wordAsset({
    word: "pot",
    image: "/images/child-mode/cvc/pot.png",
    audio: "/audio/child-mode/words/pot.mp3",
    fallbackImage: "/images/child-mode/short-o/pot.png",
    alt: "A pot"
  }),
  pun: childModeWordAsset({
    word: "pun",
    folder: "minimal-pairs",
    audio: false
  }),
  ram: wordAsset({
    word: "ram",
    image: "/images/child-mode/short-a/ram.png",
    audio: "/audio/child-mode/words/ram.mp3",
    fallbackImage: "/images/child-mode/vowels/goat.png",
    alt: "A ram"
  }),
  red: childModeWordAsset({
    word: "red",
    folder: "short-e"
  }),
  rock: childModeWordAsset({
    word: "rock",
    folder: "short-o"
  }),
  shell: childModeWordAsset({
    word: "shell",
    folder: "digraphs"
  }),
  ship: childModeWordAsset({
    word: "ship",
    folder: "digraphs"
  }),
  sit: childModeWordAsset({
    word: "sit",
    folder: "short-i"
  }),
  slide: childModeWordAsset({
    word: "slide",
    folder: "blends",
    audio: false
  }),
  snake: childModeWordAsset({
    word: "snake",
    folder: "blends"
  }),
  sock: childModeWordAsset({
    word: "sock",
    folder: "short-o"
  }),
  star: childModeWordAsset({
    word: "star",
    folder: "blends"
  }),
  sun: wordAsset({
    word: "sun",
    image: "/images/child-mode/cvc/sun.png",
    audio: "/audio/child-mode/words/sun.mp3",
    fallbackImage: "/images/child-mode/short-u/sun.png"
  }),
  thumb: childModeWordAsset({
    word: "thumb",
    folder: "digraphs"
  }),
  tree: childModeWordAsset({
    word: "tree",
    folder: "blends"
  }),
  web: childModeWordAsset({
    word: "web",
    folder: "short-e",
    audio: false
  }),
  whale: childModeWordAsset({
    word: "whale",
    folder: "digraphs"
  }),
  wig: childModeWordAsset({
    word: "wig",
    folder: "short-i"
  }),
  zip: childModeWordAsset({
    word: "zip",
    folder: "short-i"
  })
};

export const childPhraseAudio = {
  "excellent listening": "/audio/child-mode/phrases/excellent-listening.mp3",
  "great job": "/audio/child-mode/phrases/great-job.mp3",
  "listen and find": "/audio/child-mode/phrases/listen-and-find.mp3",
  "listen carefully": "/audio/child-mode/phrases/listen-carefully.mp3",
  "tap rumble": "/audio/child-mode/phrases/tap-rumble.mp3",
  "tap rumble to hear it again": "/audio/child-mode/phrases/tap-rumble.mp3",
  "tap rumble to hear it again.": "/audio/child-mode/phrases/tap-rumble.mp3",
  "try again": "/audio/child-mode/phrases/try-again.mp3",
  "which word matches": "/audio/child-mode/phrases/which-word-matches.mp3",
  "which word matches the picture?": "/audio/child-mode/phrases/which-word-matches.mp3",
  "you found it": "/audio/child-mode/phrases/you-found-it.mp3"
};

export const childModeUiAssets = {
  caveButtonPanel: "/images/child-mode/ui/cave_button_panel.png",
  caveRewardIcon: "/images/child-mode/ui/cave_reward_icon.png",
  crystalShards: "/images/child-mode/ui/crystal_shards.png",
  crystalSparkleParticles: "/images/child-mode/ui/crystal_sparkle_particles.png",
  floatingCrystal: "/images/child-mode/ui/floating_crystal.png",
  glowBurst: "/images/child-mode/ui/glow_burst.png",
  magicalParticles: "/images/child-mode/ui/magical_particles.png",
  masteryBadge: "/images/child-mode/ui/mastery_badge.png",
  rewardStar: "/images/child-mode/ui/reward_star.png",
  successSparkle: "/images/child-mode/ui/success_sparkle.png"
};

export const echoCavesAssets = {
  background: "/images/child-mode/echo-caves/cave-background.png",
  crystalCluster: "/images/child-mode/echo-caves/crystal-cluster.png",
  crystalIcon: "/images/child-mode/echo-caves/crystal-icon.png",
  missionCardBackground: "/images/child-mode/echo-caves/mission-card-bg.png",
  rewardBadge: "/images/child-mode/echo-caves/reward-badge.png",
  sparkleParticles: "/images/child-mode/echo-caves/sparkle-particles.png",
  steppingStones: "/images/child-mode/echo-caves/stepping-stones.png",
  tunnelEntrance: "/images/child-mode/echo-caves/tunnel-entrance.png",
  uiPanelBackground: "/images/child-mode/echo-caves/ui-panel-bg.png"
};

export const rumbleAssets = {
  celebrating: "/images/child-mode/rumble/rumble-celebrating.png",
  encouraging: "/images/child-mode/rumble/rumble-encouraging.png",
  excited: "/images/child-mode/rumble/rumble-excited.png",
  happy: "/images/child-mode/rumble/rumble-happy.png",
  idle: "/images/child-mode/rumble/rumble-idle.png",
  listening: "/images/child-mode/rumble/rumble-listening.png",
  pointing: "/images/child-mode/rumble/rumble-pointing.png"
};

export function getChildWordAsset(word) {
  const key = normalizeAssetKey(word);
  const localAsset = childWordAssets[key];
  const kimiAsset = kimiAssets2WordAssets[key];
  const kimi3Asset = kimiAssets3WordAssets[key];
  const kimi4Asset = kimiAssets4WordAssets[key];

  if (!localAsset && !kimiAsset && !kimi3Asset) return kimi4Asset || null;
  if (!localAsset && !kimiAsset && kimi3Asset && !kimi4Asset) return kimi3Asset;
  if (!localAsset && kimiAsset && !kimi3Asset && !kimi4Asset) return kimiAsset;
  if (!localAsset && (kimiAsset || kimi3Asset || kimi4Asset)) {
    return {
      ...(kimiAsset || kimi3Asset || kimi4Asset),
      image: kimiAsset?.image || kimi3Asset?.image || kimi4Asset?.image,
      audio: kimiAsset?.audio || kimi3Asset?.audio || kimi4Asset?.audio,
      fallbackImage: kimiAsset?.fallbackImage || kimi3Asset?.image || kimi4Asset?.image || kimi3Asset?.fallbackImage || kimi4Asset?.fallbackImage,
      source: kimiAsset?.source || kimi3Asset?.source || kimi4Asset?.source
    };
  }
  if (localAsset && !kimiAsset && !kimi3Asset && !kimi4Asset) return localAsset;

  return {
    ...localAsset,
    image: localAsset.image || kimiAsset?.image || kimi3Asset?.image || kimi4Asset?.image,
    audio: localAsset.audio || kimiAsset?.audio || kimi3Asset?.audio || kimi4Asset?.audio,
    fallbackImage: localAsset.fallbackImage || kimiAsset?.image || kimi3Asset?.image || kimi4Asset?.image || kimiAsset?.fallbackImage || kimi3Asset?.fallbackImage || kimi4Asset?.fallbackImage,
    source: localAsset.source || kimiAsset?.source || kimi3Asset?.source || kimi4Asset?.source
  };
}

export function getChildAudioPath(text) {
  const key = normalizeAssetKey(text);
  return childWordAssets[key]?.audio || kimiAssets2WordAssets[key]?.audio || kimiAssets3WordAssets[key]?.audio || kimiAssets4WordAssets[key]?.audio || childPhraseAudio[key] || "";
}
