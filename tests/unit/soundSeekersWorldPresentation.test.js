import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

let createBackgroundImageState;
let getBiomeKit;
let getExpedition;
let LayeredBiome;
let Landmark;
let normalizeSoundSeekersState;
let createSoundSeekersState;
let deriveWorldState;
let resolveWorldScenePresentation;
let validateWorldScenePresentation;
let resolveMeaningVisual;
let resolveSceneVisualPresentation;
let resolveSemanticVisual;
let toChildConnectedTextScene;
let contentTransactions;
let landmarkBindings;
let routeSpecs;
let vite;

test.before(async () => {
  vite = await createServer({
    appType: "custom",
    logLevel: "silent",
    server: { middlewareMode: true }
  });
  ({ createBackgroundImageState } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/backgroundImageState.js"
  ));
  ({ getBiomeKit } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/content/biomeKits.js"
  ));
  ({ getExpedition } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/content/expeditions.js"
  ));
  ({ LayeredBiome } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/LayeredBiome.jsx"
  ));
  ({ Landmark } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/Landmark.jsx"
  ));
  ({
    createSoundSeekersState,
    normalizeSoundSeekersState
  } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/stateV2.js"
  ));
  ({
    deriveWorldState,
    resolveWorldScenePresentation,
    validateWorldScenePresentation
  } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/worldState.js"
  ));
  ({ toChildConnectedTextScene } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/content/connectedText.js"
  ));
  contentTransactions = await vite.ssrLoadModule(
    "/src/features/soundSeekers/engine/contentDeckTransactions.js"
  );
  ({
    SOUND_SEEKERS_LANDMARK_BINDINGS: landmarkBindings,
    SOUND_SEEKERS_ROUTE_SPECS: routeSpecs,
    resolveMeaningVisual,
    resolveSceneVisualPresentation,
    resolveSemanticVisual
  } = await vite.ssrLoadModule(
    "/src/features/soundSeekers/visual/sceneVisualCatalog.js"
  ));
});

test.after(async () => {
  await vite?.close();
});

function persistedCampaignWithRepair(stopId) {
  const expedition = getExpedition(stopId);
  const initial = createSoundSeekersState();
  return normalizeSoundSeekersState(structuredClone({
    ...initial,
    trail: {
      ...initial.trail,
      completedStopIds: [stopId],
      repairs: { [expedition.payoff.repairId]: true }
    }
  }));
}

function persistedBossCampaign(narrativeChoiceToken) {
  const begun = contentTransactions.beginStoryTransferTransaction(
    createSoundSeekersState(),
    { stopId: "s5", journeyStep: 5, seed: 5 }
  );
  const transactionId = begun.transaction.transactionId;
  const pending = contentTransactions.checkpointStoryTransferTransaction(begun.nextState, {
    transactionId,
    narrativeChoiceToken
  });
  const challenge = contentTransactions.materializeStoryTransferChallenge(pending, {
    transactionId
  });
  const completed = contentTransactions.completeStoryTransferTransaction(pending, {
    transactionId,
    challenge,
    response: { kind: "literacy-answer", token: challenge.expectedToken },
    audio: { status: "completed" },
    at: "2026-09-03T08:00:00.000Z",
    sessionDay: "2026-09-03"
  });
  const expedition = getExpedition("s5");
  return normalizeSoundSeekersState(structuredClone({
    ...completed.nextState,
    trail: {
      ...completed.nextState.trail,
      completedStopIds: ["s5"],
      repairs: { [expedition.payoff.repairId]: true }
    }
  }));
}

function renderWorld(presentation) {
  const kit = getBiomeKit(presentation.chapterId);
  return renderToStaticMarkup(React.createElement(LayeredBiome, {
    kit,
    scenePresentation: presentation,
    cropProfile: "landscape",
    densityProfile: "full",
    motionProfile: "reduced",
    backgroundImageState: createBackgroundImageState(kit.background.src)
  }));
}

