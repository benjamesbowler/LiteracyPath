import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

import OpenAI, { toFile } from "openai";
import sharp from "sharp";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const factoryRoot = path.join(repoRoot, ".artifacts", "guided-reading-image-factory");
export const databasePath = path.join(factoryRoot, "factory.sqlite");
const docsRoot = path.join(repoRoot, "docs", "guided-reading");
const manifestPath = path.join(docsRoot, "guided_reading_visual_replacement_manifest.json");
const coveragePath = path.join(docsRoot, "guided_reading_visual_audit_coverage.json");
const installedPath = path.join(docsRoot, "guided_reading_visual_installed.json");
const postInstallAuditPath = path.join(docsRoot, "guided_reading_post_install_visual_findings.json");
const profilesPath = path.join(docsRoot, "guided_reading_image_factory_profiles.json");
const shotPlanOverridesPath = path.join(docsRoot, "guided_reading_shot_plan_overrides.json");
const auditBuilderPath = path.join(repoRoot, "tools", "buildGuidedReadingVisualAuditManifest.mjs");

const DEFAULT_MODEL = "gpt-image-2";
const DEFAULT_QUALITY = "low";
const DEFAULT_PLANNER_MODEL = "gpt-5-mini";
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_START_INTERVAL_MS = 15_000;

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function readJson(filePath, fallback = null) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function nowIso() {
  return new Date().toISOString();
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function roundTo16(value) {
  return Math.max(16, Math.round(value / 16) * 16);
}

export function deriveSeriesKey(imagePath, type = "fiction") {
  const seriesMatch = imagePath.match(/^\/guided-reading\/series\/([^/]+)\//);
  if (seriesMatch) return `series/${seriesMatch[1]}`;
  if (type === "nonfiction") return "nonfiction";
  const directory = path.posix.dirname(imagePath.replace(/^\//, ""));
  return `fiction/${directory}`;
}

export function apiSizeFor(width, height, maximumEdge = 1536) {
  const ratio = width / height;
  if (ratio >= 1) {
    const apiWidth = roundTo16(maximumEdge);
    const apiHeight = clamp(roundTo16(apiWidth / ratio), 512, maximumEdge);
    return `${apiWidth}x${apiHeight}`;
  }
  const apiHeight = roundTo16(maximumEdge);
  const apiWidth = clamp(roundTo16(apiHeight * ratio), 512, maximumEdge);
  return `${apiWidth}x${apiHeight}`;
}

export function orientationMatchesTarget(width, height, targetWidth, targetHeight) {
  return (width >= height) === (targetWidth >= targetHeight);
}

export function selectWholeBookGroups(groups, limit) {
  const selected = [];
  let remaining = limit;
  for (const group of groups) {
    if (group.jobs.length > remaining) continue;
    selected.push(...group.jobs);
    remaining -= group.jobs.length;
    if (remaining === 0) break;
  }
  if (!selected.length && groups.length) return groups[0].jobs.slice(0, limit);
  return selected;
}

function priorityRank(priority) {
  if (priority === "critical") return 0;
  if (priority === "high") return 1;
  return 2;
}

function publicAbsolute(publicPath) {
  const resolved = path.resolve(repoRoot, "public", publicPath.replace(/^\//, ""));
  const publicRoot = path.resolve(repoRoot, "public");
  if (!resolved.startsWith(`${publicRoot}${path.sep}`)) throw new Error(`Unsafe public path: ${publicPath}`);
  return resolved;
}

function projectAbsolute(projectPath) {
  const resolved = path.resolve(repoRoot, projectPath);
  if (!resolved.startsWith(`${repoRoot}${path.sep}`)) throw new Error(`Unsafe project path: ${projectPath}`);
  return resolved;
}

function loadApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.join(repoRoot, fileName);
    if (!fs.existsSync(filePath)) continue;
    const match = fs.readFileSync(filePath, "utf8").match(/^\s*OPENAI_API_KEY\s*=\s*(.+?)\s*$/m);
    if (match?.[1]) return match[1].replace(/^['"]|['"]$/g, "");
  }
  return null;
}

async function typedImageUpload(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeType = extension === ".png"
    ? "image/png"
    : extension === ".jpg" || extension === ".jpeg"
      ? "image/jpeg"
      : "image/webp";
  return toFile(await fs.promises.readFile(filePath), path.basename(filePath), { type: mimeType });
}

function createSchema(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS series_profiles (
      series_key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      style_prompt TEXT NOT NULL,
      anchor_paths_json TEXT NOT NULL DEFAULT '[]',
      input_fidelity TEXT NOT NULL DEFAULT 'low',
      max_references INTEGER NOT NULL DEFAULT 3,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS books (
      book_number INTEGER PRIMARY KEY,
      book_id TEXT NOT NULL,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      type TEXT NOT NULL,
      series_key TEXT NOT NULL,
      pages_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      state TEXT NOT NULL,
      model TEXT NOT NULL,
      quality TEXT NOT NULL,
      requested_limit INTEGER NOT NULL,
      job_count INTEGER NOT NULL DEFAULT 0,
      concurrency INTEGER NOT NULL,
      start_interval_ms INTEGER NOT NULL,
      contact_sheet_path TEXT,
      created_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_key TEXT UNIQUE NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      book_number INTEGER NOT NULL,
      book_id TEXT NOT NULL,
      title TEXT NOT NULL,
      level TEXT NOT NULL,
      type TEXT NOT NULL,
      series_key TEXT NOT NULL,
      page_number INTEGER NOT NULL,
      page_text TEXT NOT NULL,
      priority TEXT NOT NULL,
      issue_types_json TEXT NOT NULL,
      observed_problem TEXT NOT NULL,
      continuity_requirements TEXT NOT NULL,
      required_scene TEXT NOT NULL,
      prompt TEXT NOT NULL,
      current_image_path TEXT NOT NULL,
      replacement_image_path TEXT NOT NULL,
      target_width INTEGER NOT NULL,
      target_height INTEGER NOT NULL,
      api_size TEXT NOT NULL,
      reference_paths_json TEXT NOT NULL DEFAULT '[]',
      state TEXT NOT NULL DEFAULT 'pending',
      batch_id TEXT REFERENCES batches(id),
      candidate_path TEXT,
      candidate_sha256 TEXT,
      candidate_hash TEXT,
      qa_status TEXT,
      qa_json TEXT,
      review_notes TEXT,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS jobs_state_index ON jobs(active, state, priority, book_number, page_number);
    CREATE INDEX IF NOT EXISTS jobs_batch_index ON jobs(batch_id, state, page_number);
    CREATE INDEX IF NOT EXISTS jobs_series_index ON jobs(series_key, book_number, page_number);

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      batch_id TEXT NOT NULL REFERENCES batches(id),
      model TEXT NOT NULL,
      quality TEXT NOT NULL,
      api_size TEXT NOT NULL,
      prompt TEXT NOT NULL,
      reference_paths_json TEXT NOT NULL,
      state TEXT NOT NULL,
      output_path TEXT,
      qa_json TEXT,
      error TEXT,
      started_at TEXT NOT NULL,
      completed_at TEXT
    );
  `);

  const jobColumns = new Set(db.prepare("PRAGMA table_info(jobs)").all().map(column => column.name));
  const migrations = [
    ["scene_plan_json", "TEXT"],
    ["plan_input_hash", "TEXT"],
    ["planner_model", "TEXT"],
    ["planned_at", "TEXT"],
  ];
  for (const [name, definition] of migrations) {
    if (!jobColumns.has(name)) db.exec(`ALTER TABLE jobs ADD COLUMN ${name} ${definition}`);
  }
}

export function openFactoryDatabase(filePath = databasePath) {
  ensureDirectory(path.dirname(filePath));
  const db = new DatabaseSync(filePath);
  createSchema(db);
  return db;
}

function profileFor(seriesKey, type, configuredProfiles, activeImages) {
  const defaultProfile = configuredProfiles.defaults[type];
  const override = configuredProfiles.series[seriesKey] || {};
  const candidates = activeImages
    .filter(image => deriveSeriesKey(image.imagePath, image.type) === seriesKey)
    .filter(image => image.reviewStatus === "installed-replacement" || image.reviewStatus === "pass")
    .sort((left, right) => {
      const leftRank = left.reviewStatus === "installed-replacement" ? 0 : 1;
      const rightRank = right.reviewStatus === "installed-replacement" ? 0 : 1;
      return leftRank - rightRank || left.bookNumber - right.bookNumber || left.pageNumber - right.pageNumber;
    });
  const configuredAnchors = (override.anchorPaths || []).filter(anchor => fs.existsSync(publicAbsolute(anchor)));
  const automaticAnchors = candidates.map(candidate => candidate.imagePath);
  const maxReferences = override.maxReferences ?? defaultProfile.maxReferences;
  return {
    seriesKey,
    label: override.label || seriesKey.split("/").at(-1).replaceAll("-", " "),
    type,
    stylePrompt: override.stylePrompt || defaultProfile.stylePrompt,
    anchorPaths: [...new Set([...configuredAnchors, ...automaticAnchors])].slice(0, maxReferences),
    inputFidelity: override.inputFidelity || defaultProfile.inputFidelity,
    maxReferences,
  };
}

function referencesFor(replacement, profile, activeImages, fullBookNumbers, bookOverride = {}) {
  const seriesKey = deriveSeriesKey(replacement.currentImagePath, replacement.type);
  const candidates = [];
  candidates.push(...(bookOverride.anchorPaths || []));
  if (bookOverride.useBookCover) {
    const coverPath = `${path.posix.dirname(replacement.currentImagePath)}/cover.webp`;
    if (fs.existsSync(publicAbsolute(coverPath))) candidates.push(coverPath);
  }
  candidates.push(...profile.anchorPaths);

  const sameBook = activeImages
    .filter(image => image.bookNumber === replacement.bookNumber)
    .filter(image => image.pageNumber !== replacement.pageNumber)
    .filter(image => image.reviewStatus === "installed-replacement" || image.reviewStatus === "pass")
    .sort((left, right) => Math.abs(left.pageNumber - replacement.pageNumber) - Math.abs(right.pageNumber - replacement.pageNumber));
  candidates.push(...sameBook.map(image => image.imagePath));

  const sameSeries = activeImages
    .filter(image => deriveSeriesKey(image.imagePath, image.type) === seriesKey)
    .filter(image => image.imagePath !== replacement.currentImagePath)
    .filter(image => image.reviewStatus === "installed-replacement" || image.reviewStatus === "pass")
    .sort((left, right) => Math.abs(left.bookNumber - replacement.bookNumber) - Math.abs(right.bookNumber - replacement.bookNumber));
  candidates.push(...sameSeries.map(image => image.imagePath));

  if (!fullBookNumbers.has(replacement.bookNumber)) candidates.push(replacement.currentImagePath);

  return [...new Set(candidates)]
    .filter(candidate => fs.existsSync(publicAbsolute(candidate)))
    .slice(0, Number(bookOverride.maxReferences ?? profile.maxReferences));
}

function promptFor(replacement, profile, references, bookOverride = {}) {
  const referenceDirection = references.length
    ? `Reference images: preserve their approved ${replacement.type === "fiction" ? "series cast and cartoon rendering language" : "factual rendering language"}. Use them for continuity, not as inset panels or collage content.`
    : "No reference image is available; follow the continuity lock and visual direction exactly.";
  return [
    replacement.exactReplacementPrompt,
    `AUTHORITATIVE TARGET FORMAT: ${replacement.outputWidth >= replacement.outputHeight ? "landscape" : "portrait"} canvas, ${replacement.outputWidth} x ${replacement.outputHeight}. This target format overrides any contradictory orientation word in the legacy audit prompt above.`,
    ...(bookOverride.plannerGuidance ? [`AUTHORITATIVE BOOK GUIDANCE: ${bookOverride.plannerGuidance} This book guidance overrides any conflicting generic or legacy audit continuity wording above.`] : []),
    `Series production lock: ${profile.stylePrompt}`,
    ...(bookOverride.characterLock ? [`Book character lock: ${bookOverride.characterLock}`] : []),
    referenceDirection,
    "Return one complete illustration only. This is a review candidate, but composition, anatomy, countability and character identity must still be production-ready.",
    ...(bookOverride.generationExclusions ? [`FINAL AUTHORITATIVE GENERATION EXCLUSIONS: ${bookOverride.generationExclusions} These exclusions override every earlier conflicting instruction and reference-image detail.`] : []),
  ].join("\n");
}

export function syncFactory(db) {
  if (!fs.existsSync(manifestPath) || !fs.existsSync(coveragePath)) {
    execFileSync(process.execPath, [auditBuilderPath], { cwd: repoRoot, stdio: "inherit" });
  }
  const manifest = readJson(manifestPath);
  const coverage = readJson(coveragePath);
  const configuredProfiles = readJson(profilesPath);
  if (!manifest?.replacements || !coverage?.activeImages || !configuredProfiles?.defaults) {
    throw new Error("Guided-reading audit or image-factory profile data is missing or malformed.");
  }

  const activeImages = coverage.activeImages;
  const books = new Map();
  for (const image of activeImages) {
    if (!books.has(image.bookNumber)) books.set(image.bookNumber, []);
    books.get(image.bookNumber).push({ pageNumber: image.pageNumber, pageText: image.pageText });
  }
  const upsertBook = db.prepare(`
    INSERT INTO books (
      book_number, book_id, title, level, type, series_key, pages_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(book_number) DO UPDATE SET
      book_id = excluded.book_id,
      title = excluded.title,
      level = excluded.level,
      type = excluded.type,
      series_key = excluded.series_key,
      pages_json = excluded.pages_json,
      updated_at = excluded.updated_at
  `);
  const booksSyncedAt = nowIso();
  for (const [bookNumber, pages] of books) {
    const firstPage = activeImages.find(image => image.bookNumber === bookNumber);
    upsertBook.run(
      bookNumber,
      firstPage.bookId,
      firstPage.title,
      firstPage.level,
      firstPage.type,
      deriveSeriesKey(firstPage.imagePath, firstPage.type),
      JSON.stringify(pages.sort((left, right) => left.pageNumber - right.pageNumber)),
      booksSyncedAt
    );
  }
  const bookPageCounts = new Map();
  for (const image of activeImages) bookPageCounts.set(image.bookNumber, (bookPageCounts.get(image.bookNumber) || 0) + 1);
  const replacementPageCounts = new Map();
  for (const replacement of manifest.replacements) {
    replacementPageCounts.set(replacement.bookNumber, (replacementPageCounts.get(replacement.bookNumber) || 0) + 1);
  }
  const fullBookNumbers = new Set(
    [...replacementPageCounts].filter(([bookNumber, count]) => count === bookPageCounts.get(bookNumber)).map(([bookNumber]) => bookNumber)
  );

  const profileMap = new Map();
  for (const replacement of manifest.replacements) {
    const seriesKey = deriveSeriesKey(replacement.currentImagePath, replacement.type);
    if (!profileMap.has(seriesKey)) {
      profileMap.set(seriesKey, profileFor(seriesKey, replacement.type, configuredProfiles, activeImages));
    }
  }

  const upsertProfile = db.prepare(`
    INSERT INTO series_profiles (
      series_key, label, type, style_prompt, anchor_paths_json, input_fidelity, max_references, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(series_key) DO UPDATE SET
      label = excluded.label,
      type = excluded.type,
      style_prompt = excluded.style_prompt,
      anchor_paths_json = excluded.anchor_paths_json,
      input_fidelity = excluded.input_fidelity,
      max_references = excluded.max_references,
      updated_at = excluded.updated_at
  `);
  for (const profile of profileMap.values()) {
    upsertProfile.run(
      profile.seriesKey,
      profile.label,
      profile.type,
      profile.stylePrompt,
      JSON.stringify(profile.anchorPaths),
      profile.inputFidelity,
      profile.maxReferences,
      nowIso()
    );
  }

  db.exec("UPDATE jobs SET active = 0");
  const findJob = db.prepare("SELECT state FROM jobs WHERE source_key = ?");
  const upsertJob = db.prepare(`
    INSERT INTO jobs (
      source_key, active, book_number, book_id, title, level, type, series_key,
      page_number, page_text, priority, issue_types_json, observed_problem,
      continuity_requirements, required_scene, prompt, current_image_path,
      replacement_image_path, target_width, target_height, api_size,
      reference_paths_json, state, created_at, updated_at
    ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_key) DO UPDATE SET
      active = 1,
      book_number = excluded.book_number,
      book_id = excluded.book_id,
      title = excluded.title,
      level = excluded.level,
      type = excluded.type,
      series_key = excluded.series_key,
      page_number = excluded.page_number,
      page_text = excluded.page_text,
      priority = excluded.priority,
      issue_types_json = excluded.issue_types_json,
      observed_problem = excluded.observed_problem,
      continuity_requirements = excluded.continuity_requirements,
      required_scene = excluded.required_scene,
      prompt = excluded.prompt,
      current_image_path = excluded.current_image_path,
      replacement_image_path = excluded.replacement_image_path,
      target_width = excluded.target_width,
      target_height = excluded.target_height,
      api_size = excluded.api_size,
      reference_paths_json = excluded.reference_paths_json,
      state = excluded.state,
      updated_at = excluded.updated_at
  `);

  const syncedAt = nowIso();
  for (const replacement of manifest.replacements) {
    const sourceKey = `${replacement.bookNumber}:${replacement.pageNumber}`;
    const existing = findJob.get(sourceKey);
    const state = replacement.status === "approved-and-installed"
      ? "installed"
      : existing && !["installed", "obsolete"].includes(existing.state)
        ? existing.state
        : "pending";
    const seriesKey = deriveSeriesKey(replacement.currentImagePath, replacement.type);
    const profile = profileMap.get(seriesKey);
    const configuredBookOverride = configuredProfiles.books?.[String(replacement.bookNumber)] || {};
    const configuredSeriesOverride = configuredProfiles.series?.[seriesKey] || {};
    const pageAnchorPaths = configuredBookOverride.pageAnchorPaths?.[String(replacement.pageNumber)];
    const pageMaxReferences = configuredBookOverride.pageMaxReferences?.[String(replacement.pageNumber)];
    const bookOverride = {
      ...configuredBookOverride,
      useBookCover: configuredBookOverride.useBookCover ?? configuredSeriesOverride.useBookCover ?? false,
      anchorPaths: (pageAnchorPaths || configuredBookOverride.anchorPaths || []).filter(anchor => fs.existsSync(publicAbsolute(anchor))),
      maxReferences: pageMaxReferences ?? configuredBookOverride.maxReferences,
    };
    const outputWidth = Number(configuredBookOverride.outputWidth || replacement.outputWidth);
    const outputHeight = Number(configuredBookOverride.outputHeight || replacement.outputHeight);
    const effectiveReplacement = { ...replacement, outputWidth, outputHeight };
    const references = referencesFor(replacement, profile, activeImages, fullBookNumbers, bookOverride);
    upsertJob.run(
      sourceKey,
      replacement.bookNumber,
      replacement.bookId,
      replacement.title,
      replacement.level,
      replacement.type,
      seriesKey,
      replacement.pageNumber,
      replacement.pageText,
      replacement.priority,
      JSON.stringify(replacement.issueTypes),
      replacement.observedProblem,
      replacement.continuityRequirements,
      replacement.requiredScene,
      promptFor(effectiveReplacement, profile, references, bookOverride),
      replacement.currentImagePath,
      replacement.replacementImagePath,
      outputWidth,
      outputHeight,
      apiSizeFor(outputWidth, outputHeight),
      JSON.stringify(references),
      state,
      syncedAt,
      syncedAt
    );
  }
  db.exec("UPDATE jobs SET state = 'obsolete', updated_at = CURRENT_TIMESTAMP WHERE active = 0 AND state != 'installed'");
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('last_sync_at', ?)").run(syncedAt);
  return statusSummary(db);
}

function uniqueBatchId(db) {
  const base = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
  let id = `gr-${base}`;
  let suffix = 1;
  const exists = db.prepare("SELECT 1 FROM batches WHERE id = ?");
  while (exists.get(id)) id = `gr-${base}-${suffix++}`;
  return id;
}

export function createBatch(db, options = {}) {
  const limit = Number(options.limit || 50);
  const quality = options.quality || DEFAULT_QUALITY;
  const model = options.model || DEFAULT_MODEL;
  const concurrency = Number(options.concurrency || DEFAULT_CONCURRENCY);
  const startIntervalMs = Number(options.startIntervalMs || DEFAULT_START_INTERVAL_MS);
  const type = options.type || null;
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new Error("Batch limit must be between 1 and 50.");
  if (!['low', 'medium', 'high'].includes(quality)) throw new Error("Quality must be low, medium, or high.");

  const rows = db.prepare(`
    SELECT * FROM jobs
    WHERE active = 1
      AND state IN ('pending', 'retry', 'error')
      AND (? IS NULL OR type = ?)
    ORDER BY
      CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 ELSE 2 END,
      book_number,
      page_number
  `).all(type, type);
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.book_number)) grouped.set(row.book_number, []);
    grouped.get(row.book_number).push(row);
  }
  const groups = [...grouped.entries()]
    .map(([bookNumber, jobs]) => ({ bookNumber, jobs, rank: Math.min(...jobs.map(job => priorityRank(job.priority))) }))
    .sort((left, right) => left.rank - right.rank || left.bookNumber - right.bookNumber);
  const jobs = selectWholeBookGroups(groups, limit);
  if (!jobs.length) return null;

  const id = uniqueBatchId(db);
  db.prepare(`
    INSERT INTO batches (
      id, state, model, quality, requested_limit, job_count, concurrency,
      start_interval_ms, created_at
    ) VALUES (?, 'queued', ?, ?, ?, ?, ?, ?, ?)
  `).run(id, model, quality, limit, jobs.length, concurrency, startIntervalMs, nowIso());
  const queueJob = db.prepare("UPDATE jobs SET state = 'queued', batch_id = ?, updated_at = ? WHERE id = ?");
  const queuedAt = nowIso();
  for (const job of jobs) queueJob.run(id, queuedAt, job.id);
  return batchDetails(db, id);
}

export function batchDetails(db, batchId) {
  const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(batchId);
  if (!batch) return null;
  const jobs = db.prepare("SELECT * FROM jobs WHERE batch_id = ? ORDER BY book_number, page_number").all(batchId);
  return { ...batch, jobs };
}

export function latestBatchId(db) {
  return db.prepare("SELECT id FROM batches ORDER BY created_at DESC LIMIT 1").get()?.id || null;
}

function plannerPayload(db, bookNumber, jobs) {
  const book = db.prepare("SELECT * FROM books WHERE book_number = ?").get(bookNumber);
  if (!book) throw new Error(`Book context is missing for book ${bookNumber}. Run sync first.`);
  const profile = db.prepare("SELECT * FROM series_profiles WHERE series_key = ?").get(book.series_key);
  const configuredProfiles = readJson(profilesPath, {});
  const bookProfile = configuredProfiles.books?.[String(bookNumber)] || {};
  return {
    book: {
      bookNumber: book.book_number,
      bookId: book.book_id,
      title: book.title,
      level: book.level,
      type: book.type,
      seriesKey: book.series_key,
      completeStory: parseJson(book.pages_json, []),
    },
    productionLock: profile?.style_prompt || "",
    bookGuidance: bookProfile.plannerGuidance || "",
    characterLock: bookProfile.characterLock || "",
    pagesToPlan: jobs.map(job => ({
      pageNumber: job.page_number,
      pageText: job.page_text,
      observedProblem: job.observed_problem,
      continuityRequirements: job.continuity_requirements,
      requiredScene: job.required_scene,
      issueTypes: parseJson(job.issue_types_json, []),
    })),
  };
}

function plannerInputHash(payload, plannerModel) {
  return crypto.createHash("sha256").update(JSON.stringify({ plannerModel, payload })).digest("hex");
}

const scenePlanSchema = {
  type: "object",
  properties: {
    plans: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pageNumber: { type: "integer" },
          visualMoment: { type: "string" },
          subjects: { type: "array", items: { type: "string" } },
          requiredVisible: { type: "array", items: { type: "string" } },
          composition: { type: "string" },
          continuityDetails: { type: "array", items: { type: "string" } },
          forbidden: { type: "array", items: { type: "string" } },
        },
        required: [
          "pageNumber",
          "visualMoment",
          "subjects",
          "requiredVisible",
          "composition",
          "continuityDetails",
          "forbidden",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["plans"],
  additionalProperties: false,
};

export function lintScenePlan(plan) {
  const positiveFields = [
    plan.visualMoment,
    ...(plan.subjects || []),
    ...(plan.requiredVisible || []),
    plan.composition,
    ...(plan.continuityDetails || []),
  ].filter(Boolean);
  const issues = [];
  for (const field of positiveFields) {
    const clauses = String(field).split(/[;.]/).map(value => value.trim()).filter(Boolean);
    for (const clause of clauses) {
      const negativeTypography = /^(?:no|without|do not|never|avoid)\b/i.test(clause)
        || /\b(?:blank|abstract|unlabelled|unlabeled|unreadable|illegible|non[-\u2010-\u2015 ]?readable|non[-\u2010-\u2015 ]?letter|no visible|no legible)\b/i.test(clause)
        || /\bnot\s+(?:visibly\s+)?(?:labelled|labeled)\b/i.test(clause)
        || /\b(?:no|without)\b.{0,80}\b(?:labels?|labelled|labeled|title|caption)\b/i.test(clause)
        || /\bsubstitutes?\s+for\s+(?:a\s+)?(?:labelled|labeled)\b/i.test(clause)
        || /\bno\s+(?:visible\s+)?(?:letters?|words?|text|writing)\b/i.test(clause);
      const requestsTypography = /\blegible\b/i.test(clause)
        || /\b(?:label(?:led|ed)?|title|caption)\b/i.test(clause);
      const describesVisualIdentification = /\blabel(?:led|ed)?\b.{0,50}\bby (?:posture|position|appearance|context|action)\b/i.test(clause);
      const requestsLabelShape = /\b(?:abstract|blank|non[-\u2010-\u2015 ]?readable)\s+label\s+shape\b/i.test(clause);
      if ((requestsTypography && !negativeTypography && !describesVisualIdentification) || requestsLabelShape) issues.push(`visible typography requested: ${clause}`);

      const unsafeSocksAction = /\bSocks\b(?:\W+\w+){0,6}\W+(?:sits?|sitting|perches?|perching|stands?|standing|lies?|lying|is)(?:\W+\w+){0,4}\W+on\s+(?:a |an |the |his |her |Aiden['’]s )?(?:high |low )?(?:shoulder|shelf|table|counter|work surface)\b/i.test(clause)
        || /\bSocks\b(?:\W+\w+){0,8}\W+(?:hold(?:s|ing)?|carr(?:y|ies|ying)|touch(?:es|ing)?|nudg(?:es|ing)?)\b/i.test(clause);
      const negativeSocksDirection = /\bSocks\b.{0,80}\b(?:not|never|absent)\b/i.test(clause)
        || /\b(?:no|without)\b.{0,80}\bSocks\b/i.test(clause);
      if (unsafeSocksAction && !negativeSocksDirection) issues.push(`unsafe domestic-pet staging: ${clause}`);
    }
  }
  const combined = positiveFields.join("; ");
  const mentionsWaterLog = /\b(?:fallen tree|log)\b/i.test(combined) && /\b(?:river|water|stream)\b/i.test(combined);
  const stagesCrossing = /\b(?:cross(?:es|ed|ing)?|one foot|walk(?:s|ed|ing)? (?:along|on)|step(?:s|ped|ping)? (?:onto|on)|follow(?:s|ed|ing)?)\b/i.test(combined);
  const marksLogUnused = /\b(?:unused|unoccupied|no one (?:is )?on|nobody (?:is )?on|not used for crossing)\b/i.test(combined);
  if (mentionsWaterLog && stagesCrossing && !marksLogUnused) issues.push("unsafe water crossing staged on a fallen tree or log");
  return [...new Set(issues)];
}

function validatePlans(plans, jobs) {
  const expected = [...jobs].map(job => job.page_number).sort((left, right) => left - right);
  const received = plans.map(plan => plan.pageNumber).sort((left, right) => left - right);
  if (expected.length !== received.length || expected.some((page, index) => page !== received[index])) {
    throw new Error(`Planner returned pages [${received.join(", ")}] but expected [${expected.join(", ")}].`);
  }
  for (const plan of plans) {
    if (!plan.visualMoment.trim() || !plan.composition.trim() || !plan.requiredVisible.length) {
      throw new Error(`Planner returned an incomplete shot plan for page ${plan.pageNumber}.`);
    }
    const issues = lintScenePlan(plan);
    if (issues.length) throw new Error(`Planner shot plan for page ${plan.pageNumber} failed lint: ${issues.join(" | ")}`);
  }
}

export function buildPlannedPrompt(job) {
  const plan = parseJson(job.scene_plan_json, null);
  if (!plan) return job.prompt;
  return [
    "AUTHORITATIVE PRODUCTION SHOT PLAN:",
    `Depict this single visual moment: ${plan.visualMoment}`,
    `Subjects and exact counts: ${plan.subjects.join("; ") || "Only subjects explicitly required by the scene."}`,
    `Must be visibly clear: ${plan.requiredVisible.join("; ")}`,
    `Camera and staging: ${plan.composition}`,
    `Continuity details: ${plan.continuityDetails.join("; ") || "Follow the series references exactly."}`,
    `Do not depict: ${plan.forbidden.join("; ") || "Anything outside this shot plan."}`,
    "The shot plan resolves the prose into one drawable instant. Where broad source wording is ambiguous, follow this staging and the safety/continuity lock.",
    "",
    job.prompt,
  ].join("\n");
}

export async function planBatch(db, batchId, options = {}) {
  const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(batchId);
  if (!batch) throw new Error(`Unknown batch: ${batchId}`);
  const apiKey = loadApiKey();
  if (!apiKey) throw new Error("No OPENAI_API_KEY is available to the image factory.");
  const plannerModel = options.model || DEFAULT_PLANNER_MODEL;
  const client = new OpenAI({ apiKey, maxRetries: 0, timeout: 180_000 });
  const allJobs = db.prepare(`
    SELECT * FROM jobs WHERE batch_id = ? AND active = 1
    ORDER BY book_number, page_number
  `).all(batchId);
  const shotPlanOverrides = readJson(shotPlanOverridesPath, {});
  const grouped = new Map();
  for (const job of allJobs) {
    if (!grouped.has(job.book_number)) grouped.set(job.book_number, []);
    grouped.get(job.book_number).push(job);
  }
  let groups = [...grouped.entries()];
  const selectedBook = Number(options.bookNumber || 0);
  if (selectedBook > 0) groups = groups.filter(([bookNumber]) => bookNumber === selectedBook);
  const maximumBooks = Number(options.maxBooks || 0);
  if (maximumBooks > 0) groups = groups.slice(0, maximumBooks);
  const results = [];

  for (const [bookNumber, jobs] of groups) {
    const payload = plannerPayload(db, bookNumber, jobs);
    const inputHash = plannerInputHash(payload, plannerModel);
    const current = jobs.every(job => job.scene_plan_json && job.plan_input_hash === inputHash);
    if (current && !options.force) {
      const existingPlans = jobs.map(job => shotPlanOverrides[job.source_key] || parseJson(job.scene_plan_json, null));
      validatePlans(existingPlans, jobs);
      const overriddenAt = nowIso();
      const updateOverride = db.prepare("UPDATE jobs SET scene_plan_json = ?, planner_model = ?, planned_at = ?, updated_at = ? WHERE id = ?");
      for (const plan of existingPlans) {
        const job = jobs.find(candidate => candidate.page_number === plan.pageNumber);
        if (shotPlanOverrides[job.source_key]) {
          updateOverride.run(JSON.stringify(plan), `${plannerModel}+curated-override`, overriddenAt, overriddenAt, job.id);
        }
      }
      results.push({ bookNumber, pages: jobs.length, skipped: true });
      options.onProgress?.({ kind: "plan-skip", bookNumber, pages: jobs.length });
      continue;
    }
    options.onProgress?.({ kind: "plan-start", bookNumber, title: payload.book.title, pages: jobs.length });
    const response = await withRetries(() => client.responses.create({
      model: plannerModel,
      store: false,
      instructions: [
        "You are the shot planner for a premium guided-reading picture-book production line for children aged 5-8.",
        "Read the entire book sequence before planning. Return one concise, concrete, drawable shot per requested page.",
        "Select the clearest single instant that proves the reader text. Never merely repeat or paraphrase the sentence.",
        "State exact character and object counts. Make absent, empty, missing, comparative, positional and safety-critical facts visually unambiguous.",
        "Use continuity requirements and production locks to safely adapt conflicting source actions while preserving the story meaning.",
        "Obey bookGuidance and characterLock exactly when supplied. They are authoritative book-specific resolutions for cast, story action, safety, props, and continuity, and override generic assumptions.",
        "Never request visible words, letters, numerals, labels, title lettering, captions, signs, or readable writing, even when the source mentions a poster, notebook, chart, certificate, map, or display board. Do not mention or depict label shapes at all; a safe closed jar must be completely unlabelled. Use blank pages or abstract non-letter shapes instead.",
        "Do not use the word legible in a plan. Describe permitted non-text symbols as large, clean and clearly visible instead.",
        "Treat Socks as a small domestic terrier. He must stay on the floor or ground, never on a person's shoulder, shelf, table, counter, or work surface, and he must never hold, carry, touch, or move a jar, chemical, tool, or unsafe prop. Depict a safe before/after moment when old source wording conflicts.",
        "Children and pets must not perform hazardous climbs, cross water on logs, run outdoors without shoes, or handle experimental materials without calm adult supervision and suitable protection.",
        "Never add collage panels, duplicate characters, decorative faces, or unrequested subjects.",
        "The output will become authoritative image-model staging, so be literal, spatially precise, and economical.",
      ].join(" "),
      input: JSON.stringify(payload),
      max_output_tokens: 12_000,
      text: {
        format: {
          type: "json_schema",
          name: "guided_reading_shot_plans",
          description: "Exact one-shot illustration plans for the requested guided-reading pages.",
          strict: true,
          schema: scenePlanSchema,
        },
      },
    }));
    const parsed = JSON.parse(response.output_text);
    parsed.plans = parsed.plans.map(plan => {
      const job = jobs.find(candidate => candidate.page_number === plan.pageNumber);
      return shotPlanOverrides[job.source_key] || plan;
    });
    validatePlans(parsed.plans, jobs);
    const plannedAt = nowIso();
    const update = db.prepare(`
      UPDATE jobs SET scene_plan_json = ?, plan_input_hash = ?, planner_model = ?, planned_at = ?, updated_at = ?
      WHERE id = ?
    `);
    for (const plan of parsed.plans) {
      const job = jobs.find(candidate => candidate.page_number === plan.pageNumber);
      const planModel = shotPlanOverrides[job.source_key] ? `${plannerModel}+curated-override` : plannerModel;
      update.run(JSON.stringify(plan), inputHash, planModel, plannedAt, plannedAt, job.id);
    }
    results.push({ bookNumber, pages: jobs.length, skipped: false });
    options.onProgress?.({ kind: "plan-complete", bookNumber, pages: jobs.length });
  }
  return { batchId, plannerModel, results };
}

function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function createStartGate(intervalMs) {
  let queue = Promise.resolve();
  let nextStartAt = 0;
  return async function waitForStart() {
    const previous = queue;
    let release;
    queue = new Promise(resolve => { release = resolve; });
    await previous;
    const delay = Math.max(0, nextStartAt - Date.now());
    if (delay) await sleep(delay);
    nextStartAt = Date.now() + intervalMs;
    release();
  };
}

async function withRetries(operation, maximumAttempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maximumAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      const status = Number(error?.status || 0);
      const retryable = status === 408 || status === 409 || status === 429 || status >= 500;
      if (!retryable || attempt === maximumAttempts) break;
      await sleep(15_000 * attempt);
    }
  }
  throw lastError;
}

function candidateRelativePath(batchId, job) {
  return path.join(
    ".artifacts",
    "guided-reading-image-factory",
    "batches",
    batchId,
    `book-${String(job.book_number).padStart(3, "0")}-page-${String(job.page_number).padStart(3, "0")}.webp`
  );
}

function differenceHash(raw, width, height) {
  let bits = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width - 1; x++) {
      const left = raw[y * width + x];
      const right = raw[y * width + x + 1];
      bits += left > right ? "1" : "0";
    }
  }
  return BigInt(`0b${bits}`).toString(16).padStart(16, "0");
}

function hammingDistance(left, right) {
  let value = BigInt(`0x${left}`) ^ BigInt(`0x${right}`);
  let count = 0;
  while (value) {
    count += Number(value & 1n);
    value >>= 1n;
  }
  return count;
}

async function technicalQa(db, batchId, job, candidatePath) {
  const metadata = await sharp(candidatePath).metadata();
  const stats = await sharp(candidatePath).stats();
  const { data, info } = await sharp(candidatePath).greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  const hash = differenceHash(data, info.width, info.height);
  const ratio = metadata.width / metadata.height;
  const expectedRatio = job.target_width / job.target_height;
  const checks = {
    readable: Boolean(metadata.width && metadata.height),
    format: metadata.format === "webp",
    orientation: orientationMatchesTarget(metadata.width, metadata.height, job.target_width, job.target_height),
    aspectRatio: Math.abs(ratio - expectedRatio) <= 0.035,
    entropy: Number(stats.entropy || 0) >= 3,
    nonBlank: stats.channels.some(channel => channel.stdev >= 8),
  };
  const possibleDuplicates = db.prepare(`
    SELECT id, candidate_hash FROM jobs
    WHERE batch_id = ? AND candidate_hash IS NOT NULL AND id != ?
  `).all(batchId, job.id).filter(row => hammingDistance(hash, row.candidate_hash) <= 3).map(row => row.id);
  checks.uniqueWithinBatch = possibleDuplicates.length === 0;
  return {
    status: Object.values(checks).every(Boolean) ? "pass" : "fail",
    hash,
    details: {
      checks,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      entropy: Number((stats.entropy || 0).toFixed(3)),
      possibleDuplicateJobIds: possibleDuplicates,
    },
  };
}

async function generateOne(db, client, batch, job, waitForStart, onProgress) {
  const profile = db.prepare("SELECT * FROM series_profiles WHERE series_key = ?").get(job.series_key);
  const references = parseJson(job.reference_paths_json, []).map(publicAbsolute).filter(fs.existsSync);
  const relativeOutput = candidateRelativePath(batch.id, job);
  const outputPath = projectAbsolute(relativeOutput);
  ensureDirectory(path.dirname(outputPath));
  const startedAt = nowIso();
  const effectivePrompt = buildPlannedPrompt(job);
  db.prepare(`
    UPDATE jobs SET state = 'generating', attempt_count = attempt_count + 1,
      last_error = NULL, updated_at = ? WHERE id = ?
  `).run(startedAt, job.id);
  const attempt = db.prepare(`
    INSERT INTO attempts (
      job_id, batch_id, model, quality, api_size, prompt,
      reference_paths_json, state, started_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'generating', ?)
  `).run(job.id, batch.id, batch.model, batch.quality, job.api_size, effectivePrompt, job.reference_paths_json, startedAt);
  onProgress?.({ kind: "start", job });

  try {
    await waitForStart();
    const response = await withRetries(async () => {
      if (references.length) {
        return client.images.edit({
          model: batch.model,
          image: await Promise.all(references.map(typedImageUpload)),
          prompt: effectivePrompt,
          size: job.api_size,
          quality: batch.quality,
          ...(!batch.model.startsWith("gpt-image-2") ? { input_fidelity: profile?.input_fidelity || "low" } : {}),
          output_format: "webp",
          output_compression: 88,
          background: "opaque",
          n: 1,
        });
      }
      return client.images.generate({
        model: batch.model,
        prompt: effectivePrompt,
        size: job.api_size,
        quality: batch.quality,
        output_format: "webp",
        output_compression: 88,
        background: "opaque",
        n: 1,
      });
    });
    const encoded = response?.data?.[0]?.b64_json;
    if (!encoded) throw new Error("The image API returned no image data.");
    const buffer = Buffer.from(encoded, "base64");
    const temporaryPath = `${outputPath}.partial`;
    fs.writeFileSync(temporaryPath, buffer);
    fs.renameSync(temporaryPath, outputPath);
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const qa = await technicalQa(db, batch.id, job, outputPath);
    const completedAt = nowIso();
    db.prepare(`
      UPDATE jobs SET state = 'generated', candidate_path = ?, candidate_sha256 = ?,
        candidate_hash = ?, qa_status = ?, qa_json = ?, updated_at = ? WHERE id = ?
    `).run(relativeOutput, sha256, qa.hash, qa.status, JSON.stringify(qa.details), completedAt, job.id);
    db.prepare(`
      UPDATE attempts SET state = 'generated', output_path = ?, qa_json = ?, completed_at = ? WHERE id = ?
    `).run(relativeOutput, JSON.stringify(qa.details), completedAt, attempt.lastInsertRowid);
    onProgress?.({ kind: "complete", job, qa: qa.status, outputPath: relativeOutput });
    return { ok: true, jobId: job.id, qa: qa.status };
  } catch (error) {
    const message = error?.message || String(error);
    const failedAt = nowIso();
    db.prepare("UPDATE jobs SET state = 'error', last_error = ?, updated_at = ? WHERE id = ?").run(message, failedAt, job.id);
    db.prepare("UPDATE attempts SET state = 'error', error = ?, completed_at = ? WHERE id = ?").run(message, failedAt, attempt.lastInsertRowid);
    onProgress?.({ kind: "error", job, error: message });
    return { ok: false, jobId: job.id, error: message };
  }
}

export async function generateBatch(db, batchId, options = {}) {
  const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(batchId);
  if (!batch) throw new Error(`Unknown batch: ${batchId}`);
  const apiKey = loadApiKey();
  if (!apiKey) throw new Error("No OPENAI_API_KEY is available to the image factory.");
  const client = new OpenAI({ apiKey, maxRetries: 0, timeout: 600_000 });
  let jobs = db.prepare(`
    SELECT * FROM jobs WHERE batch_id = ? AND state IN ('queued', 'retry', 'error')
    ORDER BY book_number, page_number
  `).all(batchId);
  const maximumJobs = Number(options.maxJobs || 0);
  if (maximumJobs > 0) jobs = jobs.slice(0, maximumJobs);
  if (!jobs.length) return { batch: batchDetails(db, batchId), results: [] };

  const concurrency = Number(options.concurrency || batch.concurrency || DEFAULT_CONCURRENCY);
  const waitForStart = createStartGate(Number(batch.start_interval_ms || DEFAULT_START_INTERVAL_MS));
  db.prepare("UPDATE batches SET state = 'generating', started_at = COALESCE(started_at, ?) WHERE id = ?").run(nowIso(), batchId);
  let cursor = 0;
  const results = [];
  const workers = Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      results.push(await generateOne(db, client, batch, job, waitForStart, options.onProgress));
    }
  });
  await Promise.all(workers);
  const remaining = db.prepare("SELECT COUNT(*) AS count FROM jobs WHERE batch_id = ? AND state IN ('queued', 'retry', 'generating')").get(batchId).count;
  const errors = db.prepare("SELECT COUNT(*) AS count FROM jobs WHERE batch_id = ? AND state = 'error'").get(batchId).count;
  const nextState = remaining ? "generating" : errors ? "needs-attention" : "review-ready";
  const completedAt = nextState === "review-ready" ? nowIso() : null;
  db.prepare("UPDATE batches SET state = ?, completed_at = ? WHERE id = ?").run(nextState, completedAt, batchId);
  const contactSheetPath = await buildContactSheet(db, batchId);
  return { batch: batchDetails(db, batchId), results, contactSheetPath };
}

function svgEscape(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export async function buildContactSheet(db, batchId) {
  const jobs = db.prepare(`
    SELECT * FROM jobs WHERE batch_id = ? AND candidate_path IS NOT NULL
    ORDER BY book_number, page_number
  `).all(batchId);
  if (!jobs.length) return null;
  const columns = 4;
  const tileWidth = 360;
  const imageHeight = 203;
  const labelHeight = 34;
  const gap = 12;
  const tileHeight = imageHeight + labelHeight;
  const rows = Math.ceil(jobs.length / columns);
  const width = columns * tileWidth + (columns + 1) * gap;
  const height = rows * tileHeight + (rows + 1) * gap;
  const composites = [];
  for (let index = 0; index < jobs.length; index++) {
    const job = jobs[index];
    const candidate = projectAbsolute(job.candidate_path);
    const image = await sharp(candidate).resize(tileWidth, imageHeight, { fit: "cover", position: "attention" }).jpeg({ quality: 82 }).toBuffer();
    const border = job.qa_status === "pass" ? "#2f7d50" : "#b64c43";
    const label = Buffer.from(`<svg width="${tileWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#171a1f"/>
      <rect width="5" height="100%" fill="${border}"/>
      <text x="14" y="22" fill="#f4f3ef" font-family="Arial, sans-serif" font-size="15">Book ${job.book_number} / Page ${job.page_number} / ${svgEscape(job.qa_status || "unchecked")}</text>
    </svg>`);
    const tile = await sharp({ create: { width: tileWidth, height: tileHeight, channels: 3, background: "#171a1f" } })
      .composite([{ input: image, top: 0, left: 0 }, { input: label, top: imageHeight, left: 0 }])
      .jpeg({ quality: 86 })
      .toBuffer();
    composites.push({
      input: tile,
      left: gap + (index % columns) * (tileWidth + gap),
      top: gap + Math.floor(index / columns) * (tileHeight + gap),
    });
  }
  const relativeOutput = path.join(".artifacts", "guided-reading-image-factory", "batches", batchId, "contact-sheet.jpg");
  const outputPath = projectAbsolute(relativeOutput);
  ensureDirectory(path.dirname(outputPath));
  await sharp({ create: { width, height, channels: 3, background: "#e7e4dd" } }).composite(composites).jpeg({ quality: 88 }).toFile(outputPath);
  db.prepare("UPDATE batches SET contact_sheet_path = ? WHERE id = ?").run(relativeOutput, batchId);
  return outputPath;
}

export async function recheckBatchQa(db, batchId) {
  const batch = db.prepare("SELECT id FROM batches WHERE id = ?").get(batchId);
  if (!batch) throw new Error(`Unknown batch: ${batchId}`);
  const jobs = db.prepare(`
    SELECT * FROM jobs
    WHERE batch_id = ? AND candidate_path IS NOT NULL
    ORDER BY book_number, page_number
  `).all(batchId);
  const update = db.prepare(`
    UPDATE jobs SET candidate_sha256 = ?, candidate_hash = ?, qa_status = ?, qa_json = ?, updated_at = ?
    WHERE id = ?
  `);
  const results = [];
  for (const job of jobs) {
    const candidatePath = projectAbsolute(job.candidate_path);
    if (!fs.existsSync(candidatePath)) {
      results.push({ jobId: job.id, status: "missing", path: candidatePath });
      continue;
    }
    const sha256 = crypto.createHash("sha256").update(fs.readFileSync(candidatePath)).digest("hex");
    const qa = await technicalQa(db, batchId, job, candidatePath);
    update.run(sha256, qa.hash, qa.status, JSON.stringify(qa.details), nowIso(), job.id);
    results.push({ jobId: job.id, status: qa.status, details: qa.details });
  }
  return {
    batch: batchId,
    checked: results.length,
    passed: results.filter(result => result.status === "pass").length,
    failed: results.filter(result => result.status === "fail").length,
    missing: results.filter(result => result.status === "missing").length,
    contactSheetPath: await buildContactSheet(db, batchId),
    results,
  };
}

export function setReviewDecision(db, jobId, decision, notes = "") {
  const allowed = new Set(["approved", "rejected", "retry"]);
  if (!allowed.has(decision)) throw new Error(`Unsupported review decision: ${decision}`);
  const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);
  if (!job) throw new Error(`Unknown job: ${jobId}`);
  if (decision === "approved" && !job.candidate_path) throw new Error("A job cannot be approved without a generated candidate.");
  db.prepare("UPDATE jobs SET state = ?, review_notes = ?, updated_at = ? WHERE id = ?").run(decision, notes, nowIso(), jobId);
  return db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);
}

export async function installApproved(db, batchId) {
  const jobs = db.prepare(`
    SELECT * FROM jobs WHERE batch_id = ? AND state = 'approved'
    ORDER BY book_number, page_number
  `).all(batchId);
  if (!jobs.length) return { installed: 0, jobs: [] };
  const installed = readJson(installedPath, {});
  const postInstallAudit = readJson(postInstallAuditPath, { findings: [], resolved: {} });
  const resolved = postInstallAudit.resolved || {};
  const completed = [];
  for (const job of jobs) {
    const sourcePath = projectAbsolute(job.candidate_path);
    if (!fs.existsSync(sourcePath)) throw new Error(`Missing candidate for job ${job.id}: ${sourcePath}`);
    const targetPath = publicAbsolute(job.replacement_image_path);
    const targetExtension = path.extname(targetPath).toLowerCase();
    const temporaryPath = `${targetPath}.installing${targetExtension}`;
    const expectedFormat = targetExtension === ".png" ? "png" : targetExtension === ".jpg" || targetExtension === ".jpeg" ? "jpeg" : "webp";
    const pipeline = sharp(sourcePath)
      .resize(job.target_width, job.target_height, { fit: "cover", position: "attention" });
    if (expectedFormat === "png") pipeline.png({ compressionLevel: 9, adaptiveFiltering: true });
    else if (expectedFormat === "jpeg") pipeline.jpeg({ quality: 92, mozjpeg: true });
    else pipeline.webp({ quality: 92, effort: 6 });
    await pipeline.toFile(temporaryPath);
    const metadata = await sharp(temporaryPath).metadata();
    if (metadata.format !== expectedFormat || metadata.width !== job.target_width || metadata.height !== job.target_height) {
      fs.unlinkSync(temporaryPath);
      throw new Error(`Candidate failed install validation for book ${job.book_number}, page ${job.page_number}.`);
    }
    fs.renameSync(temporaryPath, targetPath);
    const current = installed[job.book_number];
    if (current !== "all") {
      installed[job.book_number] = [...new Set([...(Array.isArray(current) ? current : []), job.page_number])].sort((left, right) => left - right);
    }
    resolved[String(job.book_number)] = [...new Set([...(resolved[String(job.book_number)] || []), job.page_number])]
      .sort((left, right) => left - right);
    completed.push(job);
  }
  const sortedInstalled = Object.fromEntries(Object.entries(installed).sort(([left], [right]) => Number(left) - Number(right)));
  writeJson(installedPath, sortedInstalled);
  postInstallAudit.resolved = resolved;
  writeJson(postInstallAuditPath, postInstallAudit);
  const markInstalled = db.prepare("UPDATE jobs SET state = 'installed', updated_at = ? WHERE id = ?");
  const installedAt = nowIso();
  for (const job of completed) markInstalled.run(installedAt, job.id);
  execFileSync(process.execPath, [auditBuilderPath], { cwd: repoRoot, stdio: "inherit" });
  syncFactory(db);
  return {
    installed: completed.length,
    jobs: completed.map(job => ({ id: job.id, bookNumber: job.book_number, pageNumber: job.page_number })),
  };
}

export function statusSummary(db) {
  const states = Object.fromEntries(db.prepare(`
    SELECT state, COUNT(*) AS count FROM jobs WHERE active = 1 GROUP BY state ORDER BY state
  `).all().map(row => [row.state, row.count]));
  const pending = db.prepare(`
    SELECT COUNT(*) AS count FROM jobs
    WHERE active = 1 AND state NOT IN ('installed', 'obsolete')
  `).get().count;
  const byType = Object.fromEntries(db.prepare(`
    SELECT type, COUNT(*) AS count FROM jobs
    WHERE active = 1 AND state NOT IN ('installed', 'obsolete') GROUP BY type
  `).all().map(row => [row.type, row.count]));
  const latestBatch = db.prepare("SELECT * FROM batches ORDER BY created_at DESC LIMIT 1").get() || null;
  return { pending, byType, states, latestBatch };
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function reviewHtml(batch, jobs) {
  const cards = jobs.map(job => {
    const references = parseJson(job.reference_paths_json, []);
    const issues = parseJson(job.issue_types_json, []);
    const qa = parseJson(job.qa_json, {});
    return `<article class="job" data-state="${htmlEscape(job.state)}" id="job-${job.id}">
      <header>
        <div><strong>Book ${job.book_number}, page ${job.page_number}</strong><span>${htmlEscape(job.title)}</span></div>
        <span class="status">${htmlEscape(job.state)}</span>
      </header>
      <div class="comparison">
        <figure><img src="/image/current/${job.id}" alt="Current page"><figcaption>Current</figcaption></figure>
        <figure><img src="/image/candidate/${job.id}" alt="Generated candidate"><figcaption>Candidate</figcaption></figure>
      </div>
      <p class="reader">${htmlEscape(job.page_text)}</p>
      <div class="meta"><span>${htmlEscape(job.type)}</span><span>${htmlEscape(job.priority)}</span><span>QA ${htmlEscape(job.qa_status || "pending")}</span><span>${references.length} refs</span></div>
      <details><summary>Production brief</summary><p>${htmlEscape(job.required_scene)}</p><p>${htmlEscape(job.continuity_requirements)}</p><p>${htmlEscape(issues.join("; "))}</p><pre>${htmlEscape(JSON.stringify(qa, null, 2))}</pre></details>
      <div class="actions">
        <button class="approve" data-decision="approved" data-id="${job.id}">Approve</button>
        <button data-decision="retry" data-id="${job.id}">Retry</button>
        <button class="reject" data-decision="rejected" data-id="${job.id}">Reject</button>
      </div>
    </article>`;
  }).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Guided Reading Image Review</title>
  <style>
    :root{color-scheme:light;background:#f1f0eb;color:#181b20;font-family:Inter,ui-sans-serif,system-ui,sans-serif}*{box-sizing:border-box}body{margin:0}nav{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:16px;padding:12px 22px;background:#181b20;color:#fff;border-bottom:1px solid #343941}nav strong{font-size:16px}nav span{color:#bfc5cd;font-size:13px}nav button{margin-left:auto}main{max-width:1500px;margin:0 auto;padding:22px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.job{background:#fff;border:1px solid #d6d3cb;border-radius:6px;overflow:hidden}.job header{display:flex;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #e4e1da}.job header div{display:flex;flex-direction:column;gap:3px}.job header span{font-size:12px;color:#676b72}.status{align-self:flex-start;padding:4px 7px;background:#eceae4;border-radius:4px;color:#34383e!important}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#d6d3cb}.comparison figure{margin:0;background:#171a1f;position:relative;aspect-ratio:16/9;overflow:hidden}.comparison img{width:100%;height:100%;object-fit:cover;display:block}.comparison figcaption{position:absolute;left:8px;bottom:8px;padding:4px 7px;background:rgba(20,22,26,.84);color:#fff;font-size:11px;border-radius:3px}.reader{margin:14px 16px 10px;font:600 16px/1.45 Georgia,serif}.meta{display:flex;gap:7px;flex-wrap:wrap;margin:0 16px 12px}.meta span{font-size:11px;background:#efeee9;padding:4px 6px;border-radius:3px}details{margin:0 16px 14px;border-top:1px solid #e4e1da;padding-top:9px}summary{cursor:pointer;font-size:12px;color:#565b63}details p,pre{font-size:12px;line-height:1.45;white-space:pre-wrap}.actions{display:flex;gap:8px;padding:12px 16px;background:#f7f6f2;border-top:1px solid #e4e1da}button{border:1px solid #aeb2b7;border-radius:4px;background:#fff;padding:8px 12px;font-weight:650;cursor:pointer}button:hover{background:#efeee9}.approve{border-color:#2f7d50;background:#2f7d50;color:white}.reject{color:#a33b35}.job[data-state=approved]{border-color:#2f7d50}.job[data-state=rejected]{opacity:.65}@media(max-width:900px){main{grid-template-columns:1fr;padding:12px}.comparison{grid-template-columns:1fr}.comparison figure{aspect-ratio:16/9}}
  </style></head><body><nav><strong>${htmlEscape(batch.id)}</strong><span>${jobs.length} candidates</span><span>${htmlEscape(batch.model)} / ${htmlEscape(batch.quality)}</span><button id="install">Install approved</button></nav><main>${cards}</main>
  <script>
    document.addEventListener('click',async event=>{const button=event.target.closest('[data-decision]');if(!button)return;button.disabled=true;const response=await fetch('/api/jobs/'+button.dataset.id+'/review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({decision:button.dataset.decision})});if(response.ok){const card=button.closest('.job');card.dataset.state=button.dataset.decision;card.querySelector('.status').textContent=button.dataset.decision}button.disabled=false});
    document.querySelector('#install').addEventListener('click',async event=>{event.currentTarget.disabled=true;event.currentTarget.textContent='Installing';const response=await fetch('/api/batches/${htmlEscape(batch.id)}/install',{method:'POST'});const result=await response.json();event.currentTarget.textContent=response.ok?'Installed '+result.installed:'Install failed';if(response.ok)setTimeout(()=>location.reload(),900);else event.currentTarget.disabled=false});
  </script></body></html>`;
}

export async function startReviewServer(db, options = {}) {
  const express = (await import("express")).default;
  const batchId = options.batchId || latestBatchId(db);
  if (!batchId) throw new Error("No image-factory batch exists yet.");
  const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(batchId);
  if (!batch) throw new Error(`Unknown batch: ${batchId}`);
  const app = express();
  app.use(express.json({ limit: "32kb" }));
  app.get("/", (_request, response) => {
    const jobs = db.prepare("SELECT * FROM jobs WHERE batch_id = ? ORDER BY book_number, page_number").all(batchId);
    response.type("html").send(reviewHtml(batch, jobs));
  });
  app.get("/image/current/:id", (request, response) => {
    const job = db.prepare("SELECT current_image_path FROM jobs WHERE id = ? AND batch_id = ?").get(Number(request.params.id), batchId);
    if (!job) return response.sendStatus(404);
    response.sendFile(publicAbsolute(job.current_image_path));
  });
  app.get("/image/candidate/:id", (request, response) => {
    const job = db.prepare("SELECT candidate_path FROM jobs WHERE id = ? AND batch_id = ?").get(Number(request.params.id), batchId);
    if (!job?.candidate_path) return response.sendStatus(404);
    response.sendFile(projectAbsolute(job.candidate_path));
  });
  app.post("/api/jobs/:id/review", (request, response) => {
    try {
      response.json(setReviewDecision(db, Number(request.params.id), request.body?.decision, request.body?.notes || ""));
    } catch (error) {
      response.status(400).json({ error: error.message });
    }
  });
  app.post("/api/batches/:id/install", async (request, response) => {
    try {
      response.json(await installApproved(db, request.params.id));
    } catch (error) {
      response.status(500).json({ error: error.message });
    }
  });
  const port = Number(options.port || 5198);
  const host = options.host || "127.0.0.1";
  return new Promise((resolve, reject) => {
    const server = app.listen(port, host, () => resolve({ server, url: `http://${host}:${port}`, batchId }));
    server.on("error", reject);
  });
}
