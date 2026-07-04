import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";

import { getApprovedAudioPath } from "../src/data/audioPreferenceManifest.js";
import { getImportedVocabularyMedia } from "../src/data/importedVocabularyMediaManifest.js";
import { repoRoot, publicPathExists, writeFile } from "./phonicsRuntimeUtils.js";

const workbookPath = path.join(repoRoot, "docs/imports/K3_Usable_Word_Bank_Metadata.xlsx");
const outputPath = path.join(repoRoot, "src/data/generated/secondBlockSkillTopUpQuestions.generated.js");
const reportPath = path.join(repoRoot, "docs/validation/second_block_skill_generation.md");

const LONG_SOURCE = "long_vowels_replacement_2026_06";
const GRAMMAR_SOURCE = "grammar_replacement_2026_06";
const poolSupportPath = path.join(repoRoot, "docs/validation/second_block_source_pool_support.json");
const grammarPoolSupport = {};
const SECOND_SOURCE = "second_block_k3_topup_2026_06";
const VOWEL_TEAM_PATTERNS = ["ay", "ai", "y", "ie", "ew", "oo", "ee", "igh", "oa", "oe", "ea", "ow", "ue", "ui", "eigh"];
const SILENT_E_PATTERNS = ["a_e", "e_e", "i_e", "o_e", "u_e"];
const R_CONTROLLED_PATTERNS = ["ar", "er", "ir", "or", "ur"];
const FAKE_OR_BAD_WORDS = new Set(["ballshell", "bookdesk", "bellshell", "dishfish", "kingring", "yen", "zip"]);

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slug(value = "") {
  return normalize(value).replace(/\s+/g, "-");
}

