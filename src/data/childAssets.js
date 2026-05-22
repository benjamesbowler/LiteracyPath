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

export const childWordAssets = {
  bad: wordAsset({
    word: "bad",
    image: "/images/child-mode/cvc/bad.png",
    audio: "/audio/child-mode/words/bad.mp3"
  }),
  bag: wordAsset({
    word: "bag",
    image: "/images/child-mode/cvc/bag.png",
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
  bid: wordAsset({
    word: "bid",
    image: "/images/child-mode/cvc/bid.png",
    audio: "/audio/child-mode/words/bid.mp3"
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
  coat: wordAsset({
    word: "coat",
    image: "/images/child-mode/vowels/coat.png",
    audio: "/audio/child-mode/words/coat.mp3",
    fallbackImage: "/images/vowels/coat.svg",
    alt: "A coat"
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
  fish: wordAsset({
    word: "fish",
    image: "/images/child-mode/cvc/fish.png",
    audio: "/audio/child-mode/words/fish.mp3",
    fallbackImage: "/images/objects/fish.svg",
    alt: "A fish"
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
    fallbackImage: "/images/child-mode/cvc/hat.png",
    alt: "Placeholder for ham"
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
    fallbackImage: "/images/child-mode/cvc/cap.png",
    alt: "Placeholder for jam"
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
  nap: wordAsset({
    word: "nap",
    image: "/images/child-mode/cvc/nap.png",
    audio: "/audio/child-mode/words/nap.mp3",
    fallbackImage: "/images/cvc/nap.svg",
    alt: "A nap"
  }),
  pan: wordAsset({
    word: "pan",
    image: "/images/child-mode/cvc/pan.png",
    audio: "/audio/child-mode/words/pan.mp3",
    fallbackImage: "/images/cvc/pan.svg",
    alt: "A pan"
  }),
  ram: wordAsset({
    word: "ram",
    fallbackImage: "/images/child-mode/vowels/goat.png",
    alt: "Placeholder for ram"
  }),
  sun: wordAsset({
    word: "sun",
    image: "/images/child-mode/cvc/sun.png",
    audio: "/audio/child-mode/words/sun.mp3"
  })
};

export const childPhraseAudio = {
  "excellent listening": "/audio/child-mode/phrases/excellent-listening.mp3",
  "great job": "/audio/child-mode/phrases/great-job.mp3",
  "listen and find": "/audio/child-mode/phrases/listen-and-find.mp3",
  "try again": "/audio/child-mode/phrases/try-again.mp3",
  "which word matches": "/audio/child-mode/phrases/which-word-matches.mp3",
  "which word matches the picture?": "/audio/child-mode/phrases/which-word-matches.mp3",
  "you found it": "/audio/child-mode/phrases/you-found-it.mp3"
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
  return childWordAssets[normalizeAssetKey(word)] || null;
}

export function getChildAudioPath(text) {
  const key = normalizeAssetKey(text);
  return childWordAssets[key]?.audio || childPhraseAudio[key] || "";
}
