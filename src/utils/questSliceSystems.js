import { CHAPTER_VERB_RECIPES } from "../data/questChapterMechanics.js";

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

// Every input step any authored verb understands. Used by
// resyncSeedwakeVerbState to unstick a machine that is refusing a correct
// answer, without it needing to know which verb it is talking to.
const VERB_INPUT_STEPS = Object.freeze([
  "search", "jump", "pick-up", "carry",
  "lift-plank", "place-plank",
  "choose-note", "conduct"
]);

const VERB_INPUTS = Object.freeze({
  "sound-hunt": "search",
  "flower-jump": "jump",
  "delivery-run": "pick-up",
  "bridge-build": "lift-plank",
  "gate-chorus": "conduct"
});

function result(state, accepted, completed, cue, { recordAttempt = true } = {}) {
  return { state, accepted, completed, cue, recordAttempt };
}

// These progress-style verbs are completed by the renderer's actual stage
// list. They intentionally do not advertise a second, contradictory completion
// contract: their authored learning sequence contains one sound while the
// physical route contains three or four action stages.
function progressResult(state, accepted, cue, { recordAttempt = true } = {}) {
  return { state, accepted, cue, recordAttempt };
}

export const SEEDWAKE_VERB_HANDLERS = Object.freeze({
  "sound-hunt": Object.freeze({
    id: "find-and-enter",
    input: VERB_INPUTS["sound-hunt"],
    create: () => ({ found: false }),
    apply: (state, input) => {
      if (input.type !== "search" || !input.correct) return result(state, false, false, "listen-again");
      const next = { ...state, found: true };
      return result(next, true, true, "lantern-wake");
    }
  }),
  "flower-jump": Object.freeze({
    id: "jump-and-land",
    input: VERB_INPUTS["flower-jump"],
    create: () => ({ jumps: 0, landed: false }),
    apply: (state, input) => {
      if (input.type !== "jump" || !input.correct) return result(state, false, false, "soft-landing");
      const next = { ...state, jumps: state.jumps + 1, landed: true };
      return result(next, true, true, "flower-bounce");
    }
  }),
  "delivery-run": Object.freeze({
    id: "carry-and-deliver",
    input: VERB_INPUTS["delivery-run"],
    create: () => ({ carrying: null, delivered: false }),
    apply: (state, input) => {
      if (input.type === "pick-up" && input.correct) {
        const next = { ...state, carrying: input.value, delivered: false };
        return result(next, true, false, "parcel-lift");
      }
      if (input.type === "carry" && input.correct && state.carrying) {
        const next = { ...state, carrying: null, delivered: true };
        return result(next, true, true, "parcel-arrive");
      }
      return result(state, false, false, state.carrying ? "keep-carrying" : "find-parcel");
    }
  }),
  "bridge-build": Object.freeze({
    id: "lift-carry-and-lock",
    input: VERB_INPUTS["bridge-build"],
    create: expected => ({ expected: [...(expected || [])], held: null, placed: [] }),
    apply: (state, input) => {
      const wanted = state.expected[state.placed.length];
      if (input.type === "lift-plank" && input.correct && input.value === wanted && !state.held) {
        return result({ ...state, held: input.value }, true, false, "plank-lift");
      }
      if (input.type === "place-plank" && input.correct && state.held === wanted) {
        const placed = [...state.placed, state.held];
        const next = { ...state, held: null, placed };
        return result(next, true, placed.length === state.expected.length, "plank-lock");
      }
      if (!input.correct || input.value !== wanted) {
        return result(state, false, false, "piece-rejected");
      }
      return result(state, false, false, state.held ? "carry-to-slot" : "find-plank");
    }
  }),
  "gate-chorus": Object.freeze({
    id: "conduct-in-rhythm",
    input: VERB_INPUTS["gate-chorus"],
    create: expected => ({ expected: [...(expected || [])], selected: null, notes: [], pulse: 0 }),
    apply: (state, input) => {
      const wanted = state.expected[state.notes.length];
      if (input.type === "choose-note" && input.correct && input.value === wanted) {
        return result({ ...state, selected: input.value }, true, false, "note-ready");
      }
      if (input.type === "conduct" && input.correct && state.selected === wanted) {
        if (!input.onBeat) return result(state, false, false, "wait-for-pulse", { recordAttempt: false });
        const next = {
          ...state,
          selected: null,
          notes: [...state.notes, wanted],
          pulse: (state.pulse + 1) % 2
        };
        return result(next, true, next.notes.length === next.expected.length, "chorus-pulse");
      }
      return result(state, false, false, "chorus-recue");
    }
  })
});

