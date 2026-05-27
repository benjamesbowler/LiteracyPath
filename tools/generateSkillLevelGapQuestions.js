import fs from "node:fs";
import path from "node:path";

import { APPROVED_SIGHT_WORDS } from "../src/data/skillTemplateRouting.js";
import { kimiVocabulary500Lexicon } from "../src/data/kimiVocabulary500Lexicon.js";
import {
  finalSoundExpectedItemKeys,
  rhymingLevelTwoExpectedItemKeys
} from "../src/data/coverageExpectations.js";
import { getRhymeGroup } from "../src/data/rhymeGroups.js";
import {
  SKILL_LEVEL_DEPTH_TARGETS,
  managedAssessmentSkillDepthById
} from "../src/data/skillLevelDepthConfig.js";
import {
  auditSkillLevelDepth,
  docsValidationDir,
  ensureDir
} from "./skillLevelDepthShared.js";
import { publicPathExists, repoRoot } from "./phonicsRuntimeUtils.js";

const generatedPath = path.join(repoRoot, "src", "data", "generated", "skillLevelGapQuestions.generated.js");
const manifestPath = path.join(docsValidationDir, "skill_level_gap_questions_generation.json");
const markdownPath = path.join(docsValidationDir, "skill_level_gap_questions_generation.md");
const GENERATED_SOURCE = "skill_level_depth_gap_generator";
const SHORT_VOWEL_LABELS = ["short_a", "short_e", "short_i", "short_o", "short_u"];
const SINGLE_LETTER_SOUNDS = "abcdefghijklmnopqrstuvwxyz".split("");
const BASIC_FINAL_SOUNDS = finalSoundExpectedItemKeys;

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

