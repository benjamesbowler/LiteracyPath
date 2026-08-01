import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  getActiveAssessmentSkillIds,
  loadAssessmentSkillBank
} from "../src/data/loadAssessmentSkillBank.js";
import { GUIDED_READING_QUIZZES } from "../src/data/generated/guidedReadingQuizzes.generated.js";
import { QUEST_STORY_QUESTIONS } from "../src/data/generated/questStoryQuestions.generated.js";
import { SENTENCE_FIX } from "../src/data/learnGamesData.js";
import { elSkillsBlockCycles } from "../src/data/elSkillsBlockCycles.js";
import { isQuestionBlockedByMediaQa } from "../src/data/mediaQaManifest.js";
import { buildStationRounds, onsetGrapheme, sharesSound, stationsForCycle } from "../src/components/elQuest/elQuestEngine.js";
import { buildRocketRunRound, rocketRunLadder } from "../src/utils/rocketRunRounds.js";
import { buildTrack, soundRacerLadder } from "../src/utils/soundRacerTracks.js";
import { difficultyLadder } from "../src/utils/curriculumLadder.js";
import { wordBridgeLadder } from "../src/utils/wordBridgeLevels.js";
import { soundBeatLadder } from "../src/utils/soundBeatTracks.js";
import { rhymePopLadder } from "../src/utils/rhymePopLevels.js";
import { soundSafariAudioCoverage, soundSafariLadder } from "../src/utils/soundSafariRounds.js";
import { reelReadLadder } from "../src/utils/reelReadLevels.js";
import { starGalleryLadder } from "../src/utils/starGalleryRounds.js";
import { buildLine } from "../src/utils/sentenceExpressLevels.js";
import { grammarGrindLadder } from "../src/utils/grammarGrindLevels.js";
import { segmentWord } from "../src/utils/graphemeSegments.js";
import {
  WORKSHEET_TYPES,
  availableWorksheetTypes,
  buildWorksheetDocument,
  getWorksheetCycle,
  worksheetCycleOptions
} from "../src/utils/worksheets/worksheetBuilder.js";
import {
  QUESTION_DESIGN_POLICY_VERSION,
  auditQuestionAgainstPolicy,
  questionVisualPaths
} from "../src/policy/questionDesignPolicy.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_DIR = path.join(ROOT, ".artifacts", "question-design-policy");
const REPORT_MD = path.join(REPORT_DIR, "report.md");
const REPORT_JSON = path.join(REPORT_DIR, "report.json");

const failures = [];
const rows = [];
const skillRows = [];

