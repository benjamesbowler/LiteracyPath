#!/usr/bin/env node
import { isDeepStrictEqual } from "node:util";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";

import { QUEST_STOPS } from "../src/data/questSequence.js";
import { SOUND_SEEKERS_CHAPTERS } from "../src/features/soundSeekers/content/chapters/index.js";
import {
  SOUND_SEEKERS_EXPEDITIONS,
  SOUND_SEEKERS_INTERACTION_CONTEXTS,
  assertExpeditionContentOwnership,
  assertSoundSeekersInteractionContexts
} from "../src/features/soundSeekers/content/expeditions.js";
import { SOUND_SEEKERS_REVIEW_SOURCE_ID } from "../src/features/soundSeekers/content/reviewSequences.js";
import {
  PRONUNCIATION_CORPUS_CONTENT_HASH,
  PRONUNCIATION_CORPUS_RECORD_COUNT,
  PRONUNCIATION_CORPUS_RECORD_IDS
} from "../src/features/soundSeekers/content/pronunciationCorpusInvariant.generated.js";
import { CONTENT_DECK_CATEGORIES, SOUND_SEEKERS_CONTENT_DECK_CATALOGS } from "../src/features/soundSeekers/content/contentDeckCatalogs.js";
import { CONTENT_DECK_BINDINGS, CONTENT_DECK_PLACEMENTS } from "../src/features/soundSeekers/content/contentDeckBindings.js";
import {
  SOUND_SEEKERS_CONNECTED_TEXT,
  validateSceneAtStop
} from "../src/features/soundSeekers/content/connectedText.js";
import {
  SOUND_SEEKERS_WORDS,
  assertShippingPronunciationLexicon
} from "../src/features/soundSeekers/content/pronunciationLexicon.js";
import {
  SOUND_SEEKERS_MEANING_VISUAL_OWNERS,
  SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES,
  SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY
} from "../src/features/soundSeekers/content/sceneVisualSemantics.js";
import { SOUND_SEEKERS_MEANING_SUPPORT } from "../src/features/soundSeekers/content/meaningSupport.js";
import {
  SOUND_SEEKERS_INSTRUCTIONS,
  getInstructionContract
} from "../src/features/soundSeekers/content/instructionContracts.js";
import {
  SOUND_SEEKERS_BIOME_KITS,
  validateSoundSeekersBiomeKits
} from "../src/features/soundSeekers/content/biomeKits.js";
import {
  SOUND_SEEKERS_LANDMARK_BINDINGS,
  SOUND_SEEKERS_MEANING_VISUALS,
  SOUND_SEEKERS_OPTION_VISUALS,
  SOUND_SEEKERS_ROUTE_SPECS,
  SOUND_SEEKERS_SCENE_RENDER_SPECS,
  validateSoundSeekersVisualCatalogs
} from "../src/features/soundSeekers/visual/sceneVisualCatalog.js";
import {
  SOUND_SEEKERS_CHARACTER_VISUALS,
  SOUND_SEEKERS_PLAYER_VISUAL,
  SOUND_SEEKERS_POSE_IDS
} from "../src/features/soundSeekers/visual/characterCatalog.js";
import { SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS } from "../src/features/soundSeekers/visual/characterCustomization.js";
import {
  beginContentPlacementAttempt,
  beginStoryTransferTransaction,
  checkpointStoryTransferTransaction,
  commitContentPlacementResponse,
  completeStoryTransferTransaction,
  materializeContentPlacementChallenge,
  materializeStoryTransferChallenge
} from "../src/features/soundSeekers/engine/contentDeckTransactions.js";
import { recordContentDeckUse, serveContentDeck } from "../src/features/soundSeekers/engine/contentDeckScheduler.js";
import { coverageStatus, validAttemptReceipts, validContentDeckUses } from "../src/features/soundSeekers/engine/contentCoverage.js";
import { createSoundSeekersState, normalizeSoundSeekersState } from "../src/features/soundSeekers/engine/stateV2.js";
import { createSoundSeekersAudioController } from "../src/features/soundSeekers/runtime/soundSeekersAudioController.js";
import { expectedSoundSeekersSceneAudio, assertSoundSeekersSceneAudio } from "./checkSoundSeekersSceneAudio.mjs";
import {
  assertSoundSeekersV2AssetManifest,
  readSoundSeekersV2AssetManifest
} from "./lib/soundSeekersV2AssetManifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_COVERAGE = Object.freeze({
  complete: true,
  categories: Object.freeze({
    heartWords: Object.freeze({ coveredRecordCount: 60, totalRecordCount: 60 }),
    stories: Object.freeze({ coveredRecordCount: 40, totalRecordCount: 40 }),
    alternatives: Object.freeze({ coveredRecordCount: 4, totalRecordCount: 4 }),
    morphology: Object.freeze({ coveredRecordCount: 1, totalRecordCount: 1 }),
    transfer: Object.freeze({ coveredRecordCount: 40, totalRecordCount: 40 })
  })
});
const EXPECTED_USE_COUNTS = Object.freeze({
  heartWords: 81, stories: 40, alternatives: 4, morphology: 1, transfer: 40
});
const RAW_COLOR = /(?<!&)#(?:[\da-fA-F]{3}|[\da-fA-F]{4}|[\da-fA-F]{6}|[\da-fA-F]{8})\b|\b0x[\da-fA-F]{6}\b/u;
const GALLERY_TARGETS = new Set([
  "preview/sound-seekers-v2-content.html",
  "preview/sound-seekers-v2-content.jsx",
  "src/features/soundSeekers/preview/ContentArtGallery.jsx",
  "src/features/soundSeekers/preview/galleryReplayRecipes.js",
  "src/features/soundSeekers/preview/content-art-gallery.css"
]);
const GALLERY_CONSUMERS = new Set([
  "preview/sound-seekers-v2-content.html",
  "preview/sound-seekers-v2-content.jsx",
  "src/features/soundSeekers/preview/ContentArtGallery.jsx",
  "tests/unit/soundSeekersGalleryReplay.test.js"
]);

