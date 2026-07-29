import { getKimiCleanAudio } from "./kimiCleanAudioManifest.js";
import { importedVocabularyMediaManifest } from "./importedVocabularyMediaManifest.js";
import { kimiVocabulary500AudioPreferences } from "./kimiVocabulary500AudioPreferences.js";
import { kimiHighQualityMediaStyleAudioTasks } from "./generated/kimiHighQualityMediaStyleManifest.generated.js";
import { initialSoundWordBank } from "../content/initialSounds/initialSoundWordBank.js";
import { initialSoundAudioMediaIds } from "../content/initialSounds/initialSoundImportedMediaStatus.js";
import { approvedPhonicsPatternAudio } from "./approvedPhonicsPatternAudio.js";

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

function cleanHumanInstructionAudioPath(file) {
  return `/audio/child-mode/clean-human/instructions/${file}.mp3`;
}

function cleanHumanGraphemeAudioPath(group, file) {
  return `/audio/child-mode/clean-human/graphemes/${group}/${file}.mp3`;
}

function cleanHumanMorphologyAudioPath(file) {
  return `/audio/child-mode/clean-human/morphology/${file}.mp3`;
}

function cleanAudioPath(key, category, fallbackPath) {
  const cleanKey = String(key || "").replace(/^hfw:/, "");
  if (blockedCleanAudioKeys.has(cleanKey)) return fallbackPath;
  const clean = getKimiCleanAudio(cleanKey);
  if (!clean) return fallbackPath;
  if (category === "hfw" && clean.category !== "hfw") return fallbackPath;
  if (category === "phrases" && clean.category !== "phrases") return fallbackPath;
  if (category === "words" && clean.category !== "words") return fallbackPath;
  return clean.audio || fallbackPath;
}

const blockedCleanAudioKeys = new Set([]);

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
  "dogs", "dot", "drum", "duck", "dug", "egg", "elephant", "envelope", "farm",
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
  "the", "of", "and", "a", "to", "in", "is", "you", "that", "it",
  "he", "for", "was", "on", "are", "as", "with", "his", "they", "at",
  "be", "this", "from", "i", "have", "or", "by", "one", "had", "not",
  "but", "what", "all", "were", "we", "when", "your", "can", "said", "there",
  "use", "an", "each", "which", "she", "do", "how", "their", "if", "will",
  "up", "other", "about", "out", "many", "then", "them", "these", "so", "some",
  "her", "would", "make", "like", "into", "him", "has", "two", "more", "go",
  "no", "way", "could", "my", "than", "first", "been", "call", "who", "its",
  "now", "find", "long", "down", "day", "did", "get", "come", "made", "may",
  "part", "over", "new", "sound", "take", "only", "little", "work", "know", "place",
  "time", "under", "big"
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
  snake: ["snake-kimi3", "snake-kimi4"],
  sock: ["sock-kimi3"],
  star: ["star-kimi3"],
  sun: ["sun-kimi3"],
  tree: ["tree-kimi3"],
  whale: ["whale-kimi3"],
  wig: ["wig-kimi3"]
};

const quarantinedPhraseAudio = {};

const activeReviewNeededWordAudio = {
  fan: {
    fallbackPath: "/audio/child-mode/clean-human/words/fan.mp3",
    deprecatedAudioPaths: [
      wordAudioPath("fan"),
      "/media/initial-sounds/audio/f/fan.mp3",
      "/guided-reading/audio/words/fan.mp3"
    ],
    reviewNeededPaths: [
      wordAudioPath("fan"),
      "/media/initial-sounds/audio/f/fan.mp3",
      "/guided-reading/audio/words/fan.mp3"
    ],
    source: "Kimi_Agent_High-Quality Generation.zip import",
    notes: "Clean replacement imported on 2026-06-03 after live tablet QA blocked the previous fan audio. Older local fan recordings remain quarantined; active assessment should resolve to the clean-human path."
  },
  bud: {
    fallbackPath: wordAudioPath("bud"),
    deprecatedAudioPaths: [wordAudioPath("bud-kimi3")],
    reviewNeededPaths: [wordAudioPath("bud-kimi3")],
    source: "Bud Audio File.zip import",
    notes: "Clean bud audio imported on 2026-05-28. Bud image remains blocked from live assessment use until a clear unopened flower bud replacement is QA-approved."
  }
};

