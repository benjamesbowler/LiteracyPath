import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Parser } from "acorn";
import jsx from "acorn-jsx";

import {
  CONNECTED_TEXT_RECORDS
} from "../../src/features/soundSeekers/content/connectedTextRecords.js";
import {
  CONNECTED_TEXT_EVALUATORS,
  SOUND_SEEKERS_CONNECTED_TEXT,
  createConnectedTextChallenge,
  evaluateConnectedTextDecision,
  getConnectedText,
  readabilityBandForStop,
  toChildConnectedTextScene,
  tokenizeConnectedText,
  validateSceneAtStop
} from "../../src/features/soundSeekers/content/connectedText.js";
import {
  SOUND_SEEKERS_MEANING_VISUAL_OWNERS,
  SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS,
  SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES,
  SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS,
  SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS,
  SOUND_SEEKERS_PRE_CHOICE_VISUAL_SEMANTICS,
  SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS,
  SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY,
  getSceneVisualSemantics,
  resolveNarrativeBranchOutcome,
  resolveSceneVisualSemantic
} from "../../src/features/soundSeekers/content/sceneVisualSemantics.js";
import { SOUND_SEEKERS_MEANING_SUPPORT } from "../../src/features/soundSeekers/content/meaningSupport.js";
import { MEANING_SUPPORT_RECORDS } from "../../src/features/soundSeekers/content/meaningSupportRecords.js";
import {
  SOUND_SEEKERS_EXPEDITIONS
} from "../../src/features/soundSeekers/content/expeditions.js";
import {
  getContentDeckCatalog
} from "../../src/features/soundSeekers/content/contentDeckCatalogs.js";
import {
  beginStoryTransferTransaction,
  checkpointStoryTransferTransaction,
  materializeStoryTransferChallenge
} from "../../src/features/soundSeekers/engine/contentDeckTransactions.js";
import { createSoundSeekersState } from "../../src/features/soundSeekers/engine/stateV2.js";

const optionKeys = ["token", "presentation", "childLabel", "accessibleLabel", "visualSemanticId"];
const childKeys = [
  "chapterId", "choice", "id", "level", "preChoiceSemanticId", "prompt", "residentId",
  "stopId", "text", "textAudioKey", "visualSemanticId"
];

function sourceFilesBelow(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return sourceFilesBelow(path);
    return /\.(?:js|jsx|mjs)$/u.test(entry.name) ? [path.replaceAll("\\", "/")] : [];
  });
}

function parseModuleEdges(source) {
  const ast = Parser.extend(jsx()).parse(source, {
    ecmaVersion: "latest", sourceType: "module", allowHashBang: true
  });
  const edges = [];
  const visit = node => {
    if (!node || typeof node !== "object") return;
    if (node.type === "ImportDeclaration") {
      edges.push({
        kind: "static_import",
        literal: true,
        specifier: node.source.value,
        named: node.specifiers.filter(item => item.type === "ImportSpecifier")
          .map(item => item.imported.name || item.imported.value),
        defaultName: node.specifiers.find(item => item.type === "ImportDefaultSpecifier")?.local.name || null,
        namespaceName: node.specifiers.find(item => item.type === "ImportNamespaceSpecifier")?.local.name || null
      });
    } else if ((node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration")
      && node.source) {
      edges.push({
        kind: "re_export", literal: true, specifier: node.source.value,
        named: [], defaultName: null, namespaceName: null
      });
    } else if (node.type === "ImportExpression") {
      const literal = node.source.type === "Literal" && typeof node.source.value === "string";
      edges.push({
        kind: "dynamic_import", literal,
        specifier: literal ? node.source.value : null,
        named: [], defaultName: null, namespaceName: null
      });
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "parent" || key === "start" || key === "end") continue;
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object" && typeof value.type === "string") visit(value);
    }
  };
  visit(ast);
  return edges;
}