function installSynchronousAudioHarness() {
  class SoundSeekersContentGateAudio {
    constructor() {
      this.listeners = new Map();
      this.currentTime = 0;
      this.volume = 1;
      this.src = "";
    }

    addEventListener(type, listener) {
      const listeners = this.listeners.get(type) || [];
      listeners.push(listener);
      this.listeners.set(type, listeners);
    }

    removeEventListener(type, listener) {
      this.listeners.set(type, (this.listeners.get(type) || [])
        .filter(candidate => candidate !== listener));
    }

    load() {}
    pause() {}
    play() {
      const audio = this;
      return {
        then(onStarted) {
          onStarted();
          for (const listener of [...(audio.listeners.get("ended") || [])]) listener();
          return { catch() {} };
        },
        catch() { return this; }
      };
    }
  }
  globalThis.Audio = SoundSeekersContentGateAudio;
}

installSynchronousAudioHarness();

function authorizedAudio(challenge) {
  if (challenge.requiresAudio === false) {
    return { audio: { status: "unavailable" }, audioAuthority: undefined };
  }
  const contract = getInstructionContract(challenge.instructionId);
  const audioAuthority = {
    scopeKey: "sound-seekers-v2-content-gate",
    missionId: `content:${challenge.attemptId}`,
    phaseId: challenge.challengeId,
    attemptId: challenge.attemptId
  };
  const controller = createSoundSeekersAudioController({
    scopeKey: audioAuthority.scopeKey,
    clock: () => 0
  });
  controller.request({
    cueId: `instruction:${contract.instructionId}`,
    audioKey: contract.childAudio,
    visibleText: contract.childText,
    spokenText: contract.childText,
    kind: "instruction",
    requiresAudio: true
  }, audioAuthority);
  return { audio: controller.getSnapshot().delivery, audioAuthority };
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function parseJsonFence(filePath) {
  const fences = [...readFileSync(filePath, "utf8").matchAll(/```json\n([\s\S]+?)\n```/gu)];
  if (fences.length !== 1) throw new Error(`${path.relative(ROOT, filePath)} must contain one JSON fence`);
  return JSON.parse(fences[0][1]);
}

function instructionAudioInventory() {
  const manifest = parseJsonFence(path.join(ROOT, "public/audio/quest-v2/instructions/SOURCE.md"));
  return manifest.assets;
}

function sceneAudioInventory() {
  return parseJsonFence(path.join(ROOT, "public/audio/quest-v2/SOURCE.md")).assets;
}

export function buildSoundSeekersV2CanonicalCoverageFixture() {
  let state = createSoundSeekersState();
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) {
    for (const opportunity of expedition.heartWordOpportunities) {
      const binding = opportunity.contentBinding;
      const served = serveContentDeck(state.contentDecks, {
        binding,
        visitId: `task6:${binding.visitOwnerId}`,
        stopId: expedition.stopId,
        journeyStep: expedition.stopIndex,
        seed: expedition.stopIndex
      });
      state = { ...state, contentDecks: recordContentDeckUse(served.nextState, served, binding) };
      if (opportunity.id === "s6-heart-1") {
        const shared = expedition.phases.find(phase => phase.id === "s6-primary").contentBinding;
        state = { ...state, contentDecks: recordContentDeckUse(state.contentDecks, served, shared) };
      }
    }
    const begun = beginStoryTransferTransaction(state, {
      stopId: expedition.stopId,
      journeyStep: expedition.stopIndex,
      seed: expedition.stopIndex
    });
    const transactionId = begun.transaction.transactionId;
    state = checkpointStoryTransferTransaction(begun.nextState, {
      transactionId,
      narrativeChoiceToken: expedition.transfer.boss ? `narrative-${expedition.stopId}` : null
    });
    const challenge = materializeStoryTransferChallenge(state, { transactionId });
    state = completeStoryTransferTransaction(state, {
      transactionId,
      challenge,
      response: { kind: "literacy-answer", token: challenge.expectedToken },
      ...authorizedAudio(challenge),
      at: `2026-09-02T04:${String(expedition.stopIndex).padStart(2, "0")}:00.000Z`,
      sessionDay: "2026-09-02"
    }).nextState;
  }
  for (const placement of CONTENT_DECK_PLACEMENTS) {
    const expedition = SOUND_SEEKERS_EXPEDITIONS.find(item => item.stopId === placement.stopId);
    const served = serveContentDeck(state.contentDecks, {
      binding: placement.contentBinding,
      visitId: `task6:${placement.placementId}`,
      stopId: placement.stopId,
      journeyStep: expedition.stopIndex,
      seed: expedition.stopIndex
    });
    state = { ...state, contentDecks: served.nextState };
    state = beginContentPlacementAttempt(state, {
      placementId: placement.placementId,
      visitId: served.visitId
    }).nextState;
    let completed = false;
    while (!completed) {
      const challenge = materializeContentPlacementChallenge(state, {
        placementId: placement.placementId,
        visitId: served.visitId
      });
      const response = placement.category === "morphology"
        ? { challengeId: challenge.challengeId, kind: "non-recording-complete", action: "introduce_word_ending" }
        : { kind: "literacy-answer", token: challenge.expectedToken };
      const result = commitContentPlacementResponse(state, {
        placementId: placement.placementId,
        visitId: served.visitId,
        challenge,
        response,
        ...authorizedAudio(challenge),
        at: `2026-09-02T05:${String(challenge.targetOrdinal || 0).padStart(2, "0")}:00.000Z`,
        sessionDay: "2026-09-02"
      });
      state = result.nextState;
      completed = result.completed;
    }
  }
  const normalized = normalizeSoundSeekersState(state);
  return deepFreeze({
    state: normalized,
    evidenceEvents: [...normalized.evidence],
    attemptReceipts: validAttemptReceipts(normalized).map(receipt => structuredClone(receipt))
  });
}

