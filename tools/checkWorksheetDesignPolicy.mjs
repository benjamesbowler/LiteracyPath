import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  WORKSHEET_PAGE_STAGES,
  availableWorksheetTypes,
  buildWorksheetDocument,
  getWorksheetCycle,
  worksheetCycleOptions
} from "../src/utils/worksheets/worksheetBuilder.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
let documentCount = 0;
let pageCount = 0;
let taskCount = 0;
let imageCount = 0;

function fail(code, context, detail) {
  failures.push({ code, context, detail });
}

function sections(html) {
  return [...html.matchAll(/<section class="page"[\s\S]*?<\/section>/g)].map(match => match[0]);
}

function decode(value) {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function textContent(html) {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function semanticPageBody(section) {
  return section
    .replace(/^[\s\S]*?<div class="ws-stage">[\s\S]*?<\/div>/, "")
    .replace(/<div class="ws-footer">[\s\S]*?<\/div>[\s\S]*$/, "")
    .replace(/\sdata-(?:worksheet-page|worksheet-stage|task-id)="[^"]*"/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function attributeValues(html, name) {
  const pattern = new RegExp(`\\s${name}="([^"]*)"`, "g");
  return [...html.matchAll(pattern)].map(match => decode(match[1]));
}

function instructionBodies(section) {
  return [...section.matchAll(/<div class="ws-block-title small ws-instruction">([\s\S]*?)<\/div>/g)]
    .map(match => textContent(match[1]));
}

function taughtLettersThrough(cycleNumber) {
  const result = new Set();
  for (const option of worksheetCycleOptions()) {
    if (option.cycleNumber > cycleNumber) break;
    const cycle = getWorksheetCycle(option.id);
    for (const item of cycle?.focusLetters || []) {
      const spelling = String(item.spelling || "").toLowerCase();
      if (/^[a-z]{1,2}$/.test(spelling)) result.add(spelling);
    }
  }
  return result;
}

function inspectDocument(cycle, type) {
  const recipe = { cycleId: cycle.id, type, pages: 6 };
  const first = buildWorksheetDocument(recipe);
  const second = buildWorksheetDocument(recipe);
  const context = `cycle ${cycle.cycleNumber} ${type}`;
  documentCount += 1;

  if (first.html !== second.html) fail("NON_DETERMINISTIC", context, "same recipe produced different HTML bytes");
  if (!first.html.startsWith("<!doctype html><html lang=\"en\">")) fail("DOCUMENT_LANGUAGE", context, "document must declare English");
  if (/https?:\/\//i.test(first.html) || /<link\b/i.test(first.html)) fail("NETWORK_DEPENDENCY", context, "print HTML contains an external resource");
  for (const requiredCss of ["@page { size: A4 portrait; margin: 13mm; }", "break-inside: avoid", "print-color-adjust: exact"]) {
    if (!first.html.includes(requiredCss)) fail("PRINT_POLICY", context, `missing CSS contract: ${requiredCss}`);
  }

  const logicalPages = sections(first.html);
  pageCount += logicalPages.length;
  if (logicalPages.length !== 6) fail("PAGE_COUNT", context, `expected 6 logical pages, found ${logicalPages.length}`);

  const stageIds = logicalPages.flatMap(page => attributeValues(page, "data-worksheet-stage"));
  const expectedStages = WORKSHEET_PAGE_STAGES.map(stage => stage.id);
  if (JSON.stringify(stageIds) !== JSON.stringify(expectedStages)) {
    fail("STAGE_SEQUENCE", context, `expected ${expectedStages.join(", ")}; found ${stageIds.join(", ")}`);
  }

  const semanticBodies = logicalPages.map(semanticPageBody);
  if (new Set(semanticBodies).size !== logicalPages.length) {
    fail("DUPLICATE_PAGE", context, "pack repeats an instructional page after furniture and metadata are removed");
  }

  const documentTaskIds = [];
  logicalPages.forEach((page, index) => {
    const pageContext = `${context} page ${index + 1}`;
    const kinds = attributeValues(page, "data-task-kind");
    const taskIds = attributeValues(page, "data-task-id");
    const answers = attributeValues(page, "data-answer");
    taskCount += kinds.length;
    documentTaskIds.push(...taskIds);

    if (kinds.length < 2) fail("TASK_DENSITY", pageContext, `expected at least 2 purposeful task blocks, found ${kinds.length}`);
    if (taskIds.length !== kinds.length) fail("TASK_METADATA", pageContext, "each task block must have one task id");
    if (taskIds.some(id => !id.trim())) fail("EMPTY_TASK_ID", pageContext, "task id is empty");
    if (answers.some(answer => !answer.trim())) fail("EMPTY_ANSWER", pageContext, "closed response has an empty answer");

    for (const instruction of instructionBodies(page)) {
      const wordCount = instruction.split(/\s+/).filter(Boolean).length;
      if (wordCount > 24) fail("LONG_INSTRUCTION", pageContext, `${wordCount}-word instruction: ${instruction}`);
      if (/\b(?:tricky|trickies|easy|hard|baby)\b/i.test(instruction)) fail("BANNED_LABEL", pageContext, instruction);
      if (/missing MIDDLE sound/i.test(instruction)) fail("UNIT_MISMATCH", pageContext, "printed letter blank is described as a sound");
    }

    const images = [...page.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*\balt="([^"]*)"[^>]*>/g)];
    imageCount += images.length;
    for (const [, src, alt] of images) {
      if (!alt.trim()) fail("EMPTY_ALT", pageContext, `image ${src} has empty alt text`);
      if (!src.startsWith("/")) {
        fail("IMAGE_PATH", pageContext, `image must use a local absolute path: ${src}`);
        continue;
      }
      const assetPath = path.join(REPO_ROOT, "public", src.slice(1));
      if (!fs.existsSync(assetPath)) fail("MISSING_IMAGE", pageContext, src);
    }

    if (kinds.includes("missing-letter")) {
      const missingStart = page.indexOf('data-task-kind="missing-letter"');
      const nextTask = page.indexOf('data-task-kind="', missingStart + 24);
      const missingBlock = page.slice(missingStart, nextTask === -1 ? page.length : nextTask);
      if (!/<img class="ws-cue"[^>]+alt="[^"]+"/.test(missingBlock)) {
        fail("MISSING_LETTER_IMAGE", pageContext, "missing-letter task has no named image cue");
      }
    }
  });

  if (new Set(documentTaskIds).size !== documentTaskIds.length) fail("DUPLICATE_TASK_ID", context, "task ids repeat inside the document");

  if (type === "wordBuilding") {
    const taught = taughtLettersThrough(cycle.cycleNumber);
    const answers = attributeValues(first.html, "data-answer").filter(answer => /^[a-z]+$/.test(answer));
    for (const answer of answers) {
      const untaught = [...answer].filter(letter => !taught.has(letter));
      if (untaught.length) fail("UNTAUGHT_SPELLING", context, `${answer} uses untaught letter(s): ${[...new Set(untaught)].join(", ")}`);
    }
  }

  if (type === "letterFormation") {
    const taught = taughtLettersThrough(cycle.cycleNumber);
    const hunts = [...first.html.matchAll(/<div class="ws-find">([\s\S]*?)<\/div>/g)];
    for (const hunt of hunts) {
      const letters = [...hunt[1].matchAll(/<span>([A-Za-z])<\/span>/g)].map(match => match[1].toLowerCase());
      const untaught = letters.filter(letter => !taught.has(letter));
      if (untaught.length) fail("UNTAUGHT_HUNT_LETTER", context, `letter hunt uses untaught letter(s): ${[...new Set(untaught)].join(", ")}`);
    }
  }
}

for (const option of worksheetCycleOptions()) {
  const cycle = getWorksheetCycle(option.id);
  for (const type of availableWorksheetTypes(cycle)) inspectDocument(cycle, type);
}

const summary = {
  policyVersion: "2026-08-01.1",
  documentsChecked: documentCount,
  pagesChecked: pageCount,
  tasksChecked: taskCount,
  imagesChecked: imageCount,
  failures: failures.length
};

if (failures.length) {
  console.error(JSON.stringify({ summary, failures }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ summary, status: "PASS" }, null, 2));
}
