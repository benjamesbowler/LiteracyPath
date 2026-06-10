import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { masterWordLexicon } from "../src/content/lexicon/masterWordLexicon.js";
import { rhymeGroups, getRhymeGroup } from "../src/data/rhymeGroups.js";
import { getChildWordAsset } from "../src/data/childAssets.js";
import {
  isFinalSoundsLevel1Question,
  isValidFinalSoundWordForEarlyLevel,
  isValidFinalSoundWordForLevelTwo
} from "../src/data/earlyPhonicsValidation.js";
import { finalSoundAnchors } from "../src/data/phonicsAnchors.js";
import {
  getApprovedAudioPath,
  getAudioPreferenceStatus
} from "../src/data/audioPreferenceManifest.js";
import {
  finalSoundExpectedItemKeys,
  finalSoundLevelTwoExpectedItemKeys,
  rhymingExpectedItemKeys,
  rhymingLevelTwoExpectedItemKeys
} from "../src/data/coverageExpectations.js";
import { LOW_VALUE_CVC_EXCLUSIONS } from "../src/utils/earlySkills/isRuntimeEligibleEarlySkillQuestion.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "src/data/generated/earlySkillQuestions.generated.js");
const reportPath = path.join(rootDir, "docs/validation/generated_early_skill_question_bank.md");
const splitOutputFiles = {
  final_sounds: "finalSounds.generated.js",
  cvc_short_vowels: "cvc.generated.js",
  short_vowel_discrimination: "shortVowel.generated.js",
  rhyming: "rhyming.generated.js"
};

const FORBIDDEN_EARLY_CHOICE_WORDS = new Set([
  ...LOW_VALUE_CVC_EXCLUSIONS,
  "yen"
]);

const FAMILIAR_RHYME_DISTRACTOR_WORDS = [
  "dog", "sun", "tip", "bed", "fog", "cup", "big", "hot",
  "leg", "mud", "pin", "box", "jam", "wet", "hop", "fed",
  "zip", "bug", "mop", "den", "cap", "log", "fit", "nut",
  "sip", "fin", "sit", "fig", "pan", "van", "bat", "cab",
  "web", "red", "hill", "duck", "bell", "sock", "gum", "ten",
  "lid", "map"
];