export function summarizeSoundSeekersV2Coverage(state) {
  if (!state?.contentDecks
    || !isDeepStrictEqual(Object.keys(state.contentDecks), CONTENT_DECK_CATEGORIES)) {
    throw new Error("Sound Seekers v2 canonical fixture must contain exactly all five content decks");
  }
  const canonicalCoverage = coverageStatus(state);
  if (!isDeepStrictEqual(canonicalCoverage, EXPECTED_COVERAGE)) {
    throw new Error("Sound Seekers v2 canonical coverage is incomplete or drifted");
  }
  const attemptReceipts = validAttemptReceipts(state);
  const validUseCounts = Object.fromEntries(CONTENT_DECK_CATEGORIES.map(category => [
    category, validContentDeckUses(state, category).length
  ]));
  const recordedUseCounts = Object.fromEntries(CONTENT_DECK_CATEGORIES.map(category => [
    category, Object.keys(state.contentDecks?.[category]?.uses || {}).length
  ]));
  if (!isDeepStrictEqual(validUseCounts, EXPECTED_USE_COUNTS)) {
    throw new Error("Sound Seekers v2 valid content-use totals drifted");
  }
  if (!isDeepStrictEqual(recordedUseCounts, EXPECTED_USE_COUNTS)) {
    throw new Error("Sound Seekers v2 recorded content-use totals contain missing or unauthorised records");
  }
  const assessedDecisionCounts = {
    connectedTextTransfer: state.evidence.filter(event => event.domain === "connected_text_transfer" && event.correct).length,
    novelDecoding: state.evidence.filter(event => event.domain === "novel_decoding" && event.correct).length
  };
  if (!isDeepStrictEqual(assessedDecisionCounts, { connectedTextTransfer: 32, novelDecoding: 8 })) {
    throw new Error("Sound Seekers v2 final assessed-event split drifted");
  }
  if (attemptReceipts.length !== Object.keys(state.attemptReceipts).length) {
    throw new Error("Sound Seekers v2 canonical fixture contains an invalid receipt");
  }
  const claimedEvidenceIds = attemptReceipts.flatMap(receipt => receipt.eventIds).sort();
  const recordedEvidenceIds = state.evidence.map(event => event.id).sort();
  if (!isDeepStrictEqual(recordedEvidenceIds, claimedEvidenceIds)) {
    throw new Error("Sound Seekers v2 canonical fixture contains missing or unauthorised evidence");
  }
  return deepFreeze({ canonicalCoverage, validUseCounts, assessedDecisionCounts });
}

export function buildSoundSeekersV2AuthoritySnapshot() {
  const fixture = buildSoundSeekersV2CanonicalCoverageFixture();
  const coverageSummary = summarizeSoundSeekersV2Coverage(fixture.state);
  return deepFreeze({
    questStops: QUEST_STOPS,
    chapters: SOUND_SEEKERS_CHAPTERS,
    expeditions: SOUND_SEEKERS_EXPEDITIONS,
    reviewSourceId: SOUND_SEEKERS_REVIEW_SOURCE_ID,
    pronunciationInvariant: {
      recordIds: PRONUNCIATION_CORPUS_RECORD_IDS,
      recordCount: PRONUNCIATION_CORPUS_RECORD_COUNT,
      contentHash: PRONUNCIATION_CORPUS_CONTENT_HASH
    },
    contentDeckCategories: CONTENT_DECK_CATEGORIES,
    contentDeckCatalogs: SOUND_SEEKERS_CONTENT_DECK_CATALOGS,
    contentDeckBindings: CONTENT_DECK_BINDINGS,
    contentDeckPlacements: CONTENT_DECK_PLACEMENTS,
    coverageSummary,
    attemptReceiptSummary: {
      count: fixture.attemptReceipts.length,
      ids: fixture.attemptReceipts.map(receipt => receipt.attemptId)
    },
    connectedTextScenes: SOUND_SEEKERS_CONNECTED_TEXT,
    sceneVisualSemantics: SOUND_SEEKERS_VISUAL_SEMANTIC_REGISTRY,
    narrativeBranchOutcomes: SOUND_SEEKERS_NARRATIVE_BRANCH_OUTCOMES,
    meaningSupport: SOUND_SEEKERS_MEANING_SUPPORT,
    meaningVisualOwners: SOUND_SEEKERS_MEANING_VISUAL_OWNERS,
    instructionAudioInventory: instructionAudioInventory(),
    sceneAudioInventory: sceneAudioInventory(),
    biomeKits: SOUND_SEEKERS_BIOME_KITS,
    sceneRenderSpecs: SOUND_SEEKERS_SCENE_RENDER_SPECS,
    optionVisuals: SOUND_SEEKERS_OPTION_VISUALS,
    meaningVisuals: SOUND_SEEKERS_MEANING_VISUALS,
    routeSpecs: SOUND_SEEKERS_ROUTE_SPECS,
    landmarkBindings: SOUND_SEEKERS_LANDMARK_BINDINGS,
    characterVisuals: SOUND_SEEKERS_CHARACTER_VISUALS,
    playerVisual: SOUND_SEEKERS_PLAYER_VISUAL,
    creatorOptions: SOUND_SEEKERS_CHARACTER_CREATOR_OPTIONS,
    poseIds: SOUND_SEEKERS_POSE_IDS,
    assetManifest: readSoundSeekersV2AssetManifest()
  });
}

export function validateSoundSeekersV2ContentAuthorities(authorities) {
  if (!authorities || typeof authorities !== "object") throw new TypeError("complete authorities are required");
  const canonical = buildSoundSeekersV2AuthoritySnapshot();
  const contentKeys = Object.keys(canonical).slice(0, 18);
  const actual = Object.fromEntries(contentKeys.map(key => [key, authorities[key]]));
  const expected = Object.fromEntries(contentKeys.map(key => [key, canonical[key]]));
  if (!isDeepStrictEqual(actual, expected)) throw new Error("Sound Seekers v2 content authority drift");
  return true;
}

function repositorySourceFiles(directory = ROOT) {
  const ignored = new Set([".git", "node_modules", ".artifacts", "dist", "dist-quest-offline", "coverage", "test-results", "playwright-report"]);
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory() && ignored.has(entry.name)) return [];
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return repositorySourceFiles(fullPath);
    return /\.(?:js|jsx|mjs|ts|tsx|html|css)$/u.test(entry.name) ? [fullPath] : [];
  });
}

let cachedRepositorySources = null;
let cachedRepositoryEdges = null;