function chapterVerbHandler(recipe) {
  const [firstAction, secondAction] = recipe.actions;
  if (recipe.pattern === "delivery") {
    return Object.freeze({
      id: `${recipe.pattern}-${firstAction}`,
      input: firstAction,
      create: () => ({ carrying: null, delivered: 0 }),
      apply: (state, input) => {
        if (input.type === firstAction && input.correct && !state.carrying) {
          return result({ ...state, carrying: input.value }, true, false, "cargo-lift");
        }
        if (input.type === secondAction && input.correct && state.carrying) {
          return result({ ...state, carrying: null, delivered: state.delivered + 1 }, true, true, "cargo-arrive");
        }
        return result(state, false, false, state.carrying ? "carry-to-marker" : "find-cargo");
      }
    });
  }
  if (recipe.pattern === "assembly") {
    return Object.freeze({
      id: `${recipe.pattern}-${firstAction}`,
      input: firstAction,
      create: expected => ({ expected: [...(expected || [])], held: null, placed: [] }),
      apply: (state, input) => {
        const wanted = state.expected[state.placed.length];
        if (input.type === firstAction && input.correct && input.value === wanted && !state.held) {
          return result({ ...state, held: input.value }, true, false, "piece-lift");
        }
        if (input.type === secondAction && input.correct && state.held === wanted) {
          const placed = [...state.placed, state.held];
          return result({ ...state, held: null, placed }, true, placed.length === state.expected.length, "piece-lock");
        }
        return result(state, false, false, state.held ? "carry-to-slot" : "find-piece");
      }
    });
  }
  if (recipe.pattern === "rhythm") {
    return Object.freeze({
      id: `${recipe.pattern}-${firstAction}`,
      input: firstAction,
      create: expected => ({ expected: [...(expected || [])], selected: null, notes: [] }),
      apply: (state, input) => {
        const wanted = state.expected[state.notes.length];
        if (input.type === firstAction && input.correct && input.value === wanted) {
          return result({ ...state, selected: input.value }, true, false, "note-ready");
        }
        if (input.type === secondAction && input.correct && state.selected === wanted) {
          if (!input.onBeat) return result(state, false, false, "wait-for-pulse", { recordAttempt: false });
          const notes = [...state.notes, wanted];
          return result({ ...state, selected: null, notes }, true, notes.length === state.expected.length, "signal-pulse");
        }
        return result(state, false, false, "signal-recue");
      }
    });
  }
  if (recipe.pattern === "route") {
    return Object.freeze({
      id: `${recipe.pattern}-${firstAction}`,
      input: firstAction,
      create: () => ({ selected: null, travelled: false }),
      apply: (state, input) => {
        if (input.type === firstAction && input.correct) {
          return result({ ...state, selected: input.value }, true, false, "route-ready");
        }
        if (input.type === secondAction && input.correct && state.selected) {
          return result({ ...state, travelled: true }, true, true, "route-complete");
        }
        return result(state, false, false, state.selected ? "follow-route" : "choose-route");
      }
    });
  }
  if (recipe.pattern === "sort") {
    return Object.freeze({
      id: `${recipe.pattern}-${firstAction}`,
      input: firstAction,
      create: () => ({ selected: null, sorted: 0 }),
      apply: (state, input) => {
        if (input.type === firstAction && input.correct && !state.selected) {
          return result({ ...state, selected: input.value }, true, false, "sort-ready");
        }
        if (input.type === secondAction && input.correct && state.selected) {
          return result({ ...state, selected: null, sorted: state.sorted + 1 }, true, true, "item-sorted");
        }
        return result(state, false, false, state.selected ? "carry-to-sorter" : "sort-recue");
      }
    });
  }
  if (recipe.pattern === "tool") {
    return Object.freeze({
      id: `${recipe.pattern}-${firstAction}`,
      input: firstAction,
      create: () => ({ selected: null, worked: false }),
      apply: (state, input) => {
        if (input.type === firstAction && input.correct) {
          return result({ ...state, selected: input.value }, true, false, "tool-ready");
        }
        if (input.type === secondAction && input.correct && state.selected) {
          return result({ ...state, worked: true }, true, true, "tool-complete");
        }
        return result(state, false, false, state.selected ? "keep-working" : "choose-tool-target");
      }
    });
  }
  if (recipe.pattern === "turn") {
    return Object.freeze({
      id: `${recipe.pattern}-${firstAction}`,
      input: firstAction,
      create: () => ({ selected: null, turns: 0 }),
      apply: (state, input) => {
        if (input.type === firstAction && input.correct) {
          return progressResult({ ...state, selected: input.value }, true, "turn-ready");
        }
        if (input.type === secondAction && input.correct && state.selected) {
          const turns = state.turns + 1;
          return progressResult({ ...state, turns }, true, "dial-turn");
        }
        return progressResult(state, false, state.selected ? "keep-turning" : "choose-orbit");
      }
    });
  }
  if (recipe.pattern === "steer") {
    return Object.freeze({
      id: `${recipe.pattern}-${firstAction}`,
      input: firstAction,
      create: () => ({ selected: null, gates: 0 }),
      apply: (state, input) => {
        if (input.type === firstAction && input.correct) {
          return progressResult({ ...state, selected: input.value }, true, "ferry-ready");
        }
        if (input.type === secondAction && input.correct && state.selected) {
          const gates = state.gates + 1;
          return progressResult({ ...state, gates }, true, "ferry-gate");
        }
        return progressResult(state, false, state.selected ? "keep-steering" : "choose-ferry-cargo");
      }
    });
  }
  if (recipe.pattern === "signal") {
    return Object.freeze({
      id: `${recipe.pattern}-${firstAction}`,
      input: firstAction,
      create: () => ({ selected: null, relays: 0 }),
      apply: (state, input) => {
        if (input.type === firstAction && input.correct) {
          return progressResult({ ...state, selected: input.value }, true, "signal-ready");
        }
        if (input.type === secondAction && input.correct && state.selected) {
          const relays = state.relays + 1;
          return progressResult({ ...state, relays }, true, "signal-sent");
        }
        return progressResult(state, false, state.selected ? "hold-signal" : "choose-signal");
      }
    });
  }
  if (recipe.pattern === "climb") {
    return Object.freeze({
      id: `${recipe.pattern}-${firstAction}`,
      input: firstAction,
      create: () => ({ selected: null, holds: 0 }),
      apply: (state, input) => {
        if (input.type === firstAction && input.correct) {
          return progressResult({ ...state, selected: input.value }, true, "climb-ready");
        }
        if (input.type === secondAction && input.correct && state.selected) {
          const holds = state.holds + 1;
          return progressResult({ ...state, holds }, true, "climb-hold");
        }
        return progressResult(state, false, state.selected ? "keep-climbing" : "choose-climb");
      }
    });
  }
  if (recipe.pattern === "pursuit") {
    return Object.freeze({
      id: `${recipe.pattern}-${firstAction}`,
      input: firstAction,
      create: () => ({ selected: null, caught: false }),
      apply: (state, input) => {
        if (input.type === firstAction && input.correct) {
          return result({ ...state, selected: input.value, caught: false }, true, false, "target-spotted");
        }
        if (input.type === secondAction && input.correct && state.selected) {
          return result({ ...state, caught: true }, true, true, "target-caught");
        }
        return result(state, false, false, state.selected ? "keep-chasing" : "find-target");
      }
    });
  }
  return Object.freeze({
    id: `${recipe.pattern}-${firstAction}`,
    input: firstAction,
    create: () => ({ actions: 0 }),
    apply: (state, input) => {
      if (input.type !== firstAction || !input.correct) return result(state, false, false, "listen-again");
      return result({ ...state, actions: state.actions + 1 }, true, true, "world-action");
    }
  });
}

export const CHAPTER_VERB_HANDLERS = Object.freeze(Object.fromEntries(
  Object.entries(CHAPTER_VERB_RECIPES).map(([mechanic, verbRecipe]) => [mechanic, chapterVerbHandler(verbRecipe)])
));

export function questRhythmPulse(now, periodMs = 920) {
  const period = Math.max(480, Number(periodMs) || 920);
  const phase = ((Math.max(0, Number(now) || 0) % period) / period);
  const wave = (Math.sin(phase * Math.PI * 2 - Math.PI / 2) + 1) / 2;
  return {
    phase,
    intensity: 0.32 + wave * 0.68,
    open: phase >= 0.18 && phase <= 0.78
  };
}

export function seedwakeVerbHandler(mechanic) {
  return SEEDWAKE_VERB_HANDLERS[mechanic] || CHAPTER_VERB_HANDLERS[mechanic] || null;
}