function publicAssetExists(assetPath = "") {
  if (!assetPath || /^(?:data:|https?:)/.test(assetPath)) return Boolean(assetPath);
  return fs.existsSync(path.join(ROOT, "public", String(assetPath).replace(/^\//, "")));
}

function record(surface, id, issues, meta = {}) {
  for (const item of issues) failures.push({ surface, id, ...item, ...meta });
}

function auditMediaFiles(surface, id, question) {
  const missing = questionVisualPaths(question).filter(asset => !publicAssetExists(asset));
  if (missing.length) {
    record(surface, id, [{ code: "Q-MEDIA-FILE", message: `Missing visual file(s): ${missing.join(", ")}` }]);
  }
  if (isQuestionBlockedByMediaQa(question)) {
    record(surface, id, [{ code: "Q-MEDIA-QA", message: "The question references artwork that is blocked or still awaiting media QA." }]);
  }
}

function questionBandForBookId(bookId = "") {
  const level = String(bookId).match(/(?:^|-)([a-d])(?:-|$)/i)?.[1]?.toUpperCase();
  return level || "B";
}

function assessmentHasLevelGap(items = []) {
  const byLevel = new Map([[1, []], [2, []]]);
  for (const item of items) byLevel.get(Number(item.level || item.difficulty) >= 2 ? 2 : 1).push(item);
  if (!byLevel.get(1).length || !byLevel.get(2).length) return false;
  const formats = level => new Set(byLevel.get(level).map(item => item.formatType || item.templateType || ""));
  const level1Formats = formats(1);
  const level2Formats = formats(2);
  const distinctFormat = [...level2Formats].some(format => !level1Formats.has(format));
  const level1Units = new Set(byLevel.get(1).map(item => item.itemKey));
  const level2Units = new Set(byLevel.get(2).map(item => item.itemKey));
  const distinctUnit = [...level2Units].some(unit => !level1Units.has(unit))
    || [...level1Units].some(unit => !level2Units.has(unit));
  const meanTargetLength = level => {
    const targets = byLevel.get(level).map(item => String(item.targetWord || item.answer || "")).filter(Boolean);
    return targets.reduce((sum, value) => sum + value.length, 0) / Math.max(1, targets.length);
  };
  const increasedWordDemand = meanTargetLength(2) >= meanTargetLength(1) + 0.5;
  const level1Positions = new Set(byLevel.get(1).map(item => item.phonicsPosition || item.position || "").filter(Boolean));
  const level2Positions = new Set(byLevel.get(2).map(item => item.phonicsPosition || item.position || "").filter(Boolean));
  const increasedPositionDemand = [...level2Positions].some(position => !level1Positions.has(position));
  const demandNote = byLevel.get(2).some(item => item.level2Demand || /level\s*2|transfer|infer|context|contrast/i.test(item.notes || ""));
  return distinctFormat || distinctUnit || demandNote || increasedWordDemand || increasedPositionDemand;
}

async function auditAssessments() {
  const skillIds = getActiveAssessmentSkillIds();
  if (skillIds.length !== 30) {
    record("Assessment skills", "registry", [{ code: "Q-SKILL-COUNT", message: `Expected 30 active skills; found ${skillIds.length}.` }]);
  }
  let total = 0;
  for (const skillId of skillIds) {
    const items = await loadAssessmentSkillBank(skillId);
    const before = failures.length;
    total += items.length;
    const levels = new Set(items.map(item => Number(item.level || item.difficulty) >= 2 ? 2 : 1));
    const phases = new Set(items.map(item => Number(item.phase || item.assessmentPhase)));
    if (!items.length) record("Assessment skills", skillId, [{ code: "Q-EMPTY-SKILL", message: "Published runtime bank is empty." }]);
    if (!levels.has(1) || !levels.has(2)) record("Assessment skills", skillId, [{ code: "Q-LEVELS", message: "Both Level 1 and Level 2 are required." }]);
    if (!phases.has(1) || !phases.has(2)) record("Assessment skills", skillId, [{ code: "Q-PHASES", message: "Both Phase 1 and Phase 2 are required." }]);
    if (items.length && !assessmentHasLevelGap(items)) record("Assessment skills", skillId, [{ code: "Q-LEVEL-GAP", message: "No machine-visible Level 1/Level 2 demand separation was found." }]);
    for (const question of items) {
      const level = Number(question.level || question.difficulty) >= 2 ? 2 : 1;
      const constructedResponse = Boolean(
        question.soundTiles?.length
        || question.letterTiles?.length
        || /(?:PUT_SOUNDS_IN_ORDER|SPELL|BUILD)/.test(question.formatType || "")
      );
      const issues = auditQuestionAgainstPolicy(question, {
        ageBand: level === 1 ? "A" : "B",
        requireId: true,
        requireVisual: question.mediaTier === "image-required",
        requireSpoken: true,
        requireDistractorRationales: !constructedResponse,
        allowNegativeStem: level === 2,
        constructedResponse
      });
      record("Assessment skills", question.id || skillId, issues, { skillId, level });
      auditMediaFiles("Assessment skills", question.id || skillId, question);
    }
    skillRows.push({ skillId, questions: items.length, failures: failures.length - before });
  }
  rows.push({ surface: "30 assessment skills", questions: total, failures: failures.filter(item => item.surface === "Assessment skills").length });
}

function auditGuidedReading() {
  const surface = "Guided Reading quizzes";
  const before = failures.length;
  let total = 0;
  for (const quiz of Object.values(GUIDED_READING_QUIZZES)) {
    for (const question of quiz.questions || []) {
      total += 1;
      record(surface, question.id, auditQuestionAgainstPolicy(question, {
        ageBand: questionBandForBookId(quiz.bookId),
        requireId: true,
        requireVisual: true,
        requireSpoken: true,
        hasContextVisual: true,
        hasSurfaceSpeaker: true,
        skipPromptLimit: true
      }), { bookId: quiz.bookId });
    }
  }
  rows.push({ surface, questions: total, failures: failures.length - before });
}

function auditStoryStops() {
  const surface = "Story Stop cover questions";
  const before = failures.length;
  let total = 0;
  for (const [world, bank] of Object.entries(QUEST_STORY_QUESTIONS)) {
    for (const [index, question] of (bank.questions || []).entries()) {
      total += 1;
      const choices = [question.answer, ...bank.names.filter(name => name !== question.answer).slice(index % Math.max(1, bank.names.length - 1))]
        .filter((value, choiceIndex, all) => all.indexOf(value) === choiceIndex)
        .slice(0, 3);
      while (choices.length < 3) {
        const candidate = bank.names.find(name => !choices.includes(name));
        if (!candidate) break;
        choices.push(candidate);
      }
      const item = { ...question, id: `story-stop-${world}-${index + 1}`, choices };
      record(surface, item.id, auditQuestionAgainstPolicy(item, {
        ageBand: "A",
        requireId: true,
        requireVisual: true,
        requireSpoken: true,
        hasSurfaceSpeaker: true
      }), { world });
      auditMediaFiles(surface, item.id, item);
    }
  }
  rows.push({ surface, questions: total, failures: failures.length - before });
}

function elRoundChoices(round = {}) {
  if (round.type === "pattern") return (round.items || []).map(item => item.word);
  return round.choices || [];
}

function auditElQuest() {
  const surface = "EL Quest stations";
  const before = failures.length;
  let total = 0;
  const cycles = elSkillsBlockCycles.filter(cycle => cycle.cycleNumber);
  for (const cycle of cycles) {
    for (const station of stationsForCycle(cycle)) {
      const rounds = buildStationRounds(cycle, station.id);
      for (const [index, round] of rounds.entries()) {
        total += 1;
        const id = `el-${cycle.cycleNumber}-${station.id}-${index + 1}`;
        const isConstructed = ["build", "trace", "pattern"].includes(round.type);
        const item = {
          ...round,
          id,
          choices: elRoundChoices(round),
          answer: round.answer || (isConstructed ? "" : round.answer)
        };
        record(surface, id, auditQuestionAgainstPolicy(item, {
          ageBand: cycle.cycleNumber <= 12 ? "A" : "B",
          requireId: true,
          requireSpoken: true,
          hasSurfaceSpeaker: true,
          constructedResponse: isConstructed,
          skipPromptLimit: round.type === "play"
        }), { cycle: cycle.cycleNumber, station: station.id, roundType: round.type });
        if (["letter", "sound", "hunt", "quick", "build", "play", "chain", "speed", "trace"].includes(round.type)
          && !round.audio && !round.speechFallback) {
          record(surface, id, [{ code: "Q-TARGET-AUDIO", message: "This auditory/word round has neither recorded audio nor a speech fallback." }]);
        }
      }
    }
  }
  rows.push({ surface, questions: total, failures: failures.length - before });
}

function auditArcade() {
  const difficulties = ["easy", "medium", "hard"];

  function check(surface, id, condition, code, message, meta = {}) {
    if (!condition) record(surface, id, [{ code, message }], meta);
  }

  function addRow(surface, total, before) {
    rows.push({ surface, questions: total, failures: failures.length - before });
  }

  {
    const surface = "Arcade · Rocket Run";
    const before = failures.length;
    let total = 0;
    for (const difficulty of difficulties) {
      const targets = rocketRunLadder(difficulty);
      check(surface, `${difficulty}-ladder`, targets.length === 10, "Q-ARCADE-LADDER", "Expected exactly 10 levels.");
      check(surface, `${difficulty}-ladder`, new Set(targets).size === targets.length, "Q-ARCADE-REPEAT", "The level ladder repeats a target sound.");
      for (const [index, target] of targets.entries()) {
        total += 1;
        const id = `${difficulty}-${index + 1}`;
        const round = buildRocketRunRound(target, { difficulty });
        const correct = round.correct.map(word => String(word).toLowerCase());
        const distractors = round.distractors.map(word => String(word).toLowerCase());
        check(surface, id, round.targetGrapheme === target, "Q-ARCADE-TARGET", "The spoken/displayed target and generated round target differ.");
        check(surface, id, round.needed >= 3 && correct.length >= round.needed, "Q-ARCADE-WINNABLE", "The round does not provide enough correct items to win.");
        check(surface, id, correct.every(word => onsetGrapheme(word) === target), "Q-ARCADE-KEY", "A marked-correct word does not start with the target sound.");
        check(surface, id, distractors.every(word => !sharesSound(onsetGrapheme(word), target)), "Q-ARCADE-DISTRACTOR", "A distractor starts with the same sound as the target.");
        check(surface, id, !correct.some(word => distractors.includes(word)), "Q-ARCADE-OVERLAP", "A word is both correct and a distractor.");
      }
    }
    addRow(surface, total, before);
  }

  {
    const surface = "Arcade · Letter Leap";
    const before = failures.length;
    let total = 0;
    for (const difficulty of difficulties) {
      const levels = difficultyLadder("letter-leap", difficulty);
      check(surface, `${difficulty}-ladder`, levels.length === 10, "Q-ARCADE-LADDER", "Expected exactly 10 levels.");
      for (const [index, level] of levels.entries()) {
        check(surface, `${difficulty}-${index + 1}`, ["letters", "sentence"].includes(level.mode), "Q-ARCADE-MODE", `Unknown learning mode: ${level.mode}.`);
        check(surface, `${difficulty}-${index + 1}`, level.targets.length >= 2, "Q-ARCADE-PRACTICE", "A level must provide repeated practice, not a single item.");
        for (const [targetIndex, target] of level.targets.entries()) {
          total += 1;
          const parts = Array.isArray(target) ? target : String(target).split("");
          check(surface, `${difficulty}-${index + 1}-${targetIndex + 1}`, parts.length >= 2 && parts.every(Boolean), "Q-ARCADE-TARGET", "The ordered target is empty or cannot be constructed.");
        }
      }
    }
    addRow(surface, total, before);
  }

  {
    const surface = "Arcade · Sound Racer";
    const before = failures.length;
    let total = 0;
    for (const difficulty of difficulties) {
      const targets = soundRacerLadder(difficulty);
      check(surface, `${difficulty}-ladder`, targets.length === 10, "Q-ARCADE-LADDER", "Expected exactly 10 levels.");
      for (const [index, target] of targets.entries()) {
        total += 1;
        const id = `${difficulty}-${index + 1}`;
        const track = buildTrack(target, { difficulty, seed: index + 1 });
        const wordGates = track.gates.filter(gate => gate.kind === "word");
        const correct = wordGates.filter(gate => gate.correct);
        const distractors = wordGates.filter(gate => !gate.correct);
        check(surface, id, track.target === target, "Q-ARCADE-TARGET", "The track target differs from its level target.");
        check(surface, id, track.needed >= 3 && correct.length >= track.needed, "Q-ARCADE-WINNABLE", "The track does not contain enough correct gates to win.");
        check(surface, id, correct.every(gate => onsetGrapheme(gate.word) === target), "Q-ARCADE-KEY", "A marked-correct gate does not start with the target sound.");
        check(surface, id, distractors.every(gate => !sharesSound(onsetGrapheme(gate.word), target)), "Q-ARCADE-DISTRACTOR", "A distractor gate starts with the same sound as the target.");
      }
    }
    addRow(surface, total, before);
  }

  {
    const surface = "Arcade · Word Bridge";
    const before = failures.length;
    let total = 0;
    for (const difficulty of difficulties) {
      const levels = wordBridgeLadder(difficulty);
      check(surface, `${difficulty}-ladder`, levels.length === 10, "Q-ARCADE-LADDER", "Expected exactly 10 levels.");
      for (const [index, level] of levels.entries()) {
        total += 1;
        const id = `${difficulty}-${index + 1}`;
        const correct = level.tiles.filter(tile => tile.correct).sort((a, b) => a.order - b.order);
        const expected = Array.isArray(level.target) ? level.target.join(" ") : String(level.target).toUpperCase();
        const rebuilt = correct.map(tile => tile.glyph).join(Array.isArray(level.target) ? " " : "");
        check(surface, id, level.slots === correct.length && rebuilt === expected, "Q-ARCADE-WINNABLE", "Ordered correct tiles do not rebuild the displayed target.");
        check(surface, id, level.tiles.some(tile => !tile.correct), "Q-ARCADE-DISTRACTOR", "The level has no meaningful distractor tile.");
        check(surface, id, level.decoys.every(decoy => !correct.some(tile => String(tile.glyph).toLowerCase() === String(decoy).toLowerCase())), "Q-ARCADE-OVERLAP", "A decoy duplicates a required tile.");
      }
    }
    addRow(surface, total, before);
  }

  {
    const surface = "Arcade · Sound Beat";
    const before = failures.length;
    let total = 0;
    for (const difficulty of difficulties) {
      const levels = soundBeatLadder(difficulty);
      check(surface, `${difficulty}-ladder`, levels.length === 10, "Q-ARCADE-LADDER", "Expected exactly 10 levels.");
      for (const [levelIndex, level] of levels.entries()) {
        check(surface, `${difficulty}-${levelIndex + 1}`, level.items.length >= 1, "Q-ARCADE-PRACTICE", "The level contains no beat-and-blend item.");
        for (const [itemIndex, item] of level.items.entries()) {
          total += 1;
          const id = `${difficulty}-${levelIndex + 1}-${itemIndex + 1}`;
          check(surface, id, Boolean(item.word && item.say && item.beats?.length), "Q-ARCADE-CUE", "The item lacks its word, spoken cue, or sound/word beats.");
          check(surface, id, item.beats.every(beat => String(beat).trim()), "Q-ARCADE-TARGET", "A beat is blank.");
        }
      }
    }
    addRow(surface, total, before);
  }

  {
    const surface = "Arcade · Rhyme Pop";
    const before = failures.length;
    let total = 0;
    for (const difficulty of difficulties) {
      const levels = rhymePopLadder(difficulty);
      check(surface, `${difficulty}-ladder`, levels.length === 10, "Q-ARCADE-LADDER", "Expected exactly 10 levels.");
      for (const [index, level] of levels.entries()) {
        total += 1;
        const id = `${difficulty}-${index + 1}`;
        const correct = level.rhymingWords.map(word => String(word).toLowerCase());
        const distractors = level.distractors.map(word => String(word).toLowerCase());
        check(surface, id, Boolean(level.targetWord && level.rime), "Q-ARCADE-CUE", "The level lacks a target word or displayed rime.");
        check(surface, id, correct.length >= level.correctVisible, "Q-ARCADE-WINNABLE", "There are too few rhyming words for the visible correct targets.");
        check(surface, id, !correct.some(word => distractors.includes(word)), "Q-ARCADE-OVERLAP", "A balloon word is both a rhyme and a distractor.");
        check(surface, id, new Set([...correct, ...distractors]).size === correct.length + distractors.length, "Q-ARCADE-DUPLICATE", "Duplicate balloon labels make the choice set ambiguous.");
      }
    }
    addRow(surface, total, before);
  }

  {
    const surface = "Arcade · Sound Safari";
    const before = failures.length;
    let total = 0;
    const coverage = soundSafariAudioCoverage();
    const missingAudio = Object.values(coverage).flatMap(tier => tier.missing || []);
    check(surface, "recorded-audio", missingAudio.length === 0, "Q-TARGET-AUDIO", `Missing recorded target audio: ${missingAudio.join(", ")}`);
    for (const difficulty of difficulties) {
      const levels = soundSafariLadder(difficulty);
      check(surface, `${difficulty}-ladder`, levels.length === 10, "Q-ARCADE-LADDER", "Expected exactly 10 levels.");
      for (const [levelIndex, level] of levels.entries()) {
        for (const [wordIndex, item] of level.words.entries()) {
          total += 1;
          const id = `${difficulty}-${levelIndex + 1}-${wordIndex + 1}`;
          const correct = item.graphemes.map(part => String(part).toLowerCase());
          const decoys = item.decoys.map(part => String(part).toLowerCase());
          check(surface, id, JSON.stringify(correct) === JSON.stringify(segmentWord(item.word)), "Q-ARCADE-WINNABLE", "The ordered sound sequence does not match the target word's phoneme segmentation.");
          check(surface, id, !decoys.some(decoy => correct.includes(decoy)), "Q-ARCADE-OVERLAP", "A decoy duplicates a required grapheme.");
          check(surface, id, new Set(decoys).size === decoys.length, "Q-ARCADE-DUPLICATE", "The decoy set contains duplicate graphemes.");
        }
      }
    }
    addRow(surface, total, before);
  }

  {
    const surface = "Arcade · Reel & Read";
    const before = failures.length;
    let total = 0;
    for (const difficulty of difficulties) {
      const levels = reelReadLadder(difficulty);
      check(surface, `${difficulty}-ladder`, levels.length === 10, "Q-ARCADE-LADDER", "Expected exactly 10 levels.");
      for (const [index, level] of levels.entries()) {
        total += 1;
        const id = `${difficulty}-${index + 1}`;
        check(surface, id, Boolean(level.prompt && level.cue && level.target), "Q-ARCADE-CUE", "The level lacks a clear instruction, spoken cue, or target.");
        check(surface, id, level.correctWords.length >= 1, "Q-ARCADE-WINNABLE", "The level has no correct catch.");
        check(surface, id, !level.correctWords.some(word => level.distractors.includes(word)), "Q-ARCADE-OVERLAP", "A fish is both correct and a distractor.");
        check(surface, id, new Set([...level.correctWords, ...level.distractors]).size === level.correctWords.length + level.distractors.length, "Q-ARCADE-DUPLICATE", "Duplicate fish labels make the task ambiguous.");
      }
    }
    addRow(surface, total, before);
  }

  {
    const surface = "Arcade · Sentence Grove";
    const before = failures.length;
    let total = 0;
    for (const difficulty of difficulties) {
      const levels = starGalleryLadder(difficulty);
      check(surface, `${difficulty}-ladder`, levels.length === 10, "Q-ARCADE-LADDER", "Expected exactly 10 levels.");
      for (const [levelIndex, level] of levels.entries()) {
        for (const item of level.items) {
          for (const repair of item.repairs) {
            total += 1;
            const id = `${difficulty}-${levelIndex + 1}-${repair.id}`;
            record(surface, id, auditQuestionAgainstPolicy({
              id,
              prompt: repair.prompt,
              choices: repair.options,
              answer: repair.answer,
              image: repair.cue,
              spokenPrompt: `${repair.prompt}. ${repair.display}`
            }, {
              ageBand: difficulty === "easy" ? "A" : difficulty === "medium" ? "B" : "C",
              requireId: true,
              requireVisual: true,
              requireSpoken: true,
              hasContextVisual: Boolean(repair.cue),
              hasSurfaceSpeaker: true,
              caseSensitiveOptions: repair.category === "capital",
              orthographySensitiveOptions: ["contraction", "usage"].includes(repair.category)
            }), { difficulty });
          }
        }
      }
    }
    addRow(surface, total, before);
  }

  {
    const surface = "Arcade · Sentence Express";
    const before = failures.length;
    let total = 0;
    for (const difficulty of difficulties) {
      const levels = buildLine(difficulty);
      check(surface, `${difficulty}-ladder`, levels.length === 10, "Q-ARCADE-LADDER", "Expected exactly 10 levels.");
      for (const [levelIndex, level] of levels.entries()) {
        for (const [trainIndex, train] of level.trains.entries()) {
          total += 1;
          const id = `${difficulty}-${levelIndex + 1}-${trainIndex + 1}`;
          check(surface, id, train.words.length >= 3 && train.words.every(Boolean), "Q-ARCADE-TARGET", "The target sentence is incomplete.");
          check(surface, id, train.faults.length >= 1, "Q-ARCADE-TASK", "The train has no literacy fault for the child to repair.");
          check(surface, id, [".", "?", "!"].includes(train.endMark), "Q-ARCADE-PUNCTUATION", "The target sentence has no valid end mark.");
          check(surface, id, new Set(train.sidingOrder).size === train.sidingOrder.length && train.sidingOrder.every(position => position >= 0 && position < train.words.length), "Q-ARCADE-WINNABLE", "The shuffled word order is not a valid permutation.");
        }
      }
    }
    addRow(surface, total, before);
  }

  {
    const surface = "Arcade · Spell & Skate";
    const before = failures.length;
    let total = 0;
    for (const difficulty of difficulties) {
      const levels = grammarGrindLadder(difficulty);
      check(surface, `${difficulty}-ladder`, levels.length === 10, "Q-ARCADE-LADDER", "Expected exactly 10 levels.");
      for (const [index, level] of levels.entries()) {
        total += 1;
        const id = `${difficulty}-${index + 1}`;
        record(surface, id, auditQuestionAgainstPolicy({
          ...level,
          id,
          choices: level.options,
          answer: level.correct,
          spokenPrompt: `${level.prompt} ${level.audioWord}`
        }, {
          ageBand: difficulty === "easy" ? "A" : difficulty === "medium" ? "B" : "C",
          requireId: true,
          requireSpoken: true,
          hasSurfaceSpeaker: true
        }), { difficulty });
        check(surface, id, level.segments.length >= 2 && level.segments.every(Boolean), "Q-ARCADE-TARGET", "The target has no usable ordered grapheme sequence.");
        check(surface, id, level.options.includes(level.correct), "Q-ARCADE-KEY", "The correct spelling is not one of the gates.");
        check(surface, id, new Set(level.options.map(option => String(option).toLowerCase())).size === level.options.length, "Q-ARCADE-DUPLICATE", "Duplicate spelling gates make the choice ambiguous.");
      }
    }
    addRow(surface, total, before);
  }

  const surface = "Sentence Fix question bank";
  const before = failures.length;
  let total = 0;
  for (const [difficulty, rounds] of Object.entries(SENTENCE_FIX)) {
    for (const [index, round] of rounds.entries()) {
      total += 1;
      const id = `sentence-fix-${difficulty}-${index + 1}`;
      record(surface, id, auditQuestionAgainstPolicy({
        ...round,
        id,
        spokenPrompt: round.say
      }, {
        ageBand: difficulty === "easy" ? "A" : difficulty === "medium" ? "B" : "C",
        requireId: true,
        requireSpoken: true,
        caseSensitiveOptions: round.kind === "capital"
      }), { difficulty });
    }
  }
  addRow(surface, total, before);
}

function auditWorksheets() {
  const surface = "Generated worksheets";
  const before = failures.length;
  let documents = 0;
  let imageBackedMissingLetterPrompts = 0;
  for (const option of worksheetCycleOptions()) {
    const cycle = getWorksheetCycle(option.id);
    for (const type of availableWorksheetTypes(cycle)) {
      documents += 1;
      const { html } = buildWorksheetDocument({ cycleId: option.id, type, pages: 2 });
      if (!/<section\s+class="page"(?:\s|>)/.test(html)) {
        record(surface, `${option.id}-${type}`, [{ code: "Q-WORKSHEET-EMPTY", message: "Worksheet did not render a printable page." }]);
      }
      if (type === "wordBuilding") {
        const missingLetterPrompts = [...html.matchAll(/<div class="ws-fill"[^>]*>([\s\S]*?)<\/div>/g)].map(match => match[1]);
        imageBackedMissingLetterPrompts += missingLetterPrompts.length;
        for (const [index, promptHtml] of missingLetterPrompts.entries()) {
          if (!/<img\s/.test(promptHtml) || !/alt="[^"]+"/.test(promptHtml)) {
            record(surface, `${option.id}-${type}-${index + 1}`, [{ code: "Q-WORKSHEET-IMAGE", message: "Missing-letter prompt lacks an image with alt text." }]);
          }
        }
      }
    }
  }
  if (!WORKSHEET_TYPES.some(type => type.id === "wordBuilding")) {
    record(surface, "worksheet-types", [{ code: "Q-WORKSHEET-TYPE", message: "Word-building worksheets are unavailable." }]);
  }
  rows.push({ surface, questions: imageBackedMissingLetterPrompts, documents, failures: failures.length - before });
}

await auditAssessments();
auditGuidedReading();
auditStoryStops();
auditElQuest();
auditArcade();
auditWorksheets();

const report = {
  policyVersion: QUESTION_DESIGN_POLICY_VERSION,
  generatedAt: new Date().toISOString(),
  verdict: failures.length ? "fail" : "pass",
  totals: {
    surfaces: rows.length,
    questions: rows.reduce((sum, row) => sum + row.questions, 0),
    failures: failures.length
  },
  surfaces: rows,
  assessmentSkills: skillRows,
  failures
};

const surfaceTable = rows.map(row => `| ${row.surface} | ${row.questions} | ${row.documents || "—"} | ${row.failures === 0 ? "PASS" : `FAIL (${row.failures})`} |`).join("\n");
const skillTable = skillRows.map(row => `| ${row.skillId} | ${row.questions} | ${row.failures === 0 ? "PASS" : `FAIL (${row.failures})`} |`).join("\n");
const findingLines = failures.length
  ? failures.map(item => `- **${item.code}** \`${item.surface}/${item.id}\`: ${item.message}`).join("\n")
  : "- None. All machine-checkable rules passed.";
const markdown = `# Question Design Policy Audit\n\n**Policy:** \`${QUESTION_DESIGN_POLICY_VERSION}\`  \n**Generated:** ${report.generatedAt}  \n**Verdict:** **${report.verdict.toUpperCase()}**  \n\nThis report audits real runtime assessment output plus every registered Guided Reading quiz, Story Stop cover question, numbered EL Quest station, every level of all 11 visible arcade literacy games, the Sentence Fix bank and every generated worksheet recipe. It complements the specialist story, phonics, media and mastery gates; it does not replace child observation or claim that software alone proves validity.\n\n## Surface results\n\n| Surface | Questions/tasks | Documents | Result |\n|---|---:|---:|---|\n${surfaceTable}\n\n## All 30 assessment skills\n\n| Skill | Runtime questions | Result |\n|---|---:|---|\n${skillTable}\n\n## Findings\n\n${findingLines}\n\n## Release interpretation\n\nA PASS means all declared machine-checkable requirements in [the Question Design Bible](../../docs/content/QUESTION_DESIGN_BIBLE.md) have evidence at runtime. Routine named human sign-off is not a release gate. New observed ambiguity, access or validity problems must become a policy revision and regression check.\n`;

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`);
fs.writeFileSync(REPORT_MD, markdown);

console.log(`Question policy ${report.verdict.toUpperCase()}: ${report.totals.questions} questions/tasks across ${report.totals.surfaces} surfaces; ${failures.length} failures.`);
console.log(path.relative(ROOT, REPORT_MD));
if (failures.length) {
  for (const finding of failures.slice(0, 40)) console.error(`${finding.code} ${finding.surface}/${finding.id}: ${finding.message}`);
  process.exitCode = 1;
}
