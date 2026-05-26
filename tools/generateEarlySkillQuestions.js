import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { masterWordLexicon } from "../src/content/lexicon/masterWordLexicon.js";
import { rhymeGroups, getRhymeGroup } from "../src/data/rhymeGroups.js";
import {
  isValidFinalSoundWordForEarlyLevel,
  isValidFinalSoundWordForLevelTwo
} from "../src/data/earlyPhonicsValidation.js";
import { finalSoundAnchors } from "../src/data/phonicsAnchors.js";
import { getApprovedAudioPath } from "../src/data/audioPreferenceManifest.js";
import {
  cvcShortVowelExpectedItemKeys,
  finalSoundExpectedItemKeys,
  finalSoundLevelTwoExpectedItemKeys,
  rhymingExpectedItemKeys,
  rhymingLevelTwoExpectedItemKeys
} from "../src/data/coverageExpectations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outputPath = path.join(rootDir, "src/data/generated/earlySkillQuestions.generated.js");
const reportPath = path.join(rootDir, "docs/validation/generated_early_skill_question_bank.md");

function normalize(value = "") {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function publicPathExists(assetPath = "") {
  return Boolean(assetPath && String(assetPath).startsWith("/") && fs.existsSync(path.join(rootDir, "public", assetPath.slice(1))));
}

function hasImage(entry) {
  return publicPathExists(entry.imageUrl);
}

function hasAudio(entry) {
  return publicPathExists(entry.audioUrl);
}

function hasApprovedAudio(entry) {
  return Boolean(hasAudio(entry) && getApprovedAudioPath(entry.lowercaseWord, entry.audioUrl));
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
    .filter(entry => !["zinnia", "zinnia flower", "zannia", "zone", "zoo gate"].includes(entry.lowercaseWord));
  const seen = new Set(scannedEntries.map(entry => entry.lowercaseWord));
  return [
    ...scannedEntries,
    ...supplementalWords.filter(entry => !seen.has(entry.lowercaseWord))
  ];
}

function optionWords(correct, pool, count = 4) {
  return unique([
    correct,
    ...pool.filter(word => word !== correct)
  ]).slice(0, count);
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
          : isValidFinalSoundWordForLevelTwo(entry.lowercaseWord, target)
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
        const wordOptions = optionWords(entry.lowercaseWord, contrastWords.filter(word => word !== anchor), 4);
        if (entry.lowercaseWord === anchor) return;
        const wordMatchPrompt = target.length === 1 && anchor
          ? `Which word ends the same as ${anchor}?`
          : `Which word ends with ${target}?`;
        const wordMatchSpokenPrompt = target.length === 1 && anchor
          ? `Which word ends like ${anchor}?`
          : `Which word ends with ${target}?`;
        if (hasApprovedAudio(entry) && hasImage(entry)) {
          out.push(makeBase({
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
            imageUrl: entry.imageUrl,
            audioUrl: entry.audioUrl,
            sourceLexiconId: entry.id,
            itemType: "final_sound",
            tags: ["generated", "final-sound", level === 1 ? "single-letter-final" : "complex-final"]
          }));
        }
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
          imageUrl: "",
          audioUrl: "",
          sourceLexiconId: entry.id,
          itemType: "final_sound",
          tags: ["generated", "final-sound", "word-choice"]
        }));
      });
    });
  });

  return out;
}