export function createSeedwakeVerbState(mechanic, expected = []) {
  const handler = seedwakeVerbHandler(mechanic);
  return handler ? handler.create(expected) : null;
}

export function applySeedwakeVerbInput(mechanic, state, input) {
  const handler = seedwakeVerbHandler(mechanic);
  if (!handler || !state) return result(state, false, false, "unsupported");
  return handler.apply(state, input || {});
}

// Force a verb forward after a correct answer the verb refused.
//
// The verbs are small state machines (hold a plank, choose a note, then
// conduct it). When their state drifts out of step with the stage the child is
// actually on, they start rejecting the RIGHT answer — and the child is simply
// ignored, which is the one failure a learning game must never produce. The
// caller accepts the answer anyway; this re-syncs the machine so the next
// stage does not inherit the same disagreement.
//
// It re-derives cleanly rather than patching fields, so it cannot invent a
// state the verb's own `create` would never produce.
export function resyncSeedwakeVerbState(mechanic, state, value, stageIndex = 0, action = null) {
  const handler = seedwakeVerbHandler(mechanic);
  if (!handler || !state) return state;

  // Try the action the child actually performed first, then the other inputs
  // this family understands. A verb is a two-step machine (pick up, then place;
  // choose a note, then conduct it) and which step is stuck depends on where
  // the drift happened — so we ask rather than assume.
  const candidates = [action, handler.input, ...VERB_INPUT_STEPS]
    .filter((entry, index, all) => typeof entry === "string" && entry && all.indexOf(entry) === index);

  for (const type of candidates) {
    const attempt = handler.apply(state, { type, correct: true, value, stage: stageIndex, onBeat: true });
    if (attempt.accepted) return attempt.state;
  }
  // Nothing the verb understands moved it. Leave the state alone rather than
  // fabricate one its own `create` would never produce — the caller still
  // credits the child, which is the part that matters.
  return state;
}

export function restoreSeedwakeVerbState(mechanic, expected = [], stages = [], stageIndex = 0) {
  let state = createSeedwakeVerbState(mechanic, expected);
  const completedStageCount = Math.max(0, Math.min(stages.length, Number(stageIndex) || 0));
  for (let index = 0; index < completedStageCount; index += 1) {
    const stage = stages[index];
    const correct = stage?.items?.find(item => item.correct);
    if (!stage || !correct) continue;
    state = applySeedwakeVerbInput(mechanic, state, {
      type: stage.playerAction,
      correct: true,
      value: correct.value,
      stage: index,
      onBeat: true
    }).state;
  }
  return state;
}

export function applyQuestTaskInput({ chapterAuthored = false, mechanic, state, input } = {}) {
  if (chapterAuthored) return applySeedwakeVerbInput(mechanic, state, input);
  const accepted = Boolean(input?.correct);
  return result(state, accepted, accepted, accepted ? "world-action" : "try-again");
}

const QUEST_MECHANIC_PROFILES = Object.freeze({
  "sound-hunt": Object.freeze({ fov: 52, distance: 1.08, elevation: 0.7, side: -0.4, speed: 0.94, collision: 1.08 }),
  "flower-jump": Object.freeze({ fov: 45, distance: 0.88, elevation: -0.3, side: 1.1, speed: 1.12, collision: 0.88 }),
  "delivery-run": Object.freeze({ fov: 49, distance: 1.02, elevation: 0.25, side: -1.05, speed: 0.9, collision: 1 }),
  "bridge-build": Object.freeze({ fov: 47, distance: 1.08, elevation: 0.8, side: 0.25, speed: 0.82, collision: 0.9 }),
  "gate-chorus": Object.freeze({ fov: 46, distance: 0.96, elevation: 0.45, side: 0, speed: 0.96, collision: 0.94 })
});

const DEFAULT_MECHANIC_PROFILE = Object.freeze({
  fov: 48,
  distance: 1,
  elevation: 0,
  side: 0,
  speed: 1,
  collision: 1
});

export function questMechanicProfile(mechanic) {
  return QUEST_MECHANIC_PROFILES[mechanic] || DEFAULT_MECHANIC_PROFILE;
}

export function questPixelChoiceOffsets(layout, count, {
  viewportWidth = 1280,
  zoom = 2.5,
  artHalfWidth = 40,
  safeMargin = 8
} = {}) {
  let offsets;
  if (layout === "sorting-lane") {
    const spacing = count <= 1 ? 0 : Math.min(44, 88 / (count - 1));
    offsets = Array.from({ length: count }, (_, index) => [
      (index - ((count - 1) / 2)) * spacing,
      82
    ]);
  } else if (count === 1) {
    offsets = [layout === "tool-work"
      ? [0, 50]
      : ["destination", "crossing"].includes(layout) ? [72, -8] : [0, -44]];
  } else if (count === 3 && layout === "scatter") {
    offsets = [[-108, 48], [-8, -88], [102, 12]];
  } else if (count === 3 && layout === "stepping") {
    offsets = [[-96, 58], [0, -30], [96, -108]];
  } else if (count === 3 && layout === "delivery") {
    offsets = [[-100, 30], [0, -82], [100, 30]];
  } else if (count === 3 && (layout === "workshop" || layout === "crossing")) {
    offsets = [[-100, -34], [0, 68], [100, -34]];
  } else if (count === 3 && (layout === "circle" || layout === "rhythm")) {
    offsets = [[-96, 30], [0, -84], [96, 30]];
  } else if (count === 3) {
    offsets = [[-96, 32], [0, -74], [96, 32]];
  } else if (count >= 4) {
    offsets = [[-72, 18], [-28, -50], [28, -50], [72, 18]];
  } else if (layout === "circle" || layout === "rhythm") {
    offsets = [[-50, 4], [50, 4]];
  } else if (layout === "stepping") {
    offsets = [[-54, 10], [54, 10]];
  } else if (layout === "workshop" || layout === "crossing") {
    offsets = [[-58, 7], [58, 7]];
  } else if (layout === "delivery") {
    offsets = [[-58, 5], [58, 5]];
  } else {
    offsets = [[-52, 6], [52, 6]];
  }

  const visibleHalfWidth = Math.max(1, Number(viewportWidth) || 1280)
    / (Math.max(0.1, Number(zoom) || 2.5) * 2);
  const lateralLimit = Math.max(28, visibleHalfWidth - artHalfWidth - safeMargin);
  return offsets.map(([lateral, forward]) => [
    Math.max(-lateralLimit, Math.min(lateralLimit, lateral)),
    forward
  ]);
}

