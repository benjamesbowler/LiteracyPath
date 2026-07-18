import { routeDirectionAt, routePointAt } from "./questRouteGraph.js";
import { seedwakeStopSpec } from "../data/questChapterOne.js";
import { chapterVerbForSection, chapterVerbRecipe } from "../data/questChapterMechanics.js";

export const PHYSICAL_MECHANICS_BY_ENCOUNTER = Object.freeze({
  "flower-patch": "sound-hunt",
  "hungry-beast": "creature-feed",
  "trail-run": "fork-sprint",
  "broken-bridge": "bridge-build",
  "echo-cave": "echo-sequence",
  "sheep-pens": "herd-and-sort",
  "word-beast": "word-delivery",
  signpost: "object-collect",
  "story-rock": "story-choice"
});

export const PHYSICAL_ENCOUNTER_KINDS = Object.freeze(Object.keys(PHYSICAL_MECHANICS_BY_ENCOUNTER));

const unique = values => [...new Set((values || []).filter(value => value != null))];
const label = value => String(value || "").replaceAll("_", "");

export function physicalTaskKey(encounter, beatIndex) {
  return `${encounter?.id || "none"}:${beatIndex}`;
}

export function isPhysicalEncounter(encounter, beat) {
  return Boolean(encounter && beat && PHYSICAL_MECHANICS_BY_ENCOUNTER[encounter.kind]);
}

export function fieldCollisionStep({
  armed = true,
  player,
  items = [],
  stage = null,
  interactionRadius = 1.5,
  releasePadding = 0.48
} = {}) {
  const visibleItems = items.filter(item => (
    item
    && item.visible !== false
    && item.choice
    && (stage == null || item.choice.stage === stage)
  ));
  const radius = Math.max(0.1, Number(interactionRadius) || 1.5);
  const distanceTo = item => Math.hypot(
    (Number(item.x) || 0) - (Number(player?.x) || 0),
    (Number(item.z) || 0) - (Number(player?.z) || 0)
  );
  if (!armed) {
    const clear = visibleItems.every(item => distanceTo(item) >= radius + Math.max(0.2, Number(releasePadding) || 0.48));
    return { armed: clear, choice: null };
  }
  const touched = visibleItems.find(item => distanceTo(item) < radius);
  return touched
    ? { armed: false, choice: touched.choice }
    : { armed: true, choice: null };
}

export function physicalTaskResidentPoint(section, encounter) {
  if (!section?.route || !encounter) return { x: 0, y: 0, z: 0 };
  const side = encounter.order % 2 === 0 ? -1 : 1;
  const lateralDistance = encounter.kind === "broken-bridge" ? 5.45 : 4.45;
  return routePointAt(
    section.route,
    Math.min(0.9, Math.max(0, encounter.progress + 0.032)),
    side * lateralDistance
  );
}

export function physicalTaskForwardLimit(section, encounter, task, baseLimit = 0, interactionRadius = 1.5) {
  if (!section?.route || !encounter || !task?.items?.length) return Math.max(0, Math.min(1, Number(baseLimit) || 0));
  const itemLimit = Math.max(
    encounter.progress || 0,
    ...task.items.map(item => Number.isFinite(item.progress) ? item.progress : encounter.progress || 0)
  );
  const nextEncounter = section.encounters?.find(candidate => candidate.order === encounter.order + 1);
  const lockedBoundary = nextEncounter
    ? nextEncounter.progress - 0.018
    : (section.gate?.progress ?? 1) - 0.008;
  const approachRoom = Math.max(0.006, (Number(interactionRadius) || 1.5) / Math.max(1, section.route.totalLength));
  return Math.max(
    Math.max(0, Math.min(1, Number(baseLimit) || 0)),
    Math.min(lockedBoundary, itemLimit + approachRoom)
  );
}

function layoutOffsets(layout, count, seed) {
  const presets = {
    scatter: [[-3.7, 0.35], [0.15, 3.85], [3.55, 1.05]],
    stepping: [[-2.9, 0.4], [0, 3.15], [2.9, 5.9]],
    delivery: [[-3.35, 0.9], [0, 3.75], [3.35, 0.9]],
    workshop: [[-3.9, 0.55], [-0.45, 3.7], [3.25, 1.45]]
  };
  if (layout === "circle") {
    const radius = count === 1 ? 2.6 : 3.45;
    const phase = (seed % 7) * 0.09 - Math.PI / 2;
    return Array.from({ length: count }, (_, index) => {
      const angle = phase + (index / count) * Math.PI * 2;
      return [Math.cos(angle) * radius, Math.sin(angle) * radius];
    });
  }
  const preset = presets[layout];
  if (preset) {
    if (count === 1) return [[0, preset[1]?.[1] || 2.6]];
    if (count === 2) return [preset[0], preset[2]];
    return preset.slice(0, count);
  }
  const radius = count === 1 ? 2.15 : count <= 3 ? 2.75 : 2.9;
  return Array.from({ length: count }, (_, index) => {
    const angle = count === 1
      ? 0
      : count <= 3
        ? -0.88 + (index / (count - 1)) * 1.76
        : (index / count) * Math.PI * 2;
    return [Math.sin(angle) * radius, Math.cos(angle) * radius * (count <= 3 ? 1 : 0.82)];
  });
}

function positionedItems(section, encounter, beatIndex, stageIndex, choices, {
  answer,
  shape,
  layout = "arc",
  labels = {},
  decorate = () => ({}),
  allCorrect = false
} = {}) {
  const available = unique(choices);
  const answerIndex = available.indexOf(answer);
  const seed = Math.abs((encounter.order + 1) * 31 + beatIndex * 11 + stageIndex * 17);
  const distractors = available.filter(choice => choice !== answer);
  const selectedDistractors = distractors.length > 2
    ? [distractors[seed % distractors.length], distractors[(seed + 1) % distractors.length]]
    : distractors;
  const selected = allCorrect || answerIndex < 0 || available.length <= 3
    ? available
    : available.filter(choice => choice === answer || selectedDistractors.includes(choice));
  const rotation = selected.length ? seed % selected.length : 0;
  const presented = [...selected.slice(rotation), ...selected.slice(0, rotation)];
  const count = Math.max(1, presented.length);
  const centreProgress = Math.min(0.88, encounter.progress + 0.022 + beatIndex * 0.004);
  const centre = routePointAt(section.route, centreProgress);
  const direction = routeDirectionAt(section.route, centreProgress);
  const right = { x: direction.z, z: -direction.x };
  const offsets = layoutOffsets(layout, count, seed);
  return presented.map((choice, choiceIndex) => {
    const [lateral, forward] = offsets[choiceIndex] || [0, 2.6];
    const progress = Math.min(
      0.89,
      centreProgress + Math.max(0, forward) / Math.max(1, section.route.totalLength)
    );
    const position = {
      x: centre.x + direction.x * forward + right.x * lateral,
      y: centre.y,
      z: centre.z + direction.z * forward + right.z * lateral
    };
    return {
      id: `${encounter.id}-${beatIndex}-${stageIndex}-${choiceIndex}-${choice}`,
      value: choice,
      label: labels[choice] || label(choice),
      shape,
      layout,
      correct: allCorrect || choice === answer,
      stage: stageIndex,
      x: position.x,
      y: position.y,
      z: position.z,
      progress,
      order: available.indexOf(choice),
      ...decorate(choice, choiceIndex)
    };
  });
}