const blockedWordAudio = {};

const blockedHfwAudio = {};

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

const approvedGuidedReadingVocabularyAudio = {
  germs: "/media/vocabulary/audio/germs.mp3",
  precious: "/media/vocabulary/audio/precious.mp3",
  rivers: "/media/vocabulary/audio/rivers.mp3",
  roads: "/media/vocabulary/audio/roads.mp3",
  stronger: "/media/vocabulary/audio/stronger.mp3"
};

const approvedAssessmentWordAudioOverrides = {
  chop: "/media/vocabulary/audio/chop.mp3",
  dip: "/media/vocabulary/audio/dip.mp3",
  lip: "/audio/child-mode/clean-human/words/lip.mp3",
  mop: "/audio/child-mode/clean-human/words/mop.mp3",
  oar: "/media/vocabulary/audio/oar.mp3",
  rid: "/media/vocabulary/audio/rid.mp3",
  rig: "/media/vocabulary/audio/rig.mp3",
  rip: "/media/vocabulary/audio/rip.mp3",
  seed: "/audio/child-mode/clean-human/words/seed.mp3",
  sip: "/media/vocabulary/audio/sip.mp3",
  sit: "/audio/child-mode/clean-human/words/sit.mp3",
  zip: "/audio/child-mode/clean-human/words/zip.mp3"
};

const approvedAssessmentWordAudioOverrideReviewPaths = {
  lip: ["/media/rhyming/audio/lip.mp3"],
  mop: [wordAudioPath("mop")],
  seed: [wordAudioPath("seed"), "/media/initial-sounds/audio/s/seed.mp3"],
  sit: [wordAudioPath("sit"), wordAudioPath("sit-kimi3")],
  zip: [
    wordAudioPath("zip"),
    "/audio/child-mode/clean-human/phrases/zip.mp3",
    "/audio/vocabulary/zip.mp3",
    "/guided-reading/audio/words/zip.mp3",
    "/media/initial-sounds/audio/z/zip.mp3",
    "/media/vocabulary/audio/zip.mp3"
  ]
};

const approvedLowerSkillInstructionAudio = [
  ["Choose the word that completes the sentence.", "choose_word_completes_sentence"],
  ["Build the missing word.", "build_missing_word"],
  ["Select the blend that completes the word.", "select_blend_completes_word"],
  ["Choose the noun.", "choose_noun"],
  ["Choose the noun that best fits the sentence.", "choose_noun_fits_sentence"],
  ["Choose the verb.", "choose_verb"],
  ["Choose the verb that best fits the sentence.", "choose_verb_fits_sentence"],
  ["Choose the adjective.", "choose_adjective"],
  ["Choose the adjective that best fits the sentence.", "choose_adjective_fits_sentence"],
  ["Which word or phrase tells where something is?", "which_word_tells_where"],
  ["Which more precise word or phrase tells where something is?", "which_more_precise_where"],
  ["Which word tells us where something is?", "which_word_where"],
  ["Which word is plural?", "which_word_plural"],
  ["Find the plural noun.", "find_plural_noun"],
  ["What is the correct plural?", "what_correct_plural"],
  ["Choose the plural noun.", "choose_plural_noun"],
  ["Which pair shares the same vowel team sound?", "which_same_vowel_team"],
  ["Which two words have the same r-controlled vowel sound?", "which_same_rcontrolled"]
];

