import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Parser } from "acorn";
import jsx from "acorn-jsx";

import {
  CONNECTED_TEXT_RECORDS
} from "../../src/features/soundSeekers/content/connectedTextRecords.js";
import {
  CONNECTED_TEXT_DECISION_FEEDBACK
} from "../../src/features/soundSeekers/content/connectedTextAnswerKeys.js";
import {
  CONNECTED_TEXT_EVALUATORS,
  SOUND_SEEKERS_CONNECTED_TEXT,
  createConnectedTextChallenge,
  evaluateConnectedTextDecision,
  getConnectedText,
  isConnectedTextChildScene,
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
import { SOUND_SEEKERS_CHAPTERS } from "../../src/features/soundSeekers/content/chapters/index.js";
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

const freezeCausalContracts = contracts => Object.freeze(Object.fromEntries(
  Object.entries(contracts).map(([stopId, contract]) => [stopId, Object.freeze(contract)])
));

const EXPECTED_CAUSAL_CONTRACTS = freezeCausalContracts({
  s1: ["Lift mat; see light.", "What uncovers Moss's seed light?", "Lift mat.", "lifting the mat uncovers the light"],
  s2: ["Fit fin; sit at mat.", "What mends Tumble's fern step?", "Fit fin.", "fitting the missing fin mends the step"],
  s3: ["Hit the hot rock drum.", "What starts Bramble's wind-stone drum?", "Hit hot rock.", "hitting the rock drum starts the wind stones"],
  s4: ["Not bun; rock in gap.", "What fills Tumble's ford gap?", "Rock in gap.", "fitting the rock fills the ford gap"],
  s6: ["Get the buzz box home.", "How can Fizz guide the bluff bees home?", "Get box home.", "moving the buzzing box takes the bees home"],
  s7: ["Get jam off the bell.", "What frees Quill's ferry brake bell?", "Get jam off bell.", "removing the jam frees the ferry bell"],
  s8: ["Not mat; cut the net.", "What clears Rill's fishpool channel?", "Cut net.", "cutting the net removes the channel block"],
  s9: ["Fix the ship fin; it can spin.", "What turns Fizz's water wheel?", "Fix ship fin.", "fitting the ship fin lets the wheel spin"],
  s11: ["Pick the rock off the path.", "What reveals Rook's amber path?", "Pick rock off path.", "picking the rock off reveals the path"],
  s12: ["Fit lamp in lift with hand.", "What mends Amber's loose lift part?", "Fit lamp in lift.", "fitting the loose lift part restarts it"],
  s13: ["Spin the fan; it can clear the path.", "What blows Claw's ash off the trail?", "Spin fan.", "spinning the fan uncovers the path"],
  s14: ["Clap at the flag; the path can grow.", "What grows Rook's fern bridge?", "Clap at flag.", "clapping activates the magic flag that grows the path"],
  s16: ["Click lock by gate; it can lift.", "Which action opens Bolt's lane?", "Click lock.", "clicking the lock opens the gearworks lane"],
  s17: ["Big rock is in the bin. Lift the rock off.", "What clears Soot's hopper bin?", "Lift rock off.", "lifting the rock out clears the hopper"],
  s18: ["Cake is hot, but the flame is not hot. Make the flame hot.", "What relights Bellows's foundry?", "Make flame hot.", "heating the flame relights the foundry"],
  s19: ["The bike is on the train path. Slide the bike off.", "What clears Bolt's night-train track?", "Slide bike off.", "sliding the bike off clears the train path"],
  s21: ["The big cube can stop the ship. Fit the rope on the cube.", "What anchors Ripple's drifting ferry?", "Rope on cube.", "fastening the rope to the cube anchors the ship"],
  s22: ["Rain is the theme. Pick rain to start it.", "Which sign starts Mica's clear-water pump?", "Pick rain.", "choosing the rain sign starts the water"],
  s23: ["Lift the rain tray. It can lift the path.", "What raises Glint's hidden steps?", "Lift rain tray.", "lifting the roped rain tray raises the path"],
  s24: ["The tree can sing. Clap with tree; the path can sing.", "What tunes Ripple's causeway song?", "Clap with tree.", "clapping with the tree tunes the causeway"],
  s26: ["Show coat on the right road. The boat can go that way.", "Which marker keeps Kelp's boat on course?", "Show coat on road.", "showing the coat marks the right road"],
  s27: ["Snow is in the room. Glue on the blue moon coat to stop it.", "What covers Boom's shelter?", "Glue blue moon coat.", "gluing the moon coat blocks the snow"],
  s28: ["The book is the light plan. Hook light high so boat can go.", "How can Prism relight the harbour signal?", "Hook light high.", "hooking the planned light high restores the signal"],
  s29: ["The loud sound is in the box. The lid is off. Close the lid on the box.", "What makes Kelp's stormglass box calm?", "Close lid on box.", "closing the box lid contains the loud sound"],
  s31: ["The star can lift the gate. Park the car on the star.", "What opens Luma's mothlight gate?", "Park car on star.", "parking on the gate pad lifts the gate"],
  s32: ["The storm hit the tree. The light is off. Draw a star on the tree; the light can turn on.", "What wakes Wisp's echo-root light?", "Draw star on tree.", "drawing the star turns on the root light"],
  s33: ["The bird can turn by the fern. The girl can look at it. Draw the turn on the path so the girl can look.", "What completes Orbit's living map?", "Draw turn on path.", "drawing the observed turn records the route"],
  s34: ["The chair is by one ring. The stair is by the last ring. Pair the chair with the stair.", "Which markers line up Luma's hollow rings?", "Pair chair with stair.", "pairing the two markers aligns the rings"],
  s36: ["The creature is here. Pure light can lift the dark stair. Make the stair bright with pure light so the path is secure.", "What raises Comet's faded stair?", "Make stair bright.", "bright pure light lifts the stair"],
  s37: ["Magic words from the city are ready. The lock is dark. Read the magic words at the lock so it can click.", "What opens Aster's archive?", "Read magic words.", "reading the magic words opens the lock"],
  s38: ["The cats jumped up. The dogs landed by the stars. Join the star path so the cats can step on it.", "What joins Dawn's divided path?", "Join star path.", "joining the star path gives the cats a crossing"],
  s39: ["The bridge is not complete. The little puzzle can fit in its gap. Fit the little puzzle in the gap.", "What completes Comet's skybridge?", "Fit little puzzle in gap.", "fitting the puzzle tile fills the bridge gap"]
});

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
  const recordsSource = readFileSync(
    "src/features/soundSeekers/content/connectedTextRecords.js", "utf8"
  );
  const bossLiteralKeys = [...recordsSource.matchAll(/^ {2}(\d+): \{ wordId:/gmu)]
    .map(match => Number(match[1]));
  assert.deepEqual(bossLiteralKeys, [5, 10, 15, 20, 25, 30, 35, 40]);
  assert.equal(new Set(bossLiteralKeys).size, bossLiteralKeys.length);
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
    assert.equal(isConnectedTextChildScene(childA), true);
    assert.equal(isConnectedTextChildScene(childARepeat), true);
    assert.equal(isConnectedTextChildScene(Object.freeze({ ...childA })), false);
    assert.equal(isConnectedTextChildScene(structuredClone(childA)), false);
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

test("every assessed decision is explicitly scene-grounded without a wording answer cue", () => {
  const assessed = SOUND_SEEKERS_CONNECTED_TEXT
    .filter(scene => scene.choice.kind === "assessed_connected_text");
  const firstCorrectWords = new Map();
  const normalize = value => tokenizeConnectedText(value)
    .filter(word => !["a", "the", "it", "can", "we", "is"].includes(word));
  const containsOrdered = (haystack, needle) => {
    let cursor = 0;
    for (const word of haystack) if (word === needle[cursor]) cursor += 1;
    return cursor === needle.length;
  };
  const containsContiguous = (haystack, needle) => haystack.join(" ")
    .includes(needle.join(" "));
  for (const scene of assessed) {
    const evaluator = CONNECTED_TEXT_EVALUATORS[scene.id];
    const correct = scene.choice.options.find(option => option.token === evaluator.expectedToken);
    const distractors = scene.choice.options.filter(option => option.token !== evaluator.expectedToken);
    const running = normalize(scene.text);
    const correctWords = normalize(correct.childLabel);
    assert.equal(containsOrdered(running, correctWords), true,
      `${scene.id}: correct action must follow directly from the text`);
    assert.equal(scene.choice.options.every(option =>
      !/^(?:use|move past|wait by)\b/iu.test(option.childLabel)), true, scene.id);
    assert.equal(new Set(scene.choice.options.map(option => option.childLabel)).size, 3, scene.id);
    for (const distractor of distractors) {
      assert.equal(containsContiguous(running, normalize(distractor.childLabel)), false,
        `${scene.id}: distractor must be contradicted or unsupported by the text`);
      assert.match(evaluator.misconceptionByToken[distractor.token], /\s/u);
      assert.match(evaluator.correctionByToken[distractor.token], /\s/u);
    }
    const firstWord = correctWords[0];
    firstCorrectWords.set(firstWord, (firstCorrectWords.get(firstWord) || 0) + 1);
  }
  assert.equal(firstCorrectWords.size >= 18, true);
  assert.equal(Math.max(...firstCorrectWords.values()) <= 3, true);
});

test("assessed option accessible names stay peer-neutral before the decision", () => {
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT
    .filter(item => item.choice.kind === "assessed_connected_text")) {
    const evaluator = CONNECTED_TEXT_EVALUATORS[scene.id];
    const keyOnlyExpansions = scene.choice.options.filter(option => (
      option.accessibleLabel !== option.childLabel
      && option.token === evaluator.expectedToken
    ));
    assert.deepEqual(keyOnlyExpansions, [],
      `${scene.id}: the correct option must not receive a richer pre-choice accessible name`);
    for (const option of scene.choice.options) {
      assert.equal(option.accessibleLabel, option.childLabel,
        `${scene.id}:${option.token} must use the same concise peer name in visible and accessible copy`);
    }
  }
});

test("all thirty-two assessed scenes obey the frozen causal mission contract", () => {
  assert.equal(Object.isFrozen(EXPECTED_CAUSAL_CONTRACTS), true);
  assert.equal(Object.values(EXPECTED_CAUSAL_CONTRACTS).every(Object.isFrozen), true);
  for (const [stopId, [text, prompt, correctLabel, because]] of
    Object.entries(EXPECTED_CAUSAL_CONTRACTS)) {
    const scene = SOUND_SEEKERS_CONNECTED_TEXT.find(item => item.stopId === stopId);
    const evaluator = CONNECTED_TEXT_EVALUATORS[scene.id];
    const correct = scene.choice.options.find(option => option.token === evaluator.expectedToken);
    assert.equal(scene.text, text, `${stopId}: running text drifted from causal contract`);
    assert.equal(scene.prompt.text, prompt, `${stopId}: mission prompt drifted from causal contract`);
    assert.equal(correct.childLabel, correctLabel, `${stopId}: action drifted from causal contract`);
    assert.equal(because.length > 20, true, `${stopId}: causal mechanism must be explicit`);
  }
  assert.equal(createHash("sha256")
    .update(JSON.stringify(CONNECTED_TEXT_DECISION_FEEDBACK)).digest("hex"),
  "2bf8d2583da1d5c07aabc0741b7f280e4eb81c7cc13df44e2bbb58700d8de936");
  const stem = word => word.slice(0, Math.min(word.length, 4));
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT
    .filter(item => item.choice.kind === "assessed_connected_text")) {
    const evaluator = CONNECTED_TEXT_EVALUATORS[scene.id];
    const correct = scene.choice.options.find(option => option.token === evaluator.expectedToken);
    const correctStems = tokenizeConnectedText(correct.childLabel)
      .filter(word => word.length >= 3).map(stem);
    for (const distractor of scene.choice.options.filter(option => option !== correct)) {
      const distractorStems = tokenizeConnectedText(distractor.childLabel)
        .filter(word => word.length >= 3).map(stem);
      const misconception = evaluator.misconceptionByToken[distractor.token].toLowerCase();
      const correction = evaluator.correctionByToken[distractor.token].toLowerCase();
      assert.equal(distractorStems.some(value => misconception.includes(value)), true,
        `${scene.id}:${distractor.token} misconception must name the selected contrast`);
      assert.equal(correctStems.some(value => correction.includes(value)), true,
        `${scene.id}:${distractor.token} correction must name the causal repair`);
    }
  }
});