test("ordinary and repaired revisits render only their canonical route and landmark state", () => {
  const kit = getBiomeKit("seedwake-meadow");
  const ordinaryWorld = deriveWorldState(createSoundSeekersState(), kit);
  const ordinary = resolveWorldScenePresentation({ worldState: ordinaryWorld, stopId: "s1" });
  const s1Landmark = landmarkBindings.find(item => item.stopId === "s1");
  const s1Route = routeSpecs.find(item => item.stopId === "s1");

  assert.equal(Object.isFrozen(ordinary), true);
  assert.equal(validateWorldScenePresentation(ordinary), true);
  assert.strictEqual(ordinary.landmark, s1Landmark);
  assert.strictEqual(ordinary.route, s1Route);
  assert.equal(ordinary.visualStateId, s1Landmark.initialStateId);
  assert.equal(ordinary.scenePhase, "world");
  assert.deepEqual(ordinary.options, []);
  assert.equal(ordinary.meaningVisual, null);
  assert.match(renderWorld(ordinary), new RegExp(
    `data-landmark-state="${s1Landmark.initialStateId}"`, "u"
  ));

  const restoredCampaign = persistedCampaignWithRepair("s1");
  const restoredWorld = deriveWorldState(restoredCampaign, kit);
  const repaired = resolveWorldScenePresentation({ worldState: restoredWorld, stopId: "s1" });
  assert.equal(repaired.visualStateId, s1Landmark.postDecisionBindings[0].consequenceId);
  assert.match(renderWorld(repaired), new RegExp(
    `data-landmark-state="${s1Landmark.postDecisionBindings[0].consequenceId}"`, "u"
  ));
});

test("a persisted boss revisit renders only its authenticated narrative branch", () => {
  const child = toChildConnectedTextScene("scene-s5", "world-presentation-branch");
  const selectedToken = child.choice.options[1].token;
  const campaign = persistedBossCampaign(selectedToken);
  const world = deriveWorldState(campaign, getBiomeKit("seedwake-meadow"));
  const presentation = resolveWorldScenePresentation({ worldState: world, stopId: "s5" });
  const landmark = landmarkBindings.find(item => item.stopId === "s5");
  const selected = landmark.postDecisionBindings.find(binding => (
    binding.storyOutcomeId === world.storyOutcomes[landmark.sceneId].storyOutcomeId
      && binding.postDecisionSemanticId
        === world.storyOutcomes[landmark.sceneId].postDecisionSemanticId
  ));
  const other = landmark.postDecisionBindings.find(binding => binding !== selected);

  assert.equal(presentation.visualStateId, selected.consequenceId);
  assert.match(renderWorld(presentation), new RegExp(
    `data-landmark-state="${selected.consequenceId}"`, "u"
  ));
  assert.throws(() => renderToStaticMarkup(React.createElement(Landmark, {
    landmark,
    stateId: other.consequenceId,
    worldPresentation: presentation
  })), /authorized|world presentation/u);

  const wrongBranchCampaign = {
    ...campaign,
    trail: {
      ...campaign.trail,
      storyOutcomes: { [landmark.sceneId]: other.storyOutcomeId }
    }
  };
  const wrongBranchWorld = deriveWorldState(
    wrongBranchCampaign,
    getBiomeKit("seedwake-meadow")
  );
  assert.throws(
    () => resolveWorldScenePresentation({ worldState: wrongBranchWorld, stopId: "s5" }),
    /exact persisted boss branch/u
  );
});

test("forged, cloned, cross-stop, and cross-chapter world authorities fail closed", () => {
  const kit = getBiomeKit("seedwake-meadow");
  const world = deriveWorldState(persistedCampaignWithRepair("s1"), kit);
  const presentation = resolveWorldScenePresentation({ worldState: world, stopId: "s1" });
  const otherLandmark = landmarkBindings.find(item => item.stopId === "s2");

  for (const forged of [{ ...world }, structuredClone(world), Object.freeze({ ...world })]) {
    assert.throws(
      () => resolveWorldScenePresentation({ worldState: forged, stopId: "s1" }),
      /derived world state|authority/u
    );
  }
  assert.throws(
    () => resolveWorldScenePresentation({ worldState: world, stopId: "s6" }),
    /chapter|stop/u
  );
  const otherStop = resolveWorldScenePresentation({ worldState: world, stopId: "s2" });
  assert.equal(otherStop.visualStateId, otherLandmark.initialStateId);
  assert.equal(validateWorldScenePresentation(structuredClone(presentation)), false);
  assert.throws(() => renderWorld(structuredClone(presentation)), /world presentation|authorized/u);
  assert.throws(() => renderToStaticMarkup(React.createElement(Landmark, {
    landmark: otherLandmark,
    stateId: otherLandmark.initialStateId,
    worldPresentation: presentation
  })), /world presentation|authorized/u);
});