function completionFor(section, encounter, beatIndex, stageIndex, stageCount, answer, shape) {
  const middle = (stageCount - 1) / 2;
  const progress = Math.min(0.89, encounter.progress + 0.025);
  const position = routePointAt(section.route, progress, (stageIndex - middle) * 0.72);
  // A placed bridge piece is progress scenery, not another answer. Repeating
  // its grapheme beside the live choices creates a fourth apparent option.
  const keepsSequenceLabel = shape === "echo-rune";
  return {
    id: `${encounter.id}-${beatIndex}-complete-${stageIndex}`,
    value: answer,
    label: keepsSequenceLabel ? label(answer) : "",
    showToken: keepsSequenceLabel,
    shape,
    progress,
    x: position.x,
    y: position.y,
    z: position.z,
    order: stageIndex,
    revealStage: stageIndex
  };
}

function beatAnswers(beat) {
  return Array.isArray(beat?.answer) ? beat.answer : [beat?.answer].filter(value => value != null);
}

function beatChoices(beat) {
  if (Array.isArray(beat?.tray)) return unique(beat.tray);
  if (Array.isArray(beat?.keys)) return unique(beat.keys);
  if (Array.isArray(beat?.pens)) return unique(beat.pens);
  if (Array.isArray(beat?.choices)) return unique(beat.choices);
  if (Array.isArray(beat?.things)) return unique(beat.things.map(thing => thing.id));
  return beatAnswers(beat);
}

function balancedSortItems(items, limit = 3) {
  const available = Array.isArray(items) ? items : [];
  const maximum = Math.max(1, Number(limit) || 3);
  if (available.length <= maximum) return available;

  const selected = [];
  const representedPens = new Set();
  for (const item of available) {
    if (selected.length >= maximum) break;
    if (representedPens.has(item.pen)) continue;
    selected.push(item);
    representedPens.add(item.pen);
  }
  for (const item of available) {
    if (selected.length >= maximum) break;
    if (!selected.includes(item)) selected.push(item);
  }
  return selected;
}

function chapterAnswers(beat, pattern) {
  const answers = beatAnswers(beat);
  const limit = ["single", "delivery", "pursuit", "route", "sort", "tool", "turn", "steer", "signal", "climb"].includes(pattern) ? 1 : 2;
  return answers.slice(0, limit);
}

function physicalVerbPattern(mechanic, verbRecipe) {
  if (verbRecipe?.pattern) return verbRecipe.pattern;
  if (["sound-hunt", "object-collect"].includes(mechanic)) return "search";
  if (mechanic === "flower-jump") return "jump";
  if (["delivery-run", "word-delivery", "creature-feed"].includes(mechanic)) return "delivery";
  if (mechanic === "fork-sprint") return "pursuit";
  if (["bridge-build", "sequence-build", "echo-sequence"].includes(mechanic)) return "assembly";
  if (mechanic === "herd-and-sort") return "sort";
  if (mechanic === "story-choice") return "route";
  if (mechanic === "gate-chorus") return "rhythm";
  return "single";
}

function seedwakeAudioCue(beat) {
  if (beat?.cue?.kind === "word" && beat.cue.word) {
    return { kind: "word", value: beat.cue.word };
  }
  if (typeof beat?.target === "string" && !beat.target.startsWith("hw:")) {
    return { kind: "grapheme", value: beat.target };
  }
  if (beat?.word) return { kind: "word", value: beat.word };
  return null;
}

function letterSoundPrompt(beat, stageIndex = 0, stageCount = 1) {
  if (beat?.cue?.kind === "word" && beat.cue.word) {
    return `Find the ${beat.cuePosition || "matching"} sound in '${beat.cue.word}'`;
  }
  if (!beat?.word) return "Find the letter that matches the sound";
  return stageCount > 1 && stageIndex > 0
    ? `Find the next sound in '${beat.word}'`
    : `Find the first sound in '${beat.word}'`;
}

function sequenceSoundPrompt(beat, stageIndex = 0) {
  if (beat?.cue?.kind === "word" && beat.cue.word) {
    return letterSoundPrompt(beat, stageIndex, beatAnswers(beat).length);
  }
  return beat?.word
    ? stageIndex === 0
      ? `Find the first sound in '${beat.word}'`
      : `Find the next sound in '${beat.word}'`
    : "Find the next sound you hear";
}

function seedwakeStageSeries(section, encounter, beat, beatIndex, {
  mechanic,
  shape,
  layout,
  completionShape,
  prompt,
  help,
  playerAction
}) {
  const answers = beatAnswers(beat);
  const choices = beatChoices(beat);
  return answers.map((answer, stageIndex) => ({
    id: `${mechanic}-${stageIndex}`,
    prompt: prompt(answer, stageIndex, answers.length),
    help: help,
    playerAction,
    layout,
    audioCue: seedwakeAudioCue(beat),
    items: positionedItems(section, encounter, beatIndex, stageIndex, choices, {
      answer,
      shape,
      layout,
      decorate: choice => ({ role: choice === answer ? "target" : "distractor" })
    }),
    completion: {
      ...completionFor(section, encounter, beatIndex, stageIndex, answers.length, answer, completionShape),
      revealStage: stageIndex
    }
  }));
}

function seedwakeDeliveryStages(section, encounter, beat, beatIndex) {
  const answers = beatAnswers(beat);
  const choices = beatChoices(beat);
  return answers.flatMap((answer, answerIndex) => {
    const chooseStage = answerIndex * 2;
    const deliverStage = chooseStage + 1;
    const markerProgress = Math.min(0.89, encounter.progress + 0.045 + answerIndex * 0.008);
    const markerPosition = routePointAt(section.route, markerProgress, answerIndex % 2 ? -1.35 : 1.35);
    const markerId = `${encounter.id}-${beatIndex}-delivery-${answerIndex}`;
    return [
      {
        id: `delivery-pick-${chooseStage}`,
        prompt: beat.word ? `Find the parcel for '${beat.word}'` : "Find the matching parcel",
        help: "Read the labels, then walk into the matching parcel.",
        playerAction: "pick-up",
        layout: "delivery",
        audioCue: seedwakeAudioCue(beat),
        items: positionedItems(section, encounter, beatIndex, chooseStage, choices, {
          answer,
          shape: "sound-parcel",
          layout: "delivery",
          decorate: choice => ({ role: choice === answer ? "target" : "distractor" })
        })
      },
      {
        id: `delivery-carry-${deliverStage}`,
        prompt: "Take it to the marker",
        help: "Keep moving. The parcel travels with your Beastie.",
        playerAction: "carry",
        layout: "destination",
        audioCue: null,
        carryFromStage: chooseStage,
        items: [{
          id: markerId,
          value: markerId,
          label: "deliver",
          shape: "delivery-marker",
          correct: true,
          stage: deliverStage,
          x: markerPosition.x,
          y: markerPosition.y,
          z: markerPosition.z,
          progress: markerProgress,
          order: answerIndex,
          role: "destination"
        }],
        completion: {
          ...completionFor(section, encounter, beatIndex, deliverStage, answers.length * 2, answer, "delivered-parcel"),
          progress: markerProgress,
          x: markerPosition.x,
          y: markerPosition.y,
          z: markerPosition.z,
          revealStage: deliverStage
        }
      }
    ];
  });
}

