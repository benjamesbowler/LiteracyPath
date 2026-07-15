const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

const VERB_INPUTS = Object.freeze({
  "sound-hunt": "search",
  "flower-jump": "jump",
  "delivery-run": "pick-up",
  "bridge-build": "build",
  "gate-chorus": "conduct"
});

function result(state, accepted, completed, cue) {
  return { state, accepted, completed, cue };
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
    id: "place-in-sequence",
    input: VERB_INPUTS["bridge-build"],
    create: expected => ({ expected: [...(expected || [])], placed: [] }),
    apply: (state, input) => {
      const wanted = state.expected[state.placed.length];
      if (input.type !== "build" || !input.correct || input.value !== wanted) {
        return result(state, false, false, "piece-rejected");
      }
      const next = { ...state, placed: [...state.placed, input.value] };
      return result(next, true, next.placed.length === next.expected.length, "plank-lock");
    }
  }),
  "gate-chorus": Object.freeze({
    id: "conduct-in-rhythm",
    input: VERB_INPUTS["gate-chorus"],
    create: expected => ({ expected: [...(expected || [])], notes: [], pulse: 0 }),
    apply: (state, input) => {
      const wanted = state.expected[state.notes.length];
      if (input.type !== "conduct" || !input.correct || input.value !== wanted) {
        return result({ ...state, pulse: 0 }, false, false, "chorus-recue");
      }
      const next = {
        ...state,
        notes: [...state.notes, input.value],
        pulse: (state.pulse + 1) % 2
      };
      return result(next, true, next.notes.length === next.expected.length, "chorus-pulse");
    }
  })
});

export function seedwakeVerbHandler(mechanic) {
  return SEEDWAKE_VERB_HANDLERS[mechanic] || null;
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
  const sideOffset = viewport.width < 640 ? 0.35 : 1.15;
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
