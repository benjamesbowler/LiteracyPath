// Skills Assessment Rebuild v3 — shared library for build, lints, sims, gate.
// Spec: docs/skills-assessment-rebuild/{MASTERY_SYSTEM,AUTHORING_STANDARDS}.md

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "..", "..");

import { V3_QUESTION_SOURCE } from "../../src/content/blueprints/skillBlueprints.js";
export const V3_SOURCE = V3_QUESTION_SOURCE;
export const AUTHORING_DIR = path.join(ROOT, "tools", "assessmentRebuild", "authoring");
export const BANKS_DIR = path.join(ROOT, "src", "data", "v3", "banks");
export const STATUS_FILE = path.join(ROOT, "src", "content", "assessments", "v3", "assessmentRebuildStatus.generated.js");
export const REPORT_DIR = path.join(ROOT, "docs", "validation");

export const RATIONALE_CODES = new Set([
  "KEY",
  "D-ONSET", "D-RIME-NEAR", "D-VOWEL", "D-PATTERN-TRAP", "D-POSITION", "D-VISUAL-NEIGHBOR",
  "D-FUNCTION-SWAP", "D-HOMOPHONE", "D-MORPH-LITERAL", "D-DEVELOPMENTAL", "D-SEMANTIC",
  "D-DETAIL-AS-MAIN", "D-TOPIC-ADJACENT", "D-SEQUENCE-SWAP", "D-CAUSE-REVERSE",
  "D-PLAUSIBLE-UNSUPPORTED", "D-OPPOSITE"
]);

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
  "LONG_VOWEL_TEAM_COMPLETE", "PLURAL_TEXT_CHOICE"
]);

