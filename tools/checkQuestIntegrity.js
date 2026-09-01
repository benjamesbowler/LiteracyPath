#!/usr/bin/env node
// npm run check:quest
//
// The content gate for Sound Seekers. The unit tests prove the LOGIC is right;
// this proves the CONTENT is real — that every sound the trail teaches has a
// recording on disk, every word is decodable, and nothing in the runtime breaks
// the house rules.
//
// Exit 1 on any failure. Warnings (known, accepted gaps) do not fail the build,
// but they are printed every time so they can't be quietly forgotten.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseMode = process.argv.includes("--release");

const { QUEST_STOPS, QUEST_SHELL_IDS, NEEDS_AUDIO, taughtThrough } =
  await import(path.join(ROOT, "src/data/questSequence.js"));
const { isDecodable, untaughtGraphemes } =
  await import(path.join(ROOT, "src/utils/questSegments.js"));
const { heartWordsThrough } = await import(path.join(ROOT, "src/data/questSequence.js"));
const { graphemeCandidates } =
  await import(path.join(ROOT, "src/utils/questAudio.js"));
const { CREATURE_BODIES, CREATURE_PARTS, CREATURE_GEAR, ANCHOR_IDS } =
  await import(path.join(ROOT, "src/data/creatureParts.js"));
const { artFor } = await import(path.join(ROOT, "src/data/creatureArt.js"));
const {
  SOUND_SEEKERS_WORDS,
  getPronunciation,
  assertShippingPronunciationLexicon
} = await import(path.join(ROOT, "src/features/soundSeekers/content/pronunciationLexicon.js"));

const errors = [];
const warnings = [];
const fail = msg => errors.push(msg);
const warn = msg => warnings.push(msg);