const approvedLowerSkillGraphemeAudio = [
  ...["b", "c", "d", "f", "g", "h", "j", "l", "m", "n", "p", "r", "s", "t", "v", "w", "y", "z"]
    .map(key => ({ key, text: `/${key}/`, group: "consonants", file: key })),
  ...["short_a", "short_e", "short_i", "short_o", "short_u"]
    .map(key => ({ key, text: key.replace("_", " "), group: "short_vowels", file: key })),
  ...["sh", "ch", "th", "wh", "ph", "ck", "ng", "ll", "ss", "ff", "nd", "mp", "sk", "ft", "st"]
    .map(key => ({ key, text: key, group: "digraphs_blends", file: key })),
  ...["ai", "ay", "ea", "ee", "eigh", "ew", "ie", "igh", "oa", "oe", "oi", "oo", "ou", "ow", "oy", "ue", "ui"]
    .map(key => ({ key, text: key, group: "vowel_teams", file: key })),
  ...["a_e", "e_e", "i_e", "o_e", "u_e"]
    .map(key => ({ key, text: key.replace("_", ", silent "), group: "silent_e", file: key })),
  ...["ar", "er", "ir", "or", "ur"]
    .map(key => ({ key, text: key, group: "r_controlled", file: key }))
];

const approvedLowerSkillMorphologyAudio = [
  ["not kind", "not_kind"],
  ["full of care", "full_of_care"],
  ["without care", "without_care"],
  ["play again", "play_again"],
  ["care again", "care_again"],
  ["inside", "inside"],
  ["under", "under"],
  ["beside", "beside"],
  ["above", "above"],
  ["below", "below"],
  ["between", "between"],
  ["near", "near"],
  ["before", "before"],
  ["after", "after"],
  ["right", "right"],
  ["plain", "plain"],
  ["ate", "ate"],
  ["eight", "eight"],
  ["hole", "hole"],
  ["whole", "whole"],
  ["know", "know"],
  ["no", "no"],
  ["plane", "plane"],
  ["to", "to"],
  ["too", "too"],
  ["two", "two"],
  ["write", "write"]
];