export function questPixelSortLaneLayout({
  resident = { x: 0, y: 0 },
  player = { x: 0, y: 82 },
  forward = { x: 0, y: 1 },
  right = { x: 1, y: 0 },
  choiceLeft = -Infinity,
  choiceRight = Infinity,
  count = 3
} = {}) {
  const itemCount = Math.max(1, Math.floor(Number(count) || 1));
  const playerDistance = Math.hypot(
    (Number(player?.x) || 0) - (Number(resident?.x) || 0),
    (Number(player?.y) || 0) - (Number(resident?.y) || 0)
  );
  const forwardDistance = clamp(playerDistance * 0.5, 36, 48);
  const lateralDistance = itemCount === 1 ? 42 : 56;
  const spacing = itemCount === 1 ? 0 : Math.min(36, 72 / (itemCount - 1));
  const candidate = side => {
    const points = Array.from({ length: itemCount }, (_, index) => {
      const laneOffset = (index - ((itemCount - 1) / 2)) * spacing;
      const lateral = (side * lateralDistance) + laneOffset;
      return {
        x: resident.x + (forward.x * forwardDistance) + (right.x * lateral),
        y: resident.y + (forward.y * forwardDistance) + (right.y * lateral)
      };
    });
    const center = {
      x: resident.x + (forward.x * forwardDistance) + (right.x * side * lateralDistance),
      y: resident.y + (forward.y * forwardDistance) + (right.y * side * lateralDistance)
    };
    const edgeRoom = points.reduce((minimum, point) => Math.min(
      minimum,
      point.x - choiceLeft,
      choiceRight - point.x
    ), Infinity);
    return { side, center, points, edgeRoom };
  };
  const leftBay = candidate(-1);
  const rightBay = candidate(1);
  const playerLateral = (
    ((Number(player?.x) || 0) - (Number(resident?.x) || 0)) * (Number(right.x) || 0)
  ) + (
    ((Number(player?.y) || 0) - (Number(resident?.y) || 0)) * (Number(right.y) || 0)
  );
  const fitCandidate = bay => {
    const minX = Math.min(...bay.points.map(point => point.x));
    const maxX = Math.max(...bay.points.map(point => point.x));
    let groupShiftX = 0;
    if (Number.isFinite(choiceLeft) && minX < choiceLeft) {
      groupShiftX = choiceLeft - minX;
    }
    if (Number.isFinite(choiceRight) && maxX + groupShiftX > choiceRight) {
      groupShiftX += choiceRight - (maxX + groupShiftX);
    }
    const points = bay.points.map(point => ({
      x: point.x + groupShiftX,
      y: point.y
    }));
    const actors = [resident, player].filter(Boolean);
    const actorClearance = points.reduce((minimum, point) => Math.min(
      minimum,
      ...actors.map(actor => Math.hypot(
        point.x - (Number(actor?.x) || 0),
        point.y - (Number(actor?.y) || 0)
      ))
    ), Infinity);
    return {
      ...bay,
      center: {
        x: bay.center.x + groupShiftX,
        y: bay.center.y
      },
      points,
      edgeRoom: points.reduce((minimum, point) => Math.min(
        minimum,
        point.x - choiceLeft,
        choiceRight - point.x
      ), Infinity),
      groupShiftX,
      actorClearance
    };
  };
  const fittedLeft = fitCandidate(leftBay);
  const fittedRight = fitCandidate(rightBay);
  const preferred = playerLateral > 8 ? fittedLeft : playerLateral < -8 ? fittedRight : fittedLeft;
  const alternate = preferred === fittedLeft ? fittedRight : fittedLeft;
  // Camera fitting can move a nominally "open" lane back under the child.
  // Choose using the final fitted geometry so the moving tokens remain in the
  // bay with the most room around both the player and the resident. A tiny tie
  // keeps the deterministic side preference stable instead of flickering.
  const selected = preferred.actorClearance >= alternate.actorClearance - 0.5
    ? preferred
    : alternate;
  return {
    ...selected,
    forwardDistance,
    lateralDistance,
    spacing
  };
}

export function questPixelAvoidActorOverlap({
  point = { x: 0, y: 0 },
  actor = null,
  right = { x: 1, y: 0 },
  index = 0,
  clearance = 58,
  nudge = 35
} = {}) {
  const x = Number(point.x) || 0;
  const y = Number(point.y) || 0;
  if (!actor) return { x, y };
  const actorX = Number(actor.x) || 0;
  const actorY = Number(actor.y) || 0;
  const safeClearance = Math.max(0, Number(clearance) || 0);
  if (Math.hypot(x - actorX, y - actorY) >= safeClearance) {
    return { x, y };
  }
  const rightX = Number(right.x) || 0;
  const rightY = Number(right.y) || 0;
  const lateralDelta = ((x - actorX) * rightX) + ((y - actorY) * rightY);
  const side = Math.abs(lateralDelta) > 0.5
    ? Math.sign(lateralDelta)
    : Math.abs(Math.floor(Number(index) || 0)) % 2 ? 1 : -1;
  const perpendicularX = (x - actorX) - (rightX * lateralDelta);
  const perpendicularY = (y - actorY) - (rightY * lateralDelta);
  const perpendicularDistance = Math.hypot(perpendicularX, perpendicularY);
  const requiredLateral = Math.sqrt(Math.max(0, (safeClearance ** 2) - (perpendicularDistance ** 2)));
  const shift = Math.max(
    Math.max(0, Number(nudge) || 0),
    requiredLateral - Math.abs(lateralDelta) + 2
  ) * side;
  return {
    x: x + (rightX * shift),
    y: y + (rightY * shift)
  };
}

export function questPixelCameraZoom({
  width = 1280,
  height = 720,
  profileZoom = 1,
  activeStage = false
} = {}) {
  const viewportWidth = Math.max(320, Number(width) || 1280);
  const viewportHeight = Math.max(480, Number(height) || 720);
  const phone = viewportWidth < 620;
  const base = phone
    ? clamp(viewportWidth / 250, 1.44, 1.72)
    : clamp(Math.min(viewportWidth / 470, viewportHeight / 286), 1.82, 2.38);
  const sceneScale = activeStage ? 1 : 0.9;
  const requested = base * clamp(Number(profileZoom) || 1, 0.8, 1.2) * sceneScale;
  return clamp(requested, phone ? 1.34 : 1.64, phone ? 1.92 : 2.52);
}

