import { ASSESSMENT_PATH_STEPS, comparableSentenceAnswer, configuredCoverageTotals, debugAssessmentCoverage, formatCoverageKeyLabel, getRoundItemLabels, getAssessmentPathKey, getAssessmentPathLabel, getAssessmentQuestionLevel, getAssessmentQuestionPhase, getConfiguredPhaseItemKeys, getCoverageItemKeysForStage, getQuestionAnswer, getQuestionPathStep, getQuestionPrompt, getQuestionTargetWord, getRuntimeQuestionPromptAnswerSignature, getRuntimeQuestionSignature, getFinalSoundQuestionLevel, getStageIndex, inferItemMetadata, inferAnswerRecordMetadata, isFinalSoundsStage, isFixSentenceQuestion, isInitialSoundsStage, isListenChooseVowelQuestion, isMissingItemMasteryTableError, isPairSelectionQuestion, isPureEarlyPhonicsStage, isQuestionBlockedByMediaQa, normalizeAnswerRecordShape, normalizeAssessmentQuestion, normalizeItemKey, normalizeMultiSelectAnswer, normalizePairSelectionAnswer, normalizeSentenceAnswer } from "./assessmentRuntime.js";
import { supabase } from "../supabaseClient";
import { skillTree } from "../skillTree";
import { questionUsesFailedAssessmentMedia } from "../policy/assessmentMediaEvidence.js";
import { normalize, shuffleArray } from "../utils/assessmentRoundBuilder";
import { getQuestionRoutingFormat } from "../data/skillTemplateRouting";
import { createAssessmentRoundDuplicateProfile, getAssessmentRoundDuplicateFlags, selectAssessmentRoundCandidate } from "../data/assessmentRoundSelector.js";
import { getFinalSoundsLevel1QuestionIssues } from "../data/earlyPhonicsValidation";
import { buildFinalSoundAvailableWordMap, evaluateFinalSoundLevelOneMasteryDepth, finalSoundLevelOneTargets, getFinalSoundTargetFromEvidence } from "../data/finalSoundMasteryDepth";
import { getQuestionFormatMetadata, isMasteryEligible } from "../questionFormatFramework";
import { getBlueprintUnitRuleByItem } from "../content/blueprints/skillBlueprints.js";
import { buildInitialSoundsProgressFromAnswerHistory, getInitialSoundRoundPlan } from "../content/initialSounds/initialSoundSelector";
import { INITIAL_SOUND_LETTERS } from "../content/initialSounds/initialSoundWordBank";
import { getAnswerRecordPromptAnswerSignature, getRepeatOptionSetSignature } from "../questionRepeatGuards";
import { getEarlySkillRuntimeEligibilityIssues, getTargetObjectImage, isRuntimeEligibleEarlySkillQuestion, normalizeEarlySkillId } from "../utils/earlySkills/isRuntimeEligibleEarlySkillQuestion";
import { buildAssessmentAttemptRecord, extractMasteryFromAssessmentAttempt, loadAssessmentAttempts, mergeAssessmentAttemptRecords, mergeAssessmentAttemptIntoItemMastery, saveAssessmentAttempt } from "../data/assessmentHistoryStore";
import { buildSkillMasterySummaryRows } from "../data/skillMasterySummary.js";
import { isGenericInstructionAudioPath } from "../utils/assessmentAudioPolicy.js";
import { APP_VIEWS } from "./appViews.js";
import { getAssessmentAttemptType } from "./assessmentSessionHelpers.js";
import { preloadQuestionMediaBatch } from "../utils/preloadQuestionMedia.js";
import { speakWithBrowser as speakWithBrowserFallback } from "../utils/audio/speakWithBrowser.js";
import { playCueAudio } from "../utils/audio/cuePlayer.js";
import { insertWithRetry } from "../utils/insertQueue.js";
import {
  assessmentAttemptsToSkillLedger,
  computeSkillStatus,
  SKILL_STATUS_IDS
} from "../policy/skillStatusPolicy.js";
import {
  saveStudentFocusAssessmentAnswer,
  saveStudentFocusAssessmentAttempt,
  saveStudentFocusItemMastery
} from "../data/studentFocusSessionCore.js";
import { STUDENT_FOCUS_TARGETS } from "../policy/studentFocusTargets.js";