function seedwakeBridgeStages(section, encounter, beat, beatIndex) {
  const answers = beatAnswers(beat);
  const choices = beatChoices(beat);
  return answers.flatMap((answer, answerIndex) => {
    const liftStage = answerIndex * 2;
    const placeStage = liftStage + 1;
    const markerProgress = Math.min(0.89, encounter.progress + 0.052 + answerIndex * 0.009);
    const markerPosition = routePointAt(section.route, markerProgress, 0);
    const markerId = `${encounter.id}-${beatIndex}-bridge-slot-${answerIndex}`;
    return [
      {
        id: `bridge-lift-${liftStage}`,
        prompt: sequenceSoundPrompt(beat, answerIndex),
        help: "Find the next sound plank and lift it.",
        playerAction: "lift-plank",
        layout: "workshop",
        audioCue: seedwakeAudioCue(beat),
        items: positionedItems(section, encounter, beatIndex, liftStage, choices, {
          answer,
          shape: "river-plank",
          layout: "workshop",
          decorate: choice => ({ role: choice === answer ? "target" : "distractor" })
        })
      },
      {
        id: `bridge-place-${placeStage}`,
        prompt: "Carry it onto the bridge",
        help: "Walk the plank into the glowing bridge slot.",
        playerAction: "place-plank",
        layout: "crossing",
        audioCue: null,
        carryFromStage: liftStage,
        items: [{
          id: markerId,
          value: markerId,
          label: "place",
          shape: "bridge-slot",
          layout: "crossing",
          correct: true,
          stage: placeStage,
          x: markerPosition.x,
          y: markerPosition.y,
          z: markerPosition.z,
          progress: markerProgress,
          order: answerIndex,
          role: "destination"
        }],
        completion: {
          ...completionFor(section, encounter, beatIndex, placeStage, answers.length * 2, answer, "placed-plank"),
          progress: markerProgress,
          x: markerPosition.x,
          y: markerPosition.y,
          z: markerPosition.z,
          revealStage: placeStage
        }
      }
    ];
  });
}

function seedwakeChorusStages(section, encounter, beat, beatIndex) {
  const answers = beatAnswers(beat);
  const choices = beatChoices(beat);
  return answers.flatMap((answer, answerIndex) => {
    const chooseStage = answerIndex * 2;
    const conductStage = chooseStage + 1;
    const chooseItems = positionedItems(section, encounter, beatIndex, chooseStage, choices, {
      answer,
      shape: "chorus-lantern",
      layout: "circle",
      decorate: choice => ({ role: choice === answer ? "target" : "distractor" })
    });
    const selected = chooseItems.find(item => item.correct);
    return [
      {
        id: `chorus-choose-${chooseStage}`,
        prompt: letterSoundPrompt(beat, answerIndex, answers.length),
        help: "Listen, then choose the matching lantern.",
        playerAction: "choose-note",
        layout: "circle",
        audioCue: seedwakeAudioCue(beat),
        items: chooseItems
      },
      {
        id: `chorus-conduct-${conductStage}`,
        prompt: "Tap when it glows",
        help: "Wait for the lantern's bright pulse, then tap it.",
        playerAction: "conduct",
        layout: "rhythm",
        rhythm: true,
        audioCue: null,
        items: [{
          ...selected,
          id: `${selected.id}-rhythm`,
          stage: conductStage,
          layout: "rhythm",
          role: "rhythm-note"
        }],
        completion: {
          ...completionFor(section, encounter, beatIndex, conductStage, answers.length * 2, answer, "lit-chorus-lantern"),
          progress: selected.progress,
          x: selected.x,
          y: selected.y,
          z: selected.z,
          revealStage: conductStage
        }
      }
    ];
  });
}

function buildSeedwakeTask(section, encounter, beat, beatIndex, spec) {
  const mechanic = spec.mechanic;
  let stages;
  if (mechanic === "sound-hunt") {
    stages = seedwakeStageSeries(section, encounter, beat, beatIndex, {
      mechanic,
      shape: "seed-lantern",
      layout: "scatter",
      completionShape: "awakened-lantern",
      prompt: (_answer, stageIndex, stageCount) => letterSoundPrompt(beat, stageIndex, stageCount),
      help: "Follow the glow and listen for the sleeping lantern's sound.",
      playerAction: "search"
    });
  } else if (mechanic === "flower-jump") {
    stages = seedwakeStageSeries(section, encounter, beat, beatIndex, {
      mechanic,
      shape: "jump-flower",
      layout: "stepping",
      completionShape: "flower-step",
      prompt: (_answer, stageIndex, stageCount) => letterSoundPrompt(beat, stageIndex, stageCount),
      help: "Run into the matching bloom and your Beastie will jump.",
      playerAction: "jump"
    });
  } else if (mechanic === "delivery-run") {
    stages = seedwakeDeliveryStages(section, encounter, beat, beatIndex);
  } else if (mechanic === "bridge-build") {
    stages = seedwakeBridgeStages(section, encounter, beat, beatIndex);
  } else {
    stages = seedwakeChorusStages(section, encounter, beat, beatIndex);
  }
  return { mechanic, stages };
}

function chapterStageSeries(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  const answers = chapterAnswers(beat, verbRecipe.pattern);
  const choices = beatChoices(beat);
  return answers.map((answer, stageIndex) => ({
    id: `${mechanic}-${stageIndex}`,
    prompt: letterSoundPrompt(beat, stageIndex, answers.length),
    help: verbRecipe.mission,
    playerAction: verbRecipe.actions[0],
    layout: verbRecipe.layout,
    audioCue: seedwakeAudioCue(beat),
    items: positionedItems(section, encounter, beatIndex, stageIndex, choices, {
      answer,
      shape: verbRecipe.shape,
      layout: verbRecipe.layout,
      decorate: choice => ({ role: choice === answer ? "target" : "distractor" })
    }),
    completion: {
      ...completionFor(section, encounter, beatIndex, stageIndex, answers.length, answer, verbRecipe.completionShape),
      revealStage: stageIndex
    }
  }));
}

