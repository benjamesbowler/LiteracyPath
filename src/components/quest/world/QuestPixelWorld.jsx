import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { buildTrailSection, routePointAt } from "../../../utils/questHub.js";
import {
  buildPhysicalTask,
  physicalStage,
  physicalStagePrompt,
  physicalStageRecordsMastery
} from "../../../utils/questPhysicalMechanics.js";
import {
  budgetPhysicalSection,
  QUEST_PACING_SLOW_RESPONSE_MS,
  questPacingDecision
} from "../../../utils/questPhysicalPlan.js";
import { targetsForStop } from "../../../utils/questReviewScheduler.js";
import { getStop, targetsAtStop } from "../../../data/questSequence.js";
import { starRubric } from "../../../utils/starRubric.js";
import { hasGraphemeAudio, hasWordAudio } from "../../../utils/questAudio.js";
import { sayGrapheme, sayGraphemeWithName, sayWord } from "../shells/shellContract.js";
import {
  applyQuestTaskInput,
  createSeedwakeVerbState,
  questRhythmPulse,
  restoreSeedwakeVerbState,
  resyncSeedwakeVerbState
} from "../../../utils/questSliceSystems.js";
import {
  completeTeachBack,
  correctionKey,
  correctionPresentation,
  nextQueuedReview,
  promptLevelForMode,
  recordCorrectionMiss
} from "../../../utils/questCorrection.js";
import { createQuestPixelRuntime } from "./questPixelRuntime.js";
import {
  availableSparks,
  questRewardBonuses,
  SPARKS_PER_DROP
} from "../../../utils/questProgress.js";
import { SEEDWAKE_CACHE_THRESHOLDS, seedwakeSatchel } from "../../../data/questChapterOne.js";
import {
  createQuestFrameBudgetState,
  sampleQuestFrameBudget
} from "../../../utils/questPerformance.js";
import { warmQuestOfflineAssets } from "../../../utils/offlineShell.js";
import { QUEST_PIXEL_SFX_URLS } from "../../../utils/questActionAudio.js";
import { clampQuestWorldResume } from "../../../utils/questWorldResume.js";

// Touch devices get the big-answer strip PINNED: focus-within only ever
// helped keyboard users; a sighted motor-impaired child on touch saw nothing.
const COARSE_POINTER = typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)")?.matches);

function learningSequence(task) {
  if (task?.learningSequence?.length) return [...task.learningSequence];
  return (task?.stages || [])
    .map(taskStage => taskStage.items.find(item => item.correct)?.value)
    .filter(value => value != null);
}

function shortPrompt(stage, soundDelivered = true) {
  if (!stage) return "Follow the trail";
  if (!soundDelivered) return physicalStagePrompt(stage, false);
  if (stage.audioCue?.kind === "grapheme") {
    return stage.prompt?.includes("'")
      ? stage.prompt
      : "Find the letter that matches the sound";
  }
  return stage.prompt || "Find the right sound";
}

function cueIsAvailable(kind, value) {
  if (!kind || !value) return false;
  if (kind === "grapheme") return hasGraphemeAudio(value);
  if (kind === "word") return hasWordAudio(value);
  return false;
}

const PIXEL_COLLECTIBLES = Object.freeze({
  "seedwake-meadow": { label: "lantern seeds", image: "/game-assets/quest-pixel/seedwake/items/seed-1.png" },
  "river-gardens": { label: "sound cargo", image: "/game-assets/quest-pixel/seedwake/items/fish.png" },
  "fossil-canyon": { label: "fossils", image: "/game-assets/quest-pixel/dino/items/amber.png" },
  "forge-settlement": { label: "ember rivets", image: "/game-assets/quest-pixel/forge-settlement/scenery-premium/ember-rivet.png" },
  "glass-marsh": { label: "mirror gems", image: "/game-assets/quest-pixel/glass-marsh/scenery-premium/mirror-gem.png" },
  "storm-coast": { label: "lens shards", image: "/game-assets/quest-pixel/storm-coast/scenery-premium/lens-shard-pickup.png" },
  "lantern-forest": { label: "lantern maps", image: "/game-assets/quest-pixel/lantern-forest/scenery-premium/living-map-pickup.png" },
  "star-reach": { label: "reader pages", image: "/game-assets/quest-pixel/star-reach/scenery-premium/reader-page-pickup.png" }
});