function hasMedia(entry) {
  return entry?.status === "approved" && publicPathExists(entry.imagePath) && publicPathExists(entry.audioPath);
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
  const pool = entriesFor(entry =>
    entry.isConcrete &&
    entry.isImageable &&
    entry.phonics?.shortVowel &&
    (level === 1 ? entry.phonics?.cvc : true) &&
    (skillId === "cvc_short_vowels" ? entry.skills?.cvcShortVowels?.eligible : true)
  );
  return pool.slice(0, needed).map((entry, index) => {
    const itemKey = entry.phonics.shortVowel;
    const vowel = itemKey.replace("short_", "");
    const templateType = index % 2 === 0 ? "LISTEN_CHOOSE_VOWEL" : "SHORT_VOWEL_WORD";
    return mediaQuestion({
      id: `gap_${slug(skillId)}_l${level}_${slug(entry.word)}_${index + 1}`,
      skillId,
      skillName,
      level,
      phaseTarget: `level_${level}`,
      templateType,
      prompt: "Listen to the word. Which short vowel sound do you hear?",
      correctAnswer: vowel,
      answerOptions: ["a", "e", "i", "o", "u"],
      itemType: "short_vowel",
      itemKey
    }, entry, {
      targetVowel: vowel,
      shortVowel: itemKey,
      phonicsPattern: itemKey,
      explanation: `${entry.displayWord} has the ${itemKey.replace("_", " ")} sound.`
    });
  });
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
    templateType: "DECODING",
    skillKey: "vowelTeams",
    patternGetter: entry => entry.phonics?.vowelTeam || "",
    patterns: level === 1 ? ["ai", "ay", "ee", "ea", "oa"] : null,
    prompt: "Which vowel team is in this word?"
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
  hfw_26_50: ["he", "she", "they", "was", "with", "for", "all", "are", "but", "under", "then", "that", "have", "from", "this", "what", "were", "when", "where", "went", "came", "will", "into", "just", "now"],
  hfw_51_100: ["after", "again", "any", "around", "ask", "away", "be", "before", "by", "cold", "come", "could", "down", "every", "find", "fly", "found", "funny", "give", "going", "has", "help", "helps", "her", "here", "him", "his", "how", "know", "let", "like", "little", "live", "look", "made", "make", "may", "me", "must", "new", "not", "old", "once", "open", "our", "out", "over", "play", "please", "pretty", "put", "read"]
};

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
      "among", "opposite"
    ];
    return spatial.slice(0, Math.max(needed, 20)).map((answer, index) => {
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
  ["men", "man"], ["women", "woman"], ["people", "person"], ["oxen", "ox"]
];

function makePluralQuestions(skillName, level, needed) {
  return PLURALS.slice(0, needed).map(([plural, singular], index) => baseQuestion({
    id: `gap_plurals_l${level}_${slug(plural)}_${index + 1}`,
    skillId: "plurals",
    skillName,
    level,
    phaseTarget: `level_${level}`,
    templateType: "PLURAL_SPELLING_CONTEXT",
    prompt: `Which word means more than one ${singular}?`,
    correctAnswer: plural,
    answerOptions: choiceList(plural, [singular, `${singular}s`, `${singular}es`, `${singular}ies`]),
    targetWord: plural,
    itemType: "plural",
    itemKey: singular
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
  ["fearfully", "in a fearful way", ["in a fearful way", "without fear", "fear again", "not fear"]]
];

function makeMorphemeQuestions(skillName, level, needed) {
  return cycleRows(MORPHEMES, needed).map(([word, answer, choices], index) => baseQuestion({
    id: `gap_prefixes_suffixes_l${level}_${slug(word)}_${index + 1}`,
    skillId: "prefixes_suffixes",
    skillName,
    level,
    phaseTarget: `level_${level}`,
    templateType: "MORPHEME_MEANING_CONTEXT",
    prompt: `What does ${word} mean?`,
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
  ["easy", "simple", "Which word means about the same as easy?", ["simple", "hard", "heavy", "late"]]
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
  ["stare", "stair", "Which word means to look for a long time?", ["stare", "stair", "star", "start"]]
];

function makeMeaningQuestions(skillId, skillName, level, needed, rows) {
  return cycleRows(rows, needed).map(([target, answer, prompt, choices], index) => baseQuestion({
    id: `gap_${slug(skillId)}_l${level}_${slug(target)}_${index + 1}`,
    skillId,
    skillName,
    level,
    phaseTarget: `level_${level}`,
    templateType: skillId === "homophones_homonyms" ? "HOMOPHONE_MEANING" : "COMPREHENSION",
    prompt,
    correctAnswer: answer,
    answerOptions: choiceList(answer, choices.filter(choice => choice !== answer)),
    targetWord: target,
    itemType: skillId,
    itemKey: target
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
  return makeComprehensionQuestions(skillId, skillName, level, needed);
}

function neededForLevel(levelAudit) {
  if (!levelAudit.designed || levelAudit.passesDepth) return 0;
  if (levelAudit.runtimeSafeQuestionCount === 0) return SKILL_LEVEL_DEPTH_TARGETS.minimumPerLevel + 5;
  if (levelAudit.missingCount > 0) return levelAudit.missingCount + 5;
  return 15;
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
      const needed = neededForLevel(levelAudit);
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
  const file = [
    "// Generated by tools/generateSkillLevelGapQuestions.js. Do not edit by hand.",
    "",
    `export const skillLevelGapQuestions = ${JSON.stringify(generated, null, 2)};`,
    ""
  ].join("\n");
  fs.writeFileSync(generatedPath, file);

  ensureDir(docsValidationDir);
  fs.writeFileSync(manifestPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: GENERATED_SOURCE,
    totalQuestions: generated.length,
    summary
  }, null, 2));

  const rows = summary.map(item =>
    `| ${item.skillName} | ${item.level} | ${item.startingCount} | ${item.requested} | ${item.generated} |`
  ).join("\n");
  fs.writeFileSync(markdownPath, `# Skill Level Gap Question Generation\n\nGenerated: ${new Date().toISOString()}\n\nGenerated questions: ${generated.length}\n\n| Skill | Level | Starting Count | Requested | Generated |\n|---|---:|---:|---:|---:|\n${rows || "| None | - | - | - | - |"}\n`);

  console.log(`Generated ${generated.length} skill-level gap questions.`);
}

main();
