import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CreatureFigure from "../CreatureFigure.jsx";
import BookCharacterAvatar from "../BookCharacterAvatar.jsx";
import { MusicToggle } from "../../audio/MusicToggle.jsx";
import { buildTrailSection } from "../../../utils/questHub.js";
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
import { bookCharacterAsset } from "../bookCharacterAvatar.js";
import { starRubric } from "../../../utils/starRubric.js";
import { displayGrapheme, sayGrapheme, sayGraphemeWithName, sayWord } from "../shells/shellContract.js";
import { hasGraphemeAudio, hasWordAudio } from "../../../utils/questAudio.js";
import { seedwakeStopSpec } from "../../../data/questChapterOne.js";
import {
  availableSparks,
  questRewardBonuses,
  SPARKS_PER_DROP
} from "../../../utils/questProgress.js";
import {
  applyQuestTaskInput,
  createSeedwakeVerbState,
  questChoiceFocusIndex,
  restoreSeedwakeVerbState
} from "../../../utils/questSliceSystems.js";
import {
  completeTeachBack,
  correctionKey,
  correctionPresentation,
  nextQueuedReview,
  promptLevelForMode,
  recordCorrectionMiss
} from "../../../utils/questCorrection.js";
import { playSoftBuzz } from "../../../utils/audio/gameSfx.js";
import { playQuestActionSfx, stopQuestActionSfx } from "../../../utils/questActionAudio.js";
import { clampQuestWorldResume } from "../../../utils/questWorldResume.js";
import {
  questPixelMemoryResidentKey,
  questPixelResidentFrameSize,
  questPixelResidentKey,
  questPixelResidentPath
} from "../../../data/questPixelCast.js";

const TWO_D_WORLD_ART = Object.freeze({
  meadow: Object.freeze({
    backdrop: "/images/pals/meadow-panorama.webp",
    tile: "/game-assets/quest-pixel/fallback/meadow-ground.png"
  }),
  dino: Object.freeze({
    backdrop: "/images/pals/dino-panorama.webp",
    tile: "/game-assets/quest-pixel/fallback/dino-ground.png"
  }),
  moonwood: Object.freeze({
    backdrop: "/images/pals/moonwood-panorama.webp",
    tile: "/game-assets/quest-pixel/fallback/moonwood-ground.png"
  })
});

const TWO_D_DISCOVERY_SHAPES = Object.freeze({
  "seedwake-meadow": "lantern",
  "river-gardens": "sign",
  "fossil-canyon": "bone",
  "forge-settlement": "gear",
  "glass-marsh": "reed",
  "storm-coast": "flag",
  "lantern-forest": "moth",
  "star-reach": "star"
});

function learningSequence(task) {
  if (task?.learningSequence?.length) return [...task.learningSequence];
  return (task?.stages || [])
    .map(taskStage => taskStage.items.find(item => item.correct)?.value)
    .filter(value => value != null);
}

function repairLabel(shape = "") {
  if (shape.includes("plank") || shape.includes("bridge")) return "bridge repaired";
  if (shape.includes("fish")) return "fish rescued";
  if (shape.includes("parcel") || shape.includes("crate")) return "cargo delivered";
  if (shape.includes("gear") || shape.includes("paddle") || shape.includes("dial")) return "machine repaired";
  if (shape.includes("bone") || shape.includes("fossil")) return "fossil restored";
  if (shape.includes("lantern") || shape.includes("beacon") || shape.includes("light")) return "light restored";
  if (shape.includes("star")) return "star awakened";
  return "trail object restored";
}

function residentFieldStyle(key, path) {
  const frameSize = questPixelResidentFrameSize(key);
  return {
    backgroundImage: `url(${path})`,
    "--q2d-resident-frame": `${frameSize}px`,
    "--q2d-resident-sheet": `${frameSize * 4}px`,
    "--q2d-resident-scale": frameSize > 16 ? 1.18 : 3
  };
}