function chapterDeliveryStages(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  const answers = chapterAnswers(beat, verbRecipe.pattern);
  const choices = beatChoices(beat);
  const [pickAction, deliverAction] = verbRecipe.actions;
  return answers.flatMap((answer, answerIndex) => {
    const pickStage = answerIndex * 2;
    const deliverStage = pickStage + 1;
    const markerProgress = Math.min(0.89, encounter.progress + 0.045 + (answerIndex * 0.008));
    const markerPosition = routePointAt(section.route, markerProgress, answerIndex % 2 ? -1.35 : 1.35);
    const markerId = `${encounter.id}-${beatIndex}-${mechanic}-marker-${answerIndex}`;
    return [{
      id: `${mechanic}-pick-${pickStage}`,
      prompt: letterSoundPrompt(beat, answerIndex, answers.length),
      help: verbRecipe.mission,
      playerAction: pickAction,
      layout: verbRecipe.layout,
      audioCue: seedwakeAudioCue(beat),
      items: positionedItems(section, encounter, beatIndex, pickStage, choices, {
        answer,
        shape: verbRecipe.shape,
        layout: verbRecipe.layout,
        decorate: choice => ({ role: choice === answer ? "target" : "distractor" })
      })
    }, {
      id: `${mechanic}-deliver-${deliverStage}`,
      prompt: "Take it to the glowing marker",
      help: verbRecipe.mission,
      playerAction: deliverAction,
      layout: "destination",
      audioCue: null,
      carryFromStage: pickStage,
      items: [{
        id: markerId,
        value: markerId,
        label: "",
        shape: `${verbRecipe.shape}-marker`,
        correct: true,
        stage: deliverStage,
        x: markerPosition.x,
        y: markerPosition.y,
        z: markerPosition.z,
        progress: markerProgress,
        order: answerIndex,
        role: "destination"
      }],
      completion: {
        ...completionFor(section, encounter, beatIndex, deliverStage, answers.length * 2, answer, verbRecipe.completionShape),
        progress: markerProgress,
        x: markerPosition.x,
        y: markerPosition.y,
        z: markerPosition.z,
        revealStage: deliverStage
      }
    }];
  });
}

function chapterAssemblyStages(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  const answers = chapterAnswers(beat, verbRecipe.pattern);
  const choices = beatChoices(beat);
  const [liftAction, fitAction] = verbRecipe.actions;
  return answers.flatMap((answer, answerIndex) => {
    const liftStage = answerIndex * 2;
    const fitStage = liftStage + 1;
    const markerProgress = Math.min(0.89, encounter.progress + 0.052 + (answerIndex * 0.009));
    const markerPosition = routePointAt(section.route, markerProgress, 0);
    const markerId = `${encounter.id}-${beatIndex}-${mechanic}-slot-${answerIndex}`;
    return [{
      id: `${mechanic}-lift-${liftStage}`,
      prompt: sequenceSoundPrompt(beat, answerIndex),
      help: verbRecipe.mission,
      playerAction: liftAction,
      layout: verbRecipe.layout,
      audioCue: seedwakeAudioCue(beat),
      items: positionedItems(section, encounter, beatIndex, liftStage, choices, {
        answer,
        shape: verbRecipe.shape,
        layout: verbRecipe.layout,
        decorate: choice => ({ role: choice === answer ? "target" : "distractor" })
      })
    }, {
      id: `${mechanic}-fit-${fitStage}`,
      prompt: "Fit it into the glowing space",
      help: verbRecipe.mission,
      playerAction: fitAction,
      layout: "crossing",
      audioCue: null,
      carryFromStage: liftStage,
      items: [{
        id: markerId,
        value: markerId,
        label: "",
        shape: `${verbRecipe.shape}-slot`,
        correct: true,
        stage: fitStage,
        x: markerPosition.x,
        y: markerPosition.y,
        z: markerPosition.z,
        progress: markerProgress,
        order: answerIndex,
        role: "destination"
      }],
      completion: {
        ...completionFor(section, encounter, beatIndex, fitStage, answers.length * 2, answer, verbRecipe.completionShape),
        progress: markerProgress,
        x: markerPosition.x,
        y: markerPosition.y,
        z: markerPosition.z,
        revealStage: fitStage
      }
    }];
  });
}

function chapterRhythmStages(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  const answers = chapterAnswers(beat, verbRecipe.pattern);
  const choices = beatChoices(beat);
  const [chooseAction, pulseAction] = verbRecipe.actions;
  return answers.flatMap((answer, answerIndex) => {
    const chooseStage = answerIndex * 2;
    const pulseStage = chooseStage + 1;
    const chooseItems = positionedItems(section, encounter, beatIndex, chooseStage, choices, {
      answer,
      shape: verbRecipe.shape,
      layout: verbRecipe.layout,
      decorate: choice => ({ role: choice === answer ? "target" : "distractor" })
    });
    const selected = chooseItems.find(item => item.correct);
    return [{
      id: `${mechanic}-choose-${chooseStage}`,
      prompt: letterSoundPrompt(beat, answerIndex, answers.length),
      help: verbRecipe.mission,
      playerAction: chooseAction,
      layout: verbRecipe.layout,
      audioCue: seedwakeAudioCue(beat),
      items: chooseItems
    }, {
      id: `${mechanic}-pulse-${pulseStage}`,
      prompt: "Tap when it glows",
      help: verbRecipe.mission,
      playerAction: pulseAction,
      layout: "rhythm",
      rhythm: true,
      audioCue: null,
      items: [{ ...selected, id: `${selected.id}-pulse`, stage: pulseStage, layout: "rhythm", role: "rhythm-note" }],
      completion: {
        ...completionFor(section, encounter, beatIndex, pulseStage, answers.length * 2, answer, verbRecipe.completionShape),
        progress: selected.progress,
        x: selected.x,
        y: selected.y,
        z: selected.z,
        revealStage: pulseStage
      }
    }];
  });
}