function repositorySources() {
  if (!cachedRepositorySources) {
    cachedRepositorySources = new Map(repositorySourceFiles().map(filePath => {
      const relativePath = normalizePath(path.relative(ROOT, filePath));
      return [relativePath, readFileSync(filePath, "utf8")];
    }));
  }
  return cachedRepositorySources;
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

function decodeHtmlCharacterReferences(value) {
  const named = new Map([
    ["amp", "&"], ["apos", "'"], ["colon", ":"], ["gt", ">"], ["hyphen", "-"],
    ["lowbar", "_"], ["lt", "<"], ["period", "."], ["quot", "\""], ["sol", "/"]
  ]);
  return value.replace(/&(?:#x([\da-f]+);?|#(\d+);?|([a-z][\da-z]+);)/giu, (match, hex, decimal, name) => {
    if (hex || decimal) {
      const codePoint = Number.parseInt(hex || decimal, hex ? 16 : 10);
      try { return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : "\ufffd"; } catch { return "\ufffd"; }
    }
    return named.get(name.toLocaleLowerCase("en-US")) ?? match;
  });
}

function decodeCssEscapes(value) {
  return value.replace(/\\(?:([\da-f]{1,6})(?:\r\n|[\t\n\f\r ])?|\r\n|[\n\f\r]|(.))/giu, (match, hex, escaped) => {
    if (hex) {
      const codePoint = Number.parseInt(hex, 16);
      try { return codePoint > 0 && codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : "\ufffd"; } catch { return "\ufffd"; }
    }
    return escaped ?? "";
  });
}

function normalizeBrowserReference(value) {
  let normalized = value;
  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(normalized);
      if (decoded === normalized) break;
      normalized = decoded;
    } catch {
      break;
    }
  }
  return normalized;
}

function htmlStartTags(source) {
  const tags = [];
  for (let start = 0; start < source.length;) {
    start = source.indexOf("<", start);
    if (start < 0) break;
    if (source.startsWith("<!--", start)) {
      const commentEnd = source.indexOf("-->", start + 4);
      start = commentEnd < 0 ? source.length : commentEnd + 3;
      continue;
    }
    if (!/[a-z]/iu.test(source[start + 1] || "")) {
      start += 1;
      continue;
    }
    let quote = null;
    let end = start + 2;
    for (; end < source.length; end += 1) {
      const character = source[end];
      if (quote) {
        if (character === quote) quote = null;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === ">") {
        tags.push(source.slice(start, end + 1));
        end += 1;
        break;
      }
    }
    start = end;
  }
  return tags;
}

function htmlReferenceAttributes(tag) {
  const references = [];
  let index = 1;
  while (index < tag.length && !/[\s/>]/u.test(tag[index])) index += 1;
  while (index < tag.length) {
    while (/\s/u.test(tag[index] || "")) index += 1;
    if (!tag[index] || tag[index] === ">" || tag[index] === "/") break;
    const nameStart = index;
    while (index < tag.length && !/[\s=/>]/u.test(tag[index])) index += 1;
    const name = tag.slice(nameStart, index).toLocaleLowerCase("en-US");
    while (/\s/u.test(tag[index] || "")) index += 1;
    if (tag[index] !== "=") continue;
    index += 1;
    while (/\s/u.test(tag[index] || "")) index += 1;
    if (tag[index] === '"' || tag[index] === "'") {
      const quote = tag[index];
      index += 1;
      const valueStart = index;
      while (index < tag.length && tag[index] !== quote) index += 1;
      const value = tag.slice(valueStart, index);
      if (tag[index] === quote) index += 1;
      if (name === "src" || name === "href") references.push(value);
    } else {
      const valueStart = index;
      while (index < tag.length && !/[\s>]/u.test(tag[index])) index += 1;
      const value = tag.slice(valueStart, index);
      if (name === "src" || name === "href") references.push(value);
    }
  }
  return references;
}

