import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { installSoundSeekersProductionAudioDouble } from "../helpers/soundSeekersProductionAudioDouble.js";
import { SOUND_SEEKERS_CHAPTERS } from "../../src/features/soundSeekers/content/chapters/index.js";
import { SOUND_SEEKERS_CAST_ARCS } from "../../src/features/soundSeekers/content/castArcs.js";
import {
  SOUND_SEEKERS_CONTRAST_PAIRS,
  SOUND_SEEKERS_VISUAL_TOKENS,
  contrastRatio
} from "../../src/features/soundSeekers/visual/visualTokens.js";
import {
  createBackgroundImageState,
  reduceBackgroundImageState
} from "../../src/features/soundSeekers/visual/backgroundImageState.js";
import {
  SOUND_SEEKERS_CHARACTER_VISUALS,
  SOUND_SEEKERS_PLAYER_VISUAL,
  SOUND_SEEKERS_POSE_IDS,
  SOUND_SEEKERS_POSE_RENDERERS,
  characterVisualSignature,
  poseCompositionSignature,
  resolvePoseRenderer
} from "../../src/features/soundSeekers/visual/characterCatalog.js";
import {
  appearanceSignature,
  createCharacterAppearance
} from "../../src/features/soundSeekers/visual/characterCustomization.js";
let SoundSeekersCharacter;
let LayeredBiome;
let Landmark;
let SceneVisual;
let getBiomeKit;
let toViteChildConnectedTextScene;
let viteLandmarkBindings;
let viteRouteSpecs;
let viteResolveSceneVisualPresentation;
let viteConnectedText;
let viteContentCoverage;
let viteContentTransactions;
let vitePresentation;
let viteSceneAccess;
let viteState;
let viteVisualSemantics;
let viteMissionPlan;
let viteMissionReducer;
let viteAudioController;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({ SoundSeekersCharacter } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/CharacterSystem.jsx"
  ));
  ({ LayeredBiome } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/LayeredBiome.jsx"
  ));
  ({ Landmark } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/Landmark.jsx"
  ));
  ({ SceneVisual } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/SceneVisual.jsx"
  ));
  ({ getBiomeKit } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/content/biomeKits.js"
  ));
  ({ toChildConnectedTextScene: toViteChildConnectedTextScene } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/content/connectedText.js"
  ));
  ({
    SOUND_SEEKERS_LANDMARK_BINDINGS: viteLandmarkBindings,
    SOUND_SEEKERS_ROUTE_SPECS: viteRouteSpecs,
    resolveSceneVisualPresentation: viteResolveSceneVisualPresentation
  } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/sceneVisualCatalog.js"
  ));
  viteConnectedText = await vite.ssrLoadModule(
    "/src/features/soundSeekers/content/connectedText.js"
  );
  viteContentCoverage = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/contentCoverage.js"
  );
  viteContentTransactions = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/contentDeckTransactions.js"
  );
  vitePresentation = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/connectedTextPresentation.js"
  );
  viteSceneAccess = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/sceneVisualAccess.js"
  );
  viteState = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/stateV2.js"
  );
  viteVisualSemantics = await vite.ssrLoadModule(
    "/src/features/soundSeekers/content/sceneVisualSemantics.js"
  );
  viteMissionPlan = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/createMissionPlan.js"
  );
  viteMissionReducer = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/missionReducer.js"
  );
  viteAudioController = await vite.ssrLoadModule(
    "/src/features/soundSeekers/runtime/soundSeekersAudioController.js"
  );
});

test.after(async () => {
  await vite?.close();
});

function assertRecursivelyFrozen(value) {
  if (value === null || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true);
  for (const child of Object.values(value)) assertRecursivelyFrozen(child);
}

function assertExactKeys(value, expected) {
  assert.deepEqual(Object.keys(value), expected);
}

function withHiddenExtra(value) {
  const copy = { ...value };
  Object.defineProperty(copy, "hiddenExtra", { value: true, enumerable: false });
  return copy;
}

function withAccessor(value, key) {
  const copy = { ...value };
  const current = value[key];
  Object.defineProperty(copy, key, { get: () => current, enumerable: true });
  return copy;
}

function extractAttributeValues(html, attribute) {
  return [...html.matchAll(new RegExp(`${attribute}="([^"]*)"`, "gu"))]
    .map(match => match[1]);
}

function renderedText(html) {
  return html.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim();
}

function childCopyForAudit(html) {
  return [renderedText(html), ...extractAttributeValues(html, "aria-label")].join(" ");
}

function assertNoInternalChildCopy(html) {
  const childCopy = childCopyForAudit(html);
  assert.doesNotMatch(
    childCopy,
    /\bscene-s\d+\b|\blandmark:s\d+\b|(?:^|\s)s\d+\.(?=\s|$)/iu
  );
  const internalIds = new Set([
    ...extractAttributeValues(html, "data-scene-id"),
    ...extractAttributeValues(html, "data-visual-state-id"),
    ...extractAttributeValues(html, "data-semantic-id"),
    ...extractAttributeValues(html, "data-code-native-semantic"),
    ...extractAttributeValues(html, "data-landmark-id")
  ]);
  for (const internalId of internalIds) {
    assert.equal(
      childCopy.includes(internalId),
      false,
      `${internalId} must remain metadata and never become child copy`
    );
  }
}

function landmarkAccessibleLabel(html) {
  const landmark = html.match(
    /<figure\b[^>]*class="sound-seekers-landmark"[^>]*aria-label="([^"]+)"/u
  );
  assert.ok(landmark, "render must expose one child-facing landmark accessible label");
  return landmark[1];
}