export function questPixelEdgeDetailPositions({
  x = 320,
  y = 560,
  encounterIndex = 0,
  worldWidth = 640
} = {}) {
  const centreX = Number(x) || 320;
  const centreY = Number(y) || 560;
  const direction = Math.abs(Math.floor(Number(encounterIndex) || 0)) % 2 ? -1 : 1;
  const maxX = Math.max(28, (Number(worldWidth) || 640) - 28);
  return [
    { x: clamp(centreX - 160, 28, maxX), y: centreY - (direction * 34), side: -1, band: "inner" },
    { x: clamp(centreX - 222, 28, maxX), y: centreY + (direction * 58), side: -1, band: "outer" },
    { x: clamp(centreX + 164, 28, maxX), y: centreY + (direction * 28), side: 1, band: "inner" },
    { x: clamp(centreX + 224, 28, maxX), y: centreY - (direction * 54), side: 1, band: "outer" }
  ];
}

const QUEST_PIXEL_PATTERN_PROFILES = Object.freeze({
  search: Object.freeze({ speed: 1.02, zoom: 1, cameraLead: 28, cameraSide: 0, response: "discover" }),
  jump: Object.freeze({ speed: 1.12, zoom: 1.04, cameraLead: 34, cameraSide: 0, response: "hop" }),
  single: Object.freeze({ speed: 1.04, zoom: 1, cameraLead: 26, cameraSide: 0, response: "interact" }),
  delivery: Object.freeze({ speed: 0.88, zoom: 0.94, cameraLead: 18, cameraSide: -8, response: "carry" }),
  assembly: Object.freeze({ speed: 0.82, zoom: 1.06, cameraLead: 12, cameraSide: 8, response: "build" }),
  pursuit: Object.freeze({ speed: 1.16, zoom: 0.92, cameraLead: 36, cameraSide: 0, response: "chase" }),
  route: Object.freeze({ speed: 1.1, zoom: 0.9, cameraLead: 42, cameraSide: 0, response: "route" }),
  sort: Object.freeze({ speed: 1.06, zoom: 0.98, cameraLead: 20, cameraSide: 0, response: "sort" }),
  tool: Object.freeze({ speed: 0.78, zoom: 1.1, cameraLead: 8, cameraSide: 10, response: "tool" }),
  turn: Object.freeze({ speed: 0.94, zoom: 0.96, cameraLead: 14, cameraSide: -10, response: "turn" }),
  steer: Object.freeze({ speed: 0.86, zoom: 0.88, cameraLead: 48, cameraSide: 0, response: "steer" }),
  signal: Object.freeze({ speed: 0.92, zoom: 1.02, cameraLead: 16, cameraSide: 6, response: "signal" }),
  climb: Object.freeze({ speed: 0.74, zoom: 1.08, cameraLead: 30, cameraSide: 0, response: "climb" }),
  rhythm: Object.freeze({ speed: 0.96, zoom: 1.12, cameraLead: 4, cameraSide: 0, response: "pulse" })
});

function mechanicHash(mechanic) {
  return [...String(mechanic || "")].reduce((hash, character) => (
    Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0
  ), 2166136261);
}

export function questPixelVerbProfile(pattern, mechanic = "") {
  const base = QUEST_PIXEL_PATTERN_PROFILES[pattern] || QUEST_PIXEL_PATTERN_PROFILES.single;
  const hash = mechanicHash(mechanic);
  const speedShift = ((hash % 11) - 5) * 0.008;
  const sideShift = (((hash >>> 5) % 7) - 3) * 2;
  const leadShift = ((hash >>> 9) % 5) - 2;
  return {
    ...base,
    speed: Math.max(0.72, Math.min(1.18, base.speed + speedShift)),
    cameraSide: base.cameraSide + sideShift,
    cameraLead: base.cameraLead + leadShift,
    signature: `${pattern || "single"}:${hash.toString(36)}`
  };
}

export function stepQuestRouteBoundary({
  x = 0,
  velocityX = 0,
  center = 0,
  dt = 0,
  innerRadius = 92,
  outerRadius = 112,
  returnAcceleration = 760
} = {}) {
  const elapsed = clamp(Number(dt) || 0, 0, 0.08);
  const inner = Math.max(0, Number(innerRadius) || 0);
  const outer = Math.max(inner + 1, Number(outerRadius) || inner + 1);
  const offset = (Number(x) || 0) - (Number(center) || 0);
  const distance = Math.abs(offset);
  if (distance <= inner) return { x: Number(x) || 0, velocityX: Number(velocityX) || 0, pressure: 0 };

  const direction = Math.sign(offset) || 1;
  const pressure = clamp((distance - inner) / (outer - inner), 0, 1);
  const correctedX = (Number(center) || 0) + (direction * Math.min(distance, outer));
  let correctedVelocity = (Number(velocityX) || 0)
    - (direction * Math.max(0, Number(returnAcceleration) || 0) * pressure * elapsed);
  if (distance >= outer && Math.sign(correctedVelocity) === direction) correctedVelocity = 0;
  return { x: correctedX, velocityX: correctedVelocity, pressure };
}

// Answer art is deliberately staged around residents, while movement is
// constrained around the authored route. On a tight bend those two coordinate
// systems can disagree far enough that an answer circle never intersects the
// legal player corridor. Derive the active corridor from the exact rendered
// choice positions so collision and navigation always describe the same
// reachable space. `motionPadding` covers choices that sway or travel.
export function questChoiceCorridorRadius({
  choices = [],
  baseRadius = 0,
  contactInset = 4
} = {}) {
  const inset = Math.max(0, Number(contactInset) || 0);
  return (Array.isArray(choices) ? choices : []).reduce((requiredRadius, choice) => {
    const x = Number(choice?.x);
    const routeCenters = (Array.isArray(choice?.routeCenters) ? choice.routeCenters : [])
      .map(Number)
      .filter(Number.isFinite);
    if (!Number.isFinite(x) || !routeCenters.length) return requiredRadius;
    // Encounters and their answer formations are authored from the primary
    // route (`routeCenters[0]`). Optional routes can run much nearer a side
    // answer while still being disconnected at this Y; measuring the nearest
    // centre would then claim an answer is reachable from a lane the child is
    // not on. Encounter contact already brings the player back to the primary
    // resident, so widen from that same primary lane.
    const routeDistance = Math.abs(x - routeCenters[0]);
    const collisionRadius = Math.max(1, Number(choice?.radius) || 1);
    const motionPadding = Math.max(0, Number(choice?.motionPadding) || 0);
    const contactDepth = Math.max(1, collisionRadius - inset);
    return Math.max(requiredRadius, routeDistance + motionPadding - contactDepth);
  }, Math.max(0, Number(baseRadius) || 0));
}