test("child-label vocabulary, canonical guides, and direct meaning payoffs fail closed", () => {
  const chapters = new Map(SOUND_SEEKERS_CHAPTERS.map(chapter => [chapter.id, chapter]));
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    assert.deepEqual(scene.preChoiceCharacterIds,
      [chapters.get(scene.chapterId).cast.guide.name, scene.residentId]);
    assert.deepEqual(validateSceneAtStop(scene, scene.stopId), []);
    assert.equal(scene.choice.options.every(option => tokenizeConnectedText(option.childLabel).length <= 6), true);
    const auditedIds = [...new Set(scene.advancedChildLabelAudit.map(entry => entry.tokenId))].sort();
    assert.deepEqual(scene.advancedChildLabelTokenIds, auditedIds);
    assert.equal(scene.advancedChildLabelAuditDecision.status,
      auditedIds.length ? "reviewed" : "reviewed_none_required");

    const forgedCast = { ...scene, preChoiceCharacterIds: [`${scene.chapterId}-guide`, scene.residentId] };
    assert.equal(validateSceneAtStop(forgedCast, scene.stopId)
      .includes("pre-choice cast identity mismatch"), true);

    const forgedMeanings = {
      ...scene,
      postDecisionMeaningWordIds: scene.postDecisionMeaningWordIds.map((ids, index) =>
        index === 0 ? ["fiction"] : ids)
    };
    if (scene.stopId !== "s40") {
      assert.equal(validateSceneAtStop(forgedMeanings, scene.stopId)
        .includes("post-decision meaning is not directly justified"), true);
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
  assert.equal(SOUND_SEEKERS_MEANING_VISUAL_SEMANTICS.length,
    SOUND_SEEKERS_MEANING_SUPPORT.length);
  const expectedRegistryCount = 40 + 40 + 112 + 48 + SOUND_SEEKERS_MEANING_SUPPORT.length;
  assert.equal(SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY.length, expectedRegistryCount);
  assert.equal(new Set(SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY.map(record => record.id)).size,
    expectedRegistryCount);
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
    ])],
    ["src/features/soundSeekers/engine/createChallenge.js", new Map([
      ["../content/connectedText.js", ["createConnectedTextChallenge", "toChildConnectedTextScene"]]
    ])],
    ["src/features/soundSeekers/engine/sceneVisualAccess.js", new Map([
      ["./connectedTextPresentation.js", [
        "isConnectedTextPresentationTransition", "projectConnectedTextPresentationTransition"
      ]]
    ])],
    ["src/features/soundSeekers/engine/missionReducer.js", new Map([
      ["./connectedTextPresentation.js", [
        "beginConnectedTextPresentation", "checkpointConnectedTextPresentation",
        "closeConnectedTextPresentation", "reduceConnectedTextPresentation",
        "rehydrateConnectedTextPresentation"
      ]]
    ])],
    ["src/features/soundSeekers/preview/galleryReplayRecipes.js", new Map([
      ["../content/connectedText.js", ["createConnectedTextChallenge", "toChildConnectedTextScene"]],
      ["../engine/connectedTextPresentation.js", [
        "beginConnectedTextPresentation", "checkpointConnectedTextPresentation",
        "closeConnectedTextPresentation", "reduceConnectedTextPresentation",
        "rehydrateConnectedTextPresentation"
      ]]
    ])],
    ["src/features/soundSeekers/visual/sceneVisualCatalog.js", new Map([
      ["../content/connectedText.js", ["isConnectedTextChildScene"]]
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