function escapeRenderedText(value) {
  return value.replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function normalizedSvgGeometry(svg) {
  return svg
    .replace(/\sdata-[a-z-]+="[^"]*"/gu, "")
    .replace(/\sclass="[^"]*"/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function codeNativeWorldMarkup(html) {
  const match = html.match(/<div\b[^>]*data-code-native-world=""[\s\S]*?<\/div><\/div>/u);
  assert.ok(match, "render must contain the unconditional code-native world subtree");
  return match[0];
}

function completeVitePresentation(sceneId, { narrativeChoiceToken = null } = {}) {
  const scene = viteConnectedText.SOUND_SEEKERS_CONNECTED_TEXT.find(item => item.id === sceneId);
  const journeyStep = Number(scene.stopId.slice(1));
  const initial = viteState.createSoundSeekersState();
  const currentState = viteState.normalizeSoundSeekersState({
    ...initial, trail: { ...initial.trail, journeyStep }
  });
  const begun = viteContentTransactions.beginStoryTransferTransaction(
    currentState,
    { stopId: scene.stopId, journeyStep, seed: journeyStep }
  );
  const pendingState = viteContentTransactions.checkpointStoryTransferTransaction(
    begun.nextState,
    {
      transactionId: begun.transaction.transactionId,
      narrativeChoiceToken
    }
  );
  const challenge = scene.choice.kind === "narrative_bridge"
    ? viteContentTransactions.materializeBossTransferChallenge(pendingState, {
      transactionId: begun.transaction.transactionId
    })
    : viteConnectedText.createConnectedTextChallenge(pendingState, {
      transactionId: begun.transaction.transactionId,
      routeSeed: `visual-render:${sceneId}`
    });
  const initialPresentation = vitePresentation.beginConnectedTextPresentation({
    sceneId,
    transactionId: begun.transaction.transactionId,
    state: pendingState
  });
  const completed = viteContentTransactions.completeStoryTransferTransaction(pendingState, {
    transactionId: begun.transaction.transactionId,
    challenge,
    response: { kind: "literacy-answer", token: challenge.expectedToken },
    audio: { status: "completed" },
    at: `2026-09-02T07:${String(journeyStep).padStart(2, "0")}:00.000Z`,
    sessionDay: "2026-09-02"
  });
  const state = viteState.normalizeSoundSeekersState(JSON.parse(JSON.stringify(
    completed.nextState
  )));
  const action = vitePresentation.reduceConnectedTextPresentation(initialPresentation, {
    type: "decision_committed",
    reducerRevision: initialPresentation.reducerRevision,
    evidenceEventId: completed.event.id
  }, { state });
  const attemptId = viteContentCoverage.validAttemptReceipts(state).at(-1).attemptId;
  assert.equal(action.transition.attemptId, attemptId);
  return {
    state,
    attemptId,
    actionPresentation: action.nextPresentation,
    actionTransition: action.transition
  };
}

function renderViteScene(childScene, context) {
  return renderToStaticMarkup(React.createElement(SceneVisual, {
    childScene,
    activeAttemptId: context.attemptId,
    reducerRevision: context.reducerRevision,
    sceneAccess: context.sceneAccess,
    cropProfile: "landscape",
    densityProfile: "full",
    motionProfile: "reduced",
    onChoose: () => {}
  }));
}

function completedViteTeachInput(mission) {
  const item = mission.activity.sequence.currentItem;
  installSoundSeekersProductionAudioDouble();
  const audioAuthority = {
    scopeKey: "visual-semantic-teach",
    missionId: mission.plan.id,
    phaseId: mission.phaseId,
    attemptId: mission.attemptId
  };
  const controller = viteAudioController.createSoundSeekersAudioController({
    scopeKey: audioAuthority.scopeKey,
    clock: () => 0
  });
  const audioKeys = [...new Set([item.childAudio, item.targetAudio, ...item.targetAudioSequence,
    ...item.targetAudioAlternates.map(alternate => alternate.targetAudio)].filter(Boolean))];
  return {
    input: {
      type: "complete-teach",
      teachIndex: item.teachIndex,
      targetId: item.targetId,
      audioDeliveries: audioKeys.map((audioKey, ordinal) => {
      controller.request({
        cueId: `teach:${item.stopId}:${item.teachIndex}:${item.targetId}:${ordinal}`,
        audioKey,
        visibleText: item.childText,
        spokenText: item.childText,
        kind: "teach",
        requiresAudio: true
        }, audioAuthority);
        return controller.getSnapshot().delivery;
      })
    },
    audioAuthority
  };
}

function correctVitePowerInputs(mission) {
  const challenge = mission.activity.powerChallenge || mission.challenge;
  if (challenge.powerId === "echo_search") {
    const candidate = challenge.presentation.candidates
      .find(item => item.token === challenge.expectedToken);
    return [{ type: "probe", candidateId: candidate.id },
      { type: "confirm_candidate", candidateId: candidate.id }];
  }
  if (challenge.powerId === "word_forge") {
    const tile = challenge.presentation.rack.find(item => item.token === challenge.expectedToken);
    return [{ type: "place_tile", tileId: tile.id }];
  }
  if (challenge.powerId === "memory_delivery") {
    const recipient = challenge.presentation.recipients
      .find(item => item.token === challenge.expectedToken);
    return [{ type: "receive_cue" }, { type: "move", dx: 1, dy: 0 }, { type: "arrive" },
      { type: challenge.expectedAction, recipientId: recipient.id }];
  }
  if (challenge.powerId === "story_power") {
    const choice = challenge.presentation.choices.find(item => item.token === challenge.expectedToken);
    return [{ type: "read_text" },
      { type: challenge.expectedAction, choiceId: choice.id, token: choice.token }];
  }
  throw new Error(`unsupported Vite mission power ${challenge.powerId}`);
}

function currentViteStoryMission() {
  const gameState = viteState.createSoundSeekersState();
  const plan = viteMissionPlan.createMissionPlan({
    stopId: "s1", state: gameState, seed: 1, replayOrdinal: 0
  });
  let mission = viteMissionReducer.createMissionState(plan);
  for (let guard = 0; guard < 100 && mission.phaseId !== "s1-transfer"; guard += 1) {
    const phase = plan.phases[mission.phaseIndex];
    const teach = phase.kind === "teach" ? completedViteTeachInput(mission) : null;
    const inputs = teach
      ? [teach.input]
      : ["power_onboarding", "challenge", "content_opportunity"].includes(phase.kind)
        ? correctVitePowerInputs(mission)
        : [{ type: `complete_${phase.kind}` }];
    for (const input of inputs) {
      mission = viteMissionReducer.reduceMission(mission, input, {
        gameState: mission.gameState,
        at: "2026-09-03T09:00:00.000Z",
        sessionDay: "2026-09-03",
        audio: { status: "completed" },
        audioAuthority: teach?.audioAuthority
      }).state;
    }
  }
  assert.equal(mission.phaseId, "s1-transfer");
  return mission;
}

test("mission scene projection preserves exact branded connected-text identities for production consumers", () => {
  let mission = currentViteStoryMission();
  const before = viteMissionReducer.projectCurrentMissionSceneModel(mission);
  assert.strictEqual(before.childScene, mission.activity.childScene);
  assert.strictEqual(before.presentation, mission.activity.presentation);
  assert.equal(before.transition, null);
  let committed;
  for (const input of correctVitePowerInputs(mission)) {
    committed = viteMissionReducer.reduceMission(mission, input, {
      gameState: mission.gameState,
      at: "2026-09-03T09:01:00.000Z",
      sessionDay: "2026-09-03",
      audio: { status: "completed" }
    });
    mission = committed.state;
  }
  const model = viteMissionReducer.projectCurrentMissionSceneModel(
    mission, {}, committed.transition
  );
  assert.strictEqual(model.childScene, mission.activity.childScene);
  assert.strictEqual(model.presentation, mission.activity.presentation);
  assert.strictEqual(model.transition, mission.presentationTransition);
  for (const forbidden of ["expectedToken", "optionTokens", "responseIntents", "candidateState",
    "correct\""]) {
    assert.equal(JSON.stringify(model).includes(forbidden), false, forbidden);
  }
  const context = {
    sceneId: model.transition.sceneId,
    attemptId: model.transition.attemptId,
    reducerRevision: model.transition.reducerRevision
  };
  const access = viteSceneAccess.issueSceneVisualAccess(model.transition, context);
  assert.equal(viteSceneAccess.validateSceneVisualAccess(access, context), true);
  assert.match(renderViteScene(model.childScene, { ...context, sceneAccess: access }),
    /data-scene-phase="action"/u);
  assert.throws(() => viteSceneAccess.issueSceneVisualAccess(
    structuredClone(model.transition), context
  ));
  assert.throws(() => renderViteScene(structuredClone(model.childScene), {
    ...context, sceneAccess: access
  }));
  assert.throws(() => vitePresentation.closeConnectedTextPresentation(
    structuredClone(model.presentation)
  ));
  vitePresentation.closeConnectedTextPresentation(model.presentation);
  assert.equal(viteSceneAccess.validateSceneVisualAccess(access, context), false);
});

const POSE_IDS = [
  "idle", "walk", "explain", "encourage", "anticipate",
  "contact", "repair", "react", "celebrate", "recover"
];

const CHARACTER_KEYS = [
  "characterId", "chapterId", "castKind", "styleId", "bodyShapeId",
  "paletteTokenId", "featureIds", "rolePropId", "gearAnchorIds",
  "poseRendererIds", "visualSignature"
];

const CHARACTER_PART_INVENTORY = [
  "back-accessory", "contact-shadow", "left-leg", "right-leg", "torso",
  "left-arm", "right-arm", "head", "face", "features", "role-prop",
  "neck-accessory", "head-accessory", "held-accessory"
];

const FULL_PLAYER_APPEARANCE = createCharacterAppearance({
  schemaVersion: 1,
  bodyShapeId: "body-shape-kite",
  paletteTokenId: "player-palette-river",
  accessories: {
    back: "gear-back-field-pack",
    head: "gear-head-star-band",
    neck: "gear-neck-seed-charm",
    held: "gear-held-field-journal"
  }
});

test("visual tokens expose one immutable color authority and compute WCAG contrast", () => {
  assertRecursivelyFrozen(SOUND_SEEKERS_VISUAL_TOKENS);
  assert.deepEqual(Object.keys(SOUND_SEEKERS_VISUAL_TOKENS), [
    "outline-strong",
    "ink-deep",
    "ink-muted",
    "surface-white",
    "surface-warm",
    "surface-option",
    "focus-gold",
    "success-deep",
    "retry-deep",
    "scrim-ink",
    "mist-overlay",
    "biome-seedwake",
    "light-seedwake",
    "biome-river",
    "light-river",
    "biome-fossil",
    "light-fossil",
    "biome-forge",
    "light-forge",
    "biome-glass",
    "light-glass",
    "biome-storm",
    "light-storm",
    "biome-lantern",
    "light-lantern",
    "biome-star",
    "light-star",
    "player-palette-sunrise",
    "player-palette-moss",
    "player-palette-river",
    "player-palette-sky",
    "player-palette-plum",
    "player-palette-berry"
  ]);
  for (const color of Object.values(SOUND_SEEKERS_VISUAL_TOKENS)) {
    assert.match(color, /^#[0-9A-F]{6}(?:[0-9A-F]{2})?$/u);
  }

  assert.equal(contrastRatio("outline-strong", "surface-white"), 21);
  assert.equal(contrastRatio("surface-white", "outline-strong"), 21);
  assert.ok(contrastRatio("ink-deep", "surface-white") >= 3);
  assert.ok(contrastRatio("ink-deep", "surface-option") >= 3);
  assert.ok(Math.abs(contrastRatio("scrim-ink", "surface-white") - 12.635) < 0.01);
  assert.throws(
    () => contrastRatio("surface-white", "mist-overlay"),
    /opaque background/u
  );
  assert.throws(() => contrastRatio("missing-token", "surface-white"), /Unknown visual token/u);

  const tokenSource = readFileSync(new URL(
    "../../src/features/soundSeekers/visual/visualTokens.js",
    import.meta.url
  ), "utf8");
  const rawHexLiterals = [...tokenSource.matchAll(/#[0-9A-F]{6}(?:[0-9A-F]{2})?/gu)]
    .map(match => match[0]);
  assert.equal(
    new Set(rawHexLiterals).size,
    rawHexLiterals.length,
    "each raw color literal must have one definition and semantic aliases must reuse it"
  );
});

test("every declared child-facing contrast use meets its exact threshold", () => {
  assertRecursivelyFrozen(SOUND_SEEKERS_CONTRAST_PAIRS);
  assert.deepEqual(
    [...new Set(SOUND_SEEKERS_CONTRAST_PAIRS.map(pair => pair.use))].sort(),
    ["focus_ring", "interactive_boundary", "normal_text", "state_outline"]
  );
  assert.equal(
    new Set(SOUND_SEEKERS_CONTRAST_PAIRS.map(pair => pair.id)).size,
    SOUND_SEEKERS_CONTRAST_PAIRS.length
  );

  for (const pair of SOUND_SEEKERS_CONTRAST_PAIRS) {
    assert.deepEqual(Object.keys(pair), [
      "id", "foregroundTokenId", "backgroundTokenId", "minRatio", "use"
    ]);
    assert.equal(pair.minRatio, pair.use === "normal_text" ? 4.5 : 3);
    assert.ok(
      contrastRatio(pair.foregroundTokenId, pair.backgroundTokenId) >= pair.minRatio,
      `${pair.id} must meet ${pair.minRatio}:1`
    );
  }
  assert.deepEqual(
    SOUND_SEEKERS_CONTRAST_PAIRS
      .filter(pair => pair.foregroundTokenId === "ink-deep" && pair.use === "focus_ring")
      .map(pair => pair.backgroundTokenId),
    ["surface-white", "surface-option"]
  );
});

test("background image state is frozen, deterministic, and stale-event safe", () => {
  const firstSrc = "/game-assets/sound-seekers/v2/biomes/seedwake-meadow/background.webp";
  const nextSrc = "/game-assets/sound-seekers/v2/biomes/river-gardens/background.webp";
  const pending = createBackgroundImageState(firstSrc);

  assert.deepEqual(pending, { src: firstSrc, status: "pending", revision: 0 });
  assertRecursivelyFrozen(pending);

  const loaded = reduceBackgroundImageState(pending, { type: "loaded", src: firstSrc });
  assert.deepEqual(loaded, { src: firstSrc, status: "loaded", revision: 0 });
  assertRecursivelyFrozen(loaded);
  assert.strictEqual(
    reduceBackgroundImageState(loaded, { type: "loaded", src: firstSrc }),
    loaded,
    "a duplicate load event must preserve object identity"
  );
  assert.strictEqual(
    reduceBackgroundImageState(loaded, { type: "failed", src: nextSrc }),
    loaded,
    "an event for an inactive source must preserve object identity"
  );

  const changed = reduceBackgroundImageState(loaded, { type: "source_changed", src: nextSrc });
  assert.deepEqual(changed, { src: nextSrc, status: "pending", revision: 1 });
  assertRecursivelyFrozen(changed);
  assert.strictEqual(
    reduceBackgroundImageState(changed, { type: "failed", src: firstSrc }),
    changed,
    "a late failure from the previous source must be ignored"
  );

  const failed = reduceBackgroundImageState(changed, { type: "failed", src: nextSrc });
  assert.deepEqual(failed, { src: nextSrc, status: "failed", revision: 1 });
  assert.strictEqual(
    reduceBackgroundImageState(failed, { type: "failed", src: nextSrc }),
    failed,
    "a duplicate failure must preserve object identity"
  );

  const retried = reduceBackgroundImageState(failed, { type: "source_changed", src: nextSrc });
  assert.deepEqual(retried, { src: nextSrc, status: "pending", revision: 2 });
  assert.notStrictEqual(retried, failed);
});

test("background image state rejects malformed sources, states, and events", () => {
  const src = "/game-assets/sound-seekers/v2/biomes/seedwake-meadow/background.webp";
  const state = createBackgroundImageState(src);

  for (const invalidSrc of [undefined, null, "", "   ", 4, {}]) {
    assert.throws(() => createBackgroundImageState(invalidSrc), /source/u);
  }
  assert.throws(
    () => reduceBackgroundImageState({ ...state, revision: -1 }, { type: "loaded", src }),
    /state/u
  );
  assert.throws(
    () => reduceBackgroundImageState(state, { type: "loaded", src, extra: true }),
    /event/u
  );
  assert.throws(
    () => reduceBackgroundImageState(state, { type: "unknown", src }),
    /event type/u
  );
  for (const invalidState of [
    withHiddenExtra(state),
    { ...state, [Symbol("extra")]: true },
    withAccessor(state, "src")
  ]) {
    assert.throws(
      () => reduceBackgroundImageState(invalidState, { type: "loaded", src }),
      /state/u
    );
  }
  for (const invalidEvent of [
    withHiddenExtra({ type: "loaded", src }),
    { type: "loaded", src, [Symbol("extra")]: true },
    withAccessor({ type: "loaded", src }, "src")
  ]) {
    assert.throws(() => reduceBackgroundImageState(state, invalidEvent), /event/u);
  }
});

test("ten code-native poses are frozen, bounded, resolvable, and structurally distinct", () => {
  assert.deepEqual(SOUND_SEEKERS_POSE_IDS, POSE_IDS);
  assert.equal(SOUND_SEEKERS_POSE_RENDERERS.length, 10);
  assertRecursivelyFrozen(SOUND_SEEKERS_POSE_IDS);
  assertRecursivelyFrozen(SOUND_SEEKERS_POSE_RENDERERS);
  assert.deepEqual(SOUND_SEEKERS_POSE_RENDERERS.map(pose => pose.poseId), POSE_IDS);
  assert.equal(new Set(SOUND_SEEKERS_POSE_RENDERERS.map(poseCompositionSignature)).size, 10);

  for (const pose of SOUND_SEEKERS_POSE_RENDERERS) {
    assertExactKeys(pose, [
      "id", "poseId", "transforms", "face", "anchors", "fullMotionId",
      "reducedReplacement"
    ]);
    assertExactKeys(pose.transforms, [
      "torso", "head", "leftArm", "rightArm", "leftLeg", "rightLeg"
    ]);
    assertExactKeys(pose.transforms.torso, ["x", "y", "rotate", "scaleX", "scaleY"]);
    assertExactKeys(pose.transforms.head, ["x", "y", "rotate", "scaleX", "scaleY"]);
    assertExactKeys(pose.transforms.leftArm, ["shoulder", "elbow", "hand"]);
    assertExactKeys(pose.transforms.rightArm, ["shoulder", "elbow", "hand"]);
    assertExactKeys(pose.transforms.leftLeg, ["hip", "knee", "foot"]);
    assertExactKeys(pose.transforms.rightLeg, ["hip", "knee", "foot"]);
    assertExactKeys(pose.face, ["eyesId", "browsId", "mouthId"]);
    assertExactKeys(pose.anchors, ["back", "head", "neck", "held", "contact"]);
    assertExactKeys(pose.anchors.back, ["x", "y", "rotate"]);
    assertExactKeys(pose.anchors.head, ["x", "y", "rotate"]);
    assertExactKeys(pose.anchors.neck, ["x", "y", "rotate"]);
    assertExactKeys(pose.anchors.held, ["x", "y", "rotate"]);
    assertExactKeys(pose.anchors.contact, ["x", "y"]);
    assert.deepEqual(pose.reducedReplacement, {
      transition: "outline-opacity-static-final",
      finalPoseId: pose.poseId,
      continuous: false
    });
    assert.strictEqual(resolvePoseRenderer(pose.poseId), pose);

    const numbers = [
      ...Object.values(pose.transforms.torso),
      ...Object.values(pose.transforms.head),
      ...Object.values(pose.transforms.leftArm),
      ...Object.values(pose.transforms.rightArm),
      ...Object.values(pose.transforms.leftLeg),
      ...Object.values(pose.transforms.rightLeg),
      ...Object.values(pose.anchors.back),
      ...Object.values(pose.anchors.head),
      ...Object.values(pose.anchors.neck),
      ...Object.values(pose.anchors.held),
      ...Object.values(pose.anchors.contact)
    ];
    assert.ok(numbers.every(number => Number.isFinite(number) && Math.abs(number) <= 320));
    assert.ok(pose.transforms.torso.scaleX > 0 && pose.transforms.torso.scaleY > 0);
    assert.ok(pose.transforms.head.scaleX > 0 && pose.transforms.head.scaleY > 0);
    assert.doesNotMatch(JSON.stringify(pose), /(?:game-assets|\.webp|\.png|\.jsx|\.css)/iu);
  }

  assert.equal(resolvePoseRenderer("missing"), null);
  assert.equal(resolvePoseRenderer(" repair "), null);
  assert.notDeepEqual(
    SOUND_SEEKERS_POSE_RENDERERS.find(pose => pose.poseId === "contact").anchors.contact,
    SOUND_SEEKERS_POSE_RENDERERS.find(pose => pose.poseId === "repair").anchors.contact
  );
  assert.notDeepEqual(
    SOUND_SEEKERS_POSE_RENDERERS.find(pose => pose.poseId === "contact").anchors.held,
    SOUND_SEEKERS_POSE_RENDERERS.find(pose => pose.poseId === "repair").anchors.held
  );
});

test("pose signatures ignore identifiers but reject malformed geometry and moving replacements", () => {
  const idle = SOUND_SEEKERS_POSE_RENDERERS[0];
  const renamedClone = {
    ...idle,
    id: "pose:renamed",
    poseId: "renamed",
    fullMotionId: "pose-motion:renamed-breathe",
    reducedReplacement: { ...idle.reducedReplacement, finalPoseId: "renamed" }
  };
  assert.equal(poseCompositionSignature(renamedClone), poseCompositionSignature(idle));
  assert.throws(() => poseCompositionSignature({ ...idle, imageSrc: "/legacy.png" }), /keys/u);
  assert.throws(() => poseCompositionSignature({
    ...idle,
    transforms: { ...idle.transforms, torso: { ...idle.transforms.torso, x: Number.NaN } }
  }), /finite|transform/u);
  assert.throws(() => poseCompositionSignature({
    ...idle,
    reducedReplacement: { ...idle.reducedReplacement, continuous: true }
  }), /reduced/u);
  assert.throws(() => poseCompositionSignature({
    ...idle,
    reducedReplacement: { ...idle.reducedReplacement, finalPoseId: "walk" }
  }), /final pose/u);
  for (const invalid of [
    withHiddenExtra(idle),
    { ...idle, [Symbol("extra")]: true },
    withAccessor(idle, "poseId"),
    { ...idle, transforms: withHiddenExtra(idle.transforms) },
    { ...idle, face: { ...idle.face, [Symbol("extra")]: true } }
  ]) {
    assert.throws(() => poseCompositionSignature(invalid), /plain record|keys|pose/u);
  }
});

test("the visual cast is an exact frozen 32 plus a separate compatible player", () => {
  const canonical = SOUND_SEEKERS_CHAPTERS.flatMap(chapter => [
    { characterId: chapter.cast.guide.name, chapterId: chapter.id, castKind: "guide" },
    ...chapter.cast.residents.map(resident => ({
      characterId: resident.name,
      chapterId: chapter.id,
      castKind: "resident"
    }))
  ]);
  const arcIdentities = Object.values(SOUND_SEEKERS_CAST_ARCS).flatMap(arc => (
    arc.characters.map(character => ({ characterId: character.id, chapterId: arc.chapterId }))
  ));

  assert.equal(SOUND_SEEKERS_CHARACTER_VISUALS.length, 32);
  assertRecursivelyFrozen(SOUND_SEEKERS_CHARACTER_VISUALS);
  assertRecursivelyFrozen(SOUND_SEEKERS_PLAYER_VISUAL);
  assert.deepEqual(
    SOUND_SEEKERS_CHARACTER_VISUALS.map(({ characterId, chapterId, castKind }) => ({
      characterId, chapterId, castKind
    })),
    canonical
  );
  assert.deepEqual(
    SOUND_SEEKERS_CHARACTER_VISUALS.map(({ characterId, chapterId }) => ({
      characterId, chapterId
    })),
    arcIdentities
  );
  assert.equal(new Set(SOUND_SEEKERS_CHARACTER_VISUALS.map(characterVisualSignature)).size, 32);

  for (const visual of [...SOUND_SEEKERS_CHARACTER_VISUALS, SOUND_SEEKERS_PLAYER_VISUAL]) {
    assertExactKeys(visual, CHARACTER_KEYS);
    assert.equal(visual.styleId, "sound-seekers-painted-shape-v2");
    assert.equal(visual.visualSignature, characterVisualSignature(visual));
    assert.equal(typeof SOUND_SEEKERS_VISUAL_TOKENS[visual.paletteTokenId], "string");
    assert.doesNotMatch(visual.paletteTokenId, /^#/u);
    assert.deepEqual(Object.keys(visual.gearAnchorIds), ["back", "head", "neck", "held"]);
    assert.deepEqual(Object.keys(visual.poseRendererIds), POSE_IDS);
    assert.deepEqual(
      Object.values(visual.poseRendererIds),
      SOUND_SEEKERS_POSE_RENDERERS.map(pose => pose.id)
    );
    assert.equal(Object.hasOwn(visual, "name"), false);
    assert.equal(Object.hasOwn(visual, "role"), false);
    assert.equal(Object.hasOwn(visual, "archetype"), false);
  }

  assert.equal(SOUND_SEEKERS_PLAYER_VISUAL.characterId, "player");
  assert.equal(SOUND_SEEKERS_PLAYER_VISUAL.chapterId, null);
  assert.equal(SOUND_SEEKERS_PLAYER_VISUAL.castKind, "player");
  assert.equal(
    new Set([
      ...SOUND_SEEKERS_CHARACTER_VISUALS.map(characterVisualSignature),
      characterVisualSignature(SOUND_SEEKERS_PLAYER_VISUAL)
    ]).size,
    33
  );
});

test("character signatures ignore identity and palette but enforce structural substance", () => {
  const reference = SOUND_SEEKERS_CHARACTER_VISUALS[0];
  assert.equal(
    characterVisualSignature({ ...reference, characterId: "Renamed clone" }),
    reference.visualSignature
  );
  assert.equal(
    characterVisualSignature({ ...reference, paletteTokenId: "light-seedwake" }),
    reference.visualSignature
  );
  assert.notEqual(
    characterVisualSignature({ ...reference, rolePropId: "role-prop:structural-change" }),
    reference.visualSignature
  );

  const missingRoleProp = Object.fromEntries(
    Object.entries(reference).filter(([key]) => key !== "rolePropId")
  );
  const missingPose = Object.fromEntries(
    Object.entries(reference.poseRendererIds).filter(([poseId]) => poseId !== "recover")
  );
  for (const invalid of [
    missingRoleProp,
    { ...reference, extra: true },
    withHiddenExtra(reference),
    { ...reference, [Symbol("extra")]: true },
    withAccessor(reference, "characterId"),
    { ...reference, paletteTokenId: "#FFFFFF" },
    { ...reference, featureIds: [...reference.featureIds, reference.featureIds[0]] },
    { ...reference, gearAnchorIds: withHiddenExtra(reference.gearAnchorIds) },
    { ...reference, gearAnchorIds: { ...reference.gearAnchorIds, held: "anchor:unknown" } },
    { ...reference, poseRendererIds: missingPose },
    {
      ...reference,
      poseRendererIds: { ...reference.poseRendererIds, walk: reference.poseRendererIds.idle }
    },
    { ...reference, poseRendererIds: { ...reference.poseRendererIds, walk: "pose:unknown" } }
  ]) {
    assert.throws(() => characterVisualSignature(invalid), /character|keys|palette|feature|anchor|pose/u);
  }
});

test("character catalog keeps the locked pure imports and contains no legacy visual authority", () => {
  const source = readFileSync(new URL(
    "../../src/features/soundSeekers/visual/characterCatalog.js",
    import.meta.url
  ), "utf8");
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/gu)].map(match => match[1]);
  assert.deepEqual(imports, [
    "../content/chapters/index.js",
    "../content/castArcs.js",
    "./visualTokens.js"
  ]);
  assert.doesNotMatch(source, /#[0-9A-F]{3,8}\b/iu);
  assert.doesNotMatch(
    source,
    /(?:React|Phaser|Three|QuestPixel|quest-pixel|bookCharacterAvatar|creatureParts|game-assets)/u
  );
});

test("every canonical cast member and player renders the same code-native inventory in ten poses", () => {
  const characterIds = SOUND_SEEKERS_CHARACTER_VISUALS.map(visual => visual.characterId);
  characterIds.push("player");
  let renderedCount = 0;
  const referencePoseSubtrees = [];
  const castIdleSubtrees = [];

  for (const characterId of characterIds) {
    for (const poseId of SOUND_SEEKERS_POSE_IDS) {
      const props = {
        characterId,
        pose: poseId,
        ...(characterId === "player" ? { appearance: FULL_PLAYER_APPEARANCE } : {})
      };
      const html = renderToStaticMarkup(React.createElement(SoundSeekersCharacter, props));
      const poseRenderer = resolvePoseRenderer(poseId);
      assert.match(html, new RegExp(`data-character-id="${characterId}"`, "u"));
      assert.match(html, new RegExp(`data-pose-id="${poseId}"`, "u"));
      assert.match(
        html,
        new RegExp(`data-pose-composition-signature="${poseCompositionSignature(poseRenderer)}"`, "u")
      );
      assert.match(html, /data-reduced-transition="outline-opacity-static-final"/u);
      assert.match(html, new RegExp(`data-reduced-final-pose="${poseId}"`, "u"));
      assert.match(html, /data-reduced-continuous="false"/u);
      assert.deepEqual(extractAttributeValues(html, "data-character-part"), CHARACTER_PART_INVENTORY);
      assert.doesNotMatch(html, /<(?:img|canvas)\b/iu);

      if (characterId === "Bouncy") {
        const svg = html.match(/<svg[^>]*>([\s\S]*?)<\/svg>/u)?.[1];
        assert.equal(typeof svg, "string");
        referencePoseSubtrees.push(svg);
      }
      if (characterId !== "player" && poseId === "idle") {
        const svg = html.match(/<svg[^>]*>([\s\S]*?)<\/svg>/u)?.[1];
        assert.equal(typeof svg, "string");
        castIdleSubtrees.push(normalizedSvgGeometry(svg));
        assert.equal((html.match(/data-feature-family=/gu) ?? []).length, 3);
        assert.match(html, /data-role-prop-family=/u);
      }
      renderedCount += 1;
    }
  }

  assert.equal(renderedCount, 330);
  assert.equal(new Set(referencePoseSubtrees).size, 10);
  assert.equal(castIdleSubtrees.length, 32);
  assert.equal(
    new Set(castIdleSubtrees).size,
    32,
    "all canonical cast silhouettes, details, and role props must render distinctly"
  );
});

test("player rendering keeps all four cosmetic layers and canonical appearance identity", () => {
  const html = renderToStaticMarkup(React.createElement(SoundSeekersCharacter, {
    characterId: "player",
    pose: "repair",
    appearance: FULL_PLAYER_APPEARANCE
  }));
  assert.ok(html.includes(
    `data-appearance-signature="${appearanceSignature(FULL_PLAYER_APPEARANCE)
      .replaceAll('"', "&quot;")}"`
  ));
  assert.match(html, /data-accessory-id="gear-back-field-pack"/u);
  assert.match(html, /data-accessory-id="gear-head-star-band"/u);
  assert.match(html, /data-accessory-id="gear-neck-seed-charm"/u);
  assert.match(html, /data-accessory-id="gear-held-field-journal"/u);
  assert.ok(html.indexOf("data-character-part=\"back-accessory\"") < html.indexOf(
    "data-character-part=\"torso\""
  ));
  assert.ok(html.indexOf("data-character-part=\"torso\"") < html.indexOf(
    "data-character-part=\"neck-accessory\""
  ));
  assert.ok(html.indexOf("data-character-part=\"head-accessory\"") < html.indexOf(
    "data-character-part=\"held-accessory\""
  ));
});

test("character rendering rejects unknown identities, poses, and cast customization", () => {
  assert.throws(
    () => renderToStaticMarkup(React.createElement(SoundSeekersCharacter, {
      characterId: "unknown", pose: "idle"
    })),
    /character/u
  );
  assert.throws(
    () => renderToStaticMarkup(React.createElement(SoundSeekersCharacter, {
      characterId: "Bouncy", pose: "unknown"
    })),
    /pose/u
  );
  assert.throws(
    () => renderToStaticMarkup(React.createElement(SoundSeekersCharacter, {
      characterId: "Bouncy", pose: "idle", appearance: FULL_PLAYER_APPEARANCE
    })),
    /player|appearance|custom/u
  );
});

test("character-only styles use token variables and publish reduced-motion semantics", () => {
  const css = readFileSync(new URL(
    "../../src/features/soundSeekers/visual/visual-system.css",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(css, /#[0-9A-F]{3,8}\b|rgb\(|hsl\(/iu);
  assert.match(css, /var\(--ss-token-/u);
  assert.match(css, /min-block-size:\s*56px/u);
  assert.match(css, /min-inline-size:\s*56px/u);
  assert.match(css, /:focus-visible/u);
  assert.match(css, /prefers-reduced-motion:\s*reduce/u);
  assert.match(css, /\.sound-seekers-character\b/u);
  assert.match(css, /\.sound-seekers-character-creator\b/u);
  const creatorFocusRule = css.match(
    /\.sound-seekers-character-creator__choice:focus-visible\s*\{[^}]+\}/u
  )?.[0];
  const optionFocusRule = css.match(
    /\.sound-seekers-scene__option:focus-visible\s*\{[^}]+\}/u
  )?.[0];
  assert.match(creatorFocusRule, /outline:\s*4px solid var\(--ss-token-ink-deep\)/u);
  assert.match(optionFocusRule, /outline:\s*5px solid var\(--ss-token-ink-deep\)/u);
  assert.doesNotMatch(`${creatorFocusRule}\n${optionFocusRule}`, /focus-gold/u);
});

test("all 40 child scenes SSR through the real world with exact neutral choices", () => {
  let optionCount = 0;
  const settingGeometries = new Set();
  const routeGeometries = new Set();
  const optionGeometries = new Set();
  const optionShapeFamilies = new Set();
  const optionActionFamilies = new Set();
  for (let stopNumber = 1; stopNumber <= 40; stopNumber += 1) {
    const childScene = toViteChildConnectedTextScene(
      `scene-s${stopNumber}`,
      `renderer-route-seed:${stopNumber}`
    );
    const route = viteRouteSpecs.find(item => item.stopId === childScene.stopId);
    const landmark = viteLandmarkBindings.find(item => item.sceneId === childScene.id);
    const html = renderToStaticMarkup(React.createElement(SceneVisual, {
      childScene,
      activeAttemptId: null,
      reducerRevision: null,
      sceneAccess: null,
      cropProfile: "landscape",
      densityProfile: "full",
      motionProfile: "reduced",
      onChoose: () => {}
    }));

    assert.match(html, new RegExp(`data-scene-id="${childScene.id}"`, "u"));
    assert.match(html, /data-scene-phase="pre_choice"/u);
    assert.match(html, new RegExp(`data-route-geometry="${route.pathGeometryId}"`, "u"));
    assert.match(html, new RegExp(`data-landmark-state="${landmark.initialStateId}"`, "u"));
    assert.match(html, new RegExp(`data-character-id="${childScene.residentId}"`, "u"));
    assert.match(html, new RegExp(`data-visual-state-id="${landmark.initialStateId}"`, "u"));
    assert.match(html, /data-code-native-setting=""/u);
    assert.match(html, /data-scene-prompt=""/u);
    assert.doesNotMatch(html, /expectedToken|distractorRationale|data-correct|data-answer/u);
    assertNoInternalChildCopy(html);
    const settingSvg = html.match(
      /data-code-native-setting=""[\s\S]*?<svg[^>]*>([\s\S]*?)<\/svg>/u
    )?.[1];
    const routeSvg = html.match(
      /data-route-geometry="[^"]+"[\s\S]*?<svg[^>]*>([\s\S]*?)<\/svg>/u
    )?.[1];
    assert.equal(typeof settingSvg, "string");
    assert.equal(typeof routeSvg, "string");
    settingGeometries.add(normalizedSvgGeometry(settingSvg));
    routeGeometries.add(normalizedSvgGeometry(routeSvg));

    const renderedOptionIds = extractAttributeValues(html, "data-option-visual-id");
    assert.deepEqual(renderedOptionIds, childScene.choice.options.map(option => option.visualSemanticId));
    for (const option of childScene.choice.options) {
      const button = html.match(new RegExp(
        `<button[^>]*data-option-visual-id="${option.visualSemanticId}"[\\s\\S]*?<\\/button>`,
        "u"
      ))?.[0];
      assert.equal(typeof button, "string");
      assert.ok(button.includes(`aria-label="${escapeRenderedText(option.accessibleLabel)}"`));
      assert.ok(button.includes(escapeRenderedText(option.childLabel)));
      assert.ok(button.includes(`data-option-action="`));
      assert.ok(button.includes(`data-comparison-geometry="`));
      assert.ok(button.includes(`data-option-geometry="`));
      assert.ok(button.includes(`data-min-css-px="56"`));
      const optionSvg = button.match(/<svg[^>]*>([\s\S]*?)<\/svg>/u)?.[1];
      assert.equal(typeof optionSvg, "string");
      optionGeometries.add(normalizedSvgGeometry(optionSvg));
      extractAttributeValues(button, "data-option-geometry").forEach(value => (
        optionShapeFamilies.add(value)
      ));
      extractAttributeValues(button, "data-action-geometry").forEach(value => (
        optionActionFamilies.add(value)
      ));
    }
    optionCount += renderedOptionIds.length;
  }
  assert.equal(optionCount, 112);
  assert.equal(settingGeometries.size, 8);
  assert.equal(routeGeometries.size, 40);
  assert.equal(optionGeometries.size, 112);
  assert.ok(optionShapeFamilies.size >= 8);
  assert.ok(optionActionFamilies.size >= 6);
});

test("all 48 authenticated post-decisions SSR through their own action and resolved states", () => {
  const renderedPostDecisionIds = new Set();
  for (const semantics of viteVisualSemantics.SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS) {
    const childScene = toViteChildConnectedTextScene(
      semantics.sceneId,
      `post-decision-render:${semantics.sceneId}`
    );
    const branchTokens = semantics.postDecisionSemanticIds.length === 2
      ? childScene.choice.options.map(option => option.token)
      : [null];
    const landmark = viteLandmarkBindings.find(item => item.sceneId === semantics.sceneId);
    const bossLabels = { action: [], resolved: [], consequence: [] };
    for (const narrativeChoiceToken of branchTokens) {
      const fixture = completeVitePresentation(semantics.sceneId, { narrativeChoiceToken });
      const actionContext = {
        sceneId: semantics.sceneId,
        attemptId: fixture.attemptId,
        reducerRevision: fixture.actionTransition.reducerRevision
      };
      const actionAccess = viteSceneAccess.issueSceneVisualAccess(
        fixture.actionTransition,
        actionContext
      );
      const actionHtml = renderViteScene(childScene, {
        ...actionContext,
        sceneAccess: actionAccess
      });
      const postDecision = viteVisualSemantics.resolveSceneVisualSemantic(
        actionAccess.postDecisionSemanticId
      );
      assert.match(actionHtml, /data-scene-phase="action"/u);
      assert.match(
        actionHtml,
        new RegExp(`data-landmark-state="${postDecision.actionStateId}"`, "u")
      );
      assert.match(
        actionHtml,
        new RegExp(`data-code-native-semantic="${postDecision.id}"`, "u")
      );
      assert.doesNotMatch(
        actionHtml,
        /expectedToken|distractorRationale|data-correct|data-answer|evidenceEventId/u
      );
      assertNoInternalChildCopy(actionHtml);
      const actionLabel = landmarkAccessibleLabel(actionHtml);
      const selectedBinding = landmark.postDecisionBindings.find(binding => (
        binding.postDecisionSemanticId === postDecision.id
      ));
      assert.ok(selectedBinding);
      if (narrativeChoiceToken !== null) {
        const chosenOption = childScene.choice.options.find(
          option => option.token === narrativeChoiceToken
        );
        assert.ok(actionLabel.startsWith(chosenOption.childLabel.replace(/[.!?]+$/u, "")));
        const unselectedBinding = landmark.postDecisionBindings.find(binding => (
          binding.postDecisionSemanticId !== postDecision.id
        ));
        for (const unselectedStateId of [
          unselectedBinding.actionStateId,
          unselectedBinding.resolvedStateId,
          unselectedBinding.consequenceId
        ]) {
          assert.throws(
            () => renderToStaticMarkup(React.createElement(Landmark, {
              landmark,
              stateId: unselectedStateId,
              activeAttemptId: actionContext.attemptId,
              reducerRevision: actionContext.reducerRevision,
              sceneAccess: actionAccess
            })),
            /authorized|selected current branch/u
          );
        }
        assert.throws(
          () => renderToStaticMarkup(React.createElement(Landmark, {
            landmark,
            stateId: selectedBinding.actionStateId
          })),
          /authorized/u
        );
      }

      const resolved = vitePresentation.reduceConnectedTextPresentation(
        fixture.actionPresentation,
        {
          type: "action_completed",
          reducerRevision: fixture.actionPresentation.reducerRevision
        },
        { state: fixture.state }
      );
      const resolvedContext = {
        sceneId: semantics.sceneId,
        attemptId: fixture.attemptId,
        reducerRevision: resolved.transition.reducerRevision
      };
      const resolvedAccess = viteSceneAccess.issueSceneVisualAccess(
        resolved.transition,
        resolvedContext
      );
      const resolvedHtml = renderViteScene(childScene, {
        ...resolvedContext,
        sceneAccess: resolvedAccess
      });
      assert.match(resolvedHtml, /data-scene-phase="resolved"/u);
      assert.match(
        resolvedHtml,
        new RegExp(`data-landmark-state="${postDecision.resolvedStateId}"`, "u")
      );
      assertNoInternalChildCopy(resolvedHtml);
      const resolvedLabel = landmarkAccessibleLabel(resolvedHtml);
      const consequenceHtml = renderToStaticMarkup(React.createElement(Landmark, {
        landmark,
        stateId: postDecision.consequenceId,
        activeAttemptId: resolvedContext.attemptId,
        reducerRevision: resolvedContext.reducerRevision,
        sceneAccess: resolvedAccess
      }));
      assert.match(
        consequenceHtml,
        new RegExp(`data-landmark-state="${postDecision.consequenceId}"`, "u")
      );
      assertNoInternalChildCopy(consequenceHtml);
      const consequenceLabel = landmarkAccessibleLabel(consequenceHtml);
      assert.equal(resolvedAccess.postDecisionSemanticId, postDecision.id);
      if (narrativeChoiceToken !== null) {
        const branch = viteVisualSemantics.resolveNarrativeBranchOutcome(
          semantics.sceneId,
          narrativeChoiceToken
        );
        assert.equal(resolvedAccess.storyOutcomeId, branch.storyOutcomeId);
        assert.equal(resolvedAccess.postDecisionSemanticId, branch.postDecisionSemanticId);
        bossLabels.action.push(actionLabel);
        bossLabels.resolved.push(resolvedLabel);
        bossLabels.consequence.push(consequenceLabel);
        assert.equal(new Set([
          actionLabel, resolvedLabel, consequenceLabel
        ]).size, 3);
      }
      renderedPostDecisionIds.add(postDecision.id);
      assert.equal(vitePresentation.closeConnectedTextPresentation(resolved.nextPresentation), true);
    }
    if (branchTokens.length === 2) {
      for (const labels of Object.values(bossLabels)) assert.equal(new Set(labels).size, 2);
      const neutralHtml = renderViteScene(childScene, {
        attemptId: null,
        reducerRevision: null,
        sceneAccess: null
      });
      const neutralChildCopy = childCopyForAudit(neutralHtml);
      for (const label of Object.values(bossLabels).flat()) {
        assert.equal(
          neutralChildCopy.includes(label),
          false,
          "branch-result copy must not appear before the child chooses"
        );
      }
    }
  }

  assert.equal(renderedPostDecisionIds.size, 48);
});

test("every direct meaning SSRs only through its deterministic real owner and current access", () => {
  const renderedMeaningIds = new Set();
  const renderedMeaningGeometries = new Set();
  const renderedMeaningActionFamilies = new Set();
  for (const owner of viteVisualSemantics.SOUND_SEEKERS_MEANING_VISUAL_OWNERS) {
    const childScene = toViteChildConnectedTextScene(
      owner.sceneId,
      `meaning-render:${owner.meaningSemanticId}`
    );
    const semantics = viteVisualSemantics.SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS.find(
      item => item.sceneId === owner.sceneId
    );
    const narrativeChoiceToken = semantics.postDecisionSemanticIds.length === 2
      ? childScene.choice.options.find(option => (
        viteVisualSemantics.resolveNarrativeBranchOutcome(owner.sceneId, option.token)
          .postDecisionSemanticId === owner.postDecisionSemanticId
      )).token
      : null;
    const fixture = completeVitePresentation(owner.sceneId, { narrativeChoiceToken });
    const resolved = vitePresentation.reduceConnectedTextPresentation(
      fixture.actionPresentation,
      {
        type: "action_completed",
        reducerRevision: fixture.actionPresentation.reducerRevision
      },
      { state: fixture.state }
    );
    assert.equal(resolved.transition.postDecisionSemanticId, owner.postDecisionSemanticId);
    const meaning = vitePresentation.reduceConnectedTextPresentation(
      resolved.nextPresentation,
      {
        type: "meaning_requested",
        reducerRevision: resolved.nextPresentation.reducerRevision,
        meaningSemanticId: owner.meaningSemanticId
      },
      { state: fixture.state }
    );
    const meaningContext = {
      sceneId: owner.sceneId,
      attemptId: fixture.attemptId,
      reducerRevision: meaning.transition.reducerRevision
    };
    const meaningAccess = viteSceneAccess.issueSceneVisualAccess(
      meaning.transition,
      meaningContext
    );
    const html = renderViteScene(childScene, {
      ...meaningContext,
      sceneAccess: meaningAccess
    });
    const meaningVisual = viteResolveSceneVisualPresentation(childScene, {
      activeAttemptId: meaningContext.attemptId,
      reducerRevision: meaningContext.reducerRevision,
      sceneAccess: meaningAccess
    }).meaningVisual;
    assert.match(html, /data-scene-phase="meaning_support"/u);
    assert.match(
      html,
      new RegExp(`data-meaning-semantic-id="${owner.meaningSemanticId}"`, "u")
    );
    assert.match(
      html,
      new RegExp(`data-meaning-action-pose="${meaningVisual.actionPoseId}"`, "u")
    );
    assert.ok(html.includes(`aria-label="${escapeRenderedText(meaningVisual.accessibleLabel)}"`));
    const meaningSvg = html.match(
      /data-meaning-semantic-id="[^"]+"[\s\S]*?<svg[^>]*>([\s\S]*?)<\/svg>/u
    )?.[1];
    assert.equal(typeof meaningSvg, "string");
    renderedMeaningGeometries.add(normalizedSvgGeometry(meaningSvg));
    extractAttributeValues(html, "data-meaning-action-geometry").forEach(value => (
      renderedMeaningActionFamilies.add(value)
    ));
    assert.doesNotMatch(
      html,
      /expectedToken|distractorRationale|data-correct|data-answer|evidenceEventId/u
    );
    assertNoInternalChildCopy(html);
    renderedMeaningIds.add(owner.meaningSemanticId);
    assert.equal(vitePresentation.closeConnectedTextPresentation(meaning.nextPresentation), true);
  }

  assert.equal(
    renderedMeaningIds.size,
    viteVisualSemantics.SOUND_SEEKERS_MEANING_VISUAL_OWNERS.length
  );
  assert.equal(renderedMeaningGeometries.size, renderedMeaningIds.size);
  assert.ok(renderedMeaningActionFamilies.size >= 6);
});

test("pending and failed background states preserve one identical complete code-native world", () => {
  const childScene = toViteChildConnectedTextScene("scene-s1", "background-state-identity");
  const presentation = viteResolveSceneVisualPresentation(childScene);
  const kit = getBiomeKit(childScene.chapterId);
  const pending = createBackgroundImageState(kit.background.src);
  const failed = reduceBackgroundImageState(pending, {
    type: "failed",
    src: kit.background.src
  });
  const props = {
    kit,
    scenePresentation: presentation,
    cropProfile: "landscape",
    densityProfile: "full",
    motionProfile: "reduced"
  };
  const pendingHtml = renderToStaticMarkup(React.createElement(LayeredBiome, {
    ...props,
    backgroundImageState: pending
  }));
  const failedHtml = renderToStaticMarkup(React.createElement(LayeredBiome, {
    ...props,
    backgroundImageState: failed
  }));

  assert.match(pendingHtml, /data-background-status="pending"/u);
  assert.match(failedHtml, /data-background-status="failed"/u);
  assert.match(failedHtml, /<img[^>]*data-biome-background=""/u);
  assert.match(failedHtml, /<img[^>]*aria-hidden="true"/u);
  assert.equal(codeNativeWorldMarkup(pendingHtml), codeNativeWorldMarkup(failedHtml));
  for (const required of [
    "data-code-native-setting", "data-route-geometry", "data-landmark-state",
    "data-character-id", "data-visual-state-id"
  ]) {
    assert.match(failedHtml, new RegExp(required, "u"));
  }
  assert.doesNotMatch(failedHtml, /data-scene-loading/u);
});

test("density and motion axes keep essential semantics while reducing decoration and motion", () => {
  const childScene = toViteChildConnectedTextScene("scene-s1", "profile-axis-identity");
  const presentation = viteResolveSceneVisualPresentation(childScene);
  const kit = getBiomeKit(childScene.chapterId);
  const backgroundImageState = createBackgroundImageState(kit.background.src);
  const render = (densityProfile, motionProfile) => renderToStaticMarkup(
    React.createElement(LayeredBiome, {
      kit,
      scenePresentation: presentation,
      cropProfile: "portrait",
      densityProfile,
      motionProfile,
      backgroundImageState
    })
  );
  const full = render("full", "full");
  const simplified = render("simplified", "reduced");

  assert.match(full, /data-density-profile="full"/u);
  assert.match(full, /data-motion-profile="full"/u);
  assert.match(simplified, /data-density-profile="simplified"/u);
  assert.match(simplified, /data-motion-profile="reduced"/u);
  assert.match(simplified, /data-reduced-transition="outline-opacity-static-final"/u);
  assert.match(simplified, /data-reduced-continuous="false"/u);
  for (const required of [
    "data-code-native-setting", "data-route-geometry", "data-landmark-state",
    "data-character-id", "data-visual-state-id"
  ]) {
    assert.match(full, new RegExp(required, "u"));
    assert.match(simplified, new RegExp(required, "u"));
  }
  assert.ok(
    (full.match(/data-world-decoration=/gu) ?? []).length
      > (simplified.match(/data-world-decoration=/gu) ?? []).length
  );
});

test("landmarks expose neutral state freely and require current selected-branch access later", () => {
  for (const landmark of viteLandmarkBindings) {
    const validStateIds = new Set([
      landmark.initialStateId,
      ...landmark.postDecisionBindings.flatMap(binding => [
        binding.actionStateId,
        binding.resolvedStateId,
        binding.consequenceId
      ])
    ]);
    for (const stateId of validStateIds) {
      const visual = landmark.stateVisuals[stateId];
      assert.equal(typeof visual.shapeId, "string");
      assert.equal(Number.isInteger(visual.partCount) && visual.partCount > 0, true);
      assert.equal(typeof visual.patternId, "string");
      assert.equal(typeof visual.accessibleLabel, "string");
      if (stateId === landmark.initialStateId) {
        const html = renderToStaticMarkup(React.createElement(Landmark, { landmark, stateId }));
        assert.match(html, new RegExp(`data-landmark-state="${stateId}"`, "u"));
        assert.match(html, new RegExp(`data-landmark-shape="${visual.shapeId}"`, "u"));
        assert.match(html, new RegExp(`data-landmark-part-count="${visual.partCount}"`, "u"));
        assert.match(html, new RegExp(`data-landmark-pattern="${visual.patternId}"`, "u"));
        assert.ok(html.includes(`aria-label="${visual.accessibleLabel}"`));
        assert.equal((html.match(/data-landmark-part=/gu) ?? []).length, visual.partCount);
        assertNoInternalChildCopy(html);
      } else {
        assert.throws(
          () => renderToStaticMarkup(React.createElement(Landmark, { landmark, stateId })),
          /authorized/u
        );
      }
    }
    assert.throws(
      () => renderToStaticMarkup(React.createElement(Landmark, {
        landmark,
        stateId: "caller-authored-state"
      })),
      /landmark state/u
    );
  }
});

test("world renderers and the browser harness keep the exact public child-safe import boundary", () => {
  const sources = Object.fromEntries([
    "LayeredBiome.jsx", "SceneVisual.jsx", "Landmark.jsx"
  ].map(fileName => [fileName, readFileSync(new URL(
    `../../src/features/soundSeekers/visual/${fileName}`,
    import.meta.url
  ), "utf8")]));
  const fixture = readFileSync(new URL(
    "../fixtures/soundSeekersVisualHarness.jsx",
    import.meta.url
  ), "utf8");
  const allRendererSource = Object.values(sources).join("\n");

  assert.match(sources["SceneVisual.jsx"], /resolveSceneVisualPresentation/u);
  assert.match(sources["SceneVisual.jsx"], /getBiomeKit/u);
  assert.match(sources["SceneVisual.jsx"], /<LayeredBiome/u);
  assert.match(sources["LayeredBiome.jsx"], /<SoundSeekersCharacter/u);
  assert.match(sources["LayeredBiome.jsx"], /<Landmark/u);
  assert.match(fixture, /toChildConnectedTextScene/u);
  assert.match(fixture, /<SceneVisual/u);
  assert.doesNotMatch(
    `${allRendererSource}\n${fixture}`,
    /connectedTextRecords|connectedTextAnswerKeys|expectedToken|distractorRationale|QuestPixel|Phaser|Three/u
  );
  assert.doesNotMatch(allRendererSource, /#[0-9A-F]{3,8}\b|rgb\(|hsl\(/iu);
  assert.equal((sources["SceneVisual.jsx"].match(/\bonChoose\(/gu) ?? []).length, 1);
});