function chapterRouteStages(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  const answer = chapterAnswers(beat, verbRecipe.pattern)[0];
  const choices = beatChoices(beat);
  const [chooseAction, followAction] = verbRecipe.actions;
  const markerProgress = Math.min(0.89, encounter.progress + 0.058);
  const markerPosition = routePointAt(section.route, markerProgress, encounter.order % 2 ? -0.65 : 0.65);
  const markerId = `${encounter.id}-${beatIndex}-${mechanic}-route`;
  return [{
    id: `${mechanic}-choose-0`,
    prompt: letterSoundPrompt(beat, 0, 1),
    help: verbRecipe.mission,
    playerAction: chooseAction,
    layout: verbRecipe.layout,
    audioCue: seedwakeAudioCue(beat),
    items: positionedItems(section, encounter, beatIndex, 0, choices, {
      answer,
      shape: verbRecipe.shape,
      layout: verbRecipe.layout,
      decorate: choice => ({ role: choice === answer ? "target" : "distractor" })
    })
  }, {
    id: `${mechanic}-follow-1`,
    prompt: "Follow the glowing trail",
    help: verbRecipe.mission,
    playerAction: followAction,
    layout: "destination",
    audioCue: null,
    items: [{
      id: markerId,
      value: markerId,
      label: "",
      shape: `${verbRecipe.shape}-route`,
      correct: true,
      stage: 1,
      x: markerPosition.x,
      y: markerPosition.y,
      z: markerPosition.z,
      progress: markerProgress,
      role: "route-destination"
    }],
    completion: {
      ...completionFor(section, encounter, beatIndex, 1, 2, answer, verbRecipe.completionShape),
      progress: markerProgress,
      x: markerPosition.x,
      y: markerPosition.y,
      z: markerPosition.z,
      revealStage: 1
    }
  }];
}

function chapterSortStages(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  const answer = chapterAnswers(beat, verbRecipe.pattern)[0];
  const [chooseAction, sortAction] = verbRecipe.actions;
  const chooseItems = positionedItems(section, encounter, beatIndex, 0, beatChoices(beat), {
    answer,
    shape: verbRecipe.shape,
    layout: "sorting-lane",
    decorate: choice => ({ role: choice === answer ? "sort-target" : "sort-distractor" })
  });
  const selected = chooseItems.find(item => item.correct);
  const destinationProgress = Math.min(0.89, encounter.progress + 0.042);
  const destinationPosition = routePointAt(section.route, destinationProgress, encounter.order % 2 ? -0.48 : 0.48);
  const destinationId = `${encounter.id}-${beatIndex}-${mechanic}-sorter`;
  return [{
    id: `${mechanic}-sort-0`,
    prompt: letterSoundPrompt(beat, 0, 1),
    help: verbRecipe.mission,
    playerAction: chooseAction,
    layout: "sorting-lane",
    sorting: true,
    audioCue: seedwakeAudioCue(beat),
    items: chooseItems
  }, {
    id: `${mechanic}-deliver-1`,
    prompt: mechanic === "canal-sort"
      ? "Carry it to the sluice"
      : mechanic === "ore-sort"
        ? "Tip it into the hopper"
        : "Carry it to the prism",
    help: verbRecipe.mission,
    playerAction: sortAction,
    layout: "destination",
    sorting: true,
    carryFromStage: 0,
    audioCue: null,
    items: [{
      id: destinationId,
      value: destinationId,
      label: "",
      shape: `${verbRecipe.shape}-slot`,
      correct: true,
      stage: 1,
      x: destinationPosition.x,
      y: destinationPosition.y,
      z: destinationPosition.z,
      progress: destinationProgress,
      role: "sort-destination",
      sortLateral: encounter.order % 2 ? -42 : 42
    }],
    completion: {
      ...completionFor(section, encounter, beatIndex, 1, 2, answer, verbRecipe.completionShape),
      progress: destinationProgress,
      x: destinationPosition.x,
      y: destinationPosition.y,
      z: destinationPosition.z,
      revealStage: 1,
      carriedShape: selected?.shape || verbRecipe.shape
    }
  }];
}

function chapterPursuitStages(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  const answer = chapterAnswers(beat, verbRecipe.pattern)[0];
  const [spotAction, catchAction] = verbRecipe.actions;
  const spotItems = positionedItems(section, encounter, beatIndex, 0, beatChoices(beat), {
    answer,
    shape: verbRecipe.shape,
    layout: verbRecipe.layout,
    decorate: choice => ({ role: choice === answer ? "pursuit-target" : "distractor" })
  });
  const selected = spotItems.find(item => item.correct);
  const targetProgress = Math.min(0.89, encounter.progress + 0.052);
  const targetLateral = encounter.order % 2 ? -54 : 54;
  const targetPosition = routePointAt(section.route, targetProgress, targetLateral / 60);
  return [{
    id: `${mechanic}-spot-0`,
    prompt: letterSoundPrompt(beat, 0, 1),
    help: verbRecipe.mission,
    playerAction: spotAction,
    layout: verbRecipe.layout,
    pursuitStep: 0,
    audioCue: seedwakeAudioCue(beat),
    items: spotItems
  }, {
    id: `${mechanic}-chase-1`,
    prompt: mechanic === "moth-herding"
      ? "Guide it to the lantern"
      : mechanic === "rescue-chase"
        ? "Run to the signal"
        : "Catch it",
    help: verbRecipe.mission,
    playerAction: catchAction,
    layout: "pursuit-finish",
    pursuitStep: 1,
    audioCue: null,
    items: [{
      ...selected,
      id: `${selected.id}-chase`,
      label: "",
      stage: 1,
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      progress: targetProgress,
      role: "pursuit-target",
      pursuitLateral: targetLateral
    }],
    completion: {
      ...completionFor(section, encounter, beatIndex, 1, 2, answer, verbRecipe.completionShape),
      progress: targetProgress,
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      revealStage: 1
    }
  }];
}

function chapterToolStages(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  const answer = chapterAnswers(beat, verbRecipe.pattern)[0];
  const [chooseAction, toolAction] = verbRecipe.actions;
  const chooseItems = positionedItems(section, encounter, beatIndex, 0, beatChoices(beat), {
    answer,
    shape: verbRecipe.shape,
    layout: verbRecipe.layout,
    decorate: choice => ({ role: choice === answer ? "tool-target" : "distractor" })
  });
  const selected = chooseItems.find(item => item.correct);
  return [{
    id: `${mechanic}-choose-0`,
    prompt: letterSoundPrompt(beat, 0, 1),
    help: verbRecipe.mission,
    playerAction: chooseAction,
    layout: verbRecipe.layout,
    audioCue: seedwakeAudioCue(beat),
    items: chooseItems
  }, {
    id: `${mechanic}-work-1`,
    prompt: "Brush it clean",
    help: "Stay beside the fossil while your Beastie brushes away the dust.",
    playerAction: toolAction,
    layout: "tool-work",
    audioCue: null,
    items: [{
      ...selected,
      id: `${selected.id}-tool-work`,
      stage: 1,
      label: "",
      layout: "tool-work",
      role: "tool-work",
      toolHoldMs: 850
    }],
    completion: {
      ...completionFor(section, encounter, beatIndex, 1, 2, answer, verbRecipe.completionShape),
      progress: selected.progress,
      x: selected.x,
      y: selected.y,
      z: selected.z,
      revealStage: 1
    }
  }];
}

