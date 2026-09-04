// Skills Assessment Rebuild v3 — shared library for build, lints, sims, gate.
// Spec: docs/skills-assessment-rebuild/{MASTERY_SYSTEM,AUTHORING_STANDARDS}.md

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..", "..");

import { V3_QUESTION_SOURCE } from "../../src/content/blueprints/skillBlueprints.js";
import { ASSESSMENT_IMAGE_ALIAS_BY_SOURCE } from "../../src/content/assessments/v3/assessmentImageAliases.generated.js";
import { ASSESSMENT_ITEM_MEDIA_DECISIONS } from "../../src/content/assessments/v3/assessmentItemMediaDecisions.generated.js";
import { hfwApprovedWordsBySkill } from "../../src/data/hfwApprovedCoverageWords.js";
export const V3_SOURCE = V3_QUESTION_SOURCE;
export const AUTHORING_DIR = path.join(ROOT, "tools", "assessmentRebuild", "authoring");
export const BANKS_DIR = path.join(ROOT, "src", "data", "v3", "banks");
export const STATUS_FILE = path.join(ROOT, "src", "content", "assessments", "v3", "assessmentRebuildStatus.generated.js");
export const REPORT_DIR = path.join(ROOT, ".artifacts", "assessment-rebuild");

const assetHashCache = new Map();
const hfwSkillOrder = ["hfw_1_25", "hfw_26_50", "hfw_51_75", "hfw_76_100"];
const cumulativeHfwChoicesBySkill = Object.freeze(Object.fromEntries(
  hfwSkillOrder.map((skillId, index) => [
    skillId,
    new Set(hfwSkillOrder.slice(0, index + 1).flatMap(id => hfwApprovedWordsBySkill[id] || []).map(word => word.toLowerCase()))
  ])
));
function publicAssetPath(assetPath) {
  return assetPath ? path.join(ROOT, "public", String(assetPath).replace(/^\//, "")) : "";
}
function assetHash(assetPath) {
  const absolute = publicAssetPath(assetPath);
  if (!absolute || !fs.existsSync(absolute)) return "";
  if (!assetHashCache.has(absolute)) {
    assetHashCache.set(absolute, createHash("sha256").update(fs.readFileSync(absolute)).digest("hex"));
  }
  return assetHashCache.get(absolute);
}

export const RATIONALE_CODES = new Set([
  "KEY",
  "D-ONSET", "D-RIME-NEAR", "D-VOWEL", "D-PATTERN-TRAP", "D-POSITION", "D-VISUAL-NEIGHBOR",
  "D-FUNCTION-SWAP", "D-HOMOPHONE", "D-MORPH-LITERAL", "D-DEVELOPMENTAL", "D-SEMANTIC",
  "D-SAME-DOMAIN",
  "D-DETAIL-AS-MAIN", "D-TOPIC-ADJACENT", "D-SEQUENCE-SWAP", "D-CAUSE-REVERSE",
  "D-PLAUSIBLE-UNSUPPORTED", "D-OPPOSITE",
  "D-SEQUENCE-START", "D-SEQUENCE-END", "D-SEQUENCE-REVERSE"
]);

export const VISUAL_MEDIA_DECISION_ROLES = new Set([
  "answer-cards",
  "sequence",
  "target-or-scene",
  "neutral-support",
  "construct-support"
]);

export const MEDIA_DECISION_ROLES = new Set([
  ...VISUAL_MEDIA_DECISION_ROLES,
  "text-only"
]);

export function mediaDecisionContractIssues(item = {}, decision, actualPaths = []) {
  const issues = [];
  if (!decision) return ["item has no explicit reviewed media decision"];

  const role = decision.role;
  const pathsAreExplicit = Array.isArray(decision.paths);
  const expectedPaths = pathsAreExplicit ? [...new Set(decision.paths.filter(Boolean))] : [];
  const expandedPaths = [...new Set((actualPaths || []).filter(Boolean))];

  if (!MEDIA_DECISION_ROLES.has(role)) issues.push(`invalid media role: ${role || "(missing)"}`);
  if (decision.constructReview !== "approved") issues.push("construct review is not approved");
  if (!String(decision.answerNeutral || "").startsWith("approved") && !String(decision.answerNeutral || "").startsWith("not-applicable")) {
    issues.push("answer-neutrality review is not approved");
  }
  if (!pathsAreExplicit) issues.push("media decision paths must be an array");

  if (role === "text-only") {
    if (pathsAreExplicit && decision.paths.length) issues.push("text-only decision must declare zero image paths");
    if (expandedPaths.length) issues.push("text-only item expands with visual media");
    if (decision.alt) issues.push("text-only decision must not retain visual alt text");
    return issues;
  }

  if (!expectedPaths.length) issues.push("visual media decision has no reviewed image paths");
  if (!expandedPaths.length) issues.push("item has no meaningful target, scene, answer-card, or sequence image");
  if (
    expandedPaths.length !== expectedPaths.length
    || expandedPaths.some(assetPath => !expectedPaths.includes(assetPath))
  ) {
    issues.push("expanded item images do not exactly match its reviewed decision");
  }
  if (["neutral-support", "construct-support", "target-or-scene"].includes(role) && !item.imageAlt) {
    issues.push("target or scene image is missing non-answer-revealing alt text");
  }
  if (role === "answer-cards" && !(item.imageCards || []).length) {
    issues.push("answer-card decision has no image cards");
  }
  if (role === "sequence" && !(item.sequenceCards || []).length) {
    issues.push("sequence decision has no sequence cards");
  }
  return issues;
}

function authoredItemHasVisualFields(authoredItem = {}) {
  return Boolean(
    authoredItem.img
    || authoredItem.supportImg
    || (Array.isArray(authoredItem.cards) && authoredItem.cards.length)
    || (Array.isArray(authoredItem.sequenceCards) && authoredItem.sequenceCards.length)
  );
}

export function syncItemMediaDecision({
  item = {},
  authoredItem = {},
  decision,
  actualPaths = [],
  styleDecisions = {}
} = {}) {
  if (!decision) throw new Error(`${item.id || "(unknown item)"} has no reviewed media decision to synchronise`);

  const explicitlyNonVisual = ["text", "audio-required"].includes(authoredItem.media);
  const hasAuthoredVisuals = authoredItemHasVisualFields(authoredItem);
  // A previously text-only item may be intentionally upgraded when its
  // current authoring source now supplies reviewed visual evidence. Keep the
  // old fail-closed behavior for genuinely non-visual authoring.
  const promotesTextOnlyDecision = decision.role === "text-only"
    && hasAuthoredVisuals
    && !explicitlyNonVisual;
  const shouldBeTextOnly = !promotesTextOnlyDecision
    && (decision.role === "text-only" || explicitlyNonVisual);

  if (shouldBeTextOnly && hasAuthoredVisuals) {
    throw new Error(`${item.id || decision.itemId} declares text-only media and visual fields together`);
  }
  if (shouldBeTextOnly) {
    const nonVisualDecision = { ...decision };
    delete nonVisualDecision.alt;
    return { ...nonVisualDecision, role: "text-only", paths: [] };
  }

  const paths = [...new Set((actualPaths || []).filter(Boolean))];
  if (!paths.length) throw new Error(`${item.id || decision.itemId} expands without meaningful media`);
  for (const assetPath of paths) {
    if (!styleDecisions[assetPath]) {
      throw new Error(`${item.id || decision.itemId} uses art without direct visual approval: ${assetPath}`);
    }
  }
  const visualDecision = promotesTextOnlyDecision
    ? {
      ...decision,
      role: "target-or-scene",
      alt: decision.alt || item.imageAlt || "Picture support for this literacy question",
      answerNeutral: decision.answerNeutral === "not-applicable-text-only"
        ? "approved"
        : decision.answerNeutral
    }
    : decision;
  return { ...visualDecision, paths };
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------
export const norm = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

const NAME_RE = /\b[A-Z][a-z]+\b/g;
export function skeleton(text) {
  return norm(String(text || "").replace(NAME_RE, "@")).replace(/[^a-z@ ]/g, " ").replace(/\s+/g, " ").trim();
}
export function shingles(text, n = 4) {
  const words = skeleton(text).split(" ").filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join(" "));
  return out;
}
export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}
// Formats whose choice universe IS the (tiny) pattern inventory — identical
// option sets are inherent there, so option-set uniqueness applies only to
// open-set formats (AUTHORING_STANDARDS O-4 targets stock distractor pools).
export const CLOSED_SET_FORMATS = new Set([
  "LONG_VOWEL_SILENT_E_PATTERN", "DIGRAPH_COMPLETE_WORD", "BLEND_COMPLETE_WORD",
  "MISSING_VOWEL_CVC", "LISTEN_CHOOSE_VOWEL", "R_CONTROLLED_PATTERN",
  "PICTURE_AUDIO_TO_PATTERN", "LONG_VOWEL_TEAM_COMPLETE", "PLURAL_TEXT_CHOICE",
  "PREPOSITION_SCENE_CHOICE", "PREPOSITION_TEXT_CHOICE",
  "PREPOSITION_SENTENCE_FIT", "PREPOSITION_PRECISION"
]);

export function optionSetSignature(item) {
  // Tile-build items have no option SET — their single "choice" is the answer
  // and the variance lives in the tile bank, so set-uniqueness does not apply.
  if ((Array.isArray(item.soundTiles) && item.soundTiles.length) ||
      (Array.isArray(item.letterTiles) && item.letterTiles.length)) return "";
  return (item.choices || []).map(c => norm(c.text ?? c)).sort().join("|");
}
export function promptAnswerSignature(item) {
  // targetWord distinguishes image-pinned items whose printed prompt is
  // deliberately generic (LISTEN_CHOOSE_VOWEL never prints the word): two
  // items with the same prompt and answer but different pictured targets are
  // different questions, not duplicates.
  return `${norm(item.prompt)}||${norm(item.passage || "")}||${norm(item.sentence || "")}||${norm(item.answer)}||${norm(item.targetWord || item.target || "")}||${optionSetSignature(item)}`;
}

// ---------------------------------------------------------------------------
// Authoring-source → runtime item expansion
// ---------------------------------------------------------------------------
// Authored item (compact, hand-written):
// { u, lvl, ph, fmt, v, prompt, spoken?, choices: [{t, r, k?}], sentence?,
//   passage?, cell?, cards? (word list for image formats), img? (target image),
//   pos? ("initial"|"final"), hadPTD?, cross?, media? ("text"|"image-optional"|
//   "image-required"|"audio-required"), retention?, nonGating?, dband?, note? }
const FORM_BY_VARIANT = { 1: "A", 2: "B", 3: "C", 4: "A", 5: "B", 6: "C", 7: "A", 8: "B", 9: "C" };

function stableChoiceOffset(value, length) {
  if (length < 2) return 0;
  let hash = 2166136261;
  for (const char of String(value || "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

function rotate(values, offset) {
  if (!values.length || !offset) return [...values];
  return [...values.slice(offset), ...values.slice(0, offset)];
}

export function normalizeSpokenCloze(text) {
  return String(text || "")
    .replace(/\s*(?:_{3,}|\bhmm\b|\bblank\b)\s*/gi, " … ")
    .replace(/\s+/g, " ")
    .replace(/\s+([?.!,;:])/g, "$1")
    .trim();
}

export function expandItem(raw, blueprint, imageResolver) {
  const skillId = blueprint.skillId;
  const level = raw.lvl >= 2 ? 2 : 1;
  const key = raw.choices.find(c => c.k);
  const form = raw.retention ? "R" : (raw.form || FORM_BY_VARIANT[raw.v] || "A");
  const id = `lp3.${skillId}.l${level}.${form}.${raw.u}.v${raw.v}${raw.retention ? "r" : ""}`;
  const mediaDecision = ASSESSMENT_ITEM_MEDIA_DECISIONS[id];
  const choiceRows = rotate(raw.choices, stableChoiceOffset(id, raw.choices.length));
  const choices = choiceRows.map(c => c.t);
  const answer = key ? key.t : "";
  const phase = raw.ph || 1;
  // A scoring-scene asset key is not a word and must never be spoken as one.
  // Word/object image keys remain valid fallbacks for picture-led phonics.
  const targetWord = raw.target || (raw.img && !String(raw.img).startsWith("scene-") ? raw.img : undefined);
  const hasChoiceImages =
    (Array.isArray(raw.cards) && raw.cards.length > 0)
    || (Array.isArray(raw.sequenceCards) && raw.sequenceCards.length > 0);
  const supportImageKey = raw.img || raw.supportImg || "";
  const decisionSuppliesTarget = ["neutral-support", "construct-support"].includes(mediaDecision?.role);
  const decisionRequiresVisual = Boolean(mediaDecision && mediaDecision.role !== "text-only");
  const mediaTier = raw.media || (hasChoiceImages || supportImageKey || decisionRequiresVisual ? "image-required" : "text");

  const item = {
    id,
    bankStandardVersion: 3,
    grade: "K-2",
    skillId,
    assessmentSkillId: skillId,
    skillName: blueprint.skillName || skillId,
    skill: blueprint.skillName || skillId,
    level,
    assessmentLevel: level,
    difficulty: raw.dband || level,
    phase,
    assessmentPhase: phase,
    phaseTarget: `level_${level}_phase_${phase}`,
    form,
    itemType: raw.itemType || blueprint.itemType,
    itemKey: raw.u,
    formatType: raw.fmt,
    templateType: raw.fmt,
    questionType: raw.questionType || (raw.cards ? "visual_card_choice" : "multiple_choice"),
    prompt: raw.prompt,
    question: raw.prompt,
    spokenPrompt: normalizeSpokenCloze(raw.spoken || raw.prompt),
    sentence: raw.sentence,
    passage: raw.passage,
    cell: raw.cell,
    choices,
    answerOptions: raw.cards
      ? undefined
      : choices.map(text => ({ value: text, label: text, text })),
    answer,
    correctAnswer: answer,
    distractorRationales: Object.fromEntries(choiceRows.filter(c => !c.k).map(c => [c.t, c.r])),
    // Media truth is authored, not guessed. A text question stays text unless
    // its source explicitly declares an image/audio requirement.
    mediaTier,
    phonicsPosition: raw.pos,
    hadPTD: Boolean(raw.hadPTD || raw.choices.some(c => c.r === "D-PATTERN-TRAP")),
    crossPatternGroup: raw.cross || undefined,
    nonGating: Boolean(raw.nonGating),
    retentionOnly: Boolean(raw.retention),
    evidenceModality: raw.evidenceModality,
    evidenceRole: raw.evidenceRole || (raw.retention ? "retention" : "mastery"),
    mediaRole: raw.mediaRole,
    constructClaim: raw.constructClaim,
    hideWrittenLabels: Boolean(raw.hideWrittenLabels),
    displayPassageDuringResponse: raw.displayPassageDuringResponse !== false,
    suppressStimulusAudio: Boolean(raw.suppressStimulusAudio),
    audioRole: raw.audioRole,
    copyExempt: raw.copyExempt,
    soundTiles: raw.soundTiles,
    letterTiles: raw.letterTiles,
    letterBank: raw.letterTiles,
    sentenceText: raw.sentenceText || raw.sentence,
    targetWord,
    // Which media the AUTHOR declared. The runtime loader strips any
    // enrichment-added target media beyond this, so unapproved manifest paths
    // can never ride in on a v3 item (media QA stays fail-closed).
    v3AuthoredMedia: { target: Boolean(supportImageKey || decisionSuppliesTarget), cards: hasChoiceImages },
    assessmentMediaDecision: mediaDecision,
    requiredImageAssetKey: supportImageKey || (decisionSuppliesTarget ? mediaDecision?.paths?.[0] : undefined),
    stimulusMediaId: raw.stimulusMediaId || supportImageKey || (decisionSuppliesTarget ? mediaDecision?.paths?.[0] : undefined),
    active: true,
    qaStatus: "verified",
    source: V3_SOURCE,
    provenance: {
      generatedBy: "assessment-rebuild-gate",
      sourceFile: `tools/assessmentRebuild/authoring/${skillId}.mjs`,
      wave: raw.wave || "",
      standardVersion: "v3"
    },
    notes: raw.note || ""
  };

  if (raw.cards && imageResolver) {
    const orderedCardWords = [
      ...choiceRows.map(choice => choice.t).filter(word => raw.cards.includes(word)),
      ...raw.cards.filter(word => !choiceRows.some(choice => choice.t === word))
    ];
    const cards = orderedCardWords.map(word => {
      const image = imageResolver(word, skillId);
      return {
        id: `${id}_card_${word}`,
        word,
        value: word,
        label: word,
        image,
        imagePath: image,
        imageAlt: raw.alts?.[word] || word
      };
    });
    item.imageCards = cards;
    item.answerOptions = cards.map(card => ({ value: card.value, label: card.label, text: card.label }));
  }
  if (raw.sequenceCards && imageResolver) {
    item.sequenceCards = raw.sequenceCards.map((card, index) => {
      const image = imageResolver(card.img, skillId);
      return {
        id: `${id}_sequence_${index + 1}`,
        value: card.value,
        label: card.label,
        image,
        imagePath: image,
        alt: card.alt || card.label
      };
    });
    item.correctSequence = raw.correctSequence;
  }
  if (supportImageKey && imageResolver) {
    let resolvedImageAssetKey = supportImageKey;
    let image = imageResolver(supportImageKey, skillId);
    if (image) {
      item.imagePath = image;
      item.imageUrl = image;
      item.targetImage = image;
      item.targetImagePath = image;
      item.resolvedImageAssetKey = resolvedImageAssetKey;
    }
    item.imageAlt = raw.imgAlt || raw.supportImageAlt || String(raw.target || supportImageKey);
  }
  if (decisionSuppliesTarget && mediaDecision?.paths?.[0]) {
    const image = mediaDecision.paths[0];
    item.imagePath = image;
    item.imageUrl = image;
    item.targetImage = image;
    item.targetImagePath = image;
    item.resolvedImageAssetKey = image;
    item.imageAlt = mediaDecision.alt || "Picture support for this literacy question";
  }
  return item;
}

export function expandBank(source, blueprint, imageResolver) {
  const named = { ...blueprint, skillName: source.skillName || blueprint.skillId };
  const resolver = imageResolver || source.imageResolver;
  const items = source.items.map(raw => expandItem(raw, named, resolver));

  // Balance key positions inside each independently delivered level/form
  // bucket. Runtime shuffling still applies, but the authored bank itself must
  // never teach a child that one screen position is usually correct.
  for (const level of [1, 2]) {
    for (const form of ["A", "B", "C", "R"]) {
      const bucket = items.filter(item => (
        item.level === level
        && item.form === form
        && item.choices.length === 4
      ));
      const start = stableChoiceOffset(`${blueprint.skillId}:${level}:${form}`, 4);
      bucket.forEach((item, index) => {
        const desiredPosition = (start + index) % 4;
        const currentPosition = item.choices.findIndex(choice => norm(choice) === norm(item.answer));
        if (currentPosition < 0 || currentPosition === desiredPosition) return;
        const offset = (currentPosition - desiredPosition + item.choices.length) % item.choices.length;
        item.choices = rotate(item.choices, offset);
        if (Array.isArray(item.answerOptions)) item.answerOptions = rotate(item.answerOptions, offset);
        if (Array.isArray(item.imageCards)) item.imageCards = rotate(item.imageCards, offset);
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Lints (AUTHORING_STANDARDS §1–§4). Each returns [{code, itemId, message}].
// ---------------------------------------------------------------------------
export function lintBank(items, blueprint, {
  knownWords = new Set(),
  approvedDevErrors = new Set(),
  imageWords = new Set(),
  phonics = {}
} = {}) {
  const issues = [];
  const push = (code, itemId, message) => issues.push({ code, itemId, message });
  const seenIds = new Set();
  const seenOptionSets = new Map();
  const seenPromptAnswers = new Map();
  const wordChoiceFormats = new Set([
    "DIGRAPH_IMAGE_CHOICE", "BLEND_IMAGE_CHOICE", "RHYME_MATCH_PICTURE", "READ_FIND_RHYME",
    "RHYME_ODD_ONE_OUT", "PICTURE_TO_PRINT_MATCH", "GRAMMAR_IMAGE_CHOICE", "GRAMMAR_WORD_CHOICE",
    "HFW_READ_FIND_WORD", "HFW_AUDIO_FIND_WORD", "SHORT_VOWEL_WORD", "MPD", "CPS"
  ]);

  for (const item of items) {
    // L-SCHEMA
    if (seenIds.has(item.id)) push("L-SCHEMA", item.id, "duplicate id");
    seenIds.add(item.id);
    const keyCount = item.choices.filter(c => norm(c) === norm(item.answer)).length;
    if (!item.answer) push("L-SCHEMA", item.id, "no key marked");
    if (item.choices.length && keyCount !== 1) push("L-SCHEMA", item.id, `answer appears ${keyCount}x in choices`);
    if (item.choices.length && item.choices.length !== 4 && !["HFW_LETTER_BUILD", "PUT_SOUNDS_IN_ORDER", "HFW_SENTENCE_SPELL_CONTEXT"].includes(item.formatType)) {
      push("L-SCHEMA", item.id, `expected 4 choices, got ${item.choices.length}`);
    }
    if (item.formatType === "PUT_SOUNDS_IN_ORDER" && (!Array.isArray(item.soundTiles) || item.soundTiles.length < 2)) {
      push("L-SCHEMA", item.id, "tile format needs soundTiles (>=2)");
    }
    if (["HFW_LETTER_BUILD", "HFW_SENTENCE_SPELL_CONTEXT"].includes(item.formatType)) {
      const word = norm(item.answer).replace(/ /g, "");
      if (!Array.isArray(item.letterTiles) || item.letterTiles.length < word.length) {
        push("L-SCHEMA", item.id, "letter-build needs a letterTiles bank covering the answer");
      } else {
        const bank = [...item.letterTiles.map(t => norm(t))];
        for (const letter of word) {
          const idx = bank.indexOf(letter);
          if (idx === -1) { push("L-SCHEMA", item.id, `letter bank missing "${letter}"`); break; }
          bank.splice(idx, 1);
        }
      }
    }
    const allUnits = new Set([
      ...(blueprint.unitsByLevel?.[1] || []),
      ...(blueprint.unitsByLevel?.[2] || []),
      ...(blueprint.nonGatingUnits || [])
    ]);
    if (!allUnits.has(item.itemKey)) push("L-SCHEMA", item.id, `itemKey ${item.itemKey} not in blueprint units`);
    if (!(blueprint.formatsByLevel?.[item.level] || []).includes(item.formatType)) {
      push("L-SCHEMA", item.id, `format ${item.formatType} not allowed at level ${item.level}`);
    }
    for (const [text, rationale] of Object.entries(item.distractorRationales || {})) {
      if (!RATIONALE_CODES.has(rationale)) push("L-DIST", item.id, `unknown rationale ${rationale} for "${text}"`);
    }
    const distractors = item.choices.filter(c => norm(c) !== norm(item.answer));
    if (item.choices.length === 4 && distractors.some(d => !(item.distractorRationales || {})[d])) {
      push("L-DIST", item.id, "distractor missing rationale code");
    }
    if (item.skillId === "antonyms_synonyms") {
      const rationales = Object.values(item.distractorRationales || {});
      if (rationales.includes("D-SEMANTIC")) {
        push("L-DIST", item.id, "antonym/synonym distractors may not use an unrelated semantic filler");
      }
      if (!rationales.includes("D-SAME-DOMAIN")) {
        push("L-DIST", item.id, "antonym/synonym item needs a same-domain misconception distractor");
      }
    }
    // A distractor must be real, plausible, and rationale-coded. Requiring two
    // *different* codes per item is not an integrity rule: many sound, grammar,
    // spatial, and comprehension questions intentionally present three
    // alternatives from the same misconception family. Format-specific laws
    // below check the distinctions that actually matter.

    // L-GRAM — broken frames that shipped in the old bank
    const promptText = `${item.prompt} ${item.sentence || ""}`;
    if (/\ba ([aeiou])/i.test(promptText)) push("L-GRAM", item.id, `article error: "a ${promptText.match(/\ba ([aeiou])\w*/i)?.[1]}..."`);
    if (/\b(?:choose|pick) the precise word means\b/i.test(promptText)) {
      push("L-GRAM", item.id, "broken 'precise word means' frame");
    }
    if (/\s{2,}/.test(item.prompt)) push("L-GRAM", item.id, "double space in prompt");
    if ((item.sentence || "").includes("___") === false && /HFW_SENTENCE|SENTENCE_FIT|SPELLING_CONTEXT|CONTEXT_CLOZE|PRECISION|WORD_IN_SENTENCE/.test(item.formatType) && !/___/.test(promptText) && !item.passage) {
      push("L-GRAM", item.id, "cloze format without a ___ blank");
    }

    // L-READ
    const promptWords = item.prompt.split(/\s+/).filter(Boolean).length;
    const passageWords = (item.passage || "").split(/\s+/).filter(Boolean).length;
    const sentenceWords = (item.sentence || "").split(/\s+/).filter(Boolean).length;
    if (item.level === 1 && promptWords > 12) push("L-READ", item.id, `L1 prompt ${promptWords} words`);
    if (item.level === 2 && promptWords > 16) push("L-READ", item.id, `L2 prompt ${promptWords} words`);
    if (item.level === 1 && sentenceWords > 9) push("L-READ", item.id, `L1 sentence ${sentenceWords} words`);
    if (item.level === 2 && sentenceWords > 12) push("L-READ", item.id, `L2 sentence ${sentenceWords} words`);
    if (item.level === 1 && passageWords > 60) push("L-READ", item.id, `L1 passage ${passageWords} words`);
    if (item.level === 2 && passageWords > 110) push("L-READ", item.id, `L2 passage ${passageWords} words`);

    // L-LEX — when a blueprint unit has an approved pronunciation list, a
    // target word must be explicitly present in that list.
    const approvedPatternWords = phonics[item.itemKey];
    const targetWord = norm(item.targetWord || "");
    if (
      Array.isArray(approvedPatternWords)
      && targetWord
      && !approvedPatternWords.map(norm).includes(targetWord)
    ) {
      push("L-LEX", item.id, `"${targetWord}" is not approved for pattern ${item.itemKey}`);
    }

    // L-REALWORD for single-word choice formats
    if (wordChoiceFormats.has(item.formatType) && knownWords.size) {
      for (const choice of item.choices) {
        const word = norm(choice);
        if (!/^[a-z']+$/.test(word.replace(/ /g, ""))) continue; // phrases exempt
        if (word.includes(" ")) continue;
        if (!knownWords.has(word) && !approvedDevErrors.has(word)) {
          push("L-REALWORD", item.id, `"${choice}" not in lexicon or approved error list`);
        }
      }
    }

    // L-AMBIG — a young learner must never be offered a partial ending that is
    // also literally true. L2 Final Sounds measures two-letter endings. For
    // example, "hand" does end in /d/ and "shell" does end in /l/, so bare d
    // and one-l distractors create a second defensible answer even though the
    // authored key is nd/ll.
    if (item.skillId === "final_sounds" && item.level === 2 && item.itemKey.length > 1) {
      const ending = norm(item.itemKey);
      const properSuffixes = Array.from(
        { length: ending.length - 1 },
        (_, index) => ending.slice(index + 1)
      ).filter(Boolean);
      const partialEndingChoices = distractors.filter(choice => {
        const value = norm(choice).replace(/[^a-z]/g, "");
        if (!value) return false;
        if (item.formatType === "ENDING_SOUND") return properSuffixes.includes(value);
        return properSuffixes.some(suffix => value.endsWith(suffix));
      });
      if (partialEndingChoices.length) {
        push(
          "L-AMBIG",
          item.id,
          `partial ending distractor(s) also fit the anchor: ${partialEndingChoices.join(", ")}`
        );
      }
      if (!/\btwo\b.*\b(?:letter|letters)\b/i.test(item.spokenPrompt || "")) {
        push("L-AMBIG", item.id, "L2 final-pattern audio must explicitly ask for two ending letters");
      }
    }
    if (/\b(?:every option parses|every pronoun parses|every verb parses|both parse|parses perfectly|slip-key|validly wrong)\b/i.test(item.notes || "")) {
      push("L-AMBIG", item.id, "author note admits that a distractor is also defensible");
    }

    // Concrete semantic opposites must have one defensible key for a young
    // learner. "Cold" and "cool" are both ordinary opposites of "hot" in
    // child language, so they cannot appear together in a single-key item.
    const normalizedChoices = new Set(item.choices.map(norm));
    if (
      item.skillId === "antonyms_synonyms"
      && normalizedChoices.has("cold")
      && normalizedChoices.has("cool")
      && /\bopposite\b/i.test(item.prompt || "")
    ) {
      push("L-AMBIG", item.id, "cold and cool are both defensible opposites of hot");
    }

    // Number words should leave exactly one number-compatible answer in a
    // plurals item. Semantic hints such as "on the wall" are not strong enough
    // to make cats uniquely better than hens for a five-year-old.
    if (
      item.skillId === "plurals"
      && ["PLURAL_SPELLING_CONTEXT", "PLURAL_TEXT_CHOICE"].includes(item.formatType)
    ) {
      const sentence = norm(item.sentence || item.prompt);
      const pluralSignal = /\b(?:two|three|four|five|six|ten|both|many|lots of|all(?: the)?)\b/.test(sentence);
      const singularSignal = /\b(?:one|just one|a single)\b/.test(sentence);
      const irregularPlurals = new Set(["children", "feet", "geese", "men", "mice", "people", "teeth", "women"]);
      const singularEndsInS = new Set(["bus"]);
      const isPluralNoun = value => {
        const word = norm(value);
        return irregularPlurals.has(word) || (word.endsWith("s") && !singularEndsInS.has(word));
      };
      const compatible = pluralSignal
        ? item.choices.filter(isPluralNoun)
        : singularSignal
          ? item.choices.filter(choice => !isPluralNoun(choice))
          : [];
      if ((pluralSignal || singularSignal) && compatible.length !== 1) {
        push(
          "L-AMBIG",
          item.id,
          `${compatible.length} choices match the sentence's singular/plural signal: ${compatible.join(", ")}`
        );
      }
    }

    // Image formats must only use words with real image assets
    if (item.imageCards) {
      for (const card of item.imageCards) {
        if (!card.image) push("L-MEDIA", item.id, `no image asset for "${card.word}"`);
        else if (!imageWords.has(card.word) && !fs.existsSync(path.join(ROOT, "public", card.image.replace(/^\//, "")))) {
          push("L-MEDIA", item.id, `image file missing for "${card.word}": ${card.image}`);
        }
      }
    }
    if (item.sequenceCards) {
      for (const card of item.sequenceCards) {
        if (!card.image) push("L-MEDIA", item.id, `no sequence image asset for "${card.value}"`);
        else if (!fs.existsSync(path.join(ROOT, "public", card.image.replace(/^\//, "")))) {
          push("L-MEDIA", item.id, `sequence image file missing for "${card.value}": ${card.image}`);
        }
      }
    }
    if (item.imagePath && !fs.existsSync(path.join(ROOT, "public", item.imagePath.replace(/^\//, "")))) {
      push("L-MEDIA", item.id, `target image missing: ${item.imagePath}`);
    }
    // Fail closed: an image-required item with NO resolved image at all is a
    // defect, not a vacuous pass. (The old lint only checked images that were
    // present, so a bank expanded without a resolver sailed through with
    // image-less picture items — caught by the live browser critic.)
    if (
      item.mediaTier === "image-required"
      && !item.imagePath
      && !(item.imageCards || []).length
      && !(item.sequenceCards || []).length
    ) {
      push("L-MEDIA", item.id, "image-required item has no resolved imagePath or imageCards");
    }

    const stimulusPath = norm(item.imagePath || item.targetImagePath || "");
    if (stimulusPath && (item.imageCards || []).some(card => norm(card.image || card.imagePath || "") === stimulusPath)) {
      push("L-MEDIA-INDEPENDENCE", item.id, "stimulus and answer card reuse the same image asset");
    }
    if (stimulusPath) {
      const stimulusHash = assetHash(stimulusPath);
      const duplicateCard = (item.imageCards || []).find(card => {
        const cardPath = card.image || card.imagePath || "";
        return norm(cardPath) !== stimulusPath && stimulusHash && assetHash(cardPath) === stimulusHash;
      });
      if (duplicateCard) {
        push("L-MEDIA-INDEPENDENCE", item.id, "stimulus and answer card contain byte-identical image content under different paths");
      }
    }

    // Validity contracts for formats where visible print can answer an audio,
    // picture, or sequencing construct without the child doing the skill.
    if (
      item.level === 1
      && ["RHYME_MATCH_PICTURE", "INITIAL_SOUND_PAIR_SELECT", "FINAL_SOUND_PAIR_SELECT"].includes(item.formatType)
      && !item.hideWrittenLabels
    ) {
      push("L-MODALITY", item.id, `${item.formatType} must hide written word labels`);
    }
    if (item.formatType === "RHYME_MATCH_PICTURE" && item.evidenceModality !== "audio+image") {
      push("L-MODALITY", item.id, "rhyming picture evidence must be declared audio+image");
    }
    if (item.formatType === "HFW_READ_FIND_WORD") {
      push("L-HFW-COPY", item.id, "read-find repeats the target in print; use audio-find evidence");
    }
    if (item.formatType === "HFW_AUDIO_FIND_WORD") {
      const target = norm(item.targetWord || item.answer);
      if (!target || item.audioRole !== "target_word") {
        push("L-MODALITY", item.id, "HFW audio-find needs a target word and target_word audio role");
      }
      if (target && norm(item.prompt).split(/[^a-z']+/).includes(target)) {
        push("L-HFW-COPY", item.id, "HFW prompt visibly contains the target word");
      }
    }
    if (item.skillId.startsWith("hfw_")) {
      const target = norm(item.targetWord || item.answer);
      const visibleTokens = norm(`${item.prompt || ""} ${item.sentence || ""}`)
        .split(/[^a-z']+/)
        .filter(Boolean);
      if (target && visibleTokens.includes(target)) {
        push("L-HFW-COPY", item.id, "visible HFW question text contains the target word");
      }
      if (item.formatType === "HFW_SENTENCE_CLOZE") {
        const allowedChoices = cumulativeHfwChoicesBySkill[item.skillId] || new Set();
        const outOfBandChoices = item.choices.filter(choice => !allowedChoices.has(norm(choice)));
        if (outOfBandChoices.length) {
          push(
            "L-HFW-BAND",
            item.id,
            `cloze choices must come from the current or an earlier approved HFW band: ${outOfBandChoices.join(", ")}`
          );
        }
      }
    }
    if (item.formatType === "PICTURE_SEQUENCE_ORDER") {
      if (!item.hideWrittenLabels || item.displayPassageDuringResponse !== false) {
        push("L-SEQUENCE-COPY", item.id, "picture sequencing must hide ordered passage and event labels during the response");
      }
      if (item.evidenceModality !== "audio+image") {
        push("L-MODALITY", item.id, "picture sequencing must be declared audio+image");
      }
    }
    if (item.formatType === "COMPREHENSION" && item.passage && !item.copyExempt) {
      const normalizedPassage = norm(item.passage).replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ");
      const normalizedAnswer = norm(item.answer).replace(/[^a-z0-9' ]/g, " ").replace(/\s+/g, " ");
      if (item.skillId === "sentence_comprehension" && normalizedAnswer && normalizedPassage.includes(normalizedAnswer)) {
        push("L-COMPREHENSION-VERBATIM", item.id, "correct answer is copied verbatim from the passage");
      }
      const scan = scannerAnswer(item);
      if (scan && norm(scan) === norm(item.answer)) {
        push("L-COMPREHENSION-COPY", item.id, "surface overlap points directly to the correct answer");
      }
    }
    if (
      item.skillId === "sentence_comprehension"
      && /\b(?:scene|picture)\b/i.test(item.prompt || "")
      && !item.imagePath
    ) {
      push("L-MEDIA-CONSTRUCT", item.id, "scene/picture question has no authored scoring image");
    }
    if (
      ["nouns", "verbs", "adjectives"].includes(item.skillId)
      && item.formatType === "GRAMMAR_IMAGE_CHOICE"
    ) {
      push("L-CONSTRUCT-WEAK", item.id, "grammar mastery must be decided in language context, not by object/action picture sorting");
    }

    // Option-set + prompt/answer duplicates (open-set formats only)
    const optionSig = optionSetSignature(item);
    if (optionSig && !CLOSED_SET_FORMATS.has(item.formatType)) {
      if (seenOptionSets.has(optionSig)) push("L-UNIQ-OPT", item.id, `option set duplicates ${seenOptionSets.get(optionSig)}`);
      else seenOptionSets.set(optionSig, item.id);
    }
    const paSig = promptAnswerSignature(item);
    if (seenPromptAnswers.has(paSig)) push("L-UNIQ-PA", item.id, `prompt+answer duplicates ${seenPromptAnswers.get(paSig)}`);
    else seenPromptAnswers.set(paSig, item.id);
  }

  // L-UNIQ-SKEL — passage/sentence skeleton similarity across the whole skill
  const withText = items.filter(i => (i.passage || "").split(" ").length >= 8 || (i.sentence || "").split(" ").length >= 6);
  const sigs = withText.map(i => ({ id: i.id, sh: shingles(`${i.passage || ""} ${i.sentence || ""}`) }));
  for (let a = 0; a < sigs.length; a++) {
    for (let b = a + 1; b < sigs.length; b++) {
      const similarity = jaccard(sigs[a].sh, sigs[b].sh);
      if (similarity >= 0.35) {
        issues.push({ code: "L-UNIQ-SKEL", itemId: sigs[b].id, message: `skeleton ${Math.round(similarity * 100)}% similar to ${sigs[a].id}` });
      }
    }
  }

  // L-COVER — every unit/phase has its blueprint counts, forms disjoint by content
  for (const level of [1, 2]) {
    const units = blueprint.unitsByLevel?.[level] || [];
    const levelItems = items.filter(i => i.level === level && !i.retentionOnly && !i.nonGating);
    for (const unit of units) {
      const unitItems = levelItems.filter(i => i.itemKey === unit);
      const want = blueprint.variantsPerUnit?.[level] || 3;
      if (unitItems.length < want) {
        issues.push({ code: "L-COVER", itemId: `${blueprint.skillId}.l${level}.${unit}`, message: `unit ${unit} has ${unitItems.length}/${want} items at level ${level}` });
      }
      const formats = new Set(unitItems.map(i => i.formatType));
      const rule = blueprint.unitRule;
      if (formats.size < rule.formatsMin) {
        issues.push({ code: "L-COVER", itemId: `${blueprint.skillId}.l${level}.${unit}`, message: `unit ${unit} has ${formats.size}/${rule.formatsMin} formats at level ${level}` });
      }
      const distinct = new Set(unitItems.map(i => promptAnswerSignature(i)));
      if (distinct.size < rule.distinctItemsMin) {
        issues.push({ code: "L-COVER", itemId: `${blueprint.skillId}.l${level}.${unit}`, message: `unit ${unit} lacks ${rule.distinctItemsMin} genuinely distinct items` });
      }
    }
    // key balance
    const answerCounts = new Map();
    for (const item of levelItems) answerCounts.set(norm(item.answer), (answerCounts.get(norm(item.answer)) || 0) + 1);
    for (const [answer, count] of answerCounts) {
      if (count > Math.max(3, Math.ceil(levelItems.length * 0.2)) && units.length > 5) {
        issues.push({ code: "L-KEY-BALANCE", itemId: `${blueprint.skillId}.l${level}`, message: `answer "${answer}" keys ${count} items at level ${level}` });
      }
    }
  }

  // O-5: key positions must be balanced inside every independently delivered
  // level/form bucket. Runtime shuffling remains belt-and-braces; authored
  // banks must not rely on it to hide an all-first answer pattern.
  for (const level of [1, 2]) {
    for (const form of ["A", "B", "C", "R"]) {
      const bucket = items.filter(item => (
        item.level === level
        && item.form === form
        && item.choices.length === 4
      ));
      if (bucket.length < 4) continue;
      const positions = [0, 0, 0, 0];
      for (const item of bucket) {
        const position = item.choices.findIndex(choice => norm(choice) === norm(item.answer));
        if (position >= 0) positions[position] += 1;
      }
      const maxShare = Math.max(...positions) / bucket.length;
      // Four answer positions cannot satisfy a literal 35% ceiling in small
      // buckets such as five retention items (the best possible split is
      // 2/1/1/1 = 40%). Require the best attainable ceiling.
      const attainableCeiling = Math.max(0.35, Math.ceil(bucket.length / 4) / bucket.length);
      if (maxShare > attainableCeiling) {
        issues.push({
          code: "L-KEY-BALANCE",
          itemId: `${blueprint.skillId}.l${level}.${form}`,
          message: `key positions ${positions.join("/")} exceed the 35% cap`
        });
      }
    }
  }

  return issues;
}

// A renamed or recompressed copy evades path and byte-hash checks. Compare a
// normalized, tightly-cropped thumbnail of the scoring stimulus with the
// keyed answer card so near-duplicate artwork also fails closed.
export async function lintPerceptualMediaIndependence(items) {
  const issues = [];
  const { default: sharp } = await import("sharp");
  const thumbnail = async assetPath => sharp(publicAssetPath(assetPath))
    .flatten({ background: "white" })
    .trim({ background: "white", threshold: 8 })
    .resize(32, 32, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();

  for (const item of items) {
    const stimulusPath = item.imagePath || item.targetImagePath || "";
    if (!stimulusPath || !fs.existsSync(publicAssetPath(stimulusPath))) continue;
    const answerCard = (item.imageCards || []).find(card => norm(card.value || card.word) === norm(item.answer));
    const answerPath = answerCard?.image || answerCard?.imagePath || "";
    if (!answerPath || !fs.existsSync(publicAssetPath(answerPath)) || norm(answerPath) === norm(stimulusPath)) continue;
    try {
      const [stimulus, answer] = await Promise.all([thumbnail(stimulusPath), thumbnail(answerPath)]);
      if (stimulus.length !== answer.length || !stimulus.length) continue;
      let absoluteDifference = 0;
      for (let index = 0; index < stimulus.length; index += 1) {
        absoluteDifference += Math.abs(stimulus[index] - answer[index]);
      }
      const meanDifference = absoluteDifference / stimulus.length;
      if (meanDifference <= 1.5) {
        issues.push({
          code: "L-MEDIA-INDEPENDENCE",
          itemId: item.id,
          message: `stimulus and keyed answer artwork are perceptually near-identical (mean pixel delta ${meanDifference.toFixed(2)})`
        });
      }
    } catch (error) {
      issues.push({ code: "L-MEDIA", itemId: item.id, message: `could not compare scoring media: ${error.message}` });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Simulations (MASTERY_SYSTEM §9) — run against built bank + skillStatusPolicy.
// Selection model mirrors the runtime ladder: unseen-first, unit-coverage-first.
// ---------------------------------------------------------------------------
export function composeSitting(bank, { level, phase = null, seen, sittingSize, unitEvidence }) {
  const pool = bank.filter(i =>
    i.level === level
    && (phase == null || i.phase === phase)
    && !i.retentionOnly
    && !seen.has(i.id)
  );
  const byNeed = [...pool].sort((a, b) => (unitEvidence.get(a.itemKey) || 0) - (unitEvidence.get(b.itemKey) || 0));
  const chosen = [];
  const usedUnits = new Map();
  // Spread-first: with many units (cap 1), stacking a unit twice in one sitting
  // wastes an attempt — its session-count only rises once per day, so the unit
  // still needs another sitting anyway. Strict cap keeps every slot advancing a
  // unit's day-spread; the top-up below relaxes it only when slots would starve.
  const unitCount_ = new Set(pool.map(p => p.itemKey)).size;
  const cap = Math.max(1, Math.ceil(sittingSize / Math.max(1, unitCount_)));
  for (const item of byNeed) {
    if (chosen.length >= sittingSize) break;
    if ((usedUnits.get(item.itemKey) || 0) >= cap) continue;
    chosen.push(item);
    usedUnits.set(item.itemKey, (usedUnits.get(item.itemKey) || 0) + 1);
  }
  // top up if caps starved the sitting
  for (const item of byNeed) {
    if (chosen.length >= sittingSize) break;
    if (!chosen.includes(item)) chosen.push(item);
  }
  return chosen;
}

export async function simulate(bank, blueprint, { policy, answerFn, maxSittings = 12, retentionAnswerFn }) {
  const DAY = 24 * 60 * 60 * 1000;
  const T0 = Date.parse("2026-09-01T02:00:00Z");
  const ledger = [];
  const seen = new Set();
  const repeats = [];
  const shortSittings = [];
  const seenSignatures = new Set();
  let sittings = 0;
  const levelSittings = { 1: 0, 2: 0 };
  const nowFor = () => T0 + (sittings + 6) * DAY; // stays inside the 90-day window

  for (const level of [1, 2]) {
    for (const phase of [1, 2]) {
      for (let s = 0; s < maxSittings; s++) {
        const status = policy.computeSkillStatus(ledger, blueprint, { now: nowFor() });
        const levelRow = level === 1 ? status.level1 : status.level2;
        if (levelRow.phases[phase].passed) break;
        const unitEvidence = new Map();
        for (const attempt of ledger) unitEvidence.set(attempt.itemKey, (unitEvidence.get(attempt.itemKey) || 0) + 1);
        const sitting = composeSitting(bank, {
          level,
          phase,
          seen,
          sittingSize: blueprint.sitting,
          unitEvidence
        });
        if (!sitting.length) break;
        if (sitting.length < blueprint.sitting) {
          shortSittings.push({
            level,
            phase,
            sittingIndex: s,
            actualSize: sitting.length,
            requiredSize: blueprint.sitting
          });
        }
        sittings++;
        levelSittings[level] += 1;
        for (const item of sitting) {
          if (seen.has(item.id)) repeats.push(item.id);
          const signature = promptAnswerSignature(item) + "||" + optionSetSignature(item);
          if (seenSignatures.has(signature)) repeats.push(`sig:${item.id}`);
          seenSignatures.add(signature);
          seen.add(item.id);
          const correct = answerFn(item);
          ledger.push({
            itemId: item.id, itemKey: item.itemKey, itemType: item.itemType,
            level: item.level, phase: item.phase, formatType: item.formatType,
            isCorrect: correct, responseState: correct ? "correct" : "incorrect",
            mode: "formal", sittingId: `sim-${level}-${phase}-${s}`,
            sittingCompleted: true,
            sittingPlannedSize: sitting.length,
            timestamp: T0 + sittings * DAY
          });
        }
      }
    }
  }

  // retention
  const retentionPool = bank.filter(i => i.retentionOnly);
  const retentionSet = retentionPool.slice(0, 8);
  for (const item of retentionSet) {
    if (seen.has(item.id)) repeats.push(`retention:${item.id}`);
    const correct = (retentionAnswerFn || answerFn)(item);
    ledger.push({
      itemId: item.id, itemKey: item.itemKey, itemType: item.itemType,
      level: item.level, phase: item.phase, formatType: item.formatType,
      isCorrect: correct, responseState: correct ? "correct" : "incorrect",
      mode: "retention", sittingId: "sim-retention",
      sittingCompleted: true,
      sittingPlannedSize: retentionSet.length,
      timestamp: T0 + (sittings + 4) * DAY
    });
  }

  const final = policy.computeSkillStatus(ledger, blueprint, { now: T0 + (sittings + 6) * DAY });
  return { final, sittings, levelSittings, repeats, shortSittings, ledgerSize: ledger.length, ledger };
}

export async function simulateRegression(bank, blueprint, { policy }) {
  const DAY = 24 * 60 * 60 * 1000;
  const perfect = await simulate(bank, blueprint, { policy, answerFn: () => true });
  // Begin the regression scenario immediately after the four formal phases.
  // The perfect-path simulation also includes a later retention check; keeping
  // that future record here would make the chronology impossible when we append
  // a new Phase 2 result and would falsely mark the old retention as premature.
  const ledger = perfect.ledger.filter(row => row.mode !== "retention");
  const lastTimestamp = Math.max(...ledger.map(row => Number(row.timestamp || 0)));
  const representatives = composeSitting(bank, {
    level: 2,
    phase: 2,
    seen: new Set(),
    sittingSize: blueprint.sitting,
    unitEvidence: new Map()
  });
  for (let index = 0; index < representatives.length; index++) {
    const item = representatives[index];
    const correct = index < Math.floor(representatives.length * 0.3);
    ledger.push({
      itemId: item.id,
      itemKey: item.itemKey,
      itemType: item.itemType,
      level: 2,
      phase: 2,
      formatType: item.formatType,
      isCorrect: correct,
      responseState: correct ? "correct" : "incorrect",
      mode: "formal",
      sittingId: "sim-regression-fail",
      sittingCompleted: true,
      sittingPlannedSize: representatives.length,
      timestamp: lastTimestamp + DAY
    });
  }
  const afterFailure = policy.computeSkillStatus(ledger, blueprint, { now: lastTimestamp + 2 * DAY });

  for (const item of representatives) {
    ledger.push({
      itemId: `${item.id}:clean`,
      itemKey: item.itemKey,
      itemType: item.itemType,
      level: 2,
      phase: 2,
      formatType: item.formatType,
      isCorrect: true,
      responseState: "correct",
      mode: "formal",
      sittingId: "sim-regression-clean",
      sittingCompleted: true,
      sittingPlannedSize: representatives.length,
      timestamp: lastTimestamp + 2 * DAY
    });
  }
  const afterClean = policy.computeSkillStatus(ledger, blueprint, { now: lastTimestamp + 3 * DAY });

  const retentionPool = bank.filter(item => item.retentionOnly).slice(0, 8);
  for (let index = 0; index < retentionPool.length; index++) {
    const item = retentionPool[index];
    const correct = index < 4;
    ledger.push({
      itemId: `${item.id}:failed-retention`,
      itemKey: item.itemKey,
      itemType: item.itemType,
      level: item.level,
      phase: item.phase,
      formatType: item.formatType,
      isCorrect: correct,
      responseState: correct ? "correct" : "incorrect",
      mode: "retention",
      sittingId: "sim-regression-retention-fail",
      sittingCompleted: true,
      sittingPlannedSize: retentionPool.length,
      timestamp: lastTimestamp + 4 * DAY
    });
  }
  const afterRetentionFailure = policy.computeSkillStatus(ledger, blueprint, { now: lastTimestamp + 5 * DAY });

  return {
    afterFailure,
    afterClean,
    afterRetentionFailure,
    pass: Boolean(
      afterFailure?.needsReview
      && !afterClean?.needsReview
      && afterRetentionFailure?.needsReview
      && afterRetentionFailure?.status !== "secure"
    )
  };
}

// Leak oracle for SIM-SCANNER (AUTHORING_STANDARDS §6).
// Strategies are construct-matched: letter-chunk scanning is the real threat on
// phonics/word items (short printed options, pattern chunks); for passage
// comprehension the real test-taking shortcut is "pick the option that repeats
// the passage's words" — so passage items are judged on strict word-overlap
// dominance and option-length tells, not 2-letter chunk noise.
export function scannerAnswer(item) {
  const choices = item.choices || [];
  if (!choices.length) return null;
  // Picture-to-sentence evidence is intentionally decided from the authored
  // scoring image, not from printed overlap with a generic instruction.
  if (item.constructClaim === "picture_to_sentence_meaning") return null;
  // Hidden-label picture cards expose images and audio, not their underlying
  // word strings. A print scanner cannot use text that the child never sees.
  if (item.hideWrittenLabels) return null;
  // Tile-arrange items display the answer's own phonemes/letters scrambled —
  // there is no printed option set to surface-match, so nothing to scan.
  if (Array.isArray(item.soundTiles) && item.soundTiles.length) return null;
  if (Array.isArray(item.letterTiles) && item.letterTiles.length) return null;

  // HFW questions are recognition/recall tasks, not letter-chunk tasks. Only
  // an exact printed copy of the target is a usable visual shortcut; incidental
  // two-letter overlaps such as is in "Listen" are not answer evidence.
  if (item.skillId?.startsWith("hfw_")) {
    const target = norm(item.targetWord || item.answer);
    const visibleTokens = norm(`${item.prompt || ""} ${item.sentence || ""}`)
      .split(/[^a-z']+/)
      .filter(Boolean);
    return target && visibleTokens.includes(target) ? item.answer : null;
  }

  if (item.passage) {
    // Verbatim-dominance test: fires when one option clearly out-quotes the
    // passage relative to the others (raw margin ≥2 words, or a strong density
    // lead). Quote-format cells (evidence_pick) tie naturally — every option
    // quotes — while a verbatim detail-decoy beats an abstract key, which is
    // the designed wrong answer for surface matchers.
    const passageWords = new Set(norm(item.passage).split(/[^a-z]+/).filter(w => w.length >= 4));
    const scored = choices.map(c => {
      const words = [...new Set(norm(c).split(/[^a-z]+/))].filter(w => w.length >= 4);
      const n = words.filter(w => passageWords.has(w)).length;
      return { c, n, density: words.length ? n / words.length : 0 };
    });
    const byCount = [...scored].sort((a, b) => b.n - a.n);
    if (byCount[0].n >= (byCount[1]?.n || 0) + 2) return byCount[0].c;
    const byDensity = [...scored].sort((a, b) => b.density - a.density);
    if (byDensity[0].density > 0.6 && byDensity[0].density >= (byDensity[1]?.density || 0) + 0.25) {
      return byDensity[0].c;
    }
    const byLength = [...choices].sort((a, b) => b.length - a.length);
    if (byLength[0].length >= (byLength[1]?.length || 0) + 12) return byLength[0];
    return null;
  }

  const promptWords = norm(`${item.prompt} ${item.sentence || ""}`).split(/[^a-z]+/).filter(w => w.length >= 2);

  // 1. longest shared letter-chunk (>=2) with any prompt word
  const chunkScore = choice => {
    const c = norm(choice);
    let best = 0;
    for (const w of promptWords) {
      for (let len = Math.min(c.length, w.length); len >= 2; len--) {
        for (let i = 0; i + len <= c.length; i++) {
          if (w.includes(c.slice(i, i + len))) { best = Math.max(best, len); break; }
        }
        if (best >= len) break;
      }
    }
    return best;
  };
  const scored = choices.map(c => ({ c, s: chunkScore(c) }));
  scored.sort((a, b) => b.s - a.s);
  if (scored[0].s >= 2 && scored[0].s > (scored[1]?.s || 0)) return scored[0].c;

  // 2. pattern letters named in prompt appear in exactly one option
  const patternMatches = choices.filter(c => promptWords.some(w => w.length <= 3 && norm(c).includes(w)));
  if (patternMatches.length === 1) return patternMatches[0];

  // 4. longest option
  const byLength = [...choices].sort((a, b) => b.length - a.length);
  if (byLength[0].length >= (byLength[1]?.length || 0) + 8) return byLength[0];

  // 5. option repeating a passage word (comprehension)
  if (item.passage) {
    const passageWords = new Set(norm(item.passage).split(/[^a-z]+/));
    const overlap = choices.map(c => ({ c, n: norm(c).split(/[^a-z]+/).filter(w => w.length > 3 && passageWords.has(w)).length }));
    overlap.sort((a, b) => b.n - a.n);
    if (overlap[0].n > 0 && overlap[0].n > (overlap[1]?.n || 0)) return overlap[0].c;
  }
  return null;
}

export function generatedBankSource(skillId, items) {
  const banner = `// GENERATED by tools/assessmentRebuild/build.mjs from tools/assessmentRebuild/authoring/${skillId}.mjs\n// Hand-edit the authoring source, never this file. Standard: docs/skills-assessment-rebuild/\n`;
  return `${banner}export const questions = ${JSON.stringify(items, null, 1)};\n`;
}

export function writeGeneratedBank(skillId, items) {
  fs.mkdirSync(BANKS_DIR, { recursive: true });
  const file = path.join(BANKS_DIR, `${skillId}.v3.generated.js`);
  fs.writeFileSync(file, generatedBankSource(skillId, items));
  return file;
}

// Word → image path index over everything that actually exists in public/images,
// preferring the curated assessment dirs. Authoring resolvers use this so an
// item can never reference an image that is not on disk (L-MEDIA re-verifies).
let IMAGE_INDEX = null;
export function buildImageIndex() {
  if (IMAGE_INDEX) return IMAGE_INDEX;
  const priority = [
    "images/assessment/long-vowels", "images/assessment/digraphs", "images/assessment/blends",
    "images/assessment/hfw", "images/assessment/rhyming", "images/assessment/language",
    "images/child-mode/short-a", "images/child-mode/short-e", "images/child-mode/short-i",
    "images/child-mode/short-o", "images/child-mode/short-u", "images/child-mode",
    "images/vocabulary", "images/objects", "images/cvc", "images/vowels", "images/prepositions"
  ];
  const index = new Map();
  const rank = file => {
    const i = priority.findIndex(p => file.startsWith(p));
    return i === -1 ? priority.length : i;
  };
  const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(webp|png|svg|jpg|jpeg)$/i.test(entry.name)) continue;
      const stem = entry.name.replace(/\.[a-z]+$/i, "").toLowerCase();
      const rel = path.relative(path.join(ROOT, "public"), full).split(path.sep).join("/");
      const add = key => {
        if (!key) return;
        const existing = index.get(key);
        if (!existing || rank(rel) < rank(existing)) index.set(key, rel);
      };
      add(stem);

      // Curated assessment variants are intentionally numbered so the same
      // concept can appear in several forms. The authoring bank asks for the
      // concept ("swing"), not a filename variant ("swing-03").
      const numberedBase = stem.replace(/-\d+$/, "");
      if (numberedBase !== stem) add(numberedBase);

      // Relationship, homophone and plural art is stored as paired concepts
      // such as cold-chilly-01 or banana-bananas-01. Either named concept can
      // legitimately reuse that approved illustration as visual support.
      if (
        /^images\/assessment\/language\/variants\/(?:antonyms-synonyms|homophones-homonyms|plurals)\//.test(rel)
      ) {
        for (const token of numberedBase.split("-")) {
          if (token.length >= 2) add(token);
        }
      }
    }
  };
  const imagesRoot = path.join(ROOT, "public", "images");
  if (fs.existsSync(imagesRoot)) walk(imagesRoot);
  IMAGE_INDEX = index;
  return index;
}

export function makeImageResolver(preferredDirs = []) {
  const index = buildImageIndex();
  const approvedPath = value => ASSESSMENT_IMAGE_ALIAS_BY_SOURCE[`/${String(value || "").replace(/^\//, "")}`]
    || `/${String(value || "").replace(/^\//, "")}`;
  return word => {
    const stem = norm(word).replace(/ /g, "-");
    // The objective-word library is the assessment-wide authority for concepts
    // that have failed semantic, simplicity, or crop review. Prefer it before
    // skill-local legacy art so one reviewed replacement repairs every current
    // assessment area that uses the same represented word.
    const objectiveCandidate = `images/assessment/objective-words/${stem}.webp`;
    if (fs.existsSync(path.join(ROOT, "public", objectiveCandidate))) {
      return approvedPath(objectiveCandidate);
    }
    for (const dir of preferredDirs) {
      const candidate = `images/assessment/${dir}/${stem}.webp`;
      if (fs.existsSync(path.join(ROOT, "public", candidate))) return approvedPath(candidate);
    }
    const found = index.get(stem) || index.get(norm(word).replace(/ /g, "_"));
    return found ? approvedPath(found) : null;
  };
}

export function loadLexicon() {
  const lexiconPath = path.join(ROOT, "src", "content", "lexicon", "approvedWords.json");
  if (!fs.existsSync(lexiconPath)) return { knownWords: new Set(), approvedDevErrors: new Set(), phonics: {} };
  const data = JSON.parse(fs.readFileSync(lexiconPath, "utf8"));
  return {
    knownWords: new Set((data.words || []).map(norm)),
    approvedDevErrors: new Set((data.approvedDevErrors || []).map(norm)),
    phonics: data.phonics || {}
  };
}