export default function QuestPixelWorld({
  stopId,
  state,
  resume = null,
  isSoundEnabled = true,
  isInteractive = true,
  ceremony = false,
  mode = "journey",
  routeLabel = null,
  targetsOverride = null,
  onAnswer,
  onInteraction,
  onCheckpoint,
  onFinish,
  onAudioState,
  onQuit,
  onSceneReady,
  onSceneError,
  onRuntimeSignal
}) {
  const stop = getStop(stopId);
  const [section] = useState(() => {
    const targets = Array.isArray(targetsOverride) && targetsOverride.length
      ? [...new Set(targetsOverride)]
      : targetsForStop(targetsAtStop(stopId), state.mastery, stop?.index || 1);
    const rewardBonuses = questRewardBonuses(state);
    const built = buildTrailSection(stopId, {
      mastery: state.mastery,
      targets,
      seed: (stop?.index || 1) * 1000 + (state.trail?.stopsDone?.length || 0) + (mode === "review" ? 509 : 0),
      completedStopIds: state.trail?.stopsDone || [],
      rewardIds: rewardBonuses.rewardIds,
      rewardCacheCount: rewardBonuses.branchCacheCount
    });
    return budgetPhysicalSection({ ...built, rewardBonuses });
  });
  const [initialResume] = useState(() => clampQuestWorldResume(section, resume));
  const [phase, setPhase] = useState(initialResume.phase);
  const [encounterIndex, setEncounterIndex] = useState(initialResume.encounterIndex);
  const [encounterStarted, setEncounterStarted] = useState(Boolean(initialResume.activeIdValid && resume?.activeId));
  const [beatIndex, setBeatIndex] = useState(initialResume.beatIndex);
  const [fieldStage, setFieldStage] = useState(initialResume.fieldStage);
  const [feedback, setFeedback] = useState("");
  const [corrections, setCorrections] = useState(() => resume?.corrections || {});
  const [rhythmOpen, setRhythmOpen] = useState(true);
  const [solved, setSolved] = useState(() => new Set(resume?.solved || []));
  const [collected, setCollected] = useState(() => new Set(resume?.drops || []));
  const [completionMarks, setCompletionMarks] = useState(() => resume?.completionMarks || []);
  const [hiddenGateHint, setHiddenGateHint] = useState(null);
  const [pickupNotice, setPickupNotice] = useState("");
  const [ready, setReady] = useState(false);
  const [sceneLoadMs, setSceneLoadMs] = useState(null);
  const [sceneAssetStats, setSceneAssetStats] = useState(null);
  const [runtimeHealth, setRuntimeHealth] = useState(null);
  const mountRef = useRef(null);
  const runtimeRef = useRef(null);
  const dpadHoldRef = useRef(null);
  // The hold-to-move repeat must die with the component, not outlive it.
  useEffect(() => () => window.clearInterval(dpadHoldRef.current), []);
  const solvedRef = useRef(solved);
  const collectedRef = useRef(collected);
  const completionMarksRef = useRef(completionMarks);
  const correctionsRef = useRef(corrections);
  const reviewQueueRef = useRef(resume?.reviewQueue || []);
  const reviewedBeatsRef = useRef(resume?.reviewedBeats || []);
  const remediationBeatRef = useRef(Number.isInteger(resume?.remediationBeat) ? resume.remediationBeat : null);
  const verbStateRef = useRef(null);
  const verbTaskKeyRef = useRef(null);
  const teachTimerRef = useRef(0);
  const feedbackTimerRef = useRef(0);
  const pickupTimerRef = useRef(0);
  const cueTimerRef = useRef(0);
  const tallyRef = useRef(resume?.tally || { correct: 0, total: 0, mistakes: 0 });
  const firstTallyRef = useRef(new Map());
  const slowResponsesRef = useRef(Math.max(0, Number(resume?.slowResponses) || 0));
  const pacingDeferredRef = useRef(Math.max(0, Number(resume?.pacingDeferred) || 0));
  const encounterRef = useRef(null);
  const interactionRef = useRef(onInteraction);
  const stageShownAtRef = useRef({ key: null, at: 0 });
  const taskFocusRef = useRef(null);
  const chooseRef = useRef(() => {});
  const checkpointRef = useRef(() => {});
  const finishRef = useRef(() => {});
  const frameBudgetRef = useRef(createQuestFrameBudgetState("pixel"));
  const sceneLoadStartedAtRef = useRef(null);
  const sceneResourcesStartedAtRef = useRef(null);
  const firstTeachEntry = phase === "teach" ? (section?.teach?.[0] || null) : null;
  const encounter = section?.encounters[encounterIndex] || null;
  useLayoutEffect(() => {
    encounterRef.current = encounter;
  }, [encounter]);
  const beat = encounter?.beats?.[beatIndex] || null;
  const task = useMemo(
    () => encounter && beat ? buildPhysicalTask(section, encounter, beat, beatIndex) : null,
    [beat, beatIndex, encounter, section]
  );
  const stage = physicalStage(task, fieldStage);
  const activeCorrectionKey = correctionKey(encounter, beatIndex, fieldStage);
  const visibleChoices = useMemo(() => {
    const presentation = correctionPresentation(stage, corrections[activeCorrectionKey]);
    return stage?.items?.filter(choice => presentation.visibleIds.includes(choice.id)) || [];
  }, [activeCorrectionKey, corrections, stage]);
  const stageAudioKind = stage?.audioCue?.kind || null;
  const stageAudioValue = stage?.audioCue?.value || null;
  const stageCueAvailable = cueIsAvailable(stageAudioKind, stageAudioValue);
  const stageSoundDelivered = Boolean(isSoundEnabled && stageCueAvailable);
  const stageRecordsMastery = physicalStageRecordsMastery(stage, stageSoundDelivered);
  const teachCueAvailable = Boolean(firstTeachEntry?.id && hasGraphemeAudio(firstTeachEntry.id));
  const collectible = PIXEL_COLLECTIBLES[section?.chapter?.id] || PIXEL_COLLECTIBLES["seedwake-meadow"];
  const previousBestDrops = Math.max(0, Number(state.trail?.drops?.[stopId]) || 0);
  const pendingDropCount = Math.max(0, collected.size - previousBestDrops);
  const liveSparks = availableSparks(state) + (pendingDropCount * SPARKS_PER_DROP);
  const seedwakeFinds = seedwakeSatchel(state).total;
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => Boolean(
    typeof window !== "undefined"
    && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  ));

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReducedMotion = () => setPrefersReducedMotion(Boolean(query.matches));
    syncReducedMotion();
    query.addEventListener?.("change", syncReducedMotion);
    // Older Safari exposes MediaQueryList.addListener instead of EventTarget.
    if (!query.addEventListener) query.addListener?.(syncReducedMotion);
    return () => {
      query.removeEventListener?.("change", syncReducedMotion);
      if (!query.removeEventListener) query.removeListener?.(syncReducedMotion);
    };
  }, []);

  const snapshotPosition = useCallback(() => {
    const pixelPosition = runtimeRef.current?.getPlayerPosition?.() || resume?.pixelPosition || null;
    const progress = pixelPosition?.progress ?? encounter?.progress ?? section?.start?.progress ?? 0;
    return {
      pixelPosition,
      position: routePointAt(section.route, progress)
    };
  }, [encounter?.progress, resume?.pixelPosition, section]);

  const checkpoint = useCallback(overrides => {
    if (!section) return;
    const position = snapshotPosition();
    onCheckpoint?.({
      stopId,
      pixelMode: true,
      phase,
      guideDone: phase !== "teach",
      activeId: encounter?.id || null,
      beatIndex,
      fieldStage,
      solved: [...solvedRef.current],
      drops: [...collectedRef.current],
      completionMarks: completionMarksRef.current,
      tally: tallyRef.current,
      slowResponses: slowResponsesRef.current,
      pacingDeferred: pacingDeferredRef.current,
      corrections: correctionsRef.current,
      reviewQueue: reviewQueueRef.current,
      reviewedBeats: reviewedBeatsRef.current,
      remediationBeat: remediationBeatRef.current,
      ...position,
      ...overrides
    });
  }, [beatIndex, encounter?.id, fieldStage, onCheckpoint, phase, section, snapshotPosition, stopId]);

  const answer = useCallback((correct, target, recordMastery = true, meta = {}) => {
    // FIRST ATTEMPT PER BEAT is what stars score: the correction ladder is
    // the intended teaching path, and counting every rung as a fresh mistake
    // punished the child for using it.
    const beatKey = `${encounter?.id || "enc"}:${beatIndex}`;
    if (!firstTallyRef.current.has(beatKey)) {
      firstTallyRef.current.set(beatKey, correct);
      tallyRef.current = {
        total: tallyRef.current.total + 1,
        correct: tallyRef.current.correct + (correct ? 1 : 0),
        mistakes: tallyRef.current.mistakes + (correct ? 0 : 1)
      };
    }
    if (recordMastery) {
      for (const one of Array.isArray(target) ? target : [target]) {
        if (one) onAnswer?.(one, correct, encounter?.kind || "pixel-trail", meta);
      }
    }
  }, [beatIndex, encounter?.id, encounter?.kind, onAnswer]);

  const beginBeat = useCallback((nextIndex, remediation = null) => {
    remediationBeatRef.current = remediation;
    setBeatIndex(nextIndex);
    setFieldStage(0);
    setFeedback("");
    const nextTask = buildPhysicalTask(section, encounter, encounter?.beats?.[nextIndex], nextIndex);
    verbTaskKeyRef.current = nextTask?.key || null;
    verbStateRef.current = nextTask?.chapterAuthored
      ? createSeedwakeVerbState(nextTask.mechanic, learningSequence(nextTask))
      : null;
    checkpoint({ beatIndex: nextIndex, fieldStage: 0, remediationBeat: remediation });
  }, [checkpoint, encounter, section]);

  const completeEncounter = useCallback(() => {
    const nextSolved = new Set([...solvedRef.current, encounter.id]);
    solvedRef.current = nextSolved;
    setSolved(nextSolved);
    setEncounterStarted(false);
    setFeedback("");
    if (encounterIndex + 1 < section.encounters.length) {
      const nextIndex = encounterIndex + 1;
      const nextEncounter = section.encounters[nextIndex];
      reviewQueueRef.current = [];
      reviewedBeatsRef.current = [];
      remediationBeatRef.current = null;
      setEncounterIndex(nextIndex);
      setBeatIndex(0);
      setFieldStage(0);
      verbTaskKeyRef.current = null;
      verbStateRef.current = null;
      checkpoint({
        activeId: nextEncounter.id,
        beatIndex: 0,
        fieldStage: 0,
        solved: [...nextSolved],
        reviewQueue: [],
        reviewedBeats: [],
        remediationBeat: null
      });
      return;
    }
    setPhase("gate");
    onAudioState?.("travel");
    checkpoint({ phase: "gate", activeId: null, beatIndex: 0, fieldStage: 0, solved: [...nextSolved] });
  }, [checkpoint, encounter, encounterIndex, onAudioState, section]);

  const nextBeat = useCallback(() => {
    setFieldStage(0);
    setFeedback("");
    const pacing = questPacingDecision({
      tally: tallyRef.current,
      slowResponses: slowResponsesRef.current,
      completedBeats: beatIndex + 1,
      totalBeats: encounter?.beats?.length || 0
    });
    if (pacing.defer) {
      pacingDeferredRef.current += pacing.deferredBeats;
      reviewQueueRef.current = [];
      reviewedBeatsRef.current = [];
      remediationBeatRef.current = null;
      interactionRef.current?.({
        type: "pacing-adapted",
        count: pacing.deferredBeats,
        reason: pacing.reason
      });
      completeEncounter();
      return;
    }
    if (remediationBeatRef.current !== null) {
      reviewedBeatsRef.current = [...new Set([...reviewedBeatsRef.current, remediationBeatRef.current])];
      const nextReview = nextQueuedReview(reviewQueueRef.current, reviewedBeatsRef.current);
      if (nextReview !== null) beginBeat(nextReview, nextReview);
      else completeEncounter();
      return;
    }
    if (beatIndex + 1 < (encounter?.beats?.length || 0)) {
      beginBeat(beatIndex + 1, null);
      return;
    }
    const nextReview = nextQueuedReview(reviewQueueRef.current, reviewedBeatsRef.current);
    if (nextReview !== null) beginBeat(nextReview, nextReview);
    else completeEncounter();
  }, [beatIndex, beginBeat, completeEncounter, encounter?.beats?.length]);

  const emitStageInteraction = useCallback((type, details = {}) => {
    const now = performance.now();
    const startedAt = stageShownAtRef.current.at || now;
    const latencyMs = Math.max(0, now - startedAt);
    interactionRef.current?.({
      type,
      latencyMs,
      ...details
    });
    if (type === "response" && latencyMs >= QUEST_PACING_SLOW_RESPONSE_MS) {
      slowResponsesRef.current += 1;
    }
    if (["response", "motor-retry"].includes(type)) {
      stageShownAtRef.current = { ...stageShownAtRef.current, at: now };
    }
  }, []);

  const choose = useCallback(choiceId => {
    // A CORRECT ANSWER MUST NEVER SILENTLY DO NOTHING.
    //
    // Playtest, Bramble Gate: "the answer is 'c' but when you go to it it does
    // nothing; the other two say wrong and bump you." A child who has found
    // the right answer, walked to it, and been ignored has no way to tell that
    // from being wrong — except that being wrong at least ANSWERS them. Silence
    // on the correct choice is worse than a buzz: it teaches that the right
    // answer is the one that does not work.
    //
    // Resolve against the full stage, not just the currently visible subset.
    // The runtime draws from its own object list, so any drift between what is
    // on screen and what `visibleChoices` believes (a stale sprite, a narrowed
    // correction set, a re-render mid-walk) used to land here as an early
    // `return` — no feedback, no bump, nothing.
    const choice = visibleChoices.find(item => item.id === choiceId)
      || stage?.items?.find(item => item.id === choiceId);
    if (!choice || !stage || !task) return;
    if (task.chapterAuthored && (!verbStateRef.current || verbTaskKeyRef.current !== task.key)) {
      verbTaskKeyRef.current = task.key;
      verbStateRef.current = restoreSeedwakeVerbState(task.mechanic, learningSequence(task), task.stages, fieldStage);
    }
    const verbResult = applyQuestTaskInput({
      chapterAuthored: task.chapterAuthored,
      mechanic: task.mechanic,
      state: verbStateRef.current,
      input: {
        type: stage.playerAction,
        correct: Boolean(choice.correct),
        value: choice.value,
        stage: fieldStage,
        onBeat: !stage.rhythm || rhythmOpen
      }
    });
    verbStateRef.current = verbResult.state;
    let right = Boolean(choice.correct && verbResult.accepted);

    // THE VERB MAY DELAY A CORRECT ANSWER. IT MAY NOT SWALLOW ONE.
    //
    // The rhythm gate ("conduct on the pulse") legitimately asks the child to
    // wait — the window is open ~60% of the time, so walking in again lands
    // it. But every OTHER rejection of a correct choice is the verb's own
    // state machine disagreeing with the answer, and the child pays for it by
    // being ignored. `gate-chorus` returning "chorus-recue" because `selected`
    // drifted out of step is not the child's mistake.
    //
    // So: a correct choice that the verb refuses for a non-rhythm reason is
    // ACCEPTED. The verb is there to shape how an answer is given, never to
    // decide whether a right answer counts.
    if (!right && choice.correct) {
      const waitingForPulse = Boolean(stage.rhythm) && verbResult.recordAttempt === false;
      if (waitingForPulse) {
        emitStageInteraction("motor-retry", { mechanic: task.mechanic });
        runtimeRef.current?.playFeedback?.("wait", choice.id);
        setFeedback("Wait for the glow");
        return;
      }
      right = true;
      verbStateRef.current = resyncSeedwakeVerbState(
        task.mechanic,
        verbStateRef.current,
        choice.value,
        fieldStage,
        stage.playerAction
      );
    }
    if (!right) {
      emitStageInteraction("response", { correct: false, mechanic: task.mechanic });
      runtimeRef.current?.playFeedback?.("wrong", choice.id);
      const preAttemptLevel = promptLevelForMode(correctionsRef.current[activeCorrectionKey]?.mode);
      const nextCorrection = recordCorrectionMiss(correctionsRef.current[activeCorrectionKey], choice.id);
      correctionsRef.current = { ...correctionsRef.current, [activeCorrectionKey]: nextCorrection };
      setCorrections(correctionsRef.current);
      answer(false, stage.items.find(item => item.correct)?.value || beat?.target, stageRecordsMastery, { promptLevel: preAttemptLevel, key: activeCorrectionKey });
      if (nextCorrection.misses >= 3) reviewQueueRef.current = [...new Set([...reviewQueueRef.current, beatIndex])];
      setFeedback(nextCorrection.mode === "teach" ? "This one. Listen." : "Try again. Listen.");
      // Cue after the buzz, not on top of it (mirrors the 3D path's 350ms).
      window.clearTimeout(cueTimerRef.current);
      cueTimerRef.current = window.setTimeout(() => {
        if (stage.audioCue?.kind === "grapheme") sayGrapheme(stage.audioCue.value, isSoundEnabled);
        else if (stage.audioCue?.kind === "word") sayWord(stage.audioCue.value, isSoundEnabled);
      }, 350);
      checkpoint({ corrections: correctionsRef.current, reviewQueue: reviewQueueRef.current });
      if (nextCorrection.mode === "teach") {
        window.clearTimeout(teachTimerRef.current);
        teachTimerRef.current = window.setTimeout(() => {
          interactionRef.current?.({ type: "teach-back", mechanic: task.mechanic });
          const guided = completeTeachBack(correctionsRef.current[activeCorrectionKey]);
          correctionsRef.current = { ...correctionsRef.current, [activeCorrectionKey]: guided };
          setCorrections(correctionsRef.current);
          setFeedback("Now find it again");
          checkpoint({ corrections: correctionsRef.current });
        }, 1150);
      }
      return;
    }
    emitStageInteraction("response", { correct: true, mechanic: task.mechanic });
    runtimeRef.current?.playFeedback?.("correct", choice.id);
    if (stage.completion) {
      const mark = {
        ...stage.completion,
        id: stage.completion.id || `${task.key}-${fieldStage}`,
        encounterId: encounter?.id,
        mechanic: task.mechanic,
        label: stage.completion.label || choice.label || choice.value
      };
      if (!completionMarksRef.current.some(item => item.id === mark.id)) {
        const nextMarks = [...completionMarksRef.current, mark];
        completionMarksRef.current = nextMarks;
        setCompletionMarks(nextMarks);
      }
    }
    setFeedback("Yes!");
    if (fieldStage + 1 < task.stages.length) {
      const nextStage = fieldStage + 1;
      setFieldStage(nextStage);
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = window.setTimeout(() => setFeedback(""), 420);
      checkpoint({ fieldStage: nextStage });
      return;
    }
    answer(true, task.learningSequence?.length ? task.learningSequence : beat?.target, stageRecordsMastery, { promptLevel: promptLevelForMode(correctionsRef.current[activeCorrectionKey]?.mode), key: activeCorrectionKey });
    nextBeat();
  }, [activeCorrectionKey, answer, beat?.target, beatIndex, checkpoint, emitStageInteraction, encounter?.id, fieldStage, isSoundEnabled, nextBeat, rhythmOpen, stage, stageRecordsMastery, task, visibleChoices]);

  const beginTrail = useCallback(() => {
    setPhase("trail");
    setFeedback("");
    checkpoint({ phase: "trail", guideDone: true });
  }, [checkpoint]);

  const replayCue = useCallback(() => {
    if (stageAudioKind === "grapheme") sayGrapheme(stageAudioValue, isSoundEnabled);
    else if (stageAudioKind === "word") sayWord(stageAudioValue, isSoundEnabled);
    else if (firstTeachEntry?.id) sayGraphemeWithName(firstTeachEntry.id, isSoundEnabled);
  }, [firstTeachEntry, isSoundEnabled, stageAudioKind, stageAudioValue]);

  useEffect(() => {
    solvedRef.current = solved;
  }, [solved]);

  useEffect(() => {
    collectedRef.current = collected;
  }, [collected]);

  useEffect(() => {
    completionMarksRef.current = completionMarks;
  }, [completionMarks]);

  useEffect(() => {
    correctionsRef.current = corrections;
  }, [corrections]);

  useEffect(() => {
    interactionRef.current = onInteraction;
  }, [onInteraction]);

  useEffect(() => {
    chooseRef.current = choose;
    checkpointRef.current = checkpoint;
    finishRef.current = () => {
      const score = tallyRef.current;
      const stars = starRubric({ ...score, deaths: 0 });
      onFinish?.(stars, { ...score, drops: collectedRef.current.size });
    };
  }, [checkpoint, choose, encounter, onFinish]);

  useEffect(() => {
    if (!task?.key || verbTaskKeyRef.current === task.key) return;
    verbTaskKeyRef.current = task.key;
    verbStateRef.current = task.chapterAuthored
      ? restoreSeedwakeVerbState(task.mechanic, learningSequence(task), task.stages, fieldStage)
      : null;
  }, [fieldStage, task]);

  useEffect(() => {
    if (!stage?.rhythm) return undefined;
    const update = () => setRhythmOpen(questRhythmPulse(performance.now()).open);
    const timer = window.setInterval(update, 70);
    update();
    return () => window.clearInterval(timer);
  }, [stage?.id, stage?.rhythm]);

  useEffect(() => {
    onAudioState?.(phase === "trail" && encounterStarted ? "encounter" : "travel");
  }, [encounterStarted, onAudioState, phase]);

  useEffect(() => {
    if (!encounterStarted || !stageCueAvailable || !isSoundEnabled) return;
    if (stageAudioKind === "grapheme") sayGrapheme(stageAudioValue, true);
    else if (stageAudioKind === "word") sayWord(stageAudioValue, true);
  }, [encounterStarted, isSoundEnabled, stage?.id, stageAudioKind, stageAudioValue, stageCueAvailable]);

  useEffect(() => {
    if (phase !== "trail" || !encounterStarted || !stage?.id) return;
    const key = `${encounter?.id || "encounter"}:${beatIndex}:${fieldStage}:${stage.id}`;
    if (stageShownAtRef.current.key === key) return;
    stageShownAtRef.current = { key, at: performance.now() };
    interactionRef.current?.({
      type: "prompt-shown",
      mechanic: task?.mechanic || null
    });
  }, [beatIndex, encounter?.id, encounterStarted, fieldStage, phase, stage?.id, task?.mechanic]);

  useEffect(() => {
    if (!teachCueAvailable || !isSoundEnabled) return;
    // Phoneme first, letter name second - the teach moment says both.
    sayGraphemeWithName(firstTeachEntry.id, true);
  }, [firstTeachEntry?.id, isSoundEnabled, teachCueAvailable]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      taskFocusRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [encounterStarted, phase, stage?.id]);

  useEffect(() => {
    if (phase !== "gate") return undefined;
    const timer = window.setTimeout(() => setHiddenGateHint(stopId), 1800);
    return () => window.clearTimeout(timer);
  }, [phase, stopId]);

  const runtimeModel = useMemo(() => ({
    section,
    resume,
    creature: state.creature,
    reducedMotion: Boolean(state.settings?.reducedMotion || prefersReducedMotion),
    soundEnabled: Boolean(isSoundEnabled),
    interactive: isInteractive,
    ceremony: Boolean(ceremony),
    phase,
    solvedIds: [...solved],
    collectedIds: [...collected],
    completionMarks,
    activeEncounterId: phase === "trail" ? encounter?.id || null : null,
    activeStage: phase === "trail" && encounterStarted && stage
      ? { ...stage, mechanic: task?.mechanic, verbPattern: task?.verbPattern, items: visibleChoices }
      : null
  }), [ceremony, collected, completionMarks, encounter?.id, encounterStarted, isInteractive, isSoundEnabled, phase, prefersReducedMotion, resume, section, solved, stage, state.creature, state.settings?.reducedMotion, task?.mechanic, task?.verbPattern, visibleChoices]);

  useEffect(() => {
    if (!mountRef.current || !section) return undefined;
    sceneLoadStartedAtRef.current = Date.now();
    sceneResourcesStartedAtRef.current = performance.now();
    try {
      const runtime = createQuestPixelRuntime(mountRef.current, runtimeModel, {
        onReady: () => {
          const loadMs = Date.now() - sceneLoadStartedAtRef.current;
          const sceneAssetEntries = typeof performance.getEntriesByType === "function"
            ? performance.getEntriesByType("resource").filter(entry => (
              entry.startTime >= sceneResourcesStartedAtRef.current
              && entry.name.includes("/game-assets/quest-pixel/")
            ))
            : [];
          // Voice/action clips deliberately live beside the pixel pack. Keep
          // their transfer cost visible, but do not count them as chapter art:
          // otherwise pre-warming honest offline audio makes the visual budget
          // look larger without loading a single extra texture.
          const visualAssetEntries = sceneAssetEntries.filter(entry => !entry.name.includes("/audio/"));
          const audioAssetEntries = sceneAssetEntries.filter(entry => entry.name.includes("/audio/"));
          const uniqueVisualAssetEntries = [...new Map(visualAssetEntries.map(entry => [entry.name, entry])).values()];
          const uniqueAudioAssetEntries = [...new Map(audioAssetEntries.map(entry => [entry.name, entry])).values()];
          const uniqueSceneAssetEntries = [...new Map(sceneAssetEntries.map(entry => [entry.name, entry])).values()];
          const offlineAssetUrls = [
            // The manifest, rather than the racy performance snapshot, owns
            // the audio set. This also avoids caching the same URL once as an
            // absolute resource entry and again as a root-relative manifest entry.
            ...uniqueVisualAssetEntries.map(entry => entry.name),
            ...QUEST_PIXEL_SFX_URLS
          ];
          const assetRequests = uniqueVisualAssetEntries.length;
          const assetRequestAttempts = visualAssetEntries.length;
          const assetBytes = uniqueVisualAssetEntries.reduce((total, entry) => (
            total + Number(entry.encodedBodySize || entry.transferSize || entry.decodedBodySize || 0)
          ), 0);
          const audioAssetRequests = uniqueAudioAssetEntries.length;
          const audioAssetRequestAttempts = audioAssetEntries.length;
          const audioAssetBytes = uniqueAudioAssetEntries.reduce((total, entry) => (
            total + Number(entry.encodedBodySize || entry.transferSize || entry.decodedBodySize || 0)
          ), 0);
          const totalAssetBytes = assetBytes + audioAssetBytes;
          if (offlineAssetUrls.length) {
            void warmQuestOfflineAssets(offlineAssetUrls, {
              chapterId: section.chapter?.id || ""
            });
          }
          setReady(true);
          setSceneLoadMs(loadMs);
          setSceneAssetStats({
            requests: assetRequests,
            attempts: assetRequestAttempts,
            bytes: assetBytes,
            audioRequests: audioAssetRequests,
            audioAttempts: audioAssetRequestAttempts,
            audioBytes: audioAssetBytes,
            totalRequests: uniqueSceneAssetEntries.length,
            totalAttempts: sceneAssetEntries.length,
            totalBytes: totalAssetBytes
          });
          if (isInteractive) {
            onRuntimeSignal?.({
              type: "scene-ready",
              tierId: "pixel",
              stopId,
              loadMs,
              assetRequests,
              assetRequestAttempts,
              assetBytes,
              audioAssetRequests,
              audioAssetRequestAttempts,
              audioAssetBytes,
              totalAssetRequests: uniqueSceneAssetEntries.length,
              totalAssetRequestAttempts: sceneAssetEntries.length,
              totalAssetBytes,
              at: new Date().toISOString()
            });
          }
          onSceneReady?.();
        },
        onError: reason => onSceneError?.(reason),
        onRuntimeSignal: signal => {
          if (!isInteractive || !signal) return;
          onRuntimeSignal?.({
            ...signal,
            tierId: signal.tierId || "pixel",
            stopId,
            at: signal.at || new Date().toISOString()
          });
        },
        onFrame: frameMs => {
          const emitted = sampleQuestFrameBudget(frameBudgetRef.current, frameMs);
          if (!emitted) return;
          frameBudgetRef.current = emitted.state;
          onRuntimeSignal?.({ ...emitted.signal, stopId });
        },
        onDiagnostics: diagnostics => {
          setRuntimeHealth(diagnostics);
          if (isInteractive) onRuntimeSignal?.({ ...diagnostics, stopId });
        },
        onEncounter: id => {
          if (id !== encounterRef.current?.id) return;
          setEncounterStarted(true);
          setFeedback("");
        },
        onChoice: id => chooseRef.current(id),
        onInteraction: event => interactionRef.current?.(event),
        onDrop: (id, details = {}) => {
          if (collectedRef.current.has(id)) return;
          const next = new Set([...collectedRef.current, id]);
          collectedRef.current = next;
          setCollected(next);
          interactionRef.current?.({ type: "drop", count: 1 });
          if (details.discovery) interactionRef.current?.({ type: "optional-discovery", count: 1 });
          const drop = section.drops.find(item => item.id === id);
          const pendingBefore = Math.max(0, collectedRef.current.size - 1 - previousBestDrops);
          const findsBefore = seedwakeFinds + pendingBefore;
          const findsAfter = seedwakeFinds + Math.max(0, collectedRef.current.size - previousBestDrops);
          const cacheUnlocked = section.chapter?.id === "seedwake-meadow"
            && SEEDWAKE_CACHE_THRESHOLDS.some(threshold => findsBefore < threshold && findsAfter >= threshold);
          window.clearTimeout(pickupTimerRef.current);
          setPickupNotice(details.discovery
            ? `${details.discovery.title}: ${details.discovery.message}`
            : cacheUnlocked
              ? "Cache path unlocked for your next trail"
              : drop?.cache
                ? `Secret cache +${SPARKS_PER_DROP} Sparks`
                : `${collectible?.label || "Trail find"} +${SPARKS_PER_DROP} Sparks`);
          pickupTimerRef.current = window.setTimeout(() => setPickupNotice(""), details.discovery ? 3200 : 1800);
          checkpointRef.current({ drops: [...next] });
        },
        onGate: () => finishRef.current()
      });
      runtimeRef.current = runtime;
      if (import.meta.env.DEV) window.__questPixelRuntime = runtime;
      return () => {
        window.clearTimeout(teachTimerRef.current);
        window.clearTimeout(feedbackTimerRef.current);
        window.clearTimeout(pickupTimerRef.current);
        window.clearTimeout(cueTimerRef.current);
        if (window.__questPixelRuntime === runtime) delete window.__questPixelRuntime;
        runtimeRef.current = null;
        runtime.destroy();
      };
    } catch (error) {
      onSceneError?.(error instanceof Error ? error.message : "Pixel renderer failed");
      return undefined;
    }
  // The Phaser scene owns its graph. Model changes flow through setModel below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section?.stopId]);

  useEffect(() => {
    runtimeRef.current?.setModel(runtimeModel);
  }, [runtimeModel]);

  useEffect(() => {
    function handleNumberKey(event) {
      if (!encounterStarted || event.repeat) return;
      const index = Number(event.key) - 1;
      const choice = visibleChoices[index];
      if (choice) choose(choice.id);
    }
    window.addEventListener("keydown", handleNumberKey);
    return () => window.removeEventListener("keydown", handleNumberKey);
  }, [choose, encounterStarted, visibleChoices]);

  if (!section) return null;

  const stageCount = task?.stages?.length || 1;
  const cueVisible = !ceremony && (phase === "teach" || encounterStarted || (phase === "gate" && hiddenGateHint !== stopId));
  const cueCompact = phase === "trail" && encounterStarted;
  return (
    <main
      className="q-screen qp-root"
      data-world={section.world}
      data-ceremony={ceremony ? "true" : "false"}
      data-ready={ready ? "true" : "false"}
      data-scene-load-ms={sceneLoadMs ?? undefined}
      data-scene-asset-requests={sceneAssetStats?.requests ?? undefined}
      data-scene-asset-request-attempts={sceneAssetStats?.attempts ?? undefined}
      data-scene-asset-bytes={sceneAssetStats?.bytes ?? undefined}
      data-scene-audio-asset-requests={sceneAssetStats?.audioRequests ?? undefined}
      data-scene-audio-asset-request-attempts={sceneAssetStats?.audioAttempts ?? undefined}
      data-scene-audio-asset-bytes={sceneAssetStats?.audioBytes ?? undefined}
      data-scene-total-asset-requests={sceneAssetStats?.totalRequests ?? undefined}
      data-scene-total-asset-request-attempts={sceneAssetStats?.totalAttempts ?? undefined}
      data-scene-total-asset-bytes={sceneAssetStats?.totalBytes ?? undefined}
      data-runtime-display-objects={runtimeHealth?.displayObjects ?? undefined}
      data-runtime-tweens={runtimeHealth?.tweens ?? undefined}
      data-runtime-textures={runtimeHealth?.textures ?? undefined}
      data-runtime-active-choices={runtimeHealth?.activeChoices ?? undefined}
    >
      <div ref={mountRef} className="qp-canvas" aria-hidden="true" />

      <header className="qp-header">
        <button type="button" className="qp-icon-button" onClick={() => { checkpoint(); onQuit?.(); }} aria-label="Back to the Den">
          <span aria-hidden="true">&#8592;</span>
        </button>
        <div className="qp-place">
          <span>{routeLabel || (mode === "review" ? "Sound practice" : section.chapter?.title)}</span>
          <strong>{stop?.name}</strong>
        </div>
        <div
          className="qp-tally"
          data-live-sparks={liveSparks}
          aria-label={`${collected.size} ${collectible.label} found, ${liveSparks} Sparks ready`}
        >
          <img src={collectible.image} alt="" onError={event => { event.currentTarget.hidden = true; }} />
          <span><strong>{collected.size}</strong><small>{liveSparks} Sparks</small></span>
        </div>
      </header>

      <div className="qp-progress" aria-label={`${solved.size} of ${section.encounters.length} trail tasks complete`}>
        {section.encounters.map(item => <span key={item.id} className={solved.has(item.id) ? "is-done" : item.id === encounter?.id ? "is-current" : ""} />)}
      </div>

      {!ceremony && pickupNotice && <aside className="qp-pickup-notice" role="status">{pickupNotice}</aside>}

      {ceremony && ready && (
        <section className="qp-cue qp-ceremony-cue" aria-live="polite">
          <span>{section.chapter?.title} restored</span>
          <strong>Everyone made it to {section.chapter?.destination}</strong>
        </section>
      )}

      {cueVisible && (
        <section
          key={`${stage?.id || phase}:${feedback || "prompt"}`}
          ref={taskFocusRef}
          tabIndex={-1}
          className={`qp-cue ${feedback ? "has-feedback" : ""} ${cueCompact ? "is-compact" : ""}`}
          aria-live="polite"
        >
          {phase === "teach" ? (
            <>
              <span>New sound</span>
              <strong>{firstTeachEntry?.label || firstTeachEntry?.id}</strong>
              <div>
                {isSoundEnabled && teachCueAvailable && <button type="button" className="qp-cue-icon" onClick={replayCue} aria-label="Hear the sound again"><span aria-hidden="true">&#9835;</span></button>}
                <button type="button" className="qp-cue-action" onClick={beginTrail}>Let&apos;s go</button>
              </div>
            </>
          ) : phase === "gate" ? (
            <><span>Trail clear</span><strong>Walk through the open gate</strong></>
          ) : (
            <>
              <span>{encounter?.friend || "Trail friend"}</span>
              <strong>{feedback || shortPrompt(stage, stageSoundDelivered)}</strong>
              {isSoundEnabled && stageCueAvailable && <button type="button" className="qp-cue-icon" onClick={replayCue} aria-label="Hear the sound again"><span aria-hidden="true">&#9835;</span></button>}
              {stageCount > 1 && <small>{fieldStage + 1} / {stageCount}</small>}
            </>
          )}
        </section>
      )}

      {!ready && <div className="qp-loading" role="status">Opening the trail…</div>}

      {!ceremony && <nav className="qp-dpad" aria-label="Move your Beastie">
        {[["up", "↑"], ["left", "←"], ["down", "↓"], ["right", "→"]].map(([dir, glyph]) => (
          <button
            key={dir}
            type="button"
            aria-label={`Move ${dir}`}
            /* Keyboard activation (Enter/Space arrives as a click with
               detail 0; pointer clicks already moved on pointerdown);
               press-and-hold repeats so crossing a trail is a held button,
               not forty precision taps. */
            onClick={event => { if (event.detail === 0) runtimeRef.current?.move(dir); }}
            onPointerDown={() => {
              runtimeRef.current?.move(dir);
              window.clearInterval(dpadHoldRef.current);
              dpadHoldRef.current = window.setInterval(() => runtimeRef.current?.move(dir), 180);
            }}
            onPointerUp={() => window.clearInterval(dpadHoldRef.current)}
            onPointerCancel={() => window.clearInterval(dpadHoldRef.current)}
            onPointerLeave={() => window.clearInterval(dpadHoldRef.current)}
          >
            <span aria-hidden="true">{glyph}</span>
          </button>
        ))}
      </nav>}

      {!ceremony && encounterStarted && visibleChoices.length > 0 && (
        <div className={`qp-semantic-choices${COARSE_POINTER ? " is-pinned" : ""}`} aria-label={shortPrompt(stage, stageSoundDelivered)}>
          {visibleChoices.map((choice, index) => (
            <button key={choice.id} type="button" onClick={() => choose(choice.id)}>
              {index + 1}. {choice.label ?? choice.value}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