function chapterTurnStages(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  const answer = chapterAnswers(beat, verbRecipe.pattern)[0];
  const [chooseAction, turnAction] = verbRecipe.actions;
  const chooseItems = positionedItems(section, encounter, beatIndex, 0, beatChoices(beat), {
    answer,
    shape: verbRecipe.shape,
    layout: verbRecipe.layout,
    decorate: choice => ({ role: choice === answer ? "turn-target" : "distractor" })
  });
  const markerProgress = Math.min(0.89, encounter.progress + 0.036);
  const markerPosition = routePointAt(section.route, markerProgress, 0);
  const turnAngles = [155, -85, 75];
  const turnStages = turnAngles.map((turnAngle, index) => {
    const stageIndex = index + 1;
    const final = stageIndex === turnAngles.length;
    const markerId = `${encounter.id}-${beatIndex}-${mechanic}-turn-${stageIndex}`;
    return {
      id: `${mechanic}-turn-${stageIndex}`,
      prompt: index === 0 ? "Circle the dial" : final ? "Finish the turn" : "Keep turning",
      help: "Move around the observatory dial to align it.",
      playerAction: turnAction,
      layout: "turn-dial",
      turnStep: stageIndex,
      audioCue: null,
      items: [{
        id: markerId,
        value: markerId,
        label: "",
        shape: `${verbRecipe.shape}-turn-node`,
        correct: true,
        stage: stageIndex,
        x: markerPosition.x,
        y: markerPosition.y,
        z: markerPosition.z,
        progress: markerProgress,
        role: "turn-node",
        turnAngle
      }],
      ...(final ? {
        completion: {
          ...completionFor(section, encounter, beatIndex, stageIndex, turnAngles.length + 1, answer, verbRecipe.completionShape),
          progress: markerProgress,
          x: markerPosition.x,
          y: markerPosition.y,
          z: markerPosition.z,
          revealStage: stageIndex
        }
      } : {})
    };
  });
  return [{
    id: `${mechanic}-choose-0`,
    prompt: letterSoundPrompt(beat, 0, 1),
    help: verbRecipe.mission,
    playerAction: chooseAction,
    layout: verbRecipe.layout,
    audioCue: seedwakeAudioCue(beat),
    items: chooseItems
  }, ...turnStages];
}

function chapterSteerStages(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  const answer = chapterAnswers(beat, verbRecipe.pattern)[0];
  const [chooseAction, steerAction] = verbRecipe.actions;
  const chooseItems = positionedItems(section, encounter, beatIndex, 0, beatChoices(beat), {
    answer,
    shape: verbRecipe.shape,
    layout: verbRecipe.layout,
    decorate: choice => ({ role: choice === answer ? "steer-target" : "distractor" })
  });
  const progressOffsets = [0.035, 0.055, 0.074];
  const lateralOffsets = [-58, 58, 0];
  const steerStages = progressOffsets.map((progressOffset, index) => {
    const stageIndex = index + 1;
    const final = stageIndex === progressOffsets.length;
    const markerProgress = Math.min(0.89, encounter.progress + progressOffset);
    const markerPosition = routePointAt(section.route, markerProgress, 0);
    const markerId = `${encounter.id}-${beatIndex}-${mechanic}-gate-${stageIndex}`;
    return {
      id: `${mechanic}-steer-${stageIndex}`,
      prompt: index === 0 ? "Steer through the first gate" : final ? "Dock through the last gate" : "Steer to the next gate",
      help: "Use left and right while the ferry moves upstream.",
      playerAction: steerAction,
      layout: "steer-water",
      steerStep: stageIndex,
      carryFromStage: 0,
      audioCue: null,
      items: [{
        id: markerId,
        value: markerId,
        label: "",
        shape: "river-buoy-gate",
        correct: true,
        stage: stageIndex,
        x: markerPosition.x,
        y: markerPosition.y,
        z: markerPosition.z,
        progress: markerProgress,
        order: index,
        role: "steer-gate",
        steerLateral: lateralOffsets[index]
      }],
      ...(final ? {
        completion: {
          ...completionFor(section, encounter, beatIndex, stageIndex, progressOffsets.length + 1, answer, verbRecipe.completionShape),
          progress: markerProgress,
          x: markerPosition.x,
          y: markerPosition.y,
          z: markerPosition.z,
          revealStage: stageIndex
        }
      } : {})
    };
  });
  return [{
    id: `${mechanic}-choose-0`,
    prompt: letterSoundPrompt(beat, 0, 1),
    help: verbRecipe.mission,
    playerAction: chooseAction,
    layout: verbRecipe.layout,
    audioCue: seedwakeAudioCue(beat),
    items: chooseItems
  }, ...steerStages];
}

function chapterSignalStages(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  const answer = chapterAnswers(beat, verbRecipe.pattern)[0];
  const [chooseAction, signalAction] = verbRecipe.actions;
  const chooseItems = positionedItems(section, encounter, beatIndex, 0, beatChoices(beat), {
    answer,
    shape: verbRecipe.shape,
    layout: verbRecipe.layout,
    decorate: choice => ({ role: choice === answer ? "signal-target" : "distractor" })
  });
  const relayOffsets = [
    { progress: 0.032, lateral: -52 },
    { progress: 0.064, lateral: 52 }
  ];
  const relayStages = relayOffsets.map(({ progress: progressOffset, lateral }, index) => {
    const stageIndex = index + 1;
    const final = stageIndex === relayOffsets.length;
    const markerProgress = Math.min(0.89, encounter.progress + progressOffset);
    const markerPosition = routePointAt(section.route, markerProgress, 0);
    const markerId = `${encounter.id}-${beatIndex}-${mechanic}-relay-${stageIndex}`;
    return {
      id: `${mechanic}-relay-${stageIndex}`,
      prompt: final ? "Send the final signal" : "Stand on the glowing relay",
      help: "Reach the glowing relay and hold steady while the signal travels.",
      playerAction: signalAction,
      layout: "signal-relay",
      signalStep: stageIndex,
      audioCue: null,
      items: [{
        id: markerId,
        value: markerId,
        label: "",
        shape: `${verbRecipe.shape}-relay`,
        correct: true,
        stage: stageIndex,
        x: markerPosition.x,
        y: markerPosition.y,
        z: markerPosition.z,
        progress: markerProgress,
        order: index,
        role: "signal-pad",
        signalLateral: lateral,
        signalHoldMs: 700
      }],
      ...(final ? {
        completion: {
          ...completionFor(section, encounter, beatIndex, stageIndex, relayOffsets.length + 1, answer, verbRecipe.completionShape),
          progress: markerProgress,
          x: markerPosition.x,
          y: markerPosition.y,
          z: markerPosition.z,
          revealStage: stageIndex
        }
      } : {})
    };
  });
  return [{
    id: `${mechanic}-choose-0`,
    prompt: letterSoundPrompt(beat, 0, 1),
    help: verbRecipe.mission,
    playerAction: chooseAction,
    layout: verbRecipe.layout,
    audioCue: seedwakeAudioCue(beat),
    items: chooseItems
  }, ...relayStages];
}