function cssUrlValues(value) {
  const references = [];
  for (let cursor = 0; cursor < value.length;) {
    if (value.startsWith("/*", cursor)) {
      const commentEnd = value.indexOf("*/", cursor + 2);
      cursor = commentEnd < 0 ? value.length : commentEnd + 2;
      continue;
    }
    if (value[cursor] === '"' || value[cursor] === "'") {
      const quote = value[cursor++];
      while (cursor < value.length && value[cursor] !== quote) {
        cursor += value[cursor] === "\\" ? 2 : 1;
      }
      cursor += 1;
      continue;
    }
    const urlMatch = /^url\s*\(/iu.exec(value.slice(cursor));
    const previous = value[cursor - 1] || "";
    if (!urlMatch || /[\w-]/u.test(previous)) {
      cursor += 1;
      continue;
    }
    let index = cursor + urlMatch[0].length;
    while (/\s/u.test(value[index] || "")) index += 1;
    const quote = value[index] === '"' || value[index] === "'" ? value[index++] : null;
    const start = index;
    while (index < value.length) {
      if (value[index] === "\\") {
        index += 2;
        continue;
      }
      if (quote ? value[index] === quote : value[index] === ")") break;
      index += 1;
    }
    const raw = value.slice(start, index);
    if (quote) {
      if (value[index] !== quote) {
        cursor += urlMatch[0].length;
        continue;
      }
      index += 1;
      while (/\s/u.test(value[index] || "")) index += 1;
    }
    if (value[index] === ")") references.push(raw.trim());
    cursor = Math.max(index + 1, cursor + urlMatch[0].length);
  }
  return references;
}

function cssImportValue(params) {
  const value = params.trim();
  if (/^url\s*\(/iu.test(value)) return null;
  if (value[0] === '"' || value[0] === "'") {
    const quote = value[0];
    let index = 1;
    for (; index < value.length; index += 1) {
      if (value[index] === "\\") index += 1;
      else if (value[index] === quote) return value.slice(1, index);
    }
    return null;
  }
  return value.match(/^(?:\\.|[^\s;])+/u)?.[0] || null;
}

function cssImportValues(source) {
  const values = [];
  for (let cursor = 0; cursor < source.length;) {
    if (source.startsWith("/*", cursor)) {
      const commentEnd = source.indexOf("*/", cursor + 2);
      cursor = commentEnd < 0 ? source.length : commentEnd + 2;
      continue;
    }
    if (source[cursor] === '"' || source[cursor] === "'") {
      const quote = source[cursor++];
      while (cursor < source.length && source[cursor] !== quote) {
        cursor += source[cursor] === "\\" ? 2 : 1;
      }
      cursor += 1;
      continue;
    }
    const match = /^@import\b/iu.exec(source.slice(cursor));
    if (!match) {
      cursor += 1;
      continue;
    }
    let index = cursor + match[0].length;
    let quote = null;
    let depth = 0;
    for (; index < source.length; index += 1) {
      const character = source[index];
      if (quote) {
        if (character === "\\") index += 1;
        else if (character === quote) quote = null;
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === "(") {
        depth += 1;
      } else if (character === ")") {
        depth = Math.max(0, depth - 1);
      } else if (character === ";" && depth === 0) {
        break;
      }
    }
    const reference = cssImportValue(source.slice(cursor + match[0].length, index));
    if (reference !== null) values.push(reference);
    cursor = index + 1;
  }
  return values;
}

function patternIdentifiers(pattern) {
  if (!pattern || typeof pattern !== "object") return [];
  if (pattern.type === "Identifier") return [pattern.name];
  if (pattern.type === "RestElement") return patternIdentifiers(pattern.argument);
  if (pattern.type === "AssignmentPattern") return patternIdentifiers(pattern.left);
  if (pattern.type === "ArrayPattern") return pattern.elements.flatMap(patternIdentifiers);
  if (pattern.type === "ObjectPattern") {
    return pattern.properties.flatMap(property => property.type === "RestElement"
      ? patternIdentifiers(property.argument)
      : patternIdentifiers(property.value));
  }
  return [];
}

function lexicalScopes(ast) {
  const scopeByNode = new WeakMap();
  const pendingMutations = [];
  const childScope = (parent, functionBoundary = false) => {
    const scope = { parent, bindings: new Map(), functionScope: null };
    scope.functionScope = functionBoundary || !parent ? scope : parent.functionScope;
    return scope;
  };
  const declare = (scope, name, binding) => {
    const previous = scope.bindings.get(name);
    scope.bindings.set(name, previous ? { ...previous, ambiguous: true } : { ...binding, scope: binding.scope || scope });
  };
  const visit = (node, inheritedScope) => {
    if (!node || typeof node !== "object") return;
    const isFunction = [
      "ArrowFunctionExpression", "FunctionDeclaration", "FunctionExpression", "ObjectMethod", "ClassMethod"
    ].includes(node.type);
    const createsBlock = ["Program", "BlockStatement", "SwitchStatement", "CatchClause"].includes(node.type);
    const scope = isFunction || createsBlock
      ? childScope(inheritedScope, isFunction || node.type === "Program")
      : inheritedScope;
    scopeByNode.set(node, scope);
    if (isFunction) {
      for (const parameter of node.params || []) {
        for (const name of patternIdentifiers(parameter)) declare(scope, name, { kind: "parameter", init: null, mutable: true });
      }
    }
    if (node.type === "CatchClause") {
      for (const name of patternIdentifiers(node.param)) declare(scope, name, { kind: "parameter", init: null, mutable: true });
    }
    if (node.type === "VariableDeclaration") {
      for (const declarator of node.declarations) {
        for (const name of patternIdentifiers(declarator.id)) {
          const bindingScope = node.kind === "var" ? scope.functionScope : scope;
          declare(bindingScope, name, {
            kind: node.kind,
            init: declarator.init,
            mutable: node.kind !== "const",
            scope
          });
        }
      }
    }
    if (node.type === "AssignmentExpression" || node.type === "UpdateExpression") {
      pendingMutations.push({ pattern: node.type === "AssignmentExpression" ? node.left : node.argument, scope });
    }
    for (const [key, child] of Object.entries(node)) {
      if (["loc", "start", "end", "extra"].includes(key)) continue;
      if (Array.isArray(child)) child.forEach(value => visit(value, scope));
      else if (child && typeof child === "object") visit(child, scope);
    }
  };
  visit(ast, null);
  const nearest = (scope, name) => {
    for (let current = scope; current; current = current.parent) {
      if (current.bindings.has(name)) return current.bindings.get(name);
    }
    return null;
  };
  for (const { pattern, scope } of pendingMutations) {
    for (const name of patternIdentifiers(pattern)) {
      const binding = nearest(scope, name);
      if (binding) binding.mutable = true;
    }
  }
  return { scopeByNode, nearest };
}

function staticScopedString(node, scope, nearest, seen = new Set()) {
  if (!node) return null;
  if (node.type === "StringLiteral") return node.value;
  if (["ParenthesizedExpression", "TSAsExpression", "TSTypeAssertion"].includes(node.type)) {
    return staticScopedString(node.expression, scope, nearest, seen);
  }
  if (node.type === "Identifier") {
    const binding = nearest(scope, node.name);
    if (!binding || binding.kind !== "const" || binding.mutable || binding.ambiguous
      || !binding.init || seen.has(binding)) return null;
    return staticScopedString(binding.init, binding.scope, nearest, new Set([...seen, binding]));
  }
  if (node.type === "TemplateLiteral") {
    let value = "";
    for (const [index, quasi] of node.quasis.entries()) {
      value += quasi.value.cooked ?? quasi.value.raw;
      if (index < node.expressions.length) {
        const expression = staticScopedString(node.expressions[index], scope, nearest, seen);
        if (expression === null) return null;
        value += expression;
      }
    }
    return value;
  }
  if (node.type === "BinaryExpression" && node.operator === "+") {
    const left = staticScopedString(node.left, scope, nearest, seen);
    const right = staticScopedString(node.right, scope, nearest, seen);
    return left === null || right === null ? null : left + right;
  }
  return null;
}

function staticScopedFragments(node, scope, nearest, seen = new Set()) {
  if (!node) return [];
  if (node.type === "StringLiteral") return [node.value];
  if (["ParenthesizedExpression", "TSAsExpression", "TSTypeAssertion"].includes(node.type)) {
    return staticScopedFragments(node.expression, scope, nearest, seen);
  }
  if (node.type === "Identifier") {
    const binding = nearest(scope, node.name);
    if (!binding || binding.kind !== "const" || binding.mutable || binding.ambiguous
      || !binding.init || seen.has(binding)) return [];
    return staticScopedFragments(binding.init, binding.scope, nearest, new Set([...seen, binding]));
  }
  if (node.type === "TemplateLiteral") {
    return node.quasis.flatMap((quasi, index) => [
      quasi.value.cooked ?? quasi.value.raw,
      ...index < node.expressions.length
        ? staticScopedFragments(node.expressions[index], scope, nearest, seen)
        : []
    ]);
  }
  if (node.type === "BinaryExpression" && node.operator === "+") {
    return [
      ...staticScopedFragments(node.left, scope, nearest, seen),
      ...staticScopedFragments(node.right, scope, nearest, seen)
    ];
  }
  return [];
}

function walkAst(node, visit) {
  if (!node || typeof node !== "object") return;
  visit(node);
  for (const [key, child] of Object.entries(node)) {
    if (["loc", "start", "end", "extra"].includes(key)) continue;
    if (Array.isArray(child)) child.forEach(value => walkAst(value, visit));
    else if (child && typeof child === "object") walkAst(child, visit);
  }
}

function walkAstWithAncestors(node, visit, ancestors = []) {
  if (!node || typeof node !== "object") return;
  visit(node, ancestors);
  const nextAncestors = [...ancestors, node];
  for (const [key, child] of Object.entries(node)) {
    if (["loc", "start", "end", "extra"].includes(key)) continue;
    if (Array.isArray(child)) child.forEach(value => walkAstWithAncestors(value, visit, nextAncestors));
    else if (child && typeof child === "object") walkAstWithAncestors(child, visit, nextAncestors);
  }
}

function parseSourceEdges(relativePath, source) {
  const extension = path.extname(relativePath);
  const edges = [];
  const nonliteralDynamic = [];
  const addEdge = (specifier, kind) => {
    edges.push({ specifier: normalizeBrowserReference(specifier), kind });
  };
  if (extension === ".html") {
    for (const tag of htmlStartTags(source)) {
      for (const attribute of htmlReferenceAttributes(tag)) {
        addEdge(decodeHtmlCharacterReferences(attribute), "html");
      }
    }
    return { edges, nonliteralDynamic };
  }
  if (extension === ".css") {
    for (const value of cssUrlValues(source)) addEdge(decodeCssEscapes(value), "css-url");
    for (const value of cssImportValues(source)) addEdge(decodeCssEscapes(value), "css-import");
    return { edges, nonliteralDynamic };
  }
  let ast;
  try {
    ast = parse(source, {
      sourceType: "unambiguous",
      plugins: ["jsx", "typescript", "dynamicImport", "importAttributes"]
    });
  } catch (error) {
    throw new Error(`${relativePath}: source parse failed: ${error.message}`, { cause: error });
  }
  const { scopeByNode, nearest } = lexicalScopes(ast);
  walkAst(ast, node => {
    if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type)
      && node.source?.type === "StringLiteral") {
      addEdge(node.source.value, node.type);
    }
    if (node.type === "CallExpression" && node.callee?.type === "Import") {
      const specifier = staticScopedString(node.arguments[0], scopeByNode.get(node), nearest);
      if (specifier !== null) addEdge(specifier, "dynamic");
      else nonliteralDynamic.push(null);
    }
    if (node.type !== "JSXAttribute" || !["src", "href"].includes(node.name?.name)) return;
    const reference = node.value?.type === "JSXExpressionContainer" ? node.value.expression : node.value;
    const specifier = staticScopedString(reference, scopeByNode.get(node), nearest);
    if (specifier !== null) {
      addEdge(specifier, `jsx-${node.name.name}`);
    } else if (looksLikeGalleryFragment(staticScopedFragments(reference, scopeByNode.get(node), nearest).join(""))) {
      nonliteralDynamic.push(null);
    }
  });
  return { edges, nonliteralDynamic };
}