test("forty scenes bijectively join committed story and transfer owners", () => {
  assert.equal(CONNECTED_TEXT_RECORDS.length, 40);
  assert.equal(SOUND_SEEKERS_CONNECTED_TEXT.length, 40);
  const stories = getContentDeckCatalog("stories");
  const transfers = getContentDeckCatalog("transfer");
  assert.equal(new Set(CONNECTED_TEXT_RECORDS.map(scene => scene.storyRef.recordId)).size, 40);
  assert.equal(new Set(CONNECTED_TEXT_RECORDS.map(scene => scene.transferRef.recordId)).size, 40);
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    const scene = getConnectedText(expedition.connectedTextId);
    const transfer = expedition.phases.find(phase => phase.id === `${expedition.stopId}-transfer`);
    const storyRecord = stories.find(record => record.recordId === `story:${scene.id}`);
    const transferRecord = transfers.find(record => record.recordId === `transfer:${scene.stopId}`);
    assert.ok(storyRecord);
    assert.ok(transferRecord);
    assert.equal(scene.stopId, expedition.stopId);
    assert.equal(scene.chapterId, expedition.chapterId);
    assert.equal(scene.residentId, expedition.residentId);
    assert.equal(scene.storyRef.slotId, expedition.contentDeckSlotIds.stories[0]);
    assert.equal(scene.storyRef.contentId, scene.id);
    assert.equal(scene.transferRef.slotId, expedition.contentDeckSlotIds.transfer[0]);
    assert.deepEqual({
      actionId: scene.transferRef.actionId,
      configurationId: scene.transferRef.configurationId,
      contextId: scene.transferRef.contextId,
      connectedTextId: scene.transferRef.connectedTextId,
      instructionId: scene.transferRef.instructionId,
      powerId: scene.transferRef.powerId,
      expectedAction: scene.transferRef.expectedAction,
      recordsDomain: scene.transferRef.recordsDomain
    }, {
      actionId: transfer.id,
      configurationId: transfer.configurationId,
      contextId: transfer.contextId,
      connectedTextId: transfer.connectedTextId,
      instructionId: transfer.instructionId,
      powerId: transfer.powerId,
      expectedAction: transfer.expectedAction,
      recordsDomain: transfer.recordsDomain
    });
    assert.equal(storyRecord.contentId, scene.id);
    assert.equal(transferRecord.connectedTextId, scene.id);
    assert.equal(scene.problemId, expedition.arrival.problemId);
    assert.equal(scene.consequencePreviewId, expedition.arrival.consequencePreviewId);
    assert.equal(scene.repairId, expedition.payoff.repairId);
    assert.equal(scene.relationshipBeatId, expedition.payoff.relationshipBeatId);
    assert.equal(scene.consequenceId, expedition.payoff.consequenceId);
    assert.deepEqual(validateSceneAtStop(scene, scene.stopId), []);
  }
});

test("assessed and narrative choices have one child-safe shape and private keys", () => {
  const assessed = SOUND_SEEKERS_CONNECTED_TEXT.filter(scene => scene.choice.kind === "assessed_connected_text");
  const narrative = SOUND_SEEKERS_CONNECTED_TEXT.filter(scene => scene.choice.kind === "narrative_bridge");
  assert.equal(assessed.length, 32);
  assert.equal(narrative.length, 8);
  assert.deepEqual(narrative.map(scene => scene.stopId), ["s5", "s10", "s15", "s20", "s25", "s30", "s35", "s40"]);
  assert.equal(SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES.length, 16);
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    const count = scene.choice.kind === "assessed_connected_text" ? 3 : 2;
    assert.equal(scene.choice.options.length, count);
    assert.equal(new Set(scene.choice.options.map(option => option.token)).size, count);
    assert.equal(new Set(scene.choice.options.map(option => option.visualSemanticId)).size, count);
    for (const option of scene.choice.options) assert.deepEqual(Object.keys(option), optionKeys);
    const childA = toChildConnectedTextScene(scene.id, "route-a");
    const childARepeat = toChildConnectedTextScene(scene.id, "route-a");
    assert.deepEqual(Object.keys(childA).sort(), childKeys);
    assert.deepEqual(childA, childARepeat);
    assert.equal(childA.preChoiceSemanticId, getSceneVisualSemantics(scene.id).preChoiceSemanticId);
    assert.deepEqual(childA.choice.options.map(option => option.token).sort(),
      scene.choice.options.map(option => option.token).sort());
    assert.doesNotMatch(JSON.stringify(childA), /expectedToken|answerKey|rationale|misconception|correctionByToken|storyOutcomeId|postDecisionSemanticId/u);
    if (scene.choice.kind === "assessed_connected_text") {
      const evaluator = CONNECTED_TEXT_EVALUATORS[scene.id];
      const tokens = scene.choice.options.map(option => option.token).sort();
      const misses = tokens.filter(token => token !== evaluator.expectedToken);
      assert.deepEqual(Object.keys(evaluator).sort(), [
        "correctionByToken", "evidence", "expectedToken", "forbiddenPromptTokens",
        "misconceptionByToken", "rationaleByToken"
      ]);
      assert.deepEqual(Object.keys(evaluator.misconceptionByToken).sort(), misses);
      assert.deepEqual(Object.keys(evaluator.correctionByToken).sort(), misses);
      assert.deepEqual(Object.keys(evaluator.rationaleByToken).sort(), tokens);
      assert.equal(evaluateConnectedTextDecision(scene.id, evaluator.expectedToken).correct, true);
      assert.equal(evaluateConnectedTextDecision(scene.id, misses[0]).correct, false);
      assert.throws(() => evaluateConnectedTextDecision(scene.id, "not-an-option"));
      assert.deepEqual(scene.narrativeBranches, []);
    } else {
      assert.equal(CONNECTED_TEXT_EVALUATORS[scene.id], undefined);
      assert.equal(scene.narrativeBranches.length, 2);
      for (const branch of scene.narrativeBranches) {
        assert.deepEqual(Object.keys(branch), ["token", "storyOutcomeId", "postDecisionSemanticId"]);
        assert.equal(resolveNarrativeBranchOutcome(scene.id, branch.token).storyOutcomeId, branch.storyOutcomeId);
      }
      assert.equal(new Set(scene.narrativeBranches.map(branch => branch.storyOutcomeId)).size, 2);
      assert.equal(new Set(scene.narrativeBranches.map(branch => branch.postDecisionSemanticId)).size, 2);
    }
  }
});