function chapterClimbStages(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  const answer = chapterAnswers(beat, verbRecipe.pattern)[0];
  const [chooseAction, climbAction] = verbRecipe.actions;
  const chooseItems = positionedItems(section, encounter, beatIndex, 0, beatChoices(beat), {
    answer,
    shape: verbRecipe.shape,
    layout: verbRecipe.layout,
    decorate: choice => ({ role: choice === answer ? "climb-target" : "distractor" })
  });
  const holdOffsets = [
    { progress: 0.024, lateral: -34 },
    { progress: 0.047, lateral: 34 },
    { progress: 0.07, lateral: 0 }
  ];
  const climbStages = holdOffsets.map(({ progress: progressOffset, lateral }, index) => {
    const stageIndex = index + 1;
    const final = stageIndex === holdOffsets.length;
    const markerProgress = Math.min(0.89, encounter.progress + progressOffset);
    const markerPosition = routePointAt(section.route, markerProgress, 0);
    const markerId = `${encounter.id}-${beatIndex}-${mechanic}-hold-${stageIndex}`;
    return {
      id: `${mechanic}-climb-${stageIndex}`,
      prompt: index === 0 ? "Climb to the first hold" : final ? "Reach the cliff top" : "Climb to the next hold",
      help: "Move to each rock hold and stay there while your Beastie climbs.",
      playerAction: climbAction,
      layout: "cliff-face",
      climbStep: stageIndex,
      audioCue: null,
      items: [{
        id: markerId,
        value: markerId,
        label: "",
        shape: "cliff-climb-hold",
        correct: true,
        stage: stageIndex,
        x: markerPosition.x,
        y: markerPosition.y,
        z: markerPosition.z,
        progress: markerProgress,
        order: index,
        role: "climb-hold",
        climbLateral: lateral,
        climbHoldMs: 520
      }],
      ...(final ? {
        completion: {
          ...completionFor(section, encounter, beatIndex, stageIndex, holdOffsets.length + 1, answer, verbRecipe.completionShape),
          progress: markerProgress,
          x: markerPosition.x,
          y: markerPosition.y,
          z: markerPosition.z,
          revealStage: stageIndex
        }
      } : {})
    };
  });
  return [{
    id: `${mechanic}-choose-0`,
    prompt: letterSoundPrompt(beat, 0, 1),
    help: verbRecipe.mission,
    playerAction: chooseAction,
    layout: verbRecipe.layout,
    audioCue: seedwakeAudioCue(beat),
    items: chooseItems
  }, ...climbStages];
}

function buildChapterAuthoredTask(section, encounter, beat, beatIndex, mechanic, verbRecipe) {
  if (verbRecipe.pattern === "delivery") {
    return chapterDeliveryStages(section, encounter, beat, beatIndex, mechanic, verbRecipe);
  }
  if (verbRecipe.pattern === "assembly") {
    return chapterAssemblyStages(section, encounter, beat, beatIndex, mechanic, verbRecipe);
  }
  if (verbRecipe.pattern === "rhythm") {
    return chapterRhythmStages(section, encounter, beat, beatIndex, mechanic, verbRecipe);
  }
  if (verbRecipe.pattern === "route") {
    return chapterRouteStages(section, encounter, beat, beatIndex, mechanic, verbRecipe);
  }
  if (verbRecipe.pattern === "sort") {
    return chapterSortStages(section, encounter, beat, beatIndex, mechanic, verbRecipe);
  }
  if (verbRecipe.pattern === "pursuit") {
    return chapterPursuitStages(section, encounter, beat, beatIndex, mechanic, verbRecipe);
  }
  if (verbRecipe.pattern === "tool") {
    return chapterToolStages(section, encounter, beat, beatIndex, mechanic, verbRecipe);
  }
  if (verbRecipe.pattern === "turn") {
    return chapterTurnStages(section, encounter, beat, beatIndex, mechanic, verbRecipe);
  }
  if (verbRecipe.pattern === "steer") {
    return chapterSteerStages(section, encounter, beat, beatIndex, mechanic, verbRecipe);
  }
  if (verbRecipe.pattern === "signal") {
    return chapterSignalStages(section, encounter, beat, beatIndex, mechanic, verbRecipe);
  }
  if (verbRecipe.pattern === "climb") {
    return chapterClimbStages(section, encounter, beat, beatIndex, mechanic, verbRecipe);
  }
  return chapterStageSeries(section, encounter, beat, beatIndex, mechanic, verbRecipe);
}

function sequenceStages(section, encounter, beat, beatIndex, {
  sequence,
  choices,
  mechanic,
  shape,
  completionShape,
  prompt,
  help,
  audioKind = "word",
  playerAction = "collect"
}) {
  const answers = sequence || [];
  const available = unique(choices);
  return answers.map((answer, stageIndex) => ({
    id: `${mechanic}-${stageIndex}`,
    prompt: prompt(stageIndex, answers.length),
    help: help(stageIndex, answers.length),
    playerAction,
    audioCue: { kind: audioKind, value: beat.word },
    items: positionedItems(section, encounter, beatIndex, stageIndex, available, { answer, shape }),
    completion: completionFor(section, encounter, beatIndex, stageIndex, answers.length, answer, completionShape || shape)
  }));
}