export function questRouteBoundaryProfile({
  gateApproach = false,
  routeCount = 1,
  authored = false,
  pathWidth = 0,
  forwardAssist = false,
  choiceCorridorRadius = 0
} = {}) {
  let profile;
  if (gateApproach) {
    profile = { innerRadius: 18, outerRadius: 46, returnAcceleration: 1120 };
  } else if (Math.max(1, Number(routeCount) || 1) > 1) {
    profile = { innerRadius: 36, outerRadius: 52, returnAcceleration: 760 };
  } else if (authored) {
    const width = Math.max(0, Number(pathWidth) || 0);
    profile = {
      innerRadius: forwardAssist ? 10 : width + 16,
      outerRadius: forwardAssist ? 28 : width + 38,
      returnAcceleration: forwardAssist ? 1480 : 980
    };
  } else {
    profile = { innerRadius: 92, outerRadius: 112, returnAcceleration: 760 };
  }

  // Keep the ordinary trail as authored. Only an on-screen answer can widen
  // it, and the outer wall retains a pressure band rather than becoming a
  // cliff at the edge of the collision circle.
  const answerRadius = Math.max(0, Number(choiceCorridorRadius) || 0);
  if (!answerRadius || gateApproach) return profile;
  const innerRadius = Math.max(profile.innerRadius, answerRadius);
  return {
    ...profile,
    innerRadius,
    outerRadius: Math.max(profile.outerRadius, innerRadius + 22)
  };
}

export function questRestoredMemoryPlacement(index = 0) {
  const side = Number(index) % 2 ? 1 : -1;
  const landmarkLateral = side * 136;
  const cameoLateral = landmarkLateral - (side * 29);
  return { side, landmarkLateral, cameoLateral };
}

export function questRouteLaneSelection({
  x = 0,
  centers = [],
  intentX = 0,
  previousIndex = null,
  switchMargin = 10
} = {}) {
  const lanes = (Array.isArray(centers) ? centers : [])
    .map(Number)
    .filter(Number.isFinite);
  const position = Number(x) || 0;
  if (!lanes.length) return { center: position, index: 0, count: 0 };
  if (lanes.length === 1) return { center: lanes[0], index: 0, count: 1 };

  const probe = position + (clamp(Number(intentX) || 0, -1, 1) * 24);
  let closestIndex = 0;
  let closestDistance = Math.abs(probe - lanes[0]);
  for (let index = 1; index < lanes.length; index += 1) {
    const distance = Math.abs(probe - lanes[index]);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }

  const retainedIndex = Number.isInteger(previousIndex) && previousIndex >= 0 && previousIndex < lanes.length
    ? previousIndex
    : null;
  if (retainedIndex !== null && retainedIndex !== closestIndex) {
    const retainedDistance = Math.abs(probe - lanes[retainedIndex]);
    if (closestDistance + Math.max(0, Number(switchMargin) || 0) >= retainedDistance) {
      closestIndex = retainedIndex;
    }
  }
  return { center: lanes[closestIndex], index: closestIndex, count: lanes.length };
}

export function questOptionalRouteCenters({
  main = 0,
  topology = "",
  progress = 0,
  stopIndex = 1
} = {}) {
  const center = Number(main) || 0;
  const routeProgress = clamp(Number(progress) || 0, 0, 1);
  const stop = Math.max(1, Math.floor(Number(stopIndex) || 1));
  if (topology === "branching-grove" && routeProgress > 0.3 && routeProgress < 0.72) {
    const direction = stop % 2 ? 1 : -1;
    const spread = Math.sin(((routeProgress - 0.3) / 0.42) * Math.PI) * 124;
    return [center, center + (direction * spread)];
  }
  if (topology === "island-loop" && routeProgress > 0.27 && routeProgress < 0.75) {
    const direction = stop % 2 ? -1 : 1;
    const spread = Math.sin(((routeProgress - 0.27) / 0.48) * Math.PI) * 108;
    return [center, center + (direction * spread)];
  }
  return [center];
}

export function questChoiceFocusIndex({ currentIndex = -1, count = 0, key = "" } = {}) {
  const total = Math.max(0, Math.floor(Number(count) || 0));
  if (!total) return -1;
  const current = Math.max(-1, Math.min(total - 1, Math.floor(Number(currentIndex) || 0)));
  if (key === "Home") return 0;
  if (key === "End") return total - 1;
  if (["ArrowRight", "ArrowDown"].includes(key)) return (current + 1 + total) % total;
  if (["ArrowLeft", "ArrowUp"].includes(key)) return (current - 1 + total) % total;
  return current;
}

export function stepQuestForwardBoundary({
  y = 0,
  velocityY = 0,
  limit = 0,
  dt = 0,
  softDistance = 26,
  returnAcceleration = 920
} = {}) {
  const elapsed = clamp(Number(dt) || 0, 0, 0.08);
  const floor = Number(limit) || 0;
  const distance = (Number(y) || 0) - floor;
  const soft = Math.max(1, Number(softDistance) || 1);
  if (distance >= soft) return { y: Number(y) || 0, velocityY: Number(velocityY) || 0, pressure: 0 };

  const pressure = clamp((soft - distance) / soft, 0, 1);
  const correctedY = Math.max(floor, Number(y) || 0);
  let correctedVelocity = (Number(velocityY) || 0)
    + (Math.max(0, Number(returnAcceleration) || 0) * pressure * elapsed);
  if (distance <= 0 && correctedVelocity < 0) correctedVelocity = 0;
  return { y: correctedY, velocityY: correctedVelocity, pressure };
}

export function questGateCrossingReached({
  playerX = 0,
  playerY = 0,
  gateX = 0,
  gateY = 0,
  halfWidth = 52,
  approachDepth = 22,
  exitDepth = 54
} = {}) {
  const horizontalDistance = Math.abs((Number(playerX) || 0) - (Number(gateX) || 0));
  const verticalDistance = (Number(playerY) || 0) - (Number(gateY) || 0);
  return horizontalDistance <= Math.max(1, Number(halfWidth) || 1)
    && verticalDistance <= Math.max(0, Number(approachDepth) || 0)
    && verticalDistance >= -Math.max(0, Number(exitDepth) || 0);
}

export function questActiveChoiceForwardLimit({
  residentLimit = 0,
  choices = [],
  contactInset = 2
} = {}) {
  const baseLimit = Number(residentLimit) || 0;
  const inset = Math.max(0, Number(contactInset) || 0);
  const contactLimits = (choices || [])
    .filter(choice => Number.isFinite(Number(choice?.y)))
    .map(choice => (
      Number(choice.y)
      + Math.max(4, (Number(choice.radius) || 0) - inset)
    ));
  return contactLimits.length ? Math.min(baseLimit, ...contactLimits) : baseLimit;
}