function residentDiscoveryStyle(key, path) {
  const frameSize = questPixelResidentFrameSize(key);
  const displaySize = frameSize > 16 ? 64 : 48;
  return {
    backgroundImage: `url(${path})`,
    "--q2d-discovery-size": `${displaySize}px`,
    "--q2d-discovery-sheet": `${displaySize * 4}px`
  };
}

export default function QuestTrail2D({
  stopId,
  state,
  resume = null,
  isSoundEnabled = true,
  isMusicEnabled = true,
  mode = "journey",
  routeLabel = null,
  targetsOverride = null,
  onAnswer,
  onInteraction,
  onCheckpoint,
  onFinish,
  onAudioState,
  onMusicEnabledChange,
  onQuit
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
      // stopsDone.length matches QuestHub's seed: replays vary here too,
      // instead of the accessibility mode being the easier-to-memorise mode.
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
  const [beatIndex, setBeatIndex] = useState(initialResume.beatIndex);
  const [fieldStage, setFieldStage] = useState(initialResume.fieldStage);
  const [feedback, setFeedback] = useState("");
  const [corrections, setCorrections] = useState(() => resume?.corrections || {});
  const [collected, setCollected] = useState(() => new Set(resume?.drops || []));
  const [completionMarks, setCompletionMarks] = useState(() => resume?.completionMarks || []);
  const [visitedMemoryIds, setVisitedMemoryIds] = useState(() => new Set(resume?.visitedMemoryIds || []));
  const [memoryStory, setMemoryStory] = useState(null);
  const tallyRef = useRef(resume?.tally || { correct: 0, total: 0, mistakes: 0 });
  const firstTallyRef = useRef(new Map());
  const slowResponsesRef = useRef(Math.max(0, Number(resume?.slowResponses) || 0));
  const pacingDeferredRef = useRef(Math.max(0, Number(resume?.pacingDeferred) || 0));
  const correctionsRef = useRef(resume?.corrections || {});
  const reviewQueueRef = useRef(resume?.reviewQueue || []);
  const reviewedBeatsRef = useRef(resume?.reviewedBeats || []);
  const remediationBeatRef = useRef(Number.isInteger(resume?.remediationBeat) ? resume.remediationBeat : null);
  const verbStateRef = useRef(null);
  const verbTaskKeyRef = useRef(null);
  const teachTimerRef = useRef(0);
  const cueTimerRef = useRef(0);
  const interactionRef = useRef(onInteraction);
  const completionMarksRef = useRef(completionMarks);
  const stageShownAtRef = useRef({ key: null, at: 0 });
  const taskFocusRef = useRef(null);
  const firstTeachEntry = phase === "teach" ? (section?.teach?.[0] || null) : null;

  // The 2D mode is the ACCESSIBILITY mode — and it was the one place the
  // teach moment made no sound at all. The sound is the lesson; say it the
  // moment it appears, exactly as the 3D guide does.
  useEffect(() => {
    if (firstTeachEntry && isSoundEnabled) sayGraphemeWithName(firstTeachEntry.id, true);
  }, [firstTeachEntry, isSoundEnabled]);

  const encounter = section?.encounters[encounterIndex] || null;
  const beat = encounter?.beats?.[beatIndex] || null;
  const task = useMemo(
    () => encounter && beat ? buildPhysicalTask(section, encounter, beat, beatIndex) : null,
    [beat, beatIndex, encounter, section]
  );
  const stage = physicalStage(task, fieldStage);
  const activeCorrectionKey = correctionKey(encounter, beatIndex, fieldStage);
  const activeCorrection = correctionPresentation(stage, corrections[activeCorrectionKey]);
  const visibleChoices = stage?.items?.filter(choice => activeCorrection.visibleIds.includes(choice.id)) || [];
  const collectible = seedwakeStopSpec(stopId)?.collectible;
  const stageAudioKind = stage?.audioCue?.kind || null;
  const stageAudioValue = stage?.audioCue?.value || null;
  const stageCueAvailable = stageAudioKind === "grapheme"
    ? hasGraphemeAudio(stageAudioValue)
    : stageAudioKind === "word" && hasWordAudio(stageAudioValue);
  const stageSoundDelivered = Boolean(isSoundEnabled && stageCueAvailable);
  const stageRecordsMastery = physicalStageRecordsMastery(stage, stageSoundDelivered);
  const visiblePrompt = stage?.rhythm
    ? "Choose the glowing answer"
    : stageRecordsMastery
    ? activeCorrection.prompt
    : physicalStagePrompt(stage, false);
  const visibleChoiceSignature = visibleChoices.map(choice => choice.id).join("|");
  const worldArt = TWO_D_WORLD_ART[section?.world] || TWO_D_WORLD_ART.meadow;
  const bookAvatar = bookCharacterAsset(state.creature, {
    pose: phase === "gate" ? "cheer" : undefined
  });
  const residentKey = questPixelResidentKey(
    section?.chapter?.id,
    encounter?.friend,
    section?.world
  );
  const residentSprite = questPixelResidentPath(residentKey);
  const guideKey = questPixelResidentKey(
    section?.chapter?.id,
    section?.guide?.friend,
    section?.world
  );
  const guideSprite = questPixelResidentPath(guideKey);
  const previousBestDrops = Math.max(0, Number(state.trail?.drops?.[stopId]) || 0);
  const pendingDropCount = Math.max(0, collected.size - previousBestDrops);
  const liveSparks = availableSparks(state) + (pendingDropCount * SPARKS_PER_DROP);
  const optionalDiscovery = section?.drops.some(drop => drop.cache && collected.has(drop.id))
    ? section.chapter?.optionalDiscovery
    : null;
  const discoverySpeaker = String(optionalDiscovery?.title || "").split(/[\u2019']/)[0].trim().toLowerCase();
  const discoveryResidentKey = questPixelResidentKey(
    section?.chapter?.id,
    discoverySpeaker,
    section?.world
  );
  const discoveryResidentSprite = questPixelResidentPath(discoveryResidentKey);
  const discoveryShape = TWO_D_DISCOVERY_SHAPES[section?.chapter?.id] || "star";
  const nextMemory = section?.restoredMoments.find(moment => !visitedMemoryIds.has(moment.id)) || null;
  const memoryResidentKey = questPixelMemoryResidentKey(
    section?.chapter?.id,
    nextMemory?.sourceStopId,
    section?.world
  );
  const memoryResidentSprite = questPixelResidentPath(memoryResidentKey);

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

  useEffect(() => {
    onAudioState?.(phase === "trail" && task ? "encounter" : "travel");
  }, [onAudioState, phase, task]);

  useEffect(() => {
    if (!stageCueAvailable || !isSoundEnabled) return;
    if (stageAudioKind === "grapheme") sayGrapheme(stageAudioValue, true);
    else if (stageAudioKind === "word") sayWord(stageAudioValue, true);
  }, [stage?.id, stageAudioKind, stageAudioValue, stageCueAvailable, isSoundEnabled]);

  useEffect(() => {
    correctionsRef.current = corrections;
  }, [corrections]);

  useEffect(() => {
    interactionRef.current = onInteraction;
  }, [onInteraction]);

  useEffect(() => {
    completionMarksRef.current = completionMarks;
  }, [completionMarks]);

  useEffect(() => {
    if (phase !== "trail" || !stage?.id) return;
    const key = `${encounter?.id || "encounter"}:${beatIndex}:${fieldStage}:${stage.id}`;
    if (stageShownAtRef.current.key === key) return;
    stageShownAtRef.current = { key, at: performance.now() };
    interactionRef.current?.({
      type: "prompt-shown",
      mechanic: task?.mechanic || null
    });
    if (stage.rhythm) {
      interactionRef.current?.({
        type: "accessible-timing-support",
        mechanic: task?.mechanic || null
      });
    }
  }, [beatIndex, encounter?.id, fieldStage, phase, stage?.id, stage?.rhythm, task?.mechanic]);

  useEffect(() => {
    if (!task?.key || verbTaskKeyRef.current === task.key) return;
    verbTaskKeyRef.current = task.key;
    verbStateRef.current = task.chapterAuthored
      ? restoreSeedwakeVerbState(task.mechanic, learningSequence(task), task.stages, fieldStage)
      : null;
  }, [fieldStage, task]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      // A tapped answer can leave the overflowing task panel scrolled down.
      // Reset before moving focus so the next spoken prompt is also visible.
      if (taskFocusRef.current?.parentElement) {
        taskFocusRef.current.parentElement.scrollTop = 0;
      }
      taskFocusRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeCorrection.mode, phase, stage?.id, visibleChoiceSignature]);

  useEffect(() => () => {
    if (teachTimerRef.current) window.clearTimeout(teachTimerRef.current);
    if (cueTimerRef.current) window.clearTimeout(cueTimerRef.current);
    stopQuestActionSfx();
  }, []);

  if (!section) return null;

  const checkpoint = overrides => onCheckpoint?.({
    stopId,
    fallback2d: true,
    phase,
    meetIndex: 0,
    activeId: encounter?.id || null,
    beatIndex,
    fieldStage,
    drops: [...collected],
    completionMarks: completionMarksRef.current,
    visitedMemoryIds: [...visitedMemoryIds],
    tally: tallyRef.current,
    slowResponses: slowResponsesRef.current,
    pacingDeferred: pacingDeferredRef.current,
    corrections: correctionsRef.current,
    reviewQueue: reviewQueueRef.current,
    reviewedBeats: reviewedBeatsRef.current,
    remediationBeat: remediationBeatRef.current,
    ...overrides
  });

  const visitMemory = () => {
    if (!nextMemory?.story) return;
    const nextVisited = new Set(visitedMemoryIds);
    nextVisited.add(nextMemory.id);
    setVisitedMemoryIds(nextVisited);
    setMemoryStory(nextMemory);
    interactionRef.current?.({
      type: "memory-greeting",
      sourceStopId: nextMemory.sourceStopId,
      speaker: nextMemory.story.speaker
    });
    checkpoint({ visitedMemoryIds: [...nextVisited] });
  };

  const answer = (correct, target, recordMastery = true, meta = {}) => {
    // FIRST ATTEMPT PER BEAT is what stars score: the correction ladder is
    // the intended teaching path, and counting every rung as a fresh mistake
    // punished the child for using it.
    const beatKey = `${encounter?.id || "enc"}:${beatIndex}`;
    if (!firstTallyRef.current.has(beatKey)) {
      firstTallyRef.current.set(beatKey, correct);
      tallyRef.current.total += 1;
      tallyRef.current.correct += correct ? 1 : 0;
      tallyRef.current.mistakes += correct ? 0 : 1;
    }
    if (target == null || !recordMastery) return;
    // Bridge/cave beats carry an ARRAY of graphemes. QuestHub and TrailWalk
    // both fan it out; this path passed the array straight through, so the 2D
    // mode was writing mastery records under garbage keys like "s,a,t" and the
    // real sounds earned nothing. One rule, all three paths.
    for (const one of Array.isArray(target) ? target : [target]) {
      if (one) onAnswer?.(one, correct, encounter?.kind || "2d-trail", meta);
    }
  };

  const beginBeat = (nextIndex, remediation = null) => {
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
  };

  const completeEncounter = () => {
    const earnedCount = Math.round(
      section.drops.length * ((encounterIndex + 1) / Math.max(1, section.encounters.length))
    );
    const nextCollected = new Set(section.drops.slice(0, earnedCount).map(drop => drop.id));
    const newlyCollected = section.drops.filter(drop => nextCollected.has(drop.id) && !collected.has(drop.id));
    const newDropCount = newlyCollected.length;
    if (newDropCount) interactionRef.current?.({ type: "drop", count: newDropCount });
    if (newlyCollected.some(drop => drop.cache)) {
      interactionRef.current?.({ type: "optional-discovery", count: 1 });
    }
    setCollected(nextCollected);
    if (encounterIndex + 1 < section.encounters.length) {
      const next = encounterIndex + 1;
      reviewQueueRef.current = [];
      reviewedBeatsRef.current = [];
      remediationBeatRef.current = null;
      setEncounterIndex(next);
      setBeatIndex(0);
      const nextEncounter = section.encounters[next];
      const nextTask = buildPhysicalTask(section, nextEncounter, nextEncounter.beats[0], 0);
      verbTaskKeyRef.current = nextTask?.key || null;
      verbStateRef.current = nextTask?.chapterAuthored
        ? createSeedwakeVerbState(nextTask.mechanic, learningSequence(nextTask))
        : null;
      checkpoint({
        activeId: nextEncounter.id,
        beatIndex: 0,
        fieldStage: 0,
        drops: [...nextCollected],
        reviewQueue: [],
        reviewedBeats: [],
        remediationBeat: null
      });
      return;
    }
    setPhase("gate");
    checkpoint({ phase: "gate", activeId: null, beatIndex: 0, fieldStage: 0, drops: [...nextCollected] });
  };

  const nextBeat = () => {
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
  };

  const choose = choice => {
    if (!choice || !stage) return;
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
        onBeat: true
      }
    });
    verbStateRef.current = verbResult.state;
    const right = Boolean(choice.correct && verbResult.accepted);
    if (!right && choice.correct && verbResult.recordAttempt === false) {
      emitStageInteraction("motor-retry", { mechanic: task.mechanic });
      playQuestActionSfx({
        kind: "wait",
        enabled: isSoundEnabled,
        chapterId: section?.chapter?.id,
        verbPattern: stage.verbPattern,
        playerAction: stage.playerAction,
        volume: 0.3
      });
      setFeedback("Wait for the bright glow.");
      return;
    }
    if (!right) {
      emitStageInteraction("response", { correct: false, mechanic: task.mechanic });
      if (isSoundEnabled) playSoftBuzz();
      const preAttemptLevel = promptLevelForMode(correctionsRef.current[activeCorrectionKey]?.mode);
      const nextCorrection = recordCorrectionMiss(correctionsRef.current[activeCorrectionKey], choice.id);
      correctionsRef.current = { ...correctionsRef.current, [activeCorrectionKey]: nextCorrection };
      setCorrections(correctionsRef.current);
      answer(false, stage.items.find(item => item.correct)?.value || beat?.target, stageRecordsMastery, { promptLevel: preAttemptLevel, key: activeCorrectionKey });
      if (nextCorrection.misses >= 3) {
        reviewQueueRef.current = [...new Set([...reviewQueueRef.current, beatIndex])];
      }
      setFeedback(nextCorrection.mode === "teach" ? "This one. Listen." : "Try again. Listen for the sound.");
      // The corrective cue waits for the buzz to land — played together they
      // mask each other. Same 350ms scheduling the 3D path already proved.
      window.clearTimeout(cueTimerRef.current);
      cueTimerRef.current = window.setTimeout(() => {
        if (stage.audioCue?.kind === "grapheme") sayGrapheme(stage.audioCue.value, isSoundEnabled);
        else if (stage.audioCue?.kind === "word") sayWord(stage.audioCue.value, isSoundEnabled);
      }, 350);
      checkpoint({
        corrections: correctionsRef.current,
        reviewQueue: reviewQueueRef.current,
        reviewedBeats: reviewedBeatsRef.current,
        remediationBeat: remediationBeatRef.current
      });
      if (nextCorrection.mode === "teach") {
        if (teachTimerRef.current) window.clearTimeout(teachTimerRef.current);
        teachTimerRef.current = window.setTimeout(() => {
          interactionRef.current?.({ type: "teach-back", mechanic: task.mechanic });
          const guided = completeTeachBack(correctionsRef.current[activeCorrectionKey]);
          correctionsRef.current = { ...correctionsRef.current, [activeCorrectionKey]: guided };
          setCorrections(correctionsRef.current);
          setFeedback("Now find it again.");
          checkpoint({ corrections: correctionsRef.current, reviewQueue: reviewQueueRef.current });
        }, 1250);
      }
      return;
    }
    emitStageInteraction("response", { correct: true, mechanic: task.mechanic });
    playQuestActionSfx({
      kind: "correct",
      enabled: isSoundEnabled,
      chapterId: section?.chapter?.id,
      verbPattern: stage.verbPattern,
      playerAction: stage.playerAction
    });
    if (stage.completion) {
      const mark = {
        ...stage.completion,
        id: stage.completion.id || `${task.key}-${fieldStage}`,
        encounterId: encounter?.id,
        mechanic: task.mechanic,
        label: repairLabel(stage.completion.shape)
      };
      if (!completionMarksRef.current.some(item => item.id === mark.id)) {
        completionMarksRef.current = [...completionMarksRef.current, mark];
        setCompletionMarks(completionMarksRef.current);
      }
    }
    setFeedback("Correct.");
    if (fieldStage + 1 < task.stages.length) {
      const nextStage = fieldStage + 1;
      setFieldStage(nextStage);
      checkpoint({ fieldStage: nextStage });
      return;
    }
    answer(true, task.learningSequence?.length ? task.learningSequence : beat?.target, stageRecordsMastery, { promptLevel: promptLevelForMode(correctionsRef.current[activeCorrectionKey]?.mode), key: activeCorrectionKey });
    nextBeat();
  };

  const encounterTasks = encounter?.beats?.map((encounterBeat, encounterBeatIndex) => (
    buildPhysicalTask(section, encounter, encounterBeat, encounterBeatIndex)
  )) || [];
  const encounterStageCount = encounterTasks.reduce((total, encounterTask) => total + (encounterTask?.stages.length || 0), 0);
  const encounterStageIndex = encounterTasks
    .slice(0, beatIndex)
    .reduce((total, encounterTask) => total + (encounterTask?.stages.length || 0), 0) + fieldStage;

  const moveChoiceFocus = event => {
    const buttons = [...event.currentTarget.querySelectorAll("button:not(:disabled)")];
    const currentIndex = buttons.indexOf(event.target.closest("button"));
    const nextIndex = questChoiceFocusIndex({ currentIndex, count: buttons.length, key: event.key });
    if (nextIndex === currentIndex || nextIndex < 0) return;
    event.preventDefault();
    buttons[nextIndex]?.focus();
  };

  const finish = () => {
    const score = tallyRef.current;
    const stars = starRubric({ correct: score.correct, total: score.total, mistakes: score.mistakes, deaths: 0 });
    onFinish?.(stars, { ...score, drops: collected.size });
  };

  const displayedEncounterProgress = phase === "gate"
    ? section.encounters.length
    : phase === "trail"
      ? Math.min(section.encounters.length, encounterIndex + 1)
      : 0;

  return (
    <main
      className="q-screen q2d-root"
      data-world={section.world}
      data-play-mode={mode}
      data-reduced-motion={state.settings?.reducedMotion ? "true" : undefined}
    >
      <header className="q2d-header">
        <button type="button" className="q-ghost q2d-back" onClick={() => { checkpoint(); onQuit?.(); }}>Back to the map</button>
        <div className="q2d-title">
          <span>{routeLabel || (mode === "review" ? "Sound practice" : section.chapter?.title)}</span>
          <strong>{stop?.name}</strong>
        </div>
        <div className="q2d-header-actions">
          <MusicToggle
            className="q-ghost q2d-music-toggle"
            enabled={isMusicEnabled}
            onToggle={() => onMusicEnabledChange?.(!isMusicEnabled)}
          />
          <span className="q2d-progress" data-live-sparks={liveSparks}>
            {displayedEncounterProgress} / {section.encounters.length}
            <small>{liveSparks} Sparks</small>
          </span>
        </div>
      </header>

      <section
        className="q2d-world"
        aria-label={`${section.chapter?.title || "Sound Seekers"} two-dimensional trail`}
        style={{
          "--q2d-world-backdrop": `url(${worldArt.backdrop})`,
          "--q2d-world-tile": `url(${worldArt.tile})`
        }}
      >
        <div className="q2d-scenery" aria-hidden="true">
          <span className="q2d-sun" />
          <span className="q2d-hills is-far" />
          <span className="q2d-hills is-near" />
          <span className="q2d-path" />
          <span className="q2d-air is-one" />
          <span className="q2d-air is-two" />
        </div>
        <ol className="q2d-route" aria-label="Trail progress">
          {section.encounters.map((item, index) => (
            <li key={item.id} className={index < encounterIndex || phase === "gate" ? "is-done" : index === encounterIndex ? "is-current" : ""}>
              <span>{index + 1}</span><small>{item.friend}</small>
            </li>
          ))}
        </ol>
        <div
          className={`q2d-creature is-pose-${phase === "gate" ? "cheer" : (state.creature?.pose || "idle")}`}
          data-phase={phase}
          aria-hidden="true"
        >
          {bookAvatar ? (
            <BookCharacterAvatar
              creature={state.creature}
              size={180}
              pose={phase === "gate" ? "cheer" : undefined}
              decorative
            />
          ) : (
            <CreatureFigure creature={state.creature} size={150} mood={phase === "gate" ? "cheer" : "idle"} />
          )}
        </div>
        {completionMarks.length > 0 && (
          <ol className="q2d-repairs" aria-label={`${completionMarks.length} trail repairs completed`}>
            {completionMarks.slice(-6).map(mark => (
              <li key={mark.id} data-shape={mark.shape || "restored"} aria-label={mark.label || repairLabel(mark.shape)}>
                <span aria-hidden="true" />
              </li>
            ))}
          </ol>
        )}
        {phase === "trail" && encounter && (
          <div
            className={`q2d-resident ${encounterIndex % 2 ? "is-left" : "is-right"}`}
            aria-hidden="true"
          >
            <span>{encounter.friend}</span>
            <i style={residentFieldStyle(residentKey, residentSprite)} />
          </div>
        )}
        {phase === "teach" && section.guide?.friend && (
          <div className="q2d-resident is-guide" aria-hidden="true">
            <span>{section.guide.friend}</span>
            <i style={residentFieldStyle(guideKey, guideSprite)} />
          </div>
        )}
        {phase === "trail" && nextMemory?.story && !memoryStory && (
          <button
            type="button"
            className="q2d-memory-visit"
            onClick={visitMemory}
            aria-label={`Visit ${nextMemory.story.speaker} at the restored trail`}
          >
            <i style={residentFieldStyle(memoryResidentKey, memoryResidentSprite)} aria-hidden="true" />
            <span><small>Restored trail</small><strong>Visit {nextMemory.story.speaker}</strong></span>
          </button>
        )}
        {memoryStory?.story && (
          <aside className="q2d-memory-story" role="status" aria-live="polite" aria-atomic="true">
            <strong>{memoryStory.story.speaker}</strong>
            <p>{memoryStory.story.line}</p>
            <small>{memoryStory.story.change}</small>
            <button type="button" onClick={() => setMemoryStory(null)} aria-label="Close restored trail story">&#215;</button>
          </aside>
        )}
      </section>

      <section className="q2d-task" aria-live="polite">
        {phase === "teach" && section.teach.length > 0 && (
          <div className="q2d-teach" ref={taskFocusRef} tabIndex={-1} aria-label="Today&apos;s sounds">
            <span className="q2d-kicker">Meet {section.guide.friend}</span>
            <p>Listen to today&apos;s sounds.</p>
            <div className="q2d-sound-row" aria-label="Today&apos;s sounds">
              {section.teach.map(sound => (
                <button
                  key={sound.id}
                  type="button"
                  className="q2d-teach-sound"
                  disabled={!hasGraphemeAudio(sound.id)}
                  onClick={() => sayGrapheme(sound.id, isSoundEnabled)}
                  aria-label={`Hear the sound ${displayGrapheme(sound.id)}`}
                >
                  {displayGrapheme(sound.id)}
                </button>
              ))}
            </div>
            <button type="button" className="q-primary" onClick={() => {
              setPhase("trail");
              checkpoint({ phase: "trail", guideDone: true, meetIndex: 0, activeId: section.encounters[0]?.id || null });
            }}>Continue</button>
          </div>
        )}

        {phase === "trail" && stage && (
          <div className="q2d-physical" data-mechanic={task.mechanic} data-action={stage.playerAction}>
            <div className="q2d-cue" ref={taskFocusRef} tabIndex={-1} aria-labelledby="q2d-active-prompt">
              <strong id="q2d-active-prompt">{visiblePrompt}</strong>
              {stageCueAvailable && (
                <button
                  type="button"
                  onClick={() => {
                    if (stage.audioCue?.kind === "grapheme") sayGrapheme(stage.audioCue.value, true);
                    else if (stage.audioCue?.kind === "word") sayWord(stage.audioCue.value, true);
                  }}
                  aria-label="Hear the sound"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">
                    <path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4Zm11.5-.7v7.4a4.5 4.5 0 0 0 0-7.4Zm0-3.3v2.1a7 7 0 0 1 0 9.8V19a9 9 0 0 0 0-14Z" />
                  </svg>
                  <span>Hear it</span>
                </button>
              )}
            </div>
            <div
              className="q2d-choices"
              role="group"
              aria-labelledby="q2d-active-prompt"
              onKeyDown={moveChoiceFocus}
            >
              {visibleChoices.map(choice => (
                <button
                  key={choice.id}
                  type="button"
                  className={stage.rhythm ? "is-rhythm is-open" : ""}
                  data-shape={choice.shape || "token"}
                  disabled={activeCorrection.mode === "teach"}
                  onClick={() => choose(choice)}
                  aria-describedby="q2d-active-prompt q2d-active-progress"
                >
                  <span className="q2d-choice-prop" aria-hidden="true" />
                  <span>{choice.label || displayGrapheme(choice.value)}</span>
                </button>
              ))}
            </div>
            <p className="q2d-feedback" role="status" aria-live="assertive" aria-atomic="true">{feedback}</p>
            <span id="q2d-active-progress" className="q2d-stage-progress">{Math.min(encounterStageCount, encounterStageIndex + 1)} of {Math.max(1, encounterStageCount)}</span>
          </div>
        )}

        {phase === "trail" && !stage && (
          <div className="q2d-gate" role="status" ref={taskFocusRef} tabIndex={-1}>
            <span className="q2d-kicker">Trail updated</span>
            <h1>Keep going</h1>
            <p>This part of the trail changed while you were away.</p>
            <button type="button" className="q-primary" onClick={completeEncounter}>Continue</button>
          </div>
        )}

        {phase === "gate" && (
          <div className="q2d-gate" role="status" ref={taskFocusRef} tabIndex={-1}>
            <span className="q2d-kicker">Trail restored</span>
            <h1>{section.isChapterFinale ? section.finale?.title : "The gate is open"}</h1>
            <p>You found {collected.size} {collected.size === 1 ? (collectible?.label || "trail find") : (collectible?.plural || "trail finds")}.</p>
            <p>Each find becomes 2 Sparks for your Beastie.</p>
            {optionalDiscovery && (
              <div className="q2d-discovery" aria-label={`${optionalDiscovery.title}: ${optionalDiscovery.message}`}>
                <i
                  className="q2d-discovery-resident"
                  style={residentDiscoveryStyle(discoveryResidentKey, discoveryResidentSprite)}
                  aria-hidden="true"
                />
                <p><strong>{optionalDiscovery.title}</strong><span>{optionalDiscovery.message}</span></p>
                <b className="q2d-discovery-object" data-shape={discoveryShape} aria-hidden="true"><span /></b>
              </div>
            )}
            {section.restoredMoments.length > 0 && <p>{section.restoredMoments.length} earlier places are still glowing.</p>}
            <button type="button" className="q-primary" onClick={finish}>Walk through</button>
          </div>
        )}
      </section>
    </main>
  );
}