function generateCvcQuestions(entries) {
  const vowels = ["a", "e", "i", "o", "u"];
  const cvcEntries = entries.filter(entry =>
    entry.phonicsTags.includes("cvc") &&
    vowels.includes(entry.medialVowel) &&
    isSimpleCvcWord(entry.lowercaseWord)
  );
  const out = [];

  vowels.forEach(vowel => {
    const targetEntries = cvcEntries.filter(entry => entry.medialVowel === vowel);
    targetEntries.slice(0, 55).forEach((entry, index) => {
      const contrastWords = cvcEntries.filter(item => item.medialVowel !== vowel).map(item => item.lowercaseWord);
      const wordOptions = optionWords(entry.lowercaseWord, contrastWords, 4);
      if (hasApprovedAudio(entry)) {
        out.push(makeBase({
          id: `gen_cvc_short_${vowel}_${normalize(entry.lowercaseWord)}_${index}_vowel`,
          skillId: "cvc_short_vowels",
          skillName: "CVC and Short Vowels",
          level: 1,
          templateType: "SHORT_VOWEL_WORD",
          prompt: `Which word has the short ${vowel} sound?`,
          spokenPrompt: `Which word has the short ${vowel} sound?`,
          audioText: entry.lowercaseWord,
          targetWord: entry.lowercaseWord,
          correctAnswer: entry.lowercaseWord,
          answerOptions: wordOptions,
          coverageTarget: `short_${vowel}`,
          phonicsPattern: `short_${vowel}`,
          imageUrl: "",
          audioUrl: entry.audioUrl,
          sourceLexiconId: entry.id,
          itemType: "short_vowel",
          tags: ["generated", "cvc", "short-vowel"]
        }));
      }
      out.push(makeBase({
        id: `gen_cvc_short_${vowel}_${normalize(entry.lowercaseWord)}_${index}_missing`,
        skillId: "cvc_short_vowels",
        skillName: "CVC and Short Vowels",
        level: 1,
        templateType: "MISSING_VOWEL_CVC",
        prompt: `Choose the missing vowel in ${entry.lowercaseWord.replace(vowel, "_")}.`,
        spokenPrompt: `Choose the missing vowel in ${entry.lowercaseWord.replace(vowel, "_")}.`,
        targetWord: entry.lowercaseWord,
        correctAnswer: vowel,
        answerOptions: vowels,
        coverageTarget: `short_${vowel}`,
        phonicsPattern: `short_${vowel}`,
        imageUrl: hasImage(entry) ? entry.imageUrl : "",
        audioText: hasApprovedAudio(entry) ? entry.lowercaseWord : "",
        audioUrl: hasApprovedAudio(entry) ? entry.audioUrl : "",
        sourceLexiconId: entry.id,
        itemType: "short_vowel",
        tags: ["generated", "cvc", "missing-vowel"]
      }));
      if (hasImage(entry)) {
        out.push(makeBase({
          id: `gen_cvc_short_${vowel}_${normalize(entry.lowercaseWord)}_${index}_picture`,
          skillId: "cvc_short_vowels",
          skillName: "CVC and Short Vowels",
          level: 1,
          templateType: "PICTURE_TO_PRINT_MATCH",
          prompt: "Pick the word that matches the picture.",
          spokenPrompt: "Pick the word that matches the picture.",
          targetWord: entry.lowercaseWord,
          correctAnswer: entry.lowercaseWord,
          answerOptions: wordOptions,
          coverageTarget: `short_${vowel}`,
          phonicsPattern: `short_${vowel}`,
          imageUrl: entry.imageUrl,
          audioText: hasApprovedAudio(entry) ? entry.lowercaseWord : "",
          audioUrl: hasApprovedAudio(entry) ? entry.audioUrl : "",
          sourceLexiconId: entry.id,
          itemType: "short_vowel",
          tags: ["generated", "cvc", "picture-word"]
        }));
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
    isSimpleCvcWord(entry.lowercaseWord)
  );
  return cvcEntries.slice(0, 180).flatMap((entry, index) => {
    const sameVowelWords = cvcEntries
      .filter(item => item.medialVowel === entry.medialVowel && item.lowercaseWord !== entry.lowercaseWord)
      .map(item => item.lowercaseWord);
    const contrastWords = cvcEntries
      .filter(item => item.medialVowel !== entry.medialVowel)
      .map(item => item.lowercaseWord);
    const wordOptions = optionWords(entry.lowercaseWord, [...contrastWords, ...sameVowelWords], 4);
    return [
      ...(hasApprovedAudio(entry) ? [makeBase({
        id: `gen_short_vowel_${entry.medialVowel}_${normalize(entry.lowercaseWord)}_${index}_listen`,
        skillId: "short_vowel_discrimination",
        skillName: "Short Vowel Discrimination",
        level: 1,
        templateType: "LISTEN_CHOOSE_VOWEL",
        prompt: `Listen to "${entry.word}". Which short vowel sound do you hear?`,
        spokenPrompt: `Listen to ${entry.word}. Which short vowel sound do you hear?`,
        audioText: entry.lowercaseWord,
        targetWord: entry.lowercaseWord,
        correctAnswer: entry.medialVowel,
        answerOptions: vowels,
        coverageTarget: `short_${entry.medialVowel}`,
        phonicsPattern: `short_${entry.medialVowel}`,
        imageUrl: hasImage(entry) ? entry.imageUrl : "",
        audioUrl: entry.audioUrl,
        sourceLexiconId: entry.id,
        itemType: "short_vowel",
        tags: ["generated", "short-vowel-discrimination", "listen-vowel"]
      })] : []),
      ...(hasApprovedAudio(entry) ? [makeBase({
        id: `gen_short_vowel_${entry.medialVowel}_${normalize(entry.lowercaseWord)}_${index}_word`,
        skillId: "short_vowel_discrimination",
        skillName: "Short Vowel Discrimination",
        level: 1,
        templateType: "SHORT_VOWEL_WORD",
        prompt: `Which word has the short ${entry.medialVowel} sound?`,
        spokenPrompt: `Which word has the short ${entry.medialVowel} sound?`,
        targetWord: entry.lowercaseWord,
        correctAnswer: entry.lowercaseWord,
        answerOptions: wordOptions,
        coverageTarget: `short_${entry.medialVowel}`,
        phonicsPattern: `short_${entry.medialVowel}`,
        imageUrl: "",
        audioText: hasApprovedAudio(entry) ? entry.lowercaseWord : "",
        audioUrl: hasApprovedAudio(entry) ? entry.audioUrl : "",
        sourceLexiconId: entry.id,
        itemType: "short_vowel",
        tags: ["generated", "short-vowel-discrimination", "word-choice"]
      })] : []),
      ...(hasImage(entry)
        ? [makeBase({
            id: `gen_short_vowel_${entry.medialVowel}_${normalize(entry.lowercaseWord)}_${index}_picture`,
            skillId: "short_vowel_discrimination",
            skillName: "Short Vowel Discrimination",
            level: 1,
            templateType: "PICTURE_TO_PRINT_MATCH",
            prompt: "Pick the word that matches the picture.",
            spokenPrompt: "Pick the word that matches the picture.",
            targetWord: entry.lowercaseWord,
            correctAnswer: entry.lowercaseWord,
            answerOptions: wordOptions,
            coverageTarget: `short_${entry.medialVowel}`,
            phonicsPattern: `short_${entry.medialVowel}`,
            imageUrl: entry.imageUrl,
            audioText: hasApprovedAudio(entry) ? entry.lowercaseWord : "",
            audioUrl: hasApprovedAudio(entry) ? entry.audioUrl : "",
            sourceLexiconId: entry.id,
            itemType: "short_vowel",
            tags: ["generated", "short-vowel-discrimination", "picture-word"]
          })]
        : [])
    ];
  });
}

function generateRhymingQuestions(entries) {
  const out = [];
  const entryByWord = new Map(entries.map(entry => [entry.lowercaseWord, entry]));
  const familyLevels = [
    ...rhymingExpectedItemKeys.map(family => [family, 1]),
    ...rhymingLevelTwoExpectedItemKeys.map(family => [family, 2])
  ];

  familyLevels.forEach(([family, level]) => {
    const words = rhymeGroups[family] || [];
    const available = words.map(word => entryByWord.get(word)).filter(entry => entry && hasImage(entry));
    const distractorPool = entries
      .filter(entry => hasImage(entry) && getRhymeGroup(entry.lowercaseWord) && getRhymeGroup(entry.lowercaseWord) !== family)
      .map(entry => entry.lowercaseWord);

    available.forEach((entry, index) => {
      const rhymeWords = available.map(item => item.lowercaseWord).filter(word => word !== entry.lowercaseWord);
      rhymeWords.slice(0, 4).forEach((rhymeWord, rhymeIndex) => {
        const options = optionWords(rhymeWord, distractorPool, 4);
        out.push(makeBase({
          id: `gen_rhyme_${family}_${normalize(entry.lowercaseWord)}_${normalize(rhymeWord)}_${index}_${rhymeIndex}`,
          skillId: "rhyming",
          skillName: "Rhyming",
          level,
          templateType: rhymeIndex % 2 === 0 ? "READ_FIND_RHYME" : "LISTEN_FIND_RHYME",
          prompt: `Which word rhymes with ${entry.word}?`,
          targetWord: entry.lowercaseWord,
          correctAnswer: rhymeWord,
          answerOptions: options,
          coverageTarget: family,
          phonicsPattern: family,
          imageUrl: entry.imageUrl,
          audioUrl: entry.audioUrl,
          sourceLexiconId: entry.id,
          itemType: "rhyming_family",
          tags: ["generated", "rhyming", "same-rime"]
        }));
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
  fs.writeFileSync(
    outputPath,
    `// Generated by tools/generateEarlySkillQuestions.js. Do not edit by hand.\nexport const generatedEarlySkillQuestions = ${JSON.stringify(questions, null, 2)};\n`,
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