// ── 1. Every word is decodable with only what has been taught ───────────────
for (const stop of QUEST_STOPS) {
  const known = taughtThrough(stop.index);
  for (const word of stop.words) {
    if (!isDecodable(word, known)) {
      fail(`${stop.id} "${stop.name}": the word "${word}" needs [${untaughtGraphemes(word, known).join(", ")}], which is not taught by stop ${stop.index}`);
    }
  }
  if (stop.words.length < stop.minWords) {
    fail(`${stop.id} "${stop.name}": only ${stop.words.length} words, needs ${stop.minWords}`);
  }
  for (const shell of stop.shells) {
    if (!QUEST_SHELL_IDS.includes(shell)) fail(`${stop.id}: unknown shell "${shell}"`);
  }

  // ── Story pages. THE claim this check exists to defend. ──────────────────
  // Every single word on a Story Stones page must be decodable by this stop, or
  // a heart word already taught. Without this, a page is just prose — and a page
  // a child cannot read is not a reward, it is a wall.
  const hearts = new Set(heartWordsThrough(stop.index).map(w => w.toLowerCase()));
  for (const page of stop.pages || []) {
    if (!Array.isArray(page.choices) || page.choices.length !== 2) {
      fail(`${stop.id}: a story page must offer exactly 2 choices`);
    }
    // The CHOICE BUTTONS count too. A child has to read those to answer, and a
    // choice they cannot decode turns the whole page into a coin toss. (I only
    // checked the page text first, which was a hole in this very check.)
    const text = [page.text, ...(page.choices || [])].join(" ");
    const words = text.toLowerCase().match(/[a-z']+/g) || [];
    for (const raw of words) {
      const word = raw.replace(/'s$/, "");
      if (hearts.has(word)) continue;
      if (isDecodable(word, known)) continue;
      fail(`${stop.id} "${stop.name}": story word "${raw}" needs [${untaughtGraphemes(word, known).join(", ")}] — not taught by stop ${stop.index}, and it is not a heart word`);
    }
  }

  // ── Sound Sort. Curated pairs must actually have words in both pens. ─────
  for (const [a, b] of stop.sortPairs || []) {
    for (const pen of [a, b]) {
      const list = stop.sortWords?.[pen] || [];
      if (list.length < 2) fail(`${stop.id}: sort pen "${pen}" has ${list.length} word(s) — a pen with one word is a hint, not a sort`);
    }
    const taught = new Set(stop.teach.map(e => e.id));
    if (!taught.has(a) && !taughtThrough(stop.index).has(a)) {
      fail(`${stop.id}: sort pen "${a}" is neither taught here nor earlier`);
    }
  }
}

// ── 1b. Every reachable word has one explicit authored pronunciation ──────
// This includes current connected text, not only the 431 decodable-bank words.
// Future story authoring therefore fails this same gate until its new tokens
// have explicit records; runtime spelling-derived segmentation is forbidden.
try {
  assertShippingPronunciationLexicon(SOUND_SEEKERS_WORDS);
} catch (error) {
  fail(`pronunciation lexicon: ${error.message}`);
}

const reachablePronunciationWords = new Set(QUEST_STOPS.flatMap(stop => [
  ...stop.words,
  ...stop.heartWords,
  ...(stop.pages || []).flatMap(page => [page.text, ...(page.choices || [])]
    .flatMap(text => String(text).toLowerCase().match(/[a-z']+/g) || [])
    .map(word => word.replace(/'s$/, "")))
]).map(word => word.toLowerCase()));
for (const word of reachablePronunciationWords) {
  if (!getPronunciation(word)) fail(`pronunciation lexicon: reachable word "${word}" has no explicit record`);
}

// ── 2. Audio: every taught sound resolves to a file that EXISTS on disk ─────
// Silence is allowed (the Listen button hides itself). A path that points at
// nothing is not — that is how you ship a button that does nothing.
const needsAudio = new Set(NEEDS_AUDIO);
const silent = [];
for (const stop of QUEST_STOPS) {
  for (const entry of stop.teach) {
    // A blend is two known letters said quickly (the shell plays the two
    // component phonemes). Morphology (-s, -ing, -ed) is not a sound at all.
    // Neither needs a clip of its own.
    if (entry.kind === "blend" || entry.kind === "morph") continue;

    const id = entry.id;
    // Quest audio resolution applies the stricter rule for alternative
    // pronunciations: only their dedicated /audio/quest/alt clip counts.
    const candidates = graphemeCandidates(id);
    const found = candidates.find(p => fs.existsSync(path.join(ROOT, "public", p)));

    if (!found) {
      if (needsAudio.has(id)) silent.push(`${id} (${stop.id})`);
      else fail(`${stop.id}: no recording for "${id}" — looked in ${candidates.join(", ") || "(no candidates)"}. Add it, or list it in NEEDS_AUDIO.`);
    }
  }
}
if (silent.length) {
  const message = `${silent.length} sounds have no gold-voice recording yet and will play SILENT (this is by design — never a robot voice):\n    ${silent.join("\n    ")}`;
  if (releaseMode) fail(message);
  else warn(message);
}

// Anything in NEEDS_AUDIO that HAS turned up should be removed from the list,
// or the list rots into a lie.
for (const g of NEEDS_AUDIO) {
  const candidates = graphemeCandidates(g);
  if (candidates.some(p => fs.existsSync(path.join(ROOT, "public", p)))) {
    fail(`NEEDS_AUDIO still lists "${g}", but a recording now exists. Remove it from the list.`);
  }
}

// ── 3. The creature: every piece has art, every anchor exists ───────────────
for (const body of CREATURE_BODIES) {
  const art = artFor(body.id);
  if (!art) fail(`creature: body "${body.id}" has no art`);
  else if (!art.silhouette) fail(`creature: body "${body.id}" has no silhouette (patterns cannot clip to it)`);
  for (const anchor of ANCHOR_IDS) {
    if (!Array.isArray(body.anchors?.[anchor])) fail(`creature: body "${body.id}" is missing the ${anchor} anchor`);
  }
}
for (const piece of [...CREATURE_PARTS, ...CREATURE_GEAR]) {
  if (!artFor(piece.id)) fail(`creature: piece "${piece.id}" has no art`);
}

// ── 4. House rules in the quest runtime ────────────────────────────────────
// No emoji (enforced elsewhere for learn-games; the same rule applies here),
// and no raw hex outside the one file that is ALLOWED to hold colour: the dye
// table. Everything else must paint with a token.
const EMOJI = /\p{Extended_Pictographic}/u;
const HEX = /(?<!&)#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
// THREE.js colours are written 0xRRGGBB - the old rule only matched #hex, so
// an entire numeric palette lived invisible to it inside QuestHub.jsx.
const NUMERIC_HEX = /\b0x[0-9a-fA-F]{6}\b/;
// Colour lives in exactly TWO data files: one for the creature, one for the
// world. A literal colour anywhere else is a colour that cannot be re-themed,
// and it is how a world ends up half Meadow and half Moonwood.
const COLOUR_ALLOWED = new Set([
  "src/data/creatureParts.js",   // the dye table
  "src/data/creatureArt.js",     // no hex expected, but checked anyway
  "src/data/questWorlds.js",     // the world palettes
  "src/components/quest/world/questPixelRuntime.js", // isolated authored pixel-world palette
  "src/components/quest/world/questPixelAvatar.js",  // authored gear colours; body paint still uses dye tokens
  "src/styles/quest.css"         // a stylesheet is allowed to be a stylesheet
]);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.(js|jsx)$/.test(entry.name) ? [full] : [];
  });
}

const runtimeFiles = [
  ...walk(path.join(ROOT, "src/components/quest")),
  path.join(ROOT, "src/data/questSequence.js"),
  path.join(ROOT, "src/data/questWorlds.js"),
  path.join(ROOT, "src/data/creatureParts.js"),
  path.join(ROOT, "src/data/creatureArt.js"),
  path.join(ROOT, "src/utils/questSegments.js"),
  path.join(ROOT, "src/utils/questMastery.js"),
  path.join(ROOT, "src/utils/questReviewScheduler.js"),
  path.join(ROOT, "src/utils/questRounds.js"),
  path.join(ROOT, "src/utils/questProgress.js"),
  path.join(ROOT, "src/utils/questStore.js"),
  path.join(ROOT, "src/utils/questAudio.js"),
  path.join(ROOT, "src/utils/creatureLayout.js")
].filter(fs.existsSync);

for (const file of runtimeFiles) {
  const rel = path.relative(ROOT, file);
  const source = fs.readFileSync(file, "utf8");
  if (EMOJI.test(source)) fail(`${rel}: contains an emoji. Every icon in this app is an SVG or a WebP.`);
  if (HEX.test(source) && !COLOUR_ALLOWED.has(rel)) {
    fail(`${rel}: contains a raw hex colour. Paint with a token (skin/skinDark/belly/accent) so dyes work.`);
  }
  // The KNOWN numeric-palette holders, exempted BY NAME until the hub split
  // relocates them into questWorlds.js. The moment this rule landed it found
  // two more hidden palettes (questAssets, questPremiumRender) - which is
  // exactly why new 0x colours anywhere else fail the build today.
  const NUMERIC_HEX_HOLDERS = new Set([
    "src/components/quest/world/QuestHub.jsx",
    "src/components/quest/world/questAssets.js",
    "src/components/quest/world/questPremiumRender.js"
  ]);
  if (NUMERIC_HEX.test(source) && !COLOUR_ALLOWED.has(rel) && !NUMERIC_HEX_HOLDERS.has(rel)) {
    fail(`${rel}: contains a raw 0x colour. Palettes live in questWorlds.js.`);
  }
}

// ── 4b. The mechanic matrix stays true to the stops it describes ───────────
{
  const { validateMechanicMatrix } = await import("../src/data/questMechanicMatrix.js");
  const { QUEST_STOPS } = await import("../src/data/questSequence.js");
  for (const problem of validateMechanicMatrix(QUEST_STOPS)) {
    fail(`questMechanicMatrix: ${problem}`);
  }
}

// ── 5. Nothing in the quest may leak into the arcade ───────────────────────
// The quest is a standalone mode. If it ever shows up in GAME_LIST, the arcade's
// hard-asserted 11-game list goes red and we've broken someone else's tests.
const gameList = fs.readFileSync(path.join(ROOT, "src/data/learnGamesData.js"), "utf8");
if (/["']phonics-quest["']/.test(gameList) || /["']sound-seekers["']/.test(gameList)) {
  fail("src/data/learnGamesData.js: the quest must NOT be registered as an arcade game — it is a standalone mode.");
}

// ── Report ──────────────────────────────────────────────────────────────────
const stops = QUEST_STOPS.length;
const sounds = QUEST_STOPS.flatMap(s => s.teach).length;
const words = new Set(QUEST_STOPS.flatMap(s => s.words)).size;
const hearts = new Set(QUEST_STOPS.flatMap(s => s.heartWords)).size;

console.log(`check:quest — ${stops} stops, ${sounds} sounds, ${words} decodable words, ${hearts} heart words`);

for (const w of warnings) console.log(`  warn  ${w}`);

if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? "" : "s"}:\n`);
  for (const e of errors) console.error(`  FAIL  ${e}`);
  process.exit(1);
}

console.log("check:quest OK");
