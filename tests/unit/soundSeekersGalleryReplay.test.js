import assert from "node:assert/strict";
import test from "node:test";

import { SOUND_SEEKERS_CONNECTED_TEXT } from "../../src/features/soundSeekers/content/connectedText.js";
import { resolveNarrativeBranchOutcome } from "../../src/features/soundSeekers/content/sceneVisualSemantics.js";
import { isConnectedTextPresentationTransition } from "../../src/features/soundSeekers/engine/connectedTextPresentation.js";
import { validateSceneVisualAccess } from "../../src/features/soundSeekers/engine/sceneVisualAccess.js";
import {
  SOUND_SEEKERS_GALLERY_REPLAY_RECIPE_IDS,
  parseSoundSeekersGalleryQuery,
  replaySoundSeekersGalleryFixture
} from "../../src/features/soundSeekers/preview/galleryReplayRecipes.js";

test("gallery queries accept only canonical child-safe replay inputs", () => {
  assert.deepEqual(parseSoundSeekersGalleryQuery("?stop=s20&fixture=assessed-correct-resolved&density=full&motion=full&labels=hidden&seed=11"), {
    mode: "scene", stopId: "s20", sceneId: "scene-s20", fixtureId: "assessed-correct-resolved",
    density: "full", motion: "full", labels: "hidden", seed: 11, optionId: null
  });
  for (const unsafe of [
    "state=repair", "phase=resolved", "worldState=repair", "correct=true", "answer=x",
    "fixture=resolved", "stop=s1&stop=s2", "unknown=x",
    "mode=creator", "mode=creator&option=idle",
    "mode=character-bouncy&option=body-shape-round",
    "mode=scene&stop=s1&option=body-shape-round",
    "mode=scene&stop=s5&fixture=boss-resolved&option=scene-s1-option-lift-light",
    "mode=meaning-meaning-bike-two-wheel-pedal-vehicle&scene=scene-s2&fixture=assessed-direct-meaning",
    "mode=meaning-meaning-action-person-doing-something&scene=scene-s40&fixture=boss-direct-meaning"
  ]) assert.throws(() => parseSoundSeekersGalleryQuery(`?${unsafe}`));

  assert.equal(parseSoundSeekersGalleryQuery(
    "?mode=creator&stop=s1&fixture=pre-choice&option=body-shape-sprout"
  ).optionId, "body-shape-sprout");
  assert.equal(parseSoundSeekersGalleryQuery(
    "?mode=character-bouncy&stop=s1&fixture=pre-choice&option=idle"
  ).optionId, "idle");
});

test("every frozen recipe is committed reducer replay rather than authored presentation state", () => {
  assert.equal(Object.isFrozen(SOUND_SEEKERS_GALLERY_REPLAY_RECIPE_IDS), true);
  for (const recipeId of SOUND_SEEKERS_GALLERY_REPLAY_RECIPE_IDS) {
    const boss = recipeId.startsWith("boss-");
    const sceneId = boss ? "scene-s5" : "scene-s1";
    const replay = replaySoundSeekersGalleryFixture({ recipeId, sceneId, seed: 11 });
    assert.equal(replay.recipeId, recipeId);
    assert.equal(replay.transitionSource, "committed-reducer-replay");
    assert.equal("challenge" in replay, false);
    assert.equal("expectedToken" in replay, false);
    if (replay.presentationTransition) {
      assert.equal(isConnectedTextPresentationTransition(replay.presentationTransition), true);
    }
    if (replay.sceneAccess) {
      assert.equal(validateSceneVisualAccess(replay.sceneAccess, replay.context), true);
    }
  }
});

test("all forty scenes and both boss branches resolve through current branded transitions", () => {
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    const optionIds = scene.choice.kind === "narrative_bridge"
      ? scene.choice.options.map(option => option.visualSemanticId) : [null];
    for (const optionId of optionIds) {
      const replay = replaySoundSeekersGalleryFixture({
        recipeId: scene.choice.kind === "narrative_bridge" ? "boss-resolved" : "assessed-correct-resolved",
        sceneId: scene.id,
        seed: 11,
        optionId
      });
      assert.equal(isConnectedTextPresentationTransition(replay.presentationTransition), true);
      assert.equal(validateSceneVisualAccess(replay.sceneAccess, replay.context), true);
      if (scene.choice.kind === "narrative_bridge") {
        const branch = resolveNarrativeBranchOutcome(scene.id, replay.persistedNarrativeChoiceToken);
        assert.equal(replay.presentationTransition.storyOutcomeId, branch.storyOutcomeId);
        assert.equal(replay.sceneAccess.storyOutcomeId, branch.storyOutcomeId);
        assert.equal(replay.canonicalEvidenceDomain, "novel_decoding");
      } else {
        assert.equal(replay.presentationTransition.storyOutcomeId, null);
        assert.equal(replay.canonicalEvidenceDomain, "connected_text_transfer");
      }
    }
  }
});