function unique(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function rotate(items = [], offset = 0) {
  if (!items.length) return [];
  const start = Math.abs(offset) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

function publicMediaPath(kind, word) {
  return `/media/vocabulary/${kind}/${slug(word)}.${kind === "images" ? "webp" : "mp3"}`;
}

function existingImagePath(word, preferred = "") {
  const candidates = unique([
    preferred,
    getImportedVocabularyMedia(word)?.image,
    publicMediaPath("images", word),
    `/images/child-mode/cvc/${slug(word)}.png`,
    `/images/child-mode/initial-sounds/${slug(word)}.png`,
    `/images/child-mode/blends/${slug(word)}.png`,
    `/images/assessment/long-vowels/${slug(word)}.webp`
  ]);
  return candidates.find(candidate => candidate && (String(candidate).startsWith("data:image/") || publicPathExists(candidate))) || "";
}

function posImagePath(word, partOfSpeech) {
  const candidate = `/media/vocabulary/images/${partOfSpeech}-${slug(word)}.webp`;
  return publicPathExists(candidate) ? candidate : "";
}

function approvedAudio(word, preferred = "") {
  const candidates = unique([
    preferred,
    getImportedVocabularyMedia(word)?.audio,
    publicMediaPath("audio", word),
    `/audio/child-mode/clean-human/words/${slug(word)}.mp3`,
    `/audio/child-mode/words/${slug(word)}.mp3`,
    `/audio/child-mode/clean-human/morphology/${slug(word)}.mp3`,
    `/guided-reading/audio/words/${slug(word)}.mp3`
  ]);
  for (const candidate of candidates) {
    if (!candidate || !publicPathExists(candidate)) continue;
    const approved = getApprovedAudioPath(word, candidate);
    if (approved && publicPathExists(approved)) return approved;
  }
  return "";
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function readWorkbookRows() {
  const zip = await JSZip.loadAsync(fs.readFileSync(workbookPath));
  const sharedXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  const shared = [];
  if (sharedXml) {
    for (const match of sharedXml.matchAll(/<[a-z]*:?si>([\s\S]*?)<\/[a-z]*:?si>/g)) {
      const text = [...match[1].matchAll(/<[a-z]*:?t[^>]*>([\s\S]*?)<\/[a-z]*:?t>/g)]
        .map(item => item[1])
        .join("")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
      shared.push(text);
    }
  }
  const sheetXml = await zip.file("xl/worksheets/sheet1.xml").async("string");
  const rowMatches = [...sheetXml.matchAll(/<[a-z]*:?row[^>]*>([\s\S]*?)<\/[a-z]*:?row>/g)];
  const rows = rowMatches.map(rowMatch => {
    const cells = [];
    for (const cellMatch of rowMatch[1].matchAll(/<[a-z]*:?c([^>]*)>([\s\S]*?)<\/[a-z]*:?c>/g)) {
      const attrs = cellMatch[1];
      const cell = cellMatch[2];
      const ref = attrs.match(/r="([A-Z]+)(\d+)"/)?.[1] || "A";
      const index = ref.split("").reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1;
      const value = cell.match(/<[a-z]*:?v>([\s\S]*?)<\/[a-z]*:?v>/)?.[1] || "";
      cells[index] = attrs.includes('t="s"') ? shared[Number(value)] || "" : value;
    }
    return cells;
  });
  const headers = rows.shift().map(item => String(item || ""));
  return rows
    .map(row => Object.fromEntries(headers.map((header, index) => [header, String(row[index] || "").trim()])))
    .filter(row => row.word);
}

function enrichRows(rows) {
  return rows.map(row => {
    const word = normalize(row.word);
    const imagePath = existingImagePath(word);
    const audioPath = approvedAudio(word);
    return {
      ...row,
      word,
      slug: slug(word),
      imagePath,
      audioPath,
      imageable: !/^low$/i.test(row.imageability || ""),
      text: `${row.primary_section || ""} ${row.all_sections || ""} ${row.vowel_type || ""} ${row.phonics_patterns || ""}`.toLowerCase(),
      syllables: Number(row.syllables || 1) || 1
    };
  }).filter(row => row.word && !FAKE_OR_BAD_WORDS.has(row.word));
}

function hasReliableMedia(row, { requireAudio = false, pos = "" } = {}) {
  const image = pos ? posImagePath(row.word, pos) || row.imagePath : row.imagePath;
  if (!row.imageable || !image || !publicPathExists(image)) return false;
  if (requireAudio && !row.audioPath) return false;
  return true;
}

function inferSilentEPattern(word = "") {
  if (!/^[a-z]+e$/.test(word) || word.length < 4) return "";
  const stem = word.slice(0, -1);
  const vowels = [...stem.matchAll(/[aeiou]/g)].map(match => match[0]);
  if (!vowels.length) return "";
  const vowel = vowels[vowels.length - 1];
  const pattern = `${vowel}_e`;
  return SILENT_E_PATTERNS.includes(pattern) ? pattern : "";
}

function patternInWord(word = "", pattern = "") {
  if (!pattern) return false;
  if (pattern.includes("_")) return inferSilentEPattern(word) === pattern;
  return word.includes(pattern);
}

function teamPattern(row) {
  const text = row.text;
  const directPatterns = ["eigh", "igh", ...VOWEL_TEAM_PATTERNS.filter(item => !["y", "igh", "eigh"].includes(item))];
  for (const pattern of directPatterns) {
    if (row.word.includes(pattern)) return pattern;
  }
  if (/long i|long e/.test(text) && row.word.endsWith("y")) return "y";
  for (const pattern of directPatterns) {
    if (new RegExp(`(^|[^a-z])${escapeRegExp(pattern)}([^a-z]|$)`).test(text) && patternInWord(row.word, pattern)) return pattern;
  }
  return "";
}

function partialWord(word, pattern) {
  if (pattern.includes("_")) {
    const vowel = pattern[0];
    return word.replace(new RegExp(`${vowel}([^aeiou]{1,3})e$`), `${vowel}$1_`);
  }
  return word.replace(pattern, "_".repeat(pattern.length));
}

function optionObjects(options) {
  return options.map(option => ({ value: option, label: option }));
}

function baseQuestion({ id, skillId, skillName, level, templateType, targetWord, imagePath, audioPath = "", source = SECOND_SOURCE, extra = {} }) {
  const phase = level === 1 ? (Number(id.match(/_(\d+)_/)?.[1] || 1) <= 15 ? 1 : 2) : (Number(id.match(/_(\d+)_/)?.[1] || 1) <= 15 ? 1 : 2);
  return {
    id,
    grade: "K-3",
    skillId,
    skillName,
    skill: skillName,
    level,
    difficulty: level,
    phase,
    assessmentPhase: phase,
    phaseTarget: `level_${level}_phase_${phase}`,
    questionType: "multiple_choice",
    templateType,
    formatType: templateType,
    targetWord,
    imagePath,
    imageUrl: imagePath,
    targetImage: imagePath,
    targetImagePath: imagePath,
    ...(audioPath ? { audioPath, audioUrl: audioPath, audioText: targetWord, audioKey: targetWord } : {}),
    active: true,
    qaStatus: "approved",
    source,
    ...extra
  };
}

function makeLongVowels(rows) {
  const silentRows = rows
    .filter(row => hasReliableMedia(row) && row.text.includes("cvce") && inferSilentEPattern(row.word))
    .sort((a, b) => inferSilentEPattern(a.word).localeCompare(inferSilentEPattern(b.word)) || a.word.localeCompare(b.word));
  const teamRows = rows
    .filter(row => hasReliableMedia(row) && teamPattern(row) && !R_CONTROLLED_PATTERNS.some(pattern => row.text.includes(`r-controlled ${pattern}`)))
    .sort((a, b) => teamPattern(a).localeCompare(teamPattern(b)) || a.word.localeCompare(b.word));
  const questions = [];
  const silentChosen = uniqueByPattern(silentRows, row => inferSilentEPattern(row.word), 24);
  const teamChosen = uniqueByPattern(teamRows, row => teamPattern(row), 24);
  silentChosen.forEach((row, index) => {
    const pattern = inferSilentEPattern(row.word);
    const options = [pattern, ...rotate(SILENT_E_PATTERNS.filter(item => item !== pattern), index).slice(0, 3)];
    questions.push(baseQuestion({
      id: `second_long_vowels_l1_${String(index + 1).padStart(2, "0")}_${pattern}_${row.slug}`,
      skillId: "long_vowels",
      skillName: "Long Vowels and Silent E",
      level: 1,
      templateType: "LONG_VOWEL_SILENT_E_PATTERN",
      targetWord: row.word,
      imagePath: row.imagePath,
      audioPath: row.audioPath,
      source: LONG_SOURCE,
      extra: {
        prompt: "Choose the silent-e spelling pattern for the word.",
        question: "Choose the silent-e spelling pattern for the word.",
        targetPattern: pattern,
        phonicsPattern: pattern,
        itemType: "phonics_pattern",
        itemKey: pattern,
        choices: options,
        answerOptions: optionObjects(options),
        correctAnswer: pattern,
        answer: pattern,
        explanation: `${row.word} uses the ${pattern} silent-e pattern.`
      }
    }));
  });
  teamChosen.forEach((row, index) => {
    const pattern = teamPattern(row);
    const options = [pattern, ...rotate(VOWEL_TEAM_PATTERNS.filter(item => item !== pattern), index).slice(0, 3)];
    questions.push(baseQuestion({
      id: `second_long_vowels_l2_${String(index + 1).padStart(2, "0")}_${pattern}_${row.slug}`,
      skillId: "long_vowels",
      skillName: "Long Vowels and Silent E",
      level: 2,
      templateType: "LONG_VOWEL_TEAM_COMPLETE",
      targetWord: row.word,
      imagePath: row.imagePath,
      audioPath: row.audioPath,
      source: LONG_SOURCE,
      extra: {
        questionType: "ixl_template",
        prompt: "Choose the spelling pattern that completes the word.",
        question: "Choose the spelling pattern that completes the word.",
        partialWord: partialWord(row.word, pattern),
        targetPattern: pattern,
        phonicsPattern: pattern,
        itemType: "phonics_pattern",
        itemKey: pattern,
        choices: options,
        answerOptions: optionObjects(options),
        correctAnswer: pattern,
        answer: pattern,
        explanation: `${pattern} completes ${row.word}.`
      }
    }));
  });
  return questions;
}

function uniqueByPattern(rows, patternFn, targetCount) {
  const selected = [];
  const perPattern = new Map();
  for (let round = 0; selected.length < targetCount && round < 8; round += 1) {
    for (const row of rows) {
      const pattern = patternFn(row);
      const count = perPattern.get(pattern) || 0;
      if (count !== round || selected.some(item => item.word === row.word)) continue;
      selected.push(row);
      perPattern.set(pattern, count + 1);
      if (selected.length >= targetCount) break;
    }
  }
  return selected;
}

function makeVowelTeams(rows) {
  const pool = rows
    .filter(row => hasReliableMedia(row) && teamPattern(row) && !row.text.includes("r-controlled"))
    .sort((a, b) => teamPattern(a).localeCompare(teamPattern(b)) || a.word.localeCompare(b.word));
  return uniqueByPattern(pool, teamPattern, 24).map((row, index) => {
    const pattern = teamPattern(row);
    const options = [pattern, ...rotate(VOWEL_TEAM_PATTERNS.filter(item => item !== pattern), index * 2).slice(0, 3)];
    return baseQuestion({
      id: `second_vowel_teams_l2_${String(index + 1).padStart(2, "0")}_${pattern}_${row.slug}`,
      skillId: "vowel_teams",
      skillName: "Vowel Teams",
      level: 2,
      templateType: "LONG_VOWEL_TEAM_COMPLETE",
      targetWord: row.word,
      imagePath: row.imagePath,
      audioPath: row.audioPath,
      extra: {
        questionType: "ixl_template",
        prompt: "Look at the picture. Which vowel team completes the word?",
        question: "Look at the picture. Which vowel team completes the word?",
        partialWord: partialWord(row.word, pattern),
        targetPattern: pattern,
        phonicsPattern: pattern,
        itemType: "phonics_pattern",
        itemKey: pattern,
        choices: options,
        answerOptions: optionObjects(options),
        correctAnswer: pattern,
        answer: pattern,
        explanation: `${pattern} completes ${row.word}.`
      }
    });
  });
}

function posImageWords(part) {
  const dir = path.join(repoRoot, "public/media/vocabulary/images");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(file => file.startsWith(`${part}-`) && file.endsWith(".webp"))
    .map(file => normalize(file.replace(`${part}-`, "").replace(/\.webp$/, "")));
}

function partRows(rows, part, { requireAudio = false } = {}) {
  const sectionPattern = {
    noun: /noun|animals|food|body|clothes|nature|places|home|school|family/,
    verb: /verb/,
    adjective: /adjective|describing/
  }[part];
  const byWord = new Map();
  rows.forEach(row => {
    if (row.imageable && sectionPattern.test(`${row.primary_section} ${row.all_sections}`.toLowerCase())) {
      byWord.set(row.word, row);
    }
  });
  posImageWords(part).forEach(word => {
    const existing = byWord.get(word) || { word, slug: slug(word), imageable: true, imageability: "High", decodability_band: "K-Grade 3 vocabulary", syllables: 1 };
    byWord.set(word, {
      ...existing,
      word,
      slug: slug(word),
      imagePath: posImagePath(word, part) || existing.imagePath || existingImagePath(word),
      audioPath: existing.audioPath || approvedAudio(word),
      imageable: true
    });
  });
  return [...byWord.values()]
    .filter(row => part === "noun" ? Boolean(row.imagePath || existingImagePath(row.word)) : Boolean(posImagePath(row.word, part)))
    .map(row => ({ ...row, imagePath: part === "noun" ? (row.imagePath || existingImagePath(row.word)) : posImagePath(row.word, part) }))
    .filter(row => !requireAudio || row.audioPath)
    .sort((a, b) => rowScore(b, part) - rowScore(a, part) || a.word.localeCompare(b.word));
}

function rowScore(row, part) {
  let score = 0;
  if (row.imageability === "High") score += 5;
  if (row.decodability_band?.startsWith("K")) score += 3;
  if (row.syllables <= 1) score += 2;
  if (posImagePath(row.word, part)) score += 2;
  if (row.word.length <= 7) score += 1;
  return score;
}

function posCard(row, part, withAudio = false) {
  const image = posImagePath(row.word, part) || row.imagePath;
  return {
    id: `second_${part}_${row.slug}`,
    word: row.word,
    label: row.word,
    value: row.word,
    partOfSpeech: part,
    image,
    imagePath: image,
    imageUrl: image,
    alt: `${row.word} ${part} card`,
    ...(withAudio && row.audioPath ? { audio: row.audioPath, audioPath: row.audioPath, audioUrl: row.audioPath } : {})
  };
}

function posOption(row, part, withAudio = false) {
  return {
    id: `second_${part}_${row.slug}_text`,
    word: row.word,
    label: row.word,
    value: row.word,
    partOfSpeech: part,
    ...(withAudio && row.audioPath ? { audio: row.audioPath, audioPath: row.audioPath, audioUrl: row.audioPath } : {})
  };
}

function makeGrammar(rows, part, skillName) {
  const l1Pool = partRows(rows, part);
  const l2Pool = partRows(rows, part, { requireAudio: true });
  grammarPoolSupport[`${part}s`] = { l1Pool: l1Pool.length, l2Pool: l2Pool.length };
  const l2Count = Math.min(30, l2Pool.length);
  const l1Count = Math.max(0, Math.min(l1Pool.length, 100 - l2Count));
  const l1Targets = l1Pool.slice(0, l1Count);
  const l2Targets = l2Pool.slice(0, l2Count);
  const nouns = partRows(rows, "noun");
  const verbs = partRows(rows, "verb");
  const adjectives = partRows(rows, "adjective");
  const pools = { noun: nouns, verb: verbs, adjective: adjectives };
  const questions = [];
  l1Targets.forEach((row, index) => {
    // Level 1 grammar is the designed image-card format: four picture cards,
    // exactly one of the target part of speech (skillLevelDepthConfig L1 rule).
    const distractorParts = ["noun", "verb", "adjective"].filter(item => item !== part);
    const distractorCards = distractorParts.flatMap((dPart, dIndex) =>
      rotate(pools[dPart], index * 3 + dIndex)
        .filter(item => item.word !== row.word)
        .slice(0, dIndex === 0 ? 2 : 1)
        .map(item => posCard(item, dPart)));
    const cards = rotate([posCard(row, part), ...distractorCards].slice(0, 4), index);
    if (cards.length !== 4 || cards.some(card => !card.image)) return;
    questions.push(baseQuestion({
      id: `second_${part}s_l1_${String(index + 1).padStart(2, "0")}_${row.slug}`,
      skillId: `${part}s`,
      skillName,
      level: 1,
      templateType: "GRAMMAR_IMAGE_CHOICE",
      targetWord: row.word,
      imagePath: posImagePath(row.word, part) || row.imagePath,
      source: GRAMMAR_SOURCE,
      extra: {
        questionType: "visual_card_choice",
        prompt: `Tap the picture that shows a ${part}.`,
        question: `Tap the picture that shows a ${part}.`,
        choices: cards.map(card => card.value),
        answerOptions: cards.map(card => ({ value: card.value, label: card.label, partOfSpeech: card.partOfSpeech })),
        imageCards: cards,
        correctAnswer: row.word,
        answer: row.word,
        itemType: `grammar_${part}`,
        itemKey: row.word,
        partOfSpeech: part,
        requireOptionAudio: false,
        disableAudio: true,
        explanation: `${row.word} is a ${part}.`
      }
    }));
  });
  l2Targets.forEach((row, index) => {
    const options = rotate(l2Targets.filter(item => item.word !== row.word), index * 5).slice(0, 3).concat(row).sort((a, b) => a.word.localeCompare(b.word)).map(item => posOption(item, part, true));
    questions.push(baseQuestion({
      id: `second_${part}s_l2_${String(index + 1).padStart(2, "0")}_${row.slug}`,
      skillId: `${part}s`,
      skillName,
      level: 2,
      templateType: "GRAMMAR_SENTENCE_FIT",
      targetWord: row.word,
      imagePath: posImagePath(row.word, part) || row.imagePath,
      source: GRAMMAR_SOURCE,
      extra: {
        questionType: "ixl_template",
        prompt: `Choose the ${part} that best fits the sentence.`,
        question: `Choose the ${part} that best fits the sentence.`,
        sentence: sentenceFor(row.word, part),
        choices: options.map(option => option.value),
        answerOptions: options,
        correctAnswer: row.word,
        answer: row.word,
        itemType: `grammar_${part}`,
        itemKey: row.word,
        partOfSpeech: part,
        explanation: `${row.word} fits the sentence as a ${part}.`
      }
    }));
  });
  return questions;
}

const NOUN_SENTENCES = {
  back: "The child carried a backpack on his ___.",
  bag: "The ___ holds the school books.",
  bat: "The player swings the ___.",
  bear: "The ___ stands near the tree.",
  bed: "The child sleeps in the ___.",
  bell: "The ___ rings at the end of class.",
  book: "The student reads the ___.",
  boot: "The muddy ___ sits by the door.",
  box: "The toys are inside the ___.",
  bug: "The ___ crawls on the leaf.",
  cap: "The child wears a ___ on his head.",
  cat: "The ___ naps on the mat.",
  coat: "The ___ hangs on the hook.",
  cup: "The ___ holds cold water.",
  dad: "The ___ reads a story.",
  dog: "The ___ runs in the yard.",
  duck: "The ___ swims in the pond.",
  egg: "The ___ sits in the nest.",
  eye: "The child covers one ___.",
  fox: "The ___ hides in the grass.",
  hand: "The child raises a ___.",
  hat: "The ___ is on the chair.",
  hill: "The ___ rises behind the house.",
  leg: "The table has one broken ___.",
  map: "The ___ shows the road.",
  moon: "The ___ shines at night.",
  nose: "The clown has a red ___.",
  pen: "The child writes with a ___.",
  pig: "The ___ rolls in the mud.",
  ring: "The ___ shines on her finger.",
  rock: "The ___ sits beside the path.",
  ship: "The ___ sails on the water.",
  shoe: "The ___ is under the bed.",
  sock: "The ___ is in the laundry basket.",
  star: "The ___ shines in the sky.",
  sun: "The ___ warms the playground.",
  tree: "The ___ grows beside the house.",
  wall: "The picture hangs on the ___.",
  wing: "The bird flaps its ___."
};

const VERB_SENTENCES = {
  ate: "The children ___ lunch together.",
  bake: "The family will ___ bread.",
  share: "The children ___ the blocks.",
  write: "The student will ___ a sentence.",
  add: "The student will ___ two blocks.",
  answer: "The child will ___ the question.",
  ask: "The student will ___ for help.",
  build: "The children ___ a tower.",
  call: "The child will ___ a friend.",
  carry: "The child will ___ the bag.",
  catch: "The player will ___ the ball.",
  clean: "The child will ___ the table.",
  climb: "The child will ___ the ladder.",
  color: "The student will ___ the picture.",
  cook: "The family will ___ dinner.",
  count: "The child will ___ the blocks.",
  cut: "The child will ___ the paper.",
  draw: "The student will ___ a star.",
  drink: "The child will ___ water.",
  drop: "The child will ___ the ball.",
  eat: "The children ___ a snack.",
  find: "The child will ___ the missing sock.",
  help: "The student will ___ a friend.",
  jump: "The child will ___ over the rope.",
  kick: "The player will ___ the ball.",
  laugh: "The friends ___ at the joke.",
  listen: "The class will ___ to the story.",
  look: "The child will ___ at the picture.",
  make: "The children ___ a card.",
  paint: "The student will ___ a flower.",
  play: "The children ___ in the park.",
  read: "The child will ___ a book.",
  ride: "The child will ___ a bike.",
  run: "The child can ___ fast.",
  sing: "The class will ___ a song.",
  sit: "The child will ___ on the chair.",
  sleep: "The baby will ___ in the crib.",
  swim: "The child will ___ in the pool.",
  walk: "The family will ___ to school.",
  wash: "The child will ___ her hands."
};

const ADJECTIVE_SENTENCES = {
  big: "The elephant is ___ beside the mouse.",
  red: "The apple is ___.",
  black: "The night sky is ___.",
  blue: "The sky is ___.",
  sad: "The child feels ___ after losing the toy.",
  hot: "The soup is ___.",
  cold: "The ice is ___.",
  fast: "The race car is ___.",
  slow: "The turtle is ___.",
  small: "The bug is ___ on the leaf.",
  wet: "The dog is ___ after the rain.",
  dry: "The towel is ___ in the basket.",
  clean: "The plate is ___ after washing.",
  dirty: "The boots are ___ after the walk.",
  hard: "The rock is ___.",
  soft: "The pillow is ___.",
  long: "The rope is ___.",
  short: "The pencil is ___.",
  tall: "The tree is ___.",
  round: "The ball is ___.",
  white: "The snow is ___.",
  green: "The leaf is ___.",
  yellow: "The banana is ___.",
  loud: "The drum is ___ when it is hit.",
  quiet: "The library is ___ during reading time.",
  cute: "The puppy is ___.",
  funny: "The joke is ___.",
  orange: "The pumpkin is ___.",
  purple: "The flower is ___."
};

function sentenceFor(word, part) {
  if (part === "noun") return NOUN_SENTENCES[word] || `The child points to the ___ in the picture.`;
  if (part === "verb") return VERB_SENTENCES[word] || `The child will ___ in the picture.`;
  return ADJECTIVE_SENTENCES[word] || `The pictured object looks ___.`;
}

const PREPOSITIONS = ["above", "below", "behind", "beside", "between", "near", "over", "through", "across", "against", "along", "among", "around", "outside"];
function makePrepositions() {
  const rows = PREPOSITIONS.map(word => ({
    word,
    slug: slug(word),
    imagePath: existingImagePath(word, `/media/vocabulary/images/${slug(word)}.webp`),
    audioPath: approvedAudio(word)
  })).filter(row => row.imagePath);
  const questions = [];
  rows.forEach((row, index) => {
    const options = rotate(rows, index).slice(0, 4);
    if (!options.some(option => option.word === row.word)) options[0] = row;
    const cards = options.map(option => ({ value: option.word, label: option.word, word: option.word, image: option.imagePath, imagePath: option.imagePath, imageUrl: option.imagePath, alt: `${option.word} spatial relation` }));
    questions.push(baseQuestion({
      id: `second_prepositions_l1_${String(index + 1).padStart(2, "0")}_${row.slug}`,
      skillId: "prepositions",
      skillName: "Prepositions of Place",
      level: 1,
      templateType: "PREPOSITION_IMAGE_CHOICE",
      targetWord: row.word,
      imagePath: row.imagePath,
      audioPath: row.audioPath,
      extra: {
        questionType: "visual_card_choice",
        prompt: `Choose the picture that shows "${row.word}".`,
        question: `Choose the picture that shows "${row.word}".`,
        choices: cards.map(card => card.value),
        answerOptions: cards.map(card => ({ value: card.value, label: card.label })),
        imageCards: cards,
        correctAnswer: row.word,
        answer: row.word,
        itemType: "preposition",
        itemKey: row.word,
        explanation: `${row.word} tells where something is.`
      }
    }));
  });
  for (let variant = 0; questions.length < 42; variant += 1) {
    const row = rows[variant % rows.length];
    const round = Math.floor(variant / rows.length);
    const templateType = round === 0 ? "PREPOSITION_SENTENCE_FIT" : "PREPOSITION_CONTEXT_CHOICE";
    const options = [row.word, ...rotate(rows.map(item => item.word).filter(word => word !== row.word), variant * 3).slice(0, 3)];
    questions.push(baseQuestion({
      id: `second_prepositions_l2_${String(variant + 1).padStart(2, "0")}_${round === 0 ? "sentence" : "context"}_${row.slug}`,
      skillId: "prepositions",
      skillName: "Prepositions of Place",
      level: 2,
      templateType,
      targetWord: row.word,
      imagePath: row.imagePath,
      audioPath: row.audioPath,
      extra: {
        questionType: "ixl_template",
        prompt: round === 0
          ? "Choose the preposition that best fits the picture."
          : "Look at the picture. Choose the location word that completes the sentence.",
        question: round === 0
          ? "Choose the preposition that best fits the picture."
          : "Look at the picture. Choose the location word that completes the sentence.",
        sentence: `The object is ___ the other object.`,
        choices: options,
        answerOptions: optionObjects(options),
        correctAnswer: row.word,
        answer: row.word,
        itemType: "preposition",
        itemKey: row.word,
        explanation: `${row.word} fits the spatial relationship in the picture.`
      }
    }));
  }
  return questions;
}

const PLURAL_PAIRS = [
  ["cat", "cats"], ["dog", "dogs"], ["book", "books"], ["cup", "cups"], ["car", "cars"], ["hat", "hats"],
  ["bag", "bags"], ["ball", "balls"], ["bat", "bats"], ["bed", "beds"], ["duck", "ducks"], ["frog", "frogs"],
  ["map", "maps"], ["pen", "pens"], ["pig", "pigs"], ["hen", "hens"], ["grape", "grapes"], ["pea", "peas"],
  ["box", "boxes"], ["fox", "foxes"], ["bus", "buses"], ["dish", "dishes"], ["wish", "wishes"], ["class", "classes"],
  ["church", "churches"], ["lunch", "lunches"], ["glass", "glasses"], ["kiss", "kisses"], ["mitten", "mittens"],
  ["stair", "stairs"], ["puppy", "puppies"],
  ["baby", "babies"], ["party", "parties"], ["leaf", "leaves"], ["wolf", "wolves"], ["shelf", "shelves"],
  ["peach", "peaches"], ["bench", "benches"], ["dress", "dresses"], ["plum", "plums"], ["pear", "pears"],
  ["plane", "planes"], ["clock", "clocks"], ["cloud", "clouds"], ["plant", "plants"], ["spider", "spiders"],
  ["stone", "stones"], ["star", "stars"], ["tree", "trees"], ["sock", "socks"], ["drum", "drums"],
  ["flag", "flags"], ["kite", "kites"], ["ring", "rings"]
];
function makePlurals() {
  const spellingQuestions = PLURAL_PAIRS.flatMap(([singular, plural], index) => {
    const image = existingImagePath(plural) || existingImagePath(singular);
    const audio = approvedAudio(plural);
    if (!image) return [];
    const suffix = plural.endsWith("ies") ? "ies" : plural.endsWith("ves") ? "ves" : plural.endsWith("es") ? "es" : "s";
    const singularDistractors = rotate(PLURAL_PAIRS.map(pair => pair[0]).filter(word => word !== singular), index * 3).slice(0, 3);
    const options = [plural, ...singularDistractors];
    return [baseQuestion({
      id: `second_plurals_l${index < 12 ? 1 : 2}_${String(index + 1).padStart(2, "0")}_${slug(plural)}`,
      skillId: "plurals",
      skillName: "Plurals",
      level: index < 12 ? 1 : 2,
      templateType: "PLURAL_IMAGE_SPELLING",
      targetWord: plural,
      imagePath: image,
      audioPath: audio,
      extra: {
        prompt: "Choose the word that names more than one.",
        question: "Choose the word that names more than one.",
        choices: options,
        answerOptions: optionObjects(options),
        correctAnswer: plural,
        answer: plural,
        singularWord: singular,
        pluralRule: suffix,
        runtimeTemplateKey: `PLURAL_IMAGE_SPELLING_${suffix}_${slug(singular)}_${slug(plural)}`,
        itemType: "plural",
        itemKey: suffix,
        explanation: `${plural} means more than one ${singular}.`
      }
    })];
  });

  const rulePairs = PLURAL_PAIRS.slice(0, 8);
  const ruleQuestions = rulePairs.flatMap(([singular, plural], index) => {
    const image = existingImagePath(singular) || existingImagePath(plural);
    if (!image) return [];
    const suffix = plural.endsWith("ies") ? "ies" : plural.endsWith("ves") ? "ves" : plural.endsWith("es") ? "es" : "s";
    const options = [suffix, ...["s", "es", "ies", "ves"].filter(item => item !== suffix)].slice(0, 4);
    return [baseQuestion({
      id: `second_plurals_l2_rule_${String(index + 1).padStart(2, "0")}_${slug(singular)}`,
      skillId: "plurals",
      skillName: "Plurals",
      level: 2,
      templateType: "PLURAL_RULE_CHOICE",
      targetWord: singular,
      imagePath: image,
      audioPath: approvedAudio(singular),
      extra: {
        prompt: `What ending makes "${singular}" mean more than one?`,
        question: `What ending makes "${singular}" mean more than one?`,
        choices: options,
        answerOptions: optionObjects(options),
        correctAnswer: suffix,
        answer: suffix,
        singularWord: singular,
        pluralWord: plural,
        pluralRule: suffix,
        runtimeTemplateKey: `PLURAL_RULE_CHOICE_${suffix}_${slug(singular)}_${slug(plural)}`,
        itemType: "plural_rule",
        itemKey: suffix,
        explanation: `Add ${suffix} to make ${plural}.`
      }
    })];
  });

  return [...spellingQuestions, ...ruleQuestions];
}

const ANTONYM_PAIRS = [
  ["hot", "cold"], ["big", "small"], ["wet", "dry"], ["fast", "slow"], ["happy", "sad"], ["open", "closed"],
  ["day", "night"], ["up", "down"], ["in", "out"], ["full", "empty"], ["hard", "soft"], ["light", "dark"],
  ["long", "short"], ["old", "new"], ["loud", "quiet"], ["strong", "weak"], ["rough", "smooth"], ["clean", "dirty"],
  ["near", "far"], ["front", "back"], ["high", "low"], ["young", "old"], ["same", "different"], ["first", "last"]
];
const SYNONYM_PAIRS = [
  ["big", "large"], ["small", "tiny"], ["happy", "glad"], ["fast", "quick"], ["smart", "clever"], ["pretty", "beautiful"],
  ["start", "begin"], ["finish", "end"], ["under", "below"], ["over", "above"], ["near", "close"], ["shut", "closed"],
  ["sick", "ill"], ["quiet", "silent"], ["right", "correct"], ["wrong", "incorrect"], ["help", "aid"], ["look", "see"],
  ["jump", "hop"], ["speak", "talk"]
];
function makeAntonymsSynonyms() {
  const rows = [];
  ANTONYM_PAIRS.forEach(([word, answer], index) => rows.push(makeRelationQuestion("antonym", word, answer, index, 2)));
  SYNONYM_PAIRS.forEach(([word, answer], index) => rows.push(makeRelationQuestion("synonym", word, answer, index, 2)));
  return rows.filter(Boolean);
}

function makeRelationQuestion(kind, word, answer, index, level) {
  const image = existingImagePath(word) || posImagePath(word, "adjective") || posImagePath(word, "verb");
  const audio = approvedAudio(word);
  if (!image) return null;
  const allAnswers = kind === "antonym" ? ANTONYM_PAIRS.map(pair => pair[1]) : SYNONYM_PAIRS.map(pair => pair[1]);
  const options = [answer, ...rotate(allAnswers.filter(item => item !== answer), index * 4).slice(0, 3)];
  return baseQuestion({
    id: `second_antonyms_synonyms_l${level}_${String(index + 1).padStart(2, "0")}_${slug(word)}_${slug(answer)}`,
    skillId: "antonyms_synonyms",
    skillName: "Antonyms and Synonyms",
    level,
    templateType: kind === "antonym" ? "ANTONYM_CHOICE" : "SYNONYM_CHOICE",
    targetWord: word,
    imagePath: image,
    audioPath: audio,
    extra: {
      prompt: kind === "antonym" ? `Choose the opposite of "${word}".` : `Choose a word that means about the same as "${word}".`,
      question: kind === "antonym" ? `Choose the opposite of "${word}".` : `Choose a word that means about the same as "${word}".`,
      choices: options,
      answerOptions: optionObjects(options),
      correctAnswer: answer,
      answer,
      relationType: kind,
      itemType: kind,
      itemKey: word,
      explanation: kind === "antonym" ? `${answer} is the opposite of ${word}.` : `${answer} means about the same as ${word}.`
    }
  });
}

const rows = enrichRows(await readWorkbookRows());
const questions = [
  ...makeLongVowels(rows),
  ...makeVowelTeams(rows),
  ...makeGrammar(rows, "noun", "Nouns"),
  ...makeGrammar(rows, "verb", "Verbs"),
  ...makeGrammar(rows, "adjective", "Adjectives"),
  ...makePrepositions(),
  ...makePlurals(),
  ...makeAntonymsSynonyms()
];

questions.sort((a, b) =>
  a.skillId.localeCompare(b.skillId) ||
  Number(a.level || 1) - Number(b.level || 1) ||
  String(a.itemKey || a.targetPattern || a.targetWord || "").localeCompare(String(b.itemKey || b.targetPattern || b.targetWord || "")) ||
  a.id.localeCompare(b.id)
);

const duplicateIds = questions.map(q => q.id).filter((id, index, list) => list.indexOf(id) !== index);
if (duplicateIds.length) throw new Error(`Duplicate generated ids: ${duplicateIds.join(", ")}`);

const content = `// Auto-generated second-block assessment top-up questions.\n// Built from approved K3 vocabulary metadata/media on 2026-06-04.\n\nexport const secondBlockSkillTopUpQuestions = ${JSON.stringify(questions, null, 2)};\n`;
writeFile(outputPath, content);

const counts = questions.reduce((acc, question) => {
  const key = `${question.skillId}_L${question.level}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
const report = [
  "# Second Block Skill Question Generation",
  "",
  "Generated: 2026-06-04",
  "",
  `Questions generated: ${questions.length}`,
  "",
  "| Bucket | Count |",
  "| --- | ---: |",
  ...Object.entries(counts).sort().map(([key, count]) => `| ${key} | ${count} |`),
  "",
  "Generation rules: approved audio only, existing image files only, no fake compounds/non-words, POS-specific media for verb/adjective targets, spatial preposition images only.",
  ""
];
writeFile(reportPath, report.join("\n"));
// Honest source-pool support so depth checks can distinguish "pool exhausted"
// from "generator under-producing". maxSupported = unique eligible targets.
const poolSupport = Object.fromEntries(Object.entries(grammarPoolSupport).map(([skillId, pools]) => [
  skillId,
  { ...pools, maxSupported: pools.l1Pool + pools.l2Pool }
]));
writeFile(poolSupportPath, `${JSON.stringify(poolSupport, null, 2)}\n`);
console.log(`Generated ${questions.length} second-block top-up questions.`);
Object.entries(counts).sort().forEach(([key, count]) => console.log(`${key}: ${count}`));