export function resolveQuestObstacleContacts({
  x = 0,
  y = 0,
  velocityX = 0,
  velocityY = 0,
  playerRadius = 8,
  obstacles = []
} = {}) {
  let resolvedX = Number(x) || 0;
  let resolvedY = Number(y) || 0;
  let resolvedVelocityX = Number(velocityX) || 0;
  let resolvedVelocityY = Number(velocityY) || 0;
  let contacts = 0;

  for (const obstacle of obstacles || []) {
    const obstacleX = Number(obstacle?.x) || 0;
    const obstacleY = Number(obstacle?.y) || 0;
    const clearance = Math.max(1, Number(playerRadius) || 0) + Math.max(1, Number(obstacle?.radius) || 0);
    const deltaX = resolvedX - obstacleX;
    const deltaY = resolvedY - obstacleY;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance >= clearance) continue;

    const fallbackMagnitude = Math.hypot(resolvedVelocityX, resolvedVelocityY);
    const normalX = distance > 0.0001
      ? deltaX / distance
      : fallbackMagnitude > 0.0001 ? -resolvedVelocityX / fallbackMagnitude : 1;
    const normalY = distance > 0.0001
      ? deltaY / distance
      : fallbackMagnitude > 0.0001 ? -resolvedVelocityY / fallbackMagnitude : 0;
    const penetration = clearance - distance;
    resolvedX += normalX * penetration;
    resolvedY += normalY * penetration;
    const inwardSpeed = (resolvedVelocityX * normalX) + (resolvedVelocityY * normalY);
    if (inwardSpeed < 0) {
      resolvedVelocityX -= inwardSpeed * normalX;
      resolvedVelocityY -= inwardSpeed * normalY;
    }
    contacts += 1;
  }

  return {
    x: resolvedX,
    y: resolvedY,
    velocityX: resolvedVelocityX,
    velocityY: resolvedVelocityY,
    contacts
  };
}

export function questPointerObstacleVector({
  playerX = 0,
  playerY = 0,
  targetX = 0,
  targetY = 0,
  playerRadius = 8,
  lookAhead = 76,
  obstacles = []
} = {}) {
  const deltaX = (Number(targetX) || 0) - (Number(playerX) || 0);
  const deltaY = (Number(targetY) || 0) - (Number(playerY) || 0);
  const targetDistance = Math.hypot(deltaX, deltaY);
  if (targetDistance <= 0.0001) return { x: 0, y: 0, avoided: false };

  const desiredX = deltaX / targetDistance;
  const desiredY = deltaY / targetDistance;
  const perpendicularX = -desiredY;
  const perpendicularY = desiredX;
  const horizon = Math.max(1, Math.min(targetDistance, Number(lookAhead) || 76));
  let steeringX = desiredX;
  let steeringY = desiredY;
  let avoided = false;

  for (const obstacle of obstacles || []) {
    const obstacleDeltaX = (Number(obstacle?.x) || 0) - (Number(playerX) || 0);
    const obstacleDeltaY = (Number(obstacle?.y) || 0) - (Number(playerY) || 0);
    const forward = (obstacleDeltaX * desiredX) + (obstacleDeltaY * desiredY);
    if (forward <= 0 || forward > horizon) continue;
    const lateral = (obstacleDeltaX * perpendicularX) + (obstacleDeltaY * perpendicularY);
    const clearance = Math.max(1, Number(playerRadius) || 0) + Math.max(1, Number(obstacle?.radius) || 0) + 5;
    if (Math.abs(lateral) >= clearance) continue;

    const side = Math.abs(lateral) > 0.001 ? -Math.sign(lateral) : 1;
    const overlap = 1 - (Math.abs(lateral) / clearance);
    const proximity = 1 - (forward / horizon);
    const weight = 0.48 + (overlap * 0.72) + (proximity * 0.42);
    steeringX += perpendicularX * side * weight;
    steeringY += perpendicularY * side * weight;
    avoided = true;
  }

  const magnitude = Math.hypot(steeringX, steeringY) || 1;
  return { x: steeringX / magnitude, y: steeringY / magnitude, avoided };
}

export function questCameraResponse(deltaMs = 16.7, responseMs = 92) {
  const elapsed = clamp(Number(deltaMs) || 0, 0, 80);
  return 1 - Math.exp(-elapsed / Math.max(1, Number(responseMs) || 1));
}

export function questCameraTravelTarget({
  playerX = 0,
  playerY = 0,
  velocityX = 0,
  velocityY = 0,
  velocityScale = 0.24,
  maxLead = 34
} = {}) {
  const originX = Number(playerX) || 0;
  const originY = Number(playerY) || 0;
  const scale = Math.max(0, Number(velocityScale) || 0);
  const limit = Math.max(0, Number(maxLead) || 0);
  let leadX = (Number(velocityX) || 0) * scale;
  let leadY = (Number(velocityY) || 0) * scale;
  const magnitude = Math.hypot(leadX, leadY);
  if (magnitude > limit && magnitude > 0) {
    const boundedScale = limit / magnitude;
    leadX *= boundedScale;
    leadY *= boundedScale;
  }
  return {
    x: originX + leadX,
    y: originY + leadY,
    leadX,
    leadY,
    strength: limit > 0 ? clamp(magnitude / limit, 0, 1) : 0
  };
}

export function questAnalogVector({ x = 0, y = 0, deadzone = 0.22 } = {}) {
  const safeX = clamp(Number(x) || 0, -1, 1);
  const safeY = clamp(Number(y) || 0, -1, 1);
  const rawMagnitude = Math.hypot(safeX, safeY);
  const threshold = clamp(Number(deadzone) || 0, 0, 0.9);
  if (rawMagnitude <= threshold) return { x: 0, y: 0, magnitude: 0 };

  const magnitude = clamp((Math.min(1, rawMagnitude) - threshold) / (1 - threshold), 0, 1);
  return {
    x: (safeX / rawMagnitude) * magnitude,
    y: (safeY / rawMagnitude) * magnitude,
    magnitude
  };
}

export function questPointerDestination({
  x = 0,
  y = 0,
  routeCenterX = 0,
  forwardLimit = -Infinity,
  corridorRadius = 100
} = {}) {
  const targetY = Math.max(Number.isFinite(Number(forwardLimit)) ? Number(forwardLimit) : -Infinity, Number(y) || 0);
  const center = Number(routeCenterX) || 0;
  const radius = Math.max(1, Number(corridorRadius) || 1);
  return {
    x: clamp(Number(x) || 0, center - radius, center + radius),
    y: targetY
  };
}

function angleDelta(from, to) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

export function createQuestLocomotionState(heading = 0) {
  return { speed: 0, heading, bank: 0, settled: true };
}

