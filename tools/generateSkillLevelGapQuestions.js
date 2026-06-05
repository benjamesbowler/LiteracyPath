import fs from "node:fs";
import path from "node:path";

import { APPROVED_SIGHT_WORDS } from "../src/data/skillTemplateRouting.js";
import { HFW_WORD_BANDS } from "../src/data/highFrequencyWordBands.js";
import { kimiVocabulary500Lexicon } from "../src/data/kimiVocabulary500Lexicon.js";
import {
  finalSoundExpectedItemKeys,
  rhymingLevelTwoExpectedItemKeys
} from "../src/data/coverageExpectations.js";
import { getApprovedAudioPath } from "../src/data/audioPreferenceManifest.js";
import { getRhymeGroup } from "../src/data/rhymeGroups.js";
import {
  SKILL_LEVEL_DEPTH_TARGETS,
  managedAssessmentSkillDepthById
} from "../src/data/skillLevelDepthConfig.js";
import {
  auditSkillLevelDepth,
  docsValidationDir,
  ensureDir,
  getRuntimeSafeDepthQuestions,
  uniqueRuntimeQuestions
} from "./skillLevelDepthShared.js";
import { publicPathExists, repoRoot } from "./phonicsRuntimeUtils.js";

const generatedPath = path.join(repoRoot, "src", "data", "generated", "skillLevelGapQuestions.generated.js");
const manifestPath = path.join(docsValidationDir, "skill_level_gap_questions_generation.json");
const markdownPath = path.join(docsValidationDir, "skill_level_gap_questions_generation.md");
const GENERATED_SOURCE = "skill_level_depth_gap_generator";
const PHASE_BUFFER_SIZE = SKILL_LEVEL_DEPTH_TARGETS.phaseBufferSize || Math.ceil(SKILL_LEVEL_DEPTH_TARGETS.phaseSize * 1.5);
const SHORT_VOWEL_LABELS = ["short_a", "short_e", "short_i", "short_o", "short_u"];
const FORBIDDEN_EARLY_CHOICE_WORDS = new Set([
  "yen"
]);
const SINGLE_LETTER_SOUNDS = "abcdefghijklmnopqrstuvwxyz".split("");
const BASIC_FINAL_SOUNDS = finalSoundExpectedItemKeys;
const REPLACED_LEGACY_SKILLS = new Set([
  "prepositions_of_place",
  "plurals",
  "prefixes_suffixes",
  "antonyms_synonyms",
  "homophones_homonyms",
  "vowel_teams",
  "sentence_comprehension",
  "key_details",
  "sequencing",
  "main_idea",
  "inference",
  "cause_effect",
  "context_clues",
  "theme_higher_comprehension"
]);
const HIGHER_COMPREHENSION_SKILLS = new Set([
  "sentence_comprehension",
  "key_details",
  "sequencing",
  "main_idea",
  "inference",
  "cause_effect",
  "context_clues",
  "theme_higher_comprehension"
]);
const REPLACEMENT_QUESTION_COUNT = SKILL_LEVEL_DEPTH_TARGETS.minimumPerLevel;

function normalize(value = "") {
  return String(value || "").toLowerCase().trim();
}