function normalize(value = "") {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function publicPathExists(assetPath = "") {
  return Boolean(assetPath && String(assetPath).startsWith("/") && fs.existsSync(path.join(rootDir, "public", assetPath.slice(1))));
}

function hasAudio(entry) {
  return publicPathExists(entry.audioUrl);
}

function imageStemMatchesWord(entry) {
  const imageStem = normalize(path.basename(String(entry.imageUrl || ""), path.extname(String(entry.imageUrl || ""))));
  return imageStem === normalize(entry.lowercaseWord);
}

function audioStemMatchesWord(entry) {
  const audioStem = normalize(path.basename(String(entry.audioUrl || ""), path.extname(String(entry.audioUrl || ""))));
  return audioStem === normalize(entry.lowercaseWord);
}

function getEntryImageUrl(entry) {
  const asset = getChildWordAsset(entry.lowercaseWord);
  if (asset?.image && publicPathExists(asset.image)) return asset.image;
  if (asset?.fallbackImage && publicPathExists(asset.fallbackImage)) return asset.fallbackImage;
  if (!publicPathExists(entry.imageUrl) || !imageStemMatchesWord(entry)) return "";
  return entry.imageUrl;
}

function hasImage(entry) {
  return Boolean(getEntryImageUrl(entry));
}

function getEntryAudioUrl(entry) {
  if (getAudioPreferenceStatus(entry.lowercaseWord) === "review_needed") return "";
  const preferred = getApprovedAudioPath(entry.lowercaseWord, "");
  if (preferred && publicPathExists(preferred)) return preferred;
  if (!hasAudio(entry) || !audioStemMatchesWord(entry)) return "";
  return getApprovedAudioPath(entry.lowercaseWord, entry.audioUrl);
}

function hasApprovedAudio(entry) {
  return Boolean(getEntryAudioUrl(entry));
}

function unique(list) {
  return [...new Set(list.filter(Boolean))];
}

function wordEntries() {
  const supplementalPhonics = {
    mat: { phonicsTags: ["cvc"], medialVowel: "a" },
    rat: { phonicsTags: ["cvc"], medialVowel: "a" },
    ham: { phonicsTags: ["cvc"], medialVowel: "a" },
    den: { phonicsTags: ["cvc"], medialVowel: "e" },
    run: { phonicsTags: ["cvc"], medialVowel: "u" },
    hut: { phonicsTags: ["cvc"], medialVowel: "u" },
    gum: { phonicsTags: ["cvc"], medialVowel: "u" }
  };
  const supplementalWords = ["bell", "doll", "hill", "ball", "wall", "shell", ...Object.keys(supplementalPhonics)].map(word => ({
    id: `supplemental_${normalize(word)}`,
    word,
    lowercaseWord: word,
    phonicsTags: supplementalPhonics[word]?.phonicsTags || [],
    finalSound: word.at(-1),
    medialVowel: supplementalPhonics[word]?.medialVowel || "",
    imageUrl: "",
    audioUrl: "",
    active: true
  }));
  const scannedEntries = masterWordLexicon
    .filter(entry => entry.active !== false && /^[a-z]+(?: [a-z]+)?$/.test(entry.lowercaseWord))
    .filter(entry => !FORBIDDEN_EARLY_CHOICE_WORDS.has(entry.lowercaseWord))
    .filter(entry => !["zinnia", "zinnia flower", "zannia", "zone", "zoo gate"].includes(entry.lowercaseWord));
  const seen = new Set(scannedEntries.map(entry => entry.lowercaseWord));
  return [
    ...scannedEntries,
    ...supplementalWords.filter(entry => !seen.has(entry.lowercaseWord))
  ];
}

function vowelOptions(correctVowel, seed = 0, count = 4) {
  const vowels = ["a", "e", "i", "o", "u"];
  const distractors = byRotatingIndex(vowels.filter(vowel => vowel !== correctVowel), seed);
  return unique([correctVowel, ...distractors]).slice(0, count);
}

function optionWords(correct, pool, count = 4) {
  return unique([
    correct,
    ...pool.filter(word => word !== correct)
  ]).slice(0, count);
}

function firstVowel(word = "") {
  return String(word || "").toLowerCase().match(/[aeiou]/)?.[0] || "";
}

function wordRime(word = "") {
  const value = String(word || "").toLowerCase();
  const index = value.search(/[aeiou]/);
  return index === -1 ? value.slice(1) : value.slice(index);
}

function wordOnset(word = "") {
  return String(word || "").toLowerCase().replace(/[^a-z]/g, "").slice(0, 1);
}

function hasOddOneOutOnsetGiveaway(correct, distractors = []) {
  if (!correct || distractors.length < 3) return false;
  const correctOnset = wordOnset(correct);
  const distractorOnsets = distractors.map(wordOnset).filter(Boolean);
  return Boolean(
    correctOnset &&
    distractorOnsets.length === 3 &&
    new Set(distractorOnsets).size === 1 &&
    distractorOnsets[0] !== correctOnset
  );
}

function hasEnoughDistractorOnsetVariety(distractors = []) {
  return new Set(distractors.map(wordOnset).filter(Boolean)).size >= 2;
}

function hasChildWordImage(word = "") {
  const asset = getChildWordAsset(word);
  return Boolean(asset?.image || asset?.fallbackImage);
}

function byRotatingIndex(items = [], seed = 0) {
  if (!items.length) return [];
  const start = Math.abs(seed) % items.length;
  return items.slice(start).concat(items.slice(0, start));
}

function scoreDistractorWord(word, selected, correct, options = {}) {
  const initial = word[0] || "";
  const rime = wordRime(word);
  const vowel = firstVowel(word);
  const selectedInitials = new Set(selected.map(item => item[0] || ""));
  const selectedRimes = new Set(selected.map(wordRime));
  const selectedVowels = new Set(selected.map(firstVowel));
  let score = 0;

  if (initial && initial !== correct[0]) score += 8;
  if (!selectedInitials.has(initial)) score += 12;
  if (rime && rime !== wordRime(correct)) score += 8;
  if (!selectedRimes.has(rime)) score += 12;
  if (vowel && !selectedVowels.has(vowel)) score += 6;
  if (options.preferDifferentVowel && vowel !== firstVowel(correct)) score += 8;
  if (options.preferSameVowel && vowel === firstVowel(correct)) score += 14;
  if (options.requireImage && hasChildWordImage(word)) score += 5;
  if (options.preferCorrectOnsetDistractor && initial && initial === wordOnset(correct)) score += 20;
  if (options.preferTargetOnsetDistractor && initial && initial === wordOnset(options.targetWord)) score += 16;

  return score;
}

function repairOnsetGiveaway(correct, selected, candidates, options = {}) {
  let repaired = [...selected];
  const available = candidates.filter(word => word !== correct && !repaired.includes(word));

  const needsRepair = () =>
    hasOddOneOutOnsetGiveaway(correct, repaired) ||
    (repaired.length >= 3 && !hasEnoughDistractorOnsetVariety(repaired));

  if (!needsRepair()) return repaired;

  const replacement = available
    .filter(word => {
      const trial = [word, ...repaired.slice(1)];
      return !hasOddOneOutOnsetGiveaway(correct, trial) && hasEnoughDistractorOnsetVariety(trial);
    })
    .sort((a, b) =>
      scoreDistractorWord(b, repaired, correct, options) -
      scoreDistractorWord(a, repaired, correct, options)
    )[0];

  if (replacement) repaired = [replacement, ...repaired.slice(1)];
  return repaired;
}

function balancedWordOptions(correct, pool, options = {}) {
  const count = options.count || 4;
  const requireImage = Boolean(options.requireImage);
  const candidates = unique(pool)
    .filter(word => word !== correct)
    .filter(word => !requireImage || hasChildWordImage(word));
  const selected = [];

  while (selected.length < count - 1 && selected.length < candidates.length) {
    const next = candidates
      .filter(word => !selected.includes(word))
      .sort((a, b) =>
        scoreDistractorWord(b, selected, correct, options) -
        scoreDistractorWord(a, selected, correct, options)
      )[0];
    if (!next) break;
    selected.push(next);
  }

  const repaired = count === 4
    ? repairOnsetGiveaway(correct, selected, candidates, options)
    : selected;
  return unique([correct, ...repaired]).slice(0, count);
}

function balancedCvcOptions(entry, poolEntries, options = {}) {
  const pool = byRotatingIndex(poolEntries, options.seed || 0)
    .map(item => item.lowercaseWord)
    .filter(Boolean);
  return balancedWordOptions(entry.lowercaseWord, pool, options);
}

function balancedRhymeOptions(correct, distractorPool, options = {}) {
  const selected = [];
  const usedFamilies = new Set();
  const rotated = byRotatingIndex(distractorPool, options.seed || 0);
  const correctFamily = getRhymeGroup(correct);
  const correctTail = String(correct || "").slice(-2);
  const correctOnset = wordOnset(correct);
  const targetOnset = wordOnset(options.targetWord);
  const safeDistractor = word => {
    if (!word || word === correct) return false;
    const family = getRhymeGroup(word);
    if (!family || family === options.family || family === correctFamily) return false;
    if (correctTail && String(word).slice(-2) === correctTail) return false;
    return true;
  };
  const candidateWords = unique(rotated.filter(safeDistractor));
  const scoreRhymeDistractor = (word, current = []) => {
    const onset = wordOnset(word);
    const currentOnsets = new Set(current.map(wordOnset));
    const family = getRhymeGroup(word);
    let score = scoreDistractorWord(word, current, correct, {
      ...options,
      preferCorrectOnsetDistractor: true,
      preferTargetOnsetDistractor: true
    });

    if (correctOnset && onset === correctOnset && !currentOnsets.has(correctOnset)) score += 60;
    if (targetOnset && onset === targetOnset && !currentOnsets.has(targetOnset)) score += 48;
    if (onset && !currentOnsets.has(onset)) score += 18;
    if (family && !usedFamilies.has(family)) score += 12;
    return score;
  };

  while (selected.length < 3) {
    const next = candidateWords
      .filter(word => {
      if (selected.includes(word)) return false;
      const family = getRhymeGroup(word);
      return safeDistractor(word) && !usedFamilies.has(family);
      })
      .sort((a, b) => scoreRhymeDistractor(b, selected) - scoreRhymeDistractor(a, selected))[0];
    if (!next) break;
    selected.push(next);
    usedFamilies.add(getRhymeGroup(next));
  }

  if (selected.length < 3) {
    for (const word of candidateWords.sort((a, b) => scoreRhymeDistractor(b, selected) - scoreRhymeDistractor(a, selected))) {
      if (selected.includes(word) || !safeDistractor(word)) continue;
      selected.push(word);
      if (selected.length >= 3) break;
    }
  }

  const repaired = repairOnsetGiveaway(correct, selected, candidateWords, {
    ...options,
    preferCorrectOnsetDistractor: true,
    preferTargetOnsetDistractor: true
  });
  return unique([correct, ...repaired]).slice(0, 4);
}

function makeBase({
  id,
  skillId,
  skillName,
  level,
  templateType,
  prompt,
  spokenPrompt = "",
  audioText = "",
  targetWord,
  correctAnswer,
  answerOptions,
  coverageTarget,
  phonicsPattern,
  targetFinalSound = "",
  finalSoundType = "",
  distractorType = "contrast",
  difficulty = level,
  phase = 1,
  imageUrl = "",
  audioUrl = "",
  sourceLexiconId = "",
  itemType = "",
  itemKey = coverageTarget,
  tags = []
}) {
  return {
    id,
    skillId,
    skillName,
    skill: skillName,
    level,
    templateType,
    runtimeTemplateKey: "",
    formatType: templateType,
    questionType: templateType.toLowerCase(),
    prompt,
    question: prompt,
    spokenPrompt,
    audioText,
    targetWord,
    correctAnswer,
    answer: correctAnswer,
    choices: answerOptions,
    answerOptions,
    imageKey: imageUrl ? normalize(targetWord) : "",
    imageUrl,
    imagePath: imageUrl,
    audioKey: audioUrl ? normalize(targetWord) : "",
    audioUrl,
    audioPath: audioUrl,
    phonicsPattern,
    targetSound: phonicsPattern,
    targetFinalSound,
    finalSoundType,
    coverageTarget,
    itemKey,
    itemType,
    distractorType,
    difficulty,
    assessmentPhase: phase,
    phaseTarget: `level_${level}_phase_${phase}`,
    tags,
    active: true,
    qaStatus: "approved",
    sourceLexiconId
  };
}

function isSimpleCvcWord(word = "") {
  if (["yam"].includes(word)) return false;
  return /^[bcdfghjklmnpqrstvwxyz][aeiou][bcdfghjklmnpqrstvwxyz]$/.test(word) &&
    !word.endsWith("x") &&
    !/(ar|er|ir|or|ur|ow|aw|oy|ay|ey)/.test(word);
}

function generateFinalSoundQuestions(entries) {
  const levelOne = entries.filter(entry =>
    finalSoundExpectedItemKeys.includes(entry.finalSound) &&
    /^[a-z]{2,5}$/.test(entry.lowercaseWord) &&
    isValidFinalSoundWordForEarlyLevel(entry.lowercaseWord, entry.finalSound)
  );
  const levelTwo = entries;
  const byLevel = [
    { level: 1, items: levelOne, targets: finalSoundExpectedItemKeys },
    { level: 2, items: levelTwo, targets: finalSoundLevelTwoExpectedItemKeys }
  ];
  const out = [];

  byLevel.forEach(({ level, items, targets }) => {
    const wordsByTarget = Object.fromEntries(targets.map(target => [
      target,
      items.filter(entry =>
        level === 1
          ? entry.finalSound === target
          : entry.lowercaseWord !== target &&
            entry.lowercaseWord.length > target.length &&
            isValidFinalSoundWordForLevelTwo(entry.lowercaseWord, target)
      )
    ]));
    targets.forEach(target => {
      const finalSoundType =
        level === 1
          ? "single_letter"
          : target === "ll"
            ? "double_letter"
            : ["sh", "th", "ng"].includes(target)
              ? "digraph"
              : "blend";
      const targetEntries = wordsByTarget[target] || [];
      targetEntries.slice(0, level === 1 ? 26 : 16).forEach((entry, index) => {
        const contrastWords = items
          .filter(item =>
            (level === 1
              ? !isValidFinalSoundWordForEarlyLevel(item.lowercaseWord, target)
              : !isValidFinalSoundWordForLevelTwo(item.lowercaseWord, target)) &&
            item.lowercaseWord.at(-1) !== target.at(-1)
          )
          .map(item => item.lowercaseWord);
        const soundOptions = optionWords(target, targets.filter(item => item !== target), 4);
        const anchor = finalSoundAnchors[target.at(-1)];
        const wordOptions = balancedWordOptions(entry.lowercaseWord, contrastWords.filter(word => word !== anchor), {
          seed: index,
          preferCorrectOnsetDistractor: true
        });
        if (entry.lowercaseWord === anchor) return;
        const wordMatchPrompt = target.length === 1 && anchor
          ? `Which word ends the same as ${anchor}?`
          : `Which word ends with ${target}?`;
        const wordMatchSpokenPrompt = target.length === 1 && anchor
          ? `Which word ends like ${anchor}?`
          : `Which word ends with ${target}?`;
        if (hasApprovedAudio(entry) && hasImage(entry)) {
          const soundChoiceQuestion = makeBase({
            id: `gen_final_l${level}_${target}_${normalize(entry.lowercaseWord)}_${index}_sound`,
            skillId: "final_sounds",
            skillName: "Final Sounds",
            level,
            templateType: "ENDING_SOUND",
            prompt: `Listen to the word. What sound does "${entry.word}" end with?`,
            spokenPrompt: `Listen to ${entry.word}. What sound does it end with?`,
            audioText: entry.lowercaseWord,
            targetWord: entry.lowercaseWord,
            correctAnswer: target,
            answerOptions: soundOptions,
            coverageTarget: target,
            phonicsPattern: target,
            targetFinalSound: target,
            finalSoundType,
            imageUrl: getEntryImageUrl(entry),
            audioUrl: getEntryAudioUrl(entry),
            sourceLexiconId: entry.id,
            itemType: "final_sound",
            tags: ["generated", "final-sound", level === 1 ? "single-letter-final" : "complex-final"]
          });
          if (level >= 2 || isFinalSoundsLevel1Question(soundChoiceQuestion)) {
            out.push(soundChoiceQuestion);
          }
        }
        const wordMatchImageUrl = getEntryImageUrl(entry);
        if (level >= 2 && wordMatchImageUrl) {
          out.push(makeBase({
            id: `gen_final_l${level}_${target}_${normalize(entry.lowercaseWord)}_${index}_word`,
            skillId: "final_sounds",
            skillName: "Final Sounds",
            level,
            templateType: "ENDING_SOUND_WORD_MATCH",
            prompt: wordMatchPrompt,
            spokenPrompt: wordMatchSpokenPrompt,
            targetWord: entry.lowercaseWord,
            correctAnswer: entry.lowercaseWord,
            answerOptions: wordOptions,
            coverageTarget: target,
            phonicsPattern: target,
            targetFinalSound: target,
            finalSoundType,
            imageUrl: wordMatchImageUrl,
            audioUrl: "",
            sourceLexiconId: entry.id,
            itemType: "final_sound",
            tags: ["generated", "final-sound", "word-choice"]
          }));
        }
      });
    });
  });

  return out;
}

function generateCvcQuestions(entries) {
  const vowels = ["a", "e", "i", "o", "u"];
  const cvcTemplateVariant = (style, vowel, level, phase, index) =>
    `${style}_L${level}_P${phase}_SHORT_${vowel.toUpperCase()}_${String((index % 8) + 1).padStart(2, "0")}`;
  const cvcEntries = entries.filter(entry =>
    entry.phonicsTags.includes("cvc") &&
    vowels.includes(entry.medialVowel) &&
    isSimpleCvcWord(entry.lowercaseWord)
  );
  const out = [];

  vowels.forEach(vowel => {
    const targetEntries = cvcEntries.filter(entry => entry.medialVowel === vowel);
    targetEntries.slice(0, 55).forEach((entry, index) => {
      const level = index % 2 === 0 ? 1 : 2;
      const phase = Math.floor(index / 2) % 2 === 0 ? 1 : 2;
      const contrastEntries = cvcEntries.filter(item => item.medialVowel !== vowel);
      const wordOptions = balancedCvcOptions(entry, contrastEntries, {
        seed: index,
        preferDifferentVowel: true
      });
      const imageWordOptions = balancedCvcOptions(entry, contrastEntries.filter(hasImage), {
        seed: index,
        requireImage: true,
        preferDifferentVowel: true
      });
      if (hasApprovedAudio(entry)) {
        const question = makeBase({
          id: `gen_cvc_short_${vowel}_${normalize(entry.lowercaseWord)}_${index}_vowel`,
          skillId: "cvc_short_vowels",
          skillName: "CVC and Short Vowels",
          level,
          phase,
          templateType: "SHORT_VOWEL_WORD",
          prompt: `Which word has the short ${vowel} sound?`,
          spokenPrompt: `Which word has the short ${vowel} sound?`,
          audioText: entry.lowercaseWord,
          targetWord: entry.lowercaseWord,
          correctAnswer: entry.lowercaseWord,
          answerOptions: imageWordOptions.length === 4 ? imageWordOptions : wordOptions,
          coverageTarget: `short_${vowel}`,
          phonicsPattern: `short_${vowel}`,
          imageUrl: "",
          audioUrl: getEntryAudioUrl(entry),
          sourceLexiconId: entry.id,
          itemType: "short_vowel",
          tags: ["generated", "cvc", "short-vowel"]
        });
        question.runtimeTemplateKey = cvcTemplateVariant("HEAR_SHORT_VOWEL_CHOOSE_CVC_WORD", vowel, level, phase, index);
        out.push(question);
      }
      const missingVowelQuestion = makeBase({
          id: `gen_cvc_short_${vowel}_${normalize(entry.lowercaseWord)}_${index}_missing`,
          skillId: "cvc_short_vowels",
          skillName: "CVC and Short Vowels",
          level,
          phase,
          templateType: "MISSING_VOWEL_CVC",
        prompt: `Choose the missing vowel in ${entry.lowercaseWord.replace(vowel, "_")}.`,
        spokenPrompt: `Choose the missing vowel in ${entry.lowercaseWord.replace(vowel, "_")}.`,
        targetWord: entry.lowercaseWord,
        correctAnswer: vowel,
        answerOptions: vowels,
        coverageTarget: `short_${vowel}`,
        phonicsPattern: `short_${vowel}`,
        imageUrl: getEntryImageUrl(entry),
        audioText: hasApprovedAudio(entry) ? entry.lowercaseWord : "",
        audioUrl: getEntryAudioUrl(entry),
        sourceLexiconId: entry.id,
        itemType: "short_vowel",
        tags: ["generated", "cvc", "missing-vowel"]
      });
      missingVowelQuestion.runtimeTemplateKey = cvcTemplateVariant("HEAR_WORD_SEE_IMAGE_CHOOSE_MIDDLE_VOWEL", vowel, level, phase, index);
      out.push(missingVowelQuestion);
      if (hasImage(entry)) {
        const question = makeBase({
          id: `gen_cvc_short_${vowel}_${normalize(entry.lowercaseWord)}_${index}_picture`,
          skillId: "cvc_short_vowels",
          skillName: "CVC and Short Vowels",
          level,
          phase,
          templateType: "PICTURE_TO_PRINT_MATCH",
          prompt: "Pick the word that matches the picture.",
          spokenPrompt: "Pick the word that matches the picture.",
          targetWord: entry.lowercaseWord,
          correctAnswer: entry.lowercaseWord,
          answerOptions: imageWordOptions.length === 4 ? imageWordOptions : wordOptions,
          coverageTarget: `short_${vowel}`,
          phonicsPattern: `short_${vowel}`,
          imageUrl: getEntryImageUrl(entry),
          audioText: hasApprovedAudio(entry) ? entry.lowercaseWord : "",
          audioUrl: getEntryAudioUrl(entry),
          sourceLexiconId: entry.id,
          itemType: "short_vowel",
          tags: ["generated", "cvc", "picture-word"]
        });
        question.runtimeTemplateKey = cvcTemplateVariant("HEAR_SHORT_VOWEL_CHOOSE_CVC_IMAGE_WORD", vowel, level, phase, index);
        out.push(question);
      }
    });
  });

  return out;
}

function generateShortVowelDiscriminationQuestions(entries) {
  const vowels = ["a", "e", "i", "o", "u"];
  const cvcEntries = entries.filter(entry =>
    entry.phonicsTags.includes("cvc") &&
    vowels.includes(entry.medialVowel) &&
    isSimpleCvcWord(entry.lowercaseWord) &&
    hasImage(entry) &&
    hasApprovedAudio(entry)
  );
  return cvcEntries.slice(0, 180).flatMap((entry, index) => {
    const level = index % 2 === 0 ? 1 : 2;
    const phase = Math.floor(index / 2) % 2 === 0 ? 1 : 2;
    const contrastEntries = cvcEntries.filter(item => item.medialVowel !== entry.medialVowel);
    const wordOptions = balancedCvcOptions(entry, contrastEntries, {
      seed: index,
      requireImage: true,
      preferDifferentVowel: true
    });
    return [
      makeBase({
        id: `gen_short_vowel_${entry.medialVowel}_${normalize(entry.lowercaseWord)}_${index}_listen`,
        skillId: "short_vowel_discrimination",
        skillName: "Short Vowel Discrimination",
        level,
        phase,
        templateType: "LISTEN_CHOOSE_VOWEL",
        prompt: `Listen to "${entry.word}". Which short vowel sound do you hear?`,
        spokenPrompt: `Listen to ${entry.word}. Which short vowel sound do you hear?`,
        audioText: entry.lowercaseWord,
        targetWord: entry.lowercaseWord,
        correctAnswer: entry.medialVowel,
        answerOptions: vowelOptions(entry.medialVowel, index),
        coverageTarget: `short_${entry.medialVowel}`,
        phonicsPattern: `short_${entry.medialVowel}`,
        imageUrl: getEntryImageUrl(entry),
        audioUrl: getEntryAudioUrl(entry),
        sourceLexiconId: entry.id,
        itemType: "short_vowel",
        tags: ["generated", "short-vowel-discrimination", "listen-vowel"]
      }),
      makeBase({
        id: `gen_short_vowel_${entry.medialVowel}_${normalize(entry.lowercaseWord)}_${index}_picture`,
        skillId: "short_vowel_discrimination",
        skillName: "Short Vowel Discrimination",
        level,
        phase,
        templateType: "PICTURE_TO_PRINT_MATCH",
        prompt: "Pick the word that matches the picture.",
        spokenPrompt: "Pick the word that matches the picture.",
        targetWord: entry.lowercaseWord,
        correctAnswer: entry.lowercaseWord,
        answerOptions: wordOptions,
        coverageTarget: `short_${entry.medialVowel}`,
        phonicsPattern: `short_${entry.medialVowel}`,
        imageUrl: getEntryImageUrl(entry),
        audioText: entry.lowercaseWord,
        audioUrl: getEntryAudioUrl(entry),
        sourceLexiconId: entry.id,
        itemType: "short_vowel",
        tags: ["generated", "short-vowel-discrimination", "picture-word"]
      })
    ];
  });
}

function generateRhymingQuestions(entries) {
  const out = [];
  const entryByWord = new Map(entries.map(entry => [entry.lowercaseWord, entry]));
  const rhymingImageCard = (word, correctAnswer) => {
    const entry = entryByWord.get(word);
    const image = entry ? getEntryImageUrl(entry) : "";
    return {
      id: `rhyme_card_${normalize(word)}`,
      word,
      value: word,
      label: word,
      image,
      imageUrl: image,
      imagePath: image,
      alt: `Picture for ${word}`,
      isCorrect: word === correctAnswer
    };
  };
  const familyLevels = [
    ...rhymingExpectedItemKeys.map(family => [family, 1]),
    ...rhymingLevelTwoExpectedItemKeys.map(family => [family, 2])
  ];

  familyLevels.forEach(([family, level], familyIndex) => {
    const words = rhymeGroups[family] || [];
    const available = words.map(word => entryByWord.get(word)).filter(entry => entry && hasImage(entry));
    const generatedDistractorPool = entries
      .filter(entry => hasImage(entry) && getRhymeGroup(entry.lowercaseWord) && getRhymeGroup(entry.lowercaseWord) !== family)
      .map(entry => entry.lowercaseWord);
    const distractorPool = [
      ...FAMILIAR_RHYME_DISTRACTOR_WORDS.filter(word => {
        const entry = entryByWord.get(word);
        return entry && hasImage(entry) && getRhymeGroup(word) && getRhymeGroup(word) !== family;
      }),
      ...generatedDistractorPool
    ];

    available.forEach((entry, index) => {
      const rhymeWords = available.map(item => item.lowercaseWord).filter(word => word !== entry.lowercaseWord);
      rhymeWords.slice(0, 4).forEach((rhymeWord, rhymeIndex) => {
        const phase = (index + rhymeIndex) % 2 === 0 ? 1 : 2;
        const options = balancedRhymeOptions(rhymeWord, distractorPool, {
          family,
          targetWord: entry.lowercaseWord,
          seed: familyIndex * 17 + index * 5 + rhymeIndex * 11
        });
        const imageCards = options.map(word => rhymingImageCard(word, rhymeWord));
        if (imageCards.length !== 4 || !imageCards.every(card => card.image)) return;
        const question = makeBase({
          id: `gen_rhyme_${family}_${normalize(entry.lowercaseWord)}_${normalize(rhymeWord)}_${index}_${rhymeIndex}`,
          skillId: "rhyming",
          skillName: "Rhyming",
          level,
          phase,
          templateType: "RHYMING_PICTURE",
          prompt: `Which word rhymes with ${entry.word}?`,
          spokenPrompt: `Which word rhymes with ${entry.word}?`,
          targetWord: entry.lowercaseWord,
          correctAnswer: rhymeWord,
          answerOptions: options,
          coverageTarget: family,
          phonicsPattern: family,
          imageUrl: getEntryImageUrl(entry),
          audioUrl: getEntryAudioUrl(entry),
          sourceLexiconId: entry.id,
          itemType: "rhyming_family",
          tags: ["generated", "rhyming", "same-rime"]
        });
        out.push({
          ...question,
          questionType: "visual_card_choice",
          choices: options,
          answerOptions: imageCards,
          imageCards,
          requiredSelections: 1,
          correctAnswers: [rhymeWord]
        });
      });
    });
  });
  return out;
}

function buildGeneratedQuestions() {
  const entries = wordEntries();
  return [
    ...generateFinalSoundQuestions(entries),
    ...generateCvcQuestions(entries),
    ...generateShortVowelDiscriminationQuestions(entries),
    ...generateRhymingQuestions(entries)
  ].filter(question => question.choices.length >= 2 && question.choices.includes(question.answer));
}

function writeGeneratedFile(questions) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const groups = questions.reduce((acc, question) => {
    acc[question.skillId] = acc[question.skillId] || [];
    acc[question.skillId].push(question);
    return acc;
  }, {});

  Object.entries(splitOutputFiles).forEach(([skillId, fileName]) => {
    const exportName = fileName.replace(/\.generated\.js$/, "GeneratedQuestions");
    fs.writeFileSync(
      path.join(path.dirname(outputPath), fileName),
      `// Generated by tools/generateEarlySkillQuestions.js. Do not edit by hand.\nexport const ${exportName} = ${JSON.stringify(groups[skillId] || [], null, 2)};\n`,
      "utf8"
    );
  });

  fs.writeFileSync(
    outputPath,
    `// Generated by tools/generateEarlySkillQuestions.js. Do not edit by hand.\nimport { finalSoundsGeneratedQuestions } from "./finalSounds.generated.js";\nimport { cvcGeneratedQuestions } from "./cvc.generated.js";\nimport { shortVowelGeneratedQuestions } from "./shortVowel.generated.js";\nimport { rhymingGeneratedQuestions } from "./rhyming.generated.js";\n\nexport const generatedEarlySkillQuestions = [\n  ...finalSoundsGeneratedQuestions,\n  ...cvcGeneratedQuestions,\n  ...shortVowelGeneratedQuestions,\n  ...rhymingGeneratedQuestions\n];\n`,
    "utf8"
  );
}