test("tokenization, readability bands, and canonical Task 2 challenges stay exact", () => {
  assert.deepEqual(tokenizeConnectedText("A mat. A mat!"), ["a", "mat", "a", "mat"]);
  assert.deepEqual(tokenizeConnectedText("We’re HERE."), ["we're", "here"]);
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    assert.equal(scene.level, readabilityBandForStop(Number(scene.stopId.slice(1))).level);
    assert.equal(scene.tokenIds.length, tokenizeConnectedText(scene.text).length);
    assert.equal(scene.prompt.text.trim().split(/\s+/u).length <= 10, true);
    assert.equal(/[.!?]$/u.test(scene.prompt.text), true);
    const begun = beginStoryTransferTransaction(createSoundSeekersState(), {
      stopId: scene.stopId,
      journeyStep: Number(scene.stopId.slice(1)),
      seed: Number(scene.stopId.slice(1))
    });
    const token = scene.choice.kind === "narrative_bridge" ? scene.choice.options[0].token : null;
    const pending = checkpointStoryTransferTransaction(begun.nextState, {
      transactionId: begun.transaction.transactionId,
      narrativeChoiceToken: token
    });
    const challenge = createConnectedTextChallenge(pending, {
      transactionId: begun.transaction.transactionId,
      routeSeed: "joined-route"
    });
    if (scene.choice.kind === "narrative_bridge") {
      assert.equal(challenge, null);
    } else {
      assert.strictEqual(challenge, materializeStoryTransferChallenge(pending, {
        transactionId: begun.transaction.transactionId
      }));
      assert.equal(challenge.connectedTextId, scene.id);
      assert.equal(Object.hasOwn(challenge, "wordId"), false);
      assert.equal(Object.hasOwn(challenge, "position"), false);
      assert.equal(Object.hasOwn(challenge, "bossTransferId"), false);
      assert.equal(Object.hasOwn(challenge, "activityType"), false);
    }
  }
});

