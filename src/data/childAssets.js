import { childWordMediaManifest } from "./childWordMediaManifest.js";
import { k3VocabularyMedia } from "./generated/k3VocabularyMediaManifest.generated.js";
import { getPreferredAudioPath } from "./audioPreferenceManifest.js";

function normalizeAssetKey(value) {
  return String(value || "").toLowerCase().trim().replace(/[.!?]+$/, "");
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

const blockedAssessmentImageAssetNotes = {
  bid: "The current bid image shows a flower/bud and is blocked from active image-backed assessment use until a correct replacement is QA-approved. Clean audio is preserved.",
  bud: "The current bud image is visually ambiguous and is blocked from active assessment use until a clear unopened flower bud replacement is QA-approved. Clean audio is preserved.",
  nut: "The current nut image looks like an acorn and is blocked from active assessment use. Audio is preserved."
};

// These child-safe pictures were visually reviewed for a single, concrete
// meaning before being admitted to image-led Learn Games. Keeping the
// overrides here lets every game use the normal recorded-word audio resolver
// while preventing ambiguous text-only cards from reaching children.
const curatedChildWordImageOverrides = {
  alligator: "/media/vocabulary/images/alligator.webp",
  bath: "/images/assessment/digraphs/bath.webp",
  bench: "/media/vocabulary/images/bench.webp",
  branch: "/media/vocabulary/images/branch.webp",
  chin: "/media/vocabulary/images/chin.webp",
  chop: "/media/vocabulary/images/chop.webp",
  crunch: "/images/assessment/generated/sequencing/child-bites-apple.webp",
  den: "/media/vocabulary/images/den.webp",
  drink: "/media/vocabulary/images/drink.webp",
  fast: "/media/vocabulary/images/fast.webp",
  frost: "/media/vocabulary/images/frost.webp",
  grin: "/media/vocabulary/images/grin.webp",
  grump: "/images/emotions/angry_child.webp",
  jig: "/images/assessment/generated/concepts/dancer.webp",
  jump: "/media/initial-sounds/images/j/jump.webp",
  kick: "/media/vocabulary/images/kick.webp",
  kit: "/media/vocabulary/images/kit.webp",
  long: "/media/vocabulary/images/long.webp",
  lunch: "/images/assessment/digraphs/lunch.webp",
  milk: "/images/assessment/blends/milk.webp",
  moth: "/media/vocabulary/images/moth.webp",
  munch: "/images/assessment/language/variants/antonyms-synonyms/eat-munch-01.webp",
  nest: "/images/assessment/blends/nest.webp",
  pet: "/media/vocabulary/images/pet.webp",
  shrimp: "/images/assessment/blends/shrimp.webp",
  sing: "/images/assessment/generated/concepts/sing.webp",
  slept: "/media/vocabulary/images/sleeping.webp",
  snap: "/media/vocabulary/images/snap.webp",
  soft: "/media/vocabulary/images/soft.webp",
  splash: "/images/assessment/blends/splash.webp",
  spring: "/media/vocabulary/images/spring.webp",
  stretch: "/images/assessment/language/variants/verbs/stretch-01.webp",
  swim: "/media/vocabulary/images/swim.webp",
  swift: "/media/vocabulary/images/fast.webp",
  thank: "/images/assessment/hfw/variants/hfw-76-100/thank-l1p1-02.webp",
  thrill: "/images/emotions/excited_child.webp",
  wet: "/media/vocabulary/images/wet.webp"
};

function blockAssessmentImageIfNeeded(key, asset, { allowBlockedAssessmentImage = false } = {}) {
  if (!asset || !Object.hasOwn(blockedAssessmentImageAssetNotes, key)) return asset;
  if (allowBlockedAssessmentImage) return asset;
  return {
    ...asset,
    image: "",
    fallbackImage: "",
    qaStatus: "needs_image_replacement",
    qaNotes: blockedAssessmentImageAssetNotes[key]
  };
}

export const childWordAssets = {
  bad: wordAsset({
    word: "bad",
    image: "/images/child-mode/cvc/bad.webp",
    audio: "/audio/child-mode/words/bad.mp3"
  }),
  bag: wordAsset({
    word: "bag",
    image: "/images/child-mode/cvc/bag.webp",
    audio: "/audio/child-mode/words/bag.mp3",
    fallbackImage: "/images/child-mode/cvc/cap.webp",
    alt: "A paper bag"
  }),
  bang: wordAsset({
    word: "bang",
    image: "/media/learn/images/cycle-23/bang.webp",
    audio: "/guided-reading/audio/words/bang.mp3",
    alt: "A bang sound effect"
  }),
  bat: wordAsset({
    word: "bat",
    image: "/images/child-mode/cvc/bat.webp",
    audio: "/audio/child-mode/words/bat.mp3",
    fallbackImage: "/images/child-mode/cvc/bat.webp",
    alt: "A bat"
  }),
  bed: wordAsset({
    word: "bed",
    image: "/images/child-mode/cvc/bed.webp",
    audio: "/audio/child-mode/words/bed.mp3",
    fallbackImage: "/images/child-mode/cvc/bed.webp",
    alt: "A bed"
  }),
  bench: wordAsset({
    word: "bench",
    image: "/images/assessment/objective-words/bench.webp",
    fallbackImage: "/images/assessment/objective-words/bench.webp",
    alt: "A bench"
  }),
  brush: wordAsset({
    word: "brush",
    image: "/images/assessment/objective-words/brush.webp",
    fallbackImage: "/images/assessment/objective-words/brush.webp",
    alt: "A brush"
  }),
  big: childModeWordAsset({
    word: "big",
    folder: "short-i"
  }),
  bid: wordAsset({
    word: "bid",
    image: "/images/child-mode/cvc/bid.webp",
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
    image: "/images/child-mode/vowels/boat.webp",
    audio: "/audio/child-mode/words/boat.mp3",
    fallbackImage: "/images/vowels/boat.svg",
    alt: "A boat"
  }),
  book: wordAsset({
    word: "book",
    image: "/images/child-mode/cvc/book.webp",
    audio: "/audio/child-mode/words/book.mp3",
    fallbackImage: "/images/objects/book.svg",
    alt: "A book"
  }),
  bread: wordAsset({
    word: "bread",
    image: "/images/assessment/objective-words/bread.webp",
    fallbackImage: "/images/assessment/objective-words/bread.webp",
    audio: "/media/vocabulary/audio/bread.mp3",
    alt: "Bread"
  }),
  bud: wordAsset({
    word: "bud",
    image: "/images/child-mode/cvc/bud.webp",
    audio: "/audio/child-mode/words/bud.mp3"
  }),
  bug: wordAsset({
    word: "bug",
    image: "/images/child-mode/cvc/bug.webp",
    audio: "/audio/child-mode/words/bug.mp3",
    fallbackImage: "/images/child-mode/short-u/bug.webp",
    alt: "A bug"
  }),
  bus: childModeWordAsset({
    word: "bus",
    folder: "short-u",
    audio: false
  }),
  cap: wordAsset({
    word: "cap",
    image: "/images/child-mode/cvc/cap.webp",
    audio: "/audio/child-mode/words/cap.mp3",
    fallbackImage: "/images/cvc/cap.svg",
    alt: "A cap"
  }),
  cat: wordAsset({
    word: "cat",
    image: "/images/child-mode/cvc/cat.webp",
    audio: "/audio/child-mode/words/cat.mp3",
    fallbackImage: "/images/cvc/cat.svg",
    alt: "A cat"
  }),
  can: wordAsset({
    word: "can",
    image: "/media/vocabulary/images/can.webp",
    audio: "/media/vocabulary/audio/can.mp3",
    alt: "A can"
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
  clock: wordAsset({
    word: "clock",
    image: "/media/vocabulary/images/clock.webp",
    audio: "/audio/child-mode/clean-human/words/clock.mp3",
    alt: "A clock"
  }),
  coat: wordAsset({
    word: "coat",
    image: "/images/child-mode/vowels/coat.webp",
    audio: "/audio/child-mode/words/coat.mp3",
    fallbackImage: "/images/vowels/coat.svg",
    alt: "A coat"
  }),
  cot: childModeWordAsset({
    word: "cot",
    folder: "minimal-pairs",
    audio: false
  }),
  cup: wordAsset({
    word: "cup",
    image: "/images/assessment/objective-words/cup.webp",
    fallbackImage: "/images/assessment/objective-words/cup.webp",
    audio: "/audio/child-mode/words/cup.mp3",
    alt: "A cup"
  }),
  cut: childModeWordAsset({
    word: "cut",
    folder: "minimal-pairs",
    audio: false
  }),
  dig: wordAsset({
    word: "dig",
    image: "/images/child-mode/cvc/dig.webp",
    audio: "/audio/child-mode/words/dig.mp3"
  }),
  dog: wordAsset({
    word: "dog",
    image: "/images/child-mode/cvc/dog.webp",
    audio: "/audio/child-mode/words/dog.mp3",
    fallbackImage: "/images/objects/dog.svg",
    alt: "A dog"
  }),
  dress: wordAsset({
    word: "dress",
    image: "/media/vocabulary/images/dress.webp",
    audio: "/media/vocabulary/audio/dress.mp3",
    alt: "A dress"
  }),
  drum: wordAsset({
    word: "drum",
    image: "/images/assessment/blends/drum.webp",
    fallbackImage: "/images/assessment/blends/drum.webp",
    audio: "/audio/child-mode/words/drum.mp3",
    alt: "A drum"
  }),
  dot: wordAsset({
    word: "dot",
    image: "/images/child-mode/cvc/dot.webp",
    audio: "/audio/child-mode/words/dot.mp3"
  }),
  dug: wordAsset({
    word: "dug",
    image: "/images/child-mode/cvc/dug.webp",
    audio: "/audio/child-mode/words/dug.mp3"
  }),
  duck: childModeWordAsset({
    word: "duck",
    folder: "short-u",
    audio: false
  }),
  gong: wordAsset({
    word: "gong",
    image: "/media/learn/images/cycle-23/gong.webp",
    audio: "",
    alt: "A gong"
  }),
  hang: wordAsset({
    word: "hang",
    image: "/media/learn/images/cycle-23/hang.webp",
    audio: "/media/vocabulary/audio/hang.mp3",
    alt: "A hanging object"
  }),
  fin: childModeWordAsset({
    word: "fin",
    folder: "short-i"
  }),
  fig: wordAsset({
    word: "fig",
    image: "/media/vocabulary/images/fig.webp",
    audio: "/media/vocabulary/audio/fig.mp3",
    alt: "A fig"
  }),
  fish: wordAsset({
    word: "fish",
    image: "/images/child-mode/cvc/fish.webp",
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
  fun: wordAsset({
    word: "fun",
    image: "/media/vocabulary/images/fun.webp",
    audio: "/media/vocabulary/audio/fun.mp3",
    alt: "Children having fun"
  }),
  glass: wordAsset({
    word: "glass",
    image: "/images/assessment/objective-words/glass.webp",
    fallbackImage: "/images/assessment/objective-words/glass.webp",
    audio: "/media/vocabulary/audio/glass.mp3",
    alt: "A glass"
  }),
  goat: wordAsset({
    word: "goat",
    image: "/images/child-mode/vowels/goat.webp",
    audio: "/audio/child-mode/words/goat.mp3",
    fallbackImage: "/images/vowels/goat.svg",
    alt: "A goat"
  }),
  ham: wordAsset({
    word: "ham",
    image: "/images/child-mode/short-a/ham.webp",
    audio: "/audio/child-mode/words/ham.mp3",
    fallbackImage: "/images/child-mode/cvc/hat.webp",
    alt: "Ham"
  }),
  hat: wordAsset({
    word: "hat",
    image: "/images/child-mode/cvc/hat.webp",
    audio: "/audio/child-mode/words/hat.mp3",
    fallbackImage: "/images/cvc/hat.svg",
    alt: "A hat"
  }),
  jam: wordAsset({
    word: "jam",
    image: "/images/child-mode/short-a/jam.webp",
    audio: "/audio/child-mode/words/jam.mp3",
    fallbackImage: "/images/child-mode/cvc/cap.webp",
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
  lip: wordAsset({
    word: "lip",
    image: "/media/vocabulary/images/lip.webp",
    audio: "/audio/child-mode/clean-human/words/lip.mp3",
    fallbackImage: "/media/rhyming/images/lip.webp",
    alt: "Lips"
  }),
  lid: childModeWordAsset({
    word: "lid",
    folder: "short-i"
  }),
  log: wordAsset({
    word: "log",
    image: "/images/child-mode/cvc/log.webp",
    audio: "/audio/child-mode/words/log.mp3",
    fallbackImage: "/images/child-mode/short-o/log.webp",
    alt: "A log"
  }),
  man: wordAsset({
    word: "man",
    image: "/images/child-mode/cvc/man.webp",
    audio: "/audio/child-mode/words/man.mp3",
    fallbackImage: "/images/cvc/man.svg",
    alt: "A man"
  }),
  map: wordAsset({
    word: "map",
    image: "/images/child-mode/cvc/map.webp",
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
    image: "/images/child-mode/cvc/mug.webp",
    audio: "/audio/child-mode/words/mug.mp3",
    fallbackImage: "/images/child-mode/short-u/mug.webp",
    alt: "A mug"
  }),
  nap: wordAsset({
    word: "nap",
    image: "/images/child-mode/cvc/nap.webp",
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
    image: "/images/child-mode/cvc/pan.webp",
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
  plant: wordAsset({
    word: "plant",
    image: "/media/vocabulary/images/plant.webp",
    audio: "/media/vocabulary/audio/plant.mp3",
    alt: "A plant"
  }),
  pot: wordAsset({
    word: "pot",
    image: "/images/child-mode/cvc/pot.webp",
    audio: "/audio/child-mode/words/pot.mp3",
    fallbackImage: "/images/child-mode/short-o/pot.webp",
    alt: "A pot"
  }),
  pun: childModeWordAsset({
    word: "pun",
    folder: "minimal-pairs",
    audio: false
  }),
  ram: wordAsset({
    word: "ram",
    image: "/images/child-mode/short-a/ram.webp",
    audio: "/audio/child-mode/words/ram.mp3",
    fallbackImage: "/images/child-mode/vowels/goat.webp",
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
  shirt: wordAsset({
    word: "shirt",
    image: "/media/vocabulary/images/shirt.webp",
    audio: "/media/vocabulary/audio/shirt.mp3",
    alt: "A shirt"
  }),
  ship: childModeWordAsset({
    word: "ship",
    folder: "digraphs"
  }),
  sit: childModeWordAsset({
    word: "sit",
    folder: "short-i"
  }),
  sad: wordAsset({
    word: "sad",
    image: "/media/rhyming/images/sad.webp",
    audio: "/media/rhyming/audio/sad.mp3",
    fallbackImage: "/images/emotions/sad_child.webp",
    alt: "A sad child"
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
  stamp: wordAsset({
    word: "stamp",
    image: "/media/vocabulary/images/stamp.webp",
    audio: "/audio/child-mode/clean-human/words/stamp.mp3",
    alt: "A stamp"
  }),
  sun: wordAsset({
    word: "sun",
    image: "/images/child-mode/cvc/sun.webp",
    audio: "/audio/child-mode/words/sun.mp3",
    fallbackImage: "/images/child-mode/short-u/sun.webp"
  }),
  tag: wordAsset({
    word: "tag",
    image: "/media/rhyming/images/tag.webp",
    audio: "/media/rhyming/audio/tag.mp3",
    alt: "A tag"
  }),
  thumb: childModeWordAsset({
    word: "thumb",
    folder: "digraphs"
  }),
  mouse: wordAsset({
    word: "mouse",
    image: "/media/initial-sounds/images/m/mouse.webp",
    audio: "/guided-reading/audio/words/mouse.mp3",
    alt: "A mouse"
  }),
  rang: wordAsset({
    word: "rang",
    image: "/media/learn/images/cycle-23/rang.webp",
    audio: "/guided-reading/audio/words/rang.mp3",
    alt: "A ringing bell"
  }),
  song: wordAsset({
    word: "song",
    image: "/media/learn/images/cycle-23/song.webp",
    audio: "/media/vocabulary/audio/song.mp3",
    alt: "A song"
  }),
  tree: childModeWordAsset({
    word: "tree",
    folder: "blends"
  }),
  truck: wordAsset({
    word: "truck",
    image: "/images/assessment/blends/truck.webp",
    audio: "/audio/child-mode/clean-human/words/truck.mp3",
    alt: "A truck"
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
  "try again": "/audio/child-mode/phrases/try-again.mp3",
  "which word matches": "/audio/child-mode/phrases/which-word-matches.mp3",
  "which word matches the picture": "/audio/child-mode/phrases/which-word-matches.mp3",
  "you found it": "/audio/child-mode/phrases/you-found-it.mp3"
};

export function getChildWordAsset(word, options = {}) {
  const key = normalizeAssetKey(word);
  const localAsset = childWordAssets[key];
  const importedAsset = childWordMediaManifest[key];
  const vocabularyAsset = k3VocabularyMedia[key]
    ? {
      word: key,
      image: k3VocabularyMedia[key].image || "",
      audio: k3VocabularyMedia[key].audio || "",
      fallbackImage: k3VocabularyMedia[key].image || "",
      source: k3VocabularyMedia[key].source
    }
    : null;
  const curatedImage = curatedChildWordImageOverrides[key]
    ? {
      word: key,
      image: curatedChildWordImageOverrides[key],
      fallbackImage: curatedChildWordImageOverrides[key],
      source: "curated_child_word_image"
    }
    : null;
  const candidates = [localAsset, importedAsset, vocabularyAsset, curatedImage];
  const primary = candidates.find(Boolean);
  if (!primary) return blockAssessmentImageIfNeeded(key, null, options);

  const first = field => candidates.find(asset => asset?.[field])?.[field] || "";
  const resolvedAsset = candidates.filter(Boolean).length === 1
    ? primary
    : {
      ...primary,
      image: first("image"),
      fallbackImage: localAsset?.fallbackImage ||
        importedAsset?.fallbackImage ||
        importedAsset?.image ||
        vocabularyAsset?.image ||
        vocabularyAsset?.fallbackImage ||
        curatedImage?.image ||
        curatedImage?.fallbackImage,
      source: first("source")
    };
  return blockAssessmentImageIfNeeded(key, {
    ...resolvedAsset,
    audio: getPreferredAudioPath(key, first("audio"))
  }, options);
}

export function getChildAudioPath(text) {
  const key = normalizeAssetKey(text);
  const fallbackPath =
    childWordAssets[key]?.audio ||
    childWordMediaManifest[key]?.audio ||
    k3VocabularyMedia[key]?.audio ||
    childPhraseAudio[key] ||
    "";

  return getPreferredAudioPath(key, fallbackPath);
}
