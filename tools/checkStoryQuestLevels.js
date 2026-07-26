#!/usr/bin/env node
// checkStoryQuestLevels.js — reading-band conformance gate for Story Quests.
//
// Added 2026-07-26. checkStoryQuestIntegrity.js validates WIRING (orphans, dangling
// targets, replay/finish choices). It passed green on a catalogue where the declared
// Level B books were harder than the declared Level C books and not one of 125
// "Level A" pages was a single line. This file is the gate that catches that.
//
// Run: node tools/checkStoryQuestLevels.js
// Exit 0 = every quest sits inside its declared band.

import { storyQuests } from "../src/data/storyQuests.js";

const BANDS = {
  A:     { maxLines: 1, maxWordsPerLine: 6,  maxWordsPerPage: 6,  maxPath: 10, dialogue: false, maxMultisyllabicPct: 30 },
  B:     { maxLines: 2, maxWordsPerLine: 8,  maxWordsPerPage: 14, maxPath: 12, dialogue: true,  maxMultisyllabicPct: 35 },
  C:     { maxLines: 3, maxWordsPerLine: 9,  maxWordsPerPage: 22, maxPath: 14, dialogue: true,  maxMultisyllabicPct: 40 },
  Early: { maxLines: 2, maxWordsPerLine: 8,  maxWordsPerPage: 8,  maxPath: 10, dialogue: true,  maxMultisyllabicPct: 20 },
};

// Ordered ladder: each band's words-per-page average must not exceed the next band up.
// "Early" is deliberately NOT in this list. It is a decodable on the phonics scope-and-
// sequence (short-a CVC + HFW), not a Fountas & Pinnell levelled text; the two run on
// parallel tracks and comparing their words-per-page is a category error. Its own
// ceilings in BANDS still apply.
const LADDER = ["A", "B", "C"];