export function optionSetSignature(item) {
  return (item.choices || []).map(c => norm(c.text ?? c)).sort().join("|");
}
export function promptAnswerSignature(item) {
  return `${norm(item.prompt)}||${norm(item.passage || "")}||${norm(item.answer)}`;
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

export function expandItem(raw, blueprint, imageResolver) {
  const skillId = blueprint.skillId;
  const level = raw.lvl >= 2 ? 2 : 1;
  const key = raw.choices.find(c => c.k);
  const form = raw.retention ? "R" : (raw.form || FORM_BY_VARIANT[raw.v] || "A");
  const id = `lp3.${skillId}.l${level}.${form}.${raw.u}.v${raw.v}${raw.retention ? "r" : ""}`;
  const choices = raw.choices.map(c => c.t);
  const answer = key ? key.t : "";
  const phase = raw.ph || 1;
  const targetWord = raw.target || (raw.img ? raw.img : undefined);

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
    spokenPrompt: raw.spoken || raw.prompt,
    sentence: raw.sentence,
    passage: raw.passage,
    cell: raw.cell,
    choices,
    answerOptions: raw.cards
      ? undefined
      : choices.map(text => ({ value: text, label: text, text })),
    answer,
    correctAnswer: answer,
    distractorRationales: Object.fromEntries(raw.choices.filter(c => !c.k).map(c => [c.t, c.r])),
    mediaTier: raw.media || (raw.cards ? "image-required" : "text"),
    phonicsPosition: raw.pos,
    hadPTD: Boolean(raw.hadPTD || raw.choices.some(c => c.r === "D-PATTERN-TRAP")),
    crossPatternGroup: raw.cross || undefined,
    nonGating: Boolean(raw.nonGating),
    retentionOnly: Boolean(raw.retention),
    targetWord,
    // Which media the AUTHOR declared. The runtime loader strips any
    // enrichment-added target media beyond this, so unapproved manifest paths
    // can never ride in on a v3 item (media QA stays fail-closed).
    v3AuthoredMedia: { target: Boolean(raw.img), cards: Boolean(raw.cards) },
    active: true,
    qaStatus: "approved",
    source: V3_SOURCE,
    provenance: { author: "claude-fable-5", wave: raw.wave || "", date: "2026-07-29", reviewedBy: [], signedOffBy: null },
    notes: raw.note || ""
  };

  if (raw.cards && imageResolver) {
    const cards = raw.cards.map(word => {
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
  if (raw.img && imageResolver) {
    const image = imageResolver(raw.img, skillId);
    item.imagePath = image;
    item.imageUrl = image;
    item.targetImage = image;
    item.targetImagePath = image;
    item.imageAlt = raw.imgAlt || raw.img;
  }
  return item;
}

export function expandBank(source, blueprint, imageResolver) {
  const named = { ...blueprint, skillName: source.skillName || blueprint.skillId };
  const resolver = imageResolver || source.imageResolver;
  return source.items.map(raw => expandItem(raw, named, resolver));
}

// ---------------------------------------------------------------------------
// Lints (AUTHORING_STANDARDS §1–§4). Each returns [{code, itemId, message}].
// ---------------------------------------------------------------------------
export function lintBank(items, blueprint, { knownWords = new Set(), approvedDevErrors = new Set(), imageWords = new Set() } = {}) {
  const issues = [];
  const push = (code, itemId, message) => issues.push({ code, itemId, message });
  const seenIds = new Set();
  const seenOptionSets = new Map();
  const seenPromptAnswers = new Map();
  const wordChoiceFormats = new Set([
    "DIGRAPH_IMAGE_CHOICE", "BLEND_IMAGE_CHOICE", "RHYME_MATCH_PICTURE", "READ_FIND_RHYME",
    "RHYME_ODD_ONE_OUT", "PICTURE_TO_PRINT_MATCH", "GRAMMAR_IMAGE_CHOICE", "GRAMMAR_WORD_CHOICE",
    "HFW_READ_FIND_WORD", "SHORT_VOWEL_WORD", "MPD", "CPS"
  ]);

  for (const item of items) {
    // L-SCHEMA
    if (seenIds.has(item.id)) push("L-SCHEMA", item.id, "duplicate id");
    seenIds.add(item.id);
    const keyCount = item.choices.filter(c => norm(c) === norm(item.answer)).length;
    if (!item.answer) push("L-SCHEMA", item.id, "no key marked");
    if (item.choices.length && keyCount !== 1) push("L-SCHEMA", item.id, `answer appears ${keyCount}x in choices`);
    if (item.choices.length && item.choices.length !== 4 && !["HFW_LETTER_BUILD"].includes(item.formatType)) {
      push("L-SCHEMA", item.id, `expected 4 choices, got ${item.choices.length}`);
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

    // L-GRAM — broken frames that shipped in the old bank
    const promptText = `${item.prompt} ${item.sentence || ""}`;
    if (/\ba ([aeiou])/i.test(promptText)) push("L-GRAM", item.id, `article error: "a ${promptText.match(/\ba ([aeiou])\w*/i)?.[1]}..."`);
    if (/\bword means\b|\bprecise word means\b/i.test(promptText)) push("L-GRAM", item.id, "broken 'word means' frame");
    if (/\s{2,}/.test(item.prompt)) push("L-GRAM", item.id, "double space in prompt");
    if ((item.sentence || "").includes("___") === false && /HFW_SENTENCE|SENTENCE_FIT|SPELLING_CONTEXT|CONTEXT_CLOZE|PRECISION|WORD_IN_SENTENCE/.test(item.formatType) && !/___/.test(promptText) && !item.passage) {
      push("L-GRAM", item.id, "cloze format without a ___ blank");
    }

    // L-READ
    const promptWords = item.prompt.split(/\s+/).filter(Boolean).length;
    const passageWords = (item.passage || "").split(/\s+/).filter(Boolean).length;
    if (item.level === 1 && promptWords > 14) push("L-READ", item.id, `L1 prompt ${promptWords} words`);
    if (item.level === 2 && promptWords > 18) push("L-READ", item.id, `L2 prompt ${promptWords} words`);
    if (item.level === 1 && passageWords > 60) push("L-READ", item.id, `L1 passage ${passageWords} words`);
    if (item.level === 2 && passageWords > 112) push("L-READ", item.id, `L2 passage ${passageWords} words`);

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

    // Image formats must only use words with real image assets
    if (item.imageCards) {
      for (const card of item.imageCards) {
        if (!card.image) push("L-MEDIA", item.id, `no image asset for "${card.word}"`);
        else if (!imageWords.has(card.word) && !fs.existsSync(path.join(ROOT, "public", card.image.replace(/^\//, "")))) {
          push("L-MEDIA", item.id, `image file missing for "${card.word}": ${card.image}`);
        }
      }
    }
    if (item.imagePath && !fs.existsSync(path.join(ROOT, "public", item.imagePath.replace(/^\//, "")))) {
      push("L-MEDIA", item.id, `target image missing: ${item.imagePath}`);
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

  return issues;
}

// ---------------------------------------------------------------------------
// Simulations (MASTERY_SYSTEM §9) — run against built bank + skillStatusPolicy.
// Selection model mirrors the runtime ladder: unseen-first, unit-coverage-first.
// ---------------------------------------------------------------------------
export function composeSitting(bank, { level, seen, sittingSize, unitEvidence }) {
  const pool = bank.filter(i => i.level === level && !i.retentionOnly && !seen.has(i.id));
  const byNeed = [...pool].sort((a, b) => (unitEvidence.get(a.itemKey) || 0) - (unitEvidence.get(b.itemKey) || 0));
  const chosen = [];
  const usedUnits = new Map();
  for (const item of byNeed) {
    if (chosen.length >= sittingSize) break;
    const unitCount = usedUnits.get(item.itemKey) || 0;
    const cap = Math.max(1, Math.ceil(sittingSize / Math.max(1, (new Set(pool.map(p => p.itemKey))).size)));
    if (unitCount >= cap + 1) continue;
    chosen.push(item);
    usedUnits.set(item.itemKey, unitCount + 1);
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
  const seenSignatures = new Set();
  let sittings = 0;
  const nowFor = () => T0 + (sittings + 6) * DAY; // stays inside the 90-day window

  for (const level of [1, 2]) {
    for (let s = 0; s < maxSittings; s++) {
      const status = policy.computeSkillStatus(ledger, blueprint, { now: nowFor() });
      const levelRow = level === 1 ? status.level1 : status.level2;
      if (levelRow.passed) break;
      const unitEvidence = new Map();
      for (const attempt of ledger) unitEvidence.set(attempt.itemKey, (unitEvidence.get(attempt.itemKey) || 0) + 1);
      const sitting = composeSitting(bank, { level, seen, sittingSize: blueprint.sitting, unitEvidence });
      if (!sitting.length) break;
      sittings++;
      for (const item of sitting) {
        if (seen.has(item.id)) repeats.push(item.id);
        const signature = promptAnswerSignature(item) + "||" + optionSetSignature(item);
        if (seenSignatures.has(signature)) repeats.push(`sig:${item.id}`);
        seenSignatures.add(signature);
        seen.add(item.id);
        const correct = answerFn(item);
        ledger.push({
          itemId: item.id, itemKey: item.itemKey, itemType: item.itemType,
          level: item.level, formatType: item.formatType,
          isCorrect: correct, responseState: correct ? "correct" : "incorrect",
          mode: "formal", sittingId: `sim-${level}-${s}`,
          timestamp: T0 + sittings * DAY
        });
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
      level: item.level, formatType: item.formatType,
      isCorrect: correct, responseState: correct ? "correct" : "incorrect",
      mode: "retention", sittingId: "sim-retention",
      timestamp: T0 + (sittings + 4) * DAY
    });
  }

  const final = policy.computeSkillStatus(ledger, blueprint, { now: T0 + (sittings + 6) * DAY });
  return { final, sittings, repeats, ledgerSize: ledger.length };
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

export function writeGeneratedBank(skillId, items) {
  fs.mkdirSync(BANKS_DIR, { recursive: true });
  const file = path.join(BANKS_DIR, `${skillId}.v3.generated.js`);
  const banner = `// GENERATED by tools/assessmentRebuild/build.mjs from tools/assessmentRebuild/authoring/${skillId}.mjs\n// Hand-edit the authoring source, never this file. Standard: docs/skills-assessment-rebuild/\n`;
  fs.writeFileSync(file, `${banner}export const questions = ${JSON.stringify(items, null, 1)};\n`);
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
    "images/child-mode", "images/vocabulary", "images/objects", "images/cvc", "images/vowels", "images/prepositions"
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
      const existing = index.get(stem);
      if (!existing || rank(rel) < rank(existing)) index.set(stem, rel);
    }
  };
  const imagesRoot = path.join(ROOT, "public", "images");
  if (fs.existsSync(imagesRoot)) walk(imagesRoot);
  IMAGE_INDEX = index;
  return index;
}

export function makeImageResolver(preferredDirs = []) {
  const index = buildImageIndex();
  return word => {
    const stem = norm(word).replace(/ /g, "-");
    for (const dir of preferredDirs) {
      const candidate = `images/assessment/${dir}/${stem}.webp`;
      if (fs.existsSync(path.join(ROOT, "public", candidate))) return `/${candidate}`;
    }
    const found = index.get(stem) || index.get(norm(word).replace(/ /g, "_"));
    return found ? `/${found}` : null;
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