function slug(value = "") {
  return normalize(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function unique(items = []) {
  return [...new Set(items.filter(Boolean))];
}

function choiceList(answer, pool, size = 4) {
  return unique([answer, ...pool.filter(item => item !== answer)]).slice(0, size);
}

function rotate(items, offset) {
  if (!items.length) return [];
  const start = offset % items.length;
  return items.slice(start).concat(items.slice(0, start));
}

const BLOCKED_RUNTIME_MEDIA_TOKEN = /(?:blank|placeholder|fallback|missing|unavailable|coming-soon)/i;

function hasMedia(entry) {
  return entry?.status === "approved" &&
    !BLOCKED_RUNTIME_MEDIA_TOKEN.test(`${entry.word || ""} ${entry.imagePath || ""} ${entry.audioPath || ""}`) &&
    publicPathExists(entry.imagePath) &&
    publicPathExists(entry.audioPath) &&
    Boolean(getApprovedAudioPath(entry.word, entry.audioPath));
}

const lexicon = kimiVocabulary500Lexicon
  .filter(hasMedia)
  .map(entry => ({
    ...entry,
    word: normalize(entry.word),
    displayWord: entry.displayWord || entry.word
  }));

function byWord(word) {
  return lexicon.find(entry => entry.word === normalize(word));
}

function entriesFor(predicate) {
  return lexicon.filter(predicate);
}

const SHORT_VOWEL_MEDIA_RESERVE = [
  ["bat", "short_a"], ["bed", "short_e"], ["box", "short_o"], ["bus", "short_u"],
  ["cap", "short_a"], ["cat", "short_a"], ["cup", "short_u"], ["dog", "short_o"],
  ["fan", "short_a"], ["fox", "short_o"], ["gum", "short_u"], ["ham", "short_a"],
  ["hat", "short_a"], ["hen", "short_e"], ["jam", "short_a"], ["map", "short_a"],
  ["mat", "short_a"], ["net", "short_e"], ["pan", "short_a"], ["pen", "short_e"],
  ["pin", "short_i"], ["pot", "short_o"], ["rug", "short_u"], ["sun", "short_u"],
  ["tap", "short_a"], ["top", "short_o"]
].map(([word, shortVowel]) => ({
  word,
  normalizedWord: word,
  displayWord: word,
  imagePath: `/media/initial-sounds/images/${word[0]}/${word}.webp`,
  audioPath: `/media/initial-sounds/audio/${word[0]}/${word}.mp3`,
  status: "approved",
  isConcrete: true,
  isImageable: true,
  phonics: {
    initialSound: word[0],
    finalSound: word.slice(-1),
    cvc: word.length === 3,
    shortVowel
  },
  skills: {
    cvcShortVowels: {
      eligible: true,
      minLevel: 1
    }
  }
})).filter(hasMedia);

function entriesWithShortVowelReserve(predicate) {
  const seen = new Set();
  return [...lexicon, ...SHORT_VOWEL_MEDIA_RESERVE]
    .filter(entry => !FORBIDDEN_EARLY_CHOICE_WORDS.has(entry.word))
    .filter(entry => {
      if (seen.has(entry.word)) return false;
      seen.add(entry.word);
      return predicate(entry);
    });
}

function vowelOptions(correctVowel, seed = 0, count = 4) {
  const vowels = ["a", "e", "i", "o", "u"];
  const distractors = vowels.filter(vowel => vowel !== correctVowel);
  const start = Math.abs(seed) % distractors.length;
  return [
    correctVowel,
    ...distractors.slice(start),
    ...distractors.slice(0, start)
  ].slice(0, count);
}

function entrySkillEligible(skillKey, level, entry) {
  const skill = entry.skills?.[skillKey];
  return Boolean(skill?.eligible && Number(skill.minLevel || 1) <= level);
}

function baseQuestion({ id, skillId, skillName, level, phaseTarget, templateType, prompt, correctAnswer, answerOptions, targetWord, itemType, itemKey, extra = {} }) {
  return {
    id,
    grade: "K",
    skillId,
    skillName,
    skill: skillName,
    level,
    difficulty: level,
    phaseTarget,
    templateType,
    formatType: templateType,
    questionType: "multiple_choice",
    prompt,
    question: prompt,
    targetWord,
    itemType,
    itemKey,
    correctAnswer,
    answer: correctAnswer,
    answerOptions,
    choices: answerOptions,
    active: true,
    source: GENERATED_SOURCE,
    tags: ["generated-gap", `level-${level}`, skillId],
    ...extra
  };
}

function mediaQuestion(args, entry, extra = {}) {
  return baseQuestion({
    ...args,
    targetWord: entry.word,
    extra: {
      targetWord: entry.word,
      imageUrl: entry.imagePath,
      imagePath: entry.imagePath,
      audioUrl: entry.audioPath,
      audioPath: entry.audioPath,
      audioText: entry.word,
      spokenPrompt: entry.word,
      audioKey: entry.word,
      imageKey: entry.word,
      ...extra
    }
  });
}

function makeInitialQuestions(level, needed) {
  const pool = entriesFor(entry =>
    entry.isConcrete &&
    entry.isImageable &&
    entrySkillEligible("initialSounds", level, entry) &&
    /^[a-z]$/.test(entry.phonics?.initialSound || "") &&
    (level === 2 ? !entry.phonics?.cvc : true)
  );
  const used = new Set();
  return pool.slice(0, needed).map((entry, index) => {
    const answer = entry.phonics.initialSound;
    used.add(answer);
    const distractors = rotate(SINGLE_LETTER_SOUNDS.filter(letter => letter !== answer), index * 3);
    return mediaQuestion({
      id: `gap_initial_l${level}_${slug(entry.word)}`,
      skillId: "initial_sounds",
      skillName: "Initial Sounds",
      level,
      phaseTarget: `level_${level}`,
      templateType: "FIRST_SOUND",
      prompt: "Listen to the word. What sound does it start with?",
      correctAnswer: answer,
      answerOptions: choiceList(answer, distractors),
      itemType: "initial_sound",
      itemKey: answer
    }, entry, {
      targetSound: answer,
      explanation: `${entry.displayWord} starts with /${answer}/.`
    });
  });
}

function makeShortVowelQuestions(skillId, skillName, level, needed) {
  const pool = entriesWithShortVowelReserve(entry =>
    entry.isConcrete &&
    entry.isImageable &&
    entry.phonics?.shortVowel &&
    (level === 1 ? entry.phonics?.cvc : true) &&
    (skillId === "cvc_short_vowels" ? entry.skills?.cvcShortVowels?.eligible : true)
  );
  const makeQuestion = (entry, index, variant = 0) => {
    const itemKey = entry.phonics.shortVowel;
    const vowel = itemKey.replace("short_", "");
    const templateType = skillId === "short_vowel_discrimination"
      ? "LISTEN_CHOOSE_VOWEL"
      : variant === 1
      ? "MISSING_VOWEL_CVC"
      : index % 2 === 0 ? "LISTEN_CHOOSE_VOWEL" : "SHORT_VOWEL_WORD";
    return mediaQuestion({
      id: `gap_${slug(skillId)}_l${level}_${slug(entry.word)}_${index + 1}${variant ? `_v${variant + 1}` : ""}`,
      skillId,
      skillName,
      level,
      phaseTarget: `level_${level}`,
      templateType,
      prompt: "Listen to the word. Which short vowel sound do you hear?",
      correctAnswer: vowel,
      answerOptions: templateType === "LISTEN_CHOOSE_VOWEL"
        ? vowelOptions(vowel, index)
        : ["a", "e", "i", "o", "u"],
      itemType: "short_vowel",
      itemKey
    }, entry, {
      targetVowel: vowel,
      shortVowel: itemKey,
      phonicsPattern: itemKey,
      partialWord: variant === 1 ? entry.word.replace(/[aeiou]/, "_") : undefined,
      explanation: `${entry.displayWord} has the ${itemKey.replace("_", " ")} sound.`
    });
  };
  const primary = pool.slice(0, needed).map((entry, index) => makeQuestion(entry, index, 0));
  if (primary.length >= needed) return primary;
  const variants = pool
    .filter(entry => /^[a-z]{3,5}$/.test(entry.word))
    .slice(0, needed - primary.length)
    .map((entry, index) => makeQuestion(entry, primary.length + index, 1));
  return [...primary, ...variants].slice(0, needed);
}

function makeRhymingQuestions(level, needed) {
  const grouped = new Map();
  for (const entry of entriesFor(item =>
    item.isConcrete &&
    item.isImageable &&
    entrySkillEligible("rhyming", level, item) &&
    getRhymeGroup(item.word)
  )) {
    const family = getRhymeGroup(entry.word);
    if (level === 2 && rhymingLevelTwoExpectedItemKeys.length && !rhymingLevelTwoExpectedItemKeys.includes(family)) continue;
    if (!grouped.has(family)) grouped.set(family, []);
    grouped.get(family).push(entry);
  }

  const families = [...grouped.entries()].filter(([, items]) => items.length >= 2);
  const questions = [];
  for (let round = 0; questions.length < needed && round < 6; round += 1) {
    for (const [family, items] of families) {
      if (questions.length >= needed) break;
      const target = items[round % items.length];
      const rhymes = items.filter(item => item.word !== target.word);
      if (!rhymes.length) continue;
      const correct = rhymes[0];
      const distractors = lexicon
        .filter(item => item.word !== target.word && item.word !== correct.word && item.phonics?.rimeFamily !== family && item.isConcrete)
        .slice(round * 4, round * 4 + 6);
      const cards = [correct, ...distractors].slice(0, 4);
      if (cards.length !== 4) continue;
      questions.push(baseQuestion({
        id: `gap_rhyming_l${level}_${slug(family)}_${slug(target.word)}_${slug(correct.word)}_${round + 1}`,
        skillId: "rhyming",
        skillName: "Rhyming",
        level,
        phaseTarget: `level_${level}`,
        templateType: "RHYMING_PICTURE",
        prompt: `Which word rhymes with ${target.displayWord}?`,
        correctAnswer: correct.word,
        answerOptions: cards.map(item => item.word),
        targetWord: target.word,
        itemType: "rhyming_family",
        itemKey: family,
        extra: {
          rimeFamily: family,
          targetImageUrl: target.imagePath,
          imageUrl: target.imagePath,
          imagePath: target.imagePath,
          audioUrl: target.audioPath,
          audioPath: target.audioPath,
          correctAnswers: [correct.word],
          requiredSelections: 1,
          imageCards: cards.map(item => ({
            id: slug(item.word),
            word: item.word,
            label: item.displayWord,
            value: item.word,
            image: item.imagePath,
            imageUrl: item.imagePath,
            isCorrect: item.word === correct.word
          }))
        }
      }));
    }
  }
  return questions;
}

function makePatternQuestions({ skillId, skillName, level, needed, templateType = "PICTURE_AUDIO_TO_PATTERN", skillKey, patternGetter, patterns, prompt }) {
  const pool = entriesFor(entry => {
    const pattern = patternGetter(entry);
    return entry.isConcrete && entry.isImageable && pattern && (!patterns || patterns.includes(pattern)) && entrySkillEligible(skillKey, 3, entry);
  });
  const questions = [];
  const patternPool = unique(pool.map(patternGetter));
  for (const entry of pool) {
    if (questions.length >= needed) break;
    const pattern = patternGetter(entry);
    const answers = choiceList(pattern, rotate(patternPool.filter(item => item !== pattern), questions.length * 2));
    if (answers.length < 2) continue;
    const question = mediaQuestion({
      id: `gap_${slug(skillId)}_l${level}_${slug(pattern)}_${slug(entry.word)}`,
      skillId,
      skillName,
      level,
      phaseTarget: `level_${level}`,
      templateType,
      prompt,
      correctAnswer: pattern,
      answerOptions: answers.length >= 4 ? answers.slice(0, 4) : choiceList(pattern, ["a_e", "i_e", "o_e", "u_e", "ai", "ee", "oa", "ar", "or"]),
      itemType: "phonics_pattern",
      itemKey: pattern
    }, entry, {
      targetPattern: pattern,
      phonicsPattern: pattern,
      partialWord: entry.word.includes(pattern) ? entry.word.replace(pattern, "_") : "",
      targetImage: entry.imagePath,
      targetImagePath: entry.imagePath,
      targetImageUrl: entry.imagePath,
      explanation: `${entry.displayWord} uses the ${pattern} pattern.`
    });
    delete question.audioUrl;
    delete question.audioPath;
    delete question.audioText;
    delete question.audioKey;
    question.spokenPrompt = prompt;
    questions.push(question);
  }
  return questions;
}

function makeDigraphQuestions(level, needed) {
  return makePatternQuestions({
    skillId: "digraphs",
    skillName: "Digraphs",
    level,
    needed,
    skillKey: "digraphs",
    patternGetter: entry => entry.phonics?.digraphInitial || entry.phonics?.digraphFinal || "",
    patterns: level === 1 ? ["sh", "ch", "th", "wh"] : null,
    prompt: "Which letters make the special sound in this word?"
  });
}

function makeLongVowelQuestions(level, needed) {
  const patternFor = entry => {
    const pattern = entry.phonics?.vowelPattern || "";
    if (pattern === "silent-e" && entry.phonics?.longVowel) return `${entry.phonics.longVowel}_e`;
    return "";
  };
  return makePatternQuestions({
    skillId: "long_vowels_silent_e",
    skillName: "Long Vowels and Silent E",
    level,
    needed,
    templateType: "DECODING",
    skillKey: "longVowelsSilentE",
    patternGetter: patternFor,
    patterns: ["a_e", "i_e", "o_e", "u_e", "e_e"],
    prompt: "Which silent-e pattern is in this word?"
  });
}

function makeVowelTeamQuestions(level, needed) {
  return makePatternQuestions({
    skillId: "vowel_teams",
    skillName: "Vowel Teams",
    level,
    needed,
    templateType: "LONG_VOWEL_TEAM_COMPLETE",
    skillKey: "vowelTeams",
    patternGetter: entry => entry.phonics?.cvce ? "" : entry.phonics?.vowelTeam || "",
    patterns: level === 1 ? ["ai", "ay", "ee", "ea", "oa"] : ["ai", "ay", "ee", "ea", "oa", "oi", "oy", "ou", "ow", "ue", "ui", "oo", "oe"],
    prompt: level === 1
      ? "Look at the picture. Which vowel team completes the word?"
      : "Look at the picture. Which vowel team best completes the word?"
  });
}

function makeRControlledQuestions(level, needed) {
  return makePatternQuestions({
    skillId: "r_controlled_vowels",
    skillName: "R-Controlled Vowels",
    level,
    needed,
    templateType: "DECODING",
    skillKey: "rControlledVowels",
    patternGetter: entry => entry.phonics?.rControlled || "",
    patterns: level === 1 ? ["ar", "or", "er", "ir", "ur"] : null,
    prompt: "Which r-controlled vowel pattern is in this word?"
  });
}

const HFW_BANDS = {
  ...HFW_WORD_BANDS,
  hfw_26_50: ["he", "she", "they", "was", "with", "for", "all", "are", "but", "under", "then", "that", "have", "from", "this", "what", "were", "when", "where", "went", "came", "will", "into", "just", "now"],
  hfw_51_100: ["after", "again", "any", "around", "ask", "away", "be", "before", "by", "cold", "come", "could", "down", "every", "find", "fly", "found", "funny", "give", "going", "has", "help", "helps", "her", "here", "him", "his", "how", "know", "let", "like", "little", "live", "look", "made", "make", "may", "me", "must", "new", "not", "old", "once", "open", "our", "out", "over", "play", "please", "pretty", "put", "read"]
};

function getQuestionPhase(question = {}) {
  const raw = question.phase ?? question.assessmentPhase ?? question.levelPhase ?? question.phaseTarget ?? "";
  const numeric = Number(raw);
  if (numeric === 1 || numeric === 2) return numeric;
  const text = String(raw || "").toLowerCase();
  if (/\bphase_?1\b|level_?\d_?phase_?1|p1/.test(text)) return 1;
  if (/\bphase_?2\b|level_?\d_?phase_?2|p2/.test(text)) return 2;
  return 0;
}

function makeSkillLevelKey(skillId, level) {
  return `${skillId || ""}::${Number(level || 1) >= 2 ? 2 : 1}`;
}

function buildBasePhaseCounts() {
  const counts = new Map();
  const baseQuestions = uniqueRuntimeQuestions(
    getRuntimeSafeDepthQuestions().filter(question =>
      !question.depthFilterReason &&
      question.depthSkillId &&
      !REPLACED_LEGACY_SKILLS.has(question.depthSkillId) &&
      question._source !== "skillLevelGapQuestions"
    )
  );

  for (const question of baseQuestions) {
    const key = makeSkillLevelKey(question.depthSkillId, question.depthLevel);
    const current = counts.get(key) || { 1: 0, 2: 0 };
    const phase = getQuestionPhase(question);
    if (phase === 1 || phase === 2) {
      current[phase] += 1;
    } else {
      current[1] += 1;
      current[2] += 1;
    }
    counts.set(key, current);
  }

  return counts;
}

function withGeneratedPhaseMetadata(questions = [], basePhaseCounts = buildBasePhaseCounts()) {
  const nextCounts = new Map(
    [...basePhaseCounts.entries()].map(([key, value]) => [key, { ...value }])
  );
  return questions.map(question => {
    const key = makeSkillLevelKey(question.skillId, question.level);
    const current = nextCounts.get(key) || { 1: 0, 2: 0 };
    const level = Number(question.level || 1) >= 2 ? 2 : 1;
    const phase = current[1] <= current[2] || current[2] >= PHASE_BUFFER_SIZE ? 1 : 2;
    current[phase] += 1;
    nextCounts.set(key, current);
    return {
      ...question,
      phase,
      assessmentPhase: phase,
      phaseTarget: `level_${level}_phase_${phase}`
    };
  });
}

function makeHfwQuestions(skillId, skillName, level, needed) {
  const band = HFW_BANDS[skillId] || [];
  const approved = band.filter(word => APPROVED_SIGHT_WORDS.has(word));
  const target = skillId === "hfw_26_50" ? Math.max(needed, 25) : needed;
  return approved.slice(0, target).map((word, index) => {
    const choices = choiceList(word, rotate(approved.filter(other => other !== word), index * 3));
    return baseQuestion({
      id: `gap_${slug(skillId)}_l${level}_${slug(word)}`,
      skillId,
      skillName,
      level,
      phaseTarget: `level_${level}`,
      templateType: "READ_FIND_WORD",
      prompt: `Find the word: ${word}.`,
      correctAnswer: word,
      answerOptions: choices,
      targetWord: word,
      itemType: "sight_word",
      itemKey: word
    });
  });
}

const SIMPLE_GRAMMAR = {
  nouns: [
    ["cat", "Which word names an animal?", ["cat", "run", "happy", "under"]],
    ["cup", "Which word names a thing?", ["cup", "jump", "soft", "behind"]],
    ["desk", "Which word names a classroom thing?", ["desk", "eat", "cold", "over"]],
    ["bird", "Which word names an animal?", ["bird", "sleep", "big", "inside"]],
    ["book", "Which word names a thing?", ["book", "push", "wet", "below"]],
    ["apple", "Which word names a food?", ["apple", "pull", "round", "between"]]
  ],
  verbs: [
    ["jump", "Which word is an action?", ["jump", "cat", "red", "under"]],
    ["run", "Which word is an action?", ["run", "cup", "small", "behind"]],
    ["push", "Which word is an action?", ["push", "desk", "cold", "above"]],
    ["pull", "Which word is an action?", ["pull", "bird", "soft", "inside"]],
    ["draw", "Which word is an action?", ["draw", "apple", "round", "near"]],
    ["climb", "Which word is an action?", ["climb", "book", "wet", "below"]]
  ],
  adjectives: [
    ["big", "Which word describes size?", ["big", "cat", "run", "under"]],
    ["small", "Which word describes size?", ["small", "cup", "jump", "behind"]],
    ["cold", "Which word describes how something feels?", ["cold", "desk", "push", "above"]],
    ["soft", "Which word describes how something feels?", ["soft", "bird", "pull", "inside"]],
    ["round", "Which word describes shape?", ["round", "apple", "draw", "near"]],
    ["wet", "Which word describes something?", ["wet", "book", "climb", "below"]]
  ],
  prepositions_of_place: [
    ["above", "Which word tells where something is?", ["above", "cat", "run", "big"]],
    ["below", "Which word tells where something is?", ["below", "cup", "jump", "small"]],
    ["behind", "Which word tells where something is?", ["behind", "desk", "push", "cold"]],
    ["inside", "Which word tells where something is?", ["inside", "bird", "pull", "soft"]],
    ["between", "Which word tells where something is?", ["between", "apple", "draw", "round"]],
    ["near", "Which word tells where something is?", ["near", "book", "climb", "wet"]]
  ]
};

function lexiconWordsForCategory(categories = [], tags = []) {
  const categorySet = new Set(categories);
  const tagSet = new Set(tags);
  return lexicon.filter(entry => {
    const category = entry.skills?.vocabulary?.category || "";
    return categorySet.has(category) || (entry.tags || []).some(tag => tagSet.has(tag));
  });
}

function cycleRows(rows, needed) {
  return Array.from({ length: needed }, (_, index) => rows[index % rows.length]);
}

function makeVocabularyGrammarQuestions(skillId, skillName, level, needed) {
  if (skillId === "prepositions_of_place") {
    const spatial = [
      "above", "below", "behind", "beside", "between", "inside", "outside", "under", "over", "near",
      "far", "around", "through", "across", "against", "beneath", "next to", "in front of", "on top of",
      "along", "past", "toward", "away from", "around the corner", "by", "within", "beyond", "underneath",
      "among", "opposite", "beside the gate", "under the bridge", "inside the basket", "behind the curtain",
      "between the trees", "near the river", "across the path", "around the bend", "toward the door",
      "away from the road", "beneath the shelf", "on the left", "on the right", "at the front",
      "at the back", "in the middle", "outside the tent", "past the bench", "along the fence",
      "through the tunnel"
    ];
    const rows = level === 1 ? spatial : [...spatial].reverse();
    return rows.slice(0, Math.max(needed, 20)).map((answer, index) => {
      const entry = byWord(answer);
      return baseQuestion({
        id: `gap_${slug(skillId)}_l${level}_${slug(answer)}_${index + 1}`,
        skillId,
        skillName,
        level,
        phaseTarget: `level_${level}`,
        templateType: "GRAMMAR_BASICS",
        prompt: level === 2
          ? "Which more precise word or phrase tells where something is?"
          : "Which word or phrase tells where something is?",
        correctAnswer: answer,
        answerOptions: choiceList(answer, rotate(["cat", "draw", "happy", "book", "jump", "soft"], index)),
        targetWord: answer,
        itemType: skillId,
        itemKey: answer,
        extra: entry ? {
          imageUrl: entry.imagePath,
          imagePath: entry.imagePath
        } : {}
      });
    });
  }

  const categoryPools = {
    nouns: lexiconWordsForCategory([
      "early_vocabulary",
      "developing_vocabulary",
      "functional_vocabulary",
      "objects_and_materials",
      "animals_and_creatures",
      "school_and_tools",
      "food_and_cooking",
      "clothing_and_accessories",
      "transportation_and_vehicles"
    ], ["concrete_vocabulary"]),
    verbs: lexiconWordsForCategory(["action", "verbs_and_actions"], ["verbs_actions"]),
    adjectives: lexiconWordsForCategory(["adjective", "adjectives_and_descriptors"], ["adjectives_concepts"]),
    prepositions_of_place: lexiconWordsForCategory(["spatial_or_concept"], ["prepositions_spatial", "prepositions_and_directions"])
  };

  if (categoryPools[skillId]?.length) {
    const prompts = {
      nouns: "Which word names a person, place, animal, or thing?",
      verbs: "Which word is an action?",
      adjectives: "Which word describes something?",
      prepositions_of_place: "Which word tells where something is?"
    };
    const distractors = {
      nouns: ["jump", "soft", "under"],
      verbs: ["cat", "small", "behind"],
      adjectives: ["cup", "run", "above"],
      prepositions_of_place: ["book", "draw", "happy"]
    };
    const pool = categoryPools[skillId];
    return pool.slice(0, Math.max(needed, 20)).map((entry, index) => baseQuestion({
      id: `gap_${slug(skillId)}_l${level}_${slug(entry.word)}_${index + 1}`,
      skillId,
      skillName,
      level,
      phaseTarget: `level_${level}`,
      templateType: "GRAMMAR_BASICS",
      prompt: prompts[skillId],
      correctAnswer: entry.word,
      answerOptions: choiceList(entry.word, rotate(distractors[skillId], index)),
      targetWord: entry.word,
      itemType: skillId,
      itemKey: entry.word,
      extra: {
        imageUrl: entry.imagePath,
        imagePath: entry.imagePath
      }
    }));
  }

  const rows = SIMPLE_GRAMMAR[skillId] || SIMPLE_GRAMMAR.nouns;
  return cycleRows(rows, needed).map(([answer, prompt, choices], index) => baseQuestion({
    id: `gap_${slug(skillId)}_l${level}_${slug(answer)}_${index + 1}`,
    skillId,
    skillName,
    level,
    phaseTarget: `level_${level}`,
    templateType: "GRAMMAR_BASICS",
    prompt,
    correctAnswer: answer,
    answerOptions: choiceList(answer, choices.filter(choice => choice !== answer)),
    targetWord: answer,
    itemType: skillId,
    itemKey: answer
  }));
}

const PLURALS = [
  ["cats", "cat"], ["dogs", "dog"], ["cups", "cup"], ["books", "book"], ["birds", "bird"], ["bags", "bag"],
  ["boxes", "box"], ["wishes", "wish"], ["buses", "bus"], ["dishes", "dish"], ["babies", "baby"], ["puppies", "puppy"],
  ["berries", "berry"], ["leaves", "leaf"], ["wolves", "wolf"], ["knives", "knife"], ["children", "child"], ["feet", "foot"],
  ["teeth", "tooth"], ["mice", "mouse"], ["geese", "goose"],
  ["foxes", "fox"], ["brushes", "brush"], ["benches", "bench"], ["classes", "class"], ["toys", "toy"], ["trays", "tray"],
  ["keys", "key"], ["boys", "boy"], ["ladies", "lady"], ["stories", "story"], ["loaves", "loaf"], ["scarves", "scarf"],
  ["men", "man"], ["women", "woman"], ["people", "person"], ["oxen", "ox"],
  ["cars", "car"], ["boats", "boat"], ["chairs", "chair"], ["pencils", "pencil"],
  ["flowers", "flower"], ["apples", "apple"], ["bikes", "bike"], ["shoes", "shoe"],
  ["lamps", "lamp"], ["doors", "door"], ["watches", "watch"], ["churches", "church"], ["bunches", "bunch"],
  ["potatoes", "potato"], ["tomatoes", "tomato"], ["heroes", "hero"], ["echoes", "echo"], ["pianos", "piano"],
  ["radios", "radio"], ["roofs", "roof"], ["chiefs", "chief"], ["shelves", "shelf"], ["halves", "half"],
  ["calves", "calf"], ["elves", "elf"], ["deer", "deer"], ["sheep", "sheep"], ["fish", "fish"],
  ["cacti", "cactus"], ["fungi", "fungus"], ["nuclei", "nucleus"], ["radii", "radius"], ["indices", "index"]
];

function makePluralQuestions(skillName, level, needed) {
  const rows = level === 1 ? PLURALS : [...PLURALS].reverse();
  return rows.slice(0, needed).map(([plural, singular], index) => baseQuestion({
    id: `gap_plurals_l${level}_${slug(plural)}_${index + 1}`,
    skillId: "plurals",
    skillName,
    level,
    phaseTarget: `level_${level}`,
    templateType: "PLURAL_SPELLING_CONTEXT",
    prompt: level === 2
      ? `Choose the correct plural for the sentence: We saw three ${singular} on the way home.`
      : `Which word means more than one ${singular}?`,
    correctAnswer: plural,
    answerOptions: choiceList(plural, [singular, `${singular}s`, `${singular}es`, `${singular}ies`]),
    targetWord: plural,
    itemType: "plural",
    itemKey: singular,
    extra: {
      runtimeTemplateKey: `PLURAL_SPELLING_CONTEXT_${level}_${slug(singular)}_${slug(plural)}`
    }
  }));
}

const MORPHEMES = [
  ["unhappy", "not happy", ["not happy", "happy again", "very happy", "full of happy"]],
  ["unkind", "not kind", ["not kind", "kind again", "very kind", "full of kind"]],
  ["reread", "read again", ["read again", "not read", "read before", "full of reading"]],
  ["replay", "play again", ["play again", "not play", "play before", "full of play"]],
  ["careful", "full of care", ["full of care", "without care", "care again", "not care"]],
  ["helpful", "full of help", ["full of help", "without help", "help again", "not help"]],
  ["careless", "without care", ["without care", "full of care", "care again", "not care"]],
  ["fearless", "without fear", ["without fear", "full of fear", "fear again", "not fear"]],
  ["redo", "do again", ["do again", "not do", "do before", "full of doing"]],
  ["return", "turn back", ["turn back", "not turn", "full of turn", "turn before"]],
  ["preview", "look before", ["look before", "not look", "look again", "full of looking"]],
  ["preheat", "heat before", ["heat before", "not heat", "heat again", "full of heat"]],
  ["teacher", "a person who teaches", ["a person who teaches", "teach again", "not teach", "full of teach"]],
  ["player", "a person who plays", ["a person who plays", "play again", "not play", "without play"]],
  ["joyful", "full of joy", ["full of joy", "without joy", "joy again", "not joy"]],
  ["hopeful", "full of hope", ["full of hope", "without hope", "hope again", "not hope"]],
  ["colorful", "full of color", ["full of color", "without color", "color again", "not color"]],
  ["hopeless", "without hope", ["without hope", "full of hope", "hope again", "not hope"]],
  ["useless", "not useful", ["not useful", "full of use", "use again", "before use"]],
  ["dislike", "not like", ["not like", "like again", "full of like", "before like"]],
  ["disagree", "not agree", ["not agree", "agree again", "full of agree", "before agree"]],
  ["unlock", "open a lock", ["open a lock", "lock again", "full of lock", "before lock"]],
  ["untie", "not tied", ["not tied", "tie again", "full of tie", "before tie"]],
  ["rewrite", "write again", ["write again", "not write", "write before", "full of writing"]],
  ["repaint", "paint again", ["paint again", "not paint", "paint before", "full of paint"]],
  ["prepay", "pay before", ["pay before", "not pay", "pay again", "full of pay"]],
  ["kindness", "being kind", ["being kind", "not kind", "kind again", "before kind"]],
  ["darkness", "being dark", ["being dark", "not dark", "dark again", "before dark"]],
  ["quickly", "in a quick way", ["in a quick way", "not quick", "full of quick", "quick again"]],
  ["slowly", "in a slow way", ["in a slow way", "not slow", "full of slow", "slow again"]],
  ["softly", "in a soft way", ["in a soft way", "not soft", "full of soft", "soft again"]],
  ["washable", "able to be washed", ["able to be washed", "not washed", "washed again", "full of wash"]],
  ["readable", "able to be read", ["able to be read", "not read", "read again", "full of reading"]],
  ["carefully", "in a careful way", ["in a careful way", "without care", "care again", "not care"]],
  ["fearfully", "in a fearful way", ["in a fearful way", "without fear", "fear again", "not fear"]],
  ["unpack", "take things out", ["take things out", "pack again", "not pack", "pack before"]],
  ["unfold", "open something folded", ["open something folded", "fold again", "not fold", "full of fold"]],
  ["rebuild", "build again", ["build again", "not build", "build before", "full of building"]],
  ["recheck", "check again", ["check again", "not check", "check before", "full of checking"]],
  ["pretest", "a test before", ["a test before", "not a test", "test again", "full of test"]],
  ["precut", "cut before", ["cut before", "cut again", "not cut", "full of cut"]],
  ["singer", "a person who sings", ["a person who sings", "sing again", "not sing", "full of song"]],
  ["runner", "a person who runs", ["a person who runs", "run again", "not run", "without running"]],
  ["painter", "a person who paints", ["a person who paints", "paint again", "not paint", "full of paint"]],
  ["sadness", "being sad", ["being sad", "not sad", "sad again", "before sad"]],
  ["neatness", "being neat", ["being neat", "not neat", "neat again", "before neat"]],
  ["thankful", "full of thanks", ["full of thanks", "without thanks", "thanks again", "not thanks"]],
  ["playful", "full of play", ["full of play", "without play", "play again", "not play"]],
  ["painless", "without pain", ["without pain", "full of pain", "pain again", "not pain"]],
  ["wireless", "without wires", ["without wires", "full of wires", "wire again", "before wires"]],
  ["movable", "able to be moved", ["able to be moved", "not moved", "move again", "full of move"]]
];

function makeMorphemeQuestions(skillName, level, needed) {
  const rows = level === 1 ? MORPHEMES : [...MORPHEMES].reverse();
  return cycleRows(rows, needed).map(([word, answer, choices], index) => baseQuestion({
    id: `gap_prefixes_suffixes_l${level}_${slug(word)}_${index + 1}`,
    skillId: "prefixes_suffixes",
    skillName,
    level,
    phaseTarget: `level_${level}`,
    templateType: "MORPHEME_MEANING_CONTEXT",
    prompt: level === 2
      ? `In a sentence, what does the word ${word} mean?`
      : `What does ${word} mean?`,
    correctAnswer: answer,
    answerOptions: choiceList(answer, choices.filter(choice => choice !== answer)),
    targetWord: word,
    itemType: "morpheme",
    itemKey: word.match(/^(un|re|pre)/)?.[1] || word.match(/(ful|less|er)$/)?.[1] || word
  }));
}

const ANTONYM_SYNONYM = [
  ["hot", "cold", "Which word means the opposite of hot?", ["cold", "warm", "sunny", "wet"]],
  ["big", "small", "Which word means the opposite of big?", ["small", "large", "tall", "round"]],
  ["happy", "glad", "Which word means about the same as happy?", ["glad", "sad", "mad", "tired"]],
  ["fast", "quick", "Which word means about the same as fast?", ["quick", "slow", "quiet", "soft"]],
  ["open", "closed", "Which word means the opposite of open?", ["closed", "wide", "ready", "near"]],
  ["wet", "dry", "Which word means the opposite of wet?", ["dry", "cold", "dark", "flat"]],
  ["tall", "short", "Which word means the opposite of tall?", ["short", "long", "high", "wide"]],
  ["light", "dark", "Which word means the opposite of light?", ["dark", "bright", "white", "clear"]],
  ["hard", "soft", "Which word means the opposite of hard?", ["soft", "strong", "solid", "round"]],
  ["clean", "dirty", "Which word means the opposite of clean?", ["dirty", "clear", "neat", "plain"]],
  ["full", "empty", "Which word means the opposite of full?", ["empty", "filled", "big", "deep"]],
  ["near", "far", "Which word means the opposite of near?", ["far", "close", "next", "inside"]],
  ["begin", "start", "Which word means about the same as begin?", ["start", "stop", "finish", "wait"]],
  ["end", "finish", "Which word means about the same as end?", ["finish", "open", "start", "push"]],
  ["little", "small", "Which word means about the same as little?", ["small", "huge", "tall", "wide"]],
  ["large", "big", "Which word means about the same as large?", ["big", "tiny", "short", "thin"]],
  ["quiet", "silent", "Which word means about the same as quiet?", ["silent", "loud", "busy", "bright"]],
  ["loud", "noisy", "Which word means about the same as loud?", ["noisy", "quiet", "soft", "slow"]],
  ["sad", "unhappy", "Which word means about the same as sad?", ["unhappy", "glad", "proud", "fast"]],
  ["angry", "mad", "Which word means about the same as angry?", ["mad", "kind", "calm", "cold"]],
  ["kind", "nice", "Which word means about the same as kind?", ["nice", "mean", "sad", "hard"]],
  ["quick", "fast", "Which word means about the same as quick?", ["fast", "slow", "late", "low"]],
  ["slow", "not fast", "Which phrase means the opposite of fast?", ["not fast", "very fast", "fast again", "too fast"]],
  ["high", "low", "Which word means the opposite of high?", ["low", "tall", "up", "over"]],
  ["inside", "outside", "Which word means the opposite of inside?", ["outside", "under", "near", "between"]],
  ["before", "after", "Which word means the opposite of before?", ["after", "early", "first", "again"]],
  ["many", "few", "Which word means the opposite of many?", ["few", "much", "more", "all"]],
  ["safe", "unsafe", "Which word means the opposite of safe?", ["unsafe", "careful", "soft", "clean"]],
  ["same", "different", "Which word means the opposite of same?", ["different", "matching", "equal", "plain"]],
  ["brave", "bold", "Which word means about the same as brave?", ["bold", "scared", "small", "soft"]],
  ["smart", "clever", "Which word means about the same as smart?", ["clever", "sleepy", "empty", "dark"]],
  ["pretty", "beautiful", "Which word means about the same as pretty?", ["beautiful", "dirty", "cold", "slow"]],
  ["easy", "simple", "Which word means about the same as easy?", ["simple", "hard", "heavy", "late"]],
  ["new", "old", "Which word means the opposite of new?", ["old", "fresh", "clean", "young"]],
  ["early", "late", "Which word means the opposite of early?", ["late", "first", "soon", "quick"]],
  ["empty", "blank", "Which word means about the same as empty?", ["blank", "full", "heavy", "bright"]],
  ["tiny", "small", "Which word means about the same as tiny?", ["small", "huge", "wide", "loud"]],
  ["under", "over", "Which word means the opposite of under?", ["over", "below", "inside", "near"]],
  ["front", "back", "Which word means the opposite of front?", ["back", "first", "near", "open"]],
  ["day", "night", "Which word means the opposite of day?", ["night", "light", "sun", "morning"]],
  ["push", "pull", "Which word means the opposite of push?", ["pull", "move", "hold", "lift"]],
  ["laugh", "giggle", "Which word means about the same as laugh?", ["giggle", "cry", "sleep", "whisper"]],
  ["cry", "weep", "Which word means about the same as cry?", ["weep", "smile", "run", "jump"]],
  ["calm", "peaceful", "Which word means about the same as calm?", ["peaceful", "angry", "noisy", "fast"]],
  ["rough", "smooth", "Which word means the opposite of rough?", ["smooth", "bumpy", "hard", "dark"]],
  ["strong", "weak", "Which word means the opposite of strong?", ["weak", "powerful", "big", "safe"]],
  ["true", "false", "Which word means the opposite of true?", ["false", "right", "same", "kind"]]
];

const HOMOPHONES = [
  ["see", "sea", "Which word means ocean water?", ["sea", "see", "sit", "say"]],
  ["one", "won", "Which word names the number?", ["one", "won", "once", "own"]],
  ["two", "too", "Which word names the number?", ["two", "too", "to", "top"]],
  ["hear", "here", "Which word means to listen?", ["hear", "here", "her", "help"]],
  ["night", "knight", "Which word means the dark time after sunset?", ["night", "knight", "light", "right"]],
  ["flower", "flour", "Which word names a plant part?", ["flower", "flour", "floor", "flock"]],
  ["blue", "blew", "Which word names a color?", ["blue", "blew", "black", "brown"]],
  ["dear", "deer", "Which word can start a friendly letter?", ["dear", "deer", "door", "deep"]],
  ["deer", "dear", "Which word names an animal?", ["deer", "dear", "dog", "duck"]],
  ["pair", "pear", "Which word means two things together?", ["pair", "pear", "park", "part"]],
  ["pear", "pair", "Which word names a fruit?", ["pear", "pair", "peach", "pea"]],
  ["mail", "male", "Which word means letters sent to someone?", ["mail", "male", "meal", "mill"]],
  ["tail", "tale", "Which word names the back part of an animal?", ["tail", "tale", "tall", "tell"]],
  ["tale", "tail", "Which word means a story?", ["tale", "tail", "talk", "tile"]],
  ["right", "write", "Which word means correct?", ["right", "write", "read", "ride"]],
  ["write", "right", "Which word means to make words with a pencil?", ["write", "right", "white", "wide"]],
  ["ate", "eight", "Which word means did eat?", ["ate", "eight", "at", "eat"]],
  ["eight", "ate", "Which word names a number?", ["eight", "ate", "one", "three"]],
  ["week", "weak", "Which word means seven days?", ["week", "weak", "walk", "wake"]],
  ["weak", "week", "Which word means not strong?", ["weak", "week", "wide", "wake"]],
  ["road", "rode", "Which word means a street for cars?", ["road", "rode", "read", "red"]],
  ["rode", "road", "Which word means did ride?", ["rode", "road", "read", "red"]],
  ["meet", "meat", "Which word means to see someone?", ["meet", "meat", "mat", "met"]],
  ["meat", "meet", "Which word names food?", ["meat", "meet", "meal", "mean"]],
  ["hole", "whole", "Which word means an opening?", ["hole", "whole", "home", "hold"]],
  ["whole", "hole", "Which word means all of something?", ["whole", "hole", "while", "white"]],
  ["sale", "sail", "Which word means a time when things cost less?", ["sale", "sail", "seal", "soil"]],
  ["sail", "sale", "Which word is part of a boat?", ["sail", "sale", "seal", "soil"]],
  ["wait", "weight", "Which word means stay until later?", ["wait", "weight", "wet", "went"]],
  ["weight", "wait", "Which word means how heavy something is?", ["weight", "wait", "wet", "went"]],
  ["no", "know", "Which word means not any?", ["no", "know", "now", "new"]],
  ["know", "no", "Which word means understand?", ["know", "no", "now", "new"]],
  ["by", "buy", "Which word means near?", ["by", "buy", "bye", "be"]],
  ["buy", "by", "Which word means get with money?", ["buy", "by", "bye", "boy"]],
  ["bear", "bare", "Which word means an animal?", ["bear", "bare", "beard", "bird"]],
  ["bare", "bear", "Which word means not covered?", ["bare", "bear", "bar", "barn"]],
  ["peace", "piece", "Which word means calm and no fighting?", ["peace", "piece", "place", "please"]],
  ["piece", "peace", "Which word means a part of something?", ["piece", "peace", "place", "please"]],
  ["steak", "stake", "Which word means a piece of meat?", ["steak", "stake", "stick", "stack"]],
  ["stake", "steak", "Which word means a pointed stick?", ["stake", "steak", "stack", "stick"]],
  ["stair", "stare", "Which word means a step?", ["stair", "stare", "star", "start"]],
  ["stare", "stair", "Which word means to look for a long time?", ["stare", "stair", "star", "start"]],
  ["sun", "son", "Which word names the star that gives Earth light?", ["sun", "son", "soon", "some"]],
  ["son", "sun", "Which word means a male child?", ["son", "sun", "soon", "some"]],
  ["plain", "plane", "Which word means simple or not fancy?", ["plain", "plane", "plan", "plant"]],
  ["plane", "plain", "Which word names something that flies?", ["plane", "plain", "plan", "plant"]],
  ["break", "brake", "Which word means to crack or damage something?", ["break", "brake", "brick", "back"]],
  ["brake", "break", "Which word means a part that stops a bike or car?", ["brake", "break", "brick", "back"]],
  ["threw", "through", "Which word means tossed?", ["threw", "through", "throw", "three"]],
  ["through", "threw", "Which word means from one side to the other?", ["through", "threw", "throw", "three"]],
  ["made", "maid", "Which word means created or built?", ["made", "maid", "make", "mate"]],
  ["maid", "made", "Which word can mean a person who cleans rooms?", ["maid", "made", "make", "mate"]]
];

function makeMeaningQuestions(skillId, skillName, level, needed, rows) {
  const levelRows = level === 1 ? rows : [...rows].reverse();
  return cycleRows(levelRows, needed).map(([target, answer, prompt, choices], index) => baseQuestion({
    id: `gap_${slug(skillId)}_l${level}_${slug(target)}_${index + 1}`,
    skillId,
    skillName,
    level,
    phaseTarget: `level_${level}`,
    templateType: skillId === "homophones_homonyms" ? "HOMOPHONE_MEANING" : "COMPREHENSION",
    prompt: level === 2 ? `${prompt} Use the meaning that fits best.` : prompt,
    correctAnswer: answer,
    answerOptions: choiceList(answer, choices.filter(choice => choice !== answer)),
    targetWord: target,
    itemType: skillId,
    itemKey: target,
    extra: {
      runtimeTemplateKey: `${skillId}_${level}_${slug(target)}_${slug(answer)}_${index + 1}`
    }
  }));
}

const COMPREHENSION_BANKS = {
  sentence_comprehension: [
    ["cat_sleep", "The cat sleeps on the mat.", "What is the cat doing?", "sleeping", ["sleeping", "jumping", "swimming", "reading"]],
    ["dog_run", "The dog runs in the yard.", "What is the dog doing?", "running", ["running", "drawing", "eating", "sleeping"]]
  ],
  key_details: [
    ["apple_ball", "Mia has a ball the color of an apple. She rolls it to Sam.", "What color is the ball?", "red", ["red", "blue", "green", "yellow"]],
    ["fish_home", "A big fish swims where frogs live.", "Where does the fish swim?", "pond", ["pond", "tree", "bed", "desk"]]
  ],
  sequencing: [
    ["plant_seed", "First, Ana plants a seed. Next, she adds water. Later, a sprout grows.", "What happens after Ana plants the seed?", "water the seed", ["water the seed", "eat the seed", "read the seed", "hide the seed"]],
    ["make_sandwich", "First, Ben gets bread. Next, he adds cheese. Last, he takes a bite.", "What does Ben do last?", "eat lunch", ["eat lunch", "get bread", "add cheese", "pack toys"]]
  ],
  main_idea: [
    ["park_fun", "Kids slide. Kids swing. Kids run on the grass.", "What is this mostly about?", "playing at the park", ["playing at the park", "making soup", "washing a car", "reading a map"]],
    ["pet_care", "Lena feeds the dog. She fills the water bowl. She brushes the dog.", "What is this mostly about?", "caring for a pet", ["caring for a pet", "riding a bike", "baking bread", "building a tower"]]
  ],
  inference: [
    ["rain_boots", "Noah puts on boots and takes an umbrella.", "What is probably happening outside?", "it is raining", ["it is raining", "it is snowing", "it is bedtime", "it is lunch"]],
    ["sleepy_yawn", "Ava rubs her eyes and yawns.", "How does Ava probably feel?", "tired", ["tired", "hungry", "angry", "cold"]]
  ],
  cause_effect: [
    ["spill", "The cup tipped over, so water ran across the table.", "Why did water run across the table?", "the cup fell", ["the cup fell", "the lamp turned on", "the dog barked", "the door opened"]],
    ["sun_melt", "Bright sunshine warmed the ice, so it began to melt.", "What caused the ice to melt?", "warm sunlight", ["warm sunlight", "a cold wind", "a dark room", "a soft pillow"]]
  ],
  context_clues: [
    ["chilly", "It was chilly, so Max put on a coat.", "What does chilly mean?", "cold", ["cold", "loud", "tiny", "fast"]],
    ["giggle", "The joke made Ana giggle and smile.", "What does giggle mean?", "laugh softly", ["laugh softly", "sleep deeply", "walk slowly", "eat quickly"]]
  ],
  theme_higher_comprehension: [
    ["help_friend", "Tom dropped his crayons. Lia helped him pick them up.", "What lesson fits this story?", "friends help each other", ["friends help each other", "always hide crayons", "never share", "run away quickly"]],
    ["try_again", "Nina missed the basket. She tried again and made it.", "What lesson fits this story?", "keep trying", ["keep trying", "give up", "hide the ball", "walk home"]]
  ]
};

function makeComprehensionQuestions(skillId, skillName, level, needed) {
  const rows = COMPREHENSION_BANKS[skillId] || COMPREHENSION_BANKS.sentence_comprehension;
  const names = ["Ana", "Ben", "Mia", "Sam", "Noah", "Lia", "Max", "Nina", "Omar", "Zoe", "Tess", "Ivy", "Leo", "Ruby", "Finn", "Maya", "Eli", "Ava", "Nora", "Jude"];
  const objects = ["ball", "book", "kite", "cup", "map", "seed", "shell", "drum", "box", "hat", "bag", "toy", "bike", "paint", "apple", "flower", "pencil", "paper", "snack", "leaf"];
  return Array.from({ length: needed }, (_, index) => {
    const [key, passage, question, answer, choices] = rows[index % rows.length];
    const name = names[index % names.length];
    const object = objects[index % objects.length];
    const uniquePassage = `${passage} ${name} has a ${object}.`;
    return baseQuestion({
      id: `gap_${slug(skillId)}_l${level}_${slug(key)}_${index + 1}`,
      skillId,
      skillName,
      level,
      phaseTarget: `level_${level}`,
      templateType: "COMPREHENSION",
      passage: uniquePassage,
      prompt: `${uniquePassage} ${question}`,
      correctAnswer: answer,
      answerOptions: choiceList(answer, choices.filter(choice => choice !== answer)),
      targetWord: `${key}_${name}_${object}`,
      itemType: skillId,
      itemKey: `${key}_${index + 1}`
    });
  });
}

const STORY_NAMES = [
  "Mara", "Theo", "Lena", "Isaac", "Priya", "Owen", "Sofia", "Miles", "Nora", "Jalen",
  "Ruby", "Eli", "Amara", "Finn", "Tessa", "Noah", "Ivy", "Caleb", "Mina", "Leo",
  "Grace", "Arlo", "Nina", "Mateo", "Clara", "Jonah", "Zara", "Hugo", "Maya", "Felix",
  "Rosa", "Ezra", "Lila", "Kai", "Anya", "Jude", "Molly", "Samir", "Ava", "Ben",
  "Poppy", "Oscar", "Hana", "Dylan", "Sara", "Micah"
];
const STORY_PARTNERS = [
  "Grandad", "Aunt Jo", "Mr. Patel", "Miss Green", "Cousin Maya", "Uncle Ray", "Coach Lee", "Ms. Rivera",
  "Park Ranger Kim", "Baker Tom", "Driver Noor", "Ms. Chen", "Neighbor Rosa", "Dad", "Nurse Ali",
  "Guide Elena", "Gardener Ben", "Brother Jay", "Farmer Luis", "Lifeguard Mina"
];
const STORY_SETTINGS = [
  ["forest", "forest trail", "fallen log"], ["beach", "quiet beach", "tide pool"], ["river", "river path", "wooden dock"],
  ["camp", "summer camp", "canvas tent"], ["bridge", "stone bridge", "old railing"], ["snow", "snowy hill", "sled track"],
  ["cave", "shallow cave", "rock wall"], ["bike", "bike path", "repair bench"], ["paint", "art room", "paint table"],
  ["bread", "bakery kitchen", "cooling rack"], ["path", "garden path", "rose arch"], ["squirrel", "park tree", "bench"],
  ["field", "wide field", "weather vane"], ["clock", "town square", "clock tower"], ["bucket", "school garden", "water barrel"],
  ["canoe", "lake shore", "red canoe"], ["firetruck", "fire station", "open garage"], ["basketball", "playground court", "painted line"],
  ["flowerpot", "greenhouse", "seed tray"], ["chessboard", "game club", "corner table"], ["cactus", "desert garden", "stone path"],
  ["crayon", "classroom", "supply shelf"], ["cloud", "weather station", "rain gauge"]
];
const STORY_DISCOVERIES = [
  "a blue feather", "three smooth shells", "a bent key", "a torn map corner", "a tiny paw print", "a loose red button",
  "a folded note", "a cracked tile", "a silver coin", "a muddy boot print", "a green ribbon", "a painted pebble",
  "a nest of dry grass", "a missing library card", "a basket of warm rolls", "a broken wheel", "a lantern with no oil",
  "a packet of seeds", "a striped scarf", "a whistle on a string", "a jar of rainwater", "a wooden tag", "a small brass bell"
];
const STORY_ACTIONS = [
  "made a careful note", "added the detail to a field journal", "asked an adult for help", "wrote the place in a notebook",
  "chose a safer spot nearby", "marked the place on the class map", "checked the owner tag", "sketched the detail carefully",
  "compared the find with a picture", "visited the lost-and-found table", "measured the find twice", "shared the detail with the group"
];
const STORY_OBSERVATION_ACTIONS = [
  "made a careful note about it",
  "added the detail to the project journal",
  "asked an adult what to do next",
  "marked the place on the class map",
  "sketched it on the observation sheet",
  "took a photo for the class record"
];

function sentenceStart(value = "") {
  const text = String(value || "").trim();
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

function storySetting(index) {
  return STORY_SETTINGS[index % STORY_SETTINGS.length];
}

function storyImageExtra(imageWord, index) {
  const entry = byWord(imageWord) || byWord(STORY_SETTINGS[index % STORY_SETTINGS.length][0]) || byWord("forest");
  return entry ? {
    imageUrl: entry.imagePath,
    imagePath: entry.imagePath,
    targetImage: entry.imagePath,
    targetImagePath: entry.imagePath,
    imageAlt: entry.displayWord || entry.word
  } : {};
}

function storyOptions(answer, distractors, index) {
  return choiceList(answer, rotate(distractors.filter(item => item !== answer), index), 4);
}

function buildSentenceComprehensionStory(level, index) {
  const baseId = `gap_sentence_comprehension_l${level}_story_${String(index + 1).padStart(2, "0")}`;
  const stories = [
    {
      passage: "Mia helped plant bean seeds in the school garden. The soil was dry, so she filled a small watering can. Her classmate held the seed packet while Mia watered each row. By Friday, tiny green shoots were poking through the soil.",
      question: "What did Mia fill before watering the rows?",
      answer: "a small watering can",
      choices: ["a small watering can", "a lunch box", "a red basket", "a glass jar"],
      imageWord: "bucket"
    },
    {
      passage: "Jonah walked along the beach with his aunt. They collected empty shells for a science tray. One shell had a tiny crab tucked inside it. Jonah left that shell on the sand and chose three empty shells instead.",
      question: "Why did they leave one shell on the sand?",
      answer: "a tiny crab was inside it",
      choices: ["a tiny crab was inside it", "it was too heavy to lift", "it belonged to a shop", "the shell was painted blue"],
      imageWord: "beach"
    },
    {
      passage: "Sofia borrowed a mystery book from the library. At home, a bookmark fell out from the middle pages. The bookmark had another student's name on it. The next morning, Sofia gave it to the librarian so it could be returned.",
      question: "Who did the bookmark belong to?",
      answer: "another student",
      choices: ["another student", "the librarian", "a visitor", "the bus driver"],
      imageWord: "bookcase"
    },
    {
      passage: "Arlo carried warm rolls from the bakery counter. The paper bag tore before he reached the door. Two rolls slipped onto a clean tray near the counter. Baker Tom gave Arlo a stronger bag, and Arlo carried the rolls home carefully.",
      question: "What happened before Baker Tom gave a stronger bag?",
      answer: "the first bag tore",
      choices: ["the first bag tore", "the bread burned", "the shop closed", "the tray broke"],
      imageWord: "bread"
    },
    {
      passage: "Nina rode her bike along the park path. A loose chain made the pedals stop turning. She walked the bike to a repair bench near the gate. Her dad fixed the chain with a small tool, and Nina rode slowly home.",
      question: "Why did the pedals stop turning?",
      answer: "the bike chain was loose",
      choices: ["the bike chain was loose", "the tire was purple", "the path was too short", "the bell was loud"],
      imageWord: "bike"
    },
    {
      passage: "Leo painted a picture of a red fire truck. His first brush was too wide for the ladder. Ms. Chen found a thinner brush in the art box. Leo used it to paint neat silver lines, and the ladder looked clearer.",
      question: "What did Leo use the thinner brush to paint?",
      answer: "neat silver lines",
      choices: ["neat silver lines", "green leaves", "a yellow moon", "large black wheels"],
      imageWord: "paint"
    },
    {
      passage: "Ruby watched dark clouds gather over the field. The class had planned to eat lunch outside. Miss Green heard thunder in the distance. She moved everyone into the hall before the rain began, so the lunches stayed dry.",
      question: "Where did Miss Green move the class?",
      answer: "into the hall",
      choices: ["into the hall", "onto the field", "behind the shed", "beside the road"],
      imageWord: "cloud"
    },
    {
      passage: "Eli saw a small squirrel near the park bench. It held an acorn and stayed very still. Park Ranger Kim asked the children to step back quietly. After a minute, the squirrel ran up the tree.",
      question: "What did the squirrel do after everyone stepped back?",
      answer: "ran up the tree",
      choices: ["ran up the tree", "jumped into a pond", "took a sandwich", "hid under a hat"],
      imageWord: "squirrel"
    },
    {
      passage: "Amara helped set up chairs for a class game. One chair had a cracked leg. Amara moved it away from the circle. Coach Lee brought a safe chair from the hallway, and the game began after every seat was checked.",
      question: "Why did Amara move one chair away?",
      answer: "it had a cracked leg",
      choices: ["it had a cracked leg", "it was painted red", "it was too clean", "it had a soft cushion"],
      imageWord: "chessboard"
    },
    {
      passage: "Caleb followed a river path with his walking group. A paper map showed two trails back to the car park. The shorter trail was closed because a branch had fallen across it. The group chose the longer trail and reached the car park safely.",
      question: "Why did the group take the longer trail?",
      answer: "the shorter trail was closed",
      choices: ["the shorter trail was closed", "the map was missing", "the car park moved", "the river was dry"],
      imageWord: "river"
    },
    {
      passage: "Grace helped sort crayons after art time. The blue crayons went in one cup, and the red crayons went in another. A green crayon had rolled under the table. Grace found it and put it in the green box.",
      question: "Where was the green crayon?",
      answer: "under the table",
      choices: ["under the table", "inside a shoe", "on the window", "behind the clock"],
      imageWord: "crayon"
    },
    {
      passage: "Hugo and Jay built a small tent at camp. The first pole was in the wrong sleeve. The tent leaned to one side and would not stand properly. Jay pulled the pole out and tried again, and this time the tent stood straight.",
      question: "What made the tent lean to one side?",
      answer: "a pole was in the wrong sleeve",
      choices: ["a pole was in the wrong sleeve", "the tent was full of books", "the grass was blue", "the door was zipped"],
      imageWord: "camp"
    },
    {
      passage: "Maya watched Farmer Luis feed the chickens. One small chick stayed near the fence and did not eat. Farmer Luis checked the feed bowl and found it was empty on that side. He poured in more grain, and the chick hurried over.",
      question: "What did Farmer Luis pour into the bowl?",
      answer: "more grain",
      choices: ["more grain", "cold water", "red paint", "clean sand"],
      imageWord: "chicken"
    },
    {
      passage: "Felix visited the clock tower in the town square. The big hand pointed to twelve, and the small hand pointed to three. Ms. Rivera said the class had ten minutes before the bus came. Felix sat on the bench and waited.",
      question: "What time did the clock show?",
      answer: "three o'clock",
      choices: ["three o'clock", "twelve o'clock", "ten o'clock", "six o'clock"],
      imageWord: "clock"
    },
    {
      passage: "Lila carried a basket of clean towels at the pool. A wet towel was lying beside the door. Lifeguard Mina said wet towels could make people slip. Lila picked it up and put it in the laundry bin.",
      question: "Why was the wet towel a problem?",
      answer: "people could slip on it",
      choices: ["people could slip on it", "it was too colorful", "it belonged in a book", "it made the door taller"],
      imageWord: "towel"
    },
    {
      passage: "Kai made a card for the school fair. The glue bottle was almost empty, so the paper would not stick. He asked for help at the craft table. Nurse Ali found a new bottle in the supply box, and Kai finished the card before lunch.",
      question: "What was wrong with the first glue bottle?",
      answer: "it was almost empty",
      choices: ["it was almost empty", "it was too heavy", "it was full of paint", "it was locked"],
      imageWord: "card"
    },
    {
      passage: "Rosa packed her school bag before the trip. She put her notebook, pencil, and water bottle inside. When the bus arrived, she noticed her permission slip was still on the kitchen table. Her uncle brought it to school before the class left.",
      question: "What did Rosa forget at home?",
      answer: "her permission slip",
      choices: ["her permission slip", "her water bottle", "her pencil", "her notebook"],
      imageWord: "bag"
    },
    {
      passage: "Oscar helped his grandmother make soup. He washed the carrots and placed them on the cutting board. The pot began to bubble, so his grandmother turned the heat down. Oscar stirred the soup slowly while it cooked.",
      question: "What did Oscar do after washing the carrots?",
      answer: "placed them on the cutting board",
      choices: ["placed them on the cutting board", "poured soup into a cup", "opened the front door", "washed the floor"],
      imageWord: "carrot"
    },
    {
      passage: "Hana found a library card on the playground. The name on the card was not hers. She gave it to the office before morning lessons began. At lunch, the owner came to the office and got the card back.",
      question: "Where did Hana take the library card?",
      answer: "to the office",
      choices: ["to the office", "to the garden", "to the lunch table", "to the bus stop"],
      imageWord: "card"
    },
    {
      passage: "Dylan practiced for the class concert. His music sheet kept sliding off the stand. He used a small clip to hold the page in place. When the song began, Dylan could read every line.",
      question: "Why did Dylan use a clip?",
      answer: "to hold the music page in place",
      choices: ["to hold the music page in place", "to open a lunch bag", "to fix a shoe", "to mark a race track"],
      imageWord: "music"
    },
    {
      passage: "Sara saw puddles on the sidewalk after the rain. She stepped around the largest puddle to keep her socks dry. A younger child started to run through the same spot. Sara pointed to a dry path beside the fence.",
      question: "Why did Sara step around the largest puddle?",
      answer: "to keep her socks dry",
      choices: ["to keep her socks dry", "to find a lost toy", "to count the fence posts", "to pick a flower"],
      imageWord: "rain"
    },
    {
      passage: "Micah helped carry boxes into the classroom. One box rattled when he lifted it. He set it down gently and told the teacher. The teacher opened the box and found glass jars wrapped in paper.",
      question: "Why did Micah set the rattling box down gently?",
      answer: "it had glass jars inside",
      choices: ["it had glass jars inside", "it was full of pillows", "it was empty", "it had a sandwich inside"],
      imageWord: "box"
    },
    {
      passage: "Tessa visited the animal shelter with her class. A small dog stayed at the back of its pen. The worker spoke softly and held out a treat. After a moment, the dog walked closer and wagged its tail.",
      question: "What helped the dog walk closer?",
      answer: "the worker spoke softly and offered a treat",
      choices: ["the worker spoke softly and offered a treat", "the class shouted loudly", "the door slammed shut", "the room became dark"],
      imageWord: "dog"
    },
    {
      passage: "Noah cleaned his desk after math. He found three pencils, a ruler, and a folded note. The note reminded him to return a book to the library. Noah put the book in his bag before recess.",
      question: "What did the note remind Noah to do?",
      answer: "return a book to the library",
      choices: ["return a book to the library", "feed the class fish", "paint a picture", "bring a coat"],
      imageWord: "book"
    },
    {
      passage: "Ivy helped her dad wash the car. She sprayed water on the wheels first because they were muddy. Then she used a sponge on the doors. When the car dried, the wheels looked clean again.",
      question: "Which part of the car did Ivy wash first?",
      answer: "the wheels",
      choices: ["the wheels", "the windows", "the seats", "the roof"],
      imageWord: "car"
    },
    {
      passage: "Ben made a paper boat during craft time. He folded the corners carefully, but one side opened up. His friend showed him how to press the crease harder. Ben fixed the fold and floated the boat in a tub of water.",
      question: "How did Ben fix the paper boat?",
      answer: "he pressed the crease harder",
      choices: ["he pressed the crease harder", "he painted it red", "he cut it in half", "he put it in his pocket"],
      imageWord: "boat"
    },
    {
      passage: "Poppy went to the market with her mother. They needed apples for a pie. The first bag had a bruised apple on top, so Poppy chose a different bag. At home, every apple in the second bag was firm.",
      question: "Why did Poppy choose a different bag?",
      answer: "the first bag had a bruised apple",
      choices: ["the first bag had a bruised apple", "the pie was already baked", "the market was closed", "the apples were too loud"],
      imageWord: "apple"
    },
    {
      passage: "Samir watched a worker repair the school gate. The gate squeaked every time someone opened it. The worker added oil to the hinge and moved the gate back and forth. After that, the gate opened quietly.",
      question: "What made the gate open quietly?",
      answer: "oil on the hinge",
      choices: ["oil on the hinge", "paint on the wall", "a new lunch bell", "water in a cup"],
      imageWord: "gate"
    },
    {
      passage: "Ava helped decorate the classroom window. She cut stars from yellow paper and taped them around the edges. One star fell because the tape was too small. Ava used a longer piece of tape, and the star stayed up.",
      question: "Why did one star fall?",
      answer: "the tape was too small",
      choices: ["the tape was too small", "the paper was yellow", "the window was open", "the stars were counted"],
      imageWord: "star"
    },
    {
      passage: "Molly read a recipe for banana muffins. The recipe said to mash two bananas before adding the flour. Molly mashed the bananas with a fork. Then she poured in the flour and mixed the batter.",
      question: "What did Molly do before adding the flour?",
      answer: "mashed two bananas",
      choices: ["mashed two bananas", "washed the dishes", "opened a window", "cut paper stars"],
      imageWord: "banana"
    },
    {
      passage: "Ezra built a tower with wooden blocks. The tower fell each time he put a large block on top. He tried again with the largest blocks at the bottom. This time the tower stood until cleanup.",
      question: "What helped the tower stand?",
      answer: "putting the largest blocks at the bottom",
      choices: ["putting the largest blocks at the bottom", "using fewer colors", "building near the sink", "closing the classroom door"],
      imageWord: "blocks"
    },
    {
      passage: "Clara watered the classroom plant on Monday. By Wednesday, the leaves drooped and the soil felt dry. Clara told the teacher instead of adding too much water at once. The teacher showed her how to give the plant a small drink.",
      question: "What did Clara notice about the plant?",
      answer: "the leaves drooped and the soil was dry",
      choices: ["the leaves drooped and the soil was dry", "the pot was full of toys", "the flowers were made of paper", "the plant had no leaves at all"],
      imageWord: "flowerpot"
    },
    {
      passage: "Jude helped his team find a missing soccer ball. They checked behind the goal and under the bench. Jude heard a soft thump inside the storage shed. The ball had rolled through the open shed door.",
      question: "Where was the missing soccer ball?",
      answer: "inside the storage shed",
      choices: ["inside the storage shed", "under a lunch tray", "on the bus", "beside the library desk"],
      imageWord: "ball"
    },
    {
      passage: "Anya carried a tray of seedlings to the greenhouse. A cold wind blew when the door opened. She waited until the wind stopped before setting the tray down. None of the small plants tipped over.",
      question: "Why did Anya wait before setting down the tray?",
      answer: "a cold wind was blowing",
      choices: ["a cold wind was blowing", "the tray was empty", "the floor was covered in paint", "the plants were made of glass"],
      imageWord: "flowerpot"
    },
    {
      passage: "Jalen helped clean the lunch tables. He sprayed the first table and wiped it with a blue cloth. A sticky spot was still there, so he wiped it again. When the spot was gone, he moved to the next table.",
      question: "What did Jalen do when the sticky spot stayed on the table?",
      answer: "wiped it again",
      choices: ["wiped it again", "sat on the table", "closed the lunchroom", "hid the cloth"],
      imageWord: "table"
    },
    {
      passage: "Nora took care of the class calendar. She crossed off Monday and circled Friday because the class trip was on Friday. Several students asked how many days were left. Nora counted Tuesday, Wednesday, and Thursday.",
      question: "Which day did Nora circle on the calendar?",
      answer: "Friday",
      choices: ["Friday", "Monday", "Tuesday", "Sunday"],
      imageWord: "calendar"
    },
    {
      passage: "Theo helped Jay build a bird feeder. They filled it with seeds and hung it from a low branch. A gust of wind swung the feeder sideways. Theo tied the string tighter so the feeder would not fall.",
      question: "Why did Theo tie the string tighter?",
      answer: "the feeder swung sideways in the wind",
      choices: ["the feeder swung sideways in the wind", "the seeds were too small", "the branch was painted", "the birds were reading"],
      imageWord: "bird"
    },
    {
      passage: "Mara helped set out cups for the school picnic. She counted twenty students but placed only eighteen cups. Her friend noticed the mistake before lunch began. Mara added two more cups to the table.",
      question: "How many cups did Mara add?",
      answer: "two",
      choices: ["two", "three", "eight", "twenty"],
      imageWord: "cup"
    },
    {
      passage: "Owen cleaned his paintbrush at the sink. Blue paint stayed near the metal band of the brush. He rinsed it again and gently squeezed the bristles with a paper towel. The brush was clean before he put it away.",
      question: "What color paint stayed on Owen's brush?",
      answer: "blue",
      choices: ["blue", "green", "yellow", "black"],
      imageWord: "paint"
    },
    {
      passage: "Sienna visited the fire station with her class. A firefighter showed them a heavy jacket and helmet. Sienna tried to lift the jacket with both hands. She was surprised because it weighed more than her school bag.",
      question: "What surprised Sienna about the jacket?",
      answer: "it was very heavy",
      choices: ["it was very heavy", "it was made of paper", "it had no sleeves", "it was kept in a lunch box"],
      imageWord: "firetruck"
    },
    {
      passage: "Miles helped his grandad rake leaves. The wind blew leaves back across the path. Grandad held the bag open while Miles pushed the leaves inside. They tied the bag before the wind could scatter them again.",
      question: "Who held the bag open?",
      answer: "Grandad",
      choices: ["Grandad", "Miles", "the teacher", "the bus driver"],
      imageWord: "leaf"
    },
    {
      passage: "Priya made a poster about sea turtles. She wrote the title at the top in large letters. Then she added a drawing of a turtle crawling toward the water. Her teacher asked her to label the beach and the ocean.",
      question: "What did Priya draw on the poster?",
      answer: "a turtle crawling toward the water",
      choices: ["a turtle crawling toward the water", "a bike beside a gate", "a bowl of soup", "a chair with a cracked leg"],
      imageWord: "turtle"
    },
    {
      passage: "Lucas helped unpack groceries. The eggs were in a carton at the top of the bag. Lucas lifted them out first so they would not crack. Then he put the heavier cans on the shelf.",
      question: "Why did Lucas lift out the eggs first?",
      answer: "so they would not crack",
      choices: ["so they would not crack", "so the cans would freeze", "so the shelf would move", "so the bag would turn blue"],
      imageWord: "egg"
    },
    {
      passage: "Zara listened to the morning announcements. The principal said the playground was closed until the ice melted. Zara put her ball back in her cubby. At recess, her class played board games inside.",
      question: "Why did Zara put her ball away?",
      answer: "the playground was closed",
      choices: ["the playground was closed", "the ball was missing", "the classroom was too dark", "the principal needed a pencil"],
      imageWord: "ball"
    },
    {
      passage: "Finn helped his neighbor carry books to a little free library. The shelf was almost full. Finn placed the small books upright and stacked the large books on the bottom. Then there was room for the whole pile.",
      question: "Where did Finn put the large books?",
      answer: "on the bottom",
      choices: ["on the bottom", "in his lunch box", "under the rug", "beside the sink"],
      imageWord: "book"
    },
    {
      passage: "Olive watched Noah pack a picnic basket. Noah put sandwiches in first and fruit on top. Olive added napkins beside the plates. When they reached the park, the sandwiches were not squashed.",
      question: "What did Olive add to the basket?",
      answer: "napkins",
      choices: ["napkins", "paintbrushes", "library cards", "wet towels"],
      imageWord: "basket"
    },
    {
      passage: "Max found a tear in his raincoat before school. His mother put a patch over the small hole. At recess, rain fell hard on the playground. Max stayed dry because the patch covered the tear.",
      question: "Why did Max stay dry at recess?",
      answer: "the patch covered the tear",
      choices: ["the patch covered the tear", "the rain stopped forever", "his shoes were new", "the playground was inside"],
      imageWord: "raincoat"
    },
    {
      passage: "Lena helped measure a sunflower in the school garden. The plant was taller than the ruler. She marked the ruler's height with a piece of string and measured again. The class learned the sunflower was two rulers tall.",
      question: "What did Lena use to mark the ruler's height?",
      answer: "a piece of string",
      choices: ["a piece of string", "a wet towel", "a library card", "a soup spoon"],
      imageWord: "flower"
    },
    {
      passage: "Adam fed the class fish before the bell. He checked the chart and saw that the fish needed only one pinch of food. A friend wanted to add more, but Adam pointed to the chart. The fish ate the right amount.",
      question: "How did Adam know how much food to give?",
      answer: "he checked the chart",
      choices: ["he checked the chart", "he guessed without looking", "he asked the fish", "he counted the chairs"],
      imageWord: "fish"
    },
    {
      passage: "Ella helped her team build a marble run. The marble stopped at a flat piece of track. Ella lifted one end to make a gentle slope. The marble rolled all the way to the cup.",
      question: "What change helped the marble roll?",
      answer: "Ella made a gentle slope",
      choices: ["Ella made a gentle slope", "Ella hid the cup", "Ella painted the marble", "Ella closed the box"],
      imageWord: "cup"
    },
    {
      passage: "Remy brought a plant to the classroom window. The label said the plant needed sunlight. He placed it on the sunny sill instead of the dark shelf. By the end of the week, new leaves had opened.",
      question: "Where did Remy place the plant?",
      answer: "on the sunny sill",
      choices: ["on the sunny sill", "inside a backpack", "under a blanket", "behind the door"],
      imageWord: "flowerpot"
    },
    {
      passage: "Keira helped her little cousin zip a coat. The zipper stuck halfway up. Keira pulled the cloth away from the teeth and tried again slowly. This time the zipper closed without catching.",
      question: "Why was the zipper stuck?",
      answer: "cloth was caught in the teeth",
      choices: ["cloth was caught in the teeth", "the coat was wet paint", "the cousin lost a shoe", "the zipper was on a book"],
      imageWord: "coat"
    },
    {
      passage: "Ryan set the timer for silent reading. He meant to set it for ten minutes, but it rang after one minute. Ryan checked the screen and fixed the number. The class read quietly until the timer rang again.",
      question: "What mistake did Ryan make with the timer?",
      answer: "he set it for one minute",
      choices: ["he set it for one minute", "he left it outside", "he painted it green", "he put it in the sink"],
      imageWord: "clock"
    },
    {
      passage: "Isla helped wash strawberries for snack. She put them in a bowl and rinsed them under cool water. One strawberry had a soft brown spot, so Isla set it aside. The rest went into cups for the class.",
      question: "Why did Isla set one strawberry aside?",
      answer: "it had a soft brown spot",
      choices: ["it had a soft brown spot", "it was shaped like a cup", "it was too loud", "it had a ribbon"],
      imageWord: "strawberry"
    },
    {
      passage: "Ethan carried the class flag during sports day. The wind blew the flag around his face. He lowered the pole until the gust passed. Then he lifted the flag again and led the class to the field.",
      question: "Why did Ethan lower the flag pole?",
      answer: "wind blew the flag around his face",
      choices: ["wind blew the flag around his face", "the field was closed", "the class had finished lunch", "the flag was made of stone"],
      imageWord: "flag"
    },
    {
      passage: "Layla helped choose books for a reading basket. She picked one funny book, one animal book, and one book about space. The basket was for students who finished work early. Layla put the basket beside the reading rug.",
      question: "Who was the reading basket for?",
      answer: "students who finished work early",
      choices: ["students who finished work early", "drivers at the bus stop", "people buying apples", "players on a soccer field"],
      imageWord: "book"
    },
    {
      passage: "Cole heard a tapping sound near the window. A tree branch was touching the glass each time the wind blew. His teacher moved the class reading spot away from the window. Later, the caretaker trimmed the branch.",
      question: "What made the tapping sound?",
      answer: "a tree branch touching the glass",
      choices: ["a tree branch touching the glass", "a pencil in a drawer", "a bell in a basket", "a dog under the table"],
      imageWord: "tree"
    },
    {
      passage: "Mina helped arrange flowers for the front desk. The tall flowers tipped over in the short jar. She chose a taller vase and added water to the bottom. The flowers stood straight when the office opened.",
      question: "Why did Mina choose a taller vase?",
      answer: "the tall flowers tipped over in the short jar",
      choices: ["the tall flowers tipped over in the short jar", "the desk was outside", "the water was too loud", "the office was closed forever"],
      imageWord: "flower"
    },
    {
      passage: "Omar found mud on the hallway floor. He saw wet footprints leading from the playground door. Omar told the custodian before anyone slipped. The custodian placed a caution sign and mopped the floor.",
      question: "Why did Omar tell the custodian?",
      answer: "mud on the floor could make someone slip",
      choices: ["mud on the floor could make someone slip", "the playground door was painted", "the hallway had a clock", "the footprints were in a book"],
      imageWord: "mud"
    },
    {
      passage: "Talia practiced spelling words with magnetic letters. She spelled train but forgot the letter r. Her partner read the word aloud as tain. Talia added the missing r and read train correctly.",
      question: "Which letter did Talia forget?",
      answer: "r",
      choices: ["r", "m", "s", "o"],
      imageWord: "train"
    },
    {
      passage: "Henry helped his class check the weather chart. The morning was sunny, but dark clouds came after lunch. Henry moved the marker from sunny to cloudy. The class decided to take jackets to recess.",
      question: "Why did Henry move the weather marker?",
      answer: "dark clouds came after lunch",
      choices: ["dark clouds came after lunch", "the chart was missing", "the jackets were wet", "the class had no recess"],
      imageWord: "cloud"
    },
    {
      passage: "Nadia brought a folder to the office. The top paper had the principal's name on it. She handed the folder to the secretary instead of leaving it on a chair. The secretary placed it safely on the principal's desk.",
      question: "Who did Nadia give the folder to?",
      answer: "the secretary",
      choices: ["the secretary", "the bus driver", "the art teacher", "the lunch helper"],
      imageWord: "folder"
    }
  ];

  const levelTwoDetails = [
    "The class used the important details to explain the answer.",
    "The teacher asked everyone to point to the clue that proved the answer.",
    "Students talked about why the final action made sense.",
    "The group explained how the problem changed from the beginning to the end.",
    "The class compared two details before choosing the best answer.",
    "Everyone checked the story again to make sure the answer fit."
  ];
  const story = { ...stories[index % stories.length] };
  if (level === 2) {
    story.passage = `${story.passage} ${levelTwoDetails[index % levelTwoDetails.length]}`;
  }
  return {
    id: baseId,
    ...story,
    choices: storyOptions(story.answer, story.choices, index)
  };
}

function buildHigherStoryQuestion(skillId, skillName, level, index) {
  const name = STORY_NAMES[(index + level * 5) % STORY_NAMES.length];
  const partner = STORY_PARTNERS[(index * 2 + level) % STORY_PARTNERS.length];
  const [imageWord, setting, landmark] = storySetting(index + level * 7 + skillId.length);
  const discovery = STORY_DISCOVERIES[(index * 3 + level) % STORY_DISCOVERIES.length];
  const action = STORY_ACTIONS[(index * 5 + level) % STORY_ACTIONS.length];
  const partnerStart = sentenceStart(partner);
  const extraSentence = level === 2
    ? `Later, ${partnerStart} asked ${name} to explain the choice, so ${name} used details from the whole trip.`
    : `Later, ${name} told the class about it.`;
  const baseId = `gap_${slug(skillId)}_l${level}_story_${String(index + 1).padStart(2, "0")}`;

  if (skillId === "sentence_comprehension") {
    return buildSentenceComprehensionStory(level, index);
  }

  if (skillId === "key_details") {
    const number = (index % 6) + 3;
    const container = ["blue basket", "wooden tray", "green box", "canvas bag", "small cart", "wide bucket"][index % 6];
    const passage = `${name} helped ${partner} at the ${setting}. They counted ${number} items and placed them in a ${container}. One item had to stay beside the ${landmark} because it was still wet. Before leaving, ${name} checked the list again. ${extraSentence}`;
    const question = `Where did they place the ${number} items?`;
    return { id: baseId, passage, question, answer: `in a ${container}`, choices: storyOptions(`in a ${container}`, ["on a shelf", "under a chair", "inside a jar", "beside the gate", "near the river", "in a red wagon"], index), imageWord };
  }

  if (skillId === "sequencing") {
    const first = ["read the sign", "filled the bucket", "checked the map", "opened the kit", "put on gloves", "called the team"][index % 6];
    const second = ["marked the safe path", "watered the smallest plants", "sorted the tools", "tied the loose rope", "brushed dirt from the label", "packed the snacks"][index % 6];
    const third = ["walked back to the meeting place", "wrote the result on the board", "shared the news with the group", "closed the gate", "returned the key", "took one final photograph"][index % 6];
    const passage = `${name} met ${partner} at the ${setting}. First, ${name} ${first}. After that, ${name} ${second} beside the ${landmark}. When the job was finished, ${name} ${third}. ${extraSentence}`;
    const question = `What did ${name} do after ${name} ${first}?`;
    return { id: baseId, passage, question, answer: second, choices: storyOptions(second, [first, third, "went home without helping", "hid the tools", "forgot the plan", "locked the door"], index), imageWord };
  }

  if (skillId === "main_idea") {
    const topic = ["solving a small problem", "getting ready for a community event", "taking care of a special place", "learning how a tool works", "helping a visitor feel welcome", "preparing safely before an activity"][index % 6];
    const passage = `${name} and ${partner} spent the morning at the ${setting}. They checked the ${landmark}, gathered supplies, and made sure everyone knew the plan. When a small problem came up, they talked it through instead of rushing. By the end, the whole group understood what to do next. ${extraSentence}`;
    const question = "What is the passage mostly about?";
    return { id: baseId, passage, question, answer: topic, choices: storyOptions(topic, ["losing a favorite toy", "arguing about a game", "buying food for dinner", "watching a race", "taking a long nap", "drawing a funny picture"], index), imageWord };
  }

  if (skillId === "inference") {
    const feeling = ["proud", "worried", "relieved", "curious", "disappointed", "confident"][index % 6];
    const clue = {
      proud: "stood taller and smiled when the group thanked them",
      worried: "kept checking the sky and held the notebook tightly",
      relieved: "let out a long breath when the missing item was found",
      curious: "asked three more questions and leaned closer to see",
      disappointed: "looked down when the plan had to change",
      confident: "explained the next step without needing help"
    }[feeling];
    const passage = `${name} arrived at the ${setting} with ${partner}. The plan changed when they reached the ${landmark}. ${name} ${clue}. Instead of leaving, ${name} listened carefully and chose what to do next. ${extraSentence}`;
    const question = `How did ${name} probably feel?`;
    return { id: baseId, passage, question, answer: feeling, choices: storyOptions(feeling, ["angry", "sleepy", "hungry", "jealous", "bored", "silly"], index), imageWord };
  }

  if (skillId === "cause_effect") {
    const cause = ["the wind knocked over the sign", "the bucket had a small crack", "the path was covered with ice", "the lantern battery was weak", "the gate latch was loose", "rain filled the low part of the trail"][index % 6];
    const effect = ["the group had to choose a different route", "water dripped across the floor", "everyone walked slowly and held the rail", "the corner of the room stayed dim", "the gate swung open again", "the children moved the picnic uphill"][index % 6];
    const passage = `${name} joined ${partner} at the ${setting}. Everything seemed ready until ${cause}. Because of that, ${effect}. ${name} helped fix the problem before anyone continued. ${extraSentence}`;
    const question = "What caused this problem?";
    return { id: baseId, passage, question, answer: cause, choices: storyOptions(cause, ["the lunch was packed early", "the team sang a song", "the clock was painted blue", "the notebook had a sticker", "the chairs were stacked neatly", "the window was clean"], index), imageWord };
  }

  if (skillId === "context_clues") {
    const rows = [
      ["fragile", "easily broken", "glass ornament", "wrapped it in cloth and carried it with both hands"],
      ["drenched", "very wet", "raincoat", "dripped water onto the floor"],
      ["cautious", "careful", "new bridge plank", "tested it before stepping forward"],
      ["scarce", "hard to find", "dry firewood", "found only two small sticks in the whole box"],
      ["gleaming", "shining brightly", "silver badge", "caught the sunlight and flashed like glass"],
      ["sturdy", "strong", "wooden crate", "held the heavy basket without bending"]
    ];
    const [word, meaning, object, clue] = rows[index % rows.length];
    const passage = `${name} found a ${object} at the ${setting}. ${partnerStart} said the ${object} was ${word}. ${name} knew that because ${partnerStart} ${clue}. They handled it in the safest way they could. ${extraSentence}`;
    const question = `What does ${word} mean in the passage?`;
    return { id: baseId, passage, question, answer: meaning, choices: storyOptions(meaning, ["very loud", "not important", "easy to hide", "full of color", "moving quickly", "made of paper"], index), imageWord };
  }

  const lesson = ["think before acting", "ask for help when a job is too hard", "small choices can keep people safe", "practice helps you improve", "kindness can solve a problem", "be honest when something goes wrong"][index % 6];
  const mistake = ["rushed ahead without reading the sign", "tried to carry too much at once", "ignored the loose rope", "gave up after the first try", "kept the useful clue secret", "hid a mistake instead of explaining it"][index % 6];
  const repair = ["stopped, looked again, and made a safer plan", "shared the load with a friend", "asked an adult to tie it properly", "tried a slower method and succeeded", "told the group what had been found", "told the truth and helped fix it"][index % 6];
  const passage = `${name} went to the ${setting} with ${partner}. At first, ${name} ${mistake}. The problem grew near the ${landmark}, and the group had to pause. Then ${name} ${repair}. ${extraSentence}`;
  const question = "What lesson best fits this story?";
  return { id: baseId, passage, question, answer: lesson, choices: storyOptions(lesson, ["always work alone", "never change a plan", "hide problems from others", "winning matters most", "quiet places are boring", "tools are not useful"], index), imageWord };
}

function makeHigherQualityComprehensionQuestions(skillId, skillName, level, needed) {
  return Array.from({ length: needed }, (_, index) => {
    const story = buildHigherStoryQuestion(skillId, skillName, level, index);
    return baseQuestion({
      id: story.id,
      skillId,
      skillName,
      level,
      phaseTarget: `level_${level}`,
      templateType: "COMPREHENSION",
      prompt: story.question,
      correctAnswer: story.answer,
      answerOptions: story.choices,
      targetWord: `${skillId}_${level}_${index + 1}`,
      itemType: skillId,
      itemKey: `${skillId}_${level}_${index + 1}`,
      extra: {
        passage: story.passage,
        question: story.question,
        spokenPrompt: story.question,
        contextImageWord: story.imageWord,
        ...storyImageExtra(story.imageWord, index)
      }
    });
  });
}

function generateFor(skillId, skillName, level, needed) {
  if (needed <= 0) return [];
  if (skillId === "initial_sounds") return makeInitialQuestions(level, needed);
  if (skillId === "rhyming") return makeRhymingQuestions(level, needed);
  if (skillId === "cvc_short_vowels") return makeShortVowelQuestions(skillId, skillName, level, needed);
  if (skillId === "short_vowel_discrimination") return makeShortVowelQuestions(skillId, skillName, level, needed);
  if (skillId === "digraphs") return makeDigraphQuestions(level, needed);
  if (skillId === "long_vowels_silent_e") return makeLongVowelQuestions(level, needed);
  if (skillId === "vowel_teams") return makeVowelTeamQuestions(level, needed);
  if (skillId === "r_controlled_vowels") return makeRControlledQuestions(level, needed);
  if (skillId.startsWith("hfw_")) return makeHfwQuestions(skillId, skillName, level, needed);
  if (["nouns", "verbs", "adjectives", "prepositions_of_place"].includes(skillId)) return makeVocabularyGrammarQuestions(skillId, skillName, level, needed);
  if (skillId === "plurals") return makePluralQuestions(skillName, level, needed);
  if (skillId === "prefixes_suffixes") return makeMorphemeQuestions(skillName, level, needed);
  if (skillId === "antonyms_synonyms") return makeMeaningQuestions(skillId, skillName, level, needed, ANTONYM_SYNONYM);
  if (skillId === "homophones_homonyms") return makeMeaningQuestions(skillId, skillName, level, needed, HOMOPHONES);
  if (HIGHER_COMPREHENSION_SKILLS.has(skillId)) return makeHigherQualityComprehensionQuestions(skillId, skillName, level, needed);
  return makeComprehensionQuestions(skillId, skillName, level, needed);
}

function neededForLevel(levelAudit, skillId = "") {
  if (REPLACED_LEGACY_SKILLS.has(skillId)) return REPLACEMENT_QUESTION_COUNT;
  if (!levelAudit.designed || levelAudit.passesDepth) return 0;
  if (levelAudit.runtimeSafeQuestionCount === 0) return SKILL_LEVEL_DEPTH_TARGETS.minimumPerLevel + 8;
  if (levelAudit.missingCount > 0) return levelAudit.missingCount + 8;
  return SKILL_LEVEL_DEPTH_TARGETS.phaseBufferSize || 23;
}

function main() {
  const audit = auditSkillLevelDepth({ excludeSources: ["skillLevelGapQuestions"] });
  const generated = [];
  const summary = [];
  const seenIds = new Set();

  for (const skill of audit) {
    const config = managedAssessmentSkillDepthById[skill.skillId];
    for (const levelNumber of [1, 2]) {
      const levelAudit = skill.levels[levelNumber];
      const levelConfig = config?.levels[levelNumber];
      if (!levelConfig?.designed) continue;
      const needed = neededForLevel(levelAudit, skill.skillId);
      if (!needed) continue;
      const questions = generateFor(skill.skillId, skill.skillName, levelNumber, needed)
        .filter(question => question && !seenIds.has(question.id));
      questions.forEach(question => seenIds.add(question.id));
      generated.push(...questions);
      summary.push({
        skillId: skill.skillId,
        skillName: skill.skillName,
        level: levelNumber,
        startingCount: levelAudit.runtimeSafeQuestionCount,
        generated: questions.length,
        requested: needed
      });
    }
  }

  ensureDir(path.dirname(generatedPath));
  const phasedGenerated = withGeneratedPhaseMetadata(generated);
  const file = [
    "// Generated by tools/generateSkillLevelGapQuestions.js. Do not edit by hand.",
    "",
    `export const skillLevelGapQuestions = ${JSON.stringify(phasedGenerated, null, 2)};`,
    ""
  ].join("\n");
  fs.writeFileSync(generatedPath, file);

  ensureDir(docsValidationDir);
  fs.writeFileSync(manifestPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: GENERATED_SOURCE,
    totalQuestions: phasedGenerated.length,
    summary
  }, null, 2));

  const rows = summary.map(item =>
    `| ${item.skillName} | ${item.level} | ${item.startingCount} | ${item.requested} | ${item.generated} |`
  ).join("\n");
  fs.writeFileSync(markdownPath, `# Skill Level Gap Question Generation\n\nGenerated: ${new Date().toISOString()}\n\nGenerated questions: ${phasedGenerated.length}\n\n| Skill | Level | Starting Count | Requested | Generated |\n|---|---:|---:|---:|---:|\n${rows || "| None | - | - | - | - |"}\n`);

  console.log(`Generated ${generated.length} skill-level gap questions.`);
}

main();