const PAST_NARRATION = /\b(was|were|had|been|said|asked|walked|looked|found|went|came|got|made|took|saw|shook|drew|flew|stopped|hopped|rushed|jumped|called|wanted|tried|felt|woke|ate|began|knew|held|thought|landed|arrived|opened|closed|nodded|smiled|laughed|carried|poured|turned|sprang|bounced|padded|sniffed|checked|waited|listened|settled|rested|reached|leaned|tipped|slipped|swung|bumped|tumbled|shone|gave|told|brought|caught|chose|grew|lost|meant|met|sold|spoke|stood|swam|threw|wore|won|wrote)\b/i;
// Told-emotion and safety-hedge registers — the two loudest markers of generated children's text.
const TOLD_EMOTION = /\b(beams?|beamed|almost smiled|frown softened|looks? (?:sorry|proud|pleased|surprised|worried)|felt (?:comfortable|proud|happy|sad|safe)|realis(?:e|ed)|decided|agreed|wondered|tried not to look)\b/i;
const SAFETY_HEDGE = /\b(safely|carefully|nobody was hurt|called a warning|asked before|made sure everyone|checked that everyone)\b/i;
const STATED_MORAL = /\b(had learned|learned that|the lesson|did you learn)\b/i;
const SUBORDINATOR = /\b(because|although|while|unless|whereas|whenever)\b/i;
const A_FORBIDDEN = /\b(but|so|because|while|when|if|will|might|could|would|should)\b/i;
const A_POSSESSIVE = /(\b\w+'s\b|\b(?:her|his|its|their|my|your)\b)/i;

const words = (s) => s.replace(/[“”‘’]/g, "").match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
const syllables = (w) => (w.toLowerCase().replace(/e$/, "").match(/[aeiouy]+/g) || [""]).length || 1;
const hasQuote = (s) => /["“”]/.test(s);

const errors = [];
const rows = [];
const add = (q, p, msg) => errors.push(`${q}${p ? ` / ${p}` : ""}: ${msg}`);

for (const quest of storyQuests) {
  const band = BANDS[quest.level];
  if (!band) { add(quest.id, null, `unknown level "${quest.level}"`); continue; }

  let totalWords = 0, totalLines = 0, maxPageWords = 0, dialoguePages = 0;
  const vocab = new Set();

  for (const page of quest.pages) {
    const lines = page.text || [];
    if (lines.length > band.maxLines) {
      add(quest.id, page.id, `${lines.length} lines exceeds level ${quest.level} maximum of ${band.maxLines}`);
    }
    let pageWords = 0, pageHasDialogue = false;
    for (const line of lines) {
      const w = words(line);
      pageWords += w.length;
      totalLines += 1;
      w.forEach((x) => vocab.add(x.toLowerCase()));
      if (w.length > band.maxWordsPerLine) {
        add(quest.id, page.id, `line of ${w.length} words exceeds level ${quest.level} maximum of ${band.maxWordsPerLine}: "${line}"`);
      }
      if (hasQuote(line)) {
        pageHasDialogue = true;
        if (!band.dialogue) add(quest.id, page.id, `dialogue is not permitted at level ${quest.level}: "${line}"`);
      } else {
        // Skip adjectival participles ("the lost frog") and determiner-led noun phrases —
        // those are not past-tense narration. Words identical in both tenses (let, put,
        // read, set, cut, hurt, shut, left/right as direction) are excluded from the list.
        const narrationOnly = line.replace(/\b(?:the|a|an|this|that|one|every|no|some)\s+\w+\b/gi, " ");
        if (PAST_NARRATION.test(narrationOnly)) {
          add(quest.id, page.id, `past-tense narration is not permitted at level ${quest.level}: "${line}"`);
        }
      }
      if (TOLD_EMOTION.test(line)) add(quest.id, page.id, `emotion is told rather than staged: "${line}"`);
      if (SAFETY_HEDGE.test(line)) add(quest.id, page.id, `safety hedging: "${line}"`);
      if (STATED_MORAL.test(line)) add(quest.id, page.id, `the moral is stated outright: "${line}"`);
      if (SUBORDINATOR.test(line)) add(quest.id, page.id, `subordinate clause: "${line}"`);
      if (quest.level === "A") {
        if (A_FORBIDDEN.test(line)) add(quest.id, page.id, `conjunction or modal not permitted at level A: "${line}"`);
        if (A_POSSESSIVE.test(line)) add(quest.id, page.id, `possessive not permitted at level A: "${line}"`);
        if (/[,;:—]/.test(line)) add(quest.id, page.id, `punctuation not permitted at level A: "${line}"`);
      }
    }
    if (pageHasDialogue) dialoguePages += 1;
    if (pageWords > band.maxWordsPerPage) {
      add(quest.id, page.id, `${pageWords} words exceeds level ${quest.level} maximum of ${band.maxWordsPerPage}`);
    }
    maxPageWords = Math.max(maxPageWords, pageWords);
    totalWords += pageWords;

    for (const choice of page.choices || []) {
      const n = words(choice.label).length;
      if (n > 4) add(quest.id, page.id, `choice label "${choice.label}" is ${n} words; labels must be 4 words or fewer`);
    }
  }

  if (quest.level === "B" && dialoguePages > quest.pages.length / 2) {
    add(quest.id, null, `dialogue on ${dialoguePages} of ${quest.pages.length} pages; level B allows at most half`);
  }

  // Longest path must stay inside the band's stamina budget.
  const byId = new Map(quest.pages.map((p) => [p.id, p]));
  let longest = 0;
  const walk = (id, depth, seen) => {
    if (depth > 40) return;
    if (id === "end") { longest = Math.max(longest, depth); return; }
    if (seen.has(id)) return;
    seen.add(id);
    const choices = byId.get(id)?.choices || [];
    if (!choices.length) longest = Math.max(longest, depth);
    for (const c of choices) walk(c.nextPageId, depth + 1, seen);
    seen.delete(id);
  };
  walk(quest.startPageId || quest.pages[0]?.id, 0, new Set());
  if (longest > band.maxPath) {
    add(quest.id, null, `longest route is ${longest} scenes; level ${quest.level} allows at most ${band.maxPath}`);
  }

  // Declared vocabulary must actually appear. Decorative metadata is a defect.
  const declared = [...new Set([...(quest.targetWords || []), ...(quest.highFrequencyWords || [])])];
  const unused = declared.filter((w) => !vocab.has(String(w).toLowerCase()));
  if (unused.length) add(quest.id, null, `declared vocabulary never appears in the text: ${unused.join(", ")}`);

  // A present-tense band must not declare past-tense sight words.
  for (const w of quest.highFrequencyWords || []) {
    if (/^(was|were|had)$/i.test(w)) add(quest.id, null, `"${w}" is declared as a sight word in present-tense level ${quest.level}`);
  }

  const multi = [...vocab].filter((w) => syllables(w) > 1);
  const multiPct = Math.round((100 * multi.length) / Math.max(vocab.size, 1));
  if (multiPct > band.maxMultisyllabicPct) {
    add(quest.id, null, `${multiPct}% of word types are multisyllabic; level ${quest.level} allows at most ${band.maxMultisyllabicPct}%`);
  }

  rows.push({
    quest: quest.id, level: quest.level, pages: quest.pages.length,
    wordsPerPage: +(totalWords / quest.pages.length).toFixed(1),
    linesPerPage: +(totalLines / quest.pages.length).toFixed(1),
    worstPage: maxPageWords, longestRoute: longest, multisyllabicPct: multiPct,
  });
}

// The ladder itself: no band may average more words per page than the band above it.
const avgByLevel = {};
for (const r of rows) (avgByLevel[r.level] ||= []).push(r.wordsPerPage);
const levelAvg = Object.fromEntries(
  Object.entries(avgByLevel).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length])
);
for (let i = 0; i < LADDER.length - 1; i += 1) {
  const lower = LADDER[i], upper = LADDER[i + 1];
  if (levelAvg[lower] != null && levelAvg[upper] != null && levelAvg[lower] > levelAvg[upper]) {
    errors.push(
      `LADDER INVERTED: level ${lower} averages ${levelAvg[lower].toFixed(1)} words/page but level ${upper} averages ${levelAvg[upper].toFixed(1)}. ` +
      `A child promoted ${lower} to ${upper} would be handed an easier book.`
    );
  }
}

console.table(rows);
if (errors.length) {
  console.error(`\nStory Quest level conformance FAILED (${errors.length} problems):`);
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log(`\nStory Quest level conformance passed for ${storyQuests.length} quests.`);
console.log(Object.entries(levelAvg).map(([k, v]) => `${k}=${v.toFixed(1)}`).join("  ") + " words/page — ladder ascending.");