export function stepQuestLocomotion(state, {
  desiredX = 0,
  desiredZ = 0,
  dt = 0,
  maxSpeed = 4.6,
  acceleration = 8.4,
  deceleration = 11.2,
  turnRate = 8.8
} = {}) {
  const elapsed = clamp(Number(dt) || 0, 0, 0.08);
  const magnitude = Math.hypot(desiredX, desiredZ);
  const moving = magnitude > 0.0001;
  const targetHeading = moving ? Math.atan2(desiredX, desiredZ) : state.heading;
  const turn = angleDelta(state.heading, targetHeading);
  const heading = state.heading + clamp(turn, -turnRate * elapsed, turnRate * elapsed);
  const targetSpeed = moving ? Math.max(0, Number(maxSpeed) || 0) : 0;
  const rate = targetSpeed > state.speed ? acceleration : deceleration;
  const speedDelta = clamp(targetSpeed - state.speed, -rate * elapsed, rate * elapsed);
  const speed = Math.max(0, state.speed + speedDelta);
  const targetBank = moving ? clamp(turn * 0.42, -0.28, 0.28) : 0;
  const bank = state.bank + (targetBank - state.bank) * (1 - Math.pow(0.018, elapsed));
  return {
    speed,
    heading,
    bank,
    settled: !moving && speed < 0.04,
    x: Math.sin(heading) * speed,
    z: Math.cos(heading) * speed
  };
}

const RESIDENT_PERFORMANCES = Object.freeze({
  s1: Object.freeze({ success: "lantern-wave", recover: "lantern-listen" }),
  s2: Object.freeze({ success: "fern-bounce", recover: "fern-steady" }),
  s3: Object.freeze({ success: "parcel-spin", recover: "parcel-point" }),
  s4: Object.freeze({ success: "bridge-hammer", recover: "bridge-measure" }),
  s5: Object.freeze({ success: "chorus-conduct", recover: "chorus-recue" })
});

export function seedwakeResidentPerformance(stopId, outcome) {
  const performance = RESIDENT_PERFORMANCES[stopId];
  if (!performance) return outcome === "correct" ? "shared-cheer" : "shared-recover";
  return outcome === "correct" ? performance.success : performance.recover;
}

export function isChapterGateOpen(encounters = [], solved = []) {
  const complete = solved instanceof Set ? solved : new Set(solved || []);
  return encounters.length > 0 && encounters.every(encounter => complete.has(encounter.id));
}

export function sliceSafeArea(width, height) {
  const phone = width < 640;
  return {
    left: phone ? 22 : 34,
    top: phone ? 116 : 104,
    right: width - (phone ? 22 : 34),
    bottom: height - (phone ? 124 : 106)
  };
}

export function projectedRectInsideSafeArea(rect, safeArea) {
  return Boolean(
    rect
    && rect.left >= safeArea.left
    && rect.top >= safeArea.top
    && rect.right <= safeArea.right
    && rect.bottom <= safeArea.bottom
  );
}

export function resolveQuestPointerIntent({ encounterActive = false, fieldChoice = null, mechanic = null } = {}) {
  if (encounterActive && fieldChoice) {
    return { type: mechanic === "gate-chorus" ? "activate" : "approach", fieldChoice };
  }
  return { type: encounterActive ? "consume" : "move" };
}

export function encounterCameraPose(items = [], direction = { x: 0, z: -1 }, viewport = { width: 1194, height: 834 }) {
  const available = items.filter(item => Number.isFinite(item?.x) && Number.isFinite(item?.z));
  const centre = available.length
    ? available.reduce((value, item) => ({
      x: value.x + item.x / available.length,
      y: value.y + (Number(item.y) || 0) / available.length,
      z: value.z + item.z / available.length
    }), { x: 0, y: 0, z: 0 })
    : { x: 0, y: 0, z: 0 };
  const forwardLength = Math.hypot(direction.x, direction.z) || 1;
  const forward = { x: direction.x / forwardLength, z: direction.z / forwardLength };
  const right = { x: forward.z, z: -forward.x };
  let lateralRadius = 1.8;
  let depthRadius = 1.5;
  for (const item of available) {
    const offsetX = item.x - centre.x;
    const offsetZ = item.z - centre.z;
    lateralRadius = Math.max(lateralRadius, Math.abs(offsetX * right.x + offsetZ * right.z) + 1.15);
    depthRadius = Math.max(depthRadius, Math.abs(offsetX * forward.x + offsetZ * forward.z) + 1.1);
  }
  const aspect = Math.max(0.35, viewport.width / Math.max(1, viewport.height));
  const verticalFov = 48 * Math.PI / 180;
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const horizontalDistance = lateralRadius / Math.max(0.12, Math.tan(horizontalFov / 2) * 0.76);
  const verticalDistance = (2.65 + depthRadius * 0.16) / (Math.tan(verticalFov / 2) * 0.74);
  const distance = Math.max(viewport.width < 640 ? 13.5 : 8.4, horizontalDistance, verticalDistance);
  // Keep the player and resident in the composition without putting either
  // directly over the centre learning object. A strong over-the-shoulder
  // angle matters most on portrait screens, where all three otherwise share
  // almost the same projection line.
  const sideOffset = viewport.width < 640 ? 2.65 : 2.55;
  return {
    fov: 48,
    focus: { x: centre.x, y: centre.y + 0.92, z: centre.z },
    position: {
      x: centre.x - forward.x * distance + right.x * sideOffset,
      y: centre.y + Math.max(5.4, distance * 0.38),
      z: centre.z - forward.z * distance + right.z * sideOffset
    }
  };
}

export function createPhonemeSlotState(graphemes = []) {
  return {
    graphemes: [...graphemes],
    filled: [],
    complete: graphemes.length === 0,
    blending: false,
    announcement: ""
  };
}

export function advancePhonemeSlotState(state, grapheme, correct = true) {
  const expected = state.graphemes[state.filled.length];
  if (!correct || grapheme !== expected || state.complete) return { ...state };
  const filled = [...state.filled, grapheme];
  const complete = filled.length === state.graphemes.length;
  return {
    ...state,
    filled,
    complete,
    blending: complete,
    announcement: complete ? `Word complete: ${filled.join("")}` : `${grapheme} placed`
  };
}

export function seedwakeEncounterHudModel({ objective, rewardLabel, rewardCount = 0, stageIndex = 0, stageCount = 1 } = {}) {
  return Object.freeze([
    Object.freeze({ id: "objective", label: String(objective || "Listen and find the match"), action: "replay-audio" }),
    Object.freeze({
      id: "reward",
      label: String(rewardLabel || "finds"),
      count: Math.max(0, Number(rewardCount) || 0),
      progress: `${Math.min(stageCount, stageIndex + 1)} of ${Math.max(1, stageCount)}`
    })
  ]);
}