export function buildPhysicalTask(section, encounter, beat, beatIndex = 0) {
  if (!isPhysicalEncounter(encounter, beat)) return null;
  const baseMechanic = PHYSICAL_MECHANICS_BY_ENCOUNTER[encounter.kind];
  let mechanic = baseMechanic;
  let stages = [];
  let storyText = null;

  const seedwakeSpec = seedwakeStopSpec(section?.stopId);
  const chapterVerb = chapterVerbForSection(section);
  const verbRecipe = chapterVerbRecipe(chapterVerb);
  const chapterAuthored = Boolean(encounter.order === 0 && (seedwakeSpec || verbRecipe));
  if (chapterAuthored && seedwakeSpec) {
    const seedwakeTask = buildSeedwakeTask(section, encounter, beat, beatIndex, seedwakeSpec);
    mechanic = seedwakeTask.mechanic;
    stages = seedwakeTask.stages;
  } else if (chapterAuthored && verbRecipe) {
    mechanic = chapterVerb;
    stages = buildChapterAuthoredTask(section, encounter, beat, beatIndex, mechanic, verbRecipe);
  }

  if (!stages.length && (encounter.kind === "flower-patch" || encounter.kind === "hungry-beast")) {
    const flower = encounter.kind === "flower-patch";
    stages = [{
      id: `${mechanic}-0`,
      prompt: letterSoundPrompt(beat),
      help: flower ? "Listen, then move to the matching flower." : "Carry the matching sound to the creature.",
      playerAction: flower ? "search" : "carry",
      audioCue: { kind: "grapheme", value: beat.target },
      items: positionedItems(section, encounter, beatIndex, 0, beat.choices || [], {
        answer: beat.answer,
        shape: flower ? "flower" : "fruit"
      })
    }];
  } else if (!stages.length && encounter.kind === "trail-run") {
    // Fluency in the world: the trail forks, one arrow board per choice, and
    // the child RUNS into the one signed with the sound they heard. The DOM
    // view carries the clock; in the field the sprint itself is the pressure.
    stages = [{
      id: `${mechanic}-0`,
      prompt: "Run to the fork that says it",
      help: "Listen, then sprint into the signed fork before the sound fades.",
      playerAction: "sprint",
      audioCue: { kind: "grapheme", value: beat.target },
      items: positionedItems(section, encounter, beatIndex, 0, beat.choices || [], {
        answer: beat.answer,
        shape: "fork-sign"
      })
    }];
  } else if (!stages.length && encounter.kind === "word-beast") {
    stages = [{
      id: `${mechanic}-0`,
      prompt: "Find the word you hear",
      help: "Read the cakes and carry the right word to the creature.",
      playerAction: "carry",
      audioCue: { kind: "word", value: beat.word },
      items: positionedItems(section, encounter, beatIndex, 0, beat.choices || [], {
        answer: beat.answer,
        shape: "cake"
      })
    }];
  } else if (!stages.length && encounter.kind === "signpost") {
    stages = [{
      id: `${mechanic}-0`,
      prompt: beat.text || "Read the sign and find the object.",
      help: "The words on the sign describe the right object.",
      playerAction: "collect",
      audioCue: null,
      items: positionedItems(section, encounter, beatIndex, 0, (beat.things || []).map(thing => thing.id), {
        answer: beat.answer,
        shape: "trail-object",
        decorate: choice => {
          const thing = (beat.things || []).find(item => item.id === choice) || {};
          return {
            shape: thing.id,
            label: [thing.size, thing.colour].filter(Boolean).join(" "),
            colour: thing.colour,
            size: thing.size,
            word: thing.word
          };
        }
      })
    }];
  } else if (!stages.length && encounter.kind === "broken-bridge") {
    stages = sequenceStages(section, encounter, beat, beatIndex, {
      sequence: beat.answer,
      choices: beat.tray,
      mechanic,
      shape: "bridge-plank",
      completionShape: "placed-plank",
      prompt: stageIndex => sequenceSoundPrompt(beat, stageIndex),
      help: () => "Walk the sound pieces onto the bridge in order.",
      playerAction: "build"
    });
  } else if (!stages.length && encounter.kind === "echo-cave") {
    stages = sequenceStages(section, encounter, beat, beatIndex, {
      sequence: beat.answer,
      choices: beat.keys,
      mechanic,
      shape: "echo-orb",
      completionShape: "echo-rune",
      prompt: stageIndex => sequenceSoundPrompt(beat, stageIndex),
      help: () => "Catch the sound lights in the order you hear them.",
      playerAction: "collect"
    });
  } else if (!stages.length && encounter.kind === "sheep-pens") {
    // Six placements made the sort feel like a worksheet and consumed most of a
    // stop's motor budget. Three preserves both sound categories and enough
    // contrast to demonstrate the distinction; deferred examples return through
    // the normal review scheduler instead of extending this one encounter.
    const words = balancedSortItems(beat.items, 3);
    stages = words.map((item, stageIndex) => ({
      id: `${mechanic}-${stageIndex}`,
      prompt: `Where does ${item.word} belong?`,
      help: `Listen and move to a sound pen. ${stageIndex + 1} of ${words.length}`,
      playerAction: "sort",
      audioCue: { kind: "word", value: item.word },
      items: positionedItems(section, encounter, beatIndex, stageIndex, beat.pens || [], {
        answer: item.pen,
        shape: "sound-pen"
      }),
      completion: completionFor(section, encounter, beatIndex, stageIndex, words.length, item.word, "sorted-token")
    }));
  } else if (!stages.length && encounter.kind === "story-rock") {
    storyText = beat.text || "";
    stages = [{
      id: `${mechanic}-0`,
      prompt: "Choose what happens next.",
      help: "Read the story, then walk through a path.",
      playerAction: "choose-path",
      audioCue: null,
      items: positionedItems(section, encounter, beatIndex, 0, beat.choices || [], {
        answer: null,
        shape: "story-path",
        labels: Object.fromEntries((beat.choices || []).map(choice => [choice, choice])),
        allCorrect: true
      })
    }];
  }

  if (!stages.length) return null;
  // Only the first encounter owns the chapter signature verb. Secondary
  // encounters keep their own movement, camera, sound and performance family;
  // otherwise every activity in a stop feels like the opening task in disguise.
  const verbPattern = physicalVerbPattern(mechanic, chapterAuthored ? verbRecipe : null);
  stages = stages.map(stage => ({ ...stage, verbPattern }));
  return {
    key: physicalTaskKey(encounter, beatIndex),
    chapterAuthored,
    baseMechanic,
    mechanic,
    verbPattern,
    chapterVerb: chapterAuthored ? (seedwakeSpec?.verb || chapterVerb) : chapterVerb || mechanic,
    mission: chapterAuthored ? (seedwakeSpec?.mission || verbRecipe?.mission || null) : null,
    layout: chapterAuthored ? stages[0]?.layout || null : null,
    learningSequence: stages
      .filter(stage => stage.audioCue)
      .map(stage => stage.items.find(item => item.correct)?.value)
      .filter(value => value != null),
    encounterId: encounter.id,
    beatIndex,
    storyText,
    stages,
    items: stages.flatMap(stage => stage.items),
    completions: stages.map(stage => stage.completion).filter(Boolean)
  };
}

export function physicalStage(task, stageIndex = 0) {
  if (!task?.stages?.length) return null;
  return task.stages[Math.max(0, Math.min(task.stages.length - 1, Number(stageIndex) || 0))];
}

export function physicalStageRecordsMastery(stage, soundDelivered = true) {
  return Boolean(!stage?.audioCue || soundDelivered);
}

export function physicalStagePrompt(stage, soundDelivered = true, fallback = "Find the right sound") {
  if (!stage) return fallback;
  if (stage.audioCue && !soundDelivered) {
    const correct = stage.items?.find(item => item.correct);
    const label = String(correct?.label ?? correct?.value ?? "the match").split("_")[0];
    return `Find ${label}`;
  }
  return stage.prompt || fallback;
}

export function physicalResponsesInSection(section) {
  return (section?.encounters || []).reduce((total, encounter) => (
    total + (encounter.beats || []).reduce((beatTotal, beat, beatIndex) => (
      beatTotal + (buildPhysicalTask(section, encounter, beat, beatIndex)?.stages.length || 0)
    ), 0)
  ), 0);
}