test("split visual semantics remain answer-neutral before choice and complete after decision", () => {
  assert.equal(Object.isFrozen(SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY), true);
  assert.equal(SOUND_SEEKERS_SCENE_VISUAL_SEMANTICS.length, 40);
  assert.equal(SOUND_SEEKERS_PRE_CHOICE_VISUAL_SEMANTICS.length, 40);
  assert.equal(SOUND_SEEKERS_OPTION_VISUAL_SEMANTICS.length, 112);
  assert.equal(SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS.length, 48);
  assert.equal(SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES.length, 16);
  assert.equal(SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS.length, 46);
  assert.equal(SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY.length, 286);
  assert.equal(new Set(SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY.map(record => record.id)).size, 286);
  for (const record of SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY) {
    assert.strictEqual(resolveSceneVisualSemantic(record.id), record);
  }
  assert.deepEqual(
    SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS.map(({ id, wordId }) => ({ id, wordId }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    MEANING_SUPPORT_RECORDS.map(({ visualSemanticId: id, wordId }) => ({ id, wordId }))
      .sort((left, right) => left.id.localeCompare(right.id))
  );
  const completeMeaningIds = SOUND_SEEKERS_MEANING_SUPPORT
    .map(record => record.visualSemanticId).sort();
  assert.deepEqual([...new Set(SOUND_SEEKERS_POST_DECISION_VISUAL_SEMANTICS
    .flatMap(record => record.meaningSemanticIds))].sort(), completeMeaningIds);
  assert.deepEqual(SOUND_SEEKERS_MEANING_VISUAL_OWNERS.map(owner => owner.meaningSemanticId).sort(),
    completeMeaningIds);

  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    const visual = getSceneVisualSemantics(scene.id);
    const pre = resolveSceneVisualSemantic(visual.preChoiceSemanticId);
    const options = visual.optionSemanticIds.map(resolveSceneVisualSemantic);
    const posts = visual.postDecisionSemanticIds.map(resolveSceneVisualSemantic);
    assert.equal(pre.answerNeutral, true);
    assert.equal(new Set(options.map(record => record.frameSemanticId)).size, 1);
    assert.equal(options.every(record => record.salienceTier === "equal_choice"), true);
    assert.deepEqual(visual.optionSemanticIds,
      scene.choice.options.map(option => option.visualSemanticId));
    assert.equal(posts.length, scene.choice.kind === "narrative_bridge" ? 2 : 1);
    const neutralIds = new Set([
      pre.settingId, ...pre.characterIds, ...pre.neutralPropIds, pre.neutralStateId
    ]);
    const postChoiceIds = new Set([
      ...options.flatMap(record => [...record.propSemanticIds, record.actionSemanticId]),
      ...posts.flatMap(record => [
        record.actionStateId,
        record.resolvedStateId,
        record.consequenceId,
        ...record.meaningSemanticIds
      ])
    ]);
    assert.deepEqual([...neutralIds].filter(id => postChoiceIds.has(id)), []);
    if (scene.choice.kind === "narrative_bridge") {
      assert.deepEqual(posts.map(record => record.storyOutcomeId),
        scene.narrativeBranches.map(branch => branch.storyOutcomeId));
      assert.equal(new Set(posts.map(record => record.actionStateId)).size, 2);
      assert.equal(new Set(posts.map(record => record.resolvedStateId)).size, 2);
    }
  }
  const registryText = JSON.stringify(SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY);
  assert.doesNotMatch(registryText,
    /"(?:answerIndex|answerKey|correct|correctness|correction|expectedToken|feedback|isCorrect|isKey|keyIndex|misconception|rationale|score)"\s*:/u);
  assert.doesNotMatch(registryText, /(?:\.png|\.webp|\.svg|\/public\/|className|rendererKind)/iu);
});

test("the production graph keeps one narrow connected-text boundary", () => {
  const files = ["src", "preview"].flatMap(sourceFilesBelow);
  const boundaryModules = new Set([
    "connectedTextRecords.js", "connectedTextAnswerKeys.js", "connectedText.js",
    "connectedTextPresentation.js"
  ]);
  const permitted = new Map([
    ["src/features/soundSeekers/content/connectedText.js", new Map([
      ["./connectedTextRecords.js", ["CONNECTED_TEXT_RECORDS"]],
      ["./connectedTextAnswerKeys.js", ["CONNECTED_TEXT_DECISION_FEEDBACK"]]
    ])],
    ["src/features/soundSeekers/content/sceneVisualSemantics.js", new Map([
      ["./connectedTextRecords.js", ["CONNECTED_TEXT_RECORDS"]]
    ])],
    ["src/features/soundSeekers/engine/connectedTextPresentation.js", new Map([
      ["../content/connectedText.js", ["evaluateConnectedTextDecision", "getConnectedText"]]
    ])]
  ]);
  for (const path of files) {
    for (const edge of parseModuleEdges(readFileSync(path, "utf8"))) {
      if (edge.kind === "dynamic_import" && (!edge.literal
        || boundaryModules.has(edge.specifier?.split("/").at(-1)))) {
        assert.fail(`${path} has a forbidden connected-text dynamic import`);
      }
      if (!edge.literal || !boundaryModules.has(edge.specifier.split("/").at(-1))) continue;
      assert.equal(edge.kind, "static_import", `${path} may not re-export ${edge.specifier}`);
      const expected = permitted.get(path)?.get(edge.specifier);
      assert.ok(expected, `${path} may not import ${edge.specifier}`);
      assert.deepEqual([...edge.named].sort(), [...expected].sort());
      assert.equal(edge.defaultName, null);
      assert.equal(edge.namespaceName, null);
    }
  }
  const transitionLiteral = 'kind: "connected_text_presentation_transition"';
  assert.deepEqual(files.filter(path => readFileSync(path, "utf8").includes(transitionLiteral)),
    ["src/features/soundSeekers/engine/connectedTextPresentation.js"]);
});