function writeReport(questions) {
  const bySkill = questions.reduce((counts, question) => {
    counts[question.skillId] = counts[question.skillId] || { total: 0, byTemplate: {}, byCoverage: {} };
    counts[question.skillId].total += 1;
    counts[question.skillId].byTemplate[question.templateType] = (counts[question.skillId].byTemplate[question.templateType] || 0) + 1;
    counts[question.skillId].byCoverage[question.coverageTarget] = (counts[question.skillId].byCoverage[question.coverageTarget] || 0) + 1;
    return counts;
  }, {});
  const sections = Object.entries(bySkill).map(([skillId, summary]) => {
    const templateRows = Object.entries(summary.byTemplate).map(([template, count]) => `| ${template} | ${count} |`).join("\n");
    const coverageRows = Object.entries(summary.byCoverage).sort(([a], [b]) => a.localeCompare(b)).map(([target, count]) => `| ${target} | ${count} |`).join("\n");
    return `## ${skillId}\n\n- Generated questions: ${summary.total}\n\n### Templates\n\n| Template | Count |\n| --- | ---: |\n${templateRows}\n\n### Coverage Targets\n\n| Target | Count |\n| --- | ---: |\n${coverageRows}`;
  }).join("\n\n");

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    `# Generated Early Skill Question Bank\n\nGenerated: ${new Date().toISOString()}\n\nTotal generated questions: ${questions.length}\n\n${sections}\n`,
    "utf8"
  );
}

const questions = buildGeneratedQuestions();
writeGeneratedFile(questions);
writeReport(questions);
console.log(`Generated early-skill questions: ${questions.length}`);
Object.entries(questions.reduce((counts, question) => {
  counts[question.skillId] = (counts[question.skillId] || 0) + 1;
  return counts;
}, {})).forEach(([skillId, count]) => console.log(`${skillId}: ${count}`));