test("persisted world authority cannot select live action, options, or meaning", () => {
  const selectedToken = toChildConnectedTextScene(
    "scene-s5", "world-presentation-live-state"
  ).choice.options[0].token;
  const world = deriveWorldState(
    persistedBossCampaign(selectedToken),
    getBiomeKit("seedwake-meadow")
  );
  const presentation = resolveWorldScenePresentation({ worldState: world, stopId: "s5" });
  const landmark = presentation.landmark;
  const binding = landmark.postDecisionBindings.find(candidate => (
    candidate.consequenceId === presentation.visualStateId
  ));

  for (const liveStateId of [binding.actionStateId, binding.resolvedStateId]) {
    assert.throws(() => renderToStaticMarkup(React.createElement(Landmark, {
      landmark,
      stateId: liveStateId,
      worldPresentation: presentation
    })), /authorized|world presentation/u);
  }
  assert.throws(() => renderWorld(Object.freeze({
    ...presentation,
    options: [{ token: "forged" }]
  })), /world presentation|authorized/u);
  assert.throws(() => renderWorld(Object.freeze({
    ...presentation,
    meaningVisual: { semanticId: "forged-meaning" }
  })), /world presentation|authorized/u);
});

function repairedS1Presentation() {
  const world = deriveWorldState(
    persistedCampaignWithRepair("s1"),
    getBiomeKit("seedwake-meadow")
  );
  return resolveWorldScenePresentation({ worldState: world, stopId: "s1" });
}

test("LayeredBiome rejects a world clone stripped of kind and reset to initial state", () => {
  const worldPresentation = repairedS1Presentation();
  const initialStateId = worldPresentation.landmark.initialStateId;
  const { kind: omittedKind, ...strippedKind } = worldPresentation;
  void omittedKind;
  const attack = Object.freeze({ ...strippedKind, visualStateId: initialStateId });
  assert.throws(() => renderWorld(attack), /authorized .*presentation/u);
});

test("LayeredBiome rejects a changed-kind world clone with a canonical meaning", () => {
  const worldPresentation = repairedS1Presentation();
  const canonicalMeaning = resolveMeaningVisual("meaning-mat-flat-ground-cover");
  assert.ok(canonicalMeaning);
  const attack = Object.freeze({
    ...worldPresentation,
    kind: "sound_seekers_scene_visual_presentation",
    visualStateId: worldPresentation.landmark.initialStateId,
    meaningVisual: canonicalMeaning
  });
  assert.throws(() => renderWorld(attack), /authorized .*presentation/u);
});

test("LayeredBiome rejects a stripped world clone with a canonical post-decision visual", () => {
  const worldPresentation = repairedS1Presentation();
  const binding = worldPresentation.landmark.postDecisionBindings[0];
  const canonicalPostDecision = resolveSemanticVisual(binding.postDecisionSemanticId);
  assert.ok(canonicalPostDecision);
  const { kind: omittedKind, ...strippedKind } = worldPresentation;
  void omittedKind;
  const attack = Object.freeze({
    ...strippedKind,
    visualStateId: worldPresentation.landmark.initialStateId,
    focalProps: [canonicalPostDecision]
  });
  assert.throws(() => renderWorld(attack), /authorized .*presentation/u);
});

test("LayeredBiome rejects cloned live presentations with injected canonical meaning", () => {
  const childScene = toChildConnectedTextScene("scene-s1", "cloned-live-presentation");
  const livePresentation = resolveSceneVisualPresentation(childScene);
  const canonicalMeaning = resolveMeaningVisual("meaning-mat-flat-ground-cover");
  assert.ok(canonicalMeaning);
  const attack = Object.freeze({ ...livePresentation, meaningVisual: canonicalMeaning });
  assert.throws(() => renderWorld(attack), /authorized .*presentation/u);
});

test("LayeredBiome preserves exact canonical live presentations", () => {
  const childScene = toChildConnectedTextScene("scene-s1", "exact-live-presentation");
  const livePresentation = resolveSceneVisualPresentation(childScene);
  assert.match(renderWorld(livePresentation), /data-scene-phase="pre_choice"/u);
});
