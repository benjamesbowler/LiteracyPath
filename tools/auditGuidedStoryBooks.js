import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  guidedReadingBooks,
  guidedReadingRelevelAudit,
  guidedStoryBookDrafts
} from "../src/data/guidedReadingBooks.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const countWords = text =>
  String(text || "")
    .replace(/[.,!?;:()"]/g, "")
    .split(/\s+/)
    .filter(Boolean).length;

const countSentences = text => (String(text || "").match(/[.!?]+/g) || []).length;

const ensureDir = filePath => fs.mkdirSync(path.dirname(filePath), { recursive: true });

function writeFile(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content);
}

const failures = [];
const warnings = [];

const requiredCharacterFields = [
  "name",
  "ageSpecies",
  "skinFurColor",
  "hairStyleColor",
  "eyeColor",
  "clothing",
  "accessories",
  "personality",
  "speakingStyle",
  "heightBuild",
  "settingRelationship"
];

const requiredContinuityFields = [
  "characterBible",
  "environmentBible",
  "continuityNotes",
  "continuityChecklist",
  "continuityStatus"
];

const activeAboveBOneSentence = guidedReadingBooks.filter(book => {
  if (!["C", "D", "E", "F"].includes(book.level)) return false;
  const pages = book.pages || [];
  if (!pages.length) return false;
  const oneSentencePages = pages.filter(page => countSentences(page.text) <= 1).length;
  return oneSentencePages / pages.length >= 0.6;
});

if (activeAboveBOneSentence.length) {
  failures.push(`${activeAboveBOneSentence.length} active one-sentence books remain above Level B.`);
}

if (guidedStoryBookDrafts.length !== 20) {
  failures.push(`Expected 20 guided story drafts, found ${guidedStoryBookDrafts.length}.`);
}

guidedStoryBookDrafts.forEach(book => {
  if (book.active !== false) failures.push(`${book.id} is a draft but active is not false.`);
  if (book.qaStatus !== "draft_needs_assets") failures.push(`${book.id} should be qaStatus draft_needs_assets.`);
  if (book.type !== "fiction") failures.push(`${book.id} is not fiction.`);
  if (!["C", "D", "E", "F"].includes(book.level)) failures.push(`${book.id} has invalid story level ${book.level}.`);
  if (!book.characterBible?.length) failures.push(`${book.id} is missing characterBible.`);
  requiredContinuityFields.forEach(field => {
    if (!book[field] || (Array.isArray(book[field]) && !book[field].length)) {
      failures.push(`${book.id} is missing continuity metadata field: ${field}.`);
    }
  });
  book.characterBible?.forEach(character => {
    requiredCharacterFields.forEach(field => {
      if (!character[field]) failures.push(`${book.id} character ${character.name || "unknown"} is missing ${field}.`);
    });
  });
  if (!book.environmentBible?.primarySetting) failures.push(`${book.id} is missing environmentBible.primarySetting.`);
  if (!book.environmentBible?.forbiddenSettingDrift?.length) failures.push(`${book.id} is missing environment drift rejection rules.`);
  if (!book.continuityChecklist?.includes("same clothing and accessories")) {
    failures.push(`${book.id} continuityChecklist does not enforce clothing/accessory consistency.`);
  }
  if (!book.imagePromptPack?.length) failures.push(`${book.id} is missing imagePromptPack.`);
  if (!book.narrationScript?.length) failures.push(`${book.id} is missing narrationScript.`);
  if ((book.pages || []).length < 10) failures.push(`${book.id} has fewer than 10 pages.`);
  if (book.imagePromptPack?.length !== book.pages?.length) failures.push(`${book.id} imagePromptPack length does not match pages.`);
  if (book.narrationScript?.length !== book.pages?.length) failures.push(`${book.id} narrationScript length does not match pages.`);

  book.pages?.forEach(page => {
    const words = countWords(page.text);
    const sentences = countSentences(page.text);
    if (!page.text || words < 12) failures.push(`${book.id} page ${page.pageNumber} is too short for Level ${book.level}.`);
    if (sentences < 2) failures.push(`${book.id} page ${page.pageNumber} is one sentence; C-F story pages require paragraph text.`);
    if (!page.imagePrompt) failures.push(`${book.id} page ${page.pageNumber} is missing imagePrompt.`);
    if (!book.imagePromptPack?.find(prompt => prompt.pageNumber === page.pageNumber)?.continuityChecklist?.length) {
      failures.push(`${book.id} page ${page.pageNumber} image prompt is missing continuity checklist.`);
    }
    if (page.image || page.pageAudio) warnings.push(`${book.id} page ${page.pageNumber} unexpectedly has asset paths while still draft.`);
  });
});

const relevelRows = guidedReadingRelevelAudit.map(row =>
  `| ${row.id} | ${row.title} | ${row.oldLevel} | ${row.newLevel} | ${row.pageCount} | ${row.averageWordsPerPage} | ${row.reason} |`
);

writeFile(
  path.join(rootDir, "docs", "guided-reading", "guided_reading_relevel_audit.md"),
  `# Guided Reading Relevel Audit

Date: 2026-05-24

## Summary

- Active approved books audited: ${guidedReadingRelevelAudit.length}
- Books reclassified to a lower level: ${guidedReadingRelevelAudit.filter(row => row.oldLevel !== row.newLevel).length}
- Active one-sentence-per-page books remaining above Level B: ${activeAboveBOneSentence.length}

Existing valid books remain active, but books with mostly one short sentence per page are no longer labeled Level C-E/F. This keeps the current decodable library useful while making space for richer Guided Story drafts at Levels C-F.

## Relevel Table

| Book ID | Title | Old Level | New Level | Page Count | Average Words/Page | Reason |
|---|---|---:|---:|---:|---:|---|
${relevelRows.join("\n")}
`
);

const storySummaryRows = guidedStoryBookDrafts.map(book =>
  `| ${book.id} | ${book.title} | ${book.level} | ${book.sourceType} | ${book.sourceTitle} | ${book.pages.length} | ${book.comprehensionFocus} |`
);

writeFile(
  path.join(rootDir, "docs", "guided-reading", "guided_story_draft_audit.md"),
  `# Guided Story Draft Audit

Date: 2026-05-24

## Summary

- Draft fiction guided stories: ${guidedStoryBookDrafts.length}
- Active drafts exposed to library: ${guidedStoryBookDrafts.filter(book => book.active !== false).length}
- Validation failures: ${failures.length}
- Validation warnings: ${warnings.length}

All guided story drafts are inactive until matching images and narration are generated and validated.

## Draft Books

| Book ID | Title | Level | Source Type | Source Title | Pages | Comprehension Focus |
|---|---|---:|---|---|---:|---|
${storySummaryRows.join("\n")}

${warnings.length ? `## Warnings\n\n${warnings.map(item => `- ${item}`).join("\n")}\n` : ""}
${failures.length ? `## Failures\n\n${failures.map(item => `- ${item}`).join("\n")}\n` : "## Status\n\nPASS\n"}
`
);

const imageRequest = guidedStoryBookDrafts.map(book => {
  const characterBible = book.characterBible
    .map(character => `- ${character.name}
  - canonical appearance: ${character.canonicalAppearance}
  - age/species: ${character.ageSpecies}
  - skin/fur/body color: ${character.skinFurColor}
  - hair/mane/head detail: ${character.hairStyleColor}
  - eye color/style: ${character.eyeColor}
  - clothing: ${character.clothing}
  - accessories: ${character.accessories}
  - personality: ${character.personality}
  - speaking style: ${character.speakingStyle}
  - height/build/proportions: ${character.heightBuild}
  - setting relationship: ${character.settingRelationship}`)
    .join("\n");
  const environmentBible = `- primary setting: ${book.environmentBible.primarySetting}
- time of day: ${book.environmentBible.timeOfDay}
- weather: ${book.environmentBible.weather}
- lighting: ${book.environmentBible.lighting}
- recurring props: ${book.environmentBible.recurringProps?.join(", ") || "none specified"}
- setting continuity: ${book.environmentBible.settingContinuity}
- forbidden setting drift: ${book.environmentBible.forbiddenSettingDrift.join("; ")}`;
  const pagePrompts = book.imagePromptPack
    .map(page => `### Page ${page.pageNumber}
- Exact app text: ${page.exactAppText}
- Required visible characters: ${page.requiredVisibleCharacters.join(", ")}
- Required setting: ${page.requiredSetting}
- Required action: ${page.requiredAction}
- Image prompt: ${page.imagePrompt}
- Forbidden: ${page.forbiddenElements.join(", ")}
- Continuity checklist: ${page.continuityChecklist.join(", ")}
- Previous-page continuity rule: Generate this page as the next scene in the same illustrated book. Compare it to prior pages before finalizing.
- Consistency notes: ${page.consistencyNotes}`)
    .join("\n\n");

  return `## ${book.id}: ${book.title}

- Level: ${book.level}
- Source: ${book.sourceTitle} (${book.sourceCollection})
- Source type: ${book.sourceType}
- Status: draft_needs_assets

### Character Bible
${characterBible}

### Environment Bible
${environmentBible}

### Continuity Status
- ${book.continuityStatus}
- Fiction continuity is mandatory. Reject/regenerate any page with character drift, clothing drift, setting drift, weather/lighting drift, or disconnected narrative sequencing.

### Page Image Requirements
${pagePrompts}`;
}).join("\n\n");

writeFile(
  path.join(rootDir, "docs", "assets", "kimi_guided_story_image_request.md"),
  `# Kimi Guided Story Image Request

Date: 2026-05-24

Generate illustration-only assets for these inactive Guided Story drafts. Do not embed text in any image.

## Global Rules

- No embedded text, captions, labels, watermarks, or speech bubbles.
- Kimi is an asset renderer, not the story author.
- Kimi must follow Codex story text, character bibles, environment bibles, and page prompts exactly.
- Kimi must never improvise story details, rewrite app text, paraphrase narration, or add new events.
- Kimi must never redesign characters.
- Kimi must never alter clothing randomly.
- Kimi must never alter environments randomly.
- Kimi must never change time of day, weather, lighting, species, age, body proportions, or recurring props unless the exact page text requires it.
- Kimi must never add embedded text, labels, captions, watermarks, or speech bubbles.
- Kimi must preserve visual continuity across every page of each fiction book.
- Fiction continuity is mandatory. A beautiful image still fails if character, clothing, setting, lighting, weather, props, or art style drift.
- All pages of a book must look like the same illustrated universe.
- Character drift is forbidden.
- Random redesigns are forbidden.
- Every page prompt must reference the canonical character bible and environment bible.
- Every page must be generated with awareness of the previous page and the story sequence.
- Keep character age/species, clothing, colors, hair/fur, accessories, body proportions, and setting details consistent across every page of the same book.
- Do not add random extra characters.
- Do not randomly change time of day, weather, lighting, buildings, props, or background location.
- Do not activate or approve fiction pages that fail continuity checks.
- Avoid scary, violent, or intense imagery.
- Use a warm, child-friendly, modern illustration style.
- Compose images so the main action is readable on mobile.
- Match the exact app text and required action for each page.

${imageRequest}
`
);

const audioRequest = guidedStoryBookDrafts.map(book => {
  const pageAudio = book.narrationScript
    .map(page => `| ${page.pageNumber} | ${page.fileName} | ${page.exactNarrationText} | ${page.voiceStyle} | ${page.pacingNotes} | ${page.pronunciationNotes} |`)
    .join("\n");

  return `## ${book.id}: ${book.title}

- Level: ${book.level}
- Source: ${book.sourceTitle} (${book.sourceCollection})

| Page | Filename | Exact Narration Text | Voice Style | Pacing Notes | Pronunciation Notes |
|---:|---|---|---|---|---|
${pageAudio}`;
}).join("\n\n");

writeFile(
  path.join(rootDir, "docs", "assets", "kimi_guided_story_audio_request.md"),
  `# Kimi Guided Story Audio Request

Date: 2026-05-24

## Global Rules

- Narration must match the exact app text.
- No paraphrasing, extra intro, extra outro, or sound effects.
- One MP3 file per page.
- Use a clean, neutral, warm human teacher voice.
- Pace naturally and slightly slower than conversation.
- Do not spell words letter by letter unless the text explicitly asks for spelling.

${audioRequest}
`
);

console.log(`Guided story drafts checked: ${guidedStoryBookDrafts.length}`);
console.log(`Active books relevel audit rows: ${guidedReadingRelevelAudit.length}`);
console.log(`Warnings: ${warnings.length}`);

if (failures.length) {
  console.error(`Failures: ${failures.length}`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Guided Story audit passed.");