export function createAssessmentRoundController(context) {
  const {
    allQuestionsRef, answerHistory, answerHistoryRef, answerInFlightRef,
    assessmentActiveRef, assessmentMediaPickerRef, assessmentMediaUsageRef, assessmentMode,
    currentQuestion, currentSkillIndex, currentStage, excludeSessionMediaFailures,
    failedAssessmentMediaRef, initialSoundForcedLevelRef, initialSoundRoundAskedLettersRef, initialSoundRoundMetaRef,
    initialSoundRoundQueueRef, itemMastery, itemSessionSeen, mastery,
    PASS_SCORE, resetAssessmentMediaUsage, ROUND_LENGTH, roundAnswers,
    roundItemKeys, roundItemKeysRef, roundQuestionIdsRef, selectedClassId,
    setAnswerHistory, setAppView, setAssessmentHistory, setAssessmentTransitioning,
    setCheckpointDecision, setCorrectAnswered, setCurrentQuestion, setDiagnosticFollowUp,
    setFeedback, setItemMastery, setItemSessionSeen, setMastery,
    setMessage, setRoundAnswers, setRoundItemKeys, setRoundQuestionIds,
    setShowConfetti, setTotalAnswered, setUsedByStage, studentId,
    studentName, teacherId, usedByStage, weaknessSnapshot,
    studentFocusSession = null, studentSessionToken = "", studentSessionTeacherId = "",
    onStudentFocusAssessmentComplete = null,
  } = context;
  const independentFocusAssessment = Boolean(
    studentFocusSession?.id
    && studentFocusSession.target === STUDENT_FOCUS_TARGETS.SKILLS_ASSESSMENT
    && studentSessionToken
  );
  const evidenceTeacherId = teacherId
    || studentFocusSession?.teacher_id
    || studentSessionTeacherId
    || "local";

  function makeEvidenceEventId(prefix = "evidence") {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function getStageAssessmentRecords(stage) {
    if (!stage) return [];
    return answerHistoryRef.current.filter(record =>
      record.skillId === stage.id || record.stage === stage.label
    );
  }

  function getPassedAssessmentPathKeys(stage) {
    const records = getStageAssessmentRecords(stage)
      .filter(record => Number(record.itemLevel || 0) > 0 && Number(record.itemPhase || 0) > 0);
    const passedKeys = new Set();

    for (let index = 0; index < records.length; index += ROUND_LENGTH) {
      const round = records.slice(index, index + ROUND_LENGTH);
      if (round.length < ROUND_LENGTH) continue;
      const score = round.filter(record => record.isCorrect).length;
      if (score < PASS_SCORE) continue;
      const last = round.at(-1) || {};
      const step = {
        level: Number(last.itemLevel || 1) >= 2 ? 2 : 1,
        phase: Number(last.itemPhase || 1) === 2 ? 2 : 1
      };
      passedKeys.add(getAssessmentPathKey(step));
    }

    return passedKeys;
  }

  function hasConfiguredPhaseCoverage(stage, step = {}) {
    return Boolean(getConfiguredPhaseItemKeys(stage, step.level, step.phase)?.length);
  }

  function hasAssessmentPathQuestions(stage, step = {}) {
    if (!stage || !step) return false;
    const stageIndex = skillTree.findIndex(item => item.id === stage.id);
    const requiresExplicitPhase = hasConfiguredPhaseCoverage(stage, step);
    return allQuestionsRef.current.filter(question =>
      getStageIndex(question) === stageIndex &&
      !isQuestionBlockedByMediaQa(question) &&
      getAssessmentQuestionLevel(stage, question) === Number(step.level || 1) &&
      (
        requiresExplicitPhase
          ? getAssessmentQuestionPhase(question) === Number(step.phase || 1)
          : (getAssessmentQuestionPhase(question) || Number(step.phase || 1)) === Number(step.phase || 1)
      )
    ).length >= ROUND_LENGTH;
  }

  // The student-session RPCs validate every answer and the final attempt
  // against the level/phase the teacher assigned, and never store those values
  // themselves. The v3 bank's own `phase` means something different (an
  // alphabet split: Initial Sounds level 1 is a-m phase 1, n-z phase 2), and the
  // round selectors pick items without regard to it, so reporting a question's
  // authored phase made the server reject legitimate answers as
  // `assignment_mismatch` - which the UI then showed as a connection failure.
  // Report the assignment, which is what the check is actually about.
  function getAssignedFocusStep() {
    const assigned = studentFocusSession?.resolved_config || {};
    const level = Number(assigned.level);
    const phase = Number(assigned.phase);
    return {
      level: [1, 2].includes(level) ? level : null,
      phase: [1, 2].includes(phase) ? phase : null
    };
  }

  function getNextAssessmentPathStep(stage) {
    const assigned = studentFocusSession?.resolved_config || {};
    if (
      independentFocusAssessment
      && stage?.id === assigned.skill_id
      && [1, 2].includes(Number(assigned.level))
      && [1, 2].includes(Number(assigned.phase))
    ) {
      return { level: Number(assigned.level), phase: Number(assigned.phase) };
    }
    const passedKeys = getPassedAssessmentPathKeys(stage);
    const nextUnpassed = ASSESSMENT_PATH_STEPS.find(step =>
      !passedKeys.has(getAssessmentPathKey(step)) &&
      (isInitialSoundsStage(stage) || hasAssessmentPathQuestions(stage, step))
    );
    if (nextUnpassed) return nextUnpassed;

    // A thin or temporarily media-blocked bank must not jump over an unpassed
    // phase. Keep the four-stage order and let the assessment start surface
    // explain that content is unavailable.
    return ASSESSMENT_PATH_STEPS.find(step =>
      !passedKeys.has(getAssessmentPathKey(step))
    ) || ASSESSMENT_PATH_STEPS.at(-1);
  }

  function getCheckpointPathStatus(stage, currentStep = {}) {
    const currentKey = getAssessmentPathKey(currentStep);
    const index = Math.max(0, ASSESSMENT_PATH_STEPS.findIndex(step => getAssessmentPathKey(step) === currentKey));
    const nextStep = ASSESSMENT_PATH_STEPS[index + 1] || null;
    const passedKeys = getPassedAssessmentPathKeys(stage);
    const levelOnePassed = passedKeys.has("L1P1") && passedKeys.has("L1P2");
    const levelTwoPassed = passedKeys.has("L2P1") && passedKeys.has("L2P2");
    const finalStepComplete = levelTwoPassed || currentKey === "L2P2";
    const nextActionLabel = currentKey === "L1P2" && levelOnePassed
      ? "Try optional Level 2 Phase 1"
      : finalStepComplete
        ? "Move to next skill"
        : ASSESSMENT_PATH_STEPS[index].nextLabel;
    return {
      level: Number(currentStep.level || 1) >= 2 ? 2 : 1,
      phase: Number(currentStep.phase || 1) === 2 ? 2 : 1,
      label: getAssessmentPathLabel(currentStep),
      nextStep,
      nextActionLabel,
      finalStepComplete,
      levelOnePassed,
      levelTwoPassed,
      nextSkillUnlocked: levelOnePassed,
      level2Unlocked: levelOnePassed,
      level2Optional: true,
      nextSkillLabel: skillTree[(skillTree.findIndex(item => item.id === stage?.id) + 1)]?.label || ""
    };
  }

  function getInitialSoundStageProgress(records = answerHistoryRef.current) {
    return buildInitialSoundsProgressFromAnswerHistory(records);
  }

  // Clear the queue AND forget which letters this round has asked. Every
  // fresh-round reset routes through here; a mid-round rebuild does not, so it
  // still sees the round's asked letters.
  function resetInitialSoundRoundQueue() {
    initialSoundRoundQueueRef.current = [];
    initialSoundRoundAskedLettersRef.current = new Set();
  }

  function ensureInitialSoundRoundState() {
    if (!Array.isArray(initialSoundRoundQueueRef.current)) {
      initialSoundRoundQueueRef.current = [];
    }
    if (!(initialSoundRoundAskedLettersRef.current instanceof Set)) {
      initialSoundRoundAskedLettersRef.current = new Set();
    }
    return initialSoundRoundQueueRef.current;
  }

  function buildInitialSoundRoundQueue({ excludeLetters = [] } = {}) {
    const progress = getInitialSoundStageProgress();
    const forcedLevel = initialSoundForcedLevelRef.current;
    const stage = skillTree.find(item => item.id === "initial_sounds");
    const pathStep = getNextAssessmentPathStep(stage);
    const level = forcedLevel || pathStep.level;
    const phase = forcedLevel ? 1 : pathStep.phase;
    initialSoundForcedLevelRef.current = null;
    const runtimeInitialSoundItems = allQuestionsRef.current.filter(question =>
      normalizeEarlySkillId(question.skillId || question.assessmentSkillId || question.skill) === "initial_sounds"
    );
    const plan = getInitialSoundRoundPlan({
      studentProgress: { initialSoundsProgress: progress },
      level,
      roundNumber: level === 2 ? phase + 2 : phase,
      seed: Date.now() + Math.floor(Math.random() * 1000000),
      excludeLetters,
      // Initial Sounds has a custom adaptive selector, but its question source
      // is still the gate-published v3 bank loaded into allQuestionsRef. The old
      // selector silently read its separate legacy word bank, which the v3
      // routing guard correctly rejected and left every letter blocked.
      itemBank: runtimeInitialSoundItems,
      requireImportedMedia: false,
      itemEligibility: item => isRuntimeEligibleEarlySkillQuestion(item, {
        skillId: "initial_sounds",
        level
      }),
      itemFilter: item => !questionUsesFailedAssessmentMedia(item, failedAssessmentMediaRef.current)
    });

    initialSoundRoundQueueRef.current = plan.items;
    initialSoundRoundMetaRef.current = plan.meta;

    debugAssessmentCoverage("initial sound round plan", {
      studentId,
      level: plan.meta.level,
      phase: plan.meta.phase,
      selectedLetters: plan.meta.selectedLetters,
      selectedTargetWords: plan.meta.selectedTargetWords,
      reviewLetters: plan.meta.reviewLetters,
      blockedLetters: plan.meta.blockedLetters,
      coveredLetters: plan.meta.coveredLetters
    });

    return plan;
  }

  function getNextInitialSoundQuestion() {
    const queue = ensureInitialSoundRoundState();
    if (queue.length === 0) {
      // Mid-round rebuild (asked-letters set is non-empty): exclude letters
      // already asked so we don't repeat them. Fresh rounds cleared the set via
      // resetInitialSoundRoundQueue, so nothing is excluded there.
      buildInitialSoundRoundQueue({
        excludeLetters: [...initialSoundRoundAskedLettersRef.current]
      });
    }

    let skippedFailedItem = false;
    let next = queue.shift();
    while (
      next &&
      questionUsesFailedAssessmentMedia(next, failedAssessmentMediaRef.current)
    ) {
      skippedFailedItem = true;
      next = queue.shift();
    }
    if (!next && skippedFailedItem) {
      buildInitialSoundRoundQueue({
        excludeLetters: [...initialSoundRoundAskedLettersRef.current]
      });
      next = queue.shift();
    }
    if (!next) return null;

    if (next.letter) initialSoundRoundAskedLettersRef.current.add(next.letter);
    return next;
  }

  function getFinalSoundsLevelOneAvailableQuestions() {
    return allQuestionsRef.current.filter(question =>
      question.skillId === "final_sounds" &&
      !isQuestionBlockedByMediaQa(question) &&
      getFinalSoundQuestionLevel(question) === 1 &&
      getFinalSoundsLevel1QuestionIssues(question).length === 0 &&
      isRuntimeEligibleEarlySkillQuestion(question, {
        skillId: "final_sounds",
        level: 1
      })
    );
  }

  function getFinalSoundsLevelOneMasteryDepth(records = answerHistoryRef.current) {
    return evaluateFinalSoundLevelOneMasteryDepth(records, {
      availableWordsBySound: buildFinalSoundAvailableWordMap(getFinalSoundsLevelOneAvailableQuestions()),
      roundLength: ROUND_LENGTH,
      passScore: PASS_SCORE
    });
  }

  function getNextFinalSoundLevel() {
    return getFinalSoundsLevelOneMasteryDepth().levelOneMastered ? 2 : 1;
  }

  function getAvailableStageQuestions(stageIndex) {
    const stage = skillTree[stageIndex];
    if (!stage) return [];
    if (isInitialSoundsStage(stage)) {
      const queue = ensureInitialSoundRoundState();
      return excludeSessionMediaFailures(
        queue.length
          ? [...queue]
          : buildInitialSoundRoundQueue().items
      );
    }

    const stageQuestions = excludeSessionMediaFailures(
      allQuestionsRef.current.filter(q => getStageIndex(q) === stageIndex && !isQuestionBlockedByMediaQa(q))
    );
    const pathStep = getNextAssessmentPathStep(stage);
    const levelFilteredStageQuestions = stageQuestions.filter(question =>
      getAssessmentQuestionLevel(stage, question) === pathStep.level
    );
    const requiresExplicitPhase = hasConfiguredPhaseCoverage(stage, pathStep);
    const phaseFilteredStageQuestions = levelFilteredStageQuestions.filter(question =>
      requiresExplicitPhase
        ? getAssessmentQuestionPhase(question) === pathStep.phase
        : (getAssessmentQuestionPhase(question) || pathStep.phase) === pathStep.phase
    );
    const pathFilteredStageQuestions = phaseFilteredStageQuestions.length >= ROUND_LENGTH || hasConfiguredPhaseCoverage(stage, pathStep)
      ? phaseFilteredStageQuestions
      : levelFilteredStageQuestions;
    const finalSoundLevelOneGuardedQuestions = isFinalSoundsStage(stage) && pathStep.level === 1
      ? pathFilteredStageQuestions.filter(question => {
        const issues = getFinalSoundsLevel1QuestionIssues(question);
        if (issues.length > 0 && import.meta.env.DEV) {
          console.warn("Blocked Final Sounds Level 1 question by final runtime guard", {
            id: question.id,
            targetWord: question.targetWord || question.audioText,
            level: question.level,
            source: question.source || question._source || "unknown",
            issues,
            question
          });
        }
        return issues.length === 0;
      })
      : pathFilteredStageQuestions;
    const runtimeContext = {
      skillId: normalizeEarlySkillId(stage.id),
      level: pathStep.level
    };
    const runtimeFilteredStageQuestions = isPureEarlyPhonicsStage(stage)
      ? finalSoundLevelOneGuardedQuestions.filter(question => {
        const issues = getEarlySkillRuntimeEligibilityIssues(question, runtimeContext);
        if (issues.length > 0 && import.meta.env.DEV) {
          console.warn("Blocked early phonics question before runtime selection", {
            id: question.id,
            skillId: runtimeContext.skillId,
            level: runtimeContext.level,
            source: question.source || question._source || "unknown",
            issues,
            question
          });
        }
        return issues.length === 0;
      })
      : finalSoundLevelOneGuardedQuestions;
    const uncoveredFinalSoundQuestions = getUncoveredFinalSoundQuestionsForRound(runtimeFilteredStageQuestions, stage);
    if (uncoveredFinalSoundQuestions.length > 0) return uncoveredFinalSoundQuestions;

    const uncoveredRhymingQuestions = getUncoveredRhymingQuestionsForRound(runtimeFilteredStageQuestions, stage);
    if (uncoveredRhymingQuestions.length > 0) return uncoveredRhymingQuestions;

    const currentProfile = getRoundDuplicateProfile();
    const anyMemory = getStageRepeatMemory(stage.label);
    const correctMemory = getCorrectStageRepeatMemory(stage.label);
    const recentMemory = getRecentStageRepeatMemory(stage.label);
    const filterCurrentRoundRepeats = question => {
      const flags = getRoundDuplicateFlags(question, currentProfile);
      return !flags.questionId && !flags.signature;
    };
    const outsideCurrentRound = runtimeFilteredStageQuestions.filter(filterCurrentRoundRepeats);
    const globalUnseenExact = runtimeFilteredStageQuestions.filter(question =>
      !wasQuestionSeen(question, anyMemory)
    );
    const unseenExact = outsideCurrentRound.filter(question =>
      !wasQuestionSeen(question, anyMemory)
    );
    const noCorrectTargetWord = unseenExact.filter(question => {
      const target = getQuestionTargetWord(question);
      return !target || !correctMemory.targetWords.has(target);
    });
    const noRecentTargetWord = noCorrectTargetWord.filter(question => {
      const target = getQuestionTargetWord(question);
      const optionSet = getRepeatOptionSetSignature(question);
      const promptAnswer = getRuntimeQuestionPromptAnswerSignature(question);
      return (!target || !recentMemory.targetWords.has(target)) &&
        (!optionSet || !recentMemory.optionSets.has(optionSet)) &&
        (!promptAnswer || !recentMemory.promptAnswers.has(promptAnswer));
    });

    if (noRecentTargetWord.length > 0) return noRecentTargetWord;
    if (noCorrectTargetWord.length > 0) return noCorrectTargetWord;
    if (unseenExact.length > 0) return unseenExact;
    if (globalUnseenExact.length > 0) return [];

    const incorrectOnly = outsideCurrentRound.filter(question =>
      wasQuestionAnsweredIncorrectly(question, stage.label) &&
      !wasQuestionAnsweredCorrectly(question, correctMemory)
    );

    if (incorrectOnly.length > 0) return incorrectOnly;

    return getOldestReusableCorrectQuestions(outsideCurrentRound, stage.label);
  }

  function getAttemptedStageLabels() {
    return new Set(
      answerHistory
        .map(record => record.stage)
        .filter(Boolean)
    );
  }

  function getReviewQuestionPool() {
    const attemptedStageLabels =
      getAttemptedStageLabels();

    if (attemptedStageLabels.size === 0) return [];

    const allowedStageLabels =
      new Set(
        skillTree
          .slice(0, currentSkillIndex + 1)
          .map(stage => stage.label)
          .filter(label => attemptedStageLabels.has(label))
      );

    if (allowedStageLabels.size === 0) return [];

    const usedQuestionIds =
      new Set(Object.values(usedByStage).flat());

    for (const weakness of weaknessSnapshot.needsPractice) {
      if (!allowedStageLabels.has(weakness.stage)) continue;

      const correctMemory = getCorrectStageRepeatMemory(weakness.stage);

      const matches =
        allQuestionsRef.current.filter(question => {
          const stageIndex = getStageIndex(question);
          const stage = skillTree[stageIndex];

          return (
            stage &&
            allowedStageLabels.has(stage.label) &&
            getDiagnosticTarget(question) === weakness.target &&
            !usedQuestionIds.has(question.id) &&
            !isQuestionBlockedByMediaQa(question) &&
            !questionUsesFailedAssessmentMedia(question, failedAssessmentMediaRef.current) &&
            (
              !isPureEarlyPhonicsStage(stage) ||
              isRuntimeEligibleEarlySkillQuestion(question, {
                skillId: normalizeEarlySkillId(stage.id),
                level: isFinalSoundsStage(stage) ? getFinalSoundQuestionLevel(question) : (question.level || question.difficulty || 1)
              })
            ) &&
            !wasQuestionAnsweredCorrectly(question, correctMemory)
          );
        });

      if (matches.length > 0) {
        return shuffleArray(matches);
      }
    }

    return [];
  }

  function getRecentStageItemKeys(stageLabel, limit = ROUND_LENGTH * 3) {
    return answerHistoryRef.current
      .filter(record => record.stage === stageLabel)
      .slice(-limit)
      .map(inferAnswerRecordMetadata)
      .filter(metadata => metadata?.itemKey && metadata?.itemType)
      .map(metadata => getItemMasteryStateKey(metadata.itemKey, metadata.itemType));
  }

  function getAnyStageItemKeys(stageLabel) {
    return new Set(
      answerHistoryRef.current
        .filter(record => record.stage === stageLabel)
        .map(inferAnswerRecordMetadata)
        .filter(metadata => metadata?.itemKey && metadata?.itemType)
        .map(metadata => getItemMasteryStateKey(metadata.itemKey, metadata.itemType))
    );
  }

  function getRecentStageQuestionIds(stageLabel, limit = ROUND_LENGTH * 3) {
    return answerHistoryRef.current
      .filter(record => record.stage === stageLabel)
      .slice(-limit)
      .map(record => record.questionId)
      .filter(Boolean);
  }

  function getStageAnswerRecords(stageLabel) {
    return answerHistoryRef.current.filter(record => record.stage === stageLabel);
  }

  function getStageRepeatMemory(stageLabel, { correctOnly = false, limit = null } = {}) {
    const records = getStageAnswerRecords(stageLabel)
      .filter(record => !correctOnly || record.isCorrect)
      .slice(limit ? -limit : 0);

    return {
      questionIds: new Set(records.map(record => record.questionId).filter(Boolean)),
      signatures: new Set(records.map(record => record.questionSignature).filter(Boolean)),
      promptAnswers: new Set(records.map(record =>
        record.promptAnswerSignature || getAnswerRecordPromptAnswerSignature(record)
      ).filter(Boolean)),
      optionSets: new Set(records.map(record => record.optionSetSignature).filter(Boolean)),
      targetWords: new Set(records.map(record => record.targetWord).filter(Boolean))
    };
  }

  function getCorrectStageRepeatMemory(stageLabel) {
    return getStageRepeatMemory(stageLabel, { correctOnly: true });
  }

  function getRecentStageRepeatMemory(stageLabel) {
    return getStageRepeatMemory(stageLabel, { limit: ROUND_LENGTH * 3 });
  }

  function wasQuestionAnsweredCorrectly(question, memory = getCorrectStageRepeatMemory(skillTree[getStageIndex(question)]?.label)) {
    const questionId = question.id || "";
    const signature = getRuntimeQuestionSignature(question);

    return Boolean(
      (questionId && memory.questionIds.has(questionId)) ||
      (signature && memory.signatures.has(signature))
    );
  }

  function wasQuestionSeen(question, memory = getStageRepeatMemory(skillTree[getStageIndex(question)]?.label)) {
    const questionId = question.id || "";
    const signature = getRuntimeQuestionSignature(question);

    return Boolean(
      (questionId && memory.questionIds.has(questionId)) ||
      (signature && memory.signatures.has(signature))
    );
  }

  function wasQuestionAnsweredIncorrectly(question, stageLabel) {
    const questionId = question.id || "";
    const signature = getRuntimeQuestionSignature(question);

    return getStageAnswerRecords(stageLabel).some(record =>
      !record.isCorrect &&
      (
        (questionId && record.questionId === questionId) ||
        (signature && record.questionSignature === signature)
      )
    );
  }

  function getOldestReusableCorrectQuestions(questions, stageLabel) {
    const correctRecords = getStageAnswerRecords(stageLabel)
      .filter(record => record.isCorrect)
      .map((record, index) => ({
        record,
        index,
        promptAnswer: record.promptAnswerSignature || getAnswerRecordPromptAnswerSignature(record)
      }));
    const ageByPromptAnswer = new Map();
    const ageByQuestionId = new Map();
    const ageBySignature = new Map();

    correctRecords.forEach(({ record, index, promptAnswer }) => {
      if (record.questionId && !ageByQuestionId.has(record.questionId)) ageByQuestionId.set(record.questionId, index);
      if (record.questionSignature && !ageBySignature.has(record.questionSignature)) ageBySignature.set(record.questionSignature, index);
      if (promptAnswer && !ageByPromptAnswer.has(promptAnswer)) ageByPromptAnswer.set(promptAnswer, index);
    });

    return [...questions].sort((a, b) => {
      const ageA =
        ageByQuestionId.get(a.id) ??
        ageBySignature.get(getRuntimeQuestionSignature(a)) ??
        ageByPromptAnswer.get(getRuntimeQuestionPromptAnswerSignature(a)) ??
        Number.MAX_SAFE_INTEGER;
      const ageB =
        ageByQuestionId.get(b.id) ??
        ageBySignature.get(getRuntimeQuestionSignature(b)) ??
        ageByPromptAnswer.get(getRuntimeQuestionPromptAnswerSignature(b)) ??
        Number.MAX_SAFE_INTEGER;

      return ageA - ageB;
    });
  }

  function getQuestionSelectionRank(question, activeStage) {
    const metadata = inferItemMetadata(question);
    if (!metadata?.itemKey || !metadata?.itemType) return 6;

    const key = getItemMasteryStateKey(metadata.itemKey, metadata.itemType);
    const row = itemMastery[key];
    const currentRoundKeys = new Set(roundItemKeysRef.current);
    const currentRoundQuestionIds = new Set(roundQuestionIdsRef.current);
    const currentRoundTargetWords = new Set(
      roundQuestionIdsRef.current
        .map(id => allQuestionsRef.current.find(item => item.id === id))
        .filter(Boolean)
        .map(getQuestionTargetWord)
        .filter(Boolean)
    );
    const recentKeys = new Set(getRecentStageItemKeys(activeStage.label));
    const allAttemptedKeys = getAnyStageItemKeys(activeStage.label);
    const recentQuestionIds = new Set(getRecentStageQuestionIds(activeStage.label));

    if (currentRoundKeys.has(key)) return 5;
    if (currentRoundQuestionIds.has(question.id) || recentQuestionIds.has(question.id)) return 5;
    if (getQuestionTargetWord(question) && currentRoundTargetWords.has(getQuestionTargetWord(question))) return 4;
    if (!row && !allAttemptedKeys.has(key)) return 0;
    if (row && !row.mastered && row.correct === 0) return 1;
    if (row && !row.mastered) return 2;
    if (recentKeys.has(key)) return 4;

    return row?.mastered || row?.correct > 0 ? 5 : 3;
  }

  function getCoveredStageItemKeys(stage, options = {}) {
    const expectedKeys = getCoverageItemKeysForStage(stage, {
      finalSoundLevel: stage?.id === "final_sounds" ? getNextFinalSoundLevel() : null,
      level: options.level || null,
      phase: options.phase || null
    });
    const covered = new Set();

    const rows = {
      ...(itemMastery || {}),
      ...(options.itemMasteryOverrides || {})
    };
    Object.values(rows)
      // Coverage is a mastery claim, not an exposure count. One correct answer
      // remains useful evidence but cannot advance a formal skill path.
      .filter(row => row?.itemKey && row?.itemType && row.mastered)
      .map(row => getItemMasteryStateKey(row.itemKey, row.itemType))
      .filter(key => expectedKeys.has(key))
      .forEach(key => covered.add(key));

    return covered;
  }

  function getUncoveredFinalSoundQuestionsForRound(questions, stage) {
    if (!isFinalSoundsStage(stage)) return [];
    const pathStep = getNextAssessmentPathStep(stage);
    const level = Number(pathStep.level || 1) >= 2 ? 2 : 1;

    const expectedKeys = getCoverageItemKeysForStage(stage, { level });
    const coveredKeys = getCoveredStageItemKeys(stage, { level });
    const currentRoundKeys = new Set(roundItemKeysRef.current);
    const missingKeys = new Set(
      Array.from(expectedKeys).filter(key => !coveredKeys.has(key) && !currentRoundKeys.has(key))
    );

    if (missingKeys.size === 0) return [];

    const missingQuestions = questions.filter(question => {
      const key = getQuestionItemKey(question);
      return key && missingKeys.has(key);
    });

    debugAssessmentCoverage("final sound uncovered selection", {
      studentId,
      level,
      missingKeys: Array.from(missingKeys).map(formatCoverageKeyLabel),
      selectableMissingKeys: Array.from(new Set(missingQuestions.map(getQuestionItemKey).filter(Boolean))).map(formatCoverageKeyLabel),
      selectableQuestionCount: missingQuestions.length
    });

    return prioritizeCoverageQuestions(missingQuestions, stage);
  }

  function getUncoveredRhymingQuestionsForRound(questions, stage) {
    if (stage?.id !== "rhyming") return [];
    const pathStep = getNextAssessmentPathStep(stage);

    const expectedKeys = getCoverageItemKeysForStage(stage, {
      level: pathStep.level,
      phase: pathStep.phase
    });
    const coveredKeys = getCoveredStageItemKeys(stage, { level: pathStep.level, phase: pathStep.phase });
    const currentRoundKeys = new Set(roundItemKeysRef.current);
    const missingKeys = new Set(
      Array.from(expectedKeys).filter(key => !coveredKeys.has(key) && !currentRoundKeys.has(key))
    );

    if (missingKeys.size === 0) return [];

    return prioritizeCoverageQuestions(
      questions.filter(question => {
        const key = getQuestionItemKey(question);
        return key && missingKeys.has(key);
      }),
      stage
    );
  }

  function getCurrentRoundQuestionObjects() {
    return roundQuestionIdsRef.current
      .map(id => allQuestionsRef.current.find(item => item.id === id))
      .filter(Boolean);
  }

  function getRoundDuplicateProfile() {
    return createAssessmentRoundDuplicateProfile(getCurrentRoundQuestionObjects(), {
      selectedItemKeys: roundItemKeysRef.current,
      getItemKey: getQuestionItemKey
    });
  }

  function getRoundDuplicateFlags(question, profile = getRoundDuplicateProfile()) {
    return getAssessmentRoundDuplicateFlags(question, profile, {
      getItemKey: getQuestionItemKey
    });
  }

  function selectNonDuplicateRoundCandidate(prioritized, activeStage) {
    const selection = selectAssessmentRoundCandidate(prioritized, {
      selectedQuestions: getCurrentRoundQuestionObjects(),
      selectedItemKeys: roundItemKeysRef.current,
      skillId: activeStage?.id,
      roundLength: ROUND_LENGTH,
      getItemKey: getQuestionItemKey
    });
    const picked = selection.question;
    if (!picked) {
      debugAssessmentCoverage("round duplicate guard blocked pool", {
        studentId,
        skill: activeStage.label,
        poolSize: prioritized.length,
        currentRoundQuestionIds: roundQuestionIdsRef.current,
        currentRoundItemKeys: roundItemKeysRef.current
      });
      return null;
    }

    debugAssessmentCoverage("round duplicate guard", {
      studentId,
      skill: activeStage.label,
      poolSize: prioritized.length,
      exactSafeCandidates: selection.exactSafeCount,
      strictCandidates: selection.strictCount,
      duplicateRelaxation: selection.duplicateRelaxation,
      templateCap: `${selection.maxTemplateCount}/${ROUND_LENGTH}`,
      selectedQuestionId: picked?.id || "",
      selectedTargetWord: picked ? getQuestionTargetWord(picked) : "",
      selectedItemKey: picked ? getQuestionItemKey(picked) : "",
      selectedSignature: picked ? getRuntimeQuestionSignature(picked) : "",
      duplicateFlags: picked ? getRoundDuplicateFlags(picked, selection.profile) : {}
    });

    return picked;
  }

  function prioritizeCoverageQuestions(questions, activeStage) {
    const grouped = questions.reduce((groups, question) => {
      const rank = getQuestionSelectionRank(question, activeStage);
      groups[rank] = [...(groups[rank] || []), question];
      return groups;
    }, {});

    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .flatMap(rank => shuffleArray(grouped[rank]));
  }

  function getQuestionItemKey(question) {
    const metadata = inferItemMetadata(question);
    return metadata?.itemKey && metadata?.itemType
      ? getItemMasteryStateKey(metadata.itemKey, metadata.itemType)
      : "";
  }

  function prepareQuestion(question, isTargetedReview = false) {
    const rawStage = skillTree[getStageIndex(question)];
    const fallbackSkillId = rawStage?.id || currentStage?.id || null;
    const normalizedQuestion = normalizeAssessmentQuestion(question, fallbackSkillId, roundAnswers.length);
    if (!normalizedQuestion) return null;

    const stage = rawStage || skillTree[getStageIndex(normalizedQuestion)] || currentStage;
    if (isPureEarlyPhonicsStage(stage)) {
      const context = {
        skillId: normalizeEarlySkillId(stage.id),
        level: isFinalSoundsStage(stage) ? getFinalSoundQuestionLevel(normalizedQuestion) : (normalizedQuestion.level || normalizedQuestion.difficulty || 1)
      };
      const issues = getEarlySkillRuntimeEligibilityIssues(normalizedQuestion, context);
      if (issues.length > 0 && import.meta.env.DEV) {
        throw new Error(`Blocked ineligible early phonics question at render boundary: ${normalizedQuestion.id || "(missing id)"} :: ${issues.join("; ")}`);
      }
    }

    const mediaResolvedQuestion = assessmentMediaPickerRef.current?.resolveQuestionMediaDynamically
      ? assessmentMediaPickerRef.current.resolveQuestionMediaDynamically(normalizedQuestion, {
        skillId: stage?.id || fallbackSkillId,
        level: normalizedQuestion.level || normalizedQuestion.difficulty || 1,
        phase: normalizedQuestion.phase || normalizedQuestion.assessmentPhase || 1,
        sessionUsage: assessmentMediaUsageRef.current
      })
      : normalizedQuestion;

    const mediaValidationIssues = assessmentMediaPickerRef.current?.validateResolvedQuestionMedia
      ? assessmentMediaPickerRef.current.validateResolvedQuestionMedia(mediaResolvedQuestion)
      : [];
    if (mediaValidationIssues.length > 0) {
      const failedQuestionId = String(mediaResolvedQuestion.id || normalizedQuestion.id || "");
      if (failedQuestionId) failedAssessmentMediaRef.current.failedQuestionIds.add(failedQuestionId);
      debugAssessmentCoverage("assessment question blocked by runtime media validation", {
        questionId: failedQuestionId,
        skillId: mediaResolvedQuestion.skillId || stage?.id || fallbackSkillId,
        issues: mediaValidationIssues
      });
      return null;
    }

    const preparedChoices = Array.isArray(mediaResolvedQuestion.choices)
      ? (isPairSelectionQuestion(mediaResolvedQuestion) ? mediaResolvedQuestion.choices : shuffleArray(mediaResolvedQuestion.choices))
      : mediaResolvedQuestion.choices;
    const preparedAnswerOptions = Array.isArray(mediaResolvedQuestion.answerOptions)
      ? shuffleArray(mediaResolvedQuestion.answerOptions)
      : mediaResolvedQuestion.answerOptions;
    const preparedCards = Array.isArray(mediaResolvedQuestion.imageCards)
      ? shuffleArray(mediaResolvedQuestion.imageCards)
      : mediaResolvedQuestion.imageCards;
    const preparedSoundTiles = Array.isArray(mediaResolvedQuestion.soundTiles)
      ? shuffleArray(mediaResolvedQuestion.soundTiles)
      : mediaResolvedQuestion.soundTiles;
    const preparedLetterTiles = Array.isArray(mediaResolvedQuestion.letterTiles)
      ? shuffleArray(mediaResolvedQuestion.letterTiles)
      : mediaResolvedQuestion.letterTiles;

    return {
      ...mediaResolvedQuestion,
      isTargetedReview,
      choices: preparedChoices,
      answerOptions: preparedAnswerOptions,
      imageCards: preparedCards,
      soundTiles: preparedSoundTiles,
      letterTiles: preparedLetterTiles
    };
  }

  function preloadAssessmentQuestionWindow(questions = []) {
    void preloadQuestionMediaBatch(questions.filter(Boolean).slice(0, 3), {
      source: "assessment-candidate-window"
    });
  }

  function handleAssessmentEvidenceImageError({
    questionId = "",
    src = "",
    role = "evidence"
  } = {}) {
    const failedQuestion = currentQuestion;
    const failedQuestionId = String(failedQuestion?.id || "");
    if (
      !failedQuestion ||
      (questionId && questionId !== failedQuestionId) ||
      failedAssessmentMediaRef.current.failedQuestionIds.has(failedQuestionId)
    ) {
      return;
    }

    if (failedQuestionId) {
      failedAssessmentMediaRef.current.failedQuestionIds.add(failedQuestionId);
    }
    if (src) {
      failedAssessmentMediaRef.current.failedSources.add(src);
    }

    const failedStageIndex = getStageIndex(failedQuestion);
    const failedMode = assessmentMode;
    answerInFlightRef.current = true;
    setCurrentQuestion(null);
    setAssessmentTransitioning(true);
    setMessage("That picture did not load. Replacing the question...");

    debugAssessmentCoverage("assessment evidence image removed", {
      questionId: failedQuestionId,
      skillId: failedQuestion.skillId,
      role,
      src,
      roundAnswers: roundAnswers.length
    });

    window.setTimeout(() => {
      if (!assessmentActiveRef.current) return;
      pickQuestion(failedMode, failedStageIndex);
    }, 0);
  }

  function pickQuestion(mode = assessmentMode, stageIndexOverride = currentSkillIndex) {
    answerInFlightRef.current = false;
    setMessage("");
    setShowConfetti(false);
    setDiagnosticFollowUp(false);
    setCheckpointDecision(null);

    if (mode === "targetedReview") {
      const reviewPool =
        getReviewQuestionPool();

      if (reviewPool.length === 0) {
        setMessage("No targeted review questions are available yet. Complete more mastery questions first.");
        setAssessmentTransitioning(false);
        return;
      }

      const preparedReviewQuestion = reviewPool
        .map(question => prepareQuestion(question, true))
        .find(Boolean);
      if (!preparedReviewQuestion) {
        setMessage("No media-valid targeted review questions are available yet.");
        setAssessmentTransitioning(false);
        return;
      }
      preloadAssessmentQuestionWindow([preparedReviewQuestion, ...reviewPool.slice(1, 3)]);
      setCurrentQuestion(preparedReviewQuestion);
      setAssessmentTransitioning(false);
      return;
    }

    const activeStageIndex = stageIndexOverride;
    const activeStage = skillTree[activeStageIndex] || currentStage;

    if (isInitialSoundsStage(activeStage)) {
      const picked = getNextInitialSoundQuestion();
      if (!picked) {
        const meta = initialSoundRoundMetaRef.current;
        setCurrentQuestion(null);
        setAssessmentTransitioning(false);
        setMessage(
          meta?.blockedLetters?.length
            ? `Initial Sounds needs more media before this round can continue. Blocked letters: ${meta.blockedLetters.join(", ")}.`
            : "No valid Initial Sounds questions are available for this round."
        );
        answerInFlightRef.current = false;
        return;
      }

      debugAssessmentCoverage("initial sound question selection", {
        studentId,
        level: picked.level,
        phase: picked.initialSoundRoundPhase,
        letter: picked.letter,
        targetWord: picked.targetWord,
        reason: picked.selectionReason,
        remainingQueue: initialSoundRoundQueueRef.current.map(item => `${item.letter}:${item.targetWord}`)
      });

      const preparedInitialSoundQuestion = prepareQuestion(picked);
      if (!preparedInitialSoundQuestion) {
        pickQuestion(mode, activeStageIndex);
        return;
      }
      preloadAssessmentQuestionWindow([
        preparedInitialSoundQuestion,
        ...initialSoundRoundQueueRef.current.slice(0, 2)
      ]);
      setCurrentQuestion(preparedInitialSoundQuestion);
      setAssessmentTransitioning(false);
      return;
    }

    const available = getAvailableStageQuestions(activeStageIndex);

    if (available.length === 0) {
      setMessage(`No questions found for ${activeStage.label}.`);
      setAssessmentTransitioning(false);
      return;
    }

    // The shared selector applies the per-round phoneme/item cap. This permits
    // a skill with a small concept set (for example five short vowels) to use
    // different words for the same concept without repeating an exact item.
    const pool = available;

    const coveragePrioritized = prioritizeCoverageQuestions(pool, activeStage);
    // Diagnostic mode ADAPTS: items whose diagnostic target the child recently
    // missed float to the front, so the round digs into demonstrated
    // weaknesses instead of sampling at random. Stable sort keeps the
    // coverage ordering within each group.
    const weakTargets = assessmentMode === "diagnostic"
      ? getWeakDiagnosticTargets(activeStage.label)
      : null;
    const prioritized = weakTargets && weakTargets.size
      ? [...coveragePrioritized].sort(
          (a, b) =>
            Number(weakTargets.has(String(b.diagnosticTarget || "").trim())) -
            Number(weakTargets.has(String(a.diagnosticTarget || "").trim()))
        )
      : coveragePrioritized;
    const picked = selectNonDuplicateRoundCandidate(prioritized, activeStage);

    if (!picked) {
      setCurrentQuestion(null);
      setAssessmentTransitioning(false);
      setMessage(
        `No unrepeated questions remain for ${activeStage.label} in this round. Add more validated questions/assets before continuing this skill.`
      );
      answerInFlightRef.current = false;
      return;
    }

    debugAssessmentCoverage("question selection", {
      studentId,
      skill: activeStage.label,
      selectedItemKeys: prioritized.slice(0, ROUND_LENGTH).map(getQuestionItemKey).filter(Boolean),
      selectedQuestionIds: prioritized.slice(0, ROUND_LENGTH).map(question => question.id),
      selectedSignatures: prioritized.slice(0, ROUND_LENGTH).map(getRuntimeQuestionSignature),
      currentRoundItemKeys: roundItemKeysRef.current,
      recentItemKeys: getRecentStageItemKeys(activeStage.label)
    });

    const preparedQuestion = prepareQuestion(picked);
    if (!preparedQuestion) {
      pickQuestion(mode, activeStageIndex);
      return;
    }
    preloadAssessmentQuestionWindow([
      preparedQuestion,
      ...prioritized.filter(question => question.id !== picked.id).slice(0, 2)
    ]);
    setCurrentQuestion(preparedQuestion);
    setAssessmentTransitioning(false);
  }


  // Diagnostic-mode adaptation: every diagnostic target this child answered
  // incorrectly in their recent history for this skill.
  function getWeakDiagnosticTargets(skillLabel, lookback = 40) {
    const weak = new Set();
    for (const record of answerHistoryRef.current.slice(-lookback)) {
      if (record.skill !== skillLabel || record.isCorrect) continue;
      const target = String(record.diagnosticTarget || "").trim();
      if (target) weak.add(target);
    }
    return weak;
  }

  function getItemMasteryStateKey(itemKey, itemType) {
    return normalizeItemKey(itemType) + "::" + normalizeItemKey(itemKey);
  }

  function normalizeItemMasteryRow(row) {
    return {
      itemKey: normalizeItemKey(row.item_key),
      itemType: row.item_type,
      skillId: row.skillId || row.skill_id || "",
      targetSkill: row.targetSkill || row.target_skill || "",
      targetWord: row.targetWord || row.target_word || "",
      targetSound: row.targetSound || row.target_sound || "",
      targetPattern: row.targetPattern || row.target_pattern || "",
      source: row.source || "assessment",
      attempts: Number(row.attempts || 0),
      correct: Number(row.correct || 0),
      lastSeen: row.last_seen || null,
      lastResult: Boolean(row.last_result),
      sessionsSeen: Number(row.sessions_seen || 0),
      mastered: Boolean(row.mastered),
      formatTypes: row.formatTypes || [],
      hadPTDExposure: Boolean(row.hadPTDExposure),
      crossPatternExposure: Boolean(row.crossPatternExposure),
      phonicsPositions: row.phonicsPositions || [],
      masteryBlockers: row.masteryBlockers || [],
      updatedAt: row.updated_at || null
    };
  }

  function nextItemMasteryRow(previous, metadata, isCorrect, isNewSessionSeen, formatMetadata, source = {}) {
    const attempts = (previous?.attempts || 0) + 1;
    const correct = (previous?.correct || 0) + (isCorrect ? 1 : 0);
    const sessionsSeen = (previous?.sessionsSeen || 0) + (isNewSessionSeen ? 1 : 0);
    const formatTypes = Array.from(new Set([
      ...(previous?.formatTypes || []),
      formatMetadata.formatType
    ].filter(Boolean)));
    const phonicsPositions = Array.from(new Set([
      ...(previous?.phonicsPositions || []),
      formatMetadata.phonicsPosition
    ].filter(position => position && position !== "unknown")));
    const evidence = {
      formatTypes,
      phonicsPositions,
      hadPTDExposure: Boolean(previous?.hadPTDExposure || formatMetadata.hadPTD),
      crossPatternExposure: Boolean(previous?.crossPatternExposure || formatMetadata.crossPatternGroup || formatMetadata.formatType === "CPS")
    };
    const eligibility = isMasteryEligible(evidence, metadata.itemType, metadata.itemKey);
    // v3 blueprints tune the numeric evidence rule per construct (large
    // inventories need 2 solid proofs per unit, small ones need 3+); units that
    // are not covered by a blueprint keep the legacy 4/3/2 rule.
    const unitRule = getBlueprintUnitRuleByItem(metadata.itemType, metadata.itemKey);
    const attemptsMin = unitRule?.attemptsMin ?? 4;
    const correctMin = unitRule?.correctMin ?? 3;
    const sessionsMin = unitRule?.sessionsMin ?? 2;
    const baseMastered = attempts >= attemptsMin && correct >= correctMin && isCorrect && sessionsSeen >= sessionsMin;
    const isAssessmentEvidence = (source.source || "assessment") === "assessment";
    // v3 honesty rule (MASTERY_SYSTEM.md §3): mastery is never sticky — the
    // most recent answer being wrong always clears the mastered flag, so a
    // failed retake can no longer hide behind an old success.
    const mastered = isCorrect
      ? Boolean(previous?.mastered || (isAssessmentEvidence && baseMastered && eligibility.eligible))
      : false;
    const stageIndex = getStageIndex(source);
    const stage = skillTree[stageIndex];

    return {
      itemKey: metadata.itemKey,
      itemType: metadata.itemType,
      skillId: stage?.id || source.skillId || "",
      targetSkill: source.targetSkill || source.skill || stage?.label || "",
      targetWord: metadata.itemType.includes("word") ? metadata.itemKey : "",
      targetSound: metadata.itemType.includes("sound") || metadata.itemType === "short_vowel" ? metadata.itemKey : "",
      targetPattern: metadata.itemType.includes("pattern") ? metadata.itemKey : "",
      source: source.source || "assessment",
      attempts,
      correct,
      lastSeen: new Date().toISOString(),
      lastResult: isCorrect,
      sessionsSeen,
      mastered,
      formatTypes,
      hadPTDExposure: evidence.hadPTDExposure,
      crossPatternExposure: evidence.crossPatternExposure,
      phonicsPositions,
      masteryBlockers: eligibility.blockers
    };
  }

  async function saveItemMasteryToSupabase(row) {
    if (!studentId || !row?.itemKey || !row?.itemType) return;
    if (independentFocusAssessment) {
      try {
        const data = await saveStudentFocusItemMastery({
          client: supabase,
          token: studentSessionToken,
          sessionId: studentFocusSession.id,
          itemMastery: {
            skill_id: row.skillId,
            item_key: row.itemKey,
            item_type: row.itemType,
            attempts: row.attempts,
            correct: row.correct,
            last_result: row.lastResult,
            sessions_seen: row.sessionsSeen,
            mastered: row.mastered
          }
        });
        return { error: data?.ok === false ? new Error(data.error || "student_focus_item_mastery_failed") : null, row };
      } catch (error) {
        return { error, row };
      }
    }
    if (!teacherId) return { error: new Error("A teacher is required before item mastery can be saved."), row };

    const { error } = await supabase
      .table("item_mastery")
      .upsert(
        {
          student_id: studentId,
          teacher_id: teacherId,
          item_key: row.itemKey,
          item_type: row.itemType,
          attempts: row.attempts,
          correct: row.correct,
          last_seen: row.lastSeen,
          last_result: row.lastResult,
          sessions_seen: row.sessionsSeen,
          mastered: row.mastered,
          updated_at: new Date().toISOString()
        },
        { onConflict: "teacher_id,student_id,item_key,item_type" }
      );

    if (error && !isMissingItemMasteryTableError(error)) {
      console.error("Supabase item mastery save error:", error);
    }

    debugAssessmentCoverage("item_mastery upsert result", {
      studentId,
      teacherId,
      itemType: row.itemType,
      itemKey: row.itemKey,
      attempts: row.attempts,
      correct: row.correct,
      mastered: row.mastered,
      error: error?.message || null
    });

    return { error, row };
  }

  async function updateItemMastery(source, isCorrect) {
    const metadata = inferItemMetadata(source);
    if (!metadata?.itemKey || !metadata?.itemType) {
      debugAssessmentCoverage("item_mastery skipped", {
        questionId: source?.id,
        skill: source?.skill,
        reason: "No inferable itemType/itemKey"
      });
      return { row: null, durable: true, skipped: true };
    }

    if (source?.source && source.source !== "assessment") {
      return { row: null, durable: true, skipped: true };
    }

    const formatMetadata = getQuestionFormatMetadata(source);
    const key = getItemMasteryStateKey(metadata.itemKey, metadata.itemType);
    const isNewSessionSeen = !itemSessionSeen[key];

    setItemSessionSeen(prev => ({
      ...prev,
      [key]: true
    }));

    // Compute outside the state updater: React may invoke updaters more than
    // once (StrictMode / replays), and a Supabase upsert inside one fires per
    // invocation. Same-event calls always target distinct keys, so reading the
    // render-scope snapshot here is safe.
    const nextRow = nextItemMasteryRow(itemMastery[key], metadata, isCorrect, isNewSessionSeen, formatMetadata, source);
    setItemMastery(prev => ({
      ...prev,
      [key]: nextRow
    }));
    const persistence = await saveItemMasteryToSupabase(nextRow);
    return {
      row: nextRow,
      durable: !persistence?.error || isMissingItemMasteryTableError(persistence.error),
      skipped: false,
      error: persistence?.error || null
    };
  }

  async function persistCompletedAssessmentAttempt(
    attemptRecord,
    { mergeIntoMastery = false, deriveMastery = true } = {}
  ) {
    if (!attemptRecord?.studentId) return null;

    // Adaptive checkpoints use the app's mastery thresholds. The new
    // EL-aligned benchmark suite is descriptive/provisional because the
    // supplied overview does not include official cut scores; those attempts
    // must never inherit the generic 80/60 mastery labels.
    const masterySnapshot = deriveMastery
      ? extractMasteryFromAssessmentAttempt(attemptRecord)
      : null;
    const enrichedAttempt = deriveMastery
      ? {
          ...attemptRecord,
          masteredItems: attemptRecord.masteredItems?.length
            ? attemptRecord.masteredItems
            : attemptRecord.passed
              ? masterySnapshot.masteredItems.map(row => row.itemKey)
              : [],
          developingItems: masterySnapshot.developingItems.map(row => row.itemKey),
          needsSupportItems: masterySnapshot.needsSupportItems.map(row => row.itemKey)
        }
      : {
          ...attemptRecord,
          masteredItems: attemptRecord.masteredItems || [],
          developingItems: attemptRecord.developingItems || [],
          needsSupportItems: attemptRecord.needsSupportItems || []
        };

    try {
      if (independentFocusAssessment) {
        const assignedStep = getAssignedFocusStep();
        const independentAttempt = {
          ...enrichedAttempt,
          teacherId: evidenceTeacherId,
          classId: studentFocusSession.class_id || enrichedAttempt.classId,
          administrationMode: "student_independent",
          focusSessionId: studentFocusSession.id,
          assignedByTeacher: true,
          // Same contract as the per-answer save above: the completion RPC
          // compares these against the assignment, not against the bank.
          skillLevel: assignedStep.level ?? enrichedAttempt.skillLevel,
          skillPhase: assignedStep.phase ?? enrichedAttempt.skillPhase
        };
        const data = await saveStudentFocusAssessmentAttempt({
          client: supabase,
          token: studentSessionToken,
          sessionId: studentFocusSession.id,
          attempt: independentAttempt
        });
        if (data?.ok === false) {
          console.warn("Independent assessment archive was rejected.", data);
          return null;
        }
        setAssessmentHistory(previous => mergeAssessmentAttemptRecords(previous, [independentAttempt]));
        onStudentFocusAssessmentComplete?.(studentFocusSession.id);
        return {
          attempt: independentAttempt,
          saveResult: {
            records: [independentAttempt],
            localSaved: false,
            cloudSaved: true,
            durable: true,
            syncQueued: false,
            pendingSyncCount: 0
          }
        };
      }

      const savePromise = saveAssessmentAttempt(enrichedAttempt, { teacherId: evidenceTeacherId, supabase });
      setAssessmentHistory(previous => mergeAssessmentAttemptRecords(
        previous,
        loadAssessmentAttempts({ teacherId: evidenceTeacherId })
      ));
      const saveResult = await savePromise;
      if (!saveResult.durable) {
        console.warn("Assessment attempt was not durably saved to either local or cloud storage.", saveResult);
        return null;
      }
      // A rebuildable mastery summary must never get ahead of the immutable
      // assessment evidence. Merge only after at least one durable copy of the
      // attempt exists; otherwise a refused save would still change the
      // teacher's progress view.
      if (mergeIntoMastery) {
        setItemMastery(prev => mergeAssessmentAttemptIntoItemMastery(prev, enrichedAttempt));
      }
      setAssessmentHistory(previous => mergeAssessmentAttemptRecords(previous, saveResult.records));
      return { attempt: enrichedAttempt, saveResult };
    } catch (error) {
      console.warn("Assessment attempt archive save failed.", error);
      return null;
    }
  }

  function getSkillIdForMasteryRow(row) {
    if (row.skillId) return row.skillId;
    const configuredStage = skillTree.find(stage => {
      const configured = configuredCoverageTotals[stage.id];
      return configured?.itemType === row.itemType && configured.itemKeys?.includes(row.itemKey);
    });
    if (configuredStage) return configuredStage.id;

    return skillTree.find(stage => {
      const keys = getCoverageItemKeysForStage(stage, {
        finalSoundLevel: stage?.id === "final_sounds" ? getNextFinalSoundLevel() : null
      });
      return keys.has(getItemMasteryStateKey(row.itemKey, row.itemType));
    })?.id || "";
  }

  function formatMasteryItemLabel(row, stage) {
    const key = row.itemKey;
    if (!key) return "";
    if (row.itemType === "initial_sound") return key;
    if (row.itemType === "final_sound") return `/${key}/`;
    if (row.itemType === "rhyming_family") return key;
    if (row.itemType === "short_vowel") return key.replace(/^short_/, "short ");
    if (row.itemType === "phonics_pattern") return key;
    if (row.itemType === "sight_word" || row.itemType === "cvc_word") return key;
    return stage?.label?.toLowerCase().includes("word") ? key : key.replace(/_/g, " ");
  }

  function getRepresentativeWordsForItem(stageId, itemType, itemKey) {
    const normalizedKey = normalizeItemKey(itemKey);
    const words = new Set();

    answerHistoryRef.current.forEach(record => {
      if (!record?.isCorrect) return;
      const metadata = record.itemKey && record.itemType
        ? { itemKey: record.itemKey, itemType: record.itemType }
        : inferAnswerRecordMetadata(record);
      if (normalizeItemKey(metadata?.itemType) !== normalizeItemKey(itemType)) return;
      if (normalizeItemKey(metadata?.itemKey) !== normalizedKey) return;
      if (stageId && record.skillId && record.skillId !== stageId) return;

      [record.targetWord, record.correct, record.diagnosticTarget]
        .map(value => String(value || "").toLowerCase().replace(/[^a-z]/g, ""))
        .filter(value => value && value !== normalizedKey)
        .forEach(value => words.add(value));
    });

    return Array.from(words).slice(0, 4);
  }

  function buildSkillMasterySummary() {
    return buildSkillMasterySummaryRows({
      itemMastery,
      skillTree,
      configuredCoverageTotals,
      getSkillIdForMasteryRow,
      formatMasteryItemLabel,
      getRepresentativeWordsForItem,
      normalizeItemKey
    });
  }

  async function saveAnswerToSupabase(record) {
    if (!studentId) {
      return { durable: false, error: new Error("A teacher and student are required before an answer can be saved.") };
    }
    const normalizedRecord = normalizeAnswerRecordShape(record);

    if (independentFocusAssessment) {
      const assignedStep = getAssignedFocusStep();
      try {
        const data = await saveStudentFocusAssessmentAnswer({
          client: supabase,
          token: studentSessionToken,
          sessionId: studentFocusSession.id,
          answer: {
            answer_event_id: record.answerEventId,
            skill_id: normalizedRecord.skillId,
            skill_label: normalizedRecord.skill,
            stage: normalizedRecord.stage,
            diagnostic_target: normalizedRecord.diagnosticTarget,
            question: normalizedRecord.question,
            passage: normalizedRecord.passage,
            chosen: normalizedRecord.chosen,
            correct: normalizedRecord.correct,
            is_correct: normalizedRecord.isCorrect,
            level: assignedStep.level ?? normalizedRecord.itemLevel,
            phase: assignedStep.phase ?? normalizedRecord.itemPhase
          }
        });
        return data?.ok === false
          ? { durable: false, error: new Error(data.error || "student_focus_answer_failed") }
          : { durable: true, duplicate: Boolean(data?.duplicate), error: null };
      } catch (error) {
        return { durable: false, error };
      }
    }
    if (!teacherId) {
      return { durable: false, error: new Error("A teacher and student are required before an answer can be saved.") };
    }

    // insertWithRetry queues the row on failure and retries on reconnect, so a
    // flaky network no longer silently drops a teacher's assessment record.
    return insertWithRetry("answers", {
      student_id: studentId,
      teacher_id: teacherId,
      client_event_id: record.answerEventId,
      skill: normalizedRecord.skill,
      stage: normalizedRecord.stage,
      diagnostic_target: normalizedRecord.diagnosticTarget,
      question: normalizedRecord.question,
      passage: normalizedRecord.passage,
      chosen_answer: normalizedRecord.chosen,
      correct_answer: normalizedRecord.correct,
      is_correct: normalizedRecord.isCorrect
    }, {
      accountId: teacherId,
      onConflict: "teacher_id,client_event_id"
    });
  }

  async function saveMasteryToSupabase(stage, score, total, mastered, checkpointId) {
    if (independentFocusAssessment) {
      return { durable: true, cloudSaved: true, handledByAssessmentArchive: true };
    }
    if (!studentId || !teacherId) {
      return { durable: false, error: new Error("A teacher and student are required before mastery can be saved.") };
    }

    return insertWithRetry("mastery", {
      student_id: studentId,
      teacher_id: teacherId,
      checkpoint_id: checkpointId,
      skill_id: stage.id,
      skill_label: stage.label,
      mastered,
      attempts: (mastery?.[stage.id]?.attempts || 0) + 1,
      last_score: score,
      last_total: total
    }, {
      accountId: teacherId,
      onConflict: "teacher_id,checkpoint_id"
    });
  }

  function buildCheckpointDecision(stage, stageIndex, nextRound, nextRoundItemKeys, passed, nextRoundCorrectItemKeys = []) {
    if (stage?.id === "initial_sounds") {
      const initialRoundMeta = initialSoundRoundMetaRef.current || {};
      const stageRecords = answerHistoryRef.current
        .filter(record => record.stage === stage.label || record.skillId === "initial_sounds")
        .slice(-nextRound.length);
      const currentLevel = Number(stageRecords.at(-1)?.itemLevel || initialRoundMeta.level) === 2 ? 2 : 1;
      const currentLevelKey = currentLevel === 2 ? "level2" : "level1";
      const previousRecords = answerHistoryRef.current
        .filter(record => record.stage === stage.label || record.skillId === "initial_sounds")
        .slice(0, -nextRound.length);
      const previousProgress = buildInitialSoundsProgressFromAnswerHistory(previousRecords)[currentLevelKey];
      const allProgress = buildInitialSoundsProgressFromAnswerHistory(answerHistoryRef.current)[currentLevelKey];
      const allInitialProgress = buildInitialSoundsProgressFromAnswerHistory(answerHistoryRef.current);
      const levelOneMasteredLetters = new Set(allInitialProgress.level1?.masteredLetters || []);
      const levelOneMastered = INITIAL_SOUND_LETTERS.every(letter => levelOneMasteredLetters.has(letter));
      const alreadyCovered = new Set(previousProgress?.coveredLetters || []);
      const totalMastered = new Set(allProgress?.masteredLetters || []);
      const coveredThisRound = Array.from(new Set(
        stageRecords
          .filter(record => Number(record.itemLevel || currentLevel) === currentLevel)
          .map(record => normalizeItemKey(record.itemKey))
          .filter(letter => INITIAL_SOUND_LETTERS.includes(letter))
      ));
      const remainingItems = INITIAL_SOUND_LETTERS.filter(letter => !totalMastered.has(letter));
      const blockedLetters = initialRoundMeta.blockedLetters || [];
      const selectedTargetWords = stageRecords
        .filter(record => Number(record.itemLevel || currentLevel) === currentLevel)
        .map(record => record.targetWord)
        .filter(Boolean);
      const learnedCorrectly = getRoundItemLabels(stageRecords, { correctOnly: true });
      const missedThisRound = getRoundItemLabels(stageRecords, { correctOnly: false });
      const reviewLetters = coveredThisRound.filter(letter => alreadyCovered.has(letter));
      const score = nextRound.filter(Boolean).length;
      const coverageComplete = remainingItems.length === 0;
      const currentStep = {
        level: currentLevel,
        phase: Number(stageRecords.at(-1)?.itemPhase || initialRoundMeta.phase || 1) === 2 ? 2 : 1
      };
      const pathStatus = getCheckpointPathStatus(stage, currentStep);
      const effectivePassed = passed;

      return {
        skillId: stage.id,
        skillIndex: stageIndex,
        skillLabel: `${stage.label} ${pathStatus.label}`,
        pathStatus,
        correct: score,
        total: ROUND_LENGTH,
        accuracy: Math.round((score / ROUND_LENGTH) * 100),
        passed: effectivePassed,
        accuracyPassed: passed,
        coverageComplete,
        blockedPassReason: "",
        nextSkillLabel: skillTree[stageIndex + 1]?.label || "",
        coveredThisRound: learnedCorrectly,
        missedThisRound,
        alreadyMastered: Array.from(alreadyCovered).filter(letter => !coveredThisRound.includes(letter)),
        totalCoveredItems: Array.from(totalMastered),
        remainingItems,
        coverage: {
          mastered: totalMastered.size,
          total: INITIAL_SOUND_LETTERS.length,
          unit: "sounds"
        },
        initialSoundDebug: {
          level: currentLevel,
          phase: initialRoundMeta.phase || "",
          levelOneMastered,
          currentLevelMastered: INITIAL_SOUND_LETTERS.every(letter => totalMastered.has(letter)),
          masteredLetters: Array.from(totalMastered),
          blockedLetters,
          reviewLetters,
          selectedTargetWords,
          selectedReasons: initialRoundMeta.selectedReasons || []
        }
      };
    }

    if (stage?.id === "final_sounds") {
      const stageRecords = answerHistoryRef.current
        .filter(record => record.stage === stage.label || record.skillId === "final_sounds");
      const currentRoundRecords = stageRecords.slice(-nextRound.length);
      const isLevelOneFinalRound = currentRoundRecords.length > 0 &&
        currentRoundRecords.every(record => finalSoundLevelOneTargets.includes(getFinalSoundTargetFromEvidence(record)));

      if (isLevelOneFinalRound) {
        const previousDepth = getFinalSoundsLevelOneMasteryDepth(stageRecords.slice(0, -nextRound.length));
        const depth = getFinalSoundsLevelOneMasteryDepth(stageRecords);
        const coverageComplete = depth.allSoundsCovered;
        const depthComplete = depth.allSoundsMastered && depth.enoughSuccessfulRounds;
        const currentStep = {
          level: 1,
          phase: Number(currentRoundRecords.at(-1)?.itemPhase || 1) === 2 ? 2 : 1
        };
        const pathStatus = getCheckpointPathStatus(stage, currentStep);
        const effectivePassed = passed;
        const missingCoverage = finalSoundLevelOneTargets.filter(target => !depth.coveredTargets.includes(target));
        const stillNeedsPractice = depth.stillNeedsPractice;
        const blockedPassReason = !coverageComplete
          ? ""
          : !depthComplete
            ? "Level 2 opens after every Level 1 sound is answered correctly with different words across more than one successful assessment."
            : "";
        const learnedCorrectly = getRoundItemLabels(currentRoundRecords, { correctOnly: true });
        const missedThisRound = getRoundItemLabels(currentRoundRecords, { correctOnly: false });

        return {
          skillId: stage.id,
          skillIndex: stageIndex,
          skillLabel: `${stage.label} ${pathStatus.label}`,
          pathStatus,
          correct: nextRound.filter(Boolean).length,
          total: ROUND_LENGTH,
          accuracy: Math.round((nextRound.filter(Boolean).length / ROUND_LENGTH) * 100),
          passed: effectivePassed,
          accuracyPassed: passed,
          coverageComplete,
          blockedPassReason,
          nextSkillLabel: skillTree[stageIndex + 1]?.label || "",
          coveredThisRound: learnedCorrectly,
          missedThisRound,
          alreadyMastered: previousDepth.coveredTargets.filter(target => !currentRoundRecords.map(getFinalSoundTargetFromEvidence).includes(target)),
          totalCoveredItems: depth.coveredTargets,
          remainingItems: missingCoverage.length ? missingCoverage : stillNeedsPractice,
          coverage: {
            mastered: depth.coveredTargets.length,
            total: finalSoundLevelOneTargets.length,
            unit: "sounds"
          },
          masteryDepth: {
            label: "Final Sounds Level 1",
            mastered: depth.masteredTargets.length,
            total: finalSoundLevelOneTargets.length,
            successfulRounds: depth.successfulRounds,
            requiredSuccessfulRounds: depth.requiredSuccessfulRounds,
            stillNeedsPractice,
            contentGaps: depth.contentGaps,
            allSoundsMastered: depth.allSoundsMastered,
            enoughSuccessfulRounds: depth.enoughSuccessfulRounds,
            levelOneMastered: depth.levelOneMastered,
            bySound: depth.bySound
          }
        };
      }
    }

    const score = nextRound.filter(Boolean).length;
    const currentRoundRecords = getStageAssessmentRecords(stage).slice(-nextRound.length);
    const currentStep = currentRoundRecords.length
      ? {
        level: Number(currentRoundRecords.at(-1)?.itemLevel || 1) >= 2 ? 2 : 1,
        phase: Number(currentRoundRecords.at(-1)?.itemPhase || 1) === 2 ? 2 : 1
      }
      : getNextAssessmentPathStep(stage);
    const expectedKeys = Array.from(getCoverageItemKeysForStage(stage, {
      finalSoundLevel: stage?.id === "final_sounds" ? getNextFinalSoundLevel() : null,
      level: currentStep.level,
      phase: currentStep.phase
    }));
    const expectedKeySet = new Set(expectedKeys);
    const alreadyCoveredKeys = new Set(
      getCoveredStageItemKeys(stage, { level: currentStep.level, phase: currentStep.phase })
    );
    const coveredKeys = new Set(alreadyCoveredKeys);

    nextRoundCorrectItemKeys
      .filter(key => expectedKeySet.has(key))
      .forEach(key => coveredKeys.add(key));

    const configured = configuredCoverageTotals[stage.id];
    const coverageTotal = expectedKeys.length || configured?.total || 0;
    const coverageUnit = configured?.unit || (stage.label.toLowerCase().includes("word") ? "words" : "items");
    const remainingItems = expectedKeys
      .filter(key => !coveredKeys.has(key))
      .map(formatCoverageKeyLabel);
    const coveredThisRound = Array.from(new Set(
      nextRoundCorrectItemKeys
        .filter(key => expectedKeySet.has(key))
        .map(formatCoverageKeyLabel)
    ));
    const alreadyMastered = Array.from(alreadyCoveredKeys)
      .filter(key => !nextRoundItemKeys.includes(key))
      .map(formatCoverageKeyLabel);
    const totalCoveredItems = Array.from(coveredKeys)
      .map(formatCoverageKeyLabel);
    const learnedCorrectly = getRoundItemLabels(currentRoundRecords, { correctOnly: true });
    const missedThisRound = getRoundItemLabels(currentRoundRecords, { correctOnly: false });
    const coverageComplete = expectedKeys.length
      ? expectedKeys.every(key => coveredKeys.has(key))
      : true;
    const pathStatus = getCheckpointPathStatus(stage, currentStep);
    const effectivePassed = passed;

    return {
      skillId: stage.id,
      skillIndex: stageIndex,
      skillLabel: `${stage.label} ${pathStatus.label}`,
      pathStatus,
      correct: score,
      total: ROUND_LENGTH,
      accuracy: Math.round((score / ROUND_LENGTH) * 100),
      passed: effectivePassed,
      accuracyPassed: passed,
      coverageComplete,
      blockedPassReason: "",
      nextSkillLabel: skillTree[stageIndex + 1]?.label || "",
      coveredThisRound: learnedCorrectly.length ? learnedCorrectly : coveredThisRound,
      missedThisRound,
      alreadyMastered,
      totalCoveredItems,
      remainingItems,
      coverage: {
        mastered: Math.min(coveredKeys.size, coverageTotal),
        total: coverageTotal,
        unit: coverageUnit
      }
    };
  }

  async function answerQuestion(choice) {
    if (!currentQuestion || answerInFlightRef.current) return;
    answerInFlightRef.current = true;
    setAssessmentTransitioning(true);

    const initialQuestionStage =
      skillTree[getStageIndex(currentQuestion)] || currentStage;
    const answeredQuestion =
      normalizeAssessmentQuestion(currentQuestion, initialQuestionStage?.id || currentStage?.id || null, roundAnswers.length);

    if (!answeredQuestion?.skillId) {
      console.error("Cannot record answer: missing skillId", { answeredQuestion, choice });
      answerInFlightRef.current = false;
      setAssessmentTransitioning(false);
      return;
    }

    const correctAnswer = getQuestionAnswer(answeredQuestion);
    const isMultiSelectQuestion =
      Array.isArray(answeredQuestion.correctAnswers) &&
      answeredQuestion.correctAnswers.length > 1;
    const submittedAnswer = isFixSentenceQuestion(answeredQuestion)
      ? normalizeSentenceAnswer(choice)
      : isPairSelectionQuestion(answeredQuestion)
        ? normalizePairSelectionAnswer(choice)
        : isMultiSelectQuestion
          ? normalizeMultiSelectAnswer(choice)
          : choice;
    const isCorrect = isFixSentenceQuestion(answeredQuestion)
      ? comparableSentenceAnswer(submittedAnswer) === comparableSentenceAnswer(correctAnswer)
      : isPairSelectionQuestion(answeredQuestion)
        ? submittedAnswer === normalizePairSelectionAnswer(correctAnswer)
        : isMultiSelectQuestion
          ? submittedAnswer === normalizeMultiSelectAnswer(correctAnswer)
          : submittedAnswer === correctAnswer;
    const questionStage =
      skillTree[getStageIndex(answeredQuestion)] || initialQuestionStage || currentStage;
    const isTargetedReview = assessmentMode === "targetedReview";
    const stage = questionStage;
    const stageIndex = getStageIndex(answeredQuestion);
    const nextRound = [...roundAnswers, isCorrect];
    const itemMetadata = inferItemMetadata(answeredQuestion);
    const itemStateKey = itemMetadata?.itemKey && itemMetadata?.itemType
      ? getItemMasteryStateKey(itemMetadata.itemKey, itemMetadata.itemType)
      : "";
    // Always append (empty placeholder for keyless questions) so this array
    // stays index-aligned with nextRound; the coverage filter below indexes
    // answers by position. Set-building consumers filter out falsy keys.
    const nextRoundItemKeys = [...roundItemKeys, itemStateKey];
    const nextRoundQuestionIds = answeredQuestion.id
      ? [...roundQuestionIdsRef.current, answeredQuestion.id]
      : [...roundQuestionIdsRef.current];
    const questionPathStep = getQuestionPathStep(questionStage, answeredQuestion);

    const answerRecord = {
      ...normalizeAnswerRecordShape({
      questionId: answeredQuestion.id,
      questionSignature: getRuntimeQuestionSignature(answeredQuestion),
      promptAnswerSignature: getRuntimeQuestionPromptAnswerSignature(answeredQuestion),
      optionSetSignature: getRepeatOptionSetSignature(answeredQuestion),
      targetWord: getQuestionTargetWord(answeredQuestion),
      targetLetter: answeredQuestion.targetLetter || answeredQuestion.letter || "",
      targetSound: answeredQuestion.targetSound || answeredQuestion.finalSound || answeredQuestion.initialSound || "",
      targetPattern: answeredQuestion.targetPattern || answeredQuestion.pattern || answeredQuestion.rimeFamily || "",
      date: new Date().toLocaleString(),
      skillId: answeredQuestion.skillId || questionStage.id,
      skill: answeredQuestion.skill,
      stage: questionStage.label,
      question: getQuestionPrompt(answeredQuestion),
      passage: answeredQuestion.passage || "",
      chosen: submittedAnswer,
      correct: correctAnswer,
      timestamp: new Date().toISOString(),
      selectedAnswers: Array.isArray(choice) ? choice : [],
      correctAnswers: Array.isArray(answeredQuestion.correctAnswers) ? answeredQuestion.correctAnswers : [],
      isCorrect,
      diagnosticTarget: getDiagnosticTarget(answeredQuestion),
      itemType: itemMetadata?.itemType || "",
      itemKey: itemMetadata?.itemKey || "",
      templateType: answeredQuestion.templateType || answeredQuestion.formatType || getQuestionRoutingFormat(answeredQuestion),
      tags: Array.isArray(answeredQuestion.tags) ? answeredQuestion.tags : [],
      itemLevel: answeredQuestion.skillId === "initial_sounds" || questionStage.id === "initial_sounds"
        ? answeredQuestion.level
        : questionPathStep.level || answeredQuestion.level || "",
      itemPhase: questionPathStep.phase || "",
      selectionReason: answeredQuestion.selectionReason || ""
      }),
      answerEventId: makeEvidenceEventId("answer"),
      evidenceSource: isTargetedReview ? "targeted_review" : "formal_assessment"
    };

    debugAssessmentCoverage("assessment answer", {
      questionId: answeredQuestion.id,
      skill: answeredQuestion.skill,
      inferredItemType: itemMetadata?.itemType || "",
      inferredItemKey: itemMetadata?.itemKey || "",
      selectedAnswer: submittedAnswer,
      correctAnswer,
      isCorrect
    });

    let answerPersistence = { durable: true };
    if (!isTargetedReview) {
      answerHistoryRef.current = [...answerHistoryRef.current, answerRecord];
      setAnswerHistory(answerHistoryRef.current);
      setTotalAnswered(n => n + 1);
      answerPersistence = await saveAnswerToSupabase(answerRecord);
      if (answerPersistence?.durable) {
        await updateItemMastery(
          { ...answeredQuestion, source: "assessment" },
          isCorrect
        );
      }
    }

    if (!answerPersistence?.durable) {
      // Do not advance an assessment after an answer that exists only in
      // memory. Keeping the question visible lets the teacher retry without a
      // false "saved" or "complete" state.
      answerHistoryRef.current = answerHistoryRef.current.filter(record => (
        record.answerEventId !== answerRecord.answerEventId
      ));
      setAnswerHistory(answerHistoryRef.current);
      setTotalAnswered(value => Math.max(0, value - 1));
      setMessage("That answer could not be saved on this device or to the cloud. Nothing has been marked complete. Check the connection and try again.");
      setAssessmentTransitioning(false);
      answerInFlightRef.current = false;
      return;
    }

    // Only consume the question and advance round coverage after the answer is
    // durable. A failed write keeps the exact question retryable and cannot
    // leave duplicate item/question keys in the eventual completed attempt.
    setUsedByStage(prev => ({
      ...prev,
      [questionStage.id]: [...(prev[questionStage.id] || []), answeredQuestion.id]
    }));
    roundQuestionIdsRef.current = nextRoundQuestionIds.filter(Boolean);
    setRoundQuestionIds(roundQuestionIdsRef.current);
    roundItemKeysRef.current = nextRoundItemKeys;
    setRoundItemKeys(nextRoundItemKeys);

    if (isCorrect && !isTargetedReview && !independentFocusAssessment) {
      setCorrectAnswered(n => n + 1);
      setShowConfetti(true);
    }

    if (isTargetedReview) {
      if (nextRound.length >= ROUND_LENGTH) {
        setCurrentQuestion(null);
        setFeedback(null);
        setAssessmentTransitioning(false);
        setRoundAnswers([]);
        setRoundItemKeys([]);
        setRoundQuestionIds([]);
        roundItemKeysRef.current = [];
        roundQuestionIdsRef.current = [];
        resetAssessmentMediaUsage();
        setTimeout(() => {
          answerInFlightRef.current = false;
          setAppView(APP_VIEWS.FINISHED);
          setDiagnosticFollowUp(true);
        }, 500);
        return;
      } else {
        setRoundAnswers(nextRound);
      }

      setFeedback({
        question: answeredQuestion,
        answerEventId: answerRecord.answerEventId,
        skillId: answeredQuestion.skillId,
        isCorrect,
        chosen: submittedAnswer,
        correct: correctAnswer,
        skill: answeredQuestion.skill,
        explanation: getTeachingTip(answeredQuestion, submittedAnswer, isCorrect),
        support: buildFeedbackSupport(answeredQuestion, submittedAnswer),
        autoAdvance: false
      });
      setAssessmentTransitioning(false);

      setCurrentQuestion(null);
      answerInFlightRef.current = false;
      return;
    }

    if (nextRound.length >= ROUND_LENGTH) {
      const score = nextRound.filter(Boolean).length;
      const accuracyPassed = score >= PASS_SCORE;
      const nextRoundCorrectItemKeys = nextRoundItemKeys.filter((key, index) => nextRound[index] && key);
      const roundCheckpoint = buildCheckpointDecision(
        stage,
        stageIndex,
        nextRound,
        nextRoundItemKeys,
        accuracyPassed,
        nextRoundCorrectItemKeys
      );
      const preliminaryCheckpoint = {
        ...roundCheckpoint,
        passed: false,
        masteryEstablished: false,
        blockedPassReason: !accuracyPassed
          ? roundCheckpoint.blockedPassReason
          : roundCheckpoint.blockedPassReason
            || "This round was accurate, but the skill still needs enough correct results across separate assessments before it can be marked Secure."
      };
      const roundRecords = answerHistoryRef.current.slice(-nextRound.length);
      let attemptRecord = buildAssessmentAttemptRecord({
        studentId,
        studentName,
        classId: selectedClassId,
        teacherId: evidenceTeacherId,
        stage,
        checkpoint: preliminaryCheckpoint,
        questionRecords: roundRecords,
        assessmentType: getAssessmentAttemptType(assessmentMode),
        policySnapshot: {
          rule: "Skills Assessment v3 single-status policy",
          roundLength: ROUND_LENGTH,
          passScore: PASS_SCORE,
          stageId: stage.id,
          level: preliminaryCheckpoint?.pathStatus?.level ?? null,
          phase: preliminaryCheckpoint?.pathStatus?.phase ?? null
        }
      });
      const archivedAttempts = independentFocusAssessment
        ? Array.isArray(studentFocusSession?.prior_attempts)
          ? studentFocusSession.prior_attempts
          : []
        : loadAssessmentAttempts({ teacherId: evidenceTeacherId });
      const skillStatus = computeSkillStatus(
        assessmentAttemptsToSkillLedger([...archivedAttempts, attemptRecord], stage.id),
        stage.id
      );
      const masteryEstablished = Boolean(
        skillStatus?.status === SKILL_STATUS_IDS.SECURE
        && !skillStatus?.needsReview
      );
      const completedLevel = Number(preliminaryCheckpoint?.pathStatus?.level || 1) >= 2 ? 2 : 1;
      const completedPhase = Number(preliminaryCheckpoint?.pathStatus?.phase || 1) === 2 ? 2 : 1;
      const phasePassed = Boolean(
        skillStatus?.[`level${completedLevel}`]?.phases?.[completedPhase]?.passed
      );
      const checkpoint = {
        ...preliminaryCheckpoint,
        passed: phasePassed,
        masteryEstablished,
        skillStatus,
        pathStatus: {
          ...preliminaryCheckpoint.pathStatus,
          levelOnePassed: Boolean(skillStatus?.level1?.passed),
          levelTwoPassed: Boolean(skillStatus?.level2?.passed),
          nextSkillUnlocked: Boolean(skillStatus?.nextSkillUnlocked),
          level2Unlocked: Boolean(skillStatus?.level2Unlocked),
          level2Optional: true
        },
        blockedPassReason: phasePassed || !accuracyPassed
          ? preliminaryCheckpoint.blockedPassReason
          : skillStatus?.[`level${completedLevel}`]?.phases?.[completedPhase]?.blockers?.[0]
            || preliminaryCheckpoint.blockedPassReason
      };
      const mastered = Boolean(skillStatus?.nextSkillUnlocked);
      // Rebuild the immutable archive row with the authoritative policy result
      // included. Reports still recompute from the ledger; this snapshot only
      // explains what the learner saw at completion time.
      attemptRecord = buildAssessmentAttemptRecord({
        studentId,
        studentName,
        classId: selectedClassId,
        teacherId: evidenceTeacherId,
        stage,
        checkpoint,
        questionRecords: roundRecords,
        assessmentType: getAssessmentAttemptType(assessmentMode),
        policySnapshot: {
          rule: "Skills Assessment v3 single-status policy",
          roundLength: ROUND_LENGTH,
          passScore: PASS_SCORE,
          stageId: stage.id,
          level: checkpoint?.pathStatus?.level ?? null,
          phase: checkpoint?.pathStatus?.phase ?? null,
          status: skillStatus?.status || "not_started",
          needsReview: Boolean(skillStatus?.needsReview)
        }
      });

      const attemptPersistence = await persistCompletedAssessmentAttempt(attemptRecord);
      if (!attemptPersistence) {
        setMessage("This assessment could not be saved on this device or to the cloud, so it was not marked complete. Return to the assessment list and run it again when storage is available.");
        setRoundAnswers([]);
        setRoundItemKeys([]);
        setRoundQuestionIds([]);
        roundItemKeysRef.current = [];
        roundQuestionIdsRef.current = [];
        setCurrentQuestion(null);
        setFeedback(null);
        setAssessmentTransitioning(false);
        setAppView(APP_VIEWS.ASSESSMENTS);
        answerInFlightRef.current = false;
        return;
      }

      // Recency is authoritative. A later failed retake must surface as review,
      // never remain silently green because an old boolean was ratcheted true.
      const retainedMastery = mastered;
      setMastery(prev => ({
        ...prev,
        [stage.id]: {
          attempts: (prev[stage.id]?.attempts || 0) + 1,
          mastered: retainedMastery,
          // A failed retake never silently disappears: clear the current
          // mastery conclusion and retain the failure timestamp for reporting.
          lastRetakeFailedAt: !mastered && prev[stage.id]?.mastered
            ? new Date().toISOString()
            : prev[stage.id]?.lastRetakeFailedAt || null,
          lastScore: score,
          lastTotal: ROUND_LENGTH
        }
      }));

      const masteryPersistence = await saveMasteryToSupabase(
        stage,
        score,
        ROUND_LENGTH,
        retainedMastery,
        attemptRecord.attemptId
      );
      if (!masteryPersistence?.durable) {
        setMessage("The completed assessment is safely archived, but its dashboard summary could not be queued. The saved results will remain available for recovery.");
      }

      setCheckpointDecision(checkpoint);
      setRoundAnswers([]);
      setRoundItemKeys([]);
      setRoundQuestionIds([]);
      roundItemKeysRef.current = [];
      roundQuestionIdsRef.current = [];
      resetAssessmentMediaUsage();
      setCurrentQuestion(null);
      setFeedback(null);
      setAssessmentTransitioning(false);
      setAppView(APP_VIEWS.CHECKPOINT);
      answerInFlightRef.current = false;
      return;
    } else {
      setRoundAnswers(nextRound);
    }

    setFeedback({
      question: answeredQuestion,
      answerEventId: answerRecord.answerEventId,
      skillId: answeredQuestion.skillId,
      isCorrect,
      chosen: submittedAnswer,
      correct: correctAnswer,
      skill: answeredQuestion.skill,
      explanation: getTeachingTip(answeredQuestion, submittedAnswer, isCorrect),
      support: buildFeedbackSupport(answeredQuestion, submittedAnswer),
      autoAdvance: false
    });
    setAssessmentTransitioning(false);

    setCurrentQuestion(null);
    answerInFlightRef.current = false;
  }

  function reviseLastAnswer(answeredQuestion = {}, answerEventId = "") {
    const questionId = answeredQuestion?.id || answeredQuestion?.questionId || "";
    let removed = null;
    const revisedHistory = [...answerHistoryRef.current];
    for (let index = revisedHistory.length - 1; index >= 0; index -= 1) {
      const row = revisedHistory[index];
      if (
        (answerEventId && row.answerEventId === answerEventId)
        || (!answerEventId && questionId && row.questionId === questionId)
      ) {
        [removed] = revisedHistory.splice(index, 1);
        break;
      }
    }
    answerHistoryRef.current = revisedHistory;
    setAnswerHistory(revisedHistory);
    setRoundAnswers(previous => previous.slice(0, -1));
    setRoundItemKeys(previous => previous.slice(0, -1));
    roundItemKeysRef.current = roundItemKeysRef.current.slice(0, -1);
    setRoundQuestionIds(previous => previous.slice(0, -1));
    roundQuestionIdsRef.current = roundQuestionIdsRef.current.slice(0, -1);
    setUsedByStage(previous => {
      const stageId = answeredQuestion?.skillId || "";
      if (!stageId || !previous[stageId]) return previous;
      const rows = [...previous[stageId]];
      const removeAt = rows.lastIndexOf(questionId);
      if (removeAt >= 0) rows.splice(removeAt, 1);
      return { ...previous, [stageId]: rows };
    });
    setTotalAnswered(previous => Math.max(0, previous - 1));
    if (removed?.isCorrect) setCorrectAnswered(previous => Math.max(0, previous - 1));
    setShowConfetti(false);
    setFeedback(null);
    setAssessmentTransitioning(false);
    setCurrentQuestion(normalizeAssessmentQuestion(answeredQuestion));
    answerInFlightRef.current = false;
  }

  function buildFeedbackSupport(question, submittedAnswer) {
    if (!isPairSelectionQuestion(question)) return null;

    const chosenWords = normalizePairSelectionAnswer(submittedAnswer)
      .split("|")
      .filter(Boolean);
    const correctWords = question.correctWords || [];
    const cardsByWord = Object.fromEntries(
      (question.imageCards || []).map(card => [card.word, card])
    );
    const wrongWords = chosenWords.filter(word => !correctWords.includes(word));
    const targetSound = question.itemKey || correctWords[0]?.[0] || "";
    const wrongWord = wrongWords[0];

    return {
      type: "pair_selection",
      targetSound,
      correctWords,
      chosenWords,
      cardsByWord,
      exampleText: getPairSupportText(question, correctWords, targetSound),
      wrongText: wrongWord
        ? getPairWrongText(question, wrongWord, targetSound)
        : "Both matching pictures need to be selected."
    };
  }

  function getPairSupportText(question, correctWords, targetSound) {
    if (correctWords.length < 2) return "";
    if (question.questionType === "rhyme_pair") {
      return `${correctWords[0]} and ${correctWords[1]} rhyme because they share the ending sound ${targetSound}.`;
    }
    if (question.questionType === "final_sound_pair") {
      return `${correctWords[0]} and ${correctWords[1]} both end with /${targetSound}/.`;
    }
    return `${correctWords[0]} and ${correctWords[1]} both begin with /${targetSound}/.`;
  }

  function getPairWrongText(question, wrongWord, targetSound) {
    if (question.questionType === "rhyme_pair") {
      return `${wrongWord} does not share the same rhyming ending.`;
    }
    if (question.questionType === "final_sound_pair") {
      return `${wrongWord} does not end with /${targetSound}/.`;
    }
    return `${wrongWord} starts with /${wrongWord[0]}/, so it does not match /${targetSound}/.`;
  }

  function getTeachingTip(question, choice, isCorrect) {
    const skill = normalize(question.skill);
    const answer = String(getQuestionAnswer(question) || "");
    const targetWord = String(
      question.targetWord
      || question.anchorWord
      || question.word
      || question.audioText
      || ""
    ).trim();

    if (isFixSentenceQuestion(question)) {
      return isCorrect
        ? `"${answer}" has the right capital letter, word order, and punctuation.`
        : `The corrected sentence is "${answer}". Check the capital letter, word order, and ending punctuation.`;
    }

    if (skill.includes("initial")) {
      if (isCorrect) {
        return targetWord
          ? `${targetWord} starts with "${answer}".`
          : `"${answer}" is the first sound.`;
      }
      return `The correct answer is "${answer}". Listen to the first sound in the word.`;
    }

    if (skill.includes("final")) {
      if (isCorrect) {
        return targetWord
          ? `${targetWord} ends with "${answer}".`
          : `"${answer}" is the ending.`;
      }
      return `The correct answer is "${answer}". Listen to the last sound in the word.`;
    }

    if (skill.includes("rhym")) {
      if (isCorrect) return `"${answer}" has the matching rhyme ending.`;
      return `The correct answer is "${answer}". Rhyming words have the same ending sound.`;
    }

    if (skill.includes("short vowel") || skill.includes("cvc")) {
      if (isCorrect) return `"${answer}" has the matching middle vowel sound.`;
      return `The correct answer is "${answer}". Listen carefully to the vowel sound in the middle of the word.`;
    }

    if (skill.includes("high-frequency")) {
      if (isCorrect) return `"${answer}" is the word that completes the sentence.`;
      return `The correct answer is "${answer}". This is a high-frequency word. These words appear often when we read.`;
    }

    if (skill.includes("blend")) {
      if (isCorrect) return `"${answer}" has the matching consonant blend.`;
      return `The correct answer is "${answer}". A blend has two consonant sounds together, like bl, st, or cr.`;
    }

    if (skill.includes("digraph")) {
      if (isCorrect) return `"${answer}" uses the matching two-letter sound.`;
      return `The correct answer is "${answer}". A digraph is two letters making one sound, like sh, ch, th, or wh.`;
    }

    if (skill.includes("preposition")) {
      if (isCorrect) return `"${answer}" matches where the object is in the picture.`;
      return `The correct answer is "${answer}". A preposition tells where something is.`;
    }

    if (skill.includes("plural")) {
      if (isCorrect) return `"${answer}" matches how many the sentence or picture shows.`;
      return `The correct answer is "${answer}". A plural means more than one.`;
    }

    if (skill.includes("comprehension") || skill.includes("details") || skill.includes("main idea") || skill.includes("inference")) {
      if (isCorrect) return `The passage details support "${answer}".`;
      return `The correct answer is "${answer}". Look back at the passage and use the details to help you.`;
    }

    if (isCorrect) return `"${answer}" fits the question.`;
    return `The correct answer is "${answer}". Review the skill and try the next one.`;
  }

  function speakWithBrowser(text) {
    if (!speakWithBrowserFallback(text, { rate: 0.85, pitch: 1 })) {
      console.warn("Browser speech synthesis is unavailable.");
    }
  }

  async function speakText(text, audioPath = "", options = {}) {
    if (!text) return;

    const allowBrowserFallback = options.allowBrowserFallback === true;
    const requireApprovedAudio = options.requireApprovedAudio === true;
    if (
      import.meta.env.DEV &&
      options.audioRole === "target_word" &&
      isGenericInstructionAudioPath(audioPath)
    ) {
      console.warn("Target-word audio attempted to use instruction/prompt audio.", {
        text,
        audioPath
      });
    }
    const { resolveAssessmentLedaAudioPath } = await import("../utils/assessmentLedaResolver.js");
    const ledaAudioPath = resolveAssessmentLedaAudioPath(text, options.audioRole);
    const preferredAudioPath = ledaAudioPath || audioPath || "";

    if (requireApprovedAudio && !preferredAudioPath) return;

    if (preferredAudioPath) {
      playCueAudio(preferredAudioPath, {
        onUnavailable: () => {
          if (allowBrowserFallback) speakWithBrowser(text);
        }
      });
      return;
    }

    if (requireApprovedAudio) return;

    if (allowBrowserFallback) {
      speakWithBrowser(text);
    }
  }

  function shouldShowImage(question) {
    const skill = normalize(question.skill);
    const isFinalSoundsEndingQuestion =
      normalizeEarlySkillId(question.skillId || question.skill || "") === "final_sounds" &&
      String(question.formatType || question.templateType || "").toUpperCase() === "ENDING_SOUND";
    if (isFinalSoundsEndingQuestion) return Boolean(getTargetObjectImage(question));
    if (isListenChooseVowelQuestion(question)) return false;
    if (String(question.formatType || question.templateType || "").toUpperCase().startsWith("HFW_")) return Boolean(
      question.imagePath ||
      question.imageUrl ||
      question.image
    );
    if (
      normalizeEarlySkillId(question.skillId || question.skill || "") === "rhyming" &&
      String(question.formatType || question.templateType || "").toUpperCase() === "RHYMING_PICTURE"
    ) return Boolean(getTargetObjectImage(question));

    const imagePath =
      question.imagePath ||
      question.imageUrl ||
      question.targetImage ||
      question.targetImagePath ||
      question.targetImageUrl ||
      question.image;

    return Boolean(imagePath) && (
      question.questionType === "ixl_template" ||
      question.question === "Listen and find the word." ||
      skill.includes("vocabulary") ||
      skill.includes("preposition") ||
      skill.includes("emotion") ||
      skill.includes("picture comprehension")
    );
  }


  function getDiagnosticTarget(question) {
    const skill =
      normalize(question.skill);

    const text =
      [
        question.question,
        question.answer,
        question.passage
      ].join(" ").toLowerCase();

    if (skill.includes("initial")) {
      const match =
        text.match(/\/([a-z]+)\//);

      if (match) return `initial /${match[1]}/`;

      const word =
        String(question.answer || "").toLowerCase();

      return word
        ? `initial ${word[0]}`
        : "initial sound";
    }

    if (skill.includes("final")) {
      const match =
        text.match(/\/([a-z]+)\//);

      if (match) return `final /${match[1]}/`;

      const word =
        String(question.answer || "").toLowerCase();

      return word
        ? `final ${word[word.length - 1]}`
        : "final sound";
    }

    if (skill.includes("rhym")) {
      const match =
        text.match(/rhymes with ([a-z]+)/);

      return match
        ? `rhymes with ${match[1]}`
        : "rhyming";
    }

    if (skill.includes("short vowel") || skill.includes("cvc")) {
      const answer =
        String(question.answer || "").toLowerCase();

      if (/[a]/.test(answer)) return "short a";
      if (/[e]/.test(answer)) return "short e";
      if (/[i]/.test(answer)) return "short i";
      if (/[o]/.test(answer)) return "short o";
      if (/[u]/.test(answer)) return "short u";

      return "short vowel";
    }

    if (skill.includes("blend")) {
      const match =
        text.match(/(bl|cl|fl|gl|pl|sl|br|cr|dr|fr|gr|pr|tr|sc|sk|sm|sn|sp|st|sw)/);

      return match
        ? `${match[1]} blend`
        : "blend";
    }

    if (skill.includes("digraph")) {
      const match =
        text.match(/(sh|ch|th|wh|ph)/);

      return match
        ? `${match[1]} digraph`
        : "digraph";
    }

    if (skill.includes("long vowel")) {
      const match =
        text.match(/long ([aeiou])/);

      return match
        ? `long ${match[1]}`
        : "long vowel";
    }

    if (skill.includes("vowel team")) {
      const match =
        text.match(/(ai|ay|ee|ea|oa|ow|igh|ie|oo|ue|ew)/);

      return match
        ? `${match[1]} vowel team`
        : "vowel team";
    }

    if (skill.includes("r-controlled") || skill.includes("r controlled")) {
      const match =
        text.match(/(ar|er|ir|or|ur)/);

      return match
        ? `${match[1]} r-controlled`
        : "r-controlled vowel";
    }

    if (skill.includes("high-frequency")) {
      return String(question.answer || "high-frequency word");
    }

    if (skill.includes("preposition")) {
      return String(question.answer || "preposition");
    }

    if (skill.includes("plural")) {
      return String(question.answer || "plural");
    }

    if (skill.includes("prefix") || skill.includes("suffix")) {
      return String(question.answer || "morphology");
    }

    if (skill.includes("homophone")) {
      return String(question.answer || "homophone");
    }

    if (skill.includes("main idea")) return "main idea";
    if (skill.includes("key details")) return "key details";
    if (skill.includes("sequencing")) return "sequencing";
    if (skill.includes("cause")) return "cause and effect";
    if (skill.includes("context")) return "context clues";
    if (skill.includes("theme")) return "theme";
    if (skill.includes("inference")) return "inference";

    return question.skill || "general skill";
  }


  return {
    answerQuestion, buildInitialSoundRoundQueue, buildSkillMasterySummary, getAvailableStageQuestions,
    getItemMasteryStateKey, getQuestionItemKey, handleAssessmentEvidenceImageError, normalizeItemMasteryRow,
    persistCompletedAssessmentAttempt, pickQuestion, prioritizeCoverageQuestions, resetInitialSoundRoundQueue, reviseLastAnswer,
    shouldShowImage, speakText, updateItemMastery,
  };
}