function resolveSourceEdge(fromPath, specifier, sources) {
  if (typeof specifier !== "string" || (!specifier.startsWith(".") && !specifier.startsWith("/"))) return null;
  const clean = specifier.split(/[?#]/u)[0];
  const base = clean.startsWith("/")
    ? clean.slice(1)
    : normalizePath(path.posix.normalize(path.posix.join(path.posix.dirname(fromPath), clean)));
  const candidates = [
    base,
    ...[".js", ".jsx", ".mjs", ".ts", ".tsx", ".html", ".css"].map(extension => `${base}${extension}`),
    ...["index.js", "index.jsx", "index.mjs", "index.ts", "index.tsx"].map(name => `${base}/${name}`)
  ];
  return candidates.find(candidate => sources.has(candidate)) || null;
}

function looksLikeGallerySpecifier(value) {
  return typeof value === "string" && (
    value.includes("sound-seekers-v2-content")
    || value.includes("ContentArtGallery")
    || value.includes("galleryReplayRecipes")
    || value.includes("content-art-gallery")
  );
}

function looksLikeGalleryFragment(value) {
  return looksLikeGallerySpecifier(value)
    || typeof value === "string" && value.includes("sound-seekers-v2-");
}

function previewAuthorityViolations(relativePath, source) {
  if (!(relativePath === "preview/sound-seekers-v2-content.jsx"
    || relativePath.startsWith("src/features/soundSeekers/preview/"))) return [];
  const violations = [];
  if (/connectedTextAnswerKeys|CONNECTED_TEXT_EVALUATORS|evaluateConnectedTextDecision|\/engine\/evidence(?:\.js)?["']/u.test(source)) {
    violations.push(`${relativePath}: preview imports private answer/evidence authority`);
  }
  if (/\breaddir(?:Sync)?\s*\([^)]*(?:public|game-assets|audio)/su.test(source)) {
    violations.push(`${relativePath}: preview scans an asset directory`);
  }
  let ast;
  try {
    ast = parse(source, { sourceType: "unambiguous", plugins: ["jsx", "typescript"] });
  } catch {
    return violations;
  }
  const { scopeByNode, nearest } = lexicalScopes(ast);
  const replayRecipe = relativePath.endsWith("galleryReplayRecipes.js");
  const forbiddenKeys = new Set(["presentationTransition", "evidenceEvent", "correct", "phase", "challenge", "response"]);
  const enclosingFunctionName = ancestors => {
    const fn = [...ancestors].reverse().find(candidate => [
      "FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"
    ].includes(candidate.type));
    if (!fn) return null;
    if (fn.id?.name) return fn.id.name;
    const parent = ancestors[ancestors.indexOf(fn) - 1];
    return parent?.type === "VariableDeclarator" ? parent.id?.name : null;
  };
  const exactReplayProperty = (node, ancestors, key) => {
    if (!replayRecipe || enclosingFunctionName(ancestors) !== "replaySoundSeekersGalleryFixture") return false;
    const parent = ancestors.at(-1);
    const grandparent = ancestors.at(-2);
    if (parent?.type !== "ObjectExpression") return false;
    if (["challenge", "response"].includes(key)) {
      const exactTransaction = grandparent?.type === "CallExpression"
        && grandparent.callee?.type === "Identifier"
        && grandparent.callee.name === "completeStoryTransferTransaction";
      if (!exactTransaction) return false;
      if (key === "challenge") {
        return node.value?.type === "Identifier" && ["challenge", "freshChallenge"].includes(node.value.name);
      }
      if (node.value?.type !== "ObjectExpression" || node.value.properties.length !== 2) return false;
      const responseFields = new Map(node.value.properties.map(property => [
        property.key?.name || property.key?.value, property.value
      ]));
      const kind = responseFields.get("kind");
      const token = responseFields.get("token");
      return kind?.type === "StringLiteral" && kind.value === "literacy-answer"
        && (token?.type === "Identifier" && token.name === "wrongToken"
          || token?.type === "MemberExpression"
            && token.object?.type === "Identifier"
            && ["challenge", "freshChallenge"].includes(token.object.name)
            && token.property?.type === "Identifier" && token.property.name === "expectedToken");
    }
    const returnStatement = grandparent?.type === "ReturnStatement"
      ? grandparent
      : grandparent?.type === "CallExpression"
        && grandparent.callee?.type === "MemberExpression"
        && grandparent.callee.object?.name === "Object"
        && grandparent.callee.property?.name === "freeze"
        ? ancestors.at(-3)
        : null;
    if (returnStatement?.type !== "ReturnStatement") return false;
    if (key === "presentationTransition") {
      return node.value?.type === "Identifier" && node.value.name === "transition"
        || node.value?.type === "NullLiteral";
    }
    if (key === "phase") {
      return node.value?.type === "MemberExpression"
        && node.value.object?.type === "Identifier"
        && node.value.object.name === "transition"
        && node.value.property?.type === "Identifier"
        && node.value.property.name === "phase"
        || node.value?.type === "StringLiteral" && ["pre_choice", "correction"].includes(node.value.value);
    }
    return false;
  };
  walkAstWithAncestors(ast, (node, ancestors) => {
    if (node.type === "ObjectProperty") {
      const key = node.computed
        ? staticScopedString(node.key, scopeByNode.get(node), nearest)
        : node.key?.name || node.key?.value;
      if (forbiddenKeys.has(key) && !exactReplayProperty(node, ancestors, key)) {
        violations.push(`${relativePath}: preview authors forbidden ${key} authority`);
      }
    }
    if (node.type === "JSXAttribute" && forbiddenKeys.has(node.name?.name)) {
      violations.push(`${relativePath}: preview passes forbidden ${node.name.name} prop`);
    }
    if (node.type === "CallExpression" && node.callee?.type === "Identifier"
      && node.callee.name === "issueSceneVisualAccess") {
      const exactReplayCall = replayRecipe
        && enclosingFunctionName(ancestors) === "replaySoundSeekersGalleryFixture"
        && node.arguments.length === 2
        && node.arguments[0]?.type === "Identifier" && node.arguments[0].name === "transition"
        && node.arguments[1]?.type === "Identifier" && node.arguments[1].name === "context";
      if (!exactReplayCall) violations.push(`${relativePath}: preview issues scene access outside reducer replay`);
    }
  });
  return violations;
}

export function scanSoundSeekersV2SourcePolicy({ virtualSources = null, removedSources = [] } = {}) {
  const sources = new Map(repositorySources());
  const overrides = new Set(Object.keys(virtualSources || {}).map(normalizePath));
  for (const relativePath of removedSources) sources.delete(normalizePath(relativePath));
  for (const [relativePath, source] of Object.entries(virtualSources || {})) sources.set(normalizePath(relativePath), source);
  const violations = [];
  for (const [relativePath, source] of sources) {
    const rawColorScope = relativePath.startsWith("src/features/soundSeekers/")
      || relativePath === "preview/sound-seekers-v2-content.jsx";
    if (rawColorScope && relativePath !== "src/features/soundSeekers/visual/visualTokens.js" && RAW_COLOR.test(source)) {
      violations.push(`${relativePath}: raw color outside visualTokens.js`);
    }
    violations.push(...previewAuthorityViolations(relativePath, source));
  }

  if (!cachedRepositoryEdges) {
    cachedRepositoryEdges = new Map([...repositorySources()].map(([relativePath, source]) =>
      [relativePath, parseSourceEdges(relativePath, source)]));
  }
  for (const [relativePath, source] of sources) {
    const { edges, nonliteralDynamic } = overrides.has(relativePath)
      ? parseSourceEdges(relativePath, source)
      : cachedRepositoryEdges.get(relativePath) || parseSourceEdges(relativePath, source);
    for (const [dynamicIndex] of nonliteralDynamic.entries()) {
      if (relativePath.startsWith("src/") || relativePath.startsWith("preview/")) {
        violations.push(`${relativePath}: dynamic import ${dynamicIndex + 1} cannot be proven local and isolated`);
      }
    }
    for (const edge of edges) {
      if (!looksLikeGallerySpecifier(edge.specifier)) continue;
      const resolved = resolveSourceEdge(relativePath, edge.specifier, sources);
      if (!resolved) {
        violations.push(`${relativePath}: unresolved gallery source edge ${edge.specifier}`);
        continue;
      }
      if (GALLERY_TARGETS.has(resolved) && !GALLERY_CONSUMERS.has(relativePath)) {
        violations.push(`${relativePath}: dev-only gallery edge is not an exact authorized consumer`);
      }
    }
  }
  if ((virtualSources || removedSources.length) && violations.length) throw new Error(violations.join("\n"));
  return deepFreeze({ violations });
}

function assertBundleIsolation(productionBundlePath) {
  if (!productionBundlePath) return;
  const analysisPath = path.resolve(productionBundlePath);
  const outputRoot = path.dirname(analysisPath);
  const analysis = JSON.parse(readFileSync(analysisPath, "utf8"));
  const hasExactKeys = (value, expected) => value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).sort().join("\n") === [...expected].sort().join("\n");
  if (!hasExactKeys(analysis, ["generatedAt", "chunks"])
    || typeof analysis.generatedAt !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(analysis.generatedAt)
    || !Number.isFinite(Date.parse(analysis.generatedAt))
    || !Array.isArray(analysis.chunks)
    || analysis.chunks.length === 0) {
    throw new Error("production bundle analysis does not match the real Vite schema");
  }
  const identities = [];
  const chunkNames = new Set();
  for (const chunk of analysis.chunks) {
    if (!hasExactKeys(chunk, [
      "fileName", "isEntry", "isDynamicEntry", "imports", "dynamicImports", "renderedLength", "modules"
    ]) || typeof chunk.fileName !== "string" || !chunk.fileName
      || path.isAbsolute(chunk.fileName) || normalizePath(chunk.fileName).split("/").includes("..")
      || typeof chunk.isEntry !== "boolean" || typeof chunk.isDynamicEntry !== "boolean"
      || !Number.isSafeInteger(chunk.renderedLength) || chunk.renderedLength < 0
      || !Array.isArray(chunk.imports) || !Array.isArray(chunk.dynamicImports)
      || [...chunk.imports, ...chunk.dynamicImports].some(value => typeof value !== "string" || !value)
      || new Set(chunk.imports).size !== chunk.imports.length
      || new Set(chunk.dynamicImports).size !== chunk.dynamicImports.length
      || !Array.isArray(chunk.modules)) {
      throw new Error("production bundle analysis contains a malformed Vite chunk");
    }
    const fileName = normalizePath(chunk.fileName);
    if (chunkNames.has(fileName)) throw new Error("production bundle analysis contains duplicate chunks");
    chunkNames.add(fileName);
    identities.push(fileName, ...chunk.imports.map(normalizePath), ...chunk.dynamicImports.map(normalizePath));
    let renderedLength = 0;
    for (const module of chunk.modules) {
      if (!hasExactKeys(module, ["id", "renderedLength", "originalLength"])
        || typeof module.id !== "string" || !module.id
        || !Number.isSafeInteger(module.renderedLength) || module.renderedLength < 0
        || !Number.isSafeInteger(module.originalLength) || module.originalLength < 0) {
        throw new Error("production bundle analysis contains a malformed Vite module");
      }
      renderedLength += module.renderedLength;
      identities.push(normalizePath(module.id));
    }
    if (renderedLength !== chunk.renderedLength) {
      throw new Error("production bundle analysis chunk length does not match its modules");
    }
  }
  for (const chunk of analysis.chunks) {
    const fileName = normalizePath(chunk.fileName);
    const emittedPath = path.resolve(outputRoot, fileName);
    if (!emittedPath.startsWith(`${outputRoot}${path.sep}`)
      || chunk.renderedLength > 0 && !readdirSafeFile(emittedPath)) {
      throw new Error(`production bundle analysis references a missing emitted chunk: ${fileName}`);
    }
    for (const imported of [...chunk.imports, ...chunk.dynamicImports].map(normalizePath)) {
      if (!chunkNames.has(imported)) {
        throw new Error(`production bundle analysis references an unknown imported chunk: ${imported}`);
      }
    }
  }
  const emittedSources = emittedTextFiles(outputRoot);
  if (identities.some(looksLikeGallerySpecifier)
    || emittedSources.some(filePath => looksLikeGallerySpecifier(normalizePath(path.relative(outputRoot, filePath)))
      || /sound-seekers-v2-content|ContentArtGallery|galleryReplayRecipes|content-art-gallery|data-gallery-root/u
        .test(readFileSync(filePath, "utf8")))) {
    throw new Error("production bundle graph contains the dev-only gallery");
  }
}

function readdirSafeFile(filePath) {
  try {
    return readdirSync(path.dirname(filePath), { withFileTypes: true })
      .some(entry => entry.name === path.basename(filePath) && entry.isFile());
  } catch {
    return false;
  }
}

function emittedTextFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return emittedTextFiles(fullPath);
    return entry.isFile() && /\.(?:js|css|html)$/u.test(entry.name) ? [fullPath] : [];
  });
}

