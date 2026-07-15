import { routeDirectionAt, routePointAt } from "./questRouteGraph.js";
import { seedwakeStopSpec } from "../data/questChapterOne.js";

export const PHYSICAL_MECHANICS_BY_ENCOUNTER = Object.freeze({
  "flower-patch": "sound-hunt",
  "hungry-beast": "creature-feed",
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
  return routePointAt(
    section.route,
    Math.min(0.88, Math.max(0, encounter.progress + 0.012)),
    side * 0.48
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

function positionedItems(section, encounter, beatIndex, stageIndex, choices, {
  answer,
  shape,
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
  const presented = allCorrect || answerIndex < 0 || available.length <= 3
    ? available
    : available.filter(choice => choice === answer || selectedDistractors.includes(choice));
  const count = Math.max(1, presented.length);
  const centreProgress = Math.min(0.88, encounter.progress + 0.028);
  const centre = routePointAt(section.route, centreProgress);
  const direction = routeDirectionAt(section.route, centreProgress);
  const right = { x: direction.z, z: -direction.x };
  const radius = count === 1 ? 2.15 : count <= 3 ? 2.75 : 2.9;
  return presented.map((choice, choiceIndex) => {
    const angle = count === 1
      ? 0
      : count <= 3
        ? -0.88 + (choiceIndex / (count - 1)) * 1.76
        : (choiceIndex / count) * Math.PI * 2;
    const forward = count <= 3 ? Math.cos(angle) : Math.cos(angle) * 0.82;
    const lateral = Math.sin(angle);
    const progress = Math.min(
      0.89,
      centreProgress + Math.max(0, forward) * radius / Math.max(1, section.route.totalLength)
    );
    const position = {
      x: centre.x + direction.x * forward * radius + right.x * lateral * radius,
      y: centre.y,
      z: centre.z + direction.z * forward * radius + right.z * lateral * radius
    };
    return {
      id: `${encounter.id}-${beatIndex}-${stageIndex}-${choiceIndex}-${choice}`,
      value: choice,
      label: labels[choice] || label(choice),
      shape,
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
  const position = routePointAt(section.route, Math.min(0.89, encounter.progress + 0.025), (stageIndex - middle) * 0.72);
  const keepsSequenceLabel = shape === "placed-plank" || shape === "echo-rune";
  return {
    id: `${encounter.id}-${beatIndex}-complete-${stageIndex}`,
    value: answer,
    label: keepsSequenceLabel ? label(answer) : "",
    showToken: keepsSequenceLabel,
    shape,
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

function seedwakeAudioCue(beat) {
  if (typeof beat?.target === "string" && !beat.target.startsWith("hw:")) {
    return { kind: "grapheme", value: beat.target };
  }
  if (beat?.word) return { kind: "word", value: beat.word };
  return null;
}

function letterSoundPrompt(beat, stageIndex = 0, stageCount = 1) {
  if (!beat?.word) return "Find the letter that matches the sound";
  return stageCount > 1 && stageIndex > 0
    ? `Find the next sound in '${beat.word}'`
    : `Find the letter that starts '${beat.word}'`;
}

function sequenceSoundPrompt(beat) {
  return beat?.word
    ? `Find the next sound in '${beat.word}'`
    : "Find the next sound you hear";
}

function seedwakeStageSeries(section, encounter, beat, beatIndex, {
  mechanic,
  shape,
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
    audioCue: seedwakeAudioCue(beat),
    items: positionedItems(section, encounter, beatIndex, stageIndex, choices, {
      answer,
      shape,
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
        audioCue: seedwakeAudioCue(beat),
        items: positionedItems(section, encounter, beatIndex, chooseStage, choices, {
          answer,
          shape: "sound-parcel",
          decorate: choice => ({ role: choice === answer ? "target" : "distractor" })
        })
      },
      {
        id: `delivery-carry-${deliverStage}`,
        prompt: "Take it to the marker",
        help: "Keep moving. The parcel travels with your Beastie.",
        playerAction: "carry",
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
          x: markerPosition.x,
          y: markerPosition.y,
          z: markerPosition.z,
          revealStage: deliverStage
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
      completionShape: "awakened-lantern",
      prompt: (_answer, stageIndex, stageCount) => letterSoundPrompt(beat, stageIndex, stageCount),
      help: "Follow the glow and listen for the sleeping lantern's sound.",
      playerAction: "search"
    });
  } else if (mechanic === "flower-jump") {
    stages = seedwakeStageSeries(section, encounter, beat, beatIndex, {
      mechanic,
      shape: "jump-flower",
      completionShape: "flower-step",
      prompt: (_answer, stageIndex, stageCount) => letterSoundPrompt(beat, stageIndex, stageCount),
      help: "Run into the matching bloom and your Beastie will jump.",
      playerAction: "jump"
    });
  } else if (mechanic === "delivery-run") {
    stages = seedwakeDeliveryStages(section, encounter, beat, beatIndex);
  } else if (mechanic === "bridge-build") {
    stages = seedwakeStageSeries(section, encounter, beat, beatIndex, {
      mechanic,
      shape: "river-plank",
      completionShape: "placed-plank",
      prompt: () => sequenceSoundPrompt(beat),
      help: "Walk the sound piece onto Otter Ford. Each right piece stays in place.",
      playerAction: "build"
    });
  } else {
    stages = seedwakeStageSeries(section, encounter, beat, beatIndex, {
      mechanic,
      shape: "chorus-lantern",
      completionShape: "lit-chorus-lantern",
      prompt: (_answer, stageIndex, stageCount) => letterSoundPrompt(beat, stageIndex, stageCount),
      help: "Touch the matching lantern to add its note to Bramble Gate.",
      playerAction: "conduct"
    });
  }
  return { mechanic, stages };
}

function sequenceStages(section, encounter, beat, beatIndex, {
  sequence,
  choices,
  mechanic,
  shape,
  completionShape,
  prompt,
  help,
  audioKind = "word"
}) {
  const answers = sequence || [];
  const available = unique(choices);
  return answers.map((answer, stageIndex) => ({
    id: `${mechanic}-${stageIndex}`,
    prompt: prompt(stageIndex, answers.length),
    help: help(stageIndex, answers.length),
    audioCue: { kind: audioKind, value: beat.word },
    items: positionedItems(section, encounter, beatIndex, stageIndex, available, { answer, shape }),
    completion: completionFor(section, encounter, beatIndex, stageIndex, answers.length, answer, completionShape || shape)
  }));
}

export function buildPhysicalTask(section, encounter, beat, beatIndex = 0) {
  if (!isPhysicalEncounter(encounter, beat)) return null;
  let mechanic = PHYSICAL_MECHANICS_BY_ENCOUNTER[encounter.kind];
  let stages = [];
  let storyText = null;

  const seedwakeSpec = seedwakeStopSpec(section?.stopId);
  if (seedwakeSpec) {
    const seedwakeTask = buildSeedwakeTask(section, encounter, beat, beatIndex, seedwakeSpec);
    mechanic = seedwakeTask.mechanic;
    stages = seedwakeTask.stages;
  }

  if (!stages.length && (encounter.kind === "flower-patch" || encounter.kind === "hungry-beast")) {
    const flower = encounter.kind === "flower-patch";
    stages = [{
      id: `${mechanic}-0`,
      prompt: letterSoundPrompt(beat),
      help: flower ? "Listen, then move to the matching flower." : "Carry the matching sound to the creature.",
      audioCue: { kind: "grapheme", value: beat.target },
      items: positionedItems(section, encounter, beatIndex, 0, beat.choices || [], {
        answer: beat.answer,
        shape: flower ? "flower" : "fruit"
      })
    }];
  } else if (!stages.length && encounter.kind === "word-beast") {
    stages = [{
      id: `${mechanic}-0`,
      prompt: "Find the word you hear",
      help: "Read the cakes and carry the right word to the creature.",
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
      prompt: () => sequenceSoundPrompt(beat),
      help: () => "Walk the sound pieces onto the bridge in order."
    });
  } else if (!stages.length && encounter.kind === "echo-cave") {
    stages = sequenceStages(section, encounter, beat, beatIndex, {
      sequence: beat.answer,
      choices: beat.keys,
      mechanic,
      shape: "echo-orb",
      completionShape: "echo-rune",
      prompt: () => sequenceSoundPrompt(beat),
      help: () => "Catch the sound lights in the order you hear them."
    });
  } else if (!stages.length && encounter.kind === "sheep-pens") {
    const words = beat.items || [];
    stages = words.map((item, stageIndex) => ({
      id: `${mechanic}-${stageIndex}`,
      prompt: `Where does ${item.word} belong?`,
      help: `Listen and move to a sound pen. ${stageIndex + 1} of ${words.length}`,
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
  return {
    key: physicalTaskKey(encounter, beatIndex),
    mechanic,
    chapterVerb: seedwakeSpec?.verb
      || section.chapter?.mechanicRotation?.[Math.max(0, (section.chapterStop || 1) - 1)]
      || mechanic,
    mission: seedwakeSpec?.mission || null,
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