export const audioPreferenceManifest = Object.fromEntries([
  ...Object.entries(kimiVocabulary500AudioPreferences),
  ...approvedLowerSkillInstructionAudio.map(([text, file]) => {
    const key = normalizeAudioPreferenceKey(text);
    return [
      key,
      approvedPreference({
        key,
        word: text,
        category: "instructions",
        fallbackPath: cleanHumanInstructionAudioPath(file),
        source: "Kimi Agent Clean Child Audio Prompts",
        notes: "Approved clean lower-skill assessment instruction prompt."
      })
    ];
  }),
  ...approvedLowerSkillGraphemeAudio.map(item => {
    const key = normalizeAudioPreferenceKey(item.key);
    return [
      key,
      approvedPreference({
        key,
        word: item.text,
        category: "graphemes",
        fallbackPath: cleanHumanGraphemeAudioPath(item.group, item.file),
        source: "Kimi Agent Clean Child Audio Prompts",
        notes: "Approved clean lower-skill grapheme or sound option audio."
      })
    ];
  }),
  ...approvedPhonicsPatternAudio.map(item => {
    const key = normalizeAudioPreferenceKey(
      ["pattern", item.pattern, item.anchor].filter(Boolean).join(":")
    );
    return [
      key,
      approvedPreference({
        key,
        word: item.anchor
          ? `${item.pattern} as in ${item.anchor}`
          : item.pattern,
        category: "phonics_patterns",
        fallbackPath: item.audioPath,
        source: "Google Cloud Text-to-Speech Chirp 3 HD Leda",
        notes: `Approved by human listening review on 2026-07-29 (${item.clipId}).`
      })
    ];
  }),
  ...approvedLowerSkillMorphologyAudio.map(([text, file]) => {
    const key = normalizeAudioPreferenceKey(text);
    return [
      key,
      approvedPreference({
        key,
        word: text,
        category: "morphology",
        fallbackPath: cleanHumanMorphologyAudioPath(file),
        source: "Kimi Agent Clean Child Audio Prompts",
        notes: "Approved clean lower-skill morphology, preposition, or homophone option audio."
      })
    ];
  }),
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
  ...Object.entries(approvedGuidedReadingVocabularyAudio).map(([word, fallbackPath]) => [
    word,
    approvedPreference({
      key: word,
      word,
      category: "words",
      fallbackPath,
      source: "guided reading missing word audio import",
      notes: "Approved exact-word MP3 imported for Guided Reading tap-to-hear word audio."
    })
  ]),
  ...Object.entries(importedVocabularyMediaManifest)
    .filter(([, media]) => media.audio)
    .map(([key, media]) => [
      key,
      approvedPreference({
        key,
        word: media.textSpoken || media.key || key,
        category: "words",
        fallbackPath: media.audio,
        source: media.source,
        notes: "Approved imported vocabulary audio from the strict missing-media repair pack."
      })
    ]),
  ...kimiHighQualityMediaStyleAudioTasks.map(task => [
    task.targetWord,
    approvedPreference({
      key: task.targetWord,
      word: task.targetWord,
      category: "words",
      fallbackPath: task.path,
      source: "kimi_high_quality_media_style_2026_06_05",
      notes: "Approved Kimi high-quality media style exact-word audio imported for assessment language skills."
    })
  ]),
  ...Object.entries(approvedAssessmentWordAudioOverrides).map(([word, fallbackPath]) => {
    const reviewPaths = approvedAssessmentWordAudioOverrideReviewPaths[word] || [];
    return [
      word,
      approvedPreference({
        key: word,
        word,
        category: "words",
        fallbackPath,
        deprecatedAudioPaths: reviewPaths,
        reviewNeededPaths: reviewPaths,
        source: "kimi_audio_rerecord_2026_06",
        notes: "Approved exact-word audio remake replacement for active assessment playback."
      })
    ];
  }),
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
  ...Object.entries(blockedHfwAudio).map(([word, config]) => [
    `hfw:${word}`,
    reviewNeededPreference({
      key: `hfw:${word}`,
      word,
      ...config
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
  ...Object.entries(activeReviewNeededWordAudio).map(([word, config]) => [
    word,
    approvedPreference({
      key: word,
      word,
      category: "words",
      ...config
    })
  ]),
  ...Object.entries(blockedWordAudio).map(([word, config]) => [
    word,
    reviewNeededPreference({
      key: word,
      word,
      ...config
    })
  ]),
  [
    "blue",
    approvedPreference({
      key: "blue",
      word: "blue",
      category: "words",
      fallbackPath: "/audio/child-mode/clean-human/words/blue.mp3",
      deprecatedAudioPaths: [
        wordAudioPath("blue"),
        "/audio/assessment/long-vowels/blue.mp3",
        "/guided-reading/audio/words/blue.mp3"
      ],
      source: "clean-human words",
      notes: "Approved clean-human exact-word replacement for active assessment playback."
    })
  ],
  [
    "hfw:blue",
    approvedPreference({
      key: "hfw:blue",
      word: "blue",
      category: "hfw",
      fallbackPath: "/audio/child-mode/clean-human/hfw/blue.mp3",
      deprecatedAudioPaths: [
        "/audio/child-mode/hfw/blue.mp3"
      ],
      source: "clean-human hfw",
      notes: "Approved clean-human HFW replacement for active assessment playback."
    })
  ]
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
  const rawKey = String(keyOrText || "").trim();
  if (/^hfw:/i.test(rawKey)) {
    const normalizedHfwKey = normalizeAudioPreferenceKey(rawKey.replace(/^hfw:/i, ""));
    return audioPreferenceManifest[`hfw:${normalizedHfwKey}`] || null;
  }

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
  const preference = getAudioPreferenceForPath(fallbackPath) || getAudioPreference(keyOrText);

  if (preference) {
    if (preference.status !== "approved") return "";
    return preference.preferredAudioPath || "";
  }

  if (fallbackPath && approvedInitialSoundAudioPaths.has(fallbackPath)) return fallbackPath;
  if (fallbackPath && /^\/audio\/assessment\/(?:digraphs|long-vowels)\/[a-z0-9-]+\.mp3$/i.test(fallbackPath)) return fallbackPath;
  return "";
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