function assertTaskOneToFiveAuthorities() {
  assertSoundSeekersInteractionContexts(SOUND_SEEKERS_INTERACTION_CONTEXTS);
  for (const expedition of SOUND_SEEKERS_EXPEDITIONS) assertExpeditionContentOwnership(expedition);
  const assessedWordIds = [...new Set(SOUND_SEEKERS_EXPEDITIONS.flatMap(expedition =>
    expedition.phases.map(phase => phase.wordId).filter(Boolean)))];
  assertShippingPronunciationLexicon(SOUND_SEEKERS_WORDS, { requiredEvidenceWordIds: assessedWordIds });
  for (const scene of SOUND_SEEKERS_CONNECTED_TEXT) {
    const errors = validateSceneAtStop(scene, scene.stopId);
    if (errors.length) throw new Error(`${scene.id}: authoritative connected-text validation failed: ${errors.join(", ")}`);
  }
  validateSoundSeekersBiomeKits(SOUND_SEEKERS_BIOME_KITS);
  validateSoundSeekersVisualCatalogs();
  assertSoundSeekersV2AssetManifest(readSoundSeekersV2AssetManifest(), SOUND_SEEKERS_BIOME_KITS);
}

export function assertSoundSeekersV2Content({ productionBundlePath = null } = {}) {
  assertBundleIsolation(productionBundlePath);
  assertTaskOneToFiveAuthorities();
  const fixture = buildSoundSeekersV2CanonicalCoverageFixture();
  const coverageSummary = summarizeSoundSeekersV2Coverage(fixture.state);
  validateSoundSeekersV2ContentAuthorities(buildSoundSeekersV2AuthoritySnapshot());
  const expectedInstructions = Object.values(SOUND_SEEKERS_INSTRUCTIONS).filter(item => !item.silenceIsIntentional);
  const instructionAssets = instructionAudioInventory();
  if (expectedInstructions.length !== instructionAssets.length
    || expectedInstructions.some(contract => !instructionAssets.some(asset =>
      asset.instructionId === contract.instructionId && asset.childText === contract.childText))) {
    throw new Error("instruction contracts and audio provenance are not bijective");
  }
  const expectedSceneAudio = expectedSoundSeekersSceneAudio();
  const sceneAssets = sceneAudioInventory();
  if (expectedSceneAudio.length !== sceneAssets.length
    || expectedSceneAudio.some(expected => !sceneAssets.some(asset =>
      asset.assetId === expected.assetId && asset.path === expected.path && asset.text === expected.text))) {
    throw new Error("scene audio authority drift");
  }
  assertSoundSeekersSceneAudio();
  const policy = scanSoundSeekersV2SourcePolicy();
  if (policy.violations.length) throw new Error(policy.violations.join("\n"));
  return deepFreeze({ coverageSummary, attemptReceiptCount: fixture.attemptReceipts.length });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const bundleIndex = process.argv.indexOf("--production-bundle");
  const productionBundlePath = bundleIndex >= 0 ? process.argv[bundleIndex + 1] : null;
  try {
    const result = assertSoundSeekersV2Content({ productionBundlePath });
    console.log(`Sound Seekers v2 content PASS (${result.attemptReceiptCount} receipts)`);
  } catch (error) {
    console.error(`Sound Seekers v2 content FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
